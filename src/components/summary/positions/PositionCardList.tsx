'use client';

import React from 'react';
import { formatShares, formatPrice } from '@/lib/positionCalc';
import type { PositionRowData } from './types';

interface PositionCardListProps {
  sortedData: PositionRowData[];
  getProfitLossColor: (value: number) => string;
}

export default function PositionCardList({ sortedData, getProfitLossColor }: PositionCardListProps) {
  return (
    <div className="md:hidden space-y-3">
      {sortedData.map((row) => (
        <div key={row.symbol} className="bg-gray-800 rounded-lg p-3">
          {/* 1行目: 銘柄コード + 会社名 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-white text-sm">{row.symbol}</span>
            <span className="text-xs text-gray-400 truncate">{row.companyName}</span>
          </div>
          {/* 2行目: 保有株数 + 平均取得価額 */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-1.5">
            <div>
              <span className="text-gray-400">保有: </span>
              <span className="text-white">{formatShares(row.totalShares)}株</span>
            </div>
            <div>
              <span className="text-gray-400">平均: </span>
              <span className="text-white">{formatPrice(row.averagePrice)}円</span>
            </div>
          </div>
          {/* 3行目: 投資額 + 評価額 */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-1.5">
            <div>
              <span className="text-gray-400">投資額: </span>
              <span className="text-white">{formatPrice(row.totalCost)}円</span>
            </div>
            <div>
              <span className="text-gray-400">評価額: </span>
              <span className="text-white">{row.currentValue > 0 ? `${formatPrice(row.currentValue)}円` : '算出不可'}</span>
            </div>
          </div>
          {/* 4行目: 損益額 + 損益率 */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-1.5">
            <div>
              <span className="text-gray-400">損益: </span>
              {row.currentPrice > 0 ? (
                <span className={`font-medium ${getProfitLossColor(row.profitLoss)}`}>
                  {row.profitLoss >= 0 ? '+' : ''}{formatPrice(row.profitLoss)}円
                </span>
              ) : (
                <span className="text-gray-500">算出不可</span>
              )}
              {row.profitLoss > 0 && (
                <div className="text-blue-300 mt-0.5">税引後 +{formatPrice(row.profitLossAfterTax)}円</div>
              )}
            </div>
            <div>
              <span className="text-gray-400">損益率: </span>
              {row.currentPrice > 0 ? (
                <span className={`font-medium ${getProfitLossColor(row.profitLoss)}`}>
                  {row.profitLossRate >= 0 ? '+' : ''}{row.profitLossRate.toFixed(2)}%
                </span>
              ) : (
                <span className="text-gray-500">算出不可</span>
              )}
            </div>
          </div>
          {/* 5行目: 構成比プログレスバー */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">構成比:</span>
            <span className="text-white">{row.portfolioWeight.toFixed(1)}%</span>
            <div className="flex-1 bg-gray-600 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(row.portfolioWeight, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
