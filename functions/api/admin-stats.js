/**
 * Cloudflare Pages Function - 管理后台统计数据 API
 * 提供搜索日志、工具分析、LLM 性能等统计数据
 */

export async function onRequest(context) {
  const { request, env } = context;

  // OPTIONS 预检
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "overview";

    // 验证 token（简化版）
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "未授权" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const token = authHeader.substring(7);

    // 验证会话
    const sessionStmt = env.PSPDB.prepare(`
      SELECT s.*, u.email
      FROM admin_sessions s
      JOIN admin_users u ON s.user_id = u.id
      WHERE s.session_token = ?1
        AND s.expires_at > datetime('now')
      LIMIT 1
    `);
    const session = await sessionStmt.bind(token).first();

    if (!session) {
      return new Response(JSON.stringify({ error: "会话已过期" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 更新最后活动时间
    const updateStmt = env.PSPDB.prepare('UPDATE admin_sessions SET last_activity = datetime("now") WHERE id = ?1');
    await updateStmt.bind(session.id).run();

    // 根据类型返回不同的统计数据
    let data;

    switch (type) {
      case 'overview':
        data = await getOverviewData(env);
        break;
      case 'searches':
        data = await getSearchLogsData(env);
        break;
      case 'tools':
        data = await getToolsData(env);
        break;
      case 'llm':
        data = await getLLMData(env);
        break;
      default:
        data = await getOverviewData(env);
    }

    // 记录查看操作
    const auditStmt = env.PSPDB.prepare(`
      INSERT INTO admin_audit_logs (user_id, action, resource, ip_address)
      VALUES (?1, ?2, ?3, ?4)
    `);
    await auditStmt.bind(
      session.user_id,
      'view_stats',
      type,
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ 统计 API 错误:', error);

    return new Response(JSON.stringify({
      error: "服务器错误",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

/**
 * 获取总览数据
 */
async function getOverviewData(env) {
  const db = env.PSPDB;

  // 总搜索次数
  const totalSearchesStmt = db.prepare('SELECT COUNT(*) as count FROM search_logs');
  const { count: totalSearches } = await totalSearchesStmt.first();

  // 独立用户数
  const uniqueUsersStmt = db.prepare('SELECT COUNT(DISTINCT user_fingerprint) as count FROM search_logs');
  const { count: uniqueUsers } = await uniqueUsersStmt.first();

  // 缓存命中率
  const cacheStatsStmt = db.prepare(`
    SELECT
      SUM(CASE WHEN from_cache = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as rate
    FROM search_logs
  `);
  const { rate: cacheHitRate } = await cacheStatsStmt.first();

  // 平均响应时间
  const avgDurationStmt = db.prepare('SELECT AVG(total_duration_ms) as avg FROM search_logs');
  const { avg: avgDuration } = await avgDurationStmt.first();

  // 最近7天搜索趋势
  const searchTrendStmt = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as searches
    FROM search_logs
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `);
  const searchTrend = await searchTrendStmt.all();

  // 热门搜索词
  const topQueriesStmt = db.prepare(`
    SELECT
      normalized_query,
      COUNT(*) as count
    FROM search_logs
    GROUP BY normalized_query
    ORDER BY count DESC
    LIMIT 20
  `);
  const topQueries = await topQueriesStmt.all();

  return {
    totalSearches,
    uniqueUsers,
    cacheHitRate: cacheHitRate || 0,
    avgDuration,
    searchTrend,
    topQueries
  };
}

/**
 * 获取搜索日志数据
 */
async function getSearchLogsData(env) {
  const db = env.PSPDB;

  const stmt = db.prepare(`
    SELECT
      created_at,
      original_query,
      search_intent,
      result_count,
      from_cache,
      total_duration_ms,
      user_language
    FROM search_logs
    ORDER BY created_at DESC
    LIMIT 100
  `);

  const logs = await stmt.all();

  return { logs };
}

/**
 * 获取工具分析数据
 */
async function getToolsData(env) {
  const db = env.PSPDB;

  // 热门工具
  const popularToolsStmt = db.prepare(`
    SELECT
      tool_name,
      tool_category,
      COUNT(*) as appearance_count,
      SUM(feedback_up) as total_up,
      SUM(feedback_down) as total_down,
      AVG(position) as avg_position
    FROM search_results
    GROUP BY tool_name, tool_category
    ORDER BY appearance_count DESC
    LIMIT 20
  `);
  const popularTools = await popularToolsStmt.all();

  // 工具类别分布
  const categoryStmt = db.prepare(`
    SELECT
      tool_category as category,
      COUNT(*) as count
    FROM search_results
    WHERE tool_category IS NOT NULL
    GROUP BY tool_category
    ORDER BY count DESC
  `);
  const toolCategories = await categoryStmt.all();

  return {
    popularTools,
    toolCategories
  };
}

/**
 * 获取 LLM 性能数据
 */
async function getLLMData(env) {
  const db = env.PSPDB;

  const stmt = db.prepare(`
    SELECT
      llm_provider,
      llm_model,
      language,
      COUNT(*) as total_calls,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_calls,
      AVG(duration_ms) as avg_duration_ms,
      AVG(prompt_length) as avg_prompt_length,
      AVG(response_length) as avg_response_length,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_calls
    FROM llm_calls
    GROUP BY llm_provider, llm_model, language
    ORDER BY total_calls DESC
  `);

  const llmPerformance = await stmt.all();

  return { llmPerformance };
}
