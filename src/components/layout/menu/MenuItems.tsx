'use client';

import LevelDetailSection from './LevelDetailSection';
import AnalysisSection from './AnalysisSection';
import SettingsSection from './SettingsSection';
import PreferencesSection from './PreferencesSection';
import type { XpActivityLogEntry } from '@/types/gamification';
import type { TitlesResponse } from '@/types/titles';

interface GamificationData {
  level: number;
  levelName: string;
  totalXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  nextLevelName: string | null;
  dailyXp: number;
  currentStreak: number;
  longestStreak: number;
}

interface MenuItemsProps {
  gamification: GamificationData | null;
  titles: TitlesResponse | null;
  activityLogs: XpActivityLogEntry[];
  alertCounts: { total: number; urgent: number };
  expandedSections: Set<string>;
  onToggleSection: (section: string) => void;
  onMenuClick: (action: string) => void;
}

export default function MenuItems({
  gamification,
  titles,
  activityLogs,
  alertCounts,
  expandedSections,
  onToggleSection,
  onMenuClick,
}: MenuItemsProps) {
  return (
    <>
      {/* 開発者にフィードバックを送る */}
      <button
        onClick={() => onMenuClick('feedback')}
        className="w-full flex items-center space-x-3 p-3 text-left bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg transition-all cursor-pointer shadow-lg"
      >
        <span className="text-xl">&#x1F4EE;</span>
        <span className="text-white font-medium">開発者にフィードバックを送る</span>
      </button>

      {/* 投資家レベル */}
      {gamification && (
        <div>
          <button
            onClick={() => onToggleSection('level')}
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
            <LevelDetailSection
              gamification={gamification}
              activityLogs={activityLogs}
            />
          )}
        </div>
      )}

      {/* 称号コレクション */}
      {titles && (
        <button
          onClick={() => onMenuClick('titles')}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">&#x1F3C6;</span>
            <span className="text-white">称号コレクション</span>
          </div>
          <span className="px-2 py-0.5 text-xs font-medium text-purple-400 bg-purple-400/10 rounded-full">
            {titles.unlockedCount}/{titles.totalCount}
          </span>
        </button>
      )}

      {/* アラート一覧 */}
      <button
        onClick={() => onMenuClick('alerts')}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">&#x1F6A8;</span>
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
      <AnalysisSection
        isExpanded={expandedSections.has('analysis')}
        onToggle={() => onToggleSection('analysis')}
        onMenuClick={onMenuClick}
      />

      {/* 管理 */}
      <SettingsSection
        isExpanded={expandedSections.has('settings')}
        onToggle={() => onToggleSection('settings')}
        onMenuClick={onMenuClick}
      />

      {/* 設定 */}
      <PreferencesSection
        isExpanded={expandedSections.has('preferences')}
        onToggle={() => onToggleSection('preferences')}
      />

      {/* セパレーター */}
      <div className="border-t border-gray-700 my-2" />

      {/* ヘルプ・About */}
      <a
        href="/help"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <span className="text-xl">&#x2139;&#xFE0F;</span>
        <span className="text-white">ヘルプ・About</span>
      </a>

      {/* 利用規約 */}
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <span className="text-xl">&#x1F4C4;</span>
        <span className="text-white">利用規約</span>
      </a>

      {/* プライバシーポリシー */}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <span className="text-xl">&#x1F512;</span>
        <span className="text-white">プライバシーポリシー</span>
      </a>

      {/* セパレーター */}
      <div className="border-t border-gray-700 my-2" />

      {/* アカウント削除 */}
      <button
        onClick={() => onMenuClick('deleteAccount')}
        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <span className="text-xl">&#x1F5D1;&#xFE0F;</span>
        <span className="text-red-400">アカウント削除</span>
      </button>

      {/* ログアウト */}
      <button
        onClick={() => onMenuClick('logout')}
        className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <span className="text-xl">&#x1F6AA;</span>
        <span className="text-red-400">ログアウト</span>
      </button>
    </>
  );
}
