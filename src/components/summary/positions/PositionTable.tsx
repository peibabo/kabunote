'use client';

import React from 'react';
import { formatShares, formatPrice } from '@/lib/positionCalc';
import type { PositionRowData } from './types';

interface PositionTableProps {
  sortedData: PositionRowData[];
  getProfitLossColor: (value: number) => string;
}

export default function PositionTable({ sortedData, getProfitLossColor }: PositionTableProps) {
  return (
    <div className="hidden md:block bg-gray-800 rounded-lg overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">銘柄</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">保有株数</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">平均取得価額</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">総投資額</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">現在株価</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">現在評価額</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">損益額</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">損益率</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">構成比</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedData.map((row) => (
            <tr key={row.symbol} className="hover:bg-gray-750">
              <td className="px-4 py-3">
                <div>
                  <div className="font-medium text-white">{row.symbol}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[150px]">{row.companyName}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-center text-white">
                {formatShares(row.totalShares)}株
              </td>
              <td className="px-4 py-3 text-center text-white">
                {formatPrice(row.averagePrice)}円
              </td>
              <td className="px-4 py-3 text-center text-white">
                {formatPrice(row.totalCost)}円
              </td>
              <td className="px-4 py-3 text-center text-white">
                {row.currentPrice > 0 ? `${formatPrice(row.currentPrice)}円` : (
                  <span className="text-gray-500 text-xs">未設定</span>
                )}
              </td>
              <td className="px-4 py-3 text-center text-white">
                {row.currentValue > 0 ? `${formatPrice(row.currentValue)}円` : (
                  <span className="text-gray-500 text-xs">算出不可</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {row.currentPrice > 0 ? (
                  <div>
                    <div className={`font-medium ${getProfitLossColor(row.profitLoss)}`}>
                      {row.profitLoss >= 0 ? '+' : ''}
                      {formatPrice(row.profitLoss)}円
                    </div>
                    {row.profitLoss > 0 && (
                      <div className="text-xs text-blue-300">
                        税引後 +{formatPrice(row.profitLossAfterTax)}円
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">算出不可</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {row.currentPrice > 0 ? (
                  <div className={`font-medium ${getProfitLossColor(row.profitLoss)}`}>
                    {row.profitLossRate >= 0 ? '+' : ''}
                    {row.profitLossRate.toFixed(2)}%
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">算出不可</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="text-white text-sm">
                  {row.portfolioWeight.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(row.portfolioWeight, 100)}%` }}
                  ></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
