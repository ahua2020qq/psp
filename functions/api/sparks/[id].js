/**
 * Cloudflare Pages Function - Spark Detail API
 * 路径: /api/sparks/[id]
 * 方法:
 *   - PUT: 更新火花状态
 *   - DELETE: 删除火花
 *   - GET: 获取单个火花详情
 */

export async function onRequest(context) {
  const { request, env, params } = context;

  // CORS 预检
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    const sparkId = params.id;

    if (!sparkId) {
      return new Response(JSON.stringify({ error: "缺少火花ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // PUT: 更新火花
    if (request.method === "PUT") {
      return await updateSpark(request, env, sparkId);
    }

    // DELETE: 删除火花
    if (request.method === "DELETE") {
      return await deleteSpark(env, sparkId);
    }

    // GET: 获取单个火花详情
    if (request.method === "GET") {
      return await getSpark(env, sparkId);
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ Spark Detail API 错误:', error);

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
 * 更新火花状态
 */
async function updateSpark(request, env, sparkId) {
  try {
    const body = await request.json();
    const { status, note, description, creator_comment } = body;

    // 验证必填字段
    if (!status) {
      return new Response(JSON.stringify({ error: "状态不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 验证状态值
    const validStatuses = ['captured', 'thinking', 'experimenting', 'archived'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: `无效的状态值，必须是: ${validStatuses.join(', ')}` }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 获取当前状态
    const currentStmt = env.PSPDB.prepare('SELECT status FROM sparks WHERE id = ?1');
    const current = await currentStmt.bind(sparkId).first();

    if (!current) {
      return new Response(JSON.stringify({ error: "火花不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 更新火花状态
    let updateQuery = 'UPDATE sparks SET status = ?1, updated_at = CURRENT_TIMESTAMP';
    let updateParams = [status];

    if (description !== undefined) {
      updateQuery += ', description = ?2';
      updateParams.push(description);
    }

    if (creator_comment !== undefined) {
      const paramIndex = updateParams.length + 1;
      updateQuery += `, creator_comment = ?${paramIndex}`;
      updateParams.push(creator_comment);
    }

    updateQuery += ' WHERE id = ?' + (updateParams.length + 1);
    updateParams.push(sparkId);

    const updateStmt = env.PSPDB.prepare(updateQuery);
    await updateStmt.bind(...updateParams).run();

    // 记录状态流转日志
    if (current.status !== status) {
      const logStmt = env.PSPDB.prepare(`
        INSERT INTO spark_logs (spark_id, from_status, to_status, note)
        VALUES (?1, ?2, ?3, ?4)
      `);
      await logStmt.bind(
        sparkId,
        current.status,
        status,
        note || ''
      ).run();
    }

    // 获取更新后的火花
    const updatedSpark = env.PSPDB.prepare('SELECT * FROM sparks WHERE id = ?1');
    const result = await updatedSpark.bind(sparkId).first();

    return new Response(JSON.stringify({
      success: true,
      message: "火花已更新",
      spark: result
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ 更新火花错误:', error);
    throw error;
  }
}

/**
 * 删除火花
 */
async function deleteSpark(env, sparkId) {
  try {
    const stmt = env.PSPDB.prepare('DELETE FROM sparks WHERE id = ?1');
    const result = await stmt.bind(sparkId).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: "火花不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "火花已删除"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ 删除火花错误:', error);
    throw error;
  }
}

/**
 * 获取单个火花详情
 */
async function getSpark(env, sparkId) {
  try {
    const stmt = env.PSPDB.prepare('SELECT * FROM sparks WHERE id = ?1');
    const spark = await stmt.bind(sparkId).first();

    if (!spark) {
      return new Response(JSON.stringify({ error: "火花不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 获取流转历史
    const logsStmt = env.PSPDB.prepare(`
      SELECT * FROM spark_logs
      WHERE spark_id = ?1
      ORDER BY created_at DESC
      LIMIT 20
    `);
    const logsResult = await logsStmt.bind(sparkId).all();

    return new Response(JSON.stringify({
      success: true,
      spark,
      logs: logsResult.results || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error('❌ 获取火花详情错误:', error);
    throw error;
  }
}
