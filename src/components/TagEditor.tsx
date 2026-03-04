'use client';

import { useState, useEffect } from 'react';
import { CustomTag, TagColor, TAG_COLORS, PRESET_TAGS } from '@/types/tags';

interface UserTag {
  label: string;
  color: TagColor;
  count: number;
}

interface TagEditorProps {
  symbol: string;
  currentTags: CustomTag[];
  onAddTag: (label: string, color: TagColor) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
  onClose: () => void;
}

export default function TagEditor({ symbol: _symbol, currentTags, onAddTag, onRemoveTag, onClose }: TagEditorProps) {
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue');
  const [userTags, setUserTags] = useState<UserTag[]>([]);

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.success) setUserTags(data.data as UserTag[]);
      })
      .catch(() => {});
  }, []);

  const handleAddTag = (label: string, color: TagColor) => {
    onAddTag(label, color);
  };

  const handleRemoveTag = (tagId: string) => {
    onRemoveTag(tagId);
  };

  const handleAddCustomTag = () => {
    if (!newTagLabel.trim()) return;

    // 同じラベルのタグが既に存在するかチェック
    const exists = currentTags.some(tag => tag.label === newTagLabel.trim());
    if (exists) return;

    handleAddTag(newTagLabel.trim(), newTagColor);
    setNewTagLabel('');
    setNewTagColor('blue');
  };

  const availablePresets = PRESET_TAGS.filter(
    preset => !currentTags.some(tag => tag.label === preset.label)
  );

  // 現在のタグ・プリセットタグと重複しないユーザーカスタムタグのみ表示
  const presetLabels = new Set(PRESET_TAGS.map(p => p.label));
  const currentTagLabels = new Set(currentTags.map(t => t.label));
  const availableUserTags = userTags.filter(
    t => !currentTagLabels.has(t.label) && !presetLabels.has(t.label)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">タグを編集</h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 現在のタグ */}
        {currentTags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">現在のタグ</p>
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag) => (
                <div
                  key={tag.id}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${TAG_COLORS[tag.color].bg} ${TAG_COLORS[tag.color].text}`}
                >
                  <span>{tag.label}</span>
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="cursor-pointer hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* プリセットタグ */}
        {availablePresets.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">よく使うタグ</p>
            <div className="grid grid-cols-2 gap-2">
              {availablePresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleAddTag(preset.label, preset.color)}
                  className={`cursor-pointer text-xs px-3 py-2 rounded-full transition-opacity hover:opacity-80 ${TAG_COLORS[preset.color].bg} ${TAG_COLORS[preset.color].text}`}
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 過去に使ったタグ */}
        {availableUserTags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">過去に使ったタグ</p>
            <div className="flex flex-wrap gap-2">
              {availableUserTags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => handleAddTag(tag.label, tag.color)}
                  className={`cursor-pointer text-xs px-3 py-2 rounded-full transition-opacity hover:opacity-80 ${TAG_COLORS[tag.color]?.bg ?? 'bg-gray-600'} ${TAG_COLORS[tag.color]?.text ?? 'text-gray-100'}`}
                >
                  + {tag.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* カスタムタグ作成 */}
        <div className="space-y-3">
          <p className="text-sm text-gray-300">カスタムタグを作成</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTagLabel}
              onChange={(e) => setNewTagLabel(e.target.value)}
              placeholder="タグ名"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
              maxLength={10}
            />

            <select
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value as TagColor)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              {Object.entries(TAG_COLORS).map(([color]) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddCustomTag}
            disabled={!newTagLabel.trim()}
            className="cursor-pointer w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
          >
            タグを追加
          </button>
        </div>
      </div>
    </div>
  );
}
