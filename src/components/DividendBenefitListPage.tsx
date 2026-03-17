'use client';

import React from 'react';
import { DividendInfo } from '@/types/dividend';
import { formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';
import { ShareholderBenefitInfo } from '@/types/shareholder';
import { formatBenefitValue, formatBenefitYield } from '@/lib/shareholderCalc';
import { DividendRightsSettings, ShareholderRightsSettings } from '@/types/rightsDate';
import { formatMonthDay } from '@/lib/dateFormat';
import {
  useDividendBenefitList,
  calculateDaysUntil,
  getDaysUntilDisplay,
  type DividendBenefitItem,
  type SortKey,
  type FilterType,
} from '@/hooks/dividend/useDividendBenefitList';

interface IntegratedPosition {
  totalShares: number;
  averagePrice: number;
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
              {label} {sortBy === key && (sortOrder === 'desc' ? '↓' : '↑')}
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

// デスクトップテーブル行コンポーネント
function DesktopTableRow({ item, onStockClick }: { item: DividendBenefitItem; onStockClick?: (symbol: string) => void }) {
  return (
    <tr className="hover:bg-gray-750">
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
        <RightsDateDisplay item={item} />
      </td>
    </tr>
  );
}

// モバイルカードコンポーネント
function MobileCard({ item, onStockClick }: { item: DividendBenefitItem; onStockClick?: (symbol: string) => void }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div
        className="flex items-center justify-between mb-3 cursor-pointer"
        onClick={() => onStockClick?.(item.symbol)}
      >
        <div>
          <div className="font-medium text-white hover:text-blue-300 transition-colors">
            {item.companyName}
          </div>
          <div className="text-xs text-gray-400">{item.symbol}</div>
        </div>
        {!item.hasPosition && (
          <span className="text-xs text-red-400 bg-red-900/30 px-2 py-0.5 rounded">ポジションなし</span>
        )}
      </div>

      {/* 配当情報 */}
      <div className="flex items-start gap-4 mb-2">
        <div className="flex-1 min-w-0">
          {(item.type === 'dividend' || item.type === 'both') ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm">💰</span>
              <span className="text-sm font-medium text-green-400 whitespace-nowrap">
                ¥{formatDividendAmount(item.annualDividend || 0)}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                利回り {formatDividendYield(item.dividendYield || 0)}%
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                税引後 ¥{formatDividendAmount(item.afterTaxDividend || 0)}
              </span>
            </div>
          ) : (
            <div className="text-xs text-gray-500">💰 配当未設定</div>
          )}
        </div>
      </div>

      {/* 優待情報 */}
      <div className="flex items-start gap-4 mb-2">
        <div className="flex-1 min-w-0">
          {(item.type === 'benefit' || item.type === 'both') ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm">🎁</span>
              <span className={`text-sm font-medium whitespace-nowrap ${item.isEligible ? 'text-purple-400' : 'text-gray-400'}`}>
                ¥{formatBenefitValue(item.benefitValue || 0)}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                利回り {formatBenefitYield(item.benefitYield || 0)}%
              </span>
              {!item.isEligible && item.shortfall && item.shortfall > 0 && (
                <span className="text-xs text-red-400 whitespace-nowrap">
                  不足 {item.shortfall}株
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500">🎁 優待未設定</div>
          )}
        </div>
      </div>

      {/* 権利確定日 */}
      {(item.dividendRightsDate || item.shareholderRightsDate) && (
        <div className="space-y-1 text-xs border-t border-gray-700 pt-2 mt-2">
          {item.dividendRightsDate && (
            <div className="flex items-center gap-1">
              <span className="text-green-300">配当権利日</span>
              <span className="text-white">{formatMonthDay(item.dividendRightsDate)}</span>
              <span className="text-gray-500">({getDaysUntilDisplay(calculateDaysUntil(item.dividendRightsDate))})</span>
            </div>
          )}
          {item.shareholderRightsDate && (
            <div className="flex items-center gap-1">
              <span className="text-purple-300">優待権利日</span>
              <span className="text-white">{formatMonthDay(item.shareholderRightsDate)}</span>
              <span className="text-gray-500">({getDaysUntilDisplay(calculateDaysUntil(item.shareholderRightsDate))})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 権利確定日表示コンポーネント
function RightsDateDisplay({ item }: { item: DividendBenefitItem }) {
  return (
    <div className="space-y-1">
      {item.dividendRightsDate && (
        <div className="text-xs">
          <div className="text-green-300">配当: {formatMonthDay(item.dividendRightsDate)}</div>
          <div className="text-gray-500">
            {getDaysUntilDisplay(calculateDaysUntil(item.dividendRightsDate))}
          </div>
        </div>
      )}
      {item.shareholderRightsDate && (
        <div className="text-xs">
          <div className="text-purple-300">優待: {formatMonthDay(item.shareholderRightsDate)}</div>
          <div className="text-gray-500">
            {getDaysUntilDisplay(calculateDaysUntil(item.shareholderRightsDate))}
          </div>
        </div>
      )}
      {!item.dividendRightsDate && !item.shareholderRightsDate && (
        <div className="text-xs text-gray-500">-</div>
      )}
    </div>
  );
}
