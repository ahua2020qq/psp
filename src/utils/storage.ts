// 本地存储工具 - Cookie和LocalStorage管理

import { UserPreferences } from '../types/user';

const STORAGE_KEYS = {
  USER_PREFS: 'toolsearch_user_preferences',
  FAVORITES: 'toolsearch_favorites',
  SEARCH_HISTORY: 'toolsearch_search_history',
  THEME: 'toolsearch_theme'
};

/**
 * 获取用户偏好（脱敏信息）
 * 从Cookie/LocalStorage读取，用于生成个性化推荐
 */
export function getUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('读取用户偏好失败:', error);
  }

  // 返回默认偏好
  return {
    techStack: ['Python', 'Go', 'JavaScript'],
    usageScenarios: ['项目开发', '数据分析', '系统监控'],
    environment: ['Linux', 'macOS'],
    toolPreferences: ['开源免费', '文档完善', '社区活跃']
  };
}

/**
 * 保存用户偏好
 */
export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify(prefs));
  } catch (error) {
    console.error('保存用户偏好失败:', error);
  }
}

/**
 * 获取收藏的工具列表
 */
export function getFavorites(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('读取收藏列表失败:', error);
  }
  return [];
}

/**
 * 添加收藏
 */
export function addFavorite(toolName: string): void {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(toolName)) {
      favorites.push(toolName);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('添加收藏失败:', error);
  }
}

/**
 * 移除收藏
 */
export function removeFavorite(toolName: string): void {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(name => name !== toolName);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
  } catch (error) {
    console.error('移除收藏失败:', error);
  }
}

/**
 * 检查是否已收藏
 */
export function isFavorite(toolName: string): boolean {
  return getFavorites().includes(toolName);
}

/**
 * 获取搜索历史
 */
export function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('读取搜索历史失败:', error);
  }
  return [];
}

/**
 * 添加搜索历史
 */
export function addSearchHistory(query: string): void {
  try {
    const history = getSearchHistory();
    // 移除重复项
    const filtered = history.filter(item => item !== query);
    // 添加到开头，保留最近20条
    filtered.unshift(query);
    const limited = filtered.slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(limited));
  } catch (error) {
    console.error('添加搜索历史失败:', error);
  }
}

/**
 * 清空搜索历史
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (error) {
    console.error('清空搜索历史失败:', error);
  }
}
