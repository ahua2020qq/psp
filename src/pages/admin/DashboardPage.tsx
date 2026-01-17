import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Users, Database, Activity, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import './DashboardPage.css';

interface DashboardPageProps {
  token: string;
  onLogout: () => void;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

export default function DashboardPage({ token, onLogout }: DashboardPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'searches' | 'tools' | 'llm'>('overview');

  useEffect(() => {
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin-stats?type=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        setError(data.error || '获取数据失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (!stats) return null;

    const cards: StatCard[] = [
      { title: '总搜索次数', value: stats.totalSearches || 0, icon: Search, color: '#165DFF', trend: '+12%' },
      { title: '独立用户', value: stats.uniqueUsers || 0, icon: Users, color: '#00B42A', trend: '+8%' },
      { title: '缓存命中率', value: `${(stats.cacheHitRate * 100).toFixed(1)}%`, icon: Database, color: '#FFA07A' },
      { title: '平均响应时间', value: `${stats.avgDuration?.toFixed(0)}ms`, icon: Clock, color: '#9B59B6' }
    ];

    return (
      <div className="dashboard-overview">
        <div className="stat-cards">
          {cards.map((card, index) => (
            <div key={index} className="stat-card" style={{ borderTopColor: card.color }}>
              <card.icon className="stat-icon" style={{ color: card.color }} />
              <div className="stat-content">
                <p className="stat-title">{card.title}</p>
                <p className="stat-value">{card.value}</p>
                {card.trend && <p className="stat-trend">{card.trend}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* 搜索趋势图 */}
        {stats.searchTrend && (
          <div className="chart-container">
            <h3>搜索趋势（最近7天）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.searchTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="searches" stroke="#165DFF" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 热门搜索词 */}
        {stats.topQueries && (
          <div className="top-queries">
            <h3>热门搜索词</h3>
            <div className="query-list">
              {stats.topQueries.slice(0, 10).map((query: any, index: number) => (
                <div key={index} className="query-item">
                  <span className="query-rank">#{index + 1}</span>
                  <span className="query-text">{query.normalized_query}</span>
                  <span className="query-count">{query.count} 次</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSearchLogs = () => {
    if (!stats) return null;

    return (
      <div className="logs-container">
        <h3>最近搜索记录</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>用户查询</th>
                <th>搜索意图</th>
                <th>结果数</th>
                <th>缓存</th>
                <th>耗时</th>
                <th>语言</th>
              </tr>
            </thead>
            <tbody>
              {stats.logs?.map((log: any, index: number) => (
                <tr key={index}>
                  <td>{new Date(log.created_at).toLocaleString('zh-CN')}</td>
                  <td>{log.original_query}</td>
                  <td>{log.search_intent || '-'}</td>
                  <td>{log.result_count}</td>
                  <td>
                    {log.from_cache ? (
                      <CheckCircle className="status-icon success" />
                    ) : (
                      <XCircle className="status-icon error" />
                    )}
                  </td>
                  <td>{log.total_duration_ms}ms</td>
                  <td>{log.user_language === 'zh' ? '中文' : '英文'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPopularTools = () => {
    if (!stats) return null;

    // 工具类别分布饼图
    const categoryData = stats.toolCategories || [];

    return (
      <div className="tools-container">
        <div className="chart-section">
          <h3>工具热度排行</h3>
          <div className="tool-ranking">
            {stats.popularTools?.slice(0, 10).map((tool: any, index: number) => (
              <div key={index} className="tool-item">
                <span className="tool-rank">#{index + 1}</span>
                <div className="tool-info">
                  <p className="tool-name">{tool.tool_name}</p>
                  <p className="tool-category">{tool.tool_category}</p>
                </div>
                <div className="tool-stats">
                  <span className="tool-appearances">出现 {tool.appearance_count} 次</span>
                  <span className="tool-feedback">
                    <TrendingUp className="feedback-icon up" />
                    {tool.total_up}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {categoryData.length > 0 && (
          <div className="chart-section">
            <h3>工具类别分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#165DFF', '#00B42A', '#FFA07A', '#9B59B6', '#FF6B6B'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderLLMStats = () => {
    if (!stats) return null;

    return (
      <div className="llm-container">
        <h3>LLM 性能统计</h3>
        <div className="llm-stats-grid">
          {stats.llmPerformance?.map((llm: any, index: number) => (
            <div key={index} className="llm-card">
              <div className="llm-header">
                <h4>{llm.llm_provider}</h4>
                <span className="llm-model">{llm.llm_model}</span>
              </div>
              <div className="llm-metrics">
                <div className="metric">
                  <p className="metric-label">总调用次数</p>
                  <p className="metric-value">{llm.total_calls}</p>
                </div>
                <div className="metric">
                  <p className="metric-label">成功率</p>
                  <p className="metric-value success">{((llm.successful_calls / llm.total_calls) * 100).toFixed(1)}%</p>
                </div>
                <div className="metric">
                  <p className="metric-label">平均耗时</p>
                  <p className="metric-value">{llm.avg_duration_ms?.toFixed(0)}ms</p>
                </div>
                <div className="metric">
                  <p className="metric-label">失败次数</p>
                  <p className="metric-value error">{llm.failed_calls}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* LLM 调用耗时对比 */}
        {stats.llmPerformance && (
          <div className="chart-container">
            <h3>LLM 调用耗时对比</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.llmPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="llm_provider" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_duration_ms" fill="#165DFF" name="平均耗时 (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-left">
          <Activity className="header-icon" />
          <h1>PSP 管理后台</h1>
        </div>
        <button onClick={onLogout} className="logout-button">
          退出登录
        </button>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 总览
        </button>
        <button
          className={activeTab === 'searches' ? 'active' : ''}
          onClick={() => setActiveTab('searches')}
        >
          🔍 搜索日志
        </button>
        <button
          className={activeTab === 'tools' ? 'active' : ''}
          onClick={() => setActiveTab('tools')}
        >
          🛠️ 工具分析
        </button>
        <button
          className={activeTab === 'llm' ? 'active' : ''}
          onClick={() => setActiveTab('llm')}
        >
          🤖 LLM 性能
        </button>
      </nav>

      <main className="dashboard-content">
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'searches' && renderSearchLogs()}
            {activeTab === 'tools' && renderPopularTools()}
            {activeTab === 'llm' && renderLLMStats()}
          </>
        )}
      </main>
    </div>
  );
}
