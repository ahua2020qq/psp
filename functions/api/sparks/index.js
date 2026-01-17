/**
 * Cloudflare Pages Function - Sparks API
 * 路径: /api/sparks
 * 方法:
 *   - POST: 创建新火花
 *   - GET: 获取火花列表（支持筛选）
 */

export async function onRequest(context) {
  const { request, env } = context;

  // CORS 预检
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    // POST: 创建新火花
    if (request.method === "POST") {
      return await createSpark(request, env);
    }

    // GET: 获取火花列表
    if (request.method === "GET") {
      return await getSparks(request, env);
    }

    // 不支持的方法
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ Sparks API 错误:', error);

    return new Response(JSON.stringify({
      error: "服务器错误",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

/**
 * 创建新火花
 */
async function createSpark(request, env) {
  try {
    const body = await request.json();
    const { title, project_tag = 'other', description, creator_comment } = body;

    // 验证必填字段
    if (!title || title.trim() === '') {
      return new Response(JSON.stringify({ error: "标题不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 生成UUID（使用Web Crypto API）
    const sparkId = crypto.randomUUID();

    // 插入数据库
    const stmt = env.PSPDB.prepare(`
      INSERT INTO sparks (id, title, description, project_tag, creator_comment, status)
      VALUES (?1, ?2, ?3, ?4, ?5, 'captured')
    `);

    await stmt.bind(
      sparkId,
      title.trim(),
      description || null,
      project_tag,
      creator_comment || null
    ).run();

    // 返回创建的火花
    const newSpark = env.PSPDB.prepare('SELECT * FROM sparks WHERE id = ?1');
    const result = await newSpark.bind(sparkId).first();

    return new Response(JSON.stringify({
      success: true,
      message: "火花已捕获",
      spark: result
    }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ 创建火花错误:', error);
    throw error;
  }
}

/**
 * 获取火花列表
 */
async function getSparks(request, env) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const projectTag = url.searchParams.get('project_tag');
    const limit = url.searchParams.get('limit');

    // 构建查询
    let query = 'SELECT * FROM sparks';
    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (projectTag) {
      conditions.push('project_tag = ?');
      params.push(projectTag);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY updated_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const stmt = env.PSPDB.prepare(query);
    const result = await stmt.bind(...params).all();

    return new Response(JSON.stringify({
      success: true,
      sparks: result.results || [],
      total: (result.results || []).length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ 获取火花列表错误:', error);
    throw error;
  }
}
