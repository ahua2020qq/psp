---
name: cf-deploy
description: 完整的 Cloudflare Pages 部署流程
parameters:
  - name: environment
    description: 部署环境（production/preview）
    required: false
    default: production
---

请执行完整的 Cloudflare Pages 部署流程：

1. **部署前检查**
   - 检查是否有未提交的更改
   - 检查 .env 和环境变量配置
   - 检查 wrangler.toml 配置

2. **构建项目**
   - npm run build
   - 检查 build/ 目录是否生成
   - 报告构建产物大小

3. **部署到 Cloudflare**
   - 如果是 production：
     - 提示用户确认："即将部署到生产环境，确认吗？"
     - 如果确认，执行：npx wrangler pages deploy build --project-name=psp
   - 如果是 preview：
     - 直接部署到预览环境

4. **验证部署**
   - 报告部署 URL
   - 如果有自定义域名，提醒 DNS 配置
   - 建议用户测试关键功能

5. **清理缓存**（可选）
   - 询问是否需要清理 KV Cache
   - 如果是，提供清理指令
