'use client';

import { useMemo, useState } from 'react';
import { Position, calculatePositionSummary, formatPrice } from '@/types/positions';
import { CustomTag, TAG_COLORS } from '@/types/tags';

interface PortfolioData {
  symbol: string;
  name: string;
  positions: Position[];
  currentPrice: string;
  sector: string;
  customTags: CustomTag[];
}

interface InvestmentPieChartProps {
  portfolioData: PortfolioData[];
  type: 'investment' | 'sector' | 'tags';
}

interface TooltipData {
  label: string;
  value: number;
  percentage: number;
  color: string;
  x: number;
  y: number;
}

// 円グラフ用の色パレット（視覚的に区別しやすい色）
const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
  '#F87171', // red-400
  '#FBBF24', // amber-400
  '#34D399', // emerald-400
  '#A78BFA', // violet-400
];

export default function InvestmentPieChart({ portfolioData, type }: InvestmentPieChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // 投資額割合用のデータ処理
  const investmentData = useMemo(() => {
    const data: { label: string; value: number; color: string }[] = [];
    let totalInvestment = 0;

    portfolioData.forEach((stock, index) => {
      if (stock.positions.length > 0) {
        const summary = calculatePositionSummary(stock.positions);
        if (summary.totalCost > 0) {
          data.push({
            label: `${stock.symbol} ${stock.name}`,
            value: summary.totalCost,
            color: CHART_COLORS[index % CHART_COLORS.length]
          });
          totalInvestment += summary.totalCost;
        }
      }
    });

    // パーセンテージを計算
    return data.map(item => ({
      ...item,
      percentage: totalInvestment > 0 ? (item.value / totalInvestment) * 100 : 0
    }));
  }, [portfolioData]);

  // 業種別分散用のデータ処理
  const sectorData = useMemo(() => {
    const sectorMap = new Map<string, number>();
    let totalInvestment = 0;

    portfolioData.forEach((stock) => {
      if (stock.positions.length > 0) {
        const summary = calculatePositionSummary(stock.positions);
        if (summary.totalCost > 0) {
          const sector = stock.sector || 'その他';
          const currentValue = sectorMap.get(sector) || 0;
          sectorMap.set(sector, currentValue + summary.totalCost);
          totalInvestment += summary.totalCost;
        }
      }
    });

    const data: { label: string; value: number; color: string; percentage: number }[] = [];
    let colorIndex = 0;

    sectorMap.forEach((value, sector) => {
      data.push({
        label: sector,
        value,
        color: CHART_COLORS[colorIndex % CHART_COLORS.length],
        percentage: totalInvestment > 0 ? (value / totalInvestment) * 100 : 0
      });
      colorIndex++;
    });

    return data.sort((a, b) => b.value - a.value);
  }, [portfolioData]);

  // タグ別分散用のデータ処理
  const tagData = useMemo(() => {
    const tagMap = new Map<string, { value: number; color: string }>();
    let totalInvestment = 0;

    portfolioData.forEach((stock) => {
      if (stock.positions.length > 0) {
        const summary = calculatePositionSummary(stock.positions);
        if (summary.totalCost > 0) {
          if (stock.customTags.length > 0) {
            // 各タグに均等分散で投資額を配分
            const perTagValue = summary.totalCost / stock.customTags.length;
            stock.customTags.forEach((tag) => {
              const currentData = tagMap.get(tag.label) || { value: 0, color: CHART_COLORS[0] };
              // タグの色を対応するhex色に変換
              let hexColor = CHART_COLORS[0]; // デフォルト色
              switch (tag.color) {
                case 'blue': hexColor = '#3B82F6'; break;
                case 'green': hexColor = '#10B981'; break;
                case 'red': hexColor = '#EF4444'; break;
                case 'purple': hexColor = '#8B5CF6'; break;
                case 'yellow': hexColor = '#F59E0B'; break;
                case 'orange': hexColor = '#F97316'; break;
                case 'pink': hexColor = '#EC4899'; break;
                case 'gray': hexColor = '#6B7280'; break;
              }
              tagMap.set(tag.label, {
                value: currentData.value + perTagValue,
                color: hexColor
              });
              totalInvestment += perTagValue;
            });
          } else {
            // タグなしの場合は「未分類」として扱う
            const currentData = tagMap.get('未分類') || { value: 0, color: '#6B7280' };
            tagMap.set('未分類', {
              value: currentData.value + summary.totalCost,
              color: '#6B7280'
            });
            totalInvestment += summary.totalCost;
          }
        }
      }
    });

    const data: { label: string; value: number; color: string; percentage: number }[] = [];
    tagMap.forEach((tagData, tagName) => {
      data.push({
        label: tagName,
        value: tagData.value,
        color: tagData.color,
        percentage: totalInvestment > 0 ? (tagData.value / totalInvestment) * 100 : 0
      });
    });

    return data.sort((a, b) => b.value - a.value);
  }, [portfolioData]);

  const chartData = type === 'investment' ? investmentData : type === 'sector' ? sectorData : tagData;
  const title = type === 'investment' ? '💼 投資額割合' : type === 'sector' ? '🏢 業種別分散' : '🏷️ タグ別分散';

  // SVG円グラフの描画
  const renderPieChart = () => {
    if (chartData.length === 0) return null;

    const centerX = 120;
    const centerY = 120;
    const radius = 100;
    let currentAngle = 0;

    return (
      <svg width="240" height="240" className="mx-auto">
        {chartData.map((item, index) => {
          const startAngle = currentAngle;
          const endAngle = currentAngle + (item.percentage / 100) * 360;
          currentAngle = endAngle;

          // 弧の描画用のパス計算
          const startAngleRad = (startAngle - 90) * (Math.PI / 180);
          const endAngleRad = (endAngle - 90) * (Math.PI / 180);

          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);

          const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const containerRect = e.currentTarget.closest('div')?.getBoundingClientRect();
                  setTooltip({
                    label: item.label,
                    value: item.value,
                    percentage: item.percentage,
                    color: item.color,
                    x: e.clientX - (containerRect?.left || 0),
                    y: e.clientY - (containerRect?.top || 0)
                  });
                }}
                onMouseMove={(e) => {
                  if (tooltip) {
                    const containerRect = e.currentTarget.closest('div')?.getBoundingClientRect();
                    setTooltip(prev => prev ? {
                      ...prev,
                      x: e.clientX - (containerRect?.left || 0),
                      y: e.clientY - (containerRect?.top || 0)
                    } : null);
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}
        {/* 中央のホール */}
        <circle
          cx={centerX}
          cy={centerY}
          r="40"
          fill="#1F2937"
          stroke="#374151"
          strokeWidth="2"
        />
        {/* 中央のテキスト */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="text-xs fill-gray-300 font-medium"
        >
          総投資額
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          className="text-xs fill-white font-bold"
        >
          {formatPrice(chartData.reduce((sum, item) => sum + item.value, 0))}円
        </text>
      </svg>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">投資データがありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 relative">
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>

      {/* 円グラフ */}
      <div className="mb-4 relative">
        {renderPieChart()}

        {/* カスタムツールチップ */}
        {tooltip && (
          <div
            className="absolute z-50 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y - 40}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: tooltip.color }}
              />
              <span className="text-white font-medium">{tooltip.label}</span>
            </div>
            <div className="text-gray-300">
              <div className="font-bold text-white">
                {formatPrice(tooltip.value)}円
              </div>
              <div className="text-gray-400">
                {tooltip.percentage.toFixed(1)}%
              </div>
            </div>
            {/* ツールチップの三角形 */}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid #374151'
              }}
            />
          </div>
        )}
      </div>

      {/* 凡例 */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-300 truncate" title={item.label}>
                {item.label}
              </span>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-white font-medium">
                {item.percentage.toFixed(1)}%
              </div>
              <div className="text-gray-400">
                {formatPrice(item.value)}円
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}