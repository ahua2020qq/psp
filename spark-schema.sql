-- ========================================
-- OpenSight 火花处理流水线 - 数据库表结构
-- ========================================
-- 版本: 1.0
-- 创建日期: 2025-01-17
-- 说明: 在PSPDB中创建sparks相关表
-- ========================================

-- 1. 火花核心表
CREATE TABLE IF NOT EXISTS sparks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,                    -- 一句话灵感
    description TEXT,                        -- 详细描述
    status TEXT NOT NULL DEFAULT 'captured', -- 状态: 'captured', 'thinking', 'experimenting', 'archived'
    project_tag TEXT,                        -- 关联项目: 'douya', 'opensight', 'deepseek', 'other'
    creator_comment TEXT,                    -- 随手记的备注
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 火花状态流转记录表（用于追溯）
CREATE TABLE IF NOT EXISTS spark_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spark_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    note TEXT,                               -- 流转原因
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spark_id) REFERENCES sparks(id) ON DELETE CASCADE
);

-- 3. 快速索引（加速查询）
CREATE INDEX IF NOT EXISTS idx_sparks_status ON sparks(status);
CREATE INDEX IF NOT EXISTS idx_sparks_updated ON sparks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sparks_project_tag ON sparks(project_tag);
CREATE INDEX IF NOT EXISTS idx_spark_logs_spark_id ON spark_logs(spark_id);
CREATE INDEX IF NOT EXISTS idx_spark_logs_created ON spark_logs(created_at DESC);

-- ========================================
-- 部署说明:
-- ========================================
-- 通过 Cloudflare Dashboard 执行:
-- 1. 进入 PSP D1 数据库
-- 2. 点击 "Console"
-- 3. 粘贴本SQL并执行
--
-- 或通过 wrangler CLI 执行:
-- wrangler d1 execute pspdb --local --file=spark-schema.sql  # 本地测试
-- wrangler d1 execute pspdb --file=spark-schema.sql          # 生产环境
-- ========================================
