'use client';

import { useState } from 'react';
import { FavoriteGroup, GroupColor, GROUP_COLORS, DEFAULT_GROUPS, MAX_GROUPS, MAX_GROUP_NAME_LENGTH } from '@/types/favorites';

interface FavoriteGroupManagerProps {
  groups: FavoriteGroup[];
  onGroupsChange: (groups: FavoriteGroup[]) => void;
  onClose: () => void;
}

export default function FavoriteGroupManager({ groups, onGroupsChange, onClose }: FavoriteGroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState<GroupColor>('blue');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<GroupColor>('blue');

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || groups.length >= MAX_GROUPS) return;

    // 同じ名前のグループが既に存在するかチェック
    const exists = groups.some(group => group.name === newGroupName.trim());
    if (exists) return;

    const newGroup: FavoriteGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      color: newGroupColor,
      createdAt: new Date().toISOString(),
      stocks: []
    };

    onGroupsChange([...groups, newGroup]);
    setNewGroupName('');
    setNewGroupColor('blue');
  };

  const handleCreateFromPreset = (preset: typeof DEFAULT_GROUPS[0]) => {
    if (groups.length >= MAX_GROUPS) return;

    // 同じ名前のグループが既に存在するかチェック
    const exists = groups.some(group => group.name === preset.name);
    if (exists) return;

    const newGroup: FavoriteGroup = {
      id: `group-${Date.now()}`,
      name: preset.name,
      color: preset.color,
      createdAt: new Date().toISOString(),
      stocks: []
    };

    onGroupsChange([...groups, newGroup]);
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setEditingGroup(groupId);
    setEditName(group.name);
    setEditColor(group.color);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingGroup) return;

    // 他のグループと同じ名前でないかチェック
    const exists = groups.some(group => group.id !== editingGroup && group.name === editName.trim());
    if (exists) return;

    const updatedGroups = groups.map(group =>
      group.id === editingGroup
        ? { ...group, name: editName.trim(), color: editColor }
        : group
    );

    onGroupsChange(updatedGroups);
    setEditingGroup(null);
    setEditName('');
    setEditColor('blue');
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm('このグループを削除しますか？グループ内の銘柄情報も失われます。')) {
      return;
    }

    const updatedGroups = groups.filter(group => group.id !== groupId);
    onGroupsChange(updatedGroups);
  };

  const availablePresets = DEFAULT_GROUPS.filter(
    preset => !groups.some(group => group.name === preset.name)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">お気に入りグループ管理</h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 現在のグループ一覧 */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-white mb-3">作成済みグループ ({groups.length}/{MAX_GROUPS})</h4>
          {groups.length === 0 ? (
            <p className="text-gray-400 text-sm">まだグループが作成されていません</p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  {editingGroup === group.id ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        maxLength={MAX_GROUP_NAME_LENGTH}
                      />
                      <select
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value as GroupColor)}
                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                      >
                        {Object.keys(GROUP_COLORS).map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveEdit}
                        className="cursor-pointer px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingGroup(null)}
                        className="cursor-pointer px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text}`}>
                          {group.name}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {group.stocks.length}銘柄
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditGroup(group.id)}
                          className="cursor-pointer text-blue-400 hover:text-blue-300 text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="cursor-pointer text-red-400 hover:text-red-300 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* よく使うグループのプリセット */}
        {availablePresets.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-3">よく使うグループを追加</h4>
            <div className="grid grid-cols-2 gap-2">
              {availablePresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleCreateFromPreset(preset)}
                  disabled={groups.length >= MAX_GROUPS}
                  className={`cursor-pointer flex items-center justify-center gap-2 p-3 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${GROUP_COLORS[preset.color].bg} ${GROUP_COLORS[preset.color].text}`}
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* カスタムグループ作成 */}
        {groups.length < MAX_GROUPS && (
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-white">カスタムグループを作成</h4>

            <div className="flex gap-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="グループ名"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                maxLength={MAX_GROUP_NAME_LENGTH}
              />

              <select
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value as GroupColor)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(GROUP_COLORS).map(([color, styles]) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || groups.length >= MAX_GROUPS}
              className="cursor-pointer w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            >
              グループを作成
            </button>
          </div>
        )}

        {groups.length >= MAX_GROUPS && (
          <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
            <p className="text-yellow-400 text-sm">
              最大{MAX_GROUPS}個までグループを作成できます。新しいグループを作成するには、既存のグループを削除してください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}