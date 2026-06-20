'use client';

import { useState, useEffect } from 'react';
import { playSound } from '@/lib/sound';
import type { ChartType } from '@/types/portfolio';
import ChartSnapshotEditor, { type EditablePrice } from '@/components/portfolio/chart/ChartSnapshotEditor';

interface ChartMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshotDate: string;
  chartType: ChartType;
  symbol?: string;
  existingContent: string;
  dataValues?: { label: string; value: string; color?: string }[];
  onSave: (content: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  /** 個別株価チャート（stocks）かつ昨日以前のとき、株価修正UIを表示 */
  editablePrice?: EditablePrice;
  onSavePrice?: (currentPrice: number) => Promise<boolean>;
}

const CHART_TYPE_LABELS: Record<ChartType, { label: string; icon: string }> = {
  value: { label: '評価額', icon: '💰' },
  netAssets: { label: '純資産', icon: '🏦' },
  profitLoss: { label: '損益', icon: '📈' },
  stocks: { label: '個別株価', icon: '📊' },
};

const MAX_LENGTH = 50;

function formatDisplayDate(dateStr: string): string {
  if (typeof dateStr !== 'string') return String(dateStr ?? '');
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

export default function ChartMemoModal({
  isOpen,
  onClose,
  snapshotDate,
  chartType,
  symbol,
  existingContent,
  dataValues,
  onSave,
  onDelete,
  editablePrice,
  onSavePrice,
}: ChartMemoModalProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(existingContent);
      setError('');
      setConfirmDelete(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, existingContent]);

  const canSubmit = content.trim().length > 0 && content.length <= MAX_LENGTH && content.trim() !== existingContent.trim();
  const isExisting = existingContent.trim().length > 0;

  const handleClose = () => {
    if (isSaving || isDeleting) return;
    onClose();
  };

  const handleSave = async () => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    setError('');
    try {
      const success = await onSave(content.trim());
      if (success) {
        playSound('noteSave');
        onClose();
      } else {
        setError('保存に失敗しました');
      }
    } catch {
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError('');
    try {
      const success = await onDelete();
      if (success) {
        playSound('buttonDelete');
        onClose();
      } else {
        setError('削除に失敗しました');
      }
    } catch {
      setError('削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const typeInfo = CHART_TYPE_LABELS[chartType] ?? { label: 'チャート', icon: '📊' };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {typeInfo.icon} チャートメモ
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">
                  {formatDisplayDate(snapshotDate)}
                </span>
                <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                  {typeInfo.label}
                </span>
                {symbol && (
                  <span className="px-2 py-0.5 bg-blue-900 bg-opacity-50 rounded text-xs text-blue-300">
                    {symbol}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving || isDeleting}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* データ値表示 */}
          {dataValues && dataValues.length > 0 && (
            <div className="mb-4 bg-gray-900 rounded-lg p-3 space-y-1">
              {dataValues.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={`font-medium ${item.color || 'text-white'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* 株価修正（個別株価チャート・昨日以前のみ） */}
          {editablePrice && onSavePrice && (
            <ChartSnapshotEditor
              editablePrice={editablePrice}
              onSavePrice={onSavePrice}
              disabled={isSaving || isDeleting}
            />
          )}

          {/* テキストエリア */}
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="この日のメモを入力..."
              disabled={isSaving || isDeleting}
              rows={3}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none"
              autoFocus
            />
            <div className={`text-xs text-right mt-1 ${
              content.length > MAX_LENGTH ? 'text-red-400' : 'text-gray-500'
            }`}>
              {content.length} / {MAX_LENGTH}
            </div>
          </div>

          {/* エラー */}
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-600 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* 削除確認 */}
          {confirmDelete && (
            <div className="mb-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-3">
              <p className="text-red-300 text-sm mb-2">このメモを削除しますか？</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="cursor-pointer px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="cursor-pointer px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-3">
            {isExisting && !confirmDelete && (
              <button
                onClick={handleDeleteClick}
                disabled={isSaving || isDeleting}
                className="cursor-pointer px-4 py-2 bg-red-900 bg-opacity-50 hover:bg-red-800 text-red-300 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                削除
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleClose}
              disabled={isSaving || isDeleting}
              className="cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!canSubmit || isSaving || isDeleting}
              className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
