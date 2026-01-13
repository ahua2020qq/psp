# 批量生成工具数据与速率限制指南

## 📋 目录
1. [缓存系统说明](#缓存系统说明)
2. [速率限制说明](#速率限制说明)
3. [使用批量生成脚本](#使用批量生成脚本)
4. [配置说明](#配置说明)
5. [查看缓存状态](#查看缓存状态)
6. [验证缓存效果](#验证缓存效果)
7. [生产环境建议](#生产环境建议)
8. [常见问题](#常见问题)

---

## 缓存系统说明

新的缓存系统可以显著提升搜索速度：

- **已缓存工具**：< 0.1秒（瞬间显示，**不计入API配额**）
- **未缓存工具**：3-5秒（调用LLM API，**计入API配额**）

工作原理：
1. 用户搜索时，先检查浏览器缓存
2. 如果有缓存，立即显示结果（**不消耗API配额**）
3. 如果没有，调用LLM API获取结果（**消耗API配额**）
4. API结果自动保存到缓存
5. 下次搜索相同工具时直接使用缓存（**不消耗API配额**）

---

## 速率限制说明

**为了防止恶意消耗API TOKEN，系统实施了以下限制：**

### 🚦 限制规则
1. **冷却时间**：5秒内不能连续调用API（防止暴力刷接口）
2. **每日限额**：每天最多30次API调用
3. **缓存例外**：**缓存查询不受任何限制**，可无限次使用

### 📊 配额显示
- 网站底部实时显示今日API配额使用情况
- 进度条颜色指示：
  - 🟢 绿色：配额充足（>70%）
  - 🟡 黄色：配额过半（30-70%）
  - 🟠 橙色：配额告急（<5次）

### 💡 优化建议
- **优先使用缓存**：批量生成常用工具后，大部分查询会命中缓存
- **缓存查询不受限**：已缓存的工具可以无限次查询，不消耗配额
- **合理规划API调用**：首次搜索新工具消耗配额，之后查询免费

---

## 使用批量生成脚本

### 方式1：生成所有预定义工具（推荐）

脚本内置了100+个常见工具，包括：

**数据库（11个）：** MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch, SQLite, MariaDB, Cassandra, DynamoDB, InfluxDB, TimescaleDB

**容器与编排（11个）：** Docker, Kubernetes, Docker Compose, Helm, Istio, Envoy, Rancher, OpenShift, Nomad, Consul, Vault

**Web服务器（6个）：** Nginx, Apache, Caddy, Traefik, HAProxy, Envoy

**开发语言（11个）：** Python, Node.js, Golang, Java, Rust, C++, Ruby, PHP, JavaScript, TypeScript, Swift

**开发工具（11个）：** Git, VS Code, IntelliJ IDEA, Vim, Emacs, Atom, Sublime Text, Xcode, Android Studio, PyCharm, WebStorm

**监控与日志（10个）：** Prometheus, Grafana, ELK Stack, Fluentd, Jaeger, Zipkin, Sentry, Datadog, New Relic, Nagios, Zabbix

**CI/CD（10个）：** Jenkins, GitLab CI, GitHub Actions, CircleCI, Travis CI, Drone, Concourse, Spinnaker, Argo CD, Flux

**消息队列（10个）：** Kafka, RabbitMQ, Redis Streams, NATS, ActiveMQ, Pulsar, RocketMQ, Amazon SQS, Amazon SNS, Azure Service Bus

**云原生（10个）：** Minikube, Kind, K3s, MicroK8s, Skaffold, Tekton, Buildpacks, Containerd, CRI-O, runc, gVisor

**存储（11个）：** NFS, Ceph, GlusterFS, HDFS, MinIO, SeaweedFS, FastDFS, MooseFS, Lustre, GFS, Amazon S3

**网络工具（12个）：** Wireshark, tcpdump, Ping, Traceroute, Nmap, Netcat, Curl, Wget, Ansible, Terraform, Pulumi, Vagrant

**安全工具（11个）：** OpenSSL, Let's Encrypt, Certbot, Keycloak, Auth0, OAuth2, JWT, HashiCorp Vault, Snyk, SonarQube, Trivy

**测试工具（11个）：** Selenium, Cypress, Playwright, Puppeteer, Jest, Mocha, Chai, JUnit, TestNG, pytest, Robot Framework

**操作系统（11个）：** Linux, Ubuntu, CentOS, Debian, Fedora, Arch Linux, Red Hat, Windows Server, macOS, Unix, Shell

**运行命令：**
```bash
node scripts/batch-generate.js
```

这将生成所有100+个工具，预计耗时：100个工具 × 2秒 = 3-4分钟
**注意**：由于速率限制（5秒冷却），实际耗时会更长，但这是为了保护API配额。

### 方式2：生成指定工具

```bash
# 生成数据库相关工具
node scripts/batch-generate.js mysql postgresql redis mongodb

# 生成容器相关工具
node scripts/batch-generate.js docker kubernetes helm
```

### 方式3：限制生成数量

```bash
# 只生成前20个工具（测试用）
node scripts/batch-generate.js --limit 20
```

### 方式4：从搜索历史生成（需要浏览器环境）

在浏览器开发者工具Console中执行：

```javascript
// 1. 获取搜索历史
const history = JSON.parse(localStorage.getItem('psp_search_history') || '[]');
console.log('搜索历史:', history);

// 2. 批量生成（复制上面的工具列表到命令行）
history.forEach(tool => {
  fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: tool })
  });
});
```

---

## 配置说明

### 批量生成脚本配置

在 `scripts/batch-generate.js` 中可以调整：

```javascript
const BATCH_SIZE = 50;    // 每批处理数量（默认50）
const DELAY_MS = 2000;    // 每个请求间隔（毫秒，默认2000）
```

- `BATCH_SIZE`：每批显示多少个工具（不影响实际处理）
- `DELAY_MS`：请求间隔，建议保持2000ms以上（避免触发速率限制）

### 速率限制配置

在 `src/utils/rateLimiter.ts` 中可以调整：

```typescript
const COOLDOWN_MS = 5000; // 5秒冷却时间
const DAILY_LIMIT = 30;   // 每日30次API调用限制
```

**注意**：修改这些值需要重新构建和部署。

---

## 查看缓存状态

在浏览器开发者工具Console中执行：

```javascript
// 查看所有缓存
const cache = JSON.parse(localStorage.getItem('psp_tools_cache') || '{}');
console.log('已缓存工具数量:', Object.keys(cache).length);
console.table(Object.keys(cache));

// 查看热门搜索（搜索次数>=2）
const searches = Object.values(cache)
  .filter(entry => entry.hitCount >= 2)
  .sort((a, b) => b.hitCount - a.hitCount);
console.table(searches.map(s => ({
  工具: s.keyword,
  搜索次数: s.hitCount,
  缓存时间: new Date(s.createdAt).toLocaleString()
})));

// 查看API调用统计
const calls = JSON.parse(localStorage.getItem('psp_api_calls') || '{}');
const today = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
console.log(`今日API调用: ${calls[todayKey] || 0}/30`);

// 清除缓存（慎用）
localStorage.removeItem('psp_tools_cache');
console.log('缓存已清除');

// 重置速率限制（仅测试用）
localStorage.removeItem('psp_api_calls');
localStorage.removeItem('psp_last_api_call');
console.log('速率限制已重置');
```

---

## 验证缓存效果

### 测试步骤

1. **首次搜索（调用API）**
   - 搜索一个未缓存的工具（如 "influxdb"）
   - 观察耗时约3-5秒
   - 查看底部配额显示：应该减少1次

2. **再次搜索（使用缓存）**
   - 搜索相同工具
   - 应该立即显示（< 0.1秒）
   - 查看底部配额显示：**不应减少**

3. **验证Toast通知**
   - 首次搜索应显示："✅ 搜索完成（今日剩余 X 次API调用）"
   - 缓存查询应显示："⚡ 从缓存加载（X.X秒）"

### Console日志验证

首次搜索：
```
🔍 开始搜索: influxdb
📊 今日剩余API调用次数: 29
✅ API调用成功
💾 已缓存: influxdb
📊 API调用统计: 今日 1/30
```

缓存查询：
```
🔍 开始搜索: influxdb
⚡ 使用缓存数据
```

---

## 生产环境建议

对于 douya.chat 网站：

### 1. 初始部署后
```bash
# 生成最常见的30个工具（消耗30次API配额）
node scripts/batch-generate.js --limit 30
```

### 2. 定期维护
- **每周**：检查搜索历史，对高频查询工具优先生成缓存
- **每月**：批量生成一批新工具，扩充缓存库
- **每季度**：评估API成本 vs 缓存命中率，调整限额

### 3. 监控指标
在浏览器Console执行：
```javascript
// 缓存命中率
const cache = JSON.parse(localStorage.getItem('psp_tools_cache') || '{}');
const totalHits = Object.values(cache).reduce((sum, entry) => sum + entry.hitCount, 0);
const totalCached = Object.keys(cache).length;
console.log(`缓存命中率: ${totalHits}/${totalCached} = ${(totalHits/totalCached || 0).toFixed(2)} 次/工具`);

// API使用率
const calls = JSON.parse(localStorage.getItem('psp_api_calls') || '{}');
const today = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const todayCalls = calls[todayKey] || 0;
console.log(`今日API使用率: ${todayCalls}/30 = ${(todayCalls/30*100).toFixed(1)}%`);
```

### 4. 用户教育
在网站上添加说明：
> 💡 **提示**：已搜索过的工具会自动缓存，下次查询瞬间完成且不消耗API配额。建议优先使用批量生成脚本预缓存常用工具。

---

## 常见问题

### Q1: 批量生成脚本报错 "fetch failed"
**A**: 确保本地Worker在运行：
```bash
npx wrangler pages dev build --port 8788
```

### Q2: 缓存数据占用多少空间？
**A**: 每个工具约3-5KB，100个工具约300-500KB，远低于localStorage 5MB限制

### Q3: 如何更新已缓存的工具数据？
**A**: 清除缓存后重新搜索：
```javascript
localStorage.removeItem('psp_tools_cache');
```

### Q4: 能否导出缓存数据供其他用户使用？
**A**: 可以，在Console执行：
```javascript
// 导出
const cache = localStorage.getItem('psp_tools_cache');
const blob = new Blob([cache], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'psp-cache-backup.json';
a.click();
```

其他用户导入：
```javascript
const input = document.createElement('input');
input.type = 'file';
input.onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = event => {
    localStorage.setItem('psp_tools_cache', event.target.result);
  };
  reader.readAsText(file);
};
input.click();
```

### Q5: 速率限制太严格，能否放宽？
**A**: 当前配置已平衡安全性和可用性：
- 5秒冷却：防止暴力刷接口
- 30次/天：足够正常使用（大部分查询会命中缓存）
- **缓存不限**：已缓存工具可无限查询

如需调整，修改 `src/utils/rateLimiter.ts` 并重新部署。

### Q6: 批量生成是否会消耗我自己的API配额？
**A**:
- **本地批量生成**：消耗你自己的配额（30次/天）
- **建议**：在本地批量生成后，导出缓存文件，分发给用户
- **用户导入缓存**：不消耗你的配额，直接使用

### Q7: 如何绕过速率限制进行批量生成？
**A**: 批量生成脚本会自动遵守速率限制，但可以：
1. **分批生成**：每天生成30个工具
2. **多设备生成**：在不同设备上运行（设备ID不同）
3. **重置限制**：仅在测试时使用 `localStorage.removeItem('psp_api_calls')`

### Q8: 用户频繁刷新是否会消耗配额？
**A**: **不会**：
- 首页推荐API不消耗配额（单独计费）
- 缓存查询不消耗配额
- 只有**未缓存**的新搜索才消耗配额

---

## 总结

这套系统的核心优势：

✅ **速度快**：缓存查询 < 0.1秒
✅ **省成本**：缓存查询不消耗API配额
✅ **防滥用**：5秒冷却 + 30次/天限制
✅ **可扩展**：批量生成脚本持续扩充缓存库
✅ **用户友好**：实时显示配额，透明化管理

通过合理使用批量生成和缓存机制，可以在保证服务质量的同时，最大化降低API成本。
