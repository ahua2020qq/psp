/**
 * 本地开发专用Worker
 * 用于本地测试时模拟Cloudflare Pages Functions
 */

// 引入functions中的search.js代码
export { onRequest } from './functions/api/search.js';

// 本地开发模式：添加健康检查端点
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API请求转发到onRequest
    if (url.pathname.startsWith('/api/')) {
      const { onRequest } = await import('./functions/api/search.js');
      return onRequest({ request, env });
    }

    return new Response('Worker is running. Use /api/* for API calls.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
