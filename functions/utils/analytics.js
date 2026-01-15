/**
 * 搜索日志记录工具函数
 * 用于记录搜索行为、LLM 调用和结果分析
 */

/**
 * 生成用户指纹（简化版）
 * 基于 Cloudflare cf 对象和请求头
 */
function generateUserFingerprint(request) {
  const cf = request.cf || {};
  const headers = request.headers || {};

  // 使用 Cloudflare 的数据中心 + IP 前3段 + User-Agent hash
  const raw = `${cf.colo || 'unknown'}-${cf.colo || 'unknown'}-${headers.get('user-agent')?.slice(0, 50) || 'unknown'}`;

  // 简单 hash 函数
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * 提取用户会话信息
 */
function extractUserSession(request) {
  const cf = request.cf || {};
  const headers = request.headers || {};

  return {
    colo: cf.colo || null,
    country: cf.country || null,
    city: cf.city || null,
    user_agent: headers.get('user-agent')?.slice(0, 200) || null,
    referer: headers.get('referer')?.slice(0, 500) || null
  };
}

/**
 * 创建搜索日志
 * @param {D1Database} db - D1 数据库实例
 * @param {Object} params - 日志参数
 * @returns {Promise<number>} - 日志 ID
 */
async function createSearchLog(db, params) {
  const {
    userFingerprint,
    originalQuery,
    normalizedQuery,
    searchIntent,
    searchType = 'search',
    resultCount = 0,
    fromCache = false,
    totalDurationMs = 0,
    language = 'zh'
  } = params;

  const sql = `
    INSERT INTO search_logs (
      user_fingerprint, user_language, original_query, normalized_query,
      search_intent, search_type, result_count, from_cache, total_duration_ms
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
  `;

  const stmt = db.prepare(sql);
  const result = await stmt.bind(
    userFingerprint,
    language,
    originalQuery,
    normalizedQuery,
    searchIntent || null,
    searchType,
    resultCount,
    fromCache ? 1 : 0,
    totalDurationMs
  ).run();

  return result.meta.last_row_id;
}

/**
 * 记录 LLM 调用
 * @param {D1Database} db - D1 数据库实例
 * @param {Object} params - LLM 调用参数
 */
async function recordLLMCall(db, params) {
  const {
    searchLogId,
    language,
    llmProvider,
    llmModel,
    promptTokens = null,
    promptLength = null,
    responseTokens = null,
    responseLength = null,
    durationMs = 0,
    success = true,
    errorMessage = null
  } = params;

  const sql = `
    INSERT INTO llm_calls (
      search_log_id, language, llm_provider, llm_model,
      prompt_tokens, prompt_length, response_tokens, response_length,
      duration_ms, success, error_message
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
  `;

  const stmt = db.prepare(sql);
  await stmt.bind(
    searchLogId,
    language,
    llmProvider,
    llmModel,
    promptTokens,
    promptLength,
    responseTokens,
    responseLength,
    durationMs,
    success ? 1 : 0,
    errorMessage
  ).run();
}

/**
 * 记录搜索结果
 * @param {D1Database} db - D1 数据库实例
 * @param {Object} params - 结果参数
 */
async function recordSearchResults(db, params) {
  const { searchLogId, results, language } = params;

  // 批量插入
  const sql = `
    INSERT INTO search_results (
      search_log_id, result_language, position, tool_name, tool_category, tool_rating
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `;

  const stmt = db.prepare(sql);

  for (let i = 0; i < results.length; i++) {
    const tool = results[i];
    await stmt.bind(
      searchLogId,
      language,
      i + 1, // 位置从 1 开始
      tool.name || '',
      tool.category || null,
      tool.rating || null
    ).run();
  }
}

/**
 * 更新或创建用户会话
 * @param {D1Database} db - D1 数据库实例
 * @param {Object} params - 会话参数
 */
async function upsertUserSession(db, params) {
  const { userFingerprint, sessionInfo } = params;

  // 先尝试更新
  const updateSql = `
    UPDATE user_sessions
    SET
      last_activity = datetime('now'),
      total_searches = total_searches + 1,
      colo = ?1,
      country = ?2,
      city = ?3,
      user_agent = ?4,
      referer = ?5
    WHERE user_fingerprint = ?6
  `;

  const updateStmt = db.prepare(updateSql);
  const updateResult = await updateStmt.bind(
    sessionInfo.colo,
    sessionInfo.country,
    sessionInfo.city,
    sessionInfo.user_agent,
    sessionInfo.referer,
    userFingerprint
  ).run();

  // 如果没有更新任何行，则插入新记录
  if (updateResult.meta.changes === 0) {
    const insertSql = `
      INSERT INTO user_sessions (
        user_fingerprint, session_start, last_activity, total_searches,
        colo, country, city, user_agent, referer
      ) VALUES (?1, datetime('now'), datetime('now'), 1, ?2, ?3, ?4, ?5, ?6)
    `;

    const insertStmt = db.prepare(insertSql);
    await insertStmt.bind(
      userFingerprint,
      sessionInfo.colo,
      sessionInfo.country,
      sessionInfo.city,
      sessionInfo.user_agent,
      sessionInfo.referer
    ).run();
  }
}

/**
 * 记录完整的搜索流程
 * @param {D1Database} db - D1 数据库实例
 * @param {Request} request - HTTP 请求对象
 * @param {Object} searchData - 搜索数据
 * @param {Object} llmData - LLM 调用数据
 */
async function recordCompleteSearchFlow(db, request, searchData, llmData = {}) {
  try {
    // 1. 生成用户指纹和提取会话信息
    const userFingerprint = generateUserFingerprint(request);
    const sessionInfo = extractUserSession(request);

    // 2. 更新用户会话
    await upsertUserSession(db, { userFingerprint, sessionInfo });

    // 3. 创建搜索日志
    const searchLogId = await createSearchLog(db, {
      userFingerprint,
      originalQuery: searchData.originalQuery,
      normalizedQuery: searchData.normalizedQuery,
      searchIntent: searchData.searchIntent,
      searchType: searchData.searchType || 'search',
      resultCount: searchData.resultCount || 0,
      fromCache: searchData.fromCache || false,
      totalDurationMs: searchData.totalDurationMs || 0,
      language: searchData.language || 'zh'
    });

    // 4. 如果不是缓存命中，记录 LLM 调用
    if (!searchData.fromCache && llmData.calls) {
      for (const call of llmData.calls) {
        await recordLLMCall(db, {
          searchLogId,
          language: call.language,
          llmProvider: call.provider,
          llmModel: call.model,
          promptTokens: call.promptTokens,
          promptLength: call.promptLength,
          responseTokens: call.responseTokens,
          responseLength: call.responseLength,
          durationMs: call.durationMs,
          success: call.success !== false,
          errorMessage: call.errorMessage
        });
      }
    }

    // 5. 记录搜索结果
    if (searchData.results && searchData.results.length > 0) {
      await recordSearchResults(db, {
        searchLogId,
        results: searchData.results,
        language: searchData.language || 'zh'
      });
    }

    console.log(`✅ 搜索日志已记录: ${searchData.originalQuery} (ID: ${searchLogId})`);

    return searchLogId;
  } catch (error) {
    console.error('❌ 记录搜索日志失败:', error);
    // 不抛出错误，避免影响用户搜索体验
    return null;
  }
}

// 导出函数
export {
  generateUserFingerprint,
  extractUserSession,
  createSearchLog,
  recordLLMCall,
  recordSearchResults,
  upsertUserSession,
  recordCompleteSearchFlow
};
