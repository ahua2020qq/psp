/**
 * 工具数据缓存系统
 * 实现预生成数据的快速查询
 */

// 缓存数据结构
interface CachedTool {
  name: string;
  category: string;
  coreUsage: string;
  corePositioning: string;
  installation: {
    ubuntu: string;
    centos: string;
    docker: string;
    macos: string;
  };
  downloadUrl: {
    mirror: string;
    official: string;
  };
  commonIssues: Array<{
    rank: number;
    problem: string;
    solution: string;
  }>;
  commonCommands: Array<{
    command: string;
    description: string;
  }>;
  rating: number;
  applicableScenarios: string;
  coreAdvantages: string[];
  alternatives: string[];
  tags: string[];
}

interface CacheEntry {
  keyword: string;  // 搜索关键词
  tool: CachedTool;
  createdAt: number;
  hitCount: number;
}

// 缓存存储
const CACHE_STORAGE_KEY = 'psp_tools_cache';
const SEARCH_HISTORY_KEY = 'psp_search_history';

/**
 * 从缓存获取工具数据
 */
export function getFromCache(keyword: string): CachedTool | null {
  try {
    const cacheJson = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!cacheJson) return null;

    const cache: Record<string, CacheEntry> = JSON.parse(cacheJson);
    const entry = cache[keyword.toLowerCase()];

    if (entry) {
      // 更新命中次数
      entry.hitCount++;
      cache[keyword.toLowerCase()] = entry;
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));

      console.log(`✅ 缓存命中: ${keyword}`);
      return entry.tool;
    }

    return null;
  } catch (error) {
    console.error('缓存读取失败:', error);
    return null;
  }
}

/**
 * 保存到缓存
 */
export function saveToCache(keyword: string, tool: CachedTool): void {
  try {
    const cacheJson = localStorage.getItem(CACHE_STORAGE_KEY) || '{}';
    const cache: Record<string, CacheEntry> = JSON.parse(cacheJson);

    const key = keyword.toLowerCase();
    cache[key] = {
      keyword: key,
      tool: tool,
      createdAt: Date.now(),
      hitCount: 0
    };

    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    console.log(`💾 已缓存: ${keyword}`);
  } catch (error) {
    console.error('缓存保存失败:', error);
  }
}

/**
 * 获取所有搜索历史（用于批量生成）
 */
export function getSearchHistory(): string[] {
  try {
    const historyJson = localStorage.getItem(SEARCH_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('读取历史失败:', error);
    return [];
  }
}

/**
 * 记录搜索历史
 */
export function recordSearch(keyword: string): void {
  try {
    const history = getSearchHistory();
    if (!history.includes(keyword)) {
      history.push(keyword);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('记录历史失败:', error);
  }
}

/**
 * 获取热门搜索（用于批量生成优先级）
 */
export function getPopularSearches(minCount = 2): Array<{ keyword: string; count: number }> {
  const cacheJson = localStorage.getItem(CACHE_STORAGE_KEY);
  if (!cacheJson) return [];

  const cache: Record<string, CacheEntry> = JSON.parse(cacheJson);
  const results = Object.values(cache)
    .filter(entry => entry.hitCount >= minCount)
    .map(entry => ({
      keyword: entry.keyword,
      count: entry.hitCount
    }))
    .sort((a, b) => b.count - a.count);

  return results;
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  localStorage.removeItem(CACHE_STORAGE_KEY);
  console.log('🗑️ 缓存已清除');
}
