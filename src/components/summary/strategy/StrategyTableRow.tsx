'use client';

import React from 'react';
import { formatPrice } from '@/lib/positionCalc';
import { StrategyRowData, getAlertDisplay } from './types';

interface StrategyTableRowProps {
  row: StrategyRowData;
}

export default function StrategyTableRow({ row }: StrategyTableRowProps) {
  const alertDisplay = getAlertDisplay(row.alertType);
  return (
    <tr className="hover:bg-gray-750">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-white">{row.symbol}</div>
          <div className="text-xs text-gray-400 truncate max-w-[150px]">{row.companyName}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs ${
          row.plan.actionType === 'buy' ? 'bg-green-900/30 text-green-400' :
          row.plan.actionType === 'sell' ? 'bg-red-900/30 text-red-400' :
          'bg-yellow-900/30 text-yellow-400'
        }`}>
          {row.plan.actionType === 'buy' ? '\u{1F4C8} \u8CB7\u3044' :
           row.plan.actionType === 'sell' ? '\u{1F4C9} \u58F2\u308A' : '\u{1F504} \u69D8\u5B50\u898B'}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-white">
        {(row.plan.targetPrice ?? 0) > 0 ? `${formatPrice(row.plan.targetPrice!)}円` : '-'}
      </td>
      <td className="px-4 py-3 text-center text-white">
        {row.currentPrice > 0 ? `${formatPrice(row.currentPrice)}円` : (
          <span className="text-gray-500 text-xs">\u672A\u8A2D\u5B9A</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-white">
        {(row.plan.targetQuantity ?? 0) > 0 ? `${Math.floor(row.plan.targetQuantity! / 100)}\u5358\u4F4D` : '-'}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs ${
          row.plan.priority === 'high' ? 'bg-red-900/30 text-red-400' :
          row.plan.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
          'bg-green-900/30 text-green-400'
        }`}>
          {row.plan.priority === 'high' ? '\u{1F534} \u9AD8' :
           row.plan.priority === 'medium' ? '\u{1F7E1} \u4E2D' : '\u{1F7E2} \u4F4E'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`flex items-center justify-center gap-1 ${alertDisplay.color}`}>
          <span>{alertDisplay.icon}</span>
          <span className="text-xs">{alertDisplay.text}</span>
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {row.analysis && row.plan.actionType === 'buy' ? (
          <div>
            <div className="text-white text-sm">
              {formatPrice(row.analysis.requiredInvestment)}円
            </div>
            {!row.analysis.canExecute && (
              <div className="text-xs text-red-400">\u8CC7\u91D1\u4E0D\u8DB3</div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}
