/**
 * KV 测试接口 - 用于诊断 KV 缓存是否正常工作
 * 访问 /api/test-kv 来查看 KV 绑定状态
 */

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "status";

  try {
    // 检查 KV 绑定
    const hasKV = !!env.TOOL_CACHE;
    const kvType = hasKV ? typeof env.TOOL_CACHE : "undefined";

    let testResult = null;

    if (action === "test" && hasKV) {
      // 执行读写测试
      const testKey = "test-kv-connection-" + Date.now();
      const testValue = { test: true, timestamp: new Date().toISOString() };

      // 写入测试
      try {
        await env.TOOL_CACHE.put(testKey, JSON.stringify(testValue), {
          expirationTtl: 60 // 60秒后过期
        });
        testResult = { write: "success", key: testKey };
      } catch (writeError) {
        testResult = { write: "failed", error: writeError.message };
      }

      // 读取测试
      try {
        const read = await env.TOOL_CACHE.get(testKey, "json");
        testResult.read = read ? "success" : "failed";
        testResult.data = read;
      } catch (readError) {
        testResult.read = "failed";
        testResult.readError = readError.message;
      }

      // 清理测试键
      try {
        await env.TOOL_CACHE.delete(testKey);
        testResult.cleanup = "success";
      } catch (cleanupError) {
        testResult.cleanup = "failed";
        testResult.cleanupError = cleanupError.message;
      }
    }

    // 获取当前 KV 中的所有工具缓存键（前缀扫描）
    let cachedKeys = [];
    if (hasKV) {
      try {
        const list = await env.TOOL_CACHE.list({ prefix: "tool:" });
        cachedKeys = list.keys.map(k => k.name);
      } catch (listError) {
        cachedKeys = [`Error: ${listError.message}`];
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      kvBinding: {
        exists: hasKV,
        type: kvType,
        name: hasKV ? "TOOL_CACHE" : null
      },
      testResult,
      cachedTools: {
        count: cachedKeys.length,
        keys: cachedKeys.slice(0, 10) // 只显示前10个
      },
      instructions: {
        howToBind: [
          "1. Cloudflare Dashboard → Workers & Pages → KV",
          "2. 创建命名空间: TOOL_CACHE",
          "3. Pages项目 → Settings → Functions → KV Namespace Bindings",
          "4. Add binding: Variable name=TOOL_CACHE, KV Namespace=TOOL_CACHE",
          "5. Save 并重新部署"
        ]
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
