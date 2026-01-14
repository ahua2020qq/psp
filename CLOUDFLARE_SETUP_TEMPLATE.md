# Cloudflare Pages 完整配置模板

> 此文档记录了 PSP 项目的完整 Cloudflare 配置，可供新项目直接复用

## 📋 目录

- [环境变量配置](#环境变量配置)
- [KV Cache 设置](#kv-cache-设置)
- [部署配置](#部署配置)
- [Functions 结构](#functions-结构)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 🔐 环境变量配置

### 必需的环境变量

在 Cloudflare Pages Dashboard 中配置：

**路径**: `Pages → Your Project → Settings → Environment Variables`

```bash
# Production Environment
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
VOLC_ARK_API_KEY=ark-xxxxxxxxxxxxx

# Preview Environment (可选，使用相同的密钥)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
VOLC_ARK_API_KEY=ark-xxxxxxxxxxxxx
```

### 安全建议

✅ **最佳实践**:
- API Key 仅存储在服务端（Environment Variables）
- 客户端永远无法直接访问
- 使用 `secret` 前缀标记敏感变量（可选）
- 定期轮换密钥

❌ **不要**:
- 在代码中硬编码 API Key
- 将 `.dev.vars` 提交到 Git
- 在客户端代码中使用环境变量

---

## 💾 KV Cache 设置

### 步骤 1: 创建 KV 命名空间

**路径**: `Cloudflare Dashboard → Workers & Pages → KV`

1. 点击 "Create a namespace"
2. 命名空间名称: `TOOL_CACHE`
3. 点击 "Add"

### 步骤 2: 绑定 KV 到 Pages Functions

**路径**: `Pages → Your Project → Settings → Functions → KV Namespace Bindings`

1. 点击 "Add binding"
2. 配置如下:
   - **Variable name**: `TOOL_CACHE`
   - **KV Namespace**: `TOOL_CACHE` (选择刚创建的命名空间)
3. 保存

### 步骤 3: 验证 KV 配置

在 Functions 中测试:

```javascript
// functions/api/test.js
export async function onRequest(context) {
  const { env } = context;

  // 测试写入
  await env.TOOL_CACHE.put('test-key', 'Hello KV!', {
    expirationTtl: 3600 // 1小时后过期
  });

  // 测试读取
  const value = await env.TOOL_CACHE.get('test-key');

  return new Response(JSON.stringify({
    kvWorking: !!value,
    testValue: value
  }));
}
```

访问 `https://your-project.pages.dev/api/test` 应该返回:
```json
{
  "kvWorking": true,
  "testValue": "Hello KV!"
}
```

---

## 🚀 部署配置

### 构建设置

**路径**: `Pages → Your Project → Builds & deployments → Configuration`

```yaml
Framework preset: Vite
Build command: npm run build
Build output directory: build
Root directory: / (默认)
```

### 环境变量（重新强调）

**Production**:
- `DEEPSEEK_API_KEY`
- `VOLC_ARK_API_KEY`

**Preview**:
- `DEEPSEEK_API_KEY`
- `VOLC_ARK_API_KEY`

---

## 📁 Functions 结构

### 标准目录结构

```
functions/
├── api/
│   ├── search.js          # 主搜索 API
│   ├── trending.js        # GitHub Trending API
│   └── test.js            # 测试端点（可选）
└── _middleware.js         # 中间件（可选）
```

### Function 模板

#### 标准 API Function 模板

```javascript
// functions/api/your-endpoint.js
export async function onRequest(context) {
  const { request, env } = context;

  // 1. CORS 处理（如果需要）
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. 解析请求
  const { method } = request;
  if (method !== 'GET' && method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 3. 访问环境变量
    const apiKey = env.YOUR_API_KEY;

    // 4. 访问 KV Cache
    const cached = await env.TOOL_CACHE.get('your-key', 'json');

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 5. 业务逻辑...

    // 6. 保存到 KV（可选）
    await env.TOOL_CACHE.put('your-key', JSON.stringify(data), {
      expirationTtl: 2592000 // 30天
    });

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
```

---

## ⚡ 最佳实践

### 1. 缓存策略

```javascript
// 多级缓存示例
const CACHE_TTL = {
  SHORT: 3600,      // 1小时 - 实时数据
  MEDIUM: 86400,    // 1天 - 相对稳定
  LONG: 2592000     // 30天 - 静态数据
};

// 使用示例
await env.TOOL_CACHE.put('trending', JSON.stringify(data), {
  expirationTtl: CACHE_TTL.SHORT
});
```

### 2. 错误处理

```javascript
// 统一错误响应
function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 使用示例
try {
  const data = await fetchData();
  return successResponse(data);
} catch (error) {
  return errorResponse('Failed to fetch data', 500);
}
```

### 3. 速率限制

```javascript
// 使用 KV 实现简单的速率限制
async function checkRateLimit(ip, env) {
  const key = `ratelimit:${ip}`;
  const { count, resetTime } = await env.TOOL_CACHE.get(key, 'json') || {
    count: 0,
    resetTime: Date.now() + 86400000 // 24小时后
  };

  if (Date.now() > resetTime) {
    // 重置计数
    await env.TOOL_CACHE.put(key, JSON.stringify({
      count: 1,
      resetTime: Date.now() + 86400000
    }), { expirationTtl: 86400 });
    return { allowed: true, remaining: 29 };
  }

  if (count >= 30) {
    return { allowed: false, remaining: 0 };
  }

  // 增加计数
  await env.TOOL_CACHE.put(key, JSON.stringify({
    count: count + 1,
    resetTime
  }), { expirationTtl: 86400 });

  return { allowed: true, remaining: 30 - count - 1 };
}
```

### 4. 请求日志

```javascript
// 在 Function 中添加日志
export async function onRequest(context) {
  const { request, env } = context;

  // 记录请求
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);

  try {
    // ... 业务逻辑
    console.log(`✅ Success: ${request.url}`);
    return response;
  } catch (error) {
    console.log(`❌ Error: ${request.url} - ${error.message}`);
    throw error;
  }
}
```

**查看日志**: `Workers & Pages → Your Project → Logs → Real-time logs`

### 5. 环境检测

```javascript
// 判断当前环境
function isProduction(env) {
  // 检查是否有生产环境的特定变量
  return env.PRODUCTION === 'true';
}

// 或者通过 URL 判断
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isProd = url.hostname.includes('pages.dev') === false;
  // ...
}
```

---

## ❓ 常见问题

### Q1: 本地开发如何使用 KV？

**A**: 本地开发环境不支持真实的 KV，但可以使用模拟模式：

```javascript
// 使用 try-catch 处理 KV 不可用的情况
export async function onRequest(context) {
  let data;
  try {
    data = await env.TOOL_CACHE.get('key', 'json');
  } catch (error) {
    console.log('KV not available in local development');
    data = null;
  }

  // 业务逻辑...
}
```

### Q2: 如何清空 KV Cache？

**方法 1**: 通过 Dashboard
- 进入 `Workers & Pages → KV → TOOL_CACHE`
- 手动删除 keys

**方法 2**: 创建清理 Function

```javascript
// functions/api/clear-cache.js
export async function onRequest(context) {
  const { env } = context;

  // 列出所有 keys
  const list = await env.TOOL_CACHE.list();
  const keys = list.keys.map(k => k.name);

  // 批量删除
  await Promise.all(keys.map(key => env.TOOL_CACHE.delete(key)));

  return new Response(JSON.stringify({
    deleted: keys.length,
    keys
  }));
}
```

### Q3: KV 有容量限制吗？

**A**: 免费套餐限制：
- **读操作**: 100,000 次/天
- **写操作**: 1,000 次/天
- **存储**: 1 GB
- **单个值**: 最大 25 MB

### Q4: 如何监控 API 使用情况？

**A**: 在 Dashboard 中查看：
- `Workers & Pages → Your Project → Metrics`
- 查看请求量、错误率、响应时间等

### Q5: 如何回滚部署？

**A**:
1. 进入 `Pages → Your Project → Deployments`
2. 找到想要回滚的版本
3. 点击右侧 `...` → `Rollback`
4. 确认回滚

### Q6: 环境变量更新后需要重新部署吗？

**A**: 不需要！
- 环境变量更新后立即生效
- 但正在运行的请求可能需要等待几秒
- 建议在非高峰时段更新敏感变量

---

## 📦 快速启动新项目清单

使用此模板启动新项目时，按顺序完成：

- [ ] 1. 在 Cloudflare Pages 创建新项目
- [ ] 2. 连接 GitHub 仓库
- [ ] 3. 配置构建设置（Vite, build, build/）
- [ ] 4. 添加环境变量（API Keys）
- [ ] 5. 创建 KV 命名空间
- [ ] 6. 绑定 KV 到 Functions
- [ ] 7. 创建 `functions/api/` 目录
- [ ] 8. 复制 Function 模板
- [ ] 9. 测试部署
- [ ] 10. 配置自定义域名（可选）

---

## 🔗 相关资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [KV 文档](https://developers.cloudflare.com/kv/)
- [Functions 文档](https://developers.cloudflare.com/pages/functions/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

---

**最后更新**: 2026-01-14
**维护者**: 姝姝豆芽之家
