import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, Bookmark, ArrowLeft, Languages } from 'lucide-react';
import SearchBox from './components/SearchBox';
import SearchResults from './components/SearchResults';
import SearchResultSkeleton from './components/SearchResultSkeleton';
import FavoritesModal from './components/FavoritesModal';
import { ToastContainer } from './components/Toast';
import { callLLM, RateLimitError } from './api/llmApi';
import { getRateLimitInfo } from './utils/rateLimiter';
import { Language, getTranslations, t } from './utils/i18n';

/**
 * 速率限制显示组件
 */
function RateLimitDisplay({ lang }: { lang: Language }) {
  const [rateInfo, setRateInfo] = useState(getRateLimitInfo());

  // 每秒更新一次（用于实时显示配额）
  useEffect(() => {
    const interval = setInterval(() => {
      setRateInfo(getRateLimitInfo());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const usagePercent = (rateInfo.todayCalls / 30) * 100;
  const isLowQuota = rateInfo.remainingCalls <= 5;

  return (
    <div className={`
      inline-flex items-center gap-3 px-4 py-2 rounded-lg text-sm
      ${isLowQuota
        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
      }
    `}>
      <div className="flex items-center gap-2">
        <span className="font-medium">{t('dailyQuota', lang)}</span>
        <span className={`
          font-bold ${isLowQuota ? 'text-orange-600 dark:text-orange-400' : ''}
        `}>
          {rateInfo.remainingCalls}/30
        </span>
        <span className="text-xs opacity-70">{t('times', lang)}</span>
      </div>

      {/* 进度条 */}
      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`
            h-full transition-all duration-300
            ${isLowQuota
              ? 'bg-orange-500'
              : usagePercent > 70
              ? 'bg-yellow-500'
              : 'bg-green-500'
            }
          `}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {/* 缓存提示 */}
      <span className="text-xs opacity-70">
        {t('cacheTip', lang)}
      </span>
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'cache' }>>([]);
  const [lang, setLang] = useState<Language>(() => {
    // 从localStorage读取语言偏好，默认中文
    const savedLang = localStorage.getItem('psp_language') as Language;
    return savedLang || 'zh';
  });

  // 切换语言
  const toggleLanguage = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    setLang(newLang);
    localStorage.setItem('psp_language', newLang);
  };

  // 显示Toast通知
  const showToast = (message: string, type?: 'success' | 'cache') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 处理搜索
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchQuery(query);
    setSearchResults(null); // 清除旧结果，显示骨架屏

    try {
      console.log("开始搜索:", query);
      const startTime = Date.now();
      const results = await callLLM(query);
      const searchTime = ((Date.now() - startTime) / 1000).toFixed(1);

      if (results) {
        setSearchResults(results);

        // 根据搜索时间判断是否从缓存加载
        if (parseFloat(searchTime) < 0.5) {
          showToast(`⚡ 从缓存加载（${searchTime}秒）`, 'cache');
        } else {
          const rateInfo = getRateLimitInfo();
          showToast(`✅ 搜索完成（今日剩余 ${rateInfo.remainingCalls} 次API调用）`, 'success');
        }
      } else {
        alert("搜索失败，请稍后重试");
      }
    } catch (error) {
      // 处理速率限制错误
      if (error instanceof RateLimitError) {
        const rateInfo = getRateLimitInfo();
        showToast(
          `⚠️ ${error.message}（今日剩余: ${rateInfo.remainingCalls}次）`,
          'cache'
        );

        // 显示详细错误对话框
        alert(
          `⚠️ 速率限制\n\n` +
          `${error.message}\n\n` +
          `今日API调用统计：\n` +
          `• 已使用：${rateInfo.todayCalls}/${30}次\n` +
          `• 剩余：${rateInfo.remainingCalls}次\n\n` +
          `💡 缓存查询不受限制，已缓存工具可无限次使用`
        );
      } else {
        console.error("搜索失败:", error);
        alert("搜索失败: " + (error as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // 返回首页
  const handleBackToHome = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // 测试 KV 缓存功能
  const testKVCache = async () => {
    console.log('🔍 开始测试 KV 缓存功能...');
    console.log('='.repeat(50));

    try {
      // 测试 1: 检查 /api/test-kv 接口
      console.log('📡 测试 1: 检查 /api/test-kv 接口...');
      const testKVResponse = await fetch('/api/test-kv');
      const contentType = testKVResponse.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (contentType && contentType.includes('application/json')) {
        const kvData = await testKVResponse.json();
        console.log('✅ /api/test-kv 返回 JSON 数据');
        console.log('KV 绑定状态:', kvData.kvBinding);
        console.log('已缓存工具数:', kvData.cachedTools.count);
        alert(`✅ KV API 正常工作！\n\n绑定状态: ${kvData.kvBinding.exists ? '已绑定' : '未绑定'}\n已缓存工具: ${kvData.cachedTools.count} 个\n\n详细信息请查看浏览器控制台（F12）`);
      } else {
        console.log('❌ /api/test-kv 返回的不是 JSON');
        const text = await testKVResponse.text();
        console.log('返回内容前100字符:', text.substring(0, 100));
        alert('❌ /api/test-kv 返回 HTML 而不是 JSON\n\nFunctions 未被正确部署！\n\n详细信息请查看浏览器控制台（F12）');
      }
    } catch (error) {
      console.error('❌ 测试失败:', error);
      alert(`❌ 测试失败: ${error}\n\n详细信息请查看浏览器控制台（F12）`);
    }

    console.log('='.repeat(50));
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1E1E2E] transition-colors">
        {/* 顶部导航栏 */}
        <header className="bg-white dark:bg-[#2D2D3F] shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#165DFF] rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-[#333647] dark:text-[#F5F7FA]">
                    ToolSearch
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">开源驱动</p>
                </div>
              </div>

              {/* 右侧操作 */}
              <div className="flex items-center gap-4">
                {/* 语言切换 */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Switch Language"
                  title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
                >
                  <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {lang === 'zh' ? '中' : 'EN'}
                  </span>
                </button>

                {/* 主题切换 */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="切换主题"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* 收藏工具 */}
                <button
                  onClick={() => setShowFavorites(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bookmark className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('favorites', lang)}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 搜索框区域 */}
          <div className="mb-12">
            <SearchBox
              onSearch={handleSearch}
              isLoading={isLoading}
              hasResults={!!searchResults}
              onClear={handleClearSearch}
              lang={lang}
            />
          </div>

          {/* 返回按钮（当有搜索结果时） */}
          {searchQuery && (
            <div className="mb-6">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('backToHome', lang)}
              </button>
            </div>
          )}

          {/* 内容显示逻辑 */}
          {isLoading ? (
            // 加载中显示骨架屏
            <SearchResultSkeleton />
          ) : searchResults ? (
            // 搜索结果页面
            <SearchResults results={searchResults} query={searchQuery} lang={lang} />
          ) : null}

          {/* 页脚广告位 */}
          {!searchResults && (
            <div className="mt-16">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('ad', lang)}</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {lang === 'zh' ? '云服务器新用户专享优惠' : 'Cloud Server New User Exclusive Offer'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {lang === 'zh' ? '1核2G 99元/年 · 高性能云数据库 · 免费迁移服务' : '1 Core 2GB 99 CNY/Year · High-Performance Cloud DB · Free Migration'}
                </p>
                <button className="px-6 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0E4FD0] transition-colors">
                  {lang === 'zh' ? '立即查看' : 'Learn More'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* 页脚 */}
        {!searchResults && (
          <footer className="bg-white dark:bg-[#2D2D3F] border-t border-gray-200 dark:border-gray-700 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* API配额显示 */}
              <div className="mb-4 text-center">
                <RateLimitDisplay lang={lang} />
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>{t('source', lang)} | {t('lastUpdate', lang)}</p>
                <div className="flex justify-center gap-6">
                  <a href="#" className="hover:text-[#165DFF] transition-colors">{t('aboutUs', lang)}</a>
                  <a href="#" className="hover:text-[#165DFF] transition-colors">{t('privacyPolicy', lang)}</a>
                  <a href="#" className="hover:text-[#165DFF] transition-colors">{t('advertising', lang)}</a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      testKVCache();
                    }}
                    className="text-xs text-gray-400 hover:text-[#165DFF] transition-colors"
                  >
                    🔍 KV缓存调试
                  </a>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* 收藏夹弹窗 */}
      {showFavorites && (
        <FavoritesModal onClose={() => setShowFavorites(false)} />
      )}

      {/* Toast通知容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
