'use client';

import { useState, useCallback, useMemo } from 'react';
import { playSound } from '@/lib/sound';
import { formatPrice } from '@/lib/positionCalc';
import { calcBaselineMap, calcRatePercent, formatRatePercent } from '@/lib/stockRateCalc';
import { isBeforeTodayJST } from '@/lib/dateJst';
import PortfolioChart from '@/components/portfolio/PortfolioChart';
import ChartMemoModal from '@/components/portfolio/ChartMemoModal';
import type { EditablePrice } from '@/components/portfolio/chart/ChartSnapshotEditor';
import type { HistoryRange, ChartType, PortfolioSnapshotData, ChartMemoMap } from '@/types/portfolio';
import { chartMemoKey } from '@/types/portfolio';

const RANGE_OPTIONS: { key: HistoryRange; label: string }[] = [
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: '2Y', label: '2Y' },
];

interface ModalTarget {
  snapshotDate: string;
  chartType: ChartType;
  symbol?: string;
}

interface PortfolioHistoryProps {
  data: PortfolioSnapshotData[];
  range: HistoryRange;
  setRange: (r: HistoryRange) => void;
  isLoading: boolean;
  isCreating: boolean;
  todayRecorded: boolean;
  error: string | null;
  createSnapshot: () => Promise<boolean>;
  memoMap: ChartMemoMap;
  saveMemo: (snapshotDate: string, chartType: ChartType, symbol: string | undefined, content: string) => Promise<boolean>;
  deleteMemo: (snapshotDate: string, chartType: ChartType, symbol?: string) => Promise<boolean>;
  updateSnapshotPrices: (snapshotId: string, prices: { stockId: string; currentPrice: number }[]) => Promise<boolean>;
}

export default function PortfolioHistory({
  data,
  range,
  setRange,
  isLoading,
  isCreating,
  todayRecorded,
  error,
  createSnapshot,
  memoMap,
  saveMemo,
  deleteMemo,
  updateSnapshotPrices,
}: PortfolioHistoryProps) {
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);

  const handleSnapshot = async () => {
    const success = await createSnapshot();
    if (success) {
      playSound('noteSave');
      window.dispatchEvent(new Event('kabunote-snapshot-created'));
    }
  };

  const handleDotClick = useCallback((snapshotDate: string, chartType: ChartType, symbol?: string) => {
    setModalTarget({ snapshotDate, chartType, symbol });
  }, []);

  const handleModalClose = useCallback(() => {
    setModalTarget(null);
  }, []);

  const handleSave = useCallback(async (content: string) => {
    if (!modalTarget) return false;
    return saveMemo(modalTarget.snapshotDate, modalTarget.chartType, modalTarget.symbol, content);
  }, [modalTarget, saveMemo]);

  const handleDelete = useCallback(async () => {
    if (!modalTarget) return false;
    return deleteMemo(modalTarget.snapshotDate, modalTarget.chartType, modalTarget.symbol);
  }, [modalTarget, deleteMemo]);

  // 個別株価チャート かつ 昨日以前 のとき、株価修正UIの対象を算出
  const editablePrice = useMemo<EditablePrice | undefined>(() => {
    if (!modalTarget || modalTarget.chartType !== 'stocks' || !modalTarget.symbol) return undefined;
    if (!isBeforeTodayJST(modalTarget.snapshotDate)) return undefined; // 当日分は対象外
    const snap = data.find(d => d.snapshotDate === modalTarget.snapshotDate);
    const ss = snap?.stockSnapshots.find(s => s.symbol === modalTarget.symbol);
    if (!snap || !ss) return undefined;
    return {
      snapshotId: snap.id,
      stockId: ss.stockId,
      symbol: ss.symbol,
      currentPrice: ss.currentPrice,
    };
  }, [modalTarget, data]);

  const handleSavePrice = useCallback(async (currentPrice: number) => {
    if (!editablePrice) return false;
    return updateSnapshotPrices(editablePrice.snapshotId, [
      { stockId: editablePrice.stockId, currentPrice },
    ]);
  }, [editablePrice, updateSnapshotPrices]);

  // モーダル表示時の既存メモ内容とデータ値を取得
  const existingContent = modalTarget
    ? memoMap.get(chartMemoKey(modalTarget.snapshotDate, modalTarget.chartType, modalTarget.symbol))?.content || ''
    : '';

  const modalDataValues = useMemo(() => {
    if (!modalTarget) return undefined;
    const snap = data.find(d => d.snapshotDate === modalTarget.snapshotDate);
    if (!snap) return undefined;

    const fmt = (v: number) => `${formatPrice(Math.round(v))}円`;

    switch (modalTarget.chartType) {
      case 'value':
        return [
          { label: '評価額', value: fmt(snap.totalValue), color: 'text-blue-300' },
          { label: '投資額', value: fmt(snap.totalInvestment) },
          { label: '現金', value: fmt(snap.cashAmount) },
        ];
      case 'netAssets':
        return [
          { label: '純資産', value: fmt(snap.netAssets), color: 'text-emerald-300' },
          { label: '評価額', value: fmt(snap.totalValue), color: 'text-blue-300' },
          { label: '現金', value: fmt(snap.cashAmount) },
        ];
      case 'profitLoss':
        return [
          {
            label: '損益',
            value: `${snap.profitLoss >= 0 ? '+' : ''}${fmt(snap.profitLoss)}`,
            color: snap.profitLoss >= 0 ? 'text-green-300' : 'text-red-300',
          },
          { label: '評価額', value: fmt(snap.totalValue), color: 'text-blue-300' },
          { label: '投資額', value: fmt(snap.totalInvestment) },
        ];
      case 'stocks': {
        const ss = modalTarget.symbol
          ? snap.stockSnapshots.find(s => s.symbol === modalTarget.symbol)
          : undefined;
        if (!ss) return undefined;
        const rate = calcRatePercent(ss.currentPrice, calcBaselineMap(data).get(ss.symbol));
        return [
          ...(rate != null
            ? [{
                label: '値上がり率',
                value: formatRatePercent(rate),
                color: rate >= 0 ? 'text-green-300' : 'text-red-300',
              }]
            : []),
          { label: '株価', value: ss.currentPrice != null ? `${formatPrice(ss.currentPrice)}円` : '-' },
          { label: '保有数', value: `${ss.shares}株` },
          { label: '評価額', value: fmt(ss.value) },
        ];
      }
      default:
        return undefined;
    }
  }, [modalTarget, data]);

  return (
    <>
      <div className="bg-gray-750 rounded-lg p-4">
        {/* ヘッダー: 確定ボタン/ステータス + 期間タブ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          {/* 確定ボタン or 記録済みステータス */}
          {todayRecorded ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-green-400 font-medium">
                ✅ 本日の記録済み
              </span>
              <button
                onClick={handleSnapshot}
                disabled={isCreating}
                className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '更新中...' : '最新データで上書き'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSnapshot}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? '記録中...' : '📸 本日の終値を確定'}
            </button>
          )}

          {/* 期間切替タブ */}
          <div className="flex gap-1">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  range === opt.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        {/* グラフ */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            読み込み中...
          </div>
        ) : (
          <PortfolioChart
            data={data}
            memoMap={memoMap}
            onDotClick={handleDotClick}
          />
        )}
      </div>

      {/* チャートメモモーダル */}
      {modalTarget && (
        <ChartMemoModal
          isOpen={true}
          onClose={handleModalClose}
          snapshotDate={modalTarget.snapshotDate}
          chartType={modalTarget.chartType}
          symbol={modalTarget.symbol}
          existingContent={existingContent}
          dataValues={modalDataValues}
          onSave={handleSave}
          onDelete={handleDelete}
          editablePrice={editablePrice}
          onSavePrice={handleSavePrice}
        />
      )}
    </>
  );
}
