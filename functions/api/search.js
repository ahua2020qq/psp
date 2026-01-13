/**
 * Cloudflare Pages Function - 搜索API代理（优化版）
 * 隐藏API密钥和Prompt模板，解决CORS问题
 */

// ==================== Prompt模板（优化版 - 更短更快） ====================

// 搜索专用Prompt - 精简版
const SEARCH_PROMPT = `你是开源软件工具检索助手。返回JSON格式：
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
  if (!apiKey) return null;

  try {
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

    if (!response.ok) return null;

    const data = await response.json();
    if (data.output && data.output[0] && data.output[0].text) {
      try {
        return JSON.parse(data.output[0].text);
      } catch {
        const jsonMatch = data.output[0].text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    }
    return null;
  } catch (error) {
    console.log("❌ 火山方舟调用失败:", error.message);
    return null;
  }
}

// 调用DeepSeek API
async function callDeepSeek(prompt, env) {
  const apiKey = env?.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  try {
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
        max_tokens: 1500  // 降低到1500加快响应
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      try {
        return JSON.parse(data.choices[0].message.content);
      } catch {
        return null;
      }
    }
    return null;
  } catch (error) {
    console.log("❌ DeepSeek调用失败:", error.message);
    return null;
  }
}

// ==================== 主处理函数 ====================
export async function onRequest(context) {
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
    if (request.method === "POST") {
      const body = await request.json();
      userInput = body.query || "";
    } else {
      userInput = url.searchParams.get("query") || "";
    }

    if (!userInput && type === "search") {
      return new Response(JSON.stringify({ error: "缺少查询参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    let result = null;
    const prompt = type === "search"
      ? SEARCH_PROMPT.replace(/\{userInput\}/g, userInput)
      : RECOMMEND_PROMPT;

    // 优先使用DeepSeek（更快）
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
