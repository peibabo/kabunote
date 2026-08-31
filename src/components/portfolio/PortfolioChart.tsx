'use client';

import { useEffect, useMemo, useState } from 'react';
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
} from 'recharts';
import type { PortfolioSnapshotData, ChartType, ChartMemoMap } from '@/types/portfolio';
import { CHART_TYPE_META } from '@/types/portfolio';
import { formatPrice } from '@/lib/positionCalc';
import { calcBaselineMap, calcRatePercent, formatStockLabel, truncateStockName } from '@/lib/stockRateCalc';
import { loadStockData, type StockData } from '@/data/stockNames';
import ChartTooltip from './chart/ChartTooltip';
import CustomDot from './chart/CustomDot';

interface PortfolioChartProps {
  data: PortfolioSnapshotData[];
  memoMap?: ChartMemoMap;
  onDotClick?: (snapshotDate: string, chartType: ChartType, symbol?: string) => void;
}

// タブ表示は共通メタ（CHART_TYPE_META）から導出。並び順は定義順を踏襲。
const CHART_TABS: { key: ChartType; label: string; icon: string }[] =
  (Object.entries(CHART_TYPE_META) as [ChartType, { label: string; icon: string }][])
    .map(([key, meta]) => ({ key, ...meta }));

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

export default function PortfolioChart({ data, memoMap: propMemoMap, onDotClick }: PortfolioChartProps) {
  const [chartType, setChartType] = useState<ChartType>('value');

  const memoMap = propMemoMap || new Map();
  const handleDotClick = onDotClick || (() => {});

  // 銘柄名のCSVフォールバック（削除済み銘柄などDBで名前が引けないケース用）
  const [csvStockMap, setCsvStockMap] = useState<Map<string, StockData> | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadStockData().then(map => { if (!cancelled) setCsvStockMap(map); });
    return () => { cancelled = true; };
  }, []);

  // 個別株のユニークシンボルリスト
  const allSymbols = useMemo(() => {
    const symbolSet = new Set<string>();
    data.forEach(s => s.stockSnapshots.forEach(ss => symbolSet.add(ss.symbol)));
    return Array.from(symbolSet);
  }, [data]);

  // symbol → 銘柄名（スナップショット横断で最初の非null name、なければCSVフォールバック）
  const symbolNameMap = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(s => s.stockSnapshots.forEach(ss => {
      if (ss.name && !map.has(ss.symbol)) map.set(ss.symbol, ss.name);
    }));
    allSymbols.forEach(sym => {
      if (!map.has(sym)) {
        const csvName = csvStockMap?.get(sym)?.name;
        if (csvName) map.set(sym, csvName);
      }
    });
    return map;
  }, [data, allSymbols, csvStockMap]);

  // 銘柄ごとの基準価格（表示期間内の最初の有効価格）
  const baselineMap = useMemo(() => calcBaselineMap(data), [data]);

  // 値上がり率タブの描画対象（基準価格が取れない銘柄は描かない）
  const rateSymbols = useMemo(
    () => allSymbols.filter(sym => baselineMap.has(sym)),
    [allSymbols, baselineMap]
  );

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
      // 個別株価と値上がり率（起点比%）
      s.stockSnapshots.forEach(ss => {
        if (ss.currentPrice != null) {
          base[`price_${ss.symbol}`] = ss.currentPrice;
        }
        const rate = calcRatePercent(ss.currentPrice, baselineMap.get(ss.symbol));
        if (rate != null) {
          base[`rate_${ss.symbol}`] = rate;
        }
      });
      return base;
    });
  }, [data, baselineMap]);

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
                <ChartTooltip memoMap={memoMap} chartType={chartType} />
              } />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="profitLoss"
                name="損益"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={<CustomDot chartType="profitLoss" memoMap={memoMap} onClick={handleDotClick} fill="#60a5fa" />}
                activeDot={false}
              />
            </LineChart>
          ) : chartType === 'stocks' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={
                <ChartTooltip memoMap={memoMap} chartType={chartType} />
              } />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
              {rateSymbols.map((symbol, i) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={`rate_${symbol}`}
                  name={formatStockLabel(symbol, symbolNameMap.get(symbol))}
                  stroke={STOCK_COLORS[i % STOCK_COLORS.length]}
                  strokeWidth={2}
                  dot={<CustomDot chartType="stocks" symbol={symbol} memoMap={memoMap} onClick={handleDotClick} fill={STOCK_COLORS[i % STOCK_COLORS.length]} />}
                  activeDot={false}
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
                <ChartTooltip memoMap={memoMap} chartType={chartType} />
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
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalInvestment"
                    name="投資額"
                    stroke="#6b7280"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="none"
                    activeDot={false}
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
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalValue"
                    name="評価額"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="none"
                    activeDot={false}
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

      {/* 値上がり率タブの凡例（Recharts Legendはチャート領域を圧迫するため自前描画） */}
      {chartType === 'stocks' && rateSymbols.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 max-h-16 overflow-y-auto text-[11px] text-gray-300">
          {rateSymbols.map((symbol, i) => {
            const name = symbolNameMap.get(symbol);
            return (
              <span key={symbol} className="flex items-center gap-1 max-w-[10rem]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: STOCK_COLORS[i % STOCK_COLORS.length] }}
                />
                <span className="truncate">
                  {formatStockLabel(symbol, name ? truncateStockName(name, 6) : null)}
                </span>
              </span>
            );
          })}
        </div>
      )}

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
