import React, { useEffect, useState } from 'react';
import { CheckCircle, Zap, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'cache';
  duration?: number;
  onClose?: () => void;
}

/**
 * Toast通知组件
 */
export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    cache: <Zap className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    cache: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
  };

  return (
    <div className={`
      fixed top-20 right-4 z-50 max-w-sm
      transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg
        ${colors[type]}
      `}>
        {icons[type]}
        <div className="flex-1 text-sm font-medium">{message}</div>
        <button
          onClick={handleClose}
          className="p-1 hover:opacity-70 transition-opacity"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Toast容器组件（管理多个Toast）
 */
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: 'success' | 'cache' }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
