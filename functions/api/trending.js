/**
 * Cloudflare Pages Function - GitHub Trending API
 * 返回当前GitHub热门项目，用于热门搜索显示
 */

// 缓存配置
const TRENDING_CACHE_TTL = 3600; // 1小时（秒）
const CACHE_KEY = "github_trending";

/**
 * 获取GitHub Trending HTML
 */
async function fetchGithubTrending() {
  try {
    const response = await fetch("https://github.com/trending", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!response.ok) {
      console.log("❌ GitHub Trending 请求失败");
      return null;
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.log("❌ GitHub Trending 抓取失败:", error.message);
    return null;
  }
}

/**
 * 从HTML中提取项目名称
 */
function extractRepoNames(html) {
  if (!html) return [];

  const repoNames = [];
  // 匹配 GitHub 项目链接：/username/repo-name
  const regex = /href="\/([^\/"]+\/[^\/"]+)"/g;
  const matches = html.matchAll(regex);

  const seen = new Set();
  for (const match of matches) {
    const repoName = match[1];
    // 过滤掉非仓库链接（如 trending、topics 等）
    if (!repoName.includes('trending') &&
        !repoName.includes('topics') &&
        !repoName.includes('organizations') &&
        !seen.has(repoName)) {
      seen.add(repoName);
      repoNames.push(repoName);

      // 只取前6个
      if (repoNames.length >= 6) {
        break;
      }
    }
  }

  return repoNames;
}

/**
 * 从KV获取缓存
 */
async function getFromKV(env) {
  try {
    const cached = await env.TOOL_CACHE.get(CACHE_KEY, "json");
    if (cached) {
      console.log("✅ Trending缓存命中");
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
async function saveToKV(repos, env) {
  try {
    await env.TOOL_CACHE.put(CACHE_KEY, JSON.stringify({
      repos,
      updatedAt: new Date().toISOString()
    }), {
      expirationTtl: TRENDING_CACHE_TTL
    });
    console.log("💾 Trending已缓存 (1小时)");
  } catch (error) {
    console.log("⚠️ KV写入失败:", error.message);
  }
}

export async function onRequest(context) {
  try {
    const { request, env } = context;

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // 1. 先检查KV缓存
    if (env.TOOL_CACHE) {
      const cached = await getFromKV(env);
      if (cached && cached.repos && cached.repos.length > 0) {
        return new Response(JSON.stringify({
          repos: cached.repos,
          fromCache: true,
          updatedAt: cached.updatedAt
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // 2. 缓存未命中，抓取GitHub Trending
    console.log("🌐 抓取 GitHub Trending...");
    const html = await fetchGithubTrending();

    if (!html) {
      // 抓取失败，返回默认列表
      const defaultRepos = [
        "facebook/react",
        "tensorflow/tensorflow",
        "microsoft/vscode",
        "vuejs/core",
        "golang/go",
        "rust-lang/rust"
      ];
      return new Response(JSON.stringify({
        repos: defaultRepos,
        fromCache: false,
        error: "GitHub Trending 暂时不可用"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 3. 提取项目名称
    const repoNames = extractRepoNames(html);
    console.log(`✅ 提取到 ${repoNames.length} 个热门项目:`, repoNames);

    // 4. 保存到KV
    if (env.TOOL_CACHE && repoNames.length > 0) {
      await saveToKV(repoNames, env);
    }

    return new Response(JSON.stringify({
      repos: repoNames,
      fromCache: false
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error("Trending API错误:", error);

    // 返回默认列表
    const defaultRepos = [
      "facebook/react",
      "tensorflow/tensorflow",
      "microsoft/vscode",
      "vuejs/core",
      "golang/go",
      "rust-lang/rust"
    ];

    return new Response(JSON.stringify({
      repos: defaultRepos,
      fromCache: false,
      error: error.message
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
