import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { addSearchHistory, getSearchHistory } from '../utils/storage';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  hasResults?: boolean;
  onClear?: () => void;
}

const POPULAR_SEARCHES = ['Zabbix', 'MySQL', 'Docker', 'Git', 'Prometheus', 'Redis'];

const SUGGESTIONS = [
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

export default function SearchBox({ onSearch, isLoading, hasResults, onClear }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(SUGGESTIONS);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim()) {
      const filtered = SUGGESTIONS.filter(
        item =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.desc.includes(query)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions(SUGGESTIONS);
      setShowSuggestions(false);
    }
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
              placeholder="请输入工具名称（如：zabbix、mysql、golang）"
              className="flex-1 mx-4 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-lg"
            />
            {query && (
              <button
                onClick={handleClear}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="清除"
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
                搜索
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
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">热门搜索：</span>
          {POPULAR_SEARCHES.map((term, index) => (
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
