/**
 * 复制 functions 文件夹到 build 目录
 * Cloudflare Pages Functions 需要在 build 目录中才能被部署
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../functions');
const targetDir = path.join(__dirname, '../build/functions');

// 递归复制目录
function copyDirectory(src, dest) {
  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // 读取源目录
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDirectory(srcPath, destPath);
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('📁 开始复制 functions 文件夹...');

  // 检查源目录是否存在
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ functions 文件夹不存在！');
    process.exit(1);
  }

  // 复制目录
  copyDirectory(sourceDir, targetDir);

  console.log('✅ functions 文件夹已复制到 build/functions');
  console.log('📂 文件列表：');

  // 列出复制的文件
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

  listFiles(targetDir);

} catch (error) {
  console.error('❌ 复制失败:', error.message);
  process.exit(1);
}
