import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import './AdminApp.css';

/**
 * PSP 管理后台主应用
 * 路由：douya.chat/mgmt
 */
export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储的 token
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      // 验证 token 是否有效
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin-stats?type=overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setToken(token);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch (error) {
      console.error('Token 验证失败:', error);
      localStorage.removeItem('admin_token');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="admin-app-loading">
        <div className="spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="admin-app">
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <DashboardPage token={token!} onLogout={handleLogout} />
      )}
    </div>
  );
}
