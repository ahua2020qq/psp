import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1E1E2E] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              出错了
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              页面加载出现问题，请刷新重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E4FD0] transition-colors"
            >
              刷新页面
            </button>
            {this.state.error && (
              <details className="mt-4 text-left text-sm text-gray-500">
                <summary>错误详情</summary>
                <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
