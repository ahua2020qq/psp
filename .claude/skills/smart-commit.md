---
name: smart-commit
description: 智能提交代码：自动分析更改、生成符合规范的提交信息、并提交推送
parameters:
  - name: message
    description: 自定义提交信息（可选，不提供则自动生成）
    required: false
---

请执行以下智能提交流程：

1. **分析更改**
   - 运行 git status 查看更改的文件
   - 运行 git diff 查看具体更改内容
   - 分析更改的类型（feat/fix/docs/refactor等）

2. **生成提交信息**
   - 如果提供了 {message}，使用它作为提交信息
   - 如果未提供，自动分析更改并生成语义化的提交信息
   - 格式：`<type>: <description>`
   - 添加 Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

3. **执行提交**
   - git add .
   - git commit（使用生成的提交信息）
   - git push origin main

4. **报告结果**
   - 显示提交的哈希
   - 显示提交信息
   - 确认推送成功

5. **检查 CI/CD**（可选）
   - 如果配置了 Cloudflare Pages 自动部署，提示用户检查部署状态
