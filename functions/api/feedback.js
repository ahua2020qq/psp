/**
 * Cloudflare Pages Function - 工具反馈 API
 *
 * 功能：
 * - POST /api/feedback - 提交点赞/点踩反馈
 * - GET /api/feedback?tool_name=xxx - 获取工具的反馈统计
 */

export async function onRequest(context) {
  const { request, env } = context;

  // OPTIONS 预检
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

  const url = new URL(request.url);
  const method = request.method;

  try {
    // ==================== GET：获取反馈统计 ====================
    if (method === "GET") {
      const toolName = url.searchParams.get("tool_name");
      const query = url.searchParams.get("query");

      if (!toolName) {
        return new Response(JSON.stringify({
          error: "缺少 tool_name 参数"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // 从 D1 数据库查询统计数据
      let sql = `
        SELECT
          SUM(CASE WHEN feedback_type = 'up' THEN 1 ELSE 0 END) as up_count,
          SUM(CASE WHEN feedback_type = 'down' THEN 1 ELSE 0 END) as down_count,
          COUNT(*) as total_count
        FROM tool_feedback
        WHERE tool_name = ?1
      `;
      const params = [toolName];

      // 如果提供了 query，则加上过滤条件
      if (query) {
        sql += ` AND query = ?2`;
        params.push(query);
      }

      const stmt = env.PSPDB.prepare(sql);
      const result = await stmt.bind(...params).first();

      return new Response(JSON.stringify({
        success: true,
        tool_name: toolName,
        query: query,
        up_count: result.up_count || 0,
        down_count: result.down_count || 0,
        total_count: result.total_count || 0
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // ==================== POST：提交反馈 ====================
    if (method === "POST") {
      const body = await request.json();
      const { tool_name, query, feedback_type, language = 'zh' } = body;

      // 参数验证
      if (!tool_name || !query || !feedback_type) {
        return new Response(JSON.stringify({
          error: "缺少必需参数：tool_name, query, feedback_type"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      if (feedback_type !== 'up' && feedback_type !== 'down') {
        return new Response(JSON.stringify({
          error: "feedback_type 必须是 'up' 或 'down'"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // 生成简单的用户指纹（基于 IP 和 User-Agent，简化版）
      const cf = request.cf;
      const userFingerprint = `${cf?.colo || 'unknown'}-${request.headers.get('user-agent')?.slice(0, 50) || 'unknown'}`;

      // 插入反馈到 D1 数据库
      const sql = `
        INSERT INTO tool_feedback (tool_name, query, feedback_type, language, user_fingerprint, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
      `;

      const stmt = env.PSPDB.prepare(sql);
      await stmt.bind(
        tool_name,
        query,
        feedback_type,
        language,
        userFingerprint
      ).run();

      console.log(`✅ 反馈已保存: ${tool_name} (${feedback_type})`);

      return new Response(JSON.stringify({
        success: true,
        message: "反馈已保存",
        tool_name,
        query,
        feedback_type
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 不支持的方法
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    console.error("❌ 反馈 API 错误:", error);

    return new Response(JSON.stringify({
      error: "服务器错误",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
