import { useState, useMemo, useEffect } from 'react';
import { DividendInfo } from '@/types/dividend';
import { calculateDividendInfo } from '@/lib/dividendCalc';
import { ShareholderBenefitInfo } from '@/types/shareholder';
import { calculateShareholderBenefit } from '@/lib/shareholderCalc';
import { DividendRightsSettings, ShareholderRightsSettings } from '@/types/rightsDate';
import { getStockData } from '@/data/stockNames';

// 統合されたポジション情報の型
interface IntegratedPosition {
  totalShares: number;
  averagePrice: number;
  weightedTaxRate: number;
  purchaseDate: string;
  notes: string;
}

export interface DividendBenefitItem {
  symbol: string;
  companyName: string;
  type: 'dividend' | 'benefit' | 'both' | 'none';

  // 配当関連
  dividendInfo?: DividendInfo;
  dividendRightsDate?: string;
  annualDividend?: number;
  dividendYield?: number;
  afterTaxDividend?: number;

  // 優待関連
  benefitInfo?: ShareholderBenefitInfo;
  shareholderRightsDate?: string;
  benefitValue?: number;
  benefitYield?: number;
  isEligible?: boolean;
  shortfall?: number;

  // ポジション情報
  position?: IntegratedPosition;
  hasPosition: boolean;
}

export interface DividendBenefitSummary {
  totalStocks: number;
  dividendStocks: number;
  benefitStocks: number;
  totalAnnualDividend: number;
  totalAfterTaxDividend: number;
  totalBenefitValue: number;
  avgDividendYield: number;
  eligibleBenefits: number;
}

export type SortKey = 'symbol' | 'dividendYield' | 'benefitYield' | 'annualDividend' | 'benefitValue' | 'dividendRightsDate' | 'shareholderRightsDate';
export type FilterType = 'all' | 'dividend' | 'benefit' | 'both' | 'none';

interface StockDataInput {
  [symbol: string]: {
    name: string;
    dividendInfo?: DividendInfo;
    shareholderBenefitInfo?: ShareholderBenefitInfo;
    dividendRightsSettings: DividendRightsSettings;
    shareholderRightsSettings: ShareholderRightsSettings;
    position?: IntegratedPosition;
  };
}

// 日数差を計算
export function calculateDaysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 日数表示
export function getDaysUntilDisplay(daysUntil: number): string {
  if (daysUntil === Infinity) return '-';
  if (daysUntil === 0) return '今日';
  if (daysUntil === 1) return '明日';
  if (daysUntil < 0) return `${Math.abs(daysUntil)}日前`;
  return `${daysUntil}日後`;
}

// 権利確定日から完全な日付を計算
function calculateRightsDate(settings: DividendRightsSettings | ShareholderRightsSettings): string {
  if (!settings.isActive || !settings.month || !settings.day) return '';

  const currentYear = new Date().getFullYear();
  let targetDate = new Date(currentYear, settings.month - 1, settings.day);

  if (settings.isRecurring && targetDate < new Date()) {
    targetDate = new Date(currentYear + 1, settings.month - 1, settings.day);
  }

  return targetDate.toISOString().split('T')[0];
}

export function useDividendBenefitList(stockSymbols: string[], stockData: StockDataInput) {
  const [sortBy, setSortBy] = useState<SortKey>('dividendYield');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyNames, setCompanyNames] = useState<{ [symbol: string]: string }>({});

  // 会社名を非同期で取得
  useEffect(() => {
    const fetchCompanyNames = async () => {
      const names: { [symbol: string]: string } = {};
      await Promise.all(
        stockSymbols.map(async (symbol) => {
          try {
            const stockInfo = await getStockData(symbol);
            names[symbol] = stockInfo?.name || symbol;
          } catch (error) {
            console.error(`Failed to fetch name for ${symbol}:`, error);
            names[symbol] = symbol;
          }
        })
      );
      setCompanyNames(names);
    };

    fetchCompanyNames();
  }, [stockSymbols]);

  // データ処理
  const processedData = useMemo<DividendBenefitItem[]>(() => {
    return stockSymbols.map(symbol => {
      const data = stockData[symbol];
      if (!data) return null;

      const hasPosition = !!data.position;
      const position = data.position;

      // 配当情報処理
      const hasDividend = !!data.dividendInfo?.dividendPerShare && parseFloat(data.dividendInfo.dividendPerShare) > 0;
      const dividendRightsDate = calculateRightsDate(data.dividendRightsSettings);

      let dividendCalc = null;
      if (hasDividend && hasPosition) {
        const dividendPerShare = parseFloat(data.dividendInfo!.dividendPerShare);
        const frequency = data.dividendInfo!.dividendFrequency;
        const totalShares = position!.totalShares;
        const averagePrice = position!.averagePrice;

        dividendCalc = calculateDividendInfo(dividendPerShare, frequency, totalShares, averagePrice, position!.weightedTaxRate);
      }

      // 優待情報処理
      const hasBenefit = !!data.shareholderBenefitInfo?.benefitDescription;
      const shareholderRightsDate = calculateRightsDate(data.shareholderRightsSettings);

      let benefitCalc = null;
      if (hasBenefit && hasPosition) {
        const minimumShares = parseInt(data.shareholderBenefitInfo!.minimumShares) || 0;
        const currentShares = position!.totalShares;
        const estimatedValue = parseFloat(data.shareholderBenefitInfo!.estimatedValue) || 0;
        const totalInvestment = position!.totalShares * position!.averagePrice;

        benefitCalc = calculateShareholderBenefit(minimumShares, currentShares, estimatedValue, totalInvestment);
      }

      // タイプ判定
      let type: 'dividend' | 'benefit' | 'both' | 'none' = 'none';
      if (hasDividend && hasBenefit) type = 'both';
      else if (hasDividend) type = 'dividend';
      else if (hasBenefit) type = 'benefit';

      return {
        symbol,
        companyName: companyNames[symbol] || data.name,
        type,
        dividendInfo: data.dividendInfo,
        dividendRightsDate,
        annualDividend: dividendCalc?.annualDividend || 0,
        dividendYield: dividendCalc?.dividendYield || 0,
        afterTaxDividend: dividendCalc?.afterTaxAmount || 0,
        benefitInfo: data.shareholderBenefitInfo,
        shareholderRightsDate,
        benefitValue: benefitCalc?.estimatedValue || 0,
        benefitYield: benefitCalc?.yieldOnInvestment || 0,
        isEligible: benefitCalc?.isEligible || false,
        shortfall: benefitCalc?.shortfall || 0,
        position,
        hasPosition
      };
    }).filter(Boolean) as DividendBenefitItem[];
  }, [stockSymbols, stockData, companyNames]);

  // フィルター処理
  const filteredData = useMemo(() => {
    let filtered = processedData;

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.symbol.toLowerCase().includes(query) ||
        item.companyName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [processedData, filterType, searchQuery]);

  // ソート処理
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'dividendYield':
          comparison = (a.dividendYield || 0) - (b.dividendYield || 0);
          break;
        case 'benefitYield':
          comparison = (a.benefitYield || 0) - (b.benefitYield || 0);
          break;
        case 'annualDividend':
          comparison = (a.annualDividend || 0) - (b.annualDividend || 0);
          break;
        case 'benefitValue':
          comparison = (a.benefitValue || 0) - (b.benefitValue || 0);
          break;
        case 'dividendRightsDate':
          comparison = calculateDaysUntil(a.dividendRightsDate || '') - calculateDaysUntil(b.dividendRightsDate || '');
          break;
        case 'shareholderRightsDate':
          comparison = calculateDaysUntil(a.shareholderRightsDate || '') - calculateDaysUntil(b.shareholderRightsDate || '');
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortBy, sortOrder]);

  // サマリー統計
  const summary = useMemo<DividendBenefitSummary>(() => {
    const dividendItems = processedData.filter(item => item.type === 'dividend' || item.type === 'both');
    const benefitItems = processedData.filter(item => item.type === 'benefit' || item.type === 'both');

    const totalAnnualDividend = dividendItems.reduce((sum, item) => sum + (item.annualDividend || 0), 0);
    const totalAfterTaxDividend = dividendItems.reduce((sum, item) => sum + (item.afterTaxDividend || 0), 0);
    const totalBenefitValue = benefitItems.reduce((sum, item) => sum + (item.benefitValue || 0), 0);
    const eligibleBenefits = benefitItems.filter(item => item.isEligible).length;

    const avgDividendYield = dividendItems.length > 0
      ? dividendItems.reduce((sum, item) => sum + (item.dividendYield || 0), 0) / dividendItems.length
      : 0;

    return {
      totalStocks: processedData.length,
      dividendStocks: dividendItems.length,
      benefitStocks: benefitItems.length,
      totalAnnualDividend,
      totalAfterTaxDividend,
      totalBenefitValue,
      avgDividendYield,
      eligibleBenefits
    };
  }, [processedData]);

  // ソート変更ハンドラー
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  return {
    sortBy,
    sortOrder,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    sortedData,
    summary,
    handleSort,
  };
}
