/**
 * 批量生成工具数据脚本
 * 用法：node scripts/batch-generate.js
 */

const COMMON_TOOLS = [
  // 数据库
  "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "SQLite",
  "MariaDB", "Cassandra", "DynamoDB", "InfluxDB", "TimescaleDB",

  // 容器与编排
  "Docker", "Kubernetes", "Docker Compose", "Helm", "Istio", "Envoy",
  "Rancher", "OpenShift", "Nomad", "Consul", "Vault",

  // Web服务器
  "Nginx", "Apache", "Caddy", "Traefik", "HAProxy", "Envoy",

  // 语言与框架
  "Python", "Node.js", "Golang", "Java", "Rust", "C++",
  "Ruby", "PHP", "JavaScript", "TypeScript", "Swift",

  // 开发工具
  "Git", "VS Code", "IntelliJ IDEA", "Vim", "Emacs", "Atom",
  "Sublime Text", "Xcode", "Android Studio", "PyCharm", "WebStorm",

  // 监控与日志
  "Prometheus", "Grafana", "ELK Stack", "Fluentd", "Jaeger", "Zipkin",
  "Sentry", "Datadog", "New Relic", "Nagios", "Zabbix",

  // CI/CD
  "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", "Travis CI",
  "Drone", "Concourse", "Spinnaker", "Argo CD", "Flux",

  // 消息队列
  "Kafka", "RabbitMQ", "Redis Streams", "NATS", "ActiveMQ", "Pulsar",
  "RocketMQ", "Amazon SQS", "Amazon SNS", "Azure Service Bus",

  // 云原生
  "Minikube", "Kind", "K3s", "MicroK8s", "Skaffold", "Tekton",
  "Buildpacks", "Containerd", "CRI-O", "runc", "gVisor",

  // 存储
  "NFS", "Ceph", "GlusterFS", "HDFS", "MinIO", "SeaweedFS",
  "FastDFS", "MooseFS", "Lustre", "GFS", "Amazon S3",

  // 网络
  "Wireshark", "tcpdump", "Ping", "Traceroute", "Nmap", "Netcat",
  "Curl", "Wget", "Ansible", "Terraform", "Pulumi", "Vagrant",

  // 安全
  "OpenSSL", "Let's Encrypt", "Certbot", "Keycloak", "Auth0", "OAuth2",
  "JWT", "HashiCorp Vault", "Snyk", "SonarQube", "Trivy",

  // 测试
  "Selenium", "Cypress", "Playwright", "Puppeteer", "Jest", "Mocha",
  "Chai", "JUnit", "TestNG", "pytest", "Robot Framework",

  // 其他常用
  "Linux", "Ubuntu", "CentOS", "Debian", "Fedora", "Arch Linux",
  "Red Hat", "Windows Server", "macOS", "Unix", "Shell"
];

// 配置
const API_BASE = "http://localhost:8788/api/search";
const BATCH_SIZE = 50; // 每批处理数量
const DELAY_MS = 2000; // 每个请求间隔（毫秒）

/**
 * 批量生成工具数据
 */
async function batchGenerate(tools) {
  console.log(`🚀 开始批量生成 ${tools.length} 个工具的数据...`);
  console.log(`📦 批次大小: ${BATCH_SIZE}`);
  console.log(`⏱️ 请求间隔: ${DELAY_MS}ms`);

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  // 分批处理
  for (let i = 0; i < tools.length; i += BATCH_SIZE) {
    const batch = tools.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(tools.length / BATCH_SIZE);

    console.log(`\n📦 批次 ${batchNum}/${totalBatches}: ${batch.join(', ')}`);

    for (const tool of batch) {
      try {
        console.log(`  ⏳ 生成: ${tool}...`);

        const response = await fetch(API_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: tool })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results[0]) {
            console.log(`  ✅ 成功: ${tool}`);
            results.success.push({
              tool,
              timestamp: new Date().toISOString()
            });
          } else {
            console.log(`  ⚠️ 空响应: ${tool}`);
            results.skipped.push(tool);
          }
        } else {
          console.log(`  ❌ 失败 (${response.status}): ${tool}`);
          results.failed.push(tool);
        }

        // 请求间隔
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));

      } catch (error) {
        console.log(`  ❌ 错误: ${tool} - ${error.message}`);
        results.failed.push(tool);
      }
    }
  }

  // 输出结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 生成结果统计:');
  console.log(`  ✅ 成功: ${results.success.length}`);
  console.log(`  ❌ 失败: ${results.failed.length}`);
  console.log(`  ⚠️ 跳过: ${results.skipped.length}`);
  console.log('='.repeat(50));

  if (results.failed.length > 0) {
    console.log('\n❌ 失败的工具:');
    results.failed.forEach(tool => console.log(`  - ${tool}`));
  }

  return results;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🔧 批量生成工具数据');
    console.log('\n用法:');
    console.log('  node scripts/batch-generate.js                    # 生成所有预定义工具');
    console.log('  node scripts/batch-generate.js mysql docker redis     # 生成指定工具');
    console.log('  node scripts/batch-generate.js --from-history      # 从搜索历史生成');
    console.log(`  node scripts/batch-generate.js --limit 20          # 只生成前20个工具`);
    console.log('\n预定义工具数量:', COMMON_TOOLS.length);
    return;
  }

  let toolsToGenerate = [];

  // 从搜索历史生成
  if (args.includes('--from-history')) {
    // 这里需要从localStorage或其他存储读取历史
    console.log('⚠️ --from-history 需要在浏览器中运行');
    console.log('   建议使用浏览器的开发者工具Console执行批量生成');
    return;
  }

  // 从命令行参数获取工具列表（排除 --flag 及其值）
  const flagArgs = new Set();
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      flagArgs.add(args[i]);
      flagArgs.add(args[i + 1] || ''); // Also exclude the flag value
    }
  }
  toolsToGenerate = args.filter(arg => !flagArgs.has(arg));

  // 如果没有指定工具，使用预定义列表
  if (toolsToGenerate.length === 0) {
    toolsToGenerate = [...COMMON_TOOLS];
  }

  // 限制数量（在确定工具列表之后）
  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    const limit = parseInt(args[limitIndex + 1]);
    toolsToGenerate = toolsToGenerate.slice(0, limit);
  }

  // 开始批量生成
  await batchGenerate(toolsToGenerate);
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { batchGenerate, COMMON_TOOLS };
