'use client';

import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { playSound } from '@/lib/sound';
import {
  DEFAULT_EXTERNAL_LINKS,
  GRADIENT_PRESETS,
  ICON_PRESETS,
  MAX_EXTERNAL_LINKS,
  type ExternalLink,
} from '@/lib/defaultExternalLinks';
import LinkList from './external-links/LinkList';
import LinkEditForm, { type EditingLink } from './external-links/LinkEditForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  links: ExternalLink[];
  onSave: (links: ExternalLink[]) => Promise<void>;
}

const EMPTY_LINK: EditingLink = {
  url: '',
  label: '',
  icon: ICON_PRESETS[0],
  gradient: GRADIENT_PRESETS[0].value,
};

export default function ExternalLinksSettingsModal({ isOpen, onClose, links, onSave }: Props) {
  const [editingLinks, setEditingLinks] = useState<ExternalLink[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditingLink>(EMPTY_LINK);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleSaveEdit = () => {
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
          <LinkList
            links={editingLinks}
            onDragEnd={handleDragEnd}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
          />

          {/* 編集フォーム */}
          {isEditMode && (
            <LinkEditForm
              isAdding={isAdding}
              editForm={editForm}
              onEditFormChange={setEditForm}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
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
