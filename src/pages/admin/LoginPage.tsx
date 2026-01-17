import React, { useState } from 'react';
import { Shield, Lock, Mail } from 'lucide-react';
import './LoginPage.css';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

/**
 * 图形验证码组件 - 选择3个正确的图形
 */
function CaptchaChallenge({ onVerify }: { onVerify: (selection: number[]) => void }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [shapes] = useState(() => {
    // 生成9个随机图形
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      type: ['circle', 'square', 'triangle', 'star', 'diamond'][Math.floor(Math.random() * 5)],
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)],
      rotation: Math.floor(Math.random() * 4) * 90
    }));
  });

  // 随机选择3个作为正确答案
  const correctAnswers = [0, 4, 8]; // 固定选择对角线的3个

  const handleShapeClick = (id: number) => {
    let newSelected: number[];
    if (selected.includes(id)) {
      newSelected = selected.filter(s => s !== id);
    } else if (selected.length < 3) {
      newSelected = [...selected, id];
    } else {
      // 替换最早选择的一个
      newSelected = [...selected.slice(1), id];
    }
    setSelected(newSelected);

    if (newSelected.length === 3) {
      setTimeout(() => onVerify(newSelected), 300);
    }
  };

  const getShapeStyle = (shape: any) => ({
    width: '60px',
    height: '60px',
    backgroundColor: shape.color,
    transform: `rotate(${shape.rotation}deg)`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'triangle' ? '0' : '8px',
    clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
    border: selected.includes(shape.id) ? '3px solid #165DFF' : '3px solid transparent'
  });

  return (
    <div className="captcha-container">
      <p className="captcha-instruction">请选择3个图形验证</p>
      <div className="shapes-grid">
        {shapes.map((shape) => (
          <div
            key={shape.id}
            style={getShapeStyle(shape)}
            onClick={() => handleShapeClick(shape.id)}
            title={selected.includes(shape.id) ? '已选择' : '点击选择'}
          />
        ))}
      </div>
      <p className="captcha-hint">已选择 {selected.length}/3</p>
    </div>
  );
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaSelection, setCaptchaSelection] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('请填写所有字段');
      return;
    }

    if (!captchaSelection || captchaSelection.length !== 3) {
      setError('请完成图形验证');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          captcha: JSON.stringify({ selected: captchaSelection })
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 保存 token 到 localStorage
        localStorage.setItem('admin_token', data.token);
        onLoginSuccess(data.token);
      } else {
        setError(data.error || '登录失败');
        // 重置验证码
        setCaptchaSelection(null);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Shield className="logo-icon" />
          <h1>PSP 管理后台</h1>
          <p>数据驱动的工具搜索平台</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <Mail className="input-icon" />
              管理员邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入邮箱"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock className="input-icon" />
              安全暗语
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入安全暗语"
              autoComplete="current-password"
            />
            <p className="input-hint">输入你的手机号末4位</p>
          </div>

          <div className="form-group">
            <CaptchaChallenge onVerify={setCaptchaSelection} />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '登录中...' : '安全登录'}
          </button>
        </form>

        <div className="login-footer">
          <p>🔒 所有操作均受安全保护</p>
        </div>
      </div>
    </div>
  );
}
