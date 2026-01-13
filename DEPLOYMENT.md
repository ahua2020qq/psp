# Cloudflare Pages 部署指南

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
# 方法1：使用npm script（需要先启动worker）
npm run dev:worker  # 在一个终端
npm run dev:vite    # 在另一个终端

# 方法2：手动启动
# 终端1：启动worker
npx wrangler dev --port 8788 --local

# 终端2：启动vite
npx vite --port 3000
```

3. 访问 http://localhost:3000

## 部署到Cloudflare Pages

### 方法1：通过Wrangler CLI部署（推荐）

1. 登录Cloudflare：
```bash
npx wrangler login
```

2. 构建项目：
```bash
npm run build
```

3. 部署：
```bash
npx wrangler pages deploy build --project-name=douya-chat
```

### 方法2：通过Git仓库部署

1. 将代码推送到GitHub/GitLab

2. 在Cloudflare Dashboard中：
   - 创建新的Pages项目
   - 连接到你的Git仓库
   - 构建命令：`npm run build`
   - 输出目录：`build`
   - Node.js版本：`18`或更高

### 设置环境变量（重要！）

在Cloudflare Pages Dashboard中设置以下环境变量和密钥：

**方式1：通过Dashboard**
1. 进入你的Pages项目设置
2. 点击"Environment variables"
3. 添加以下变量：

**方式2：通过Wrangler CLI**
```bash
# 设置项目（首次部署后）
npx wrangler pages project create douya-chat --production-branch=main

# 设置环境变量和密钥
npx wrangler pages secret put VOLC_ARK_API_KEY --project-name=douya-chat
npx wrangler pages secret put DEEPSEEK_API_KEY --project-name=douya-chat
```

**需要设置的密钥：**
- `VOLC_ARK_API_KEY`: 火山方舟API密钥
- `DEEPSEEK_API_KEY`: DeepSeek API密钥

## 验证部署

部署完成后，访问 https://douya.chat 或你的Cloudflare Pages URL：

1. 检查首页推荐是否正常加载
2. 搜索"mysql"测试搜索功能
3. 检查浏览器控制台是否有错误

## 故障排查

### 问题1：API调用失败，转圈圈
- 检查环境变量是否正确设置
- 检查functions/api/search.js是否存在
- 查看Cloudflare Dashboard中的日志

### 问题2：CORS错误
- 确保functions/api/search.js中设置了CORS头
- 检查前端API调用的URL是否正确

### 问题3：数据格式不匹配
- 检查Prompt模板返回的数据结构
- 确保前端组件期望的字段存在

## 项目结构

```
psp/
├── build/              # 构建输出（部署到Cloudflare Pages）
├── functions/          # Cloudflare Pages Functions
│   └── api/
│       └── search.js   # LLM API代理
├── src/                # 源代码
│   ├── api/
│   │   └── llmApi.ts   # 前端API调用
│   └── components/     # React组件
├── .dev.vars           # 本地开发环境变量（不提交）
├── .gitignore          # Git忽略文件
├── package.json        # 项目配置
└── vite.config.ts      # Vite配置
```

## 安全注意事项

1. **永远不要提交** `.env`、`.dev.vars` 或任何包含API密钥的文件
2. 在生产环境中使用Cloudflare环境变量/密钥存储敏感信息
3. Prompt模板存储在`functions/api/search.js`中，不会暴露给前端用户
4. API密钥只在服务器端使用，前端无法访问
