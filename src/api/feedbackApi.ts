/**
 * 工具反馈 API
 * 用于点赞/点踩功能
 */

interface FeedbackStats {
  up_count: number;
  down_count: number;
  total_count: number;
}

/**
 * 提交反馈（点赞/点踩）
 */
export async function submitFeedback(
  toolName: string,
  query: string,
  feedbackType: 'up' | 'down',
  language: 'zh' | 'en'
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: toolName,
        query,
        feedback_type: feedbackType,
        language
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error('提交反馈失败:', error);
    return { success: false };
  }
}

/**
 * 获取工具的反馈统计
 */
export async function getFeedbackStats(
  toolName: string,
  query?: string
): Promise<FeedbackStats | null> {
  try {
    const params = new URLSearchParams({ tool_name: toolName });
    if (query) params.append('query', query);

    const response = await fetch(`/api/feedback?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      up_count: data.up_count || 0,
      down_count: data.down_count || 0,
      total_count: data.total_count || 0
    };
  } catch (error) {
    console.error('获取反馈统计失败:', error);
    return null;
  }
}
