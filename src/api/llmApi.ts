import axios from 'axios'
import { getFromCache, saveToCache, recordSearch } from '../utils/cache';
import { checkRateLimit, recordApiCall } from '../utils/rateLimiter';

// API配置
const API_BASE_URL = "/api"

/**
 * 速率限制错误
 */
export class RateLimitError extends Error {
  constructor(message: string, public readonly remainingCalls?: number, public readonly cooldownRemaining?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * 调用LLM搜索API（带缓存和速率限制）
 */
export const callLLM = async (userInput: string) => {
  console.log("🔍 开始搜索:", userInput)

  if (!userInput || userInput.trim() === "") {
    console.log("⚠️ 用户输入为空")
    return null
  }

  // 1. 先查缓存
  const cached = getFromCache(userInput)
  if (cached) {
    console.log("⚡ 使用缓存数据")
    recordApiCall(true) // 记录缓存查询（不计入限额）
    return {
      searchIntent: "精确查询",
      originalQuery: userInput,
      resultCount: 1,
      searchTime: "< 0.1秒",
      results: [cached],
      relatedTools: []
    }
  }

  // 2. 缓存未命中，检查速率限制
  const rateLimit = checkRateLimit(false)
  if (!rateLimit.isAllowed) {
    console.log("⚠️ 速率限制:", rateLimit.reason)
    throw new RateLimitError(
      rateLimit.reason!,
      rateLimit.remainingCalls,
      rateLimit.cooldownRemaining
    )
  }

  console.log(`📊 今日剩余API调用次数: ${rateLimit.remainingCalls}`)

  // 3. 调用API
  try {
    const response = await axios.post(`${API_BASE_URL}/search`, {
      query: userInput
    }, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 30000
    })

    console.log("✅ API调用成功")

    // 4. 记录API调用
    recordApiCall(false)

    // 5. 保存到缓存
    if (response.data?.results?.[0]) {
      saveToCache(userInput, response.data.results[0])
    }

    // 6. 记录搜索历史
    recordSearch(userInput)

    return response.data

  } catch (err: any) {
    // 如果是速率限制错误，直接抛出
    if (err instanceof RateLimitError) {
      throw err
    }

    console.log("❌ 搜索API调用失败:", err.message)
    if (err.response) {
      console.log("   状态码:", err.response.status)
      console.log("   错误:", JSON.stringify(err.response.data))
    }
    return null
  }
}

/**
 * 调用LLM推荐API
 */
export const callRecommendLLM = async () => {
  console.log("🎯 获取首页推荐...")

  try {
    const response = await axios.get(`${API_BASE_URL}/search?type=recommend`, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 30000
    })

    console.log("✅ 推荐成功")
    return response.data

  } catch (err: any) {
    console.log("❌ 推荐API调用失败:", err.message)
    if (err.response) {
      console.log("   状态码:", err.response.status)
      console.log("   错误:", JSON.stringify(err.response.data))
    }
    return null
  }
}
