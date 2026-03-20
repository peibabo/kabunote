'use client';

import TitleCollection from '../../settings/TitleCollection';
import LevelDetailSection from './LevelDetailSection';
import AnalysisSection from './AnalysisSection';
import SettingsSection from './SettingsSection';
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
        <div>
          <button
            onClick={() => onToggleSection('titles')}
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

      {/* 設定・管理 */}
      <SettingsSection
        isExpanded={expandedSections.has('settings')}
        onToggle={() => onToggleSection('settings')}
        onMenuClick={onMenuClick}
      />

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
    </>
  );
}
