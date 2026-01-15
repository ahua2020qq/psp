import React, { useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import ToolDetailCard from './ToolDetailCard';
import { Language, t } from '../utils/i18n';

interface SearchResultsProps {
  results: any;
  query: string;
  lang: Language;
}

export default function SearchResults({ results, query, lang }: SearchResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  return (
    <div className="space-y-6">
      {/* 拼写纠错提示 */}
      {results.correctedQuery && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-[#165DFF]" />
            <span className="text-gray-700 dark:text-gray-300">
              {lang === 'zh' ? '你是不是想找：' : 'Did you mean: '}
              <span className="font-semibold text-[#165DFF] ml-2">
                {results.correctedQuery}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* 结果统计 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              {t('resultsCount', lang)} <span className="font-semibold text-gray-800 dark:text-gray-200">{results.resultCount}</span> {t('searchTime', lang)}
              <span className="text-gray-400 ml-2">({results.searchTime})</span>
            </span>
          </div>

          {/* 缓存来源提示 */}
          {(results.fromCache !== undefined || results.debugInfo) && (
            <span className={`
              inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
              ${results.fromCache
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
              }
            `}>
              {results.fromCache ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></span>
                  {lang === 'zh' ? '服务器缓存' : 'Server Cache'}
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400"></span>
                  {lang === 'zh' ? 'AI 实时生成' : 'AI Generated'}
                </>
              )}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('searchIntent', lang)}：{results.searchIntent}
        </div>
      </div>

      {/* 结果区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 主结果区 - 双语卡片 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 根据 API 返回的数据结构判断是否为双语版本 */}
          {results.zh && results.en ? (
            // 新版双语数据：根据语言决定显示哪个版本
            (lang === 'zh' ? results.zh.results : results.en.results).map((tool: any, index: number) => (
              <ToolDetailCard
                key={`bilingual-${index}`}
                tool={tool}
                isExpanded={expandedIndex === index}
                onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
                query={query}
                lang={lang}
              />
            ))
          ) : (
            // 旧版单语数据：保持原样
            results.results.map((tool: any, index: number) => (
              <ToolDetailCard
                key={index}
                tool={tool}
                isExpanded={expandedIndex === index}
                onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
                query={query}
                lang={lang}
              />
            ))
          )}
        </div>

        {/* 侧边栏 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 工具热点 */}
          <div className="bg-white dark:bg-[#2D2D3F] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span>🔥</span>
              <span>工具热点</span>
            </h3>
            <div className="space-y-3">
              <a
                href="https://github.com/trending"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#165DFF] dark:group-hover:text-[#165DFF] transition-colors line-clamp-2">
                  GitHub Trending - 今日热门开源项目
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  github.com
                </div>
              </a>
              <a
                href="https://techcrunch.com/category/startups/"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#165DFF] dark:group-hover:text-[#165DFF] transition-colors line-clamp-2">
                  TechCrunch - 创业与技术动态
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  techcrunch.com
                </div>
              </a>
              <a
                href="https://www.infoq.cn/topic/open-source"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#165DFF] dark:group-hover:text-[#165DFF] transition-colors line-clamp-2">
                  InfoQ - 开源技术深度解读
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  infoq.cn
                </div>
              </a>
              <a
                href="https://www.oschina.net/news"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#165DFF] dark:group-hover:text-[#165DFF] transition-colors line-clamp-2">
                  开源中国 - 开源资讯快报
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  oschina.net
                </div>
              </a>
              <a
                href="https://juejin.cn/tag/前端"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#165DFF] dark:group-hover:text-[#165DFF] transition-colors line-clamp-2">
                  掘金 - 前端技术精选
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  juejin.cn
                </div>
              </a>
            </div>
          </div>

          {/* 相关推荐 */}
          <div className="bg-white dark:bg-[#2D2D3F] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              相关工具
            </h3>
            <div className="space-y-3">
              {results.relatedTools?.map((tool: any, index: number) => (
                <div key={index} className="pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                      {tool.name}
                    </div>
                    {tool.relationTag && (
                      <span className={`
                        text-xs px-2 py-0.5 rounded whitespace-nowrap
                        ${tool.relationTag === '搭配使用' 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : tool.relationTag === '替代工具'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        }
                      `}>
                        {tool.relationTag}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {tool.category}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {tool.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 侧边栏广告 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 border-2 border-[#165DFF] border-dashed">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
              广告
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {query} 实战教程
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                从入门到精通<br />限时免费试听
              </p>
              <button className="w-full px-4 py-2 bg-[#165DFF] text-white text-sm rounded-lg hover:bg-[#0E4FD0] transition-colors">
                立即学习
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}