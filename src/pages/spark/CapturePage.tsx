import React, { useState, useEffect } from 'react';
import '../spark/CapturePage.css';

/**
 * OpenSight 火花捕获页面
 * 路径: /spark/capture
 * 功能: 快速记录灵感（10秒内完成）
 */
interface SparkData {
  title: string;
  project_tag: string;
  description?: string;
  creator_comment?: string;
}

export default function CapturePage() {
  const [formData, setFormData] = useState<SparkData>({
    title: '',
    project_tag: 'douya',
    description: '',
    creator_comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 自动聚焦标题输入框
  useEffect(() => {
    const titleInput = document.getElementById('spark-title') as HTMLInputElement;
    if (titleInput) {
      titleInput.focus();
    }

    // 支持快捷键 Ctrl+Enter 提交
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        handleSubmit(e as any);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: '请输入灵感标题' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sparks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          project_tag: formData.project_tag,
          description: formData.description.trim() || undefined,
          creator_comment: formData.creator_comment.trim() || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '✓ 火花已捕获！' });

        // 清空表单
        setFormData({
          title: '',
          project_tag: 'douya',
          description: '',
          creator_comment: ''
        });

        // 重新聚焦
        setTimeout(() => {
          const titleInput = document.getElementById('spark-title') as HTMLInputElement;
          if (titleInput) titleInput.focus();
        }, 100);

        // 3秒后清除成功消息
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || '捕获失败，请重试' });
      }
    } catch (error) {
      console.error('提交火花错误:', error);
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="spark-capture-container">
      <div className="spark-capture-card">
        <div className="spark-header">
          <h1>✨ 捕获火花</h1>
          <p className="spark-subtitle">快速记录你的灵感</p>
        </div>

        <form onSubmit={handleSubmit} className="spark-form">
          {/* 标题输入框 */}
          <div className="form-group">
            <label htmlFor="spark-title">
              灵感标题 <span className="required">*</span>
            </label>
            <input
              id="spark-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="一句话描述你的灵感..."
              className="form-input"
              maxLength={200}
              disabled={isSubmitting}
              required
            />
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* 项目标签 */}
          <div className="form-group">
            <label htmlFor="project-tag">关联项目</label>
            <select
              id="project-tag"
              value={formData.project_tag}
              onChange={(e) => setFormData({ ...formData, project_tag: e.target.value })}
              className="form-select"
              disabled={isSubmitting}
            >
              <option value="douya">Douya.chat</option>
              <option value="opensight">OpenSight</option>
              <option value="deepseek">DeepSeek</option>
              <option value="experiment">新实验</option>
              <option value="other">其他</option>
            </select>
          </div>

          {/* 详细描述（可选） */}
          <div className="form-group">
            <label htmlFor="description">详细描述（可选）</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="展开说明你的想法..."
              className="form-textarea"
              rows={4}
              maxLength={1000}
              disabled={isSubmitting}
            />
            <span className="char-count">{formData.description.length}/1000</span>
          </div>

          {/* 备注（可选） */}
          <div className="form-group">
            <label htmlFor="comment">随手备注（可选）</label>
            <input
              id="comment"
              type="text"
              value={formData.creator_comment}
              onChange={(e) => setFormData({ ...formData, creator_comment: e.target.value })}
              placeholder="任何备注信息..."
              className="form-input"
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>

          {/* 消息提示 */}
          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {/* 提交按钮 */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? '捕获中...' : '⚡ 快速捕获'}
            </button>

            <a href="/spark/board" className="btn btn-secondary">
              查看工作台
            </a>
          </div>

          {/* 快捷键提示 */}
          <div className="shortcut-hint">
            💡 提示: Ctrl+Enter 快速提交
          </div>
        </form>
      </div>
    </div>
  );
}
