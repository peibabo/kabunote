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
import type { PortfolioSnapshotData, ChartType } from '@/types/portfolio';
import { formatPrice } from '@/lib/positionCalc';

interface PortfolioChartProps {
  data: PortfolioSnapshotData[];
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
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
    </div>
  );
}

export default function PortfolioChart({ data }: PortfolioChartProps) {
  const [chartType, setChartType] = useState<ChartType>('value');

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
      <div className="text-center py-8 text-gray-400 text-sm">
        まだスナップショットがありません。<br />
        「今日の記録を確定」ボタンを押して記録を開始しましょう。
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
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="profitLoss"
                name="損益"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ r: 3, fill: '#60a5fa' }}
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
              <Tooltip content={<CustomTooltip />} />
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
                  dot={{ r: 2 }}
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
              <Tooltip content={<CustomTooltip />} />
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
