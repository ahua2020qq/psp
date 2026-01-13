// 用户偏好类型定义
export interface UserPreferences {
  techStack?: string[];      // 技术栈：Java, Python, Go, 前端, 运维等
  usageScenarios?: string[]; // 使用场景：项目构建, 数据分析, 系统监控等
  environment?: string[];    // 环境偏好：Windows, Linux, macOS, 离线使用, 龙芯架构等
  toolPreferences?: string[]; // 工具偏好：开源免费, 轻量型, 企业级, 高兼容性等
}