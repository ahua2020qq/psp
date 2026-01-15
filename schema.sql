-- 工具反馈表（点赞/点踩）
-- 用于优化推荐算法
CREATE TABLE IF NOT EXISTS tool_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_name TEXT NOT NULL,                    -- 工具名称
  query TEXT NOT NULL,                        -- 搜索词（用于分析用户搜索意图）
  feedback_type TEXT NOT NULL,                -- 反馈类型：'up'（点赞）或 'down'（点踩）
  language TEXT NOT NULL DEFAULT 'zh',       -- 用户当前语言：'zh' 或 'en'
  user_fingerprint TEXT,                      -- 用户指纹（用于防止重复，可选）
  created_at TEXT NOT NULL DEFAULT (datetime('now')),  -- 反馈时间
  -- 索引优化
  CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('up', 'down')),
  CONSTRAINT valid_language CHECK (language IN ('zh', 'en'))
);

-- 创建索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_tool_name ON tool_feedback(tool_name);
CREATE INDEX IF NOT EXISTS idx_query ON tool_feedback(query);
CREATE INDEX IF NOT EXISTS idx_created_at ON tool_feedback(created_at);

-- 聚合统计视图（可选，用于快速获取统计数据）
CREATE VIEW IF NOT EXISTS tool_feedback_stats AS
SELECT
  tool_name,
  query,
  language,
  SUM(CASE WHEN feedback_type = 'up' THEN 1 ELSE 0 END) as up_count,
  SUM(CASE WHEN feedback_type = 'down' THEN 1 ELSE 0 END) as down_count,
  COUNT(*) as total_count,
  MAX(created_at) as last_feedback_at
FROM tool_feedback
GROUP BY tool_name, query, language;
