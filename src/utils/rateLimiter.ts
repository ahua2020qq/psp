/**
 * 速率限制器 - 防止恶意消耗API TOKEN
 * 功能：
 * 1. 5秒冷却时间（仅API查询，缓存查询不受限制）
 * 2. 每日限额30次API查询（缓存查询不计数）
 * 3. 使用设备指纹识别用户
 */

// 配置
const COOLDOWN_MS = 5000; // 5秒冷却
const DAILY_LIMIT = 30; // 每日30次API调用限制

// 存储键
const DEVICE_ID_KEY = 'psp_device_id';
const API_CALLS_KEY = 'psp_api_calls';
const LAST_API_CALL_KEY = 'psp_last_api_call';

// 速率限制统计接口
interface RateLimitStats {
  remainingCalls: number;
  cooldownRemaining: number;
  isAllowed: boolean;
  reason?: string;
}

/**
 * 生成或获取设备ID
 */
function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // 生成简单的设备指纹
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height,
      // 添加更多因素提高唯一性
      navigator.platform,
      navigator.hardwareConcurrency || 0
    ].join('|');

    // 简单哈希
    deviceId = 'device_' + btoa(fingerprint).substring(0, 16);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * 获取今天的日期字符串（用于重置计数）
 */
function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

/**
 * 获取API调用记录
 */
function getApiCalls(): Record<string, number> {
  const callsJson = localStorage.getItem(API_CALLS_KEY);
  return callsJson ? JSON.parse(callsJson) : {};
}

/**
 * 保存API调用记录
 */
function saveApiCalls(calls: Record<string, number>): void {
  localStorage.setItem(API_CALLS_KEY, JSON.stringify(calls));
}

/**
 * 检查速率限制（在调用API前调用）
 * @param isCachedQuery 是否为缓存查询
 * @returns 速率限制状态
 */
export function checkRateLimit(isCachedQuery = false): RateLimitStats {
  // 缓存查询不受限制
  if (isCachedQuery) {
    return {
      remainingCalls: DAILY_LIMIT,
      cooldownRemaining: 0,
      isAllowed: true
    };
  }

  const now = Date.now();
  const todayKey = getTodayKey();
  const calls = getApiCalls();

  // 检查每日限额
  const todayCalls = calls[todayKey] || 0;
  if (todayCalls >= DAILY_LIMIT) {
    return {
      remainingCalls: 0,
      cooldownRemaining: 0,
      isAllowed: false,
      reason: `今日API调用次数已达上限（${DAILY_LIMIT}次），缓存查询仍可使用`
    };
  }

  // 检查冷却时间
  const lastCallTime = parseInt(localStorage.getItem(LAST_API_CALL_KEY) || '0');
  const cooldownRemaining = Math.max(0, COOLDOWN_MS - (now - lastCallTime));

  if (cooldownRemaining > 0) {
    return {
      remainingCalls: DAILY_LIMIT - todayCalls,
      cooldownRemaining,
      isAllowed: false,
      reason: `请等待 ${(cooldownRemaining / 1000).toFixed(1)} 秒后重试`
    };
  }

  // 允许调用
  return {
    remainingCalls: DAILY_LIMIT - todayCalls,
    cooldownRemaining: 0,
    isAllowed: true
  };
}

/**
 * 记录API调用（在成功调用API后调用）
 * @param isCachedQuery 是否为缓存查询
 */
export function recordApiCall(isCachedQuery = false): void {
  // 缓存查询不记录
  if (isCachedQuery) {
    return;
  }

  const now = Date.now();
  const todayKey = getTodayKey();
  const calls = getApiCalls();

  // 增加今日调用计数
  calls[todayKey] = (calls[todayKey] || 0) + 1;
  saveApiCalls(calls);

  // 更新最后调用时间
  localStorage.setItem(LAST_API_CALL_KEY, now.toString());

  console.log(`📊 API调用统计: 今日 ${calls[todayKey]}/${DAILY_LIMIT}`);
}

/**
 * 获取速率限制信息（用于显示）
 */
export function getRateLimitInfo(): {
  deviceId: string;
  todayCalls: number;
  remainingCalls: number;
  todayKey: string;
} {
  const todayKey = getTodayKey();
  const calls = getApiCalls();
  const todayCalls = calls[todayKey] || 0;

  return {
    deviceId: getDeviceId(),
    todayCalls,
    remainingCalls: DAILY_LIMIT - todayCalls,
    todayKey
  };
}

/**
 * 重置速率限制（用于测试）
 */
export function resetRateLimit(): void {
  localStorage.removeItem(API_CALLS_KEY);
  localStorage.removeItem(LAST_API_CALL_KEY);
  console.log('🔄 速率限制已重置');
}

/**
 * 清除过期的API调用记录（保留最近7天）
 */
export function cleanupOldRecords(): void {
  const calls = getApiCalls();
  const today = new Date();
  const keysToDelete: string[] = [];

  // 遍历所有记录，删除7天前的
  for (const key of Object.keys(calls)) {
    const [year, month, day] = key.split('-').map(Number);
    const recordDate = new Date(year, month - 1, day);
    const daysDiff = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 7) {
      keysToDelete.push(key);
    }
  }

  // 删除过期记录
  keysToDelete.forEach(key => {
    delete calls[key];
  });

  if (keysToDelete.length > 0) {
    saveApiCalls(calls);
    console.log(`🧹 清理了 ${keysToDelete.length} 条过期记录`);
  }
}

// 自动清理（每次加载时执行）
cleanupOldRecords();
