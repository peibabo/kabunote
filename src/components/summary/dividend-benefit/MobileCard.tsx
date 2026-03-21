'use client';

import React from 'react';
import { formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';
import { formatBenefitValue, formatBenefitYield } from '@/lib/shareholderCalc';
import { formatMonthDay } from '@/lib/dateFormat';
import {
  calculateDaysUntil,
  getDaysUntilDisplay,
  type DividendBenefitItem,
} from '@/hooks/dividend/useDividendBenefitList';

interface MobileCardProps {
  item: DividendBenefitItem;
  onStockClick?: (symbol: string) => void;
}

export default function MobileCard({ item, onStockClick }: MobileCardProps) {
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
              <span className="text-sm">{'\u{1F4B0}'}</span>
              <span className="text-sm font-medium text-green-400 whitespace-nowrap">
                {'\u00A5'}{formatDividendAmount(item.annualDividend || 0)}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                利回り {formatDividendYield(item.dividendYield || 0)}%
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                税引後 {'\u00A5'}{formatDividendAmount(item.afterTaxDividend || 0)}
              </span>
            </div>
          ) : (
            <div className="text-xs text-gray-500">{'\u{1F4B0}'} 配当未設定</div>
          )}
        </div>
      </div>

      {/* 優待情報 */}
      <div className="flex items-start gap-4 mb-2">
        <div className="flex-1 min-w-0">
          {(item.type === 'benefit' || item.type === 'both') ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm">{'\u{1F381}'}</span>
              <span className={`text-sm font-medium whitespace-nowrap ${item.isEligible ? 'text-purple-400' : 'text-gray-400'}`}>
                {'\u00A5'}{formatBenefitValue(item.benefitValue || 0)}
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
            <div className="text-xs text-gray-500">{'\u{1F381}'} 優待未設定</div>
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
