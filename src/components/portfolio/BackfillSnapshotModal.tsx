'use client';

import { useState, useEffect } from 'react';
import { playSound } from '@/lib/sound';
import { formatDateSlashJP } from '@/lib/dateFormat';
import { formatShares } from '@/lib/positionCalc';
import { getBackfillPreview, type BackfillPreview } from '@/lib/apiClient';

interface BackfillSnapshotModalProps {
  /** 記録していない営業日（新しい順）。先頭を初期選択にする */
  missingDates: string[];
  onClose: () => void;
  onSave: (
    date: string,
    prices: { stockId: string; currentPrice: number }[],
    cashAmount: number,
  ) => Promise<boolean>;
}

const MAX_PRICE = 99_999_999;

function isValidPrice(value: string): boolean {
  const n = parseFloat(value);
  return value.trim().length > 0 && Number.isFinite(n) && n > 0 && n <= MAX_PRICE;
}

function isValidCash(value: string): boolean {
  const n = parseFloat(value);
  return value.trim().length > 0 && Number.isFinite(n) && n >= 0;
}

/**
 * 記録し忘れた日のスナップショットを後から追加するモーダル。
 * 保有株数はサーバーが売却履歴から再現する。株価と現金は直前の記録の値が初期値で、ここで修正できる。
 */
export default function BackfillSnapshotModal({ missingDates, onClose, onSave }: BackfillSnapshotModalProps) {
  const [date, setDate] = useState(missingDates[0] ?? '');
  const [preview, setPreview] = useState<BackfillPreview | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [cash, setCash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setIsLoading(true);
    setError('');
    setPreview(null);
    getBackfillPreview(date)
      .then(p => {
        if (cancelled) return;
        setPreview(p);
        setPrices(Object.fromEntries(p.stocks.map(s => [s.stockId, s.suggestedPrice != null ? String(s.suggestedPrice) : ''])));
        setCash(String(p.suggestedCash));
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : '読み込みに失敗しました');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const canSave = preview != null
    && !isSaving
    && preview.stocks.every(s => isValidPrice(prices[s.stockId] ?? ''))
    && isValidCash(cash);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSave = async () => {
    if (!canSave || !preview) return;
    setIsSaving(true);
    setError('');
    try {
      const success = await onSave(
        preview.date,
        preview.stocks.map(s => ({ stockId: s.stockId, currentPrice: parseFloat(prices[s.stockId]) })),
        parseFloat(cash),
      );
      if (success) {
        playSound('noteSave');
        onClose();
      } else {
        setError('記録の追加に失敗しました');
      }
    } catch {
      setError('記録の追加に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="backfill-title"
          className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 id="backfill-title" className="text-lg font-bold text-white">📅 記録し忘れた日を追加</h2>
            <button
              onClick={handleClose}
              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            その日の終値を入れて保存すると、推移グラフの抜けが埋まります。保有株数はその日の時点（売却前の株も含む）で計算します。株価と現金には直前の記録の値が入っています。
          </p>

          <label className="block text-sm text-gray-300 mb-1" htmlFor="backfill-date">日付</label>
          <select
            id="backfill-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSaving}
            className="cursor-pointer w-full mb-4 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-base text-white focus:outline-none focus:border-blue-500"
          >
            {missingDates.map(d => (
              <option key={d} value={d}>{formatDateSlashJP(d)}</option>
            ))}
          </select>

          {isLoading && <p className="text-sm text-gray-400 py-4 text-center">読み込み中...</p>}

          {preview && (
            <>
              <div className="space-y-3 mb-4">
                {preview.stocks.map(s => {
                  const value = prices[s.stockId] ?? '';
                  const invalid = value.length > 0 && !isValidPrice(value);
                  return (
                    <div key={s.stockId}>
                      <label className="flex items-baseline justify-between text-sm text-gray-300 mb-1" htmlFor={`backfill-price-${s.stockId}`}>
                        <span className="truncate">{s.symbol}{s.name ? ` ${s.name}` : ''}</span>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatShares(s.shares)}株</span>
                      </label>
                      <div className={`flex items-center bg-gray-700 border rounded-lg px-3 focus-within:border-blue-500 ${invalid ? 'border-red-500' : 'border-gray-600'}`}>
                        <input
                          id={`backfill-price-${s.stockId}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={value}
                          onChange={(e) => setPrices(prev => ({ ...prev, [s.stockId]: e.target.value }))}
                          disabled={isSaving}
                          className="w-full bg-transparent text-white py-2 text-base focus:outline-none disabled:opacity-50"
                          placeholder="その日の終値"
                        />
                        <span className="text-gray-400 text-sm ml-1">円</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <label className="block text-sm text-gray-300 mb-1" htmlFor="backfill-cash">現金</label>
              <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg px-3 mb-4 focus-within:border-blue-500">
                <input
                  id="backfill-cash"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-transparent text-white py-2 text-base focus:outline-none disabled:opacity-50"
                />
                <span className="text-gray-400 text-sm ml-1">円</span>
              </div>
            </>
          )}

          {error && (
            <p className="mb-3 text-sm text-red-300" role="alert">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="cursor-pointer px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : 'この日の記録を追加'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
