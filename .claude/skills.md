# Claude Skills 配置指南

> Skills 是可重用的自动化工作流，可以显著提升开发效率

## 📚 什么是 Skills？

Skills 是预定义的工作流程，类似于函数，可以：
- 接受参数
- 执行复杂任务
- 返回结果

**示例**：定义一个 `deploy-production` skill，自动完成：
1. 运行测试
2. 构建项目
3. 部署到 Cloudflare
4. 验证部署
5. 发送通知

## 🎯 推荐的 Skills（需要配置）

### 1. Git 工作流 Skill

**文件**: `.claude/skills/git-workflow.md`

```markdown
---
name: git-workflow
description: 完整的 Git 工作流：拉取、提交、推送
---

请执行以下步骤：
1. git pull origin main
2. 检查 git status
3. 询问用户提交信息
4. git add .
5. git commit -m "{message}"
6. git push origin main
```

**使用方式**:
```
用户：/git-workflow "修复缓存bug"

我自动执行完整流程 ✅
```

### 2. 部署 Skill

**文件**: `.claude/skills/deploy.md`

```markdown
---
name: deploy
description: 部署到 Cloudflare Pages
parameters:
  - name: environment
    description: 部署环境 (production/preview)
    required: false
    default: preview
---

请执行部署流程：
1. 检查环境变量配置
2. npm run build
3. 检查构建结果
4. 询问是否部署到 {environment}
5. 如果确认，执行 wrangler pages deploy
6. 报告部署 URL
```

**使用方式**:
```
用户：/deploy production

我自动完成生产部署 ✅
```

### 3. 测试 Skill

**文件**: `.claude/skills/test.md`

```markdown
---
name: test
description: 运行测试套件
---

请执行：
1. npm test（如果有）
2. 检查 TypeScript 类型错误
3. 检查 ESLint 错误
4. 生成测试报告
```

## 🔧 如何配置 Skills

### 方式 1: 在项目中创建 Skills 目录

```bash
mkdir .claude/skills
# 创建 skill 文件
echo "---" > .claude/skills/deploy.md
```

### 方式 2: 全局 Skills（推荐）

```bash
# Windows
%USERPROFILE%\.claude\skills\

# 创建全局 skill
mkdir -p ~/.claude/skills
```

## 💡 当前 PSP 项目可以创建的 Skills

### Skill 1: Cache 预热

```markdown
---
name: warm-cache
description: 预热常用工具的 KV Cache
---

请批量生成以下工具的缓存数据：
- Zabbix, MySQL, Docker, Git, Redis
- Nginx, PostgreSQL, Kubernetes, Jenkins

调用批量生成脚本，并报告成功数量。
```

### Skill 2: 性能检查

```markdown
---
name: perf-check
description: 检查应用性能指标
---

请检查：
1. 打包体积大小
2. Lighthouse 性能分数（如果可以）
3. 缓存命中率
4. API 响应时间
5. 生成性能报告
```

### Skill 3: 依赖更新

```markdown
---
name: update-deps
description: 更新项目依赖
---

请执行：
1. npm outdated
2. 询问是否更新
3. npm update
4. 运行测试确保兼容性
5. 报告更新内容
```

## 🎮 使用示例

```
用户：/warm-cache

我：🔥 开始预热缓存...
    ✅ Zabbix - 已缓存
    ✅ MySQL - 已缓存
    ✅ Docker - 已缓存
    ...
    共 10 个工具已缓存
```

## 📚 相关资源

- [Claude Code Skills 文档](https://docs.anthropic.com/claude-code/skills)
- [Slash Commands 文档](https://docs.anthropic.com/claude-code/slash-commands)
- [Hooks 文档](https://docs.anthropic.com/claude-code/hooks)
