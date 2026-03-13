'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { playSound } from '@/lib/sound';
import {
  DEFAULT_EXTERNAL_LINKS,
  GRADIENT_PRESETS,
  MAX_EXTERNAL_LINKS,
  MAX_LINK_LABEL_LENGTH,
  MAX_LINK_URL_LENGTH,
  type ExternalLink,
} from '@/lib/defaultExternalLinks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  links: ExternalLink[];
  onSave: (links: ExternalLink[]) => Promise<void>;
}

interface EditingLink {
  url: string;
  label: string;
  icon: string;
  gradient: string;
}

const EMPTY_LINK: EditingLink = {
  url: '',
  label: '',
  icon: '',
  gradient: GRADIENT_PRESETS[0].value,
};

function SortableItem({ link, index, onEdit, onDelete }: {
  link: ExternalLink;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id || `link-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-gray-700 rounded-lg p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-200 touch-none"
        title="ドラッグして並べ替え"
      >
        ⠿
      </button>
      <span className={`w-8 h-8 rounded-full bg-gradient-to-r ${link.gradient} flex items-center justify-center text-base flex-shrink-0`}>
        {link.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{link.label}</div>
        <div className="text-xs text-gray-400 truncate">{link.url}</div>
      </div>
      <button
        onClick={() => onEdit(index)}
        className="cursor-pointer text-gray-400 hover:text-blue-400 transition-colors p-1 text-sm flex-shrink-0"
        title="編集"
      >
        編集
      </button>
      <button
        onClick={() => onDelete(index)}
        className="cursor-pointer text-gray-400 hover:text-red-400 transition-colors p-1 text-sm flex-shrink-0"
        title="削除"
      >
        ✕
      </button>
    </div>
  );
}

export default function ExternalLinksSettingsModal({ isOpen, onClose, links, onSave }: Props) {
  const [editingLinks, setEditingLinks] = useState<ExternalLink[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditingLink>(EMPTY_LINK);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // モーダルを開いたときにリンクをコピー
  const handleOpen = useCallback(() => {
    setEditingLinks(links.map((l, i) => ({ ...l, id: l.id || `temp-${i}` })));
    setEditingIndex(null);
    setIsAdding(false);
    setEditForm(EMPTY_LINK);
    setError('');
  }, [links]);

  // isOpen が変わったとき
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen && !wasOpen) {
    handleOpen();
  }
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
  }

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = editingLinks.findIndex(l => (l.id || `link-${editingLinks.indexOf(l)}`) === active.id);
    const newIndex = editingLinks.findIndex(l => (l.id || `link-${editingLinks.indexOf(l)}`) === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setEditingLinks(arrayMove(editingLinks, oldIndex, newIndex));
      playSound('select');
    }
  };

  const handleStartEdit = (index: number) => {
    const link = editingLinks[index];
    setEditingIndex(index);
    setIsAdding(false);
    setEditForm({ url: link.url, label: link.label, icon: link.icon, gradient: link.gradient });
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setEditForm(EMPTY_LINK);
  };

  const isFormValid = () => {
    try {
      const url = new URL(editForm.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    } catch {
      return false;
    }
    return (
      editForm.url.length <= MAX_LINK_URL_LENGTH &&
      editForm.label.trim().length > 0 &&
      editForm.label.length <= MAX_LINK_LABEL_LENGTH &&
      editForm.icon.trim().length > 0
    );
  };

  const handleSaveEdit = () => {
    if (!isFormValid()) return;

    if (isAdding) {
      setEditingLinks([...editingLinks, {
        url: editForm.url,
        label: editForm.label.trim(),
        icon: editForm.icon.trim(),
        gradient: editForm.gradient,
        order: editingLinks.length,
      }]);
      setIsAdding(false);
    } else if (editingIndex !== null) {
      const updated = [...editingLinks];
      updated[editingIndex] = {
        ...updated[editingIndex],
        url: editForm.url,
        label: editForm.label.trim(),
        icon: editForm.icon.trim(),
        gradient: editForm.gradient,
      };
      setEditingLinks(updated);
      setEditingIndex(null);
    }
    setEditForm(EMPTY_LINK);
    playSound('select');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setIsAdding(false);
    setEditForm(EMPTY_LINK);
  };

  const handleDelete = (index: number) => {
    setEditingLinks(editingLinks.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm(EMPTY_LINK);
    }
    playSound('select');
  };

  const handleReset = () => {
    setEditingLinks(DEFAULT_EXTERNAL_LINKS.map((l, i) => ({ ...l, id: `default-${i}` })));
    setEditingIndex(null);
    setIsAdding(false);
    setEditForm(EMPTY_LINK);
    playSound('select');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const linksToSave = editingLinks.map((l, i) => ({
        url: l.url,
        label: l.label,
        icon: l.icon,
        gradient: l.gradient,
        order: i,
      }));
      await onSave(linksToSave);
      playSound('buttonAction');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isEditMode = editingIndex !== null || isAdding;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 pointer-events-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">外部リンク設定</h2>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-4">
            よく見るサイトへのリンクをカスタマイズできます（最大{MAX_EXTERNAL_LINKS}個）
          </p>

          {/* リンク一覧 */}
          <div className="space-y-2 mb-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={editingLinks.map((l, i) => l.id || `link-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {editingLinks.map((link, index) => (
                  <SortableItem
                    key={link.id || `link-${index}`}
                    link={link}
                    index={index}
                    onEdit={handleStartEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {editingLinks.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">リンクがありません</p>
            )}
          </div>

          {/* 編集フォーム */}
          {isEditMode && (
            <div className="bg-gray-700 rounded-lg p-4 mb-4 space-y-3">
              <div className="text-sm font-medium text-gray-300 mb-2">
                {isAdding ? 'リンクを追加' : 'リンクを編集'}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">ラベル</label>
                <input
                  type="text"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  placeholder="例: Yahoo!ファイナンス"
                  maxLength={MAX_LINK_LABEL_LENGTH}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">URL</label>
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">アイコン（絵文字）</label>
                <input
                  type="text"
                  value={editForm.icon}
                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  placeholder="例: 📊"
                  className="w-20 bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 text-sm text-center focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">カラー</label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setEditForm({ ...editForm, gradient: preset.value })}
                      className={`cursor-pointer w-8 h-8 rounded-full bg-gradient-to-r ${preset.value} transition-all ${
                        editForm.gradient === preset.value ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-700 scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCancelEdit}
                  className="cursor-pointer px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!isFormValid()}
                  className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? '追加' : '更新'}
                </button>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          {!isEditMode && (
            <div className="flex gap-2 mb-4">
              {editingLinks.length < MAX_EXTERNAL_LINKS && (
                <button
                  onClick={handleStartAdd}
                  className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + リンクを追加
                </button>
              )}
              <button
                onClick={handleReset}
                className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors ml-auto"
              >
                初期状態に戻す
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-600 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="cursor-pointer flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isEditMode}
              className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  保存中...
                </>
              ) : (
                '保存する'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
