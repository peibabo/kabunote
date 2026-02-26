'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DividendInfo, calculateDividendInfo, formatDividendAmount, formatDividendYield } from '@/types/dividend';
import { ShareholderBenefitInfo, calculateShareholderBenefit, formatBenefitValue, formatBenefitYield } from '@/types/shareholder';
import { DividendRightsSettings, ShareholderRightsSettings, formatDividendMonthDay, formatShareholderMonthDay } from '@/types/rightsDate';
import { Position } from '@/types/positions';
import { getStockData } from '@/data/stockNames';

interface DividendBenefitData {
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
  position?: Position;
  hasPosition: boolean;
}

type SortKey = 'symbol' | 'dividendYield' | 'benefitYield' | 'annualDividend' | 'benefitValue' | 'dividendRightsDate' | 'shareholderRightsDate';
type FilterType = 'all' | 'dividend' | 'benefit' | 'both' | 'none';

interface DividendBenefitListPageProps {
  stockSymbols: string[];
  stockData: {
    [symbol: string]: {
      name: string;
      dividendInfo?: DividendInfo;
      shareholderBenefitInfo?: ShareholderBenefitInfo;
      dividendRightsSettings: DividendRightsSettings;
      shareholderRightsSettings: ShareholderRightsSettings;
      position?: Position;
    }
  };
  onStockClick?: (symbol: string) => void;
}

export default function DividendBenefitListPage({ stockSymbols, stockData, onStockClick }: DividendBenefitListPageProps) {
  const [sortBy, setSortBy] = useState<SortKey>('dividendYield');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyNames, setCompanyNames] = useState<{ [symbol: string]: string }>({});

  // 会社名を非同期で取得
  useEffect(() => {
    const fetchCompanyNames = async () => {
      const names: { [symbol: string]: string } = {};
      for (const symbol of stockSymbols) {
        try {
          const stockInfo = await getStockData(symbol);
          names[symbol] = stockInfo?.name || symbol;
        } catch (error) {
          console.error(`Failed to fetch name for ${symbol}:`, error);
          names[symbol] = symbol;
        }
      }
      setCompanyNames(names);
    };

    fetchCompanyNames();
  }, [stockSymbols]);

  // 日数差を計算
  const calculateDaysUntil = (dateStr: string): number => {
    if (!dateStr) return Infinity;
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 権利確定日から完全な日付を計算
  const calculateRightsDate = (settings: DividendRightsSettings | ShareholderRightsSettings): string => {
    if (!settings.isActive || !settings.month || !settings.day) return '';

    const currentYear = new Date().getFullYear();
    let targetDate = new Date(currentYear, settings.month - 1, settings.day);

    if (settings.isRecurring && targetDate < new Date()) {
      targetDate = new Date(currentYear + 1, settings.month - 1, settings.day);
    }

    return targetDate.toISOString().split('T')[0];
  };

  // データ処理
  const processedData = useMemo<DividendBenefitData[]>(() => {
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

        // デバッグログ
        if (symbol === '5527') {
          console.log(`🔢 ${symbol} 配当計算:`, {
            dividendPerShare,
            frequency,
            totalShares,
            averagePrice,
            hasDividend,
            hasPosition
          });
        }

        dividendCalc = calculateDividendInfo(dividendPerShare, frequency, totalShares, averagePrice);

        // 結果をログ
        if (symbol === '5527') {
          console.log(`💰 ${symbol} 配当結果:`, dividendCalc);
        }
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

        // デバッグログ
        if (symbol === '5527') {
          console.log(`🎁 ${symbol} 優待計算:`, {
            minimumShares,
            currentShares,
            estimatedValue,
            totalInvestment,
            hasBenefit,
            hasPosition
          });
        }

        benefitCalc = calculateShareholderBenefit(minimumShares, currentShares, estimatedValue, totalInvestment);

        // 結果をログ
        if (symbol === '5527') {
          console.log(`🎁 ${symbol} 優待結果:`, benefitCalc);
        }
      }

      // タイプ判定
      let type: 'dividend' | 'benefit' | 'both' | 'none' = 'none';
      if (hasDividend && hasBenefit) type = 'both';
      else if (hasDividend) type = 'dividend';
      else if (hasBenefit) type = 'benefit';

      // デバッグログ（開発時のみ）
      // console.log(`📋 ${symbol} データ確認:`, {
      //   symbol,
      //   name: data.name,
      //   companyName: companyNames[symbol] || data.name,
      //   companyNamesState: companyNames
      // });

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
    }).filter(Boolean) as DividendBenefitData[];
  }, [stockSymbols, stockData, companyNames]);

  // フィルター処理
  const filteredData = useMemo(() => {
    let filtered = processedData;

    // タイプフィルター
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // 検索フィルター
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
  const summary = useMemo(() => {
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

  // 日数表示
  const getDaysUntilDisplay = (daysUntil: number) => {
    if (daysUntil === Infinity) return '-';
    if (daysUntil === 0) return '今日';
    if (daysUntil === 1) return '明日';
    if (daysUntil < 0) return `${Math.abs(daysUntil)}日前`;
    return `${daysUntil}日後`;
  };

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">💰 配当・優待一覧</h1>

        {/* 検索とフィルター */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* 検索 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="銘柄コード・会社名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* フィルター */}
          <div className="flex gap-2">
            {[
              { key: 'all' as FilterType, label: '全て' },
              { key: 'dividend' as FilterType, label: '配当のみ' },
              { key: 'benefit' as FilterType, label: '優待のみ' },
              { key: 'both' as FilterType, label: '両方' },
              { key: 'none' as FilterType, label: '未設定' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`cursor-pointer px-3 py-1 text-xs rounded-md transition-colors ${
                  filterType === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* サマリー統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">総銘柄数</div>
            <div className="text-2xl font-bold text-white">{summary.totalStocks}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">年間配当金額</div>
            <div className="text-xl font-bold text-green-400">
              ¥{formatDividendAmount(summary.totalAnnualDividend)}
            </div>
            <div className="text-xs text-gray-500">
              税引後: ¥{formatDividendAmount(summary.totalAfterTaxDividend)}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">優待推定価値</div>
            <div className="text-xl font-bold text-purple-400">
              ¥{formatBenefitValue(summary.totalBenefitValue)}
            </div>
            <div className="text-xs text-gray-500">
              取得可能: {summary.eligibleBenefits}銘柄
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">平均配当利回り</div>
            <div className="text-xl font-bold text-blue-400">
              {formatDividendYield(summary.avgDividendYield)}%
            </div>
            <div className="text-xs text-gray-500">
              配当設定: {summary.dividendStocks}銘柄
            </div>
          </div>
        </div>

        {/* ソートボタン */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-400 self-center mr-2">並び替え:</span>
          {[
            { key: 'symbol' as SortKey, label: '銘柄' },
            { key: 'dividendYield' as SortKey, label: '配当利回り' },
            { key: 'annualDividend' as SortKey, label: '配当金額' },
            { key: 'benefitYield' as SortKey, label: '優待利回り' },
            { key: 'benefitValue' as SortKey, label: '優待価値' },
            { key: 'dividendRightsDate' as SortKey, label: '配当権利日' },
            { key: 'shareholderRightsDate' as SortKey, label: '優待権利日' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`cursor-pointer px-3 py-1 text-xs rounded-md transition-colors ${
                sortBy === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label} {sortBy === key && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          ))}
        </div>

        {/* メインテーブル */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">銘柄</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">配当情報</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">優待情報</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">権利確定日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedData.map((item, index) => (
                <tr key={`${item.symbol}-${index}`} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div>
                      <div
                        className="font-medium text-white hover:text-blue-300 cursor-pointer transition-colors"
                        onClick={() => onStockClick?.(item.symbol)}
                        title="銘柄カードの配当・優待タブを開く"
                      >
                        {item.companyName}
                      </div>
                      <div className="text-xs text-gray-400">{item.symbol}</div>
                      {!item.hasPosition && (
                        <div className="text-xs text-red-400">ポジションなし</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(item.type === 'dividend' || item.type === 'both') ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">💰</span>
                          <span className="text-sm font-medium text-green-400">
                            ¥{formatDividendAmount(item.annualDividend || 0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          利回り: {formatDividendYield(item.dividendYield || 0)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          税引後: ¥{formatDividendAmount(item.afterTaxDividend || 0)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">配当未設定</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(item.type === 'benefit' || item.type === 'both') ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">🎁</span>
                          <span className={`text-sm font-medium ${item.isEligible ? 'text-purple-400' : 'text-gray-400'}`}>
                            ¥{formatBenefitValue(item.benefitValue || 0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          利回り: {formatBenefitYield(item.benefitYield || 0)}%
                        </div>
                        {!item.isEligible && item.shortfall && item.shortfall > 0 && (
                          <div className="text-xs text-red-400">
                            不足: {item.shortfall}株
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">優待未設定</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="space-y-1">
                      {item.dividendRightsDate && (
                        <div className="text-xs">
                          <div className="text-green-300">配当: {formatDate(item.dividendRightsDate)}</div>
                          <div className="text-gray-500">
                            {getDaysUntilDisplay(calculateDaysUntil(item.dividendRightsDate))}
                          </div>
                        </div>
                      )}
                      {item.shareholderRightsDate && (
                        <div className="text-xs">
                          <div className="text-purple-300">優待: {formatDate(item.shareholderRightsDate)}</div>
                          <div className="text-gray-500">
                            {getDaysUntilDisplay(calculateDaysUntil(item.shareholderRightsDate))}
                          </div>
                        </div>
                      )}
                      {!item.dividendRightsDate && !item.shareholderRightsDate && (
                        <div className="text-xs text-gray-500">-</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">該当する銘柄がありません</div>
            <div className="text-sm text-gray-500">
              フィルターや検索条件を変更してください
            </div>
          </div>
        )}
      </div>
    </div>
  );
}