'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { PortfolioSnapshotData, ChartType, ChartMemoMap } from '@/types/portfolio';
import { chartMemoKey } from '@/types/portfolio';
import { formatPrice } from '@/lib/positionCalc';

interface PortfolioChartProps {
  data: PortfolioSnapshotData[];
  memoMap?: ChartMemoMap;
  onDotClick?: (snapshotDate: string, chartType: ChartType, symbol?: string) => void;
}

const CHART_TABS: { key: ChartType; label: string; icon: string }[] = [
  { key: 'value', label: '評価額', icon: '💰' },
  { key: 'netAssets', label: '純資産', icon: '🏦' },
  { key: 'profitLoss', label: '損益', icon: '📈' },
  { key: 'stocks', label: '個別株価', icon: '📊' },
];

// 銘柄ごとの色パレット
const STOCK_COLORS = [
  '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa',
  '#fb923c', '#22d3ee', '#e879f9', '#4ade80', '#f87171',
  '#38bdf8', '#c084fc', '#facc15', '#fb7185', '#2dd4bf',
  '#818cf8', '#a3e635', '#f97316', '#e11d48', '#14b8a6',
];

function formatDateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

function formatYAxisValue(value: number): string {
  if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(1)}千万`;
  if (Math.abs(value) >= 10000) return `${Math.round(value / 10000)}万`;
  return String(Math.round(value));
}

// カスタムドット: メモがあるデータポイントを黄色マーカーで表示
interface CustomDotProps {
  cx?: number;
  cy?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  fill?: string;
  r?: number;
  chartType: ChartType;
  symbol?: string;
  memoMap: ChartMemoMap;
  onClick: (snapshotDate: string, chartType: ChartType, symbol?: string) => void;
}

function CustomDot({ cx, cy, payload, fill, chartType, symbol, memoMap, onClick }: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null;

  const fullDate = payload.fullDate as string;
  if (!fullDate) return null;

  const key = chartMemoKey(fullDate, chartType, symbol);
  const hasMemo = memoMap.has(key);

  return (
    <g
      onClick={(e) => { e.stopPropagation(); onClick(fullDate, chartType, symbol); }}
      style={{ cursor: 'pointer' }}
    >
      {hasMemo ? (
        <>
          <circle cx={cx} cy={cy} r={6} fill="#fbbf24" stroke="#f59e0b" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={2} fill="#fff" />
        </>
      ) : (
        <circle cx={cx} cy={cy} r={3} fill={fill || '#60a5fa'} />
      )}
    </g>
  );
}

// カスタムツールチップ: メモプレビュー付き
function CustomTooltipContent({
  active,
  payload,
  label,
  memoMap,
  chartType,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
  memoMap: ChartMemoMap;
  chartType: ChartType;
}) {
  if (!active || !payload?.length) return null;

  const fullDate = payload[0]?.payload?.fullDate as string | undefined;

  // メモ収集
  const memoEntries: { label: string; content: string }[] = [];
  if (fullDate) {
    if (chartType === 'stocks') {
      for (const p of payload) {
        const sym = (p.dataKey as string).replace('price_', '');
        const memo = memoMap.get(chartMemoKey(fullDate, chartType, sym));
        if (memo) memoEntries.push({ label: sym, content: memo.content });
      }
    } else {
      const memo = memoMap.get(chartMemoKey(fullDate, chartType));
      if (memo) memoEntries.push({ label: '', content: memo.content });
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="text-white font-medium">
            {entry.value >= 0 ? '' : '-'}{formatPrice(Math.abs(entry.value))}円
          </span>
        </div>
      ))}
      {memoEntries.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          {memoEntries.map((entry, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <span className="text-yellow-400 mt-0.5">📝</span>
              <span className="text-yellow-200">
                {entry.label && <span className="text-gray-400">{entry.label}: </span>}
                {entry.content.length > 50 ? entry.content.slice(0, 50) + '…' : entry.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioChart({ data, memoMap: propMemoMap, onDotClick }: PortfolioChartProps) {
  const [chartType, setChartType] = useState<ChartType>('value');

  const memoMap = propMemoMap || new Map();
  const handleDotClick = onDotClick || (() => {});

  // 個別株のユニークシンボルリスト
  const allSymbols = useMemo(() => {
    const symbolSet = new Set<string>();
    data.forEach(s => s.stockSnapshots.forEach(ss => symbolSet.add(ss.symbol)));
    return Array.from(symbolSet);
  }, [data]);

  // グラフデータ変換
  const chartData = useMemo(() => {
    return data.map(s => {
      const base: Record<string, string | number> = {
        date: formatDateLabel(s.snapshotDate),
        fullDate: s.snapshotDate,
        totalValue: s.totalValue,
        netAssets: s.netAssets,
        profitLoss: s.profitLoss,
        totalInvestment: s.totalInvestment,
        cashAmount: s.cashAmount,
      };
      // 個別株価
      s.stockSnapshots.forEach(ss => {
        if (ss.currentPrice != null) {
          base[`price_${ss.symbol}`] = ss.currentPrice;
        }
      });
      return base;
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm leading-relaxed">
        毎日の株価を記録して、ポートフォリオの推移をグラフで振り返れます。<br />
        「本日の終値を確定」を押すと、現在の評価額・損益・純資産が保存されます。<br />
        <span className="text-gray-500">15時以降に画面右下のボタンからも記録できます。</span>
      </div>
    );
  }

  return (
    <div>
      {/* グラフ種別タブ */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {CHART_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setChartType(tab.key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
              chartType === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* グラフ描画 */}
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'profitLoss' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={formatYAxisValue}
              />
              <Tooltip content={
                <CustomTooltipContent memoMap={memoMap} chartType={chartType} />
              } />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="profitLoss"
                name="損益"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={<CustomDot chartType="profitLoss" memoMap={memoMap} onClick={handleDotClick} fill="#60a5fa" />}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : chartType === 'stocks' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={formatYAxisValue}
              />
              <Tooltip content={
                <CustomTooltipContent memoMap={memoMap} chartType={chartType} />
              } />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
              />
              {allSymbols.map((symbol, i) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={`price_${symbol}`}
                  name={symbol}
                  stroke={STOCK_COLORS[i % STOCK_COLORS.length]}
                  strokeWidth={2}
                  dot={<CustomDot chartType="stocks" symbol={symbol} memoMap={memoMap} onClick={handleDotClick} fill={STOCK_COLORS[i % STOCK_COLORS.length]} />}
                  connectNulls
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNetAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={formatYAxisValue}
              />
              <Tooltip content={
                <CustomTooltipContent memoMap={memoMap} chartType={chartType} />
              } />
              {chartType === 'value' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="totalValue"
                    name="評価額"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#gradValue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalInvestment"
                    name="投資額"
                    stroke="#6b7280"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                  {/* クリック可能なドット用の透明Line */}
                  <Line
                    type="monotone"
                    dataKey="totalValue"
                    stroke="none"
                    dot={<CustomDot chartType="value" memoMap={memoMap} onClick={handleDotClick} fill="#3b82f6" />}
                    activeDot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                </>
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="netAssets"
                    name="純資産"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gradNetAssets)"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalValue"
                    name="評価額"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                  {/* クリック可能なドット用の透明Line */}
                  <Line
                    type="monotone"
                    dataKey="netAssets"
                    stroke="none"
                    dot={<CustomDot chartType="netAssets" memoMap={memoMap} onClick={handleDotClick} fill="#10b981" />}
                    activeDot={false}
                    legendType="none"
                    isAnimationActive={false}
                  />
                </>
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 最新データサマリー */}
      {data.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            { label: '評価額', value: data[data.length - 1].totalValue, color: 'text-blue-300' },
            { label: '投資額', value: data[data.length - 1].totalInvestment, color: 'text-gray-300' },
            { label: '損益', value: data[data.length - 1].profitLoss, color: data[data.length - 1].profitLoss >= 0 ? 'text-green-300' : 'text-red-300' },
            { label: '純資産', value: data[data.length - 1].netAssets, color: 'text-emerald-300' },
          ].map(item => (
            <div key={item.label} className="bg-gray-800 rounded p-2">
              <div className="text-xs text-gray-400">{item.label}</div>
              <div className={`text-sm font-medium ${item.color}`}>
                {item.label === '損益' && item.value >= 0 ? '+' : ''}{formatPrice(Math.round(item.value))}円
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
