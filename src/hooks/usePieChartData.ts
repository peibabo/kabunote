import { useMemo } from 'react';
import { Position } from '@/types/positions';
import { calculatePositionSummary } from '@/lib/positionCalc';
import { CustomTag } from '@/types/tags';
import { calculateDividendInfo } from '@/lib/dividendCalc';
import { calculateShareholderBenefit } from '@/lib/shareholderCalc';

export interface PortfolioData {
  symbol: string;
  name: string;
  positions: Position[];
  currentPrice: number | null;
  sector: string | null;
  customTags: CustomTag[];
  dividend?: {
    dividendPerShare: number | null;
    frequency: number | null;
  } | null;
  benefit?: {
    minimumShares: number | null;
    estimatedValue: number | null;
  } | null;
}

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
  percentage: number;
  dividendYield?: number;
  benefitYield?: number;
}

export type PieChartType = 'investment' | 'sector' | 'tags' | 'dividend' | 'shareholder';

// 円グラフ用の色パレット
export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
  '#14B8A6', '#F87171', '#FBBF24', '#34D399', '#A78BFA',
];

const TAG_COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6', green: '#10B981', red: '#EF4444', purple: '#8B5CF6',
  yellow: '#F59E0B', orange: '#F97316', pink: '#EC4899', gray: '#6B7280',
};

export function usePieChartData(portfolioData: PortfolioData[], type: PieChartType): ChartSlice[] {
  const investmentData = useMemo(() => {
    if (type !== 'investment') return [];
    const data: { label: string; value: number; color: string }[] = [];
    let total = 0;

    portfolioData.forEach((stock, index) => {
      if (stock.positions.length > 0) {
        const summary = calculatePositionSummary(stock.positions);
        if (summary.totalCost > 0) {
          data.push({
            label: stock.name !== stock.symbol ? `${stock.name} (${stock.symbol})` : stock.symbol,
            value: summary.totalCost,
            color: CHART_COLORS[index % CHART_COLORS.length]
          });
          total += summary.totalCost;
        }
      }
    });

    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0
    }));
  }, [portfolioData, type]);

  const sectorData = useMemo(() => {
    if (type !== 'sector') return [];
    const sectorMap = new Map<string, number>();
    let total = 0;

    portfolioData.forEach((stock) => {
      if (stock.positions.length > 0) {
        const summary = calculatePositionSummary(stock.positions);
        if (summary.totalCost > 0) {
          const sector = stock.sector || 'その他';
          sectorMap.set(sector, (sectorMap.get(sector) || 0) + summary.totalCost);
          total += summary.totalCost;
        }
      }
    });

    const data: ChartSlice[] = [];
    let colorIndex = 0;
    sectorMap.forEach((value, sector) => {
      data.push({
        label: sector, value,
        color: CHART_COLORS[colorIndex % CHART_COLORS.length],
        percentage: total > 0 ? (value / total) * 100 : 0
      });
      colorIndex++;
    });

    return data.sort((a, b) => b.value - a.value);
  }, [portfolioData, type]);

  const tagData = useMemo(() => {
    if (type !== 'tags') return [];
    const tagMap = new Map<string, { value: number; color: string }>();
    let total = 0;

    portfolioData.forEach((stock) => {
      if (stock.positions.length > 0) {
        const summary = calculatePositionSummary(stock.positions);
        if (summary.totalCost > 0) {
          if (stock.customTags.length > 0) {
            const perTagValue = summary.totalCost / stock.customTags.length;
            stock.customTags.forEach((tag) => {
              const currentData = tagMap.get(tag.label) || { value: 0, color: CHART_COLORS[0] };
              tagMap.set(tag.label, {
                value: currentData.value + perTagValue,
                color: TAG_COLOR_MAP[tag.color] || CHART_COLORS[0]
              });
              total += perTagValue;
            });
          } else {
            const currentData = tagMap.get('未分類') || { value: 0, color: '#6B7280' };
            tagMap.set('未分類', { value: currentData.value + summary.totalCost, color: '#6B7280' });
            total += summary.totalCost;
          }
        }
      }
    });

    const data: ChartSlice[] = [];
    tagMap.forEach((tagData, tagName) => {
      data.push({
        label: tagName, value: tagData.value, color: tagData.color,
        percentage: total > 0 ? (tagData.value / total) * 100 : 0
      });
    });

    return data.sort((a, b) => b.value - a.value);
  }, [portfolioData, type]);

  const dividendData = useMemo(() => {
    if (type !== 'dividend') return [];
    const data: ChartSlice[] = [];
    let total = 0;

    portfolioData.forEach((stock, index) => {
      if (stock.positions.length > 0) {
        const summary = calculatePositionSummary(stock.positions);
        const perShare = stock.dividend?.dividendPerShare ?? 0;
        const frequency = (stock.dividend?.frequency ?? 1) as 1 | 2 | 4;

        if (perShare > 0 && summary.totalShares > 0) {
          const calc = calculateDividendInfo(perShare, frequency, summary.totalShares, summary.averagePrice);
          data.push({
            label: stock.name !== stock.symbol ? `${stock.name} (${stock.symbol})` : stock.symbol,
            value: calc.annualDividend,
            color: CHART_COLORS[index % CHART_COLORS.length],
            percentage: 0,
            dividendYield: calc.dividendYield
          });
          total += calc.annualDividend;
        }
      }
    });

    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [portfolioData, type]);

  const shareholderData = useMemo(() => {
    if (type !== 'shareholder') return [];
    const data: ChartSlice[] = [];
    let total = 0;

    portfolioData.forEach((stock, index) => {
      if (stock.positions.length > 0) {
        const summary = calculatePositionSummary(stock.positions);
        const minShares = stock.benefit?.minimumShares ?? 0;
        const estValue = stock.benefit?.estimatedValue ?? 0;

        if (minShares > 0 && estValue > 0 && summary.totalShares > 0) {
          const calc = calculateShareholderBenefit(minShares, summary.totalShares, estValue, summary.totalCost);
          if (calc.isEligible) {
            data.push({
              label: stock.name !== stock.symbol ? `${stock.name} (${stock.symbol})` : stock.symbol,
              value: calc.estimatedValue,
              color: CHART_COLORS[index % CHART_COLORS.length],
              percentage: 0,
              benefitYield: calc.yieldOnInvestment
            });
            total += calc.estimatedValue;
          }
        }
      }
    });

    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [portfolioData, type]);

  switch (type) {
    case 'investment': return investmentData;
    case 'sector': return sectorData;
    case 'tags': return tagData;
    case 'dividend': return dividendData;
    case 'shareholder': return shareholderData;
  }
}
