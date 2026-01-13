# 服务器端缓存配置指南

## 📋 缓存架构说明

### 三级缓存系统

```
用户搜索
  ↓
1. 客户端缓存（localStorage）
  ├─ 命中 → 瞬间返回（< 0.1秒）✅
  └─ 未命中 ↓
2. 服务器端缓存（Cloudflare KV）
  ├─ 命中且< 30天 → 快速返回（~50-100ms）⚡
  └─ 未命中或已过期 ↓
3. LLM API调用
  └─ 3-5秒后返回 → 保存到服务器缓存 💾
```

### 性能对比

| 缓存级别 | 响应时间 | TOKEN消耗 | 用户数量 |
|---------|---------|-----------|---------|
| **客户端缓存** | < 0.1秒 | 0 | 1人 |
| **服务器缓存** | ~50-100ms | 0 | 全部用户 |
| **LLM API** | 3-5秒 | 1次查询 | 全部用户 |

---

## 🚀 配置步骤

### 步骤 1：创建 KV 命名空间

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 在左侧菜单选择 **KV**（Key-Value存储）
4. 点击 **Create a namespace**
5. 输入命名空间名称：`TOOL_CACHE`
6. 点击 **Add**

### 步骤 2：绑定 KV 到项目

1. 进入你的 **Pages 项目**（douya-chat）
2. 点击 **Settings** 标签
3. 滚动到 **Functions** 部分
4. 找到 **KV Namespace Bindings**
5. 点击 **Add binding**
6. 填写以下信息：
   - **Variable name**: `TOOL_CACHE`
   - **KV Namespace**: 选择刚才创建的 `TOOL_CACHE`
7. 点击 **Save**

### 步骤 3：更新环境变量（可选）

如果需要限制缓存大小或其他高级配置，可以添加环境变量：

在 **Settings → Environment variables** 中添加：
- `CACHE_ENABLED` = `true`（启用缓存）
- `CACHE_TTL_DAYS` = `30`（缓存过期天数）

---

## 🔧 本地开发

### 本地开发环境不支持 KV

本地开发时（`npx wrangler pages dev`），KV 缓存会自动跳过，直接调用 LLM API。

这是正常的，因为：
- 本地 Worker 模拟器不支持 KV 存储
- 生产环境（Cloudflare Pages）才支持 KV

### 模拟 KV 缓存（可选）

如果需要在本地测试缓存逻辑，可以使用模拟数据：

```javascript
// 在 functions/api/search.js 中添加测试逻辑
if (!env.TOOL_CACHE) {
  // 本地开发：使用模拟缓存
  const mockCache = {
    "mysql": { /* 预置的MySQL数据 */ },
    "docker": { /* 预置的Docker数据 */ }
  };

  const mockData = mockCache[userInput.toLowerCase()];
  if (mockData) {
    return new Response(JSON.stringify({
      ...mockData,
      fromCache: true,
      cacheAge: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}
```

---

## 📊 缓存效果监控

### 查看缓存命中率

在 **Cloudflare Dashboard** 中：

1. 进入你的 Pages 项目
2. 点击 **Analytics** 标签
3. 查看 **KV 存储指标**：
   - 读取次数（Reads）
   - 写入次数（Writes）
   - 缓存命中率 = 读取次数 / (读取次数 + 写入次数)

### Worker 日志

部署后，可以在 **Workers → Dashboard → Logs** 中查看：

```
✅ 服务器缓存命中: mysql
💾 已保存到服务器缓存: redis (30天过期)
```

---

## 💾 缓存策略详解

### 缓存键格式

```
tool:mysql
tool:docker
tool:kubernetes
```

- 前缀：`tool:`
- 工具名：小写（`mysql`、`MySQL` → `tool:mysql`）

### 缓存数据结构

```javascript
{
  "searchIntent": "精确查询",
  "originalQuery": "mysql",
  "resultCount": 1,
  "searchTime": "0.3秒",
  "results": [
    // ... 工具数据
  ],
  "relatedTools": [
    // ... 相关工具
  ],
  // 内部字段（返回给前端时移除）
  "_cachedAt": "2025-01-13T06:30:00.000Z",
  "_cacheVersion": "1.0"
}
```

### 过期策略

- **TTL**: 30天（2,592,000秒）
- **自动过期**: 30天后 KV 自动删除
- **手动清理**: 可在 Cloudflare Dashboard 中删除

### 响应标记

服务器端返回的数据会包含：

```javascript
{
  // ... 原有数据
  "fromCache": true,  // 是否来自缓存
  "cacheAge": "2025-01-13T06:30:00.000Z"  // 缓存时间
}
```

前端可以根据 `fromCache` 显示不同的提示：
- `true`: "从服务器缓存加载"
- `false`: "LLM 生成"

---

## 🎯 优化效果

### TOKEN 消耗对比

假设每天 100 个用户，每个用户搜索 10 次不同工具：

#### 无服务器缓存（v1.1）
```
100 用户 × 10 次 = 1,000 次 API 调用/天
30 天 = 30,000 次 API 调用/月
```

#### 有服务器缓存（v1.2）
```
首次：100 用户 × 10 次 = 1,000 次 API 调用
后续：全部命中服务器缓存 = 0 次 API 调用

30 天 = 1,000 次 API 调用/月（减少 96.7%！）
```

### 30天后自动刷新

即使缓存30天过期，实际消耗会更低：

- 常用工具（mysql、docker）：大部分用户已经搜索过
- 长尾工具：只有少数用户搜索，TOKEN消耗可控

---

## 🧹 清理缓存

### 方法 1：等待自动过期

KV 会自动在 30 天后删除缓存数据。

### 方法 2：手动清理

1. 进入 **Cloudflare Dashboard → Workers & Pages → KV**
2. 选择 `TOOL_CACHE` 命名空间
3. 点击 **Browse** 查看所有键
4. 勾选要删除的键
5. 点击 **Delete**

### 方法 3：清理整个命名空间

如果需要清空所有缓存：

1. 进入 **KV → TOOL_CACHE**
2. 点击 **Remove namespace**
3. **警告**：这会删除所有缓存数据！

---

## ⚡ 性能优化建议

### 1. 预热常用工具

批量生成常用工具，提前填充服务器缓存：

```bash
# 修改 scripts/batch-generate.js，添加服务器端缓存调用
node scripts/batch-generate.js --limit 50
```

每个工具调用一次 LLM，后续所有用户都能从服务器缓存获取。

### 2. 监控缓存大小

定期检查 KV 存储大小：

- 免费版：1GB 存储空间
- 每个工具约 3-5KB
- 可存储约 **200,000 - 300,000 个工具**

### 3. 调整 TTL（可选）

如果工具信息更新较快，可以缩短过期时间：

修改 `functions/api/search.js`:
```javascript
const CACHE_TTL = 7 * 24 * 60 * 60; // 改为7天
```

---

## ❓ 常见问题

### Q: 本地开发时缓存不工作？

**A**: 正常现象。本地 Worker 模拟器不支持 KV，会自动跳过缓存直接调用 LLM API。部署到 Cloudflare Pages 后缓存会自动启用。

### Q: 如何验证缓存是否生效？

**A**: 搜索一个工具，然后立即再次搜索：
- 第一次：3-5秒（调用 LLM + 保存缓存）
- 第二次：~50-100ms（服务器缓存命中）
- 查看 Worker 日志：`✅ 服务器缓存命中: xxx`

### Q: KV 存储空间不够怎么办？

**A**:
- 免费版：1GB，足够存储 20万+ 工具
- 付费版：$0.50/GB/月，无限扩展
- 或缩短 TTL 到 7 天，自动清理旧数据

### Q: 缓存数据会占用带宽吗？

**A**: 不会。KV 和 Pages 在同一网络，读取速度极快且不消耗出站流量。

### Q: 如何禁用服务器缓存？

**A**: 在 `functions/api/search.js` 中注释掉缓存逻辑：

```javascript
// 跳过服务器缓存
// if (type === "search" && env.TOOL_CACHE) {
//   result = await getFromKV(userInput, env);
//   ...
// }
```

---

## 📈 成本估算

### Cloudflare KV 定价

**免费额度**：
- 每天 100,000 次读取
- 每天 1,000 次写入
- 1GB 存储空间

**付费额度**（超出免费部分）：
- 读取：$0.50 / 百万次
- 写入：$5.00 / 百万次
- 存储：$0.50 / GB / 月

### 本项目估算

假设每天 1,000 次搜索：
- **首次**: 1,000 次写入（免费）
- **后续**: 全部读取（免费）
- **成本**: $0 / 月

即使每天 10,000 次首次搜索：
- 写入：10,000 次（10 天免费额度）
- 读取：290,000 次（2.9 天免费额度）
- **成本**: 约 $0.15 / 月

**结论**：免费额度完全足够使用！

---

## 🎉 总结

服务器端缓存带来的好处：

1. **大幅降低 TOKEN 消耗**（96%+）
2. **提升响应速度**（50-100ms vs 3-5秒）
3. **全球分布式**（Cloudflare CDN + KV）
4. **自动过期**（30天后自动刷新）
5. **零额外成本**（免费额度充足）

**这是 AI 原生应用的缓存最佳实践！** 🚀
