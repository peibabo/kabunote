'use client';

import { useState, useEffect } from 'react';
import { TagColor, TAG_COLORS } from '@/types/tags';

interface TagEntry {
  label: string;
  color: string;
  count: number;
}

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TagManager({ isOpen, onClose }: TagManagerProps) {
  const [tags, setTags] = useState<TagEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<TagColor>('blue');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchTags();
  }, [isOpen]);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tags');
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setIsLoggedIn(true);
      setTags(data.data ?? []);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (tag: TagEntry) => {
    setEditingLabel(tag.label);
    setEditName(tag.label);
    setEditColor(tag.color as TagColor);
    setDeleteConfirm(null);
  };

  const handleSaveEdit = async () => {
    if (!editingLabel || !editName.trim()) return;

    const res = await fetch('/api/tags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldLabel: editingLabel, newLabel: editName.trim(), newColor: editColor }),
    });

    if (res.ok) {
      setTags(prev =>
        prev.map(t =>
          t.label === editingLabel
            ? { ...t, label: editName.trim(), color: editColor }
            : t
        )
      );
      setEditingLabel(null);
    }
  };

  const handleDelete = async (label: string) => {
    const res = await fetch('/api/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });

    if (res.ok) {
      setTags(prev => prev.filter(t => t.label !== label));
      setDeleteConfirm(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">🏷️ タグ管理</h3>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-white">✕</button>
        </div>

        {!isLoggedIn ? (
          <p className="text-gray-400 text-sm">ログインするとタグを管理できます</p>
        ) : isLoading ? (
          <p className="text-gray-400 text-sm">読み込み中...</p>
        ) : tags.length === 0 ? (
          <p className="text-gray-400 text-sm">タグはまだありません</p>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div key={tag.label} className="bg-gray-700 rounded-lg p-3">
                {editingLabel === tag.label ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        maxLength={20}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(TAG_COLORS) as TagColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={`cursor-pointer w-6 h-6 rounded-full ${TAG_COLORS[color].bg} ${
                            editColor === color ? 'ring-2 ring-white' : ''
                          }`}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="cursor-pointer px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingLabel(null)}
                        className="cursor-pointer px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : deleteConfirm === tag.label ? (
                  <div className="space-y-2">
                    <p className="text-yellow-300 text-sm">
                      {tag.count}銘柄から削除されます。よろしいですか？
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(tag.label)}
                        className="cursor-pointer px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        削除する
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="cursor-pointer px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${TAG_COLORS[tag.color as TagColor]?.bg ?? 'bg-gray-600'} ${TAG_COLORS[tag.color as TagColor]?.text ?? 'text-white'}`}>
                        {tag.label}
                      </span>
                      <span className="text-gray-400 text-xs">{tag.count}銘柄</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(tag)}
                        className="cursor-pointer text-blue-400 hover:text-blue-300 text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => { setDeleteConfirm(tag.label); setEditingLabel(null); }}
                        className="cursor-pointer text-red-400 hover:text-red-300 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
