'use client';

import { useState } from 'react';
import { playSound } from '@/lib/sound';

export interface EditablePrice {
  snapshotId: string;
  stockId: string;
  symbol: string;
  currentPrice: number | null;
}

interface ChartSnapshotEditorProps {
  editablePrice: EditablePrice;
  onSavePrice: (currentPrice: number) => Promise<boolean>;
  disabled?: boolean;
}

const MAX_PRICE = 99_999_999;

/**
 * 過去スナップショットの個別株価をインライン修正するUI。
 * 個別株価チャート（stocks）かつ昨日以前のポイントでのみ表示される。
 */
export default function ChartSnapshotEditor({ editablePrice, onSavePrice, disabled }: ChartSnapshotEditorProps) {
  const initial = editablePrice.currentPrice != null ? String(editablePrice.currentPrice) : '';
  const [value, setValue] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const parsed = parseFloat(value);
  const isValid = value.trim().length > 0 && !isNaN(parsed) && isFinite(parsed) && parsed > 0 && parsed <= MAX_PRICE;
  const isChanged = isValid && parsed !== editablePrice.currentPrice;
  const canSave = isChanged && !isSaving && !disabled;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError('');
    try {
      const success = await onSavePrice(parsed);
      if (success) {
        playSound('noteSave');
      } else {
        setError('株価の修正に失敗しました');
      }
    } catch {
      setError('株価の修正に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-4 bg-gray-900 rounded-lg p-3 border border-blue-900/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-blue-300 font-medium">📝 この日の株価を修正</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center bg-gray-700 border border-gray-600 rounded-lg px-3 focus-within:border-blue-500">
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving || disabled}
            min={0}
            step="any"
            className="w-full bg-transparent text-white py-2 text-base focus:outline-none disabled:opacity-50"
            placeholder="株価"
          />
          <span className="text-gray-400 text-sm ml-1">円</span>
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSaving ? '保存中...' : '株価を保存'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1.5">
        修正すると、この日の評価額・損益・純資産も自動で再計算されます
      </p>
      {error && (
        <p className="text-red-300 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
