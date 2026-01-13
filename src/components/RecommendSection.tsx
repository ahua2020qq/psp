import React from 'react';
import ToolCard from './ToolCard';

interface RecommendSectionProps {
  data: {
    personalizedTop5?: any[];
    popularTop3?: any[];
    nicheTop2?: any[];
  };
  onToolClick?: (tool: any) => void;
}

export default function RecommendSection({ data, onToolClick }: RecommendSectionProps) {
  // 添加安全检查和默认值
  const personalizedTop5 = data?.personalizedTop5 || [];
  const popularTop3 = data?.popularTop3 || [];
  const nicheTop2 = data?.nicheTop2 || [];

  return (
    <div className="space-y-12">
      {/* 个性化排行 */}
      {personalizedTop5.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                为你推荐
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                根据你的技术栈和使用场景推荐
              </p>
            </div>
            <button className="text-sm text-[#165DFF] hover:underline">
              换一批
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalizedTop5.map((tool, index) => (
              <ToolCard
                key={index}
                tool={tool}
                rank={index + 1}
                onClick={() => onToolClick?.(tool)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 热门工具 */}
      {popularTop3.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              热门工具
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              最受开发者欢迎的工具
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularTop3.map((tool, index) => (
              <ToolCard
                key={index}
                tool={tool}
                onClick={() => onToolClick?.(tool)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 小众专精 */}
      {nicheTop2.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              小众专精
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              解决特定痛点的优质工具
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nicheTop2.map((tool, index) => (
              <ToolCard
                key={index}
                tool={tool}
                onClick={() => onToolClick?.(tool)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 推荐区底部广告 */}
      <div className="mt-12">
        <div className="bg-white dark:bg-[#2D2D3F] rounded-xl p-6 border-2 border-[#165DFF] border-dashed">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">广告</div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              开发者工具插件推荐
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              提升开发效率的必备插件 · VS Code / JetBrains 系列全支持
            </p>
            <button className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#165DFF] transition-colors">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
