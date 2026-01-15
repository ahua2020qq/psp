/**
 * 国际化（i18n）系统
 * 支持中英文切换
 */

export type Language = 'zh' | 'en';

export interface Translations {
  // 通用
  appName: string;
  appSlogan: string;
  openSource: string;

  // 搜索框
  searchPlaceholder: string;
  searchButton: string;
  hotSearches: string;
  clear: string;

  // 首页
  welcomeTitle: string;
  welcomeDesc: string;

  // 加载状态
  loading: string;
  searching: string;

  // 结果页
  resultsCount: string;
  searchTime: string;
  searchIntent: string;
  relatedTools: string;
  backToHome: string;

  // 配额
  dailyQuota: string;
  times: string;
  remaining: string;
  cacheTip: string;

  // Toast 通知
  cacheHit: string;
  searchComplete: string;
  rateLimitError: string;
  searchFailed: string;

  // 速率限制
  cooldownError: string;
  dailyLimitError: string;
  rateLimitTitle: string;
  rateLimitStats: string;
  quotaUsed: string;
  quotaRemaining: string;
  cacheUnlimited: string;

  // 收藏
  favorites: string;
  myFavorites: string;
  noFavorites: string;

  // 页脚
  source: string;
  lastUpdate: string;
  aboutUs: string;
  privacyPolicy: string;
  advertising: string;

  // 广告
  ad: string;

  // 工具详情
  installation: string;
  ubuntu: string;
  centos: string;
  docker: string;
  macos: string;
  download: string;
  mirror: string;
  official: string;
  commonIssues: string;
  commonCommands: string;
  coreAdvantages: string;
  alternatives: string;
  applicableScenarios: string;
  corePositioning: string;
  copy: string;
  copied: string;

  // 错误
  error: string;
  retry: string;
}

const translations: Record<Language, Translations> = {
  zh: {
    // 通用
    appName: 'ToolSearch',
    appSlogan: '开源驱动',
    openSource: '开源',

    // 搜索框
    searchPlaceholder: '请输入工具名称（如：zabbix、mysql、golang）',
    searchButton: '搜索',
    hotSearches: '热门搜索：',
    clear: '清除',

    // 首页
    welcomeTitle: '程序员工具搜索平台',
    welcomeDesc: '基于 LLM 的智能工具搜索引擎',

    // 加载状态
    loading: '加载中...',
    searching: '搜索中...',

    // 结果页
    resultsCount: '找到',
    searchTime: '个相关工具',
    searchIntent: '搜索意图',
    relatedTools: '相关工具',
    backToHome: '返回首页',

    // 配额
    dailyQuota: '今日API配额：',
    times: '次',
    remaining: '剩余',
    cacheTip: '💡 缓存查询不计配额',

    // Toast 通知
    cacheHit: '⚡ 从缓存加载',
    searchComplete: '✅ 搜索完成',
    rateLimitError: '⚠️',
    searchFailed: '搜索失败，请稍后重试',

    // 速率限制
    cooldownError: '请等待 {cooldown} 秒后重试',
    dailyLimitError: '今日API调用次数已达上限（{limit}次），缓存查询仍可使用',
    rateLimitTitle: '⚠️ 速率限制',
    rateLimitStats: '今日API调用统计：',
    quotaUsed: '• 已使用：',
    quotaRemaining: '• 剩余：',
    cacheUnlimited: '💡 缓存查询不受限制，已缓存工具可无限次使用',

    // 收藏
    favorites: '收藏工具',
    myFavorites: '我的收藏',
    noFavorites: '暂无收藏的工具',

    // 页脚
    source: '数据来源：开源社区 + AI智能生成',
    lastUpdate: '最后更新：2026-01-13',
    aboutUs: '豆芽空间',
    privacyPolicy: '隐私政策',
    advertising: '广告合作',

    // 广告
    ad: '广告',

    // 工具详情
    installation: '安装',
    ubuntu: 'Ubuntu',
    centos: 'CentOS',
    docker: 'Docker',
    macos: 'macOS',
    download: '下载',
    mirror: '国内镜像',
    official: '官方链接',
    commonIssues: '常见问题',
    commonCommands: '常用命令',
    coreAdvantages: '核心优势',
    alternatives: '替代方案',
    applicableScenarios: '适用场景',
    corePositioning: '定位',
    copy: '复制',
    copied: '已复制',

    // 错误
    error: '出错了',
    retry: '重试',
  },

  en: {
    // 通用
    appName: 'ToolSearch',
    appSlogan: 'Open Source Driven',
    openSource: 'Open Source',

    // 搜索框
    searchPlaceholder: 'Enter tool name (e.g., zabbix, mysql, golang)',
    searchButton: 'Search',
    hotSearches: 'Hot Searches: ',
    clear: 'Clear',

    // 首页
    welcomeTitle: 'Programmer Tool Search Platform',
    welcomeDesc: 'LLM-Powered Intelligent Tool Search Engine',

    // 加载状态
    loading: 'Loading...',
    searching: 'Searching...',

    // 结果页
    resultsCount: 'Found',
    searchTime: 'related tools',
    searchIntent: 'Search Intent',
    relatedTools: 'Related Tools',
    backToHome: 'Back to Home',

    // 配额
    dailyQuota: 'Daily API Quota: ',
    times: ' times',
    remaining: 'Remaining',
    cacheTip: '💡 Cache queries are free',

    // Toast 通知
    cacheHit: '⚡ Loaded from cache',
    searchComplete: '✅ Search complete',
    rateLimitError: '⚠️',
    searchFailed: 'Search failed, please try again later',

    // 速率限制
    cooldownError: 'Please wait {cooldown} seconds before retrying',
    dailyLimitError: 'Daily API call limit reached ({limit} calls), cache queries still available',
    rateLimitTitle: '⚠️ Rate Limit',
    rateLimitStats: 'Today\'s API Call Statistics:',
    quotaUsed: '• Used: ',
    quotaRemaining: '• Remaining: ',
    cacheUnlimited: '💡 Cache queries are unlimited, cached tools can be queried infinitely',

    // 收藏
    favorites: 'Favorites',
    myFavorites: 'My Favorites',
    noFavorites: 'No favorites yet',

    // 页脚
    source: 'Data Source: Open Source + AI Generated',
    lastUpdate: 'Last Updated: 2026-01-13',
    aboutUs: 'About Us',
    privacyPolicy: 'Privacy Policy',
    advertising: 'Advertise',

    // 广告
    ad: 'Advertisement',

    // 工具详情
    installation: 'Installation',
    ubuntu: 'Ubuntu',
    centos: 'CentOS',
    docker: 'Docker',
    macos: 'macOS',
    download: 'Download',
    mirror: 'China Mirror',
    official: 'Official Link',
    commonIssues: 'Common Issues',
    commonCommands: 'Common Commands',
    coreAdvantages: 'Core Advantages',
    alternatives: 'Alternatives',
    applicableScenarios: 'Applicable Scenarios',
    corePositioning: 'Positioning',
    copy: 'Copy',
    copied: 'Copied',

    // 错误
    error: 'Error',
    retry: 'Retry',
  },
};

/**
 * 获取翻译文本
 */
export function t(key: keyof Translations, lang: Language = 'zh'): string {
  return translations[lang][key];
}

/**
 * 格式化翻译文本（支持变量替换）
 */
export function tf(
  key: keyof Translations,
  params: Record<string, string | number>,
  lang: Language = 'zh'
): string {
  let text = translations[lang][key];
  Object.keys(params).forEach(paramKey => {
    text = text.replace(`{${paramKey}}`, String(params[paramKey]));
  });
  return text;
}

/**
 * 获取所有翻译
 */
export function getTranslations(lang: Language): Translations {
  return translations[lang];
}
