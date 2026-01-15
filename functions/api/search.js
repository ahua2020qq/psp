/**
 * Cloudflare Pages Function - 搜索API代理（优化版 + 服务器端缓存）
 * 隐藏API密钥和Prompt模板，解决CORS问题
 *
 * 新增功能：
 * - 服务器端KV缓存（30天过期）
 * - 只有未缓存或缓存过期才调用LLM
 * - 大幅降低TOKEN消耗
 * - 完整的搜索日志记录和分析系统
 */

// ==================== 导入日志工具 ====================
import { recordCompleteSearchFlow } from '../utils/analytics.js';

// ==================== 缓存配置 ====================

const CACHE_TTL = 30 * 24 * 60 * 60; // 30天（秒）
const CACHE_KEY_PREFIX = "tool:";

// ==================== Prompt模板（优化版 - 更短更快） ====================

// 搜索专用Prompt - 精简版（中文）
const SEARCH_PROMPT_ZH = `你是开源软件工具检索助手。返回JSON格式：
{
  "searchIntent": "精确查询",
  "originalQuery": "{userInput}",
  "resultCount": 1,
  "searchTime": "0.3秒",
  "results": [{
    "name": "工具名",
    "category": "分类",
    "coreUsage": "核心用途简述",
    "corePositioning": "定位",
    "installation": {
      "ubuntu": "命令",
      "centos": "命令",
      "docker": "命令",
      "macos": "命令"
    },
    "downloadUrl": {
      "mirror": "国内镜像链接",
      "official": "官方链接"
    },
    "commonIssues": [{"rank": 1, "problem": "问题", "solution": "解决方案"}],
    "commonCommands": [{"command": "命令", "description": "说明"}],
    "rating": 5,
    "applicableScenarios": "场景"
  }],
  "relatedTools": [{"name": "相关工具", "category": "分类", "reason": "理由"}]
}

只输出JSON，不要其他文字。所有字段必须有实际内容。`;

// 搜索专用Prompt - 精简版（英文）
const SEARCH_PROMPT_EN = `You are an open source software tool search assistant. Return JSON format:
{
  "searchIntent": "Precise Query",
  "originalQuery": "{userInput}",
  "resultCount": 1,
  "searchTime": "0.3s",
  "results": [{
    "name": "Tool Name",
    "category": "Category",
    "coreUsage": "Brief core usage description",
    "corePositioning": "Positioning",
    "installation": {
      "ubuntu": "Command",
      "centos": "Command",
      "docker": "Command",
      "macos": "Command"
    },
    "downloadUrl": {
      "mirror": "Mirror Link",
      "official": "Official Link"
    },
    "commonIssues": [{"rank": 1, "problem": "Problem", "solution": "Solution"}],
    "commonCommands": [{"command": "Command", "description": "Description"}],
    "rating": 5,
    "applicableScenarios": "Scenarios"
  }],
  "relatedTools": [{"name": "Related Tool", "category": "Category", "reason": "Reason"}]
}

Output JSON only, no other text. All fields must have actual content.`;

// 兼容：保留旧的 SEARCH_PROMPT（使用中文）
const SEARCH_PROMPT = SEARCH_PROMPT_ZH;

// 推荐专用Prompt - 精简版
const RECOMMEND_PROMPT = `你是开源软件工具推荐助手。返回JSON格式：
{
  "personalizedTop5": [{
    "name": "工具名", "category": "分类", "coreUsage": "用途", "quickStart": "安装命令", "rating": 5, "applicableScenarios": "场景", "updateDate": "日期"
  }],
  "popularTop3": [{
    "name": "工具名", "category": "分类", "coreUsage": "用途", "quickStart": "安装命令", "rating": 5, "applicableScenarios": "场景", "updateDate": "日期"
  }],
  "nicheTop2": [{
    "name": "工具名", "category": "分类", "coreUsage": "用途", "quickStart": "安装命令", "rating": 5, "applicableScenarios": "场景", "painPointDescription": "痛点", "updateDate": "日期"
  }]
}

只输出JSON，推荐5个个性化工具、3个热门工具、2个小众工具。`;

// ==================== API调用函数（优化版） ====================

// 调用火山方舟ARK API
async function callVolcArk(prompt, env) {
  const apiKey = env?.VOLC_ARK_API_KEY;
  if (!apiKey) {
    console.log("⚠️ VOLC_ARK_API_KEY 未配置");
    return null;
  }

  try {
    console.log("🔥 调用火山方舟...");
    const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify({
        model: "doubao-seed-1-8-251228",
        input: [{
          role: "user",
          content: [{ type: "input_text", text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      console.log(`❌ 火山方舟响应错误: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (data.output && data.output[0] && data.output[0].text) {
      try {
        return JSON.parse(data.output[0].text);
      } catch {
        const jsonMatch = data.output[0].text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    }
    console.log("❌ 火山方舟返回格式错误");
    return null;
  } catch (error) {
    console.log("❌ 火山方舟调用失败:", error.message);
    return null;
  }
}

// 调用DeepSeek API
async function callDeepSeek(prompt, env) {
  const apiKey = env?.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.log("⚠️ DEEPSEEK_API_KEY 未配置");
    return null;
  }

  try {
    console.log("🤖 调用DeepSeek...");
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 5000  // 限制输出不超过5K tokens
      })
    });

    if (!response.ok) {
      console.log(`❌ DeepSeek响应错误: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   错误详情: ${errorText}`);
      return null;
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      try {
        return JSON.parse(data.choices[0].message.content);
      } catch (e) {
        console.log("❌ DeepSeek返回的JSON解析失败:", e.message);
        return null;
      }
    }
    console.log("❌ DeepSeek返回格式错误");
    return null;
  } catch (error) {
    console.log("❌ DeepSeek调用失败:", error.message);
    return null;
  }
}

// ==================== KV缓存函数 ====================

/**
 * 从KV获取缓存
 */
async function getFromKV(query, env) {
  try {
    const cacheKey = CACHE_KEY_PREFIX + query.toLowerCase();
    const cached = await env.TOOL_CACHE.get(cacheKey, "json");

    if (cached) {
      // 检查是否为新版双语格式
      const isBilingualFormat = cached.zh && cached.en;

      // 调试日志：检查读取的数据
      console.log(`✅ [LOAD_DEBUG] 服务器缓存命中: ${query}`, {
        hasResults: !!cached.results,
        resultsCount: cached.results?.length,
        hasRelatedTools: !!cached.relatedTools,
        relatedToolsCount: cached.relatedTools?.length,
        isBilingualFormat,
        keys: Object.keys(cached)
      });

      // 如果是旧版单语格式，返回null（视为未命中，强制刷新）
      if (!isBilingualFormat) {
        console.log(`⚠️ 旧版缓存格式，强制刷新: ${query}`);
        return null;
      }

      return cached;
    }

    return null;
  } catch (error) {
    console.log("⚠️ KV读取失败:", error.message);
    return null;
  }
}

/**
 * 保存到KV
 */
async function saveToKV(query, result, env) {
  try {
    const cacheKey = CACHE_KEY_PREFIX + query.toLowerCase();

    // 添加缓存时间戳
    const cachedData = {
      ...result,
      _cachedAt: new Date().toISOString(),
      _cacheVersion: "1.0"
    };

    // 调试日志：检查数据完整性
    console.log(`💾 [SAVE_DEBUG] 准备保存: ${query}`, {
      hasResults: !!cachedData.results,
      resultsCount: cachedData.results?.length,
      hasRelatedTools: !!cachedData.relatedTools,
      relatedToolsCount: cachedData.relatedTools?.length,
      keys: Object.keys(cachedData)
    });

    await env.TOOL_CACHE.put(cacheKey, JSON.stringify(cachedData), {
      expirationTtl: CACHE_TTL // 30天后自动过期
    });

    console.log(`💾 已保存到服务器缓存: ${query} (30天过期)`);
  } catch (error) {
    console.log("⚠️ KV写入失败:", error.message);
  }
}

/**
 * 清理缓存数据（返回给前端，移除内部字段）
 */
function cleanCacheData(data) {
  const { _cachedAt, _cacheVersion, ...cleanData } = data;
  return cleanData;
}

// ==================== 安全函数 ====================

/**
 * 语义归一化 - 提取查询的核心意图
 * - 移除无意义的修饰词和语气词
 * - 提取关键词作为缓存key
 * - 提高缓存命中率，体现智能
 */
function normalizeQuery(input) {
  if (!input) return '';

  let normalized = input.toLowerCase();

  // 移除常见的无意义修饰词和语气词
  const meaninglessPatterns = [
    // 程度副词
    /\b(很|非常|特别|超级|极其|相当|挺|比较|稍微|略微|确实|真的|其实)\b/g,
    // 语气词/助词
    /\b(哈哈|嘿嘿|呵呵|哎呀|哇|哦|嗯|啊|吧|嘛|呢|呀|咯|喽)\b/g,
    // 填充词
    /\b(就是|也就是|那个|这个|某些|某种|一些)\b/g,
    // 标点符号
    /[，。！？、,。!?]/g,
    // 空白字符
    /\s+/g,
  ];

  meaninglessPatterns.forEach(pattern => {
    normalized = normalized.replace(pattern, '');
  });

  // 提取核心关键词（技术工具相关词汇）
  const techKeywords = [
    '写日记|日记|笔记|记录',  // 笔记日记
    '替代|代替|替换',          // 替代工具
    '数据库|mysql|redis|mongodb|postgresql',  // 数据库
    '编辑|修改|改写',          // 编辑工具
    '监控|监控工具|zabbix|prometheus',  // 监控
    '容器|docker|k8s|kubernetes',  // 容器
    '开发|编程|代码|ide',      // 开发工具
    '图片|图像|处理|ps|photoshop',  // 图像处理
    '视频|剪辑|视频编辑',      // 视频编辑
    '文档|word|excel|ppt|office',  // 办公软件
    '管理|系统|工具|软件|平台',  // 通用
  ];

  // 尝试匹配技术关键词
  for (const pattern of techKeywords) {
    const regex = new RegExp(pattern, 'g');
    const matches = normalized.match(regex);
    if (matches && matches.length > 0) {
      // 找到关键词，用第一个匹配作为归一化key
      const keyword = matches[0];
      return keyword;
    }
  }

  // 没有匹配到关键词，返回清理后的文本（至少去除修饰词）
  return normalized || input;
}

/**
 * 清理和验证用户输入
 * - 防止注入攻击
 * - 限制输入长度（约30 tokens ≈ 120个中文字符）
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 移除危险字符和潜在的注入代码
  let cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // 移除script标签
    .replace(/javascript:/gi, '')  // 移除javascript:
    .replace(/on\w+\s*=/gi, '')   // 移除事件处理器
    .replace(/[<>\"']/g, '');      // 移除HTML特殊字符

  // 去除首尾空格
  cleaned = cleaned.trim();

  // 限制长度：30 tokens ≈ 120个中文字符或60个英文单词
  const MAX_CHARS = 120;
  if (cleaned.length > MAX_CHARS) {
    cleaned = cleaned.substring(0, MAX_CHARS);
  }

  return cleaned;
}

/**
 * 验证输入是否为纯文本（非代码注入）
 */
function isValidInput(input) {
  // 检查是否包含可疑模式
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /system\s*\(/i,
    /\$\(.+\)/,
    /`.*\$.*`/,
    /\${.*}/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }

  return true;
}

/**
 * 验证输入内容是否与技术工具相关
 * - 检测是否包含明显无关的关键词（如农业、政务等）
 * - 宽松检测，避免误杀
 */
function isTechRelatedInput(input) {
  const lowerInput = input.toLowerCase();

  // 技术工具相关的关键词（正向匹配）
  const techKeywords = [
    '软件', '工具', '系统', '平台', '应用', '服务', '数据库', '开发', '编程',
    '软件', '管理', '监控', '服务器', '容器', '云', '网络', '安全', '测试',
    '框架', '库', 'api', 'web', '前端', '后端', '算法', '数据', '运维',
    'linux', 'windows', 'mac', 'docker', 'kubernetes', 'mysql', 'redis', 'nginx',
    'git', '代码', '部署', 'ci/cd', 'devops', '微服务', '数据库',
    'software', 'tool', 'system', 'platform', 'app', 'service', 'database',
    'development', 'programming', 'coding', 'server', 'container', 'cloud',
    'security', 'testing', 'framework', 'library', 'network', 'devops'
  ];

  // 明显无关的关键词（负向匹配）
  const nonTechKeywords = [
    '补贴', '申报', '农户', '农产品', '农业', '农村', '扶贫', '种粮',
    '农机', '政策', '政府', '政务', '办事', '审批', '证照', '执照',
    '社保', '医保', '公积金', '户籍', '身份证', '护照', '签证',
    '房产', '购房', '贷款', '抵押', '理财', '保险', '证券', '股票',
    'subsidy', 'agriculture', 'farming', 'rural', 'policy', 'government',
    'approval', 'license', 'insurance', 'loan', 'real estate'
  ];

  // 检查是否包含技术关键词
  const hasTechKeyword = techKeywords.some(keyword =>
    lowerInput.includes(keyword.toLowerCase())
  );

  // 检查是否包含明显的非技术关键词
  const hasNonTechKeyword = nonTechKeywords.some(keyword =>
    lowerInput.includes(keyword.toLowerCase())
  );

  // 判断逻辑：
  // 1. 如果有技术关键词，允许
  // 2. 如果没有技术关键词但有非技术关键词，拒绝
  // 3. 如果都没有（太短或模糊），允许（交给LLM判断）
  if (hasTechKeyword) {
    return true;
  }
  if (hasNonTechKeyword) {
    return false;
  }
  // 模糊输入，允许通过
  return true;
}

// ==================== 主处理函数 ====================
export async function onRequest(context) {
  // 记录开始时间
  const startTime = Date.now();

  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "search";

    // OPTIONS预检
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // 获取请求参数
    let userInput = "";
    let userLanguage = 'zh';
    if (request.method === "POST") {
      const body = await request.json();
      userInput = body.query || "";
      userLanguage = body.language || 'zh';
    } else {
      userInput = url.searchParams.get("query") || "";
      userLanguage = url.searchParams.get("language") || 'zh';
    }

    // 安全验证：清理输入
    userInput = sanitizeInput(userInput);

    // 验证输入安全性
    if (!isValidInput(userInput)) {
      return new Response(JSON.stringify({
        error: "输入包含非法字符",
        details: "检测到潜在的注入攻击，请求已被拒绝"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (!userInput && type === "search") {
      return new Response(JSON.stringify({ error: "缺少查询参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 验证输入内容是否与技术工具相关（节省API成本）
    if (type === "search" && !isTechRelatedInput(userInput)) {
      console.log(`⚠️ 输入内容与技术工具无关: ${userInput}`);
      return new Response(JSON.stringify({
        error: "输入内容与技术工具无关",
        details: "这是技术工具搜索平台，请输入软件、开发工具、系统等相关关键词"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    let result = null;

    // 语义归一化：提取核心意图用于缓存key
    const normalizedQuery = normalizeQuery(userInput);
    console.log(`🧠 [NORMALIZE] 原始: "${userInput}" → 归一化: "${normalizedQuery}"`);

    // 调试信息：检查KV是否可用
    const kvAvailable = type === "search" && env.TOOL_CACHE;
    console.log(`🔍 [DEBUG] KV可用性: ${kvAvailable}, 查询: ${userInput}, 归一化: ${normalizedQuery}, 类型: ${type}`);

    // 1. 先检查服务器端KV缓存（仅搜索类型，使用归一化的key）
    if (kvAvailable) {
      result = await getFromKV(normalizedQuery, env);

      if (result) {
        // 缓存命中，返回清理后的数据
        const cleanResult = cleanCacheData(result);

        // 调试：检查清理后的数据
        console.log(`🔍 [CLEAN_DEBUG] 清理后的数据: ${userInput}`, {
          hasResults: !!cleanResult.results,
          resultsCount: cleanResult.results?.length,
          hasRelatedTools: !!cleanResult.relatedTools,
          relatedToolsCount: cleanResult.relatedTools?.length,
          keys: Object.keys(cleanResult)
        });

        // 添加缓存标记
        cleanResult.fromCache = true;
        cleanResult.cacheAge = result._cachedAt;
        cleanResult.debugInfo = {
          kvEnabled: true,
          cacheHit: true
        };

        console.log(`✅ [SUCCESS] 服务器缓存命中返回: ${userInput}, relatedTools数量: ${cleanResult.relatedTools?.length || 0}`);

        // 记录搜索日志（异步执行，不阻塞响应）
        const endTime = Date.now();
        if (env.PSPDB) {
          recordCompleteSearchFlow(env.PSPDB, request, {
            originalQuery: userInput,
            normalizedQuery: normalizedQuery,
            searchIntent: cleanResult.searchIntent,
            searchType: 'search',
            resultCount: cleanResult.results?.length || 0,
            fromCache: true,
            totalDurationMs: endTime - startTime,
            language: userLanguage
          }, {}).catch(err => console.error('日志记录失败:', err));
        }

        return new Response(JSON.stringify(cleanResult), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } else {
        console.log(`❌ [MISS] 服务器缓存未命中: ${userInput}, 将调用LLM`);
      }
    } else {
      console.log(`⚠️ [SKIP] KV不可用 - type:${type}, hasKV:${!!env.TOOL_CACHE}`);
    }

    // 2. 缓存未命中，调用LLM API（中文+英文双版本）
    // 用于收集 LLM 调用数据
    let llmCallData = [];

    if (type === "search") {
      console.log(`🚀 开始并行调用中英文LLM: ${userInput}`);

      // 并行调用中英文两个版本
      const [zhResult, enResult] = await Promise.all([
        // 中文版本
        (async () => {
          const prompt = SEARCH_PROMPT_ZH.replace(/\{userInput\}/g, userInput);
          const callStartTime = Date.now();
          console.log("📝 准备获取中文版本...");

          let result = await callDeepSeek(prompt, env);
          let provider = 'deepseek';
          let model = 'deepseek-chat';
          let success = true;
          let errorMessage = null;

          if (!result) {
            console.log("⚠️ DeepSeek中文失败，尝试火山方舟...");
            result = await callVolcArk(prompt, env);
            provider = 'volc_ark';
            model = 'doubao-seed-1-8-251228';
          }

          if (!result) {
            success = false;
            errorMessage = 'All LLM providers failed';
          }

          const duration = Date.now() - callStartTime;

          // 收集 LLM 调用数据
          llmCallData.push({
            language: 'zh',
            provider,
            model,
            promptLength: prompt.length,
            responseLength: result ? JSON.stringify(result).length : 0,
            durationMs: duration,
            success,
            errorMessage
          });

          console.log(`${result ? "✅" : "❌"} 中文版本${result ? "成功" : "失败"} (${duration}ms)`);
          return result;
        })(),
        // 英文版本
        (async () => {
          const prompt = SEARCH_PROMPT_EN.replace(/\{userInput\}/g, userInput);
          const callStartTime = Date.now();
          console.log("📝 准备获取英文版本...");

          let result = await callDeepSeek(prompt, env);
          let provider = 'deepseek';
          let model = 'deepseek-chat';
          let success = true;
          let errorMessage = null;

          if (!result) {
            console.log("⚠️ DeepSeek英文失败，尝试火山方舟...");
            result = await callVolcArk(prompt, env);
            provider = 'volc_ark';
            model = 'doubao-seed-1-8-251228';
          }

          if (!result) {
            success = false;
            errorMessage = 'All LLM providers failed';
          }

          const duration = Date.now() - callStartTime;

          // 收集 LLM 调用数据
          llmCallData.push({
            language: 'en',
            provider,
            model,
            promptLength: prompt.length,
            responseLength: result ? JSON.stringify(result).length : 0,
            durationMs: duration,
            success,
            errorMessage
          });

          console.log(`${result ? "✅" : "❌"} 英文版本${result ? "成功" : "失败"} (${duration}ms)`);
          return result;
        })()
      ]);

      // 检查结果 - 至少需要一个成功
      if (!zhResult && !enResult) {
        console.log(`❌ LLM调用失败 - 中文:${!!zhResult}, 英文:${!!enResult}`);
        return new Response(JSON.stringify({
          error: "API调用失败",
          details: {
            zhSuccess: !!zhResult,
            enSuccess: !!enResult,
            hasDeepSeekKey: !!env?.DEEPSEEK_API_KEY,
            hasVolcArkKey: !!env?.VOLC_ARK_API_KEY
          }
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // 容错处理：如果只有一个成功，用成功的版本替代失败的版本
      const finalZhResult = zhResult || enResult;
      const finalEnResult = enResult || zhResult;
      const hasFallback = !zhResult || !enResult;

      // 合并中英文结果
      result = {
        ...finalZhResult,
        zh: finalZhResult,
        en: finalEnResult,
        _partialTranslation: hasFallback  // 标记是否部分翻译
      };
    } else {
      // 推荐类型保持原样
      const prompt = RECOMMEND_PROMPT;
      result = await callDeepSeek(prompt, env);
      if (!result) {
        result = await callVolcArk(prompt, env);
      }

      if (!result) {
        return new Response(JSON.stringify({ error: "API调用失败" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // 3. 保存到服务器端KV缓存（仅搜索类型，使用归一化的key）
    if (type === "search" && env.TOOL_CACHE) {
      console.log(`💾 [SAVE] 准备保存到KV: 原始="${userInput}", 归一化="${normalizedQuery}"`);
      await saveToKV(normalizedQuery, result, env);
    } else {
      console.log(`⚠️ [NOSAVE] 跳过KV保存 - type:${type}, hasKV:${!!env.TOOL_CACHE}`);
    }

    // 添加未缓存标记和调试信息
    result.fromCache = false;
    result.debugInfo = {
      kvEnabled: !!env.TOOL_CACHE,
      cacheHit: false,
      originalQuery: userInput,
      normalizedQuery: normalizedQuery,
      cacheKey: kvAvailable ? `${CACHE_KEY_PREFIX}${normalizedQuery.toLowerCase()}` : null
    };

    // 记录搜索日志（异步执行，不阻塞响应）
    const endTime = Date.now();
    if (env.PSPDB) {
      recordCompleteSearchFlow(env.PSPDB, request, {
        originalQuery: userInput,
        normalizedQuery: normalizedQuery,
        searchIntent: result.searchIntent,
        searchType: type,
        resultCount: result.results?.length || 0,
        fromCache: false,
        totalDurationMs: endTime - startTime,
        language: userLanguage,
        results: result.results // 记录返回的工具
      }, {
        calls: llmCallData
      }).catch(err => console.error('日志记录失败:', err));
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error("API处理错误:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
