'use client';

import React from 'react';
import { formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';
import { formatBenefitValue, formatBenefitYield } from '@/lib/shareholderCalc';
import { type DividendBenefitItem } from '@/hooks/dividend/useDividendBenefitList';
import RightsDateDisplay from './RightsDateDisplay';

interface DesktopTableRowProps {
  item: DividendBenefitItem;
  onStockClick?: (symbol: string) => void;
}

export default function DesktopTableRow({ item, onStockClick }: DesktopTableRowProps) {
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
              <span className="text-lg">{'\u{1F4B0}'}</span>
              <span className="text-sm font-medium text-green-400">
                {'\u00A5'}{formatDividendAmount(item.annualDividend || 0)}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              利回り: {formatDividendYield(item.dividendYield || 0)}%
            </div>
            <div className="text-xs text-gray-500">
              税引後: {'\u00A5'}{formatDividendAmount(item.afterTaxDividend || 0)}
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
              <span className="text-lg">{'\u{1F381}'}</span>
              <span className={`text-sm font-medium ${item.isEligible ? 'text-purple-400' : 'text-gray-400'}`}>
                {'\u00A5'}{formatBenefitValue(item.benefitValue || 0)}
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
