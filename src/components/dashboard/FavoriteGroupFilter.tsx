'use client';

import { FavoriteGroup, GROUP_COLORS } from '@/types/favorites';
import { playSound } from '@/lib/sound';

interface FavoriteGroupFilterProps {
  favoriteGroups: FavoriteGroup[];
  selectedGroupFilter: string | null;
  stockSymbolsCount: number;
  maxStocks: number;
  onGroupFilterChange: (groupId: string | null) => void;
  onGroupManagerOpen: () => void;
}

export default function FavoriteGroupFilter({
  favoriteGroups,
  selectedGroupFilter,
  stockSymbolsCount,
  maxStocks,
  onGroupFilterChange,
  onGroupManagerOpen,
}: FavoriteGroupFilterProps) {
  if (stockSymbolsCount === 0) return null;

  if (favoriteGroups.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
        <p className="text-gray-400 text-sm mb-3">お気に入りグループを作成して銘柄を整理しましょう</p>
        <button
          onClick={onGroupManagerOpen}
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          グループを作成
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">⭐ お気に入りグループ</h3>
        <button
          onClick={onGroupManagerOpen}
          className="cursor-pointer text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
        >
          グループ管理
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
        <button
          onClick={() => { playSound('toggle'); onGroupFilterChange(null); }}
          className={`cursor-pointer text-sm px-3 py-2 rounded-full transition-colors whitespace-nowrap shrink-0 md:shrink ${
            selectedGroupFilter === null
              ? 'bg-white text-gray-900'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          すべて ({stockSymbolsCount}/{maxStocks})
        </button>
        {favoriteGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => { playSound('toggle'); onGroupFilterChange(group.id); }}
            className={`cursor-pointer text-sm px-3 py-2 rounded-full transition-colors whitespace-nowrap shrink-0 md:shrink ${
              selectedGroupFilter === group.id
                ? `${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text}`
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            ★ {group.name} ({group.stocks.length})
          </button>
        ))}
      </div>
    </div>
  );
}
