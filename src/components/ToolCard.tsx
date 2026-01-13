import React, { useState } from 'react';
import { Star, Calendar, Bookmark, BookmarkCheck, Copy, Check } from 'lucide-react';
import { isFavorite, addFavorite, removeFavorite } from '../utils/storage';

interface ToolCardProps {
  tool: any;
  rank?: number;
  onClick?: () => void;
}

export default function ToolCard({ tool, rank, onClick }: ToolCardProps) {
  const [isFav, setIsFav] = useState(isFavorite(tool.name));
  const [copied, setCopied] = useState(false);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) {
      removeFavorite(tool.name);
    } else {
      addFavorite(tool.name);
    }
    setIsFav(!isFav);
  };

  const handleCopyCommand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool.quickStart) {
      navigator.clipboard.writeText(tool.quickStart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#2D2D3F] rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer border border-gray-100 dark:border-gray-700"
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {rank && (
              <span className="flex items-center justify-center w-6 h-6 bg-[#165DFF] text-white text-sm rounded">
                {rank}
              </span>
            )}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {tool.name}
            </h3>
            {tool.rating === 5 && (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 fill-[#00B42A] text-[#00B42A]"
                  />
                ))}
              </div>
            )}
          </div>
          <span className="inline-block px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-[#165DFF] rounded">
            {tool.category}
          </span>
        </div>
        <button
          onClick={handleFavoriteToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={isFav ? '取消收藏' : '收藏'}
        >
          {isFav ? (
            <BookmarkCheck className="w-5 h-5 text-[#165DFF]" />
          ) : (
            <Bookmark className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* 核心用途 */}
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
        {tool.coreUsage}
      </p>

      {/* 适用场景 */}
      {tool.applicableScenarios && (
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-1">
          💡 {tool.applicableScenarios}
        </p>
      )}

      {/* 痛点说明（小众专精工具） */}
      {tool.painPointDescription && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-l-2 border-orange-400 px-3 py-2 mb-3">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            ⚡ {tool.painPointDescription}
          </p>
        </div>
      )}

      {/* 快速上手 - 带复制按钮 */}
      {tool.quickStart && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 mb-3 group">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-mono flex-1 truncate">
              {tool.quickStart}
            </p>
            <button
              onClick={handleCopyCommand}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="复制命令"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        {tool.updateDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{tool.updateDate}</span>
          </div>
        )}
        {tool.latestVersion && (
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
            {tool.latestVersion}
          </span>
        )}
      </div>
    </div>
  );
}