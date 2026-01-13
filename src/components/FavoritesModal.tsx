import React from 'react';
import { X, Bookmark } from 'lucide-react';
import { getFavorites, removeFavorite } from '../utils/storage';

interface FavoritesModalProps {
  onClose: () => void;
}

export default function FavoritesModal({ onClose }: FavoritesModalProps) {
  const [favorites, setFavorites] = React.useState<string[]>(getFavorites());

  const handleRemove = (toolName: string) => {
    removeFavorite(toolName);
    setFavorites(getFavorites());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#2D2D3F] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-[#165DFF]" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              我的收藏
            </h2>
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-[#165DFF] text-sm rounded">
              {favorites.length} 个
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                还没有收藏任何工具
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E4FD0] transition-colors"
              >
                去探索
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((toolName, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-5 h-5 text-[#165DFF]" />
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {toolName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(toolName)}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        {favorites.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              收藏的工具保存在本地浏览器中
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
