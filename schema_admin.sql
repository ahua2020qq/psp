-- =====================================================
-- PSP 后台管理系统 - 数据库设计
-- =====================================================

-- -----------------------------------------------------
-- 1. 管理员用户表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,           -- 邮箱（登录用户名）
  password_hash TEXT NOT NULL,          -- 密码哈希（bcrypt）
  salt TEXT NOT NULL,                   -- 盐值（额外安全层）
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT,                      -- 最后登录时间
  is_active BOOLEAN DEFAULT TRUE        -- 是否激活
);

-- -----------------------------------------------------
-- 2. 管理员会话表（JWT Session 管理）
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,             -- 关联 admin_users.id
  session_token TEXT NOT NULL UNIQUE,   -- JWT token hash
  user_agent TEXT,                      -- 浏览器信息
  ip_address TEXT,                      -- IP 地址
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,             -- 过期时间
  last_activity TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- -----------------------------------------------------
-- 3. 管理员操作日志表
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,                 -- 操作类型：login, view, export, etc.
  resource TEXT,                        -- 操作资源
  details TEXT,                         -- 详细信息（JSON）
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user ON admin_audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action, created_at);

-- -----------------------------------------------------
-- 初始化管理员账户
-- -----------------------------------------------------
-- 密码：手机号末4位（示例：1234）
-- 实际部署时需要替换为真实的 bcrypt 哈希
INSERT OR IGNORE INTO admin_users (email, password_hash, salt)
VALUES ('ahua2020@qq.com', '$2b$12$placeholder', 'default-salt')
ON CONFLICT(email) DO NOTHING;
