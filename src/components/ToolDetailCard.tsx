import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Star,
  Download,
  Terminal,
  AlertTriangle,
  BookOpen,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Share2
} from 'lucide-react';
import { isFavorite, addFavorite, removeFavorite } from '../utils/storage';

interface ToolDetailCardProps {
  tool: any;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ToolDetailCard({ tool, isExpanded, onToggle }: ToolDetailCardProps) {
  const [activeTab, setActiveTab] = useState<'usage' | 'download' | 'install' | 'issues' | 'commands'>('usage');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(isFavorite(tool.name));

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleFavoriteToggle = () => {
    if (isFav) {
      removeFavorite(tool.name);
    } else {
      addFavorite(tool.name);
    }
    setIsFav(!isFav);
  };

  return (
    <div className="bg-white dark:bg-[#2D2D3F] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* 卡片头部 */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                {tool.name}
              </h2>
              {tool.officialAlias && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({tool.officialAlias})
                </span>
              )}
              {tool.rating === 5 && (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#00B42A] text-[#00B42A]" />
                  ))}
                </div>
              )}
            </div>
            {tool.corePositioning && (
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {tool.corePositioning}
              </p>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-[#165DFF] rounded">
                {tool.category}
              </span>
              {tool.updateInfo && (
                <>
                  <span>更新：{tool.updateInfo.updateDate}</span>
                  <span>{tool.updateInfo.latestVersion}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFavoriteToggle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isFav ? '取消收藏' : '收藏'}
            >
              {isFav ? (
                <BookmarkCheck className="w-5 h-5 text-[#165DFF]" />
              ) : (
                <Bookmark className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="分享"
            >
              <Share2 className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isExpanded ? '收起' : '展开'}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      {isExpanded && (
        <>
          <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            {[
              { key: 'usage', label: '用途', icon: BookOpen },
              { key: 'download', label: '下载', icon: Download },
              { key: 'install', label: '安装', icon: Terminal },
              { key: 'issues', label: '避坑', icon: AlertTriangle },
              { key: 'commands', label: '常用命令', icon: Terminal }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`
                  flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    activeTab === key
                      ? 'text-[#165DFF] border-b-2 border-[#165DFF] bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* 标签页内容 */}
          <div className="p-6">
            {/* 用途 */}
            {activeTab === 'usage' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    核心用途
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {tool.coreUsage}
                  </p>
                </div>
                {tool.applicableScenarios && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      适用场景
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {tool.applicableScenarios}
                    </p>
                  </div>
                )}
                {tool.targetUsers && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      目标用户
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {tool.targetUsers}
                    </p>
                  </div>
                )}
                {tool.coreAdvantages && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      核心优势
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                      {tool.coreAdvantages.map((adv: string, i: number) => (
                        <li key={i}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {tool.alternatives && tool.alternatives.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      替代工具
                    </h4>
                    <div className="flex gap-2">
                      {tool.alternatives.map((alt: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                        >
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 下载 */}
            {activeTab === 'download' && tool.downloadUrl && (
              <div className="space-y-4">
                {tool.downloadUrl.mirror && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                        国内镜像 (推荐)
                      </h4>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        高速下载
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                        {tool.downloadUrl.mirror}
                      </code>
                      <button
                        onClick={() => handleCopy(tool.downloadUrl.mirror, 'mirror')}
                        className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                        title="复制"
                      >
                        {copiedText === 'mirror' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {tool.downloadUrl.official && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      官方下载
                    </h4>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 rounded text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                        {tool.downloadUrl.official}
                      </code>
                      <button
                        onClick={() => handleCopy(tool.downloadUrl.official, 'official')}
                        className="p-2 hover:bg-white dark:hover:bg-gray-900 rounded transition-colors"
                        title="复制"
                      >
                        {copiedText === 'official' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 安装 */}
            {activeTab === 'install' && tool.installation && (
              <div className="space-y-4">
                {Object.entries(tool.installation).map(([os, steps]: [string, any]) => {
                  if (typeof steps === 'string') {
                    return (
                      <div key={os} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 capitalize">
                          {os === 'ubuntu' ? 'Ubuntu' : os === 'centos' ? 'CentOS' : os === 'docker' ? 'Docker' : os}
                        </h4>
                        <div className="flex items-start gap-2">
                          <code className="flex-1 px-3 py-2 bg-gray-900 dark:bg-black rounded text-sm text-green-400 font-mono overflow-x-auto">
                            {steps}
                          </code>
                          <button
                            onClick={() => handleCopy(steps, `install-${os}`)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="复制"
                          >
                            {copiedText === `install-${os}` ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  if (Array.isArray(steps) && steps.length > 0) {
                    return (
                      <div key={os} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 capitalize">
                          {os === 'ubuntu' ? 'Ubuntu' : os === 'centos' ? 'CentOS' : os === 'macos' ? 'macOS' : os}
                        </h4>
                        <div className="space-y-2">
                          {steps.map((step: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {i + 1}.
                              </span>
                              <code className="flex-1 px-3 py-2 bg-gray-900 dark:bg-black rounded text-sm text-green-400 font-mono overflow-x-auto">
                                {step}
                              </code>
                              <button
                                onClick={() => handleCopy(step, `${os}-${i}`)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                title="复制"
                              >
                                {copiedText === `${os}-${i}` ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* 避坑指南 */}
            {activeTab === 'issues' && tool.commonIssues && (
              <div className="space-y-4">
                {tool.commonIssues.map((issue: any, i: number) => (
                  <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                            Top {issue.rank || i + 1}: {issue.problem}
                          </h4>
                          {issue.affectedRate && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {issue.affectedRate}
                            </span>
                          )}
                        </div>
                        {issue.symptoms && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span className="font-medium">问题现象：</span>{issue.symptoms}
                          </p>
                        )}
                        <div className="bg-white dark:bg-gray-800 rounded p-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium text-green-600 dark:text-green-400">
                              解决方案：
                            </span>
                            {issue.solution}
                          </p>
                        </div>
                        {issue.preventionTips && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            💡 预防建议：{issue.preventionTips}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 常用命令 */}
            {activeTab === 'commands' && tool.commonCommands && (
              <div className="space-y-3">
                {tool.commonCommands.map((cmd: any, i: number) => {
                  const command = typeof cmd === 'string' ? cmd : cmd.command;
                  const description = typeof cmd === 'object' ? cmd.description : '';
                  
                  return (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <code className="flex-1 px-3 py-2 bg-gray-900 dark:bg-black rounded text-sm text-green-400 font-mono overflow-x-auto">
                          {command}
                        </code>
                        <button
                          onClick={() => handleCopy(command, `cmd-${i}`)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="复制"
                        >
                          {copiedText === `cmd-${i}` ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      {description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 pl-3">
                          {description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
