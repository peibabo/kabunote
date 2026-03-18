'use client';

import { useState, useEffect } from 'react';
import SoundSettings from '../settings/SoundSettings';
import TitleCollection from '../settings/TitleCollection';
import { useGamification } from '@/hooks/auth/useGamification';
import { useTitles } from '@/hooks/auth/useTitles';
import { LEVEL_NAMES, xpForLevel } from '@/lib/gamification';
import type { XpActivityLogEntry } from '@/types/gamification';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  alertCounts: { total: number; urgent: number };
  onMenuItemClick: (action: string) => void;
}

export default function SlideOutMenu({ isOpen, onClose, alertCounts, onMenuItemClick }: SlideOutMenuProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['analysis']));
  const { gamification } = useGamification();
  const { titles } = useTitles();
  const [activityLogs, setActivityLogs] = useState<XpActivityLogEntry[]>([]);

  // レベル詳細セクション展開時にアクティビティログを取得
  useEffect(() => {
    if (expandedSections.has('level') && isOpen) {
      fetch('/api/gamification/activity')
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.data) setActivityLogs(data.data) })
        .catch(() => {})
    }
  }, [expandedSections, isOpen]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleMenuClick = (action: string) => {
    onMenuItemClick(action);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* バックドロップ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* メニュー本体 */}
      <div className="fixed top-0 right-0 h-full w-[85vw] max-w-80 bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">メニュー</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* メニュー項目 */}
        <nav className="p-4 space-y-2">
          {/* 開発者にフィードバックを送る */}
          <button
            onClick={() => handleMenuClick('feedback')}
            className="w-full flex items-center space-x-3 p-3 text-left bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg transition-all cursor-pointer shadow-lg"
          >
            <span className="text-xl">📮</span>
            <span className="text-white font-medium">開発者にフィードバックを送る</span>
          </button>

          {/* 投資家レベル */}
          {gamification && (
            <div>
              <button
                onClick={() => toggleSection('level')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">&#x2B50;</span>
                  <span className="text-white">
                    Lv.{gamification.level} {gamification.levelName}
                  </span>
                </div>
                <span className={`text-gray-400 transition-transform ${
                  expandedSections.has('level') ? 'rotate-90' : ''
                }`}>
                  &#x25B6;
                </span>
              </button>

              {expandedSections.has('level') && (
                <div className="ml-4 mr-2 mt-2 space-y-3">
                  {/* XPプログレス */}
                  <div className="px-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Lv.{gamification.level}</span>
                      <span>{gamification.level < 20 ? `Lv.${gamification.level + 1}` : 'MAX'}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${gamification.level >= 20 ? 100 : Math.min(100, ((gamification.totalXp - gamification.xpForCurrentLevel) / (gamification.xpForNextLevel - gamification.xpForCurrentLevel)) * 100)}%`,
                          background: 'linear-gradient(90deg, rgb(59, 130, 246), rgb(168, 85, 247))',
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {gamification.totalXp - gamification.xpForCurrentLevel} / {gamification.xpForNextLevel - gamification.xpForCurrentLevel} XP
                      {gamification.nextLevelName && (
                        <span className="ml-2 text-gray-600">
                          次: {gamification.nextLevelName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ステータス */}
                  <div className="flex gap-3 px-3 text-xs">
                    <div className="bg-gray-700/50 rounded-lg px-3 py-2 flex-1 text-center">
                      <div className="text-gray-400">累計XP</div>
                      <div className="text-white font-medium">{gamification.totalXp.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg px-3 py-2 flex-1 text-center">
                      <div className="text-gray-400">連続日数</div>
                      <div className="text-orange-400 font-medium">{gamification.currentStreak}日</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg px-3 py-2 flex-1 text-center">
                      <div className="text-gray-400">最長記録</div>
                      <div className="text-purple-400 font-medium">{gamification.longestStreak}日</div>
                    </div>
                  </div>

                  {/* 今日のXP */}
                  <div className="px-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">今日のXP</span>
                      <span className="text-gray-500">{gamification.dailyXp}/100</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, gamification.dailyXp)}%`,
                          background: gamification.dailyXp >= 100 ? 'rgb(34, 197, 94)' : 'rgb(59, 130, 246)',
                        }}
                      />
                    </div>
                  </div>

                  {/* レベル一覧 */}
                  <div className="px-3">
                    <div className="text-xs text-gray-500 mb-2">投資家ランク</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(lv => (
                        <div
                          key={lv}
                          className={`flex items-center gap-2 text-xs px-2 py-0.5 rounded ${
                            lv === gamification.level
                              ? 'bg-purple-900/40 text-purple-300'
                              : lv < gamification.level
                                ? 'text-gray-500'
                                : 'text-gray-600'
                          }`}
                        >
                          <span className="w-8">Lv.{lv}</span>
                          <span className="flex-1">{LEVEL_NAMES[lv]}</span>
                          <span className="text-gray-600">{xpForLevel(lv).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 最近のアクティビティ */}
                  {activityLogs.length > 0 && (
                    <div className="px-3 pb-2">
                      <div className="text-xs text-gray-500 mb-2">最近のXP獲得</div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {activityLogs.slice(0, 10).map(log => (
                          <div key={log.id} className="flex justify-between text-xs">
                            <span className="text-gray-400">{log.description}</span>
                            <span className="text-blue-400">+{log.xpEarned} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 称号コレクション */}
          {titles && (
            <div>
              <button
                onClick={() => toggleSection('titles')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">&#x1F3C6;</span>
                  <span className="text-white">
                    称号コレクション
                  </span>
                  <span className="text-xs text-purple-400/70">
                    {titles.unlockedCount}/{titles.totalCount}
                  </span>
                </div>
                <span className={`text-gray-400 transition-transform ${
                  expandedSections.has('titles') ? 'rotate-90' : ''
                }`}>
                  &#x25B6;
                </span>
              </button>

              {expandedSections.has('titles') && (
                <div className="ml-2 mr-2 mt-2">
                  <TitleCollection
                    titles={titles.titles}
                    unlockedCount={titles.unlockedCount}
                    totalCount={titles.totalCount}
                  />
                </div>
              )}
            </div>
          )}

          {/* アラート一覧 */}
          <button
            onClick={() => handleMenuClick('alerts')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">🚨</span>
              <span className="text-white">アラート一覧</span>
            </div>
            {alertCounts.total > 0 && (
              <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${
                alertCounts.urgent > 0 ? 'bg-red-500' : 'bg-yellow-500'
              }`}>
                {alertCounts.total}
              </span>
            )}
          </button>

          {/* 分析・レポート */}
          <div>
            <button
              onClick={() => toggleSection('analysis')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📊</span>
                <span className="text-white">分析・レポート</span>
              </div>
              <span className={`text-gray-400 transition-transform ${
                expandedSections.has('analysis') ? 'rotate-90' : ''
              }`}>
                ▶
              </span>
            </button>

            {expandedSections.has('analysis') && (
              <div className="ml-8 mt-2 space-y-1">
                <button
                  onClick={() => handleMenuClick('strategy')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">🎯</span>
                  <span className="text-gray-300">戦略一覧</span>
                </button>
                <button
                  onClick={() => handleMenuClick('positions')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">💼</span>
                  <span className="text-gray-300">ポジション一覧</span>
                </button>
                <button
                  onClick={() => handleMenuClick('events')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">📅</span>
                  <span className="text-gray-300">イベント一覧</span>
                </button>
                <button
                  onClick={() => handleMenuClick('dividends')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">💰</span>
                  <span className="text-gray-300">配当・優待一覧</span>
                </button>
              </div>
            )}
          </div>

          {/* 設定・管理 */}
          <div>
            <button
              onClick={() => toggleSection('settings')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">⚙️</span>
                <span className="text-white">設定・管理</span>
              </div>
              <span className={`text-gray-400 transition-transform ${
                expandedSections.has('settings') ? 'rotate-90' : ''
              }`}>
                ▶
              </span>
            </button>

            {expandedSections.has('settings') && (
              <div className="ml-8 mt-2 space-y-1">
                <button
                  onClick={() => handleMenuClick('groups')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">👥</span>
                  <span className="text-gray-300">グループ管理</span>
                </button>
                <button
                  onClick={() => handleMenuClick('tags')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">🏷️</span>
                  <span className="text-gray-300">タグ管理</span>
                </button>
                <button
                  onClick={() => handleMenuClick('deleteAccount')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">🗑️</span>
                  <span className="text-red-400">アカウント削除</span>
                </button>

                {/* サウンド設定 */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <SoundSettings />
                </div>
              </div>
            )}
          </div>

          {/* ヘルプ・About */}
          <a
            href="/help"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-xl">ℹ️</span>
            <span className="text-white">ヘルプ・About</span>
          </a>

          {/* 利用規約 */}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-xl">📄</span>
            <span className="text-white">利用規約</span>
          </a>

          {/* プライバシーポリシー */}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-xl">🔒</span>
            <span className="text-white">プライバシーポリシー</span>
          </a>
        </nav>
      </div>
    </>
  );
}