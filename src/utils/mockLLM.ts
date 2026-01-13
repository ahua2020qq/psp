// 模拟大模型调用 - 用于演示，实际使用时替换为真实API

/**
 * 模拟大模型调用
 * 实际使用时，这里应该调用真实的大模型API
 */
export function mockLLMCall(prompt: string, type: 'default' | 'search', query?: string): any {
  console.log('=== 大模型提示词 ===');
  console.log(prompt);
  console.log('==================');

  if (type === 'default') {
    return generateMockRecommendations();
  } else {
    return generateMockSearchResults(query || '');
  }
}

/**
 * 生成模拟推荐数据
 */
function generateMockRecommendations() {
  return {
    personalizedTop5: [
      {
        name: 'Docker',
        rating: 5,
        category: '开发工具',
        coreUsage: '容器化应用部署和管理',
        applicableScenarios: '微服务架构、CI/CD流程、开发环境一致性',
        quickStart: 'docker run hello-world',
        updateDate: '2025-12-20',
        latestVersion: 'v24.0.7'
      },
      {
        name: 'Prometheus',
        rating: 5,
        category: '运维监控',
        coreUsage: '云原生监控和告警系统',
        applicableScenarios: 'Kubernetes监控、微服务监控、时序数据采集',
        quickStart: 'prometheus --config.file=prometheus.yml',
        updateDate: '2025-12-15',
        latestVersion: 'v2.48.0'
      },
      {
        name: 'PostgreSQL',
        rating: 5,
        category: '数据库',
        coreUsage: '开源关系型数据库',
        applicableScenarios: '复杂查询、JSONB存储、地理信息系统',
        quickStart: 'createdb mydb',
        updateDate: '2025-11-30',
        latestVersion: 'v16.1'
      },
      {
        name: 'VS Code',
        rating: 5,
        category: '开发工具',
        coreUsage: '轻量级代码编辑器',
        applicableScenarios: '多语言开发、插件生态丰富、远程开发',
        quickStart: 'code .',
        updateDate: '2025-12-28',
        latestVersion: 'v1.85.2'
      },
      {
        name: 'Redis',
        rating: 5,
        category: '数据库',
        coreUsage: '高性能键值存储和缓存',
        applicableScenarios: '缓存、会话管理、消息队列、实时排行榜',
        quickStart: 'redis-cli',
        updateDate: '2025-12-10',
        latestVersion: 'v7.2.4'
      }
    ],
    popularTop3: [
      {
        name: 'Git',
        rating: 5,
        category: '开发工具',
        coreUsage: '分布式版本控制系统',
        applicableScenarios: '代码版本管理、团队协作、开源贡献',
        quickStart: 'git init',
        updateDate: '2025-12-01',
        latestVersion: 'v2.43.0'
      },
      {
        name: 'Node.js',
        rating: 5,
        category: '开发工具',
        coreUsage: 'JavaScript运行时环境',
        applicableScenarios: '后端开发、工具开发、前端工程化',
        quickStart: 'node app.js',
        updateDate: '2025-12-18',
        latestVersion: 'v20.10.0'
      },
      {
        name: 'Nginx',
        rating: 5,
        category: '系统工具',
        coreUsage: '高性能Web服务器和反向代理',
        applicableScenarios: '静态文件服务、负载均衡、反向代理',
        quickStart: 'nginx -s reload',
        updateDate: '2025-11-25',
        latestVersion: 'v1.25.3'
      }
    ],
    nicheTop2: [
      {
        name: 'fd',
        rating: 5,
        category: '系统工具',
        coreUsage: '更快更友好的find替代品',
        applicableScenarios: '文件搜索、批量操作、脚本编写',
        painPointDescription: '比 find 快 10 倍的文件搜索工具，支持彩色输出和正则表达式',
        quickStart: 'fd pattern',
        updateDate: '2025-10-15',
        latestVersion: 'v9.0.0'
      },
      {
        name: 'ripgrep',
        rating: 5,
        category: '系统工具',
        coreUsage: '超快的代码搜索工具',
        applicableScenarios: '代码搜索、日志分析、文本查找',
        painPointDescription: '比 grep 快 5-10 倍，自动忽略 .gitignore 文件，程序员必备',
        quickStart: 'rg pattern',
        updateDate: '2025-11-08',
        latestVersion: 'v14.0.3'
      }
    ]
  };
}

/**
 * 生成模拟搜索结果
 */
function generateMockSearchResults(query: string): any {
  const normalizedQuery = query.toLowerCase().trim();
  
  // 拼写纠错
  const corrections: Record<string, string> = {
    'myql': 'mysql',
    'mysq': 'mysql',
    'mysqk': 'mysql',
    'zabbxi': 'zabbix',
    'zabbi': 'zabbix',
    'npn': 'npm',
    'nmp': 'npm',
    'dcoker': 'docker',
    'dokcer': 'docker',
    'postgre': 'postgresql',
    'postgres': 'postgresql',
    'redi': 'redis',
    'rediss': 'redis',
    'ngnix': 'nginx',
    'nigix': 'nginx'
  };

  let correctedQuery = normalizedQuery;
  let hasCorrected = false;

  for (const [wrong, correct] of Object.entries(corrections)) {
    if (normalizedQuery.includes(wrong)) {
      correctedQuery = normalizedQuery.replace(wrong, correct);
      hasCorrected = true;
      break;
    }
  }

  // 根据查询返回对应的工具
  const toolDatabase: Record<string, any> = {
    'mysql': generateMySQLTool(),
    'zabbix': generateZabbixTool(),
    'docker': generateDockerTool(),
    'git': generateGitTool(),
    'redis': generateRedisTool(),
    'nginx': generateNginxTool(),
    'postgresql': generatePostgreSQLTool(),
    'prometheus': generatePrometheusTool()
  };

  // 查找匹配的工具
  const results: any[] = [];
  for (const [key, tool] of Object.entries(toolDatabase)) {
    if (correctedQuery.includes(key)) {
      results.push(tool);
    }
  }

  // 如果没有精确匹配，尝试模糊匹配
  if (results.length === 0) {
    if (correctedQuery.includes('监控') || correctedQuery.includes('monitor')) {
      results.push(generateZabbixTool(), generatePrometheusTool());
    } else if (correctedQuery.includes('数据库') || correctedQuery.includes('database')) {
      results.push(generateMySQLTool(), generatePostgreSQLTool(), generateRedisTool());
    } else if (correctedQuery.includes('容器') || correctedQuery.includes('container')) {
      results.push(generateDockerTool());
    } else {
      // 默认返回热门工具
      results.push(generateDockerTool(), generateGitTool());
    }
  }

  return {
    searchIntent: results.length === 1 ? '精确查询' : '模糊查询',
    correctedQuery: hasCorrected ? correctedQuery : null,
    originalQuery: query,
    resultCount: results.length,
    searchTime: '0.1秒',
    results: results.slice(0, 5),
    relatedTools: [
      { 
        name: 'Grafana', 
        category: '运维监控', 
        reason: '常与监控工具搭配使用',
        relationTag: '搭配使用'
      },
      { 
        name: 'Kubernetes', 
        category: '开发工具', 
        reason: '容器编排推荐',
        relationTag: '进阶工具'
      },
      { 
        name: 'Jenkins', 
        category: '开发工具', 
        reason: 'CI/CD流程工具',
        relationTag: '搭配使用'
      }
    ]
  };
}

// ===== 各工具详细信息生成函数 =====

function generateMySQLTool() {
  return {
    name: 'MySQL',
    officialAlias: 'MySQL Community Server',
    rating: 5,
    category: '数据库',
    tags: ['关系型数据库', 'SQL', '开源'],
    corePositioning: '最流行的开源关系型数据库',
    coreUsage: '结构化数据存储、事务处理、多用户并发访问',
    applicableScenarios: 'Web应用后端存储、电商系统、内容管理系统、数据分析',
    targetUsers: '后端开发、数据库管理员、全栈工程师',
    downloadUrl: {
      mirror: 'https://mirrors.aliyun.com/mysql/',
      official: 'https://dev.mysql.com/downloads/'
    },
    installation: {
      ubuntu: ['sudo apt update', 'sudo apt install mysql-server'],
      centos: ['sudo yum install mysql-server', 'sudo systemctl start mysqld'],
      windows: ['下载MySQL Installer', '运行安装向导选择Developer Default'],
      docker: 'docker run --name mysql -e MYSQL_ROOT_PASSWORD=mypassword -d mysql:8.0'
    },
    compatibility: {
      os: ['Windows', 'Linux', 'macOS'],
      architecture: ['x86_64', 'ARM64']
    },
    updateInfo: {
      latestVersion: 'v8.0.35',
      updateDate: '2025-12-15',
      updateFrequency: '每月安全更新'
    },
    coreAdvantages: ['成熟稳定', '文档完善', '生态丰富', '性能优秀'],
    alternatives: ['PostgreSQL', 'MariaDB'],
    commonIssues: [
      {
        problem: '远程连接被拒绝',
        affectedRate: '35%用户遇到',
        solution: '修改 bind-address=0.0.0.0 并开放3306端口，授予远程用户权限'
      },
      {
        problem: '字符集乱码',
        affectedRate: '25%用户遇到',
        solution: '设置 character-set-server=utf8mb4 并重启服务'
      },
      {
        problem: '忘记root密码',
        affectedRate: '20%用户遇到',
        solution: '使用 --skip-grant-tables 启动后重置密码'
      }
    ],
    commonCommands: [
      'mysql -u root -p  # 登录MySQL',
      'CREATE DATABASE dbname;  # 创建数据库',
      'SHOW DATABASES;  # 查看所有数据库',
      'USE dbname;  # 切换数据库',
      'SHOW TABLES;  # 查看表列表'
    ],
    quickStart: '安装后运行 mysql -u root -p 登录，创建数据库开始使用',
    offlineAvailable: true
  };
}

function generateZabbixTool() {
  return {
    name: 'Zabbix',
    officialAlias: 'Zabbix Monitoring Solution',
    rating: 5,
    category: '运维监控',
    tags: ['监控', '告警', '可视化'],
    corePositioning: '企业级分布式监控解决方案',
    coreUsage: '服务器、网络设备、应用程序监控和告警',
    applicableScenarios: '集群监控、性能分析故障预警、容量规划',
    targetUsers: '运维工程师、系统管理员、DevOps',
    downloadUrl: {
      mirror: 'https://mirrors.aliyun.com/zabbix/',
      official: 'https://www.zabbix.com/download'
    },
    installation: {
      ubuntu: [
        'wget https://repo.zabbix.com/zabbix/6.4/ubuntu/pool/main/z/zabbix-release/zabbix-release_6.4-1+ubuntu22.04_all.deb',
        'sudo dpkg -i zabbix-release_6.4-1+ubuntu22.04_all.deb',
        'sudo apt update && sudo apt install zabbix-server-mysql zabbix-frontend-php'
      ],
      centos: [
        'rpm -Uvh https://repo.zabbix.com/zabbix/6.4/rhel/8/x86_64/zabbix-release-6.4-1.el8.noarch.rpm',
        'yum install zabbix-server-mysql zabbix-web-mysql'
      ],
      docker: 'docker-compose up -d # 使用官方docker-compose.yml'
    },
    compatibility: {
      os: ['Linux', 'Windows (Agent)'],
      architecture: ['x86_64', 'ARM64']
    },
    updateInfo: {
      latestVersion: 'v6.4.10',
      updateDate: '2026-01-03',
      updateFrequency: '每月更新'
    },
    coreAdvantages: ['功能全面', '支持分布式', '可视化强大', '告警灵活'],
    alternatives: ['Prometheus+Grafana', 'Nagios'],
    commonIssues: [
      {
        problem: 'Agent端口10050无法连接',
        affectedRate: '30%用户遇到',
        solution: '检查防火墙规则，开放10050端口：firewall-cmd --add-port=10050/tcp --permanent'
      },
      {
        problem: '告警不触发',
        affectedRate: '25%用户遇到',
        solution: '检查触发器条件和告警动作配置，确认媒体类型已启用'
      },
      {
        problem: 'Web界面502错误',
        affectedRate: '15%用户遇到',
        solution: '检查PHP-FPM服务状态和Nginx配置，重启相关服务'
      }
    ],
    commonCommands: [
      'systemctl start zabbix-server  # 启动服务',
      'systemctl status zabbix-agent  # 查看Agent状态',
      'zabbix_get -s 127.0.0.1 -k system.cpu.load  # 测试监控项'
    ],
    quickStart: '安装后配置数据库，访问Web界面完成初始化向导',
    offlineAvailable: false
  };
}

function generateDockerTool() {
  return {
    name: 'Docker',
    officialAlias: 'Docker Engine',
    rating: 5,
    category: '开发工具',
    tags: ['容器', '虚拟化', '微服务'],
    corePositioning: '应用容器化平台',
    coreUsage: '容器化应用部署、环境一致性、资源隔离',
    applicableScenarios: '微服务架构、CI/CD、开发测试环境、应用分发',
    targetUsers: '开发工程师、DevOps、架构师',
    downloadUrl: {
      mirror: 'https://mirrors.aliyun.com/docker-ce/',
      official: 'https://www.docker.com/get-started'
    },
    installation: {
      ubuntu: [
        'curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun',
        'sudo usermod -aG docker $USER'
      ],
      centos: [
        'sudo yum install -y yum-utils',
        'sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo',
        'sudo yum install docker-ce'
      ],
      macos: ['下载Docker Desktop for Mac', '拖拽到Applications安装'],
      windows: ['下载Docker Desktop for Windows', '运行安装程序']
    },
    compatibility: {
      os: ['Linux', 'macOS', 'Windows 10+'],
      architecture: ['x86_64', 'ARM64']
    },
    updateInfo: {
      latestVersion: 'v24.0.7',
      updateDate: '2025-12-20',
      updateFrequency: '每月更新'
    },
    coreAdvantages: ['轻量快速', '环境一致', '生态丰富', '易于部署'],
    alternatives: ['Podman', 'containerd'],
    commonIssues: [
      {
        problem: '镜像拉取超时',
        affectedRate: '40%用户遇到',
        solution: '配置国内镜像加速器：编辑 /etc/docker/daemon.json 添加 registry-mirrors'
      },
      {
        problem: '权限被拒绝',
        affectedRate: '30%用户遇到',
        solution: '将用户加入docker组：sudo usermod -aG docker $USER 并重新登录'
      },
      {
        problem: '容器无法访问外网',
        affectedRate: '15%用户遇到',
        solution: '检查iptables规则DNS配置，重启Docker服务'
      }
    ],
    commonCommands: [
      'docker pull image:tag  # 拉取镜像',
      'docker run -d -p 8080:80 nginx  # 运行容器',
      'docker ps  # 查看运行中的容器',
      'docker logs container_id  # 查看日志',
      'docker exec -it container_id bash  # 进入容器'
    ],
    quickStart: '安装后运行 docker run hello-world 验证环境',
    offlineAvailable: true
  };
}

function generateGitTool() {
  return {
    name: 'Git',
    officialAlias: 'Git SCM',
    rating: 5,
    category: '开发工具',
    tags: ['版本控制', '协作', '开源'],
    corePositioning: '分布式版本控制系统',
    coreUsage: '代码版本管理、分支管理、团队协作',
    applicableScenarios: '软件开发、文档管理、配置管理、开源协作',
    targetUsers: '所有开发人员',
    downloadUrl: {
      mirror: 'https://mirrors.aliyun.com/git-for-windows/',
      official: 'https://git-scm.com/downloads'
    },
    installation: {
      ubuntu: ['sudo apt update', 'sudo apt install git'],
      centos: ['sudo yum install git'],
      macos: ['brew install git'],
      windows: ['下载Git for Windows安装包', '运行安装向导']
    },
    compatibility: {
      os: ['Windows', 'Linux', 'macOS'],
      architecture: ['x86_64', 'ARM64']
    },
    updateInfo: {
      latestVersion: 'v2.43.0',
      updateDate: '2025-12-01',
      updateFrequency: '每月更新'
    },
    coreAdvantages: ['分布式架构', '分支管理强大', '速度快', '社区活跃'],
    alternatives: ['Mercurial', 'SVN'],
    commonIssues: [
      {
        problem: 'push被拒绝',
        affectedRate: '35%用户遇到',
        solution: '先执行 git pull --rebase 合并远程更新后再push'
      },
      {
        problem: '合并冲突',
        affectedRate: '30%用户遇到',
        solution: '手动编辑冲突文件，解决冲突标记后 git add 和 git commit'
      },
      {
        problem: 'SSH连接失败',
        affectedRate: '20%用户遇到',
        solution: '生成SSH密钥并添加到GitHub/GitLab：ssh-keygen -t ed25519'
      }
    ],
    commonCommands: [
      'git clone url  # 克隆仓库',
      'git add .  # 添加到暂存区',
      'git commit -m "message"  # 提交',
      'git push  # 推送到远程',
      'git pull  # 拉取更新',
      'git branch  # 查看分支'
    ],
    quickStart: 'git init 初始化仓库，git add . 和 git commit 开始使用',
    offlineAvailable: true
  };
}

function generateRedisTool() {
  return {
    name: 'Redis',
    rating: 5,
    category: '数据库',
    tags: ['键值存储', '缓存', '内存数据库'],
    corePositioning: '高性能键值存储',
    coreUsage: '缓存、会话管理、消息队列、实时计数',
    applicableScenarios: '缓存层、排行榜、计数器、分布式锁',
    downloadUrl: {
      mirror: 'https://mirrors.aliyun.com/redis/',
      official: 'https://redis.io/download'
    },
    installation: {
      ubuntu: ['sudo apt install redis-server'],
      docker: 'docker run -d -p 6379:6379 redis:7'
    },
    updateInfo: {
      latestVersion: 'v7.2.4',
      updateDate: '2025-12-10'
    },
    commonCommands: [
      'redis-cli  # 连接Redis',
      'SET key value  # 设置值',
      'GET key  # 获取值'
    ]
  };
}

function generateNginxTool() {
  return {
    name: 'Nginx',
    rating: 5,
    category: '系统工具',
    tags: ['Web服务器', '反向代理', '负载均衡'],
    corePositioning: '高性能Web服务器',
    coreUsage: '静态文件服务、反向代理、负载均衡',
    applicableScenarios: '网站部署、API网关、负载均衡',
    downloadUrl: {
      official: 'https://nginx.org/en/download.html'
    },
    installation: {
      ubuntu: ['sudo apt install nginx']
    },
    commonCommands: [
      'nginx -t  # 测试配置',
      'nginx -s reload  # 重载配置'
    ]
  };
}

function generatePostgreSQLTool() {
  return {
    name: 'PostgreSQL',
    rating: 5,
    category: '数据库',
    tags: ['关系型数据库', 'SQL', '开源'],
    corePositioning: '最先进的开源关系型数据库',
    coreUsage: '复杂查询、JSONB、地理信息系统',
    applicableScenarios: '数据分析、地理应用、全文搜索',
    downloadUrl: {
      official: 'https://www.postgresql.org/download/'
    },
    installation: {
      ubuntu: ['sudo apt install postgresql']
    },
    updateInfo: {
      latestVersion: 'v16.1',
      updateDate: '2025-11-30'
    }
  };
}

function generatePrometheusTool() {
  return {
    name: 'Prometheus',
    rating: 5,
    category: '运维监控',
    tags: ['监控', '云原生', '时序数据库'],
    corePositioning: '云原生监控解决方案',
    coreUsage: 'Kubernetes监控、指标采集、告警',
    applicableScenarios: '云原生应用监控、微服务监控',
    downloadUrl: {
      official: 'https://prometheus.io/download/'
    },
    installation: {
      docker: 'docker run -d -p 9090:9090 prom/prometheus'
    },
    commonCommands: [
      'prometheus --config.file=prometheus.yml  # 启动'
    ]
  };
}