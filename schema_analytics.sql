-- =====================================================
-- PSP 搜索日志和分析系统 - 数据库设计
-- =====================================================
--
-- 设计目标：
-- 1. 完整记录用户搜索行为
-- 2. 追踪 LLM 调用性能
-- 3. 记录推荐结果和用户反馈
-- 4. 支持数据驱动的推荐优化
--
-- =====================================================

-- -----------------------------------------------------
-- 1. 搜索日志表（主表）- 记录每次搜索请求
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 用户信息
  user_fingerprint TEXT,                -- 用户指纹（IP + UA hash）
  user_language TEXT DEFAULT 'zh',      -- 用户界面语言

  -- 搜索信息
  original_query TEXT NOT NULL,         -- 用户原始输入
  normalized_query TEXT NOT NULL,       -- 归一化后的查询（用于缓存 key）
  search_intent TEXT,                   -- 搜索意图（LLM 返回）
  search_type TEXT DEFAULT 'search',    -- 搜索类型：search/recommend

  -- 响应信息
  result_count INTEGER DEFAULT 0,       -- 返回结果数量
  from_cache BOOLEAN DEFAULT FALSE,     -- 是否来自缓存

  -- 性能指标
  total_duration_ms INTEGER,            -- 总响应时间（毫秒）

  -- 时间戳
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- 约束
  CONSTRAINT valid_search_type CHECK (search_type IN ('search', 'recommend')),
  CONSTRAINT valid_language CHECK (user_language IN ('zh', 'en'))
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_fingerprint, created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(normalized_query, created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_cache ON search_logs(from_cache, created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_date ON search_logs(date(created_at));


-- -----------------------------------------------------
-- 2. LLM 调用日志表 - 记录每次 LLM API 调用
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS llm_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 关联信息
  search_log_id INTEGER NOT NULL,       -- 关联到 search_logs.id
  language TEXT NOT NULL,               -- 'zh' 或 'en'

  -- API 信息
  llm_provider TEXT NOT NULL,           -- 'deepseek' 或 'volc_ark'
  llm_model TEXT NOT NULL,              -- 模型名称

  -- 请求信息
  prompt_tokens INTEGER,                -- 输入 token 数（如果可获取）
  prompt_length INTEGER,                -- Prompt 字符数

  -- 响应信息
  response_tokens INTEGER,              -- 输出 token 数（如果可获取）
  response_length INTEGER,              -- 响应字符数
  duration_ms INTEGER,                  -- API 调用耗时（毫秒）

  -- 状态
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,                   -- 错误信息（如果失败）

  -- 时间戳
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- 外键约束
  FOREIGN KEY (search_log_id) REFERENCES search_logs(id) ON DELETE CASCADE,

  -- 约束
  CONSTRAINT valid_provider CHECK (llm_provider IN ('deepseek', 'volc_ark')),
  CONSTRAINT valid_llm_language CHECK (language IN ('zh', 'en'))
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_llm_calls_search ON llm_calls(search_log_id);
CREATE INDEX IF NOT EXISTS idx_llm_calls_provider ON llm_calls(llm_provider, created_at);
CREATE INDEX IF NOT EXISTS idx_llm_calls_duration ON llm_calls(duration_ms);
CREATE INDEX IF NOT EXISTS idx_llm_calls_success ON llm_calls(success, created_at);


-- -----------------------------------------------------
-- 3. 搜索结果表 - 记录返回的工具卡片
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS search_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 关联信息
  search_log_id INTEGER NOT NULL,       -- 关联到 search_logs.id
  result_language TEXT NOT NULL,        -- 'zh' 或 'en'

  -- 结果位置
  position INTEGER NOT NULL,            -- 排序位置（1, 2, 3...）

  -- 工具信息
  tool_name TEXT NOT NULL,              -- 工具名称
  tool_category TEXT,                   -- 工具分类
  tool_rating INTEGER,                  -- 工具评分（1-5）

  -- 用户反馈
  feedback_up INTEGER DEFAULT 0,        -- 点赞数
  feedback_down INTEGER DEFAULT 0,      -- 点踩数

  -- 时间戳
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- 外键约束
  FOREIGN KEY (search_log_id) REFERENCES search_logs(id) ON DELETE CASCADE,

  -- 约束
  CONSTRAINT valid_result_language CHECK (result_language IN ('zh', 'en')),
  CONSTRAINT valid_position CHECK (position > 0),
  CONSTRAINT valid_rating CHECK (tool_rating BETWEEN 1 AND 5)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_search_results_search ON search_results(search_log_id);
CREATE INDEX IF NOT EXISTS idx_search_results_tool ON search_results(tool_name, created_at);
CREATE INDEX IF NOT EXISTS idx_search_results_position ON search_results(position);


-- -----------------------------------------------------
-- 4. 用户会话表 - 追踪用户访问序列
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 用户信息
  user_fingerprint TEXT NOT NULL,
  session_start TEXT NOT NULL DEFAULT (datetime('now')),
  last_activity TEXT NOT NULL DEFAULT (datetime('now')),

  -- 统计信息
  total_searches INTEGER DEFAULT 0,
  total_feedback INTEGER DEFAULT 0,

  -- 访问信息（从 Cloudflare cf 对象获取）
  colo TEXT,                           -- Cloudflare 数据中心代码
  country TEXT,                        -- 国家代码
  city TEXT,                           -- 城市
  user_agent TEXT,                     -- User-Agent（截断）
  referer TEXT,                       -- 来源页面

  -- 唯一约束
  CONSTRAINT unique_fingerprint_session UNIQUE (user_fingerprint)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_fingerprint ON user_sessions(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity);


-- -----------------------------------------------------
-- 5. 工具反馈表（已存在，保持兼容）
-- -----------------------------------------------------
-- tool_feedback 表已在之前创建


-- -----------------------------------------------------
-- 视图：搜索分析摘要
-- -----------------------------------------------------
CREATE VIEW IF NOT EXISTS search_analytics_summary AS
SELECT
  DATE(sl.created_at) as date,
  sl.user_language,
  sl.from_cache,
  COUNT(*) as total_searches,
  SUM(sl.result_count) as total_results,
  AVG(sl.total_duration_ms) as avg_duration_ms,
  COUNT(DISTINCT sl.user_fingerprint) as unique_users,
  SUM(CASE WHEN sl.from_cache THEN 1 ELSE 0 END) as cache_hits,
  SUM(CASE WHEN NOT sl.from_cache THEN 1 ELSE 0 END) as cache_misses,
  CAST(SUM(CASE WHEN sl.from_cache THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as cache_hit_rate
FROM search_logs sl
GROUP BY DATE(sl.created_at), sl.user_language, sl.from_cache;


-- -----------------------------------------------------
-- 视图：工具热度排行
-- -----------------------------------------------------
CREATE VIEW IF NOT EXISTS tool_popularity_ranking AS
SELECT
  sr.tool_name,
  sr.tool_category,
  COUNT(*) as appearance_count,
  SUM(sr.feedback_up) as total_up,
  SUM(sr.feedback_down) as total_down,
  AVG(sr.position) as avg_position,
  MAX(sl.created_at) as last_seen
FROM search_results sr
JOIN search_logs sl ON sr.search_log_id = sl.id
GROUP BY sr.tool_name, sr.tool_category
ORDER BY appearance_count DESC;


-- -----------------------------------------------------
-- 视图：LLM 性能统计
-- -----------------------------------------------------
CREATE VIEW IF NOT EXISTS llm_performance_stats AS
SELECT
  llm_provider,
  llm_model,
  language,
  COUNT(*) as total_calls,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls,
  AVG(duration_ms) as avg_duration_ms,
  AVG(prompt_tokens) as avg_prompt_tokens,
  AVG(response_tokens) as avg_response_tokens,
  SUM(CASE WHEN success THEN 0 ELSE 1 END) as failed_calls
FROM llm_calls
GROUP BY llm_provider, llm_model, language;


-- -----------------------------------------------------
-- 视图：用户行为画像
-- -----------------------------------------------------
CREATE VIEW IF NOT EXISTS user_behavior_profile AS
SELECT
  sl.user_fingerprint,
  us.colo,
  us.country,
  COUNT(*) as total_searches,
  COUNT(DISTINCT sl.normalized_query) as unique_queries,
  AVG(sl.result_count) as avg_result_count,
  SUM(CASE WHEN sl.from_cache THEN 1 ELSE 0 END) as cache_hits,
  DATE(us.session_start) as first_seen,
  DATE(us.last_activity) as last_seen,
  CAST((julianday('now') - julianday(us.session_start)) AS INTEGER) as days_active
FROM search_logs sl
JOIN user_sessions us ON sl.user_fingerprint = us.user_fingerprint
GROUP BY sl.user_fingerprint, us.colo, us.country
ORDER BY total_searches DESC;
