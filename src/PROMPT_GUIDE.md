# ToolSearch 提示词工程指南

## 概述

ToolSearch 是一个基于大模型提示词驱动的程序员工具搜索平台。核心思想是通过精心设计的提示词，让大模型提供全面、准确、实用的工具信息，无需维护复杂的数据库。

## 核心设计理念

1. **极简交互** - 只需一个搜索框，输入工具名即可
2. **智能纠错** - 支持拼写错误自动纠正（如 myql → mysql）
3. **个性化推荐** - 基于Cookie中的用户偏好提供定制化推荐
4. **全面信息** - 一次搜索获取下载、安装、避坑、命令等完整信息

## 两套核心提示词

### 1. 缺省推荐提示词 (generateDefaultPrompt)

**触发时机：** 用户打开页面，未输入任何搜索词时（延迟0.5秒自动触发）

**用途：** 根据用户画像生成个性化工具推荐

**用户画像来源：**
- 从 localStorage 读取用户偏好信息（脱敏）
- 包含：技术栈、使用场景、环境偏好、工具偏好

**输出结构：**
```typescript
{
  personalizedTop5: [...]  // 个性化排行前5
  popularTop3: [...]       // 热门工具前3
  nicheTop2: [...]         // 小众专精前2
}
```

**关键特性：**
- 根据用户画像调整推荐优先级
- 技术栈匹配度最高的工具排前
- 兼容用户环境（Windows/Linux/macOS/龙芯架构等）
- 符合用户偏好（开源免费/轻量型/企业级等）

**提示词结构：**
1. 用户画像描述
2. 三类推荐要求（个性化/热门/小众）
3. 每个工具的完整信息字段（20+字段）
4. 排序规则和注意事项

### 2. 精准搜索提示词 (generateSearchPrompt)

**触发时机：** 用户输入工具名并点击搜索或按回车

**用途：** 提供全面、深度的工具信息

**搜索意图识别：**
- **精确查询** - 明确的工具名（如 "MySQL", "Zabbix"）
- **模糊查询** - 类别描述（如 "监控工具", "Java打包工具"）
- **场景查询** - 场景描述（如 "龙芯架构做数据分析用什么"）

**拼写纠错支持：**
```typescript
const corrections = {
  'myql': 'mysql',
  'zabbxi': 'zabbix',
  'npn': 'npm',
  'dcoker': 'docker',
  'ngnix': 'nginx'
  // ... 更多常见错误
}
```

**输出结构：**
```typescript
{
  searchIntent: "精确查询 / 模糊查询 / 场景查询",
  correctedQuery: "纠正后的查询词（如有拼写错误）",
  resultCount: 3,
  searchTime: "0.1秒",
  results: [
    {
      // 完整的工具信息（30+字段）
      name, rating, category, tags,
      corePositioning, coreUsage, applicableScenarios,
      downloadUrl: { mirror, official },
      installation: { ubuntu, centos, windows, macos, docker },
      compatibility: { os, architecture, languages },
      updateInfo: { latestVersion, updateDate },
      coreAdvantages, alternatives,
      commonIssues: [
        { problem, affectedRate, symptoms, solution, preventionTips }
      ],
      commonCommands, quickStart, offlineAvailable
    }
  ],
  relatedTools: [...]  // 相关推荐工具
}
```

**信息维度设计（照顾所有痛点）：**

1. **下载痛点** - 优先提供国内镜像（aliyun/腾讯云/华为云）
2. **安装痛点** - 按系统分类，只给核心命令（1-3步）
3. **兼容性痛点** - 明确支持的系统、架构（特别是龙芯）
4. **踩坑痛点** - Top3常见问题 + 解决方案 + 影响率
5. **上手痛点** - 常用命令 + 快速开始指南
6. **选型痛点** - 核心优势 + 替代工具对比

## 提示词优化策略

### 动态调整
- 根据用户画像调整推荐权重
- 根据环境偏好调整安装步骤展示顺序
- 根据技术栈调整工具分类优先级

### 信息完整性
- 所有信息必须真实，不得编造
- 不确定的信息标注"待补充"
- 版本号、更新日期必须准确

### 实用性优先
- 安装步骤只给核心命令，避免冗余
- 下载地址优先国内镜像
- 常见问题必须是高频问题（20%+用户遇到）

## 使用示例

### 示例1：首页缺省推荐

**用户画像：**
```typescript
{
  techStack: ['Python', 'Go', 'JavaScript'],
  usageScenarios: ['项目开发', '数据分析', '系统监控'],
  environment: ['Linux', 'macOS'],
  toolPreferences: ['开源免费', '文档完善', '社区活跃']
}
```

**提示词生成：**
```
# 任务：生成程序员工具个性化推荐

## 用户画像
技术栈：Python、Go、JavaScript
使用场景：项目开发、数据分析、系统监控
环境偏好：Linux、macOS
工具偏好：开源免费、文档完善、社区活跃

## 输出要求
请按照以下结构输出三类推荐...
[完整提示词见 /utils/prompts.ts]
```

**输出结果：**
- 个性化Top5：Docker, Prometheus, PostgreSQL, VS Code, Redis
- 热门Top3：Git, Node.js, Nginx
- 小众Top2：fd (find替代), ripgrep (grep替代)

### 示例2：精准搜索

**搜索查询：** "myql"（拼写错误）

**提示词生成：**
```
# 任务：精准搜索程序员工具并提供全面信息

## 搜索查询
用户搜索：「myql」

## 用户画像（用于个性化排序）
[用户画像信息]

## 任务说明
1. 识别用户意图：检测到拼写错误，纠正为 "mysql"
2. 排序规则：精确匹配优先...
[完整提示词见 /utils/prompts.ts]
```

**输出结果：**
```typescript
{
  searchIntent: "精确查询",
  correctedQuery: "mysql",
  resultCount: 1,
  results: [{
    name: "MySQL",
    rating: 5,
    downloadUrl: {
      mirror: "https://mirrors.aliyun.com/mysql/",
      official: "https://dev.mysql.com/downloads/"
    },
    installation: {
      ubuntu: ["sudo apt update", "sudo apt install mysql-server"],
      ...
    },
    commonIssues: [
      {
        problem: "远程连接被拒绝",
        affectedRate: "35%用户遇到",
        solution: "修改 bind-address=0.0.0.0 并开放3306端口"
      },
      ...
    ]
  }]
}
```

## 接入真实大模型

当前使用模拟数据，接入真实大模型只需修改 `/utils/mockLLM.ts`：

```typescript
// 替换 mockLLMCall 函数
export async function callRealLLM(prompt: string): Promise<any> {
  const response = await fetch('YOUR_LLM_API_ENDPOINT', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 4000
    })
  });
  
  const data = await response.json();
  return JSON.parse(data.content);
}
```

## 提示词优化建议

1. **定期更新工具数据库** - 保持版本号、更新日期准确
2. **收集用户反馈** - 优化常见问题和解决方案
3. **扩展拼写纠错库** - 添加更多常见错误拼写
4. **优化排序算法** - 根据用户行为调整推荐权重
5. **增加场景模板** - 预设常见使用场景的提示词

## 技术栈

- **前端框架：** React + TypeScript
- **样式：** Tailwind CSS
- **存储：** LocalStorage（用户偏好、收藏）
- **大模型：** 待接入（当前使用模拟数据）

## 文件结构

```
/utils/
  prompts.ts      - 提示词生成核心逻辑
  mockLLM.ts      - 模拟大模型调用（包含示例数据）
  storage.ts      - 本地存储管理
/components/
  SearchBox.tsx          - 搜索框（支持联想、纠错）
  RecommendSection.tsx   - 推荐区域
  SearchResults.tsx      - 搜索结果展示
  ToolDetailCard.tsx     - 工具详情卡片
  ToolCard.tsx           - 工具卡片
  FavoritesModal.tsx     - 收藏夹弹窗
/App.tsx         - 主应用
```

## 总结

ToolSearch的核心竞争力在于**精心设计的提示词**，而非复杂的数据库。两套提示词（缺省推荐+精准搜索）覆盖了程序员找工具的所有场景，输出的信息全面、实用、可落地。只需接入大模型API，即可快速上线。
