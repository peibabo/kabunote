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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { playSound } from '@/lib/sound';
import {
  DEFAULT_STOCK_LINK_SETTINGS,
  getStockLinkDef,
  type StockLinkSetting,
} from '@/lib/stockExternalLinks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: StockLinkSetting[];
  onSave: (settings: StockLinkSetting[]) => Promise<void>;
}

function SortableStockLinkItem({
  setting,
  onToggle,
}: {
  setting: StockLinkSetting;
  onToggle: (key: string) => void;
}) {
  const def = getStockLinkDef(setting.key);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setting.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!def) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-gray-700 rounded-lg p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-200 touch-none"
        title="ドラッグして並べ替え"
      >
        ⠿
      </button>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: setting.visible ? def.bgColor : '#4B5563' }}
      >
        {def.icon}
      </div>
      <span className={`flex-1 text-sm ${setting.visible ? 'text-white' : 'text-gray-500'}`}>
        {def.name}
      </span>
      <button
        onClick={() => onToggle(setting.key)}
        className={`cursor-pointer relative w-10 h-5 rounded-full transition-colors ${
          setting.visible ? 'bg-blue-600' : 'bg-gray-600'
        }`}
        title={setting.visible ? '非表示にする' : '表示する'}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            setting.visible ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function StockLinkSettingsModal({ isOpen, onClose, settings, onSave }: Props) {
  const [editingSettings, setEditingSettings] = useState<StockLinkSetting[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // モーダルを開いたときに設定をコピー
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen && !wasOpen) {
    const sorted = [...settings].sort((a, b) => a.order - b.order);
    setEditingSettings(sorted);
    setError('');
  }
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
  }

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEditingSettings(prev => {
      const oldIndex = prev.findIndex(s => s.key === active.id);
      const newIndex = prev.findIndex(s => s.key === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      playSound('select');
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const handleToggle = useCallback((key: string) => {
    setEditingSettings(prev =>
      prev.map(s => s.key === key ? { ...s, visible: !s.visible } : s)
    );
    playSound('select');
  }, []);

  const handleReset = () => {
    setEditingSettings([...DEFAULT_STOCK_LINK_SETTINGS]);
    playSound('select');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const settingsToSave = editingSettings.map((s, i) => ({
        key: s.key,
        visible: s.visible,
        order: i,
      }));
      await onSave(settingsToSave);
      playSound('buttonAction');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 pointer-events-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">外部リンク設定</h2>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-4">
            表示するリンクと順番をカスタマイズできます
          </p>

          {/* リンク一覧 */}
          <div className="space-y-2 mb-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={editingSettings.map(s => s.key)}
                strategy={verticalListSortingStrategy}
              >
                {editingSettings.map(setting => (
                  <SortableStockLinkItem
                    key={setting.key}
                    setting={setting}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* リセットボタン */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleReset}
              className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              初期状態に戻す
            </button>
          </div>

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
              disabled={isSaving}
              className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
