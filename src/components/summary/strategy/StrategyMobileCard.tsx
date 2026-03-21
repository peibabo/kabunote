'use client';

import React from 'react';
import { formatPrice } from '@/lib/positionCalc';
import { StrategyRowData, getAlertDisplay } from './types';

interface StrategyMobileCardProps {
  row: StrategyRowData;
}

export default function StrategyMobileCard({ row }: StrategyMobileCardProps) {
  const alertDisplay = getAlertDisplay(row.alertType);
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      {/* 1行目: 銘柄 + アクション + 優先度 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-white text-sm">{row.symbol}</span>
          <span className="text-xs text-gray-400 truncate">{row.companyName}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            row.plan.actionType === 'buy' ? 'bg-green-900/30 text-green-400' :
            row.plan.actionType === 'sell' ? 'bg-red-900/30 text-red-400' :
            'bg-yellow-900/30 text-yellow-400'
          }`}>
            {row.plan.actionType === 'buy' ? '\u{1F4C8} \u8CB7\u3044' :
             row.plan.actionType === 'sell' ? '\u{1F4C9} \u58F2\u308A' : '\u{1F504} \u69D8\u5B50\u898B'}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            row.plan.priority === 'high' ? 'bg-red-900/30 text-red-400' :
            row.plan.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
            'bg-green-900/30 text-green-400'
          }`}>
            {row.plan.priority === 'high' ? '\u{1F534}\u9AD8' :
             row.plan.priority === 'medium' ? '\u{1F7E1}\u4E2D' : '\u{1F7E2}\u4F4E'}
          </span>
        </div>
      </div>
      {/* 2行目: 目標価格・現在株価 */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-1.5">
        <div>
          <span className="text-gray-400">\u76EE\u6A19: </span>
          <span className="text-white">{(row.plan.targetPrice ?? 0) > 0 ? `${formatPrice(row.plan.targetPrice!)}円` : '-'}</span>
        </div>
        <div>
          <span className="text-gray-400">\u73FE\u5728: </span>
          <span className="text-white">{row.currentPrice > 0 ? `${formatPrice(row.currentPrice)}円` : '\u672A\u8A2D\u5B9A'}</span>
        </div>
      </div>
      {/* 3行目: 株数・必要資金 */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-1.5">
        <div>
          <span className="text-gray-400">\u682A\u6570: </span>
          <span className="text-white">{(row.plan.targetQuantity ?? 0) > 0 ? `${Math.floor(row.plan.targetQuantity! / 100)}\u5358\u4F4D` : '-'}</span>
        </div>
        {row.plan.actionType === 'buy' && row.analysis && (
          <div>
            <span className="text-gray-400">\u5FC5\u8981: </span>
            <span className="text-white">{formatPrice(row.analysis.requiredInvestment)}円</span>
            {!row.analysis.canExecute && <span className="text-red-400 ml-1">\u26A0</span>}
          </div>
        )}
      </div>
      {/* 4行目: ステータス */}
      {row.alertType !== 'none' && (
        <div className={`flex items-center gap-1 text-xs ${alertDisplay.color}`}>
          <span>{alertDisplay.icon}</span>
          <span>{alertDisplay.text}</span>
        </div>
      )}
    </div>
  );
}
