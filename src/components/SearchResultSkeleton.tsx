import React from 'react';

/**
 * 搜索结果骨架屏（加载占位符）
 */
export default function SearchResultSkeleton() {
  return (
    <div className="space-y-6">
      {/* 结果统计骨架 */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-4" />
      </div>

      {/* 主结果区骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {/* 主卡片骨架 */}
          <div className="bg-white dark:bg-[#2D2D3F] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div>
                  <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* 内容行 */}
            <div className="space-y-3">
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-5/6 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-4/6 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* 标签行 */}
            <div className="flex gap-2 mt-4">
              <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
          </div>

          {/* 折叠内容骨架 */}
          <div className="bg-white dark:bg-[#2D2D3F] rounded-xl p-6 border border-gray-100 dark:border-gray-700">
            {/* 选项卡 */}
            <div className="flex gap-4 mb-4">
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* 代码块骨架 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* 侧边栏骨架 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 相关工具骨架 */}
          <div className="bg-white dark:bg-[#2D2D3F] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* 广告骨架 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-3" />
            <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-2" />
            <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-3" />
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
