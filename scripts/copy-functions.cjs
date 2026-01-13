/**
 * 确保项目根目录有 functions 文件夹
 * Cloudflare Pages Functions 必须在项目根目录
 */

const fs = require('fs');
const path = require('path');

const rootFunctionsDir = path.join(__dirname, '../functions');

try {
  console.log('🔍 检查根目录 functions 文件夹...');

  // 检查根目录 functions 是否存在
  if (!fs.existsSync(rootFunctionsDir)) {
    console.error('❌ 根目录 functions 文件夹不存在！');
    process.exit(1);
  }

  // 列出根目录 functions 的文件
  const listFiles = (dir, prefix = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      console.log(`${prefix}├─ ${entry.name}`);
      if (entry.isDirectory()) {
        listFiles(fullPath, prefix + '│  ');
      }
    }
  };

  console.log('✅ 根目录 functions 文件夹存在');
  console.log('📂 文件列表：');
  listFiles(rootFunctionsDir);

} catch (error) {
  console.error('❌ 检查失败:', error.message);
  process.exit(1);
}
