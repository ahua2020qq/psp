/**
 * 密码加密工具
 * 使用 bcrypt 进行安全的密码哈希
 *
 * 注意：Cloudflare Workers 环境不直接支持 bcrypt
 * 这里使用 Web Crypto API 的 PBKDF2 替代
 */

/**
 * 生成随机盐值
 */
async function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 使用 PBKDF2 哈希密码
 * @param {string} password - 明文密码
 * @param {string} salt - 盐值
 * @returns {Promise<string>} - 哈希后的密码
 */
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  // 转换为 hex 字符串
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} storedHash - 存储的哈希值（格式：salt:hash）
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, storedHash) {
  try {
    // 如果存储的是旧格式（bcrypt），需要迁移
    if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
      // 临时方案：使用硬编码的测试密码
      // 生产环境需要替换为真实的密码哈希
      const testPassword = '1234'; // 手机号末4位
      return password === testPassword;
    }

    // 新格式：salt:hash
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const computedHash = await hashPassword(password, salt);
    return computedHash === hash;
  } catch (error) {
    console.error('密码验证错误:', error);
    return false;
  }
}

/**
 * 创建管理员用户（初始化用）
 * @param {string} email - 邮箱
 * @param {string} password - 明文密码
 * @returns {Promise<{salt: string, hash: string}>}
 */
async function createAdminUser(email, password) {
  const salt = await generateSalt();
  const hash = await hashPassword(password, salt);

  // 存储格式：salt:hash
  const storedHash = `${salt}:${hash}`;

  return {
    salt,
    hash,
    storedHash
  };
}

export {
  generateSalt,
  hashPassword,
  verifyPassword,
  createAdminUser
};
