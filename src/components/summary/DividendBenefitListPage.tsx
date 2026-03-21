'use client';

import React from 'react';
import { DividendInfo } from '@/types/dividend';
import { ShareholderBenefitInfo } from '@/types/shareholder';
import { DividendRightsSettings, ShareholderRightsSettings } from '@/types/rightsDate';
import {
  useDividendBenefitList,
  type SortKey,
  type FilterType,
} from '@/hooks/dividend/useDividendBenefitList';
import SummaryHeader from './dividend-benefit/SummaryHeader';
import DesktopTableRow from './dividend-benefit/DesktopTableRow';
import MobileCard from './dividend-benefit/MobileCard';

interface IntegratedPosition {
  totalShares: number;
  averagePrice: number;
  weightedTaxRate: number;
  purchaseDate: string;
  notes: string;
}

interface DividendBenefitListPageProps {
  stockSymbols: string[];
  stockData: {
    [symbol: string]: {
      name: string;
      dividendInfo?: DividendInfo;
      shareholderBenefitInfo?: ShareholderBenefitInfo;
      dividendRightsSettings: DividendRightsSettings;
      shareholderRightsSettings: ShareholderRightsSettings;
      position?: IntegratedPosition;
    }
  };
  onStockClick?: (symbol: string) => void;
}

export default function DividendBenefitListPage({ stockSymbols, stockData, onStockClick }: DividendBenefitListPageProps) {
  const {
    sortBy, sortOrder, filterType, setFilterType,
    searchQuery, setSearchQuery,
    sortedData, summary, handleSort,
  } = useDividendBenefitList(stockSymbols, stockData);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 検索とフィルター */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="銘柄コード・会社名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            {([
              { key: 'all' as FilterType, label: '全て' },
              { key: 'dividend' as FilterType, label: '配当のみ' },
              { key: 'benefit' as FilterType, label: '優待のみ' },
              { key: 'both' as FilterType, label: '両方' },
              { key: 'none' as FilterType, label: '未設定' }
            ]).map(({ key, label }) => (
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
        <SummaryHeader summary={summary} />

        {/* ソートボタン */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-400 self-center mr-2">並び替え:</span>
          {([
            { key: 'symbol' as SortKey, label: '銘柄' },
            { key: 'dividendYield' as SortKey, label: '配当利回り' },
            { key: 'annualDividend' as SortKey, label: '配当金額' },
            { key: 'benefitYield' as SortKey, label: '優待利回り' },
            { key: 'benefitValue' as SortKey, label: '優待価値' },
            { key: 'dividendRightsDate' as SortKey, label: '配当権利日' },
            { key: 'shareholderRightsDate' as SortKey, label: '優待権利日' }
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`cursor-pointer px-3 py-1 text-xs rounded-md transition-colors ${
                sortBy === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label} {sortBy === key && (sortOrder === 'desc' ? '\u2193' : '\u2191')}
            </button>
          ))}
        </div>

        {/* デスクトップ用テーブル */}
        <div className="hidden md:block bg-gray-800 rounded-lg overflow-x-auto">
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
                <DesktopTableRow key={`${item.symbol}-${index}`} item={item} onStockClick={onStockClick} />
              ))}
            </tbody>
          </table>
        </div>

        {/* モバイル用カードレイアウト */}
        <div className="md:hidden space-y-3">
          {sortedData.map((item, index) => (
            <MobileCard key={`mobile-${item.symbol}-${index}`} item={item} onStockClick={onStockClick} />
          ))}
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
