'use client';

import { LEVEL_NAMES, xpForLevel } from '@/lib/gamification';
import type { XpActivityLogEntry } from '@/types/gamification';

interface GamificationData {
  level: number;
  totalXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  nextLevelName: string | null;
  dailyXp: number;
  currentStreak: number;
  longestStreak: number;
}

interface LevelDetailSectionProps {
  gamification: GamificationData;
  activityLogs: XpActivityLogEntry[];
}

export default function LevelDetailSection({ gamification, activityLogs }: LevelDetailSectionProps) {
  return (
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
        <div className="space-y-1 max-h-48 md:max-h-32 overflow-y-auto">
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
  );
}
