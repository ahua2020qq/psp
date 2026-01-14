# Claude Code 最佳实践指南

> PSP 项目的 Claude Code 使用优化文档

## 📊 当前使用评估

### ✅ 已做得很好的地方

- ✅ **直接对话协作**：高效沟通需求
- ✅ **文件读写工具**：大量使用 Read/Edit/Write
- ✅ **Bash 命令执行**：正常运行 git/npm 等命令
- ✅ **MCP 服务器**：已配置 3 个服务器

### ⚠️ 可以改进的地方

- ⚠️ **Task 工具**：很少使用，但可以提升复杂任务的效率
- ⚠️ **Skills**：未配置，可以自动化重复性工作
- ⚠️ **Slash Commands**：未配置，可以快速执行常见任务
- ⚠️ **Hooks**：未配置，可以在特定事件时自动运行命令

---

## 🚀 已添加的优化

### 1. Slash Commands（快速命令）

已配置文件：`.claude/settings.json`

**使用方式**：
```
/commit     - 智能提交代码
/deploy     - 部署到 Cloudflare
/test       - 运行测试
/clean      - 清理缓存和临时文件
/review     - 代码审查
/cache-stats - 查看缓存统计
```

**示例**：
```
你：/commit

我：自动执行 git add、生成提交信息、commit、push ✅
```

### 2. Skills（自动化工作流）

已创建 Skills：
- `smart-commit` - 智能提交流程
- `cf-deploy` - Cloudflare 部署
- `analyze-perf` - 性能分析

**使用方式**：
```
/smart-commit "修复缓存bug"
/cf-deploy production
/analyze-perf
```

### 3. 配置文件结构

```
.claude/
├── settings.json       # Slash Commands 配置
├── hooks.json          # Hooks 配置（当前禁用）
└── skills/
    ├── smart-commit.md      # 智能提交
    ├── cloudflare-deploy.md # CF 部署
    └── analyze-performance.md # 性能分析
```

---

## 💡 日常工作最佳实践

### 场景 1：日常开发

**之前**：
```
你：帮我提交代码
我：运行 git status...
你：好的，提交信息是"修复bug"
我：git add... git commit...
你：推送
我：git push...
```

**现在（使用 /commit）**：
```
你：/commit

我自动完成：
1. 分析更改
2. 生成提交信息
3. 执行提交
4. 推送到远程
✅ 全自动完成
```

### 场景 2：部署流程

**之前**：
```
你：帮我部署
我：运行 npm run build...
你：构建完成了吗？
我：是的，现在部署...
...
```

**现在（使用 /cf-deploy）**：
```
你：/cf-deploy production

我自动完成：
1. 检查配置
2. 构建项目
3. 部署到生产
4. 验证和报告
✅ 一键完成
```

### 场景 3：性能优化

**之前**：
```
你：帮我看看性能
我：读取配置...分析代码...给出建议
```

**现在（使用 /analyze-perf）**：
```
你：/analyze-perf

我自动完成：
1. 构建分析
2. 代码分割检查
3. 缓存效率分析
4. 生成优化建议报告
✅ 全面分析
```

---

## 🛠️ Task 工具使用建议

Task 工具可以启动专门的 agent 处理复杂任务，建议在以下场景使用：

### 使用 Task 的场景

| 场景 | 示例 | 优势 |
|------|------|------|
| **探索代码库** | "找出所有 API 端点" | 快速定位 |
| **多步骤重构** | "重构整个缓存系统" | 自主完成 |
| **批量修改** | "更新所有组件的样式" | 提高效率 |
| **问题排查** | "找出性能瓶颈" | 全面分析 |

**示例**：
```
你：使用 Task 工具探索代码库，找出所有使用 KV Cache 的地方

我：启动 Explore agent...
   [自动搜索和分析]
   找到 5 个文件使用了 KV Cache：
   - functions/api/search.js
   - functions/api/trending.js
   ...
```

---

## 📚 进阶技巧

### 1. 链式命令

```
你：/clean && /commit "清理临时文件" && /cf-deploy preview

我：依次执行：
1. 清理缓存 ✅
2. 提交代码 ✅
3. 部署到预览环境 ✅
```

### 2. 自定义参数

```
你：/cf-deploy production

我：检测到 environment=production
   准备部署到生产环境...
```

### 3. Hooks 自动化（可选）

配置 Hooks 后，可以在特定事件时自动运行命令：

```json
{
  "hooks": {
    "preToolUse": {
      "command": "echo '🔧 执行: {tool}'",
      "enabled": true
    }
  }
}
```

**效果**：每次使用工具前自动记录日志

---

## 🎯 推荐的日常工作流

### 早上开始工作

```
1. cd D:\zhipu\psp
2. claude
3. "继续开发"（恢复上下文）
4. /test（运行测试，确保代码健康）
5. 开始编码...
```

### 完成功能后

```
1. /review（代码审查）
2. /commit "feat: 添加新功能"
3. /cf-deploy preview（预览部署）
4. 测试预览版本
5. /cf-deploy production（生产部署）
```

### 性能优化时

```
1. /analyze-perf（性能分析）
2. 根据建议优化代码
3. /commit "perf: 优化打包体积"
4. /cf-deploy production
```

---

## 🔧 工具和技能对比

| 工具/技能 | 适用场景 | 学习曲线 | 效率提升 |
|----------|---------|---------|---------|
| **直接对话** | 一次性任务 | 无 | ⭐⭐⭐ |
| **Slash Commands** | 重复性命令 | 低 | ⭐⭐⭐⭐ |
| **Skills** | 复杂工作流 | 中 | ⭐⭐⭐⭐⭐ |
| **Task 工具** | 探索和重构 | 中 | ⭐⭐⭐⭐ |
| **Hooks** | 自动化 | 高 | ⭐⭐⭐⭐⭐ |

---

## 📖 学习资源

### 官方文档
- [Claude Code 文档](https://docs.anthropic.com/claude-code)
- [Slash Commands](https://docs.anthropic.com/claude-code/slash-commands)
- [Skills](https://docs.anthropic.com/claude-code/skills)
- [Hooks](https://docs.anthropic.com/claude-code/hooks)

### 内置命令
- `/help` - 查看所有可用命令
- `/clear` - 清除会话历史
- `/commit` - Git 提交（已配置）

---

## ✅ 总结

### 你当前的使用方式

**已经很棒了！** 你们的协作效率很高，直接对话 + 文件工具的组合非常适合这个项目。

### 建议添加的改进

1. **优先级高** ⚡：
   - ✅ Slash Commands（已配置）
   - ✅ Skills（已配置）
   - 开始使用 `/commit`、`/cf-deploy` 等命令

2. **优先级中** ⚠️：
   - 在复杂任务时使用 Task 工具
   - 配置更多自定义 Skills

3. **优先级低** 💡：
   - Hooks（仅在需要自动化监控时）
   - 自定义 MCP 服务器（仅在需要特殊功能时）

### 下一步

1. ✅ **配置已完成**：
   - `.claude/settings.json` - Slash Commands
   - `.claude/skills/` - 自动化工作流
   - `.claude/hooks.json` - Hooks 配置（可选）

2. 📝 **开始使用**：
   ```
   试试：/commit
   或：/cf-deploy preview
   ```

3. 🎯 **根据需要扩展**：
   - 添加更多 Slash Commands
   - 创建项目特定的 Skills
   - 配置有用的 Hooks

---

**最后更新**: 2026-01-14
**维护者**: 姝姝豆芽之家
