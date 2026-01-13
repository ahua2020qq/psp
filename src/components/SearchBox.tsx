import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { addSearchHistory, getSearchHistory } from '../utils/storage';
import { Language, t } from '../utils/i18n';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  hasResults?: boolean;
  onClear?: () => void;
  lang: Language;
}

const POPULAR_SEARCHES_ZH = ['Zabbix', 'MySQL', 'Docker', 'Git', 'Prometheus', 'Redis'];
const POPULAR_SEARCHES_EN = ['Zabbix', 'MySQL', 'Docker', 'Git', 'Prometheus', 'Redis'];

const SUGGESTIONS_ZH = [
  { name: 'Zabbix', desc: '企业级监控工具' },
  { name: 'MySQL', desc: '关系型数据库' },
  { name: 'Docker', desc: '容器化平台' },
  { name: 'Git', desc: '版本控制系统' },
  { name: 'Prometheus', desc: '云原生监控' },
  { name: 'Redis', desc: '键值存储' },
  { name: 'Nginx', desc: 'Web服务器' },
  { name: 'PostgreSQL', desc: '关系型数据库' },
  { name: 'Kubernetes', desc: '容器编排' },
  { name: 'Jenkins', desc: 'CI/CD工具' }
];

const SUGGESTIONS_EN = [
  { name: 'Zabbix', desc: 'Enterprise Monitoring Tool' },
  { name: 'MySQL', desc: 'Relational Database' },
  { name: 'Docker', desc: 'Container Platform' },
  { name: 'Git', desc: 'Version Control System' },
  { name: 'Prometheus', desc: 'Cloud-Native Monitoring' },
  { name: 'Redis', desc: 'Key-Value Store' },
  { name: 'Nginx', desc: 'Web Server' },
  { name: 'PostgreSQL', desc: 'Relational Database' },
  { name: 'Kubernetes', desc: 'Container Orchestration' },
  { name: 'Jenkins', desc: 'CI/CD Tool' }
];

export default function SearchBox({ onSearch, isLoading, hasResults, onClear, lang }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(
    lang === 'zh' ? SUGGESTIONS_ZH : SUGGESTIONS_EN
  );
  const [trendingRepos, setTrendingRepos] = useState<string[]>([]);
  const POPULAR_SEARCHES = lang === 'zh' ? POPULAR_SEARCHES_ZH : POPULAR_SEARCHES_EN;
  const SUGGESTIONS = lang === 'zh' ? SUGGESTIONS_ZH : SUGGESTIONS_EN;

  // 获取 GitHub Trending
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/trending');
        const data = await response.json();
        if (data.repos && data.repos.length > 0) {
          // 提取项目名称（取 owner/repo 中的 repo 部分）
          const repoNames = data.repos.map((repo: string) => {
            const parts = repo.split('/');
            return parts[parts.length - 1]; // 取最后一部分（项目名）
          });
          setTrendingRepos(repoNames);
          console.log('🔥 GitHub Trending:', repoNames);
        }
      } catch (error) {
        console.log('⚠️ 获取 Trending 失败，使用默认列表');
      }
    };

    fetchTrending();
  }, []);

  // 当语言改变时更新建议
  useEffect(() => {
    setFilteredSuggestions(lang === 'zh' ? SUGGESTIONS_ZH : SUGGESTIONS_EN);
  }, [lang]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.trim()) {
      const filtered = SUGGESTIONS.filter(
        item =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.desc.includes(query)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);

      // 5秒后自动隐藏建议框
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
      suggestionTimerRef.current = setTimeout(() => {
        setShowSuggestions(false);
      }, 5000);
    } else {
      setFilteredSuggestions(SUGGESTIONS);
      setShowSuggestions(false);
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
        suggestionTimerRef.current = null;
      }
    }

    // 清理函数：组件卸载时清除定时器
    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, [query]);

  const handleSearch = () => {
    if (query.trim()) {
      addSearchHistory(query);
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (name: string) => {
    setQuery(name);
    addSearchHistory(name);
    onSearch(name);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* 自然语言提示 */}
      {!hasResults && !query && (
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
            💡 {lang === 'zh' ? '自然语言搜索，懂你就好' : 'Natural Language Search'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {lang === 'zh' ? (
              <>
                <span className="text-gray-500">不需要知道工具名、分类或关键词</span>
                <span className="mx-2">•</span>
                <span className="text-gray-700">试试说：</span>
                <button
                  onClick={() => handleSuggestionClick('我想写日记')}
                  className="mx-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-[#165DFF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                  "我想写日记"
                </button>
                <button
                  onClick={() => handleSuggestionClick('替代Photoshop的软件')}
                  className="mx-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-[#165DFF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                  "替代Photoshop的软件"
                </button>
                <button
                  onClick={() => handleSuggestionClick('Mac上的视频剪辑')}
                  className="mx-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-[#165DFF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                  "Mac上的视频剪辑"
                </button>
              </>
            ) : (
              <>
                <span className="text-gray-500">No need to know tool names, categories, or keywords</span>
                <span className="mx-2">•</span>
                <span className="text-gray-700">Try:</span>
                <button
                  onClick={() => handleSuggestionClick('journaling app')}
                  className="mx-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-[#165DFF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                  "journaling app"
                </button>
                <button
                  onClick={() => handleSuggestionClick('Photoshop alternative')}
                  className="mx-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-[#165DFF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                  "Photoshop alternative"
                </button>
                <button
                  onClick={() => handleSuggestionClick('video editing on Mac')}
                  className="mx-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-[#165DFF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                  "video editing on Mac"
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 搜索框 */}
      <div className="relative">
        <div
          className={`
            relative bg-white dark:bg-[#2D2D3F] rounded-xl shadow-lg
            transition-all duration-300
            ${showSuggestions || query ? 'ring-2 ring-[#165DFF]' : ''}
          `}
        >
          <div className="flex items-center px-6 py-5">
            <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => !query && setShowSuggestions(false)}
              placeholder={t('searchPlaceholder', lang)}
              className="flex-1 mx-4 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-lg"
            />
            {query && (
              <button
                onClick={handleClear}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={t('clear', lang)}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-[#165DFF] animate-spin" />
            ) : (
              <button
                onClick={handleSearch}
                disabled={!query.trim()}
                className="px-6 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E4FD0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('searchButton', lang)}
              </button>
            )}
          </div>

          {/* 加载进度条 */}
          {isLoading && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#165DFF] animate-pulse" />
          )}
        </div>

        {/* 联想建议下拉框 */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#2D2D3F] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            {filteredSuggestions.slice(0, 6).map((item, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(item.name)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div>
                  <div className="text-gray-800 dark:text-gray-100">{item.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</div>
                </div>
                <Search className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 热门搜索提示 */}
      {!hasResults && !query && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">
            {trendingRepos.length > 0 ? '🔥 GitHub Trending' : t('hotSearches', lang)}
          </span>
          {(trendingRepos.length > 0 ? trendingRepos : POPULAR_SEARCHES).map((term, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(term)}
              className="inline-block mx-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-[#165DFF] dark:hover:text-[#165DFF] transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
