'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useStockPriceHistory } from '@/hooks/stock/useStockPriceHistory';
import { useChartMemos } from '@/hooks/portfolio/useChartMemos';
import { useTradeMarkers } from '@/hooks/stock/useTradeMarkers';
import { formatPrice } from '@/lib/positionCalc';
import { isBeforeTodayJST } from '@/lib/dateJst';
import { calcYAxisDomain, formatDateLabel, buildTradeMarkerMap } from '@/lib/stockMiniChartCalc';
import type { TradeMarkerCell } from '@/lib/stockMiniChartCalc';
import { chartMemoKey } from '@/types/portfolio';
import type { HistoryRange, ChartMemoMap } from '@/types/portfolio';
import ChartMemoModal from '../portfolio/ChartMemoModal';
import type { EditablePrice } from '../portfolio/chart/ChartSnapshotEditor';

interface StockMiniChartProps {
  stockId: string | undefined;
  symbol: string;
  targetPrice?: number;
  stopLossPrice?: number;
}

const RANGE_OPTIONS: { key: HistoryRange; label: string }[] = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: '2Y', label: '2Y' },
];

function formatYAxisValue(value: number): string {
  if (Math.abs(value) >= 10000) return `${Math.round(value / 10000)}万`;
  return String(Math.round(value));
}

// メモ付きカスタムドット
interface MiniChartDotProps {
  cx?: number;
  cy?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  memoMap: ChartMemoMap;
  markerMap: Map<string, TradeMarkerCell>;
  symbol: string;
  onClick: (snapshotDate: string) => void;
}

function MiniChartDot({ cx, cy, payload, memoMap, markerMap, symbol, onClick }: MiniChartDotProps) {
  if (cx == null || cy == null || !payload) return null;

  const fullDate = payload.fullDate as string;
  if (!fullDate) return null;

  const key = chartMemoKey(fullDate, 'stocks', symbol);
  const hasMemo = memoMap.has(key);

  const cell = markerMap.get(fullDate);
  const buyCount = cell?.buys.length ?? 0;
  const sellCount = cell?.sells.length ?? 0;

  return (
    <g
      onClick={(e) => { e.stopPropagation(); onClick(fullDate); }}
      style={{ cursor: 'pointer' }}
    >
      {hasMemo ? (
        <>
          <circle cx={cx} cy={cy} r={5} fill="#fbbf24" stroke="#f59e0b" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={1.5} fill="#fff" />
        </>
      ) : (
        <circle cx={cx} cy={cy} r={2} fill="#60a5fa" />
      )}

      {/* 購入マーカー（緑▲・ラインの下） */}
      {buyCount > 0 && (
        <>
          <path
            d={`M ${cx} ${cy + 8} l 4 7 l -8 0 z`}
            fill="#22c55e"
            stroke="#15803d"
            strokeWidth={0.5}
          />
          {buyCount > 1 && (
            <text x={cx + 6} y={cy + 18} fill="#22c55e" fontSize={8} fontWeight="bold">
              ×{buyCount}
            </text>
          )}
        </>
      )}

      {/* 売却マーカー（赤▼・ラインの上） */}
      {sellCount > 0 && (
        <>
          <path
            d={`M ${cx} ${cy - 8} l 4 -7 l -8 0 z`}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth={0.5}
          />
          {sellCount > 1 && (
            <text x={cx + 6} y={cy - 12} fill="#ef4444" fontSize={8} fontWeight="bold">
              ×{sellCount}
            </text>
          )}
        </>
      )}
    </g>
  );
}

export default function StockMiniChart({
  stockId,
  symbol,
  targetPrice,
  stopLossPrice,
}: StockMiniChartProps) {
  const { data, range, setRange, isLoading, error, updateSnapshotPrice } = useStockPriceHistory(stockId);
  const { memoMap, saveMemo, deleteMemo } = useChartMemos(range);
  const { buys, sells } = useTradeMarkers(stockId);
  const [modalDate, setModalDate] = useState<string | null>(null);

  // 購入・売却日を最寄りのスナップショット日に対応付けたマーカーマップ
  const markerMap = useMemo(
    () => buildTradeMarkerMap(data.map(d => d.date), buys, sells),
    [data, buys, sells],
  );

  const handleDotClick = useCallback((snapshotDate: string) => {
    setModalDate(snapshotDate);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalDate(null);
  }, []);

  const handleSave = useCallback(async (content: string) => {
    if (!modalDate) return false;
    return saveMemo(modalDate, 'stocks', symbol, content);
  }, [modalDate, symbol, saveMemo]);

  const handleDelete = useCallback(async () => {
    if (!modalDate) return false;
    return deleteMemo(modalDate, 'stocks', symbol);
  }, [modalDate, symbol, deleteMemo]);

  const existingContent = modalDate
    ? memoMap.get(chartMemoKey(modalDate, 'stocks', symbol))?.content || ''
    : '';

  // 昨日以前のポイントのとき、株価修正UIの対象を算出（当日分は対象外）
  const editablePrice = useMemo<EditablePrice | undefined>(() => {
    if (!modalDate || !stockId) return undefined;
    if (!isBeforeTodayJST(modalDate)) return undefined;
    const item = data.find(d => d.date === modalDate);
    if (!item) return undefined;
    return {
      snapshotId: item.snapshotId,
      stockId,
      symbol,
      currentPrice: item.price,
    };
  }, [modalDate, stockId, symbol, data]);

  const handleSavePrice = useCallback(async (currentPrice: number) => {
    if (!editablePrice) return false;
    return updateSnapshotPrice(editablePrice.snapshotId, editablePrice.stockId, currentPrice);
  }, [editablePrice, updateSnapshotPrice]);

  const modalDataValues = modalDate
    ? (() => {
        const item = data.find(d => d.date === modalDate);
        if (!item || item.price == null) return undefined;
        return [
          { label: '株価', value: `${formatPrice(item.price)}円` },
        ];
      })()
    : undefined;

  if (!stockId) return null;

  if (isLoading) {
    return (
      <div className="text-center py-4 text-gray-400 text-xs">
        📊 チャート読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-400 text-xs">
        {error}
      </div>
    );
  }

  // データがない場合はメッセージ表示
  const priceDataCount = data.filter(d => d.price != null).length;
  if (priceDataCount < 1) {
    return (
      <div className="text-center py-4 text-gray-400 text-xs leading-relaxed">
        📊 スナップショットを記録すると<br />
        株価推移グラフが表示されます
      </div>
    );
  }

  const chartData = data.map(item => ({
    date: formatDateLabel(item.date),
    fullDate: item.date,
    price: item.price,
  }));

  const [yMin, yMax] = calcYAxisDomain(
    data,
    targetPrice,
    stopLossPrice,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">📊 株価推移</span>
          {markerMap.size > 0 && (
            <span className="text-[10px] text-gray-500">
              <span className="text-green-400">▲</span>購入{' '}
              <span className="text-red-400">▼</span>売却
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                range === opt.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={formatYAxisValue}
              width={45}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0];
                const fullDate = item?.payload?.fullDate as string;
                const price = item?.value as number;
                const memo = fullDate
                  ? memoMap.get(chartMemoKey(fullDate, 'stocks', symbol))
                  : undefined;
                const cell = fullDate ? markerMap.get(fullDate) : undefined;
                return (
                  <div className="bg-gray-800 border border-gray-600 rounded p-2 shadow-lg text-xs">
                    <p className="text-gray-400">{fullDate}</p>
                    <p className="text-white font-medium">
                      {price != null ? `${formatPrice(price)}円` : 'データなし'}
                    </p>
                    {cell && (cell.buys.length > 0 || cell.sells.length > 0) && (
                      <div className="mt-1 pt-1 border-t border-gray-600 space-y-0.5">
                        {cell.buys.map((b, i) => (
                          <div key={`b-${i}`} className="text-green-300">
                            ▲ 購入 {b.shares}株 @{formatPrice(b.price)}円
                          </div>
                        ))}
                        {cell.sells.map((s, i) => (
                          <div key={`s-${i}`} className="text-red-300">
                            ▼ 売却 {s.shares}株 @{formatPrice(s.price)}円
                          </div>
                        ))}
                      </div>
                    )}
                    {memo && (
                      <div className="mt-1 pt-1 border-t border-gray-600 flex items-start gap-1">
                        <span className="text-yellow-400">📝</span>
                        <span className="text-yellow-200">{memo.content}</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* 利確目標ライン */}
            {targetPrice != null && targetPrice > 0 && (
              <ReferenceLine
                y={targetPrice}
                stroke="#22c55e"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `利確 ${formatPrice(targetPrice)}`,
                  position: 'right',
                  fill: '#22c55e',
                  fontSize: 9,
                }}
              />
            )}

            {/* 損切ライン */}
            {stopLossPrice != null && stopLossPrice > 0 && (
              <ReferenceLine
                y={stopLossPrice}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `損切 ${formatPrice(stopLossPrice)}`,
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 9,
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="price"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={<MiniChartDot memoMap={memoMap} markerMap={markerMap} symbol={symbol} onClick={handleDotClick} />}
              activeDot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {modalDate && (
        <ChartMemoModal
          isOpen={true}
          onClose={handleModalClose}
          snapshotDate={modalDate}
          chartType="stocks"
          symbol={symbol}
          existingContent={existingContent}
          dataValues={modalDataValues}
          onSave={handleSave}
          onDelete={handleDelete}
          editablePrice={editablePrice}
          onSavePrice={handleSavePrice}
        />
      )}
    </div>
  );
}
