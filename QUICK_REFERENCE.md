# Claude Code 配置快速参考

> 快速查询卡片 - 打印或收藏备用

## 🚀 立即生效

### ⚠️ 必须重启才能使用新配置

```powershell
# 1. 退出当前会话
exit

# 2. 重新启动
cd D:\zhipu\psp
claude

# 3. 测试配置
你：/smart-commit

# 应该自动执行提交流程 ✅
```

---

## 📁 配置文件位置

```
全局配置：
C:/Users/ahua/.claude/
├── settings.json              # 全局设置
└── skills/                    # 通用 Skills
    ├── smart-commit.md
    ├── code-review.md
    ├── run-tests.md
    ├── explain-code.md
    ├── build-project.md
    └── clean-project.md

项目配置：
D:\zhipu\psp\.claude/
├── settings.json              # Slash Commands
├── hooks.json                 # Hooks 配置
└── skills/                    # 项目特定 Skills
    ├── smart-commit.md
    ├── cloudflare-deploy.md
    └── analyze-performance.md
```

---

## 🎯 可用命令

### 全局（所有项目）

| 命令 | 功能 | 示例 |
|------|------|------|
| `/smart-commit [msg]` | 智能提交 | `/smart-commit "修复bug"` |
| `/review` | 代码审查 | `/review` |
| `/test` | 运行测试 | `/test` |
| `/explain <target>` | 解释代码 | `/explain src/App.tsx` |
| `/build [env]` | 构建项目 | `/build production` |
| `/clean` | 清理项目 | `/clean` |

### PSP 项目专属

| 命令 | 功能 | 示例 |
|------|------|------|
| `/commit` | 智能提交（定制版） | `/commit` |
| `/deploy [env]` | CF 部署 | `/deploy production` |
| `/cache-stats` | 缓存统计 | `/cache-stats` |
| `/cf-deploy [env]` | CF 部署（详细版） | `/cf-deploy preview` |
| `/analyze-perf` | 性能分析 | `/analyze-perf` |

---

## 🔄 配置优先级

```
1. 全局配置 (~/.claude/settings.json)
   ↓
2. 项目配置 (项目/.claude/settings.json)
   ↓
3. 合并（项目配置优先级更高）

Skills：
✅ 全局 Skills - 所有项目可用
✅ 项目 Skills - 仅当前项目可用
✅ 两者共存，不冲突
```

---

## 💡 日常使用

### 启动项目

```powershell
cd D:\zhipu\psp
claude

你：继续开发

我：✅ 恢复上下文...
   ✅ 加载全局配置...
   ✅ 加载项目配置...
   ✅ 准备就绪！
```

### 提交代码

```
你：/smart-commit "添加新功能"

我：✅ 分析更改...
   ✅ 生成提交信息...
   ✅ 执行提交和推送...
   完成！
```

### 部署到生产

```
你：/cf-deploy production

我：✅ 检查配置...
   ✅ 构建项目...
   ✅ 部署到 Cloudflare...
   ✅ 验证部署...
   完成！URL: https://...
```

---

## 📊 配置效果

### 之前（仅项目配置）

```
❌ 其他项目无法使用 /commit
❌ 每个项目都要重新配置
❌ 通用功能重复定义
```

### 现在（全局 + 项目）

```
✅ 所有项目可使用全局 Skills
✅ PSP 项目保留特定配置
✅ 配置清晰分离
✅ 一次配置，永久使用
```

---

## 🛠️ 故障排除

### 问题：命令不生效

**解决**：
1. 确认已重启 Claude Code
2. 检查配置文件是否存在
3. 查看错误信息

### 问题：Skill 未找到

**解决**：
1. 确认 Skill 文件在正确位置
2. 检查文件格式（YAML front matter）
3. 重启 Claude Code

### 问题：配置冲突

**解决**：
1. 检查全局和项目配置
2. 项目配置优先级更高
3. 全局和项目 Skills 共存，无冲突

---

## 📚 相关文档

- `CLAUDE_BEST_PRACTICES.md` - 最佳实践详细指南
- `GLOBAL_CLAUDE_CONFIG.md` - 全局配置完整说明
- `CLOUDFLARE_SETUP_TEMPLATE.md` - Cloudflare 配置模板

---

## ✅ 检查清单

使用前确认：

- [ ] 已重启 Claude Code
- [ ] 全局配置文件存在
- [ ] 项目配置文件存在
- [ ] 测试 `/smart-commit` 命令
- [ ] 测试项目专属命令

---

**最后更新**: 2026-01-14
**下次生效**: 重启后
