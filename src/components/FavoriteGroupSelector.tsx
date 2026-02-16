'use client';

import { useState } from 'react';
import { FavoriteGroup, GROUP_COLORS } from '@/types/favorites';

interface FavoriteGroupSelectorProps {
  symbol: string;
  groups: FavoriteGroup[];
  selectedGroupIds: string[];
  onGroupsChange: (groupIds: string[]) => void;
  onClose: () => void;
}

export default function FavoriteGroupSelector({
  symbol,
  groups,
  selectedGroupIds,
  onGroupsChange,
  onClose
}: FavoriteGroupSelectorProps) {
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedGroupIds);

  const handleToggleGroup = (groupId: string) => {
    setTempSelectedIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSave = () => {
    onGroupsChange(tempSelectedIds);
    onClose();
  };

  const handleSelectAll = () => {
    setTempSelectedIds(groups.map(g => g.id));
  };

  const handleDeselectAll = () => {
    setTempSelectedIds([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            お気に入りグループに追加
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 text-sm mb-2">
            {symbol} を追加するグループを選択してください
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">
              まだグループが作成されていません
            </p>
            <p className="text-gray-400 text-xs">
              先にグループを作成してください
            </p>
          </div>
        ) : (
          <>
            {/* 全選択・全解除ボタン */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                全選択
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                全解除
              </button>
            </div>

            {/* グループ選択リスト */}
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {groups.map((group) => {
                const isSelected = tempSelectedIds.includes(group.id);
                return (
                  <div
                    key={group.id}
                    onClick={() => handleToggleGroup(group.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-650'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleGroup(group.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className={`px-3 py-1 rounded-full text-sm ${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text}`}>
                        {group.name}
                      </span>
                      <span className="text-gray-400 text-sm">
                        ({group.stocks.length}銘柄)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* アクションボタン */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                保存
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                キャンセル
              </button>
            </div>

            {/* 選択状況表示 */}
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                {tempSelectedIds.length}個のグループに追加予定
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}