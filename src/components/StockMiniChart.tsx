'use client';

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
import { useStockPriceHistory } from '@/hooks/useStockPriceHistory';
import { formatPrice } from '@/lib/positionCalc';
import { calcYAxisDomain, formatDateLabel } from '@/lib/stockMiniChartCalc';
import type { HistoryRange } from '@/types/portfolio';

interface StockMiniChartProps {
  stockId: string | undefined;
  targetPrice?: number;
  stopLossPrice?: number;
}

const RANGE_OPTIONS: { key: HistoryRange; label: string }[] = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: 'ALL', label: '全期間' },
];

function formatYAxisValue(value: number): string {
  if (Math.abs(value) >= 10000) return `${Math.round(value / 10000)}万`;
  return String(Math.round(value));
}

export default function StockMiniChart({
  stockId,
  targetPrice,
  stopLossPrice,
}: StockMiniChartProps) {
  const { data, range, setRange, isLoading, error } = useStockPriceHistory(stockId);

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
        <span className="text-xs text-gray-400">📊 株価推移</span>
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
                const fullDate = item?.payload?.fullDate;
                const price = item?.value as number;
                return (
                  <div className="bg-gray-800 border border-gray-600 rounded p-2 shadow-lg text-xs">
                    <p className="text-gray-400">{fullDate}</p>
                    <p className="text-white font-medium">
                      {price != null ? `${formatPrice(price)}円` : 'データなし'}
                    </p>
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
              dot={{ r: 2, fill: '#60a5fa' }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
