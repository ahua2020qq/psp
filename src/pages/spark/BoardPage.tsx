import React, { useState, useEffect } from 'react';
import '../spark/BoardPage.css';

/**
 * OpenSight 火花看板页面
 * 路径: /spark/board
 * 功能: 状态看板（captured | thinking | experimenting）
 */

type SparkStatus = 'captured' | 'thinking' | 'experimenting' | 'archived';

interface Spark {
  id: string;
  title: string;
  description?: string;
  status: SparkStatus;
  project_tag: string;
  creator_comment?: string;
  created_at: string;
  updated_at: string;
}

interface SparkColumn {
  status: SparkStatus;
  title: string;
  color: string;
  icon: string;
}

const COLUMNS: SparkColumn[] = [
  { status: 'captured', title: '已捕获', color: 'blue', icon: '💡' },
  { status: 'thinking', title: '思考中', color: 'yellow', icon: '🤔' },
  { status: 'experimenting', title: '实验中', color: 'green', icon: '🔬' }
];

const PROJECT_TAG_LABELS: Record<string, string> = {
  douya: 'Douya',
  opensight: 'OpenSight',
  deepseek: 'DeepSeek',
  experiment: '实验',
  other: '其他'
};

export default function BoardPage() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<SparkStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 加载火花数据
  useEffect(() => {
    loadSparks();
  }, []);

  const loadSparks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sparks');
      const data = await response.json();

      if (data.success) {
        setSparks(data.sparks);
      }
    } catch (error) {
      console.error('加载火花失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (sparkId: string, newStatus: SparkStatus, note?: string) => {
    try {
      setUpdatingId(sparkId);

      const response = await fetch(`/api/sparks/${sparkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          note: note || `从看板更新到 ${newStatus}`
        })
      });

      const data = await response.json();

      if (data.success) {
        // 更新本地状态
        setSparks(prev =>
          prev.map(spark =>
            spark.id === sparkId ? { ...spark, ...data.spark } : spark
          )
        );
      } else {
        alert(`更新失败: ${data.error}`);
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteSpark = async (sparkId: string) => {
    if (!confirm('确定要删除这个火花吗？')) return;

    try {
      setUpdatingId(sparkId);

      const response = await fetch(`/api/sparks/${sparkId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSparks(prev => prev.filter(s => s.id !== sparkId));
      } else {
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setUpdatingId(null);
    }
  };

  const getSparksByStatus = (status: SparkStatus) => {
    return sparks.filter(s => s.status === status);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="spark-board-loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="spark-board-container">
      {/* 头部 */}
      <div className="spark-board-header">
        <div>
          <h1>🎯 火花工作台</h1>
          <p className="subtitle">管理你的灵感流</p>
        </div>
        <div className="header-actions">
          <button onClick={loadSparks} className="btn btn-refresh" disabled={loading}>
            🔄 刷新
          </button>
          <a href="/spark/capture" className="btn btn-primary">
            ⚡ 捕获新火花
          </a>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="spark-stats">
        <div className="stat-item">
          <span className="stat-label">总火花</span>
          <span className="stat-value">{sparks.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已捕获</span>
          <span className="stat-value stat-blue">{getSparksByStatus('captured').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">思考中</span>
          <span className="stat-value stat-yellow">{getSparksByStatus('thinking').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">实验中</span>
          <span className="stat-value stat-green">{getSparksByStatus('experimenting').length}</span>
        </div>
      </div>

      {/* 看板列 */}
      <div className="spark-board-columns">
        {COLUMNS.map(column => {
          const columnSparks = getSparksByStatus(column.status);

          return (
            <div key={column.status} className={`spark-column column-${column.color}`}>
              <div className="column-header">
                <span className="column-icon">{column.icon}</span>
                <h2>{column.title}</h2>
                <span className="column-count">{columnSparks.length}</span>
              </div>

              <div className="column-sparks">
                {columnSparks.length === 0 ? (
                  <div className="empty-state">
                    <p>暂无火花</p>
                  </div>
                ) : (
                  columnSparks.map(spark => (
                    <div
                      key={spark.id}
                      className={`spark-card ${updatingId === spark.id ? 'updating' : ''}`}
                    >
                      {/* 项目标签 */}
                      <div className="spark-tags">
                        <span className="tag tag-project">
                          {PROJECT_TAG_LABELS[spark.project_tag] || spark.project_tag}
                        </span>
                      </div>

                      {/* 标题 */}
                      <h3 className="spark-title">{spark.title}</h3>

                      {/* 描述 */}
                      {spark.description && (
                        <p className="spark-description">{spark.description}</p>
                      )}

                      {/* 备注 */}
                      {spark.creator_comment && (
                        <div className="spark-comment">
                          💬 {spark.creator_comment}
                        </div>
                      )}

                      {/* 时间 */}
                      <div className="spark-time">
                        {formatDate(spark.updated_at)}
                      </div>

                      {/* 操作按钮 */}
                      <div className="spark-actions">
                        {/* 状态切换按钮 */}
                        {column.status === 'captured' && (
                          <>
                            <button
                              onClick={() => changeStatus(spark.id, 'thinking', '开始思考')}
                              className="btn-action btn-think"
                              disabled={updatingId !== null}
                            >
                              🤔 写思考
                            </button>
                            <button
                              onClick={() => changeStatus(spark.id, 'experimenting', '开始实验')}
                              className="btn-action btn-experiment"
                              disabled={updatingId !== null}
                            >
                              🔬 转实验
                            </button>
                          </>
                        )}

                        {column.status === 'thinking' && (
                          <>
                            <button
                              onClick={() => changeStatus(spark.id, 'captured', '返回捕获')}
                              className="btn-action btn-captured"
                              disabled={updatingId !== null}
                            >
                              ↩️ 返回
                            </button>
                            <button
                              onClick={() => changeStatus(spark.id, 'experimenting', '开始实验')}
                              className="btn-action btn-experiment"
                              disabled={updatingId !== null}
                            >
                              🔬 转实验
                            </button>
                          </>
                        )}

                        {column.status === 'experimenting' && (
                          <>
                            <button
                              onClick={() => changeStatus(spark.id, 'captured', '返回捕获')}
                              className="btn-action btn-captured"
                              disabled={updatingId !== null}
                            >
                              ↩️ 返回
                            </button>
                            <button
                              onClick={() => changeStatus(spark.id, 'archived', '完成并存档')}
                              className="btn-action btn-archive"
                              disabled={updatingId !== null}
                            >
                              ✅ 完成
                            </button>
                          </>
                        )}

                        {/* 删除按钮 */}
                        <button
                          onClick={() => deleteSpark(spark.id)}
                          className="btn-action btn-delete"
                          disabled={updatingId !== null}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
