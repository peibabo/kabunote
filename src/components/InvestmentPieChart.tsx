'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/positionCalc';
import { formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';
import { formatBenefitValue, formatBenefitYield } from '@/lib/shareholderCalc';
import { usePieChartData, type PortfolioData, type PieChartType, type ChartSlice } from '@/hooks/usePieChartData';

interface TooltipData {
  label: string;
  value: number;
  percentage: number;
  color: string;
  x: number;
  y: number;
  dividendYield?: number;
  benefitYield?: number;
}

interface InvestmentPieChartProps {
  portfolioData: PortfolioData[];
  type: PieChartType;
}

const CHART_TITLES: Record<PieChartType, string> = {
  investment: '💼 投資額割合',
  sector: '🏢 業種別分散',
  tags: '🏷️ タグ別分散',
  dividend: '💰 配当金額割合',
  shareholder: '🎁 株主優待価値割合',
};

const EMPTY_MESSAGES: Record<PieChartType, string> = {
  investment: '投資データがありません',
  sector: '投資データがありません',
  tags: '投資データがありません',
  dividend: '配当情報がありません',
  shareholder: '株主優待情報がありません',
};

export default function InvestmentPieChart({ portfolioData, type }: InvestmentPieChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const chartData = usePieChartData(portfolioData, type);

  const title = CHART_TITLES[type];

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">{EMPTY_MESSAGES[type]}</p>
        </div>
      </div>
    );
  }

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const centerLabel = type === 'dividend' ? '年間配当金' : type === 'shareholder' ? '年間優待価値' : '総投資額';
  const centerValue = type === 'dividend'
    ? `${formatDividendAmount(totalValue)}円`
    : type === 'shareholder'
    ? `${formatBenefitValue(totalValue)}円`
    : `${formatPrice(totalValue)}円`;

  const formatTooltipValue = (value: number) => {
    if (type === 'dividend') return `${formatDividendAmount(value)}円`;
    if (type === 'shareholder') return `${formatBenefitValue(value)}円`;
    return `${formatPrice(value)}円`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 relative">
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>

      <div className="mb-4 relative">
        <PieChartSVG
          chartData={chartData}
          type={type}
          centerLabel={centerLabel}
          centerValue={centerValue}
          tooltip={tooltip}
          setTooltip={setTooltip}
        />

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
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tooltip.color }} />
              <span className="text-white font-medium">{tooltip.label}</span>
            </div>
            <div className="text-gray-300">
              <div className="font-bold text-white">{formatTooltipValue(tooltip.value)}</div>
              <div className="text-gray-400">{tooltip.percentage.toFixed(1)}%</div>
              {type === 'dividend' && tooltip.dividendYield !== undefined && (
                <div className="text-green-300 text-xs">利回り {formatDividendYield(tooltip.dividendYield)}%</div>
              )}
              {type === 'shareholder' && tooltip.benefitYield !== undefined && (
                <div className="text-purple-300 text-xs">優待利回り {formatBenefitYield(tooltip.benefitYield)}%</div>
              )}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
              style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #374151' }}
            />
          </div>
        )}
      </div>

      {/* 凡例 */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-gray-300 truncate" title={item.label}>{item.label}</span>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="text-white font-medium">{item.percentage.toFixed(1)}%</div>
              <div className="text-gray-400">{formatPrice(item.value)}円</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// SVG円グラフコンポーネント
function PieChartSVG({ chartData, type, centerLabel, centerValue, tooltip, setTooltip }: {
  chartData: ChartSlice[];
  type: PieChartType;
  centerLabel: string;
  centerValue: string;
  tooltip: TooltipData | null;
  setTooltip: (tooltip: TooltipData | null) => void;
}) {
  const centerX = 120;
  const centerY = 120;
  const radius = 100;

  // 各スライスの開始・終了角度を事前計算
  const sliceAngles = chartData.reduce<{ startAngle: number; endAngle: number }[]>((acc, item) => {
    const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const endAngle = startAngle + (item.percentage / 100) * 360;
    acc.push({ startAngle, endAngle });
    return acc;
  }, []);

  return (
    <svg width="240" height="240" className="mx-auto">
      {chartData.map((item, index) => {
        const { startAngle, endAngle } = sliceAngles[index];

        const startAngleRad = (startAngle - 90) * (Math.PI / 180);
        const endAngleRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);

        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        return (
          <g key={index}>
            <path
              d={pathData}
              fill={item.color}
              stroke="white"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
              onMouseEnter={(e) => {
                const containerRect = e.currentTarget.closest('div')?.getBoundingClientRect();
                setTooltip({
                  label: item.label, value: item.value, percentage: item.percentage, color: item.color,
                  x: e.clientX - (containerRect?.left || 0),
                  y: e.clientY - (containerRect?.top || 0),
                  ...(type === 'dividend' && item.dividendYield !== undefined && { dividendYield: item.dividendYield }),
                  ...(type === 'shareholder' && item.benefitYield !== undefined && { benefitYield: item.benefitYield })
                });
              }}
              onMouseMove={(e) => {
                if (tooltip) {
                  const containerRect = e.currentTarget.closest('div')?.getBoundingClientRect();
                  setTooltip({
                    ...tooltip,
                    x: e.clientX - (containerRect?.left || 0),
                    y: e.clientY - (containerRect?.top || 0)
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </g>
        );
      })}
      <circle cx={centerX} cy={centerY} r="40" fill="#1F2937" stroke="#374151" strokeWidth="2" />
      <text x={centerX} y={centerY - 5} textAnchor="middle" className="text-xs fill-gray-300 font-medium">
        {centerLabel}
      </text>
      <text x={centerX} y={centerY + 10} textAnchor="middle" className="text-xs fill-white font-bold">
        {centerValue}
      </text>
    </svg>
  );
}
