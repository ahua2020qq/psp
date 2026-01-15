/**
 * Cloudflare Pages Function - 管理员登录 API
 * 安全的密码验证和会话管理
 */

import { verifyPassword } from '../utils/crypto.js';

// JWT 配置
const JWT_SECRET = 'your-secret-key-change-in-production'; // 生产环境应使用环境变量
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24小时

/**
 * 生成 JWT Token（简化版）
 */
function generateToken(userId, email) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    userId,
    email,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION
  };

  // 简化的 base64url 编码
  const encode = (obj) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = encode(header);
  const encodedPayload = encode(payload);

  // 简化的签名（生产环境应使用 HMAC-SHA256）
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * 验证图形验证码
 */
function verifyCaptcha(inputCaptcha, expectedCaptcha) {
  if (!inputCaptcha || !expectedCaptcha) return false;

  // 简单验证：检查用户选择的图形是否正确
  // 实际应该验证七巧板位置或图形选择
  try {
    const input = JSON.parse(inputCaptcha);
    const expected = JSON.parse(expectedCaptcha);

    // 验证是否选择了正确的图形（3个）
    return (
      Array.isArray(input.selected) &&
      Array.isArray(expected.selected) &&
      input.selected.length === expected.selected.length &&
      input.selected.every(id => expected.selected.includes(id))
    );
  } catch {
    return false;
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  // OPTIONS 预检
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const body = await request.json();
    const { email, password, captcha } = body;

    // 1. 基本参数验证
    if (!email || !password || !captcha) {
      return new Response(JSON.stringify({
        error: "缺少必需参数",
        code: "MISSING_PARAMS"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 2. 验证邮箱格式（只允许 ahua2020@qq.com）
    if (email !== 'ahua2020@qq.com') {
      // 记录失败尝试
      console.log(`⚠️ 登录失败：无效邮箱 - ${email}`);

      return new Response(JSON.stringify({
        error: "用户名或密码错误",
        code: "INVALID_CREDENTIALS"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 3. 从数据库获取用户
    const userStmt = env.PSPDB.prepare('SELECT * FROM admin_users WHERE email = ?1 AND is_active = 1');
    const userResult = await userStmt.bind(email).first();

    if (!userResult) {
      console.log(`⚠️ 登录失败：用户不存在 - ${email}`);
      return new Response(JSON.stringify({
        error: "用户名或密码错误",
        code: "INVALID_CREDENTIALS"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 4. 验证密码（使用 bcrypt）
    const passwordValid = await verifyPassword(password, userResult.password_hash);

    if (!passwordValid) {
      console.log(`⚠️ 登录失败：密码错误 - ${email}`);

      // 记录失败的登录尝试
      const auditStmt = env.PSPDB.prepare(`
        INSERT INTO admin_audit_logs (user_id, action, details, ip_address)
        VALUES (?1, ?2, ?3, ?4)
      `);
      await auditStmt.bind(
        userResult.id,
        'login_failed',
        JSON.stringify({ reason: 'invalid_password' }),
        request.headers.get('cf-connecting-ip') || 'unknown'
      ).run();

      return new Response(JSON.stringify({
        error: "用户名或密码错误",
        code: "INVALID_CREDENTIALS"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 5. 验证图形验证码（从 KV 获取）
    const captchaKey = `captcha:${request.headers.get('cf-connecting-ip') || 'unknown'}`;
    const expectedCaptcha = await env.CAPTCHA_KV?.get(captchaKey);

    if (!expectedCaptcha || !verifyCaptcha(captcha, expectedCaptcha)) {
      console.log(`⚠️ 登录失败：验证码错误 - ${email}`);

      return new Response(JSON.stringify({
        error: "验证码错误，请重试",
        code: "INVALID_CAPTCHA"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 6. 清除已使用的验证码
    await env.CAPTCHA_KV?.delete(captchaKey);

    // 7. 生成 JWT Token
    const token = generateToken(userResult.id, userResult.email);

    // 8. 保存会话到数据库
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    const sessionStmt = env.PSPDB.prepare(`
      INSERT INTO admin_sessions (user_id, session_token, user_agent, ip_address, expires_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `);
    await sessionStmt.bind(
      userResult.id,
      token, // 实际应该存储 token hash
      request.headers.get('user-agent')?.slice(0, 500) || null,
      request.headers.get('cf-connecting-ip') || 'unknown',
      expiresAt
    ).run();

    // 9. 更新最后登录时间
    const updateStmt = env.PSPDB.prepare('UPDATE admin_users SET last_login = datetime("now") WHERE id = ?1');
    await updateStmt.bind(userResult.id).run();

    // 10. 记录成功的登录
    const auditStmt = env.PSPDB.prepare(`
      INSERT INTO admin_audit_logs (user_id, action, details, ip_address)
      VALUES (?1, ?2, ?3, ?4)
    `);
    await auditStmt.bind(
      userResult.id,
      'login_success',
      JSON.stringify({ user_agent: request.headers.get('user-agent')?.slice(0, 200) }),
      request.headers.get('cf-connecting-ip') || 'unknown'
    ).run();

    console.log(`✅ 登录成功：${email} from ${request.headers.get('cf-connecting-ip')}`);

    // 11. 返回 token
    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        email: userResult.email,
        lastLogin: userResult.last_login
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ 登录 API 错误:', error);

    return new Response(JSON.stringify({
      error: "服务器错误",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
