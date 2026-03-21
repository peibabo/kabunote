'use client';

import React from 'react';
import { PositionSummary, ProfitLossInfo } from '@/types/positions';
import { formatPrice, formatShares, formatProfitLoss } from '@/lib/positionCalc';
import { ProgressData } from './analysisCalc';
import ProfitLossSimulation from './ProfitLossSimulation';

interface PriceProgressBarProps {
  progressData: ProgressData;
  positionSummary: PositionSummary;
  profitLossInfo: ProfitLossInfo | null;
  riskRewardRatio: number | null;
  targetPrice: string;
  stopLoss: string;
  currentPrice: string;
}

export default function PriceProgressBar({
  progressData,
  positionSummary,
  profitLossInfo,
  riskRewardRatio,
  targetPrice,
  stopLoss,
  currentPrice,
}: PriceProgressBarProps) {
  return (
    <div className="mt-2 p-2 md:mt-4 md:p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <h5 className="text-xs md:text-sm font-medium text-gray-200 whitespace-nowrap">{'\u26A1'} 株価ポジション・損益分析</h5>
        <span className="text-xs text-gray-400">
          {progressData.isOverTarget
            ? '\u{1F3AF} 利確目標達成!'
            : progressData.isUnderStop
              ? '\u26A0\uFE0F 損切ライン下'
              : `利確目標まで${progressData.remainingToTarget.toFixed(1)}%`
          }
        </span>
      </div>
      {positionSummary.averagePrice > 0 && (
        <div className="text-xs text-gray-400 text-center mb-1">
          平均取得価額: {formatPrice(positionSummary.averagePrice)}円 ({formatShares(positionSummary.totalShares)}株)
        </div>
      )}

      {/* ネオンライトプログレスバー */}
      <div className="relative">
        <div className="w-full h-6 relative">
          <div className="w-full h-full bg-gradient-to-r from-red-900 via-gray-800 to-green-900 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-green-500/20 rounded-full"></div>
          </div>

          {/* 中央の取得単価ライン */}
          {positionSummary.averagePrice > 0 && (
            (() => {
              const stopPrice = parseFloat(stopLoss);
              const targetPriceNum = parseFloat(targetPrice);
              const avgPrice = positionSummary.averagePrice;
              const range = targetPriceNum - stopPrice;
              const avgPosition = range > 0 ? ((avgPrice - stopPrice) / range) * 100 : 50;
              const avgPosClamp = Math.max(5, Math.min(95, avgPosition));

              return (
                <div
                  className="absolute top-0 w-0.5 h-full bg-white transform -translate-x-0.5 group/avg cursor-pointer"
                  style={{ left: `${avgPosClamp}%` }}
                >
                  <div
                    className="absolute -top-1 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 animate-pulse"
                    style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)' }}
                  ></div>
                  <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 hidden group-hover/avg:block bg-gray-800 border border-gray-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    平均取得価額: {formatPrice(avgPrice)}円
                  </div>
                </div>
              );
            })()
          )}

          {/* 現在株価の位置インジケーター */}
          <div
            className="absolute top-0 h-full w-1 transform -translate-x-0.5 transition-all duration-1000 group/current cursor-pointer"
            style={{
              left: `${Math.min(95, Math.max(1, progressData.percentage))}%`,
              background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)'
            }}
          >
            <div
              className="absolute -top-1 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 animate-pulse"
              style={{
                background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 1), 0 0 30px rgba(59, 130, 246, 0.6)'
              }}
            ></div>
            <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 hidden group-hover/current:block bg-gray-800 border border-blue-600 text-blue-300 text-xs rounded px-2 py-1 whitespace-nowrap z-10">
              現在株価: {formatPrice(parseFloat(currentPrice))}円
            </div>
          </div>
        </div>

        {/* ステータス + 損益統合行 */}
        {positionSummary.averagePrice > 0 ? (() => {
          const current = parseFloat(currentPrice);
          const statusColor = progressData.isOverTarget ? 'text-green-400' : progressData.percentage < 30 ? 'text-red-400' : progressData.percentage < 70 ? 'text-yellow-400' : 'text-green-400';
          const statusText = progressData.isOverTarget ? '\u{1F3AF} 目標達成' : progressData.isUnderStop ? '\u{1F4A5} 損切ライン超過' : progressData.percentage < 30 ? '\u26A0\uFE0F 危険ゾーン' : progressData.percentage < 70 ? '\u{1F4CA} 中間ゾーン' : '\u{1F680} 好調ゾーン';

          if (!current) {
            return <div className={`text-xs text-center mt-1 ${statusColor}`}>{statusText}</div>;
          }

          const currentValue = positionSummary.totalShares * current;
          const currentProfitLoss = currentValue - positionSummary.totalCost;
          const diff = current - positionSummary.averagePrice;
          const diffPercent = positionSummary.averagePrice !== 0 ? (diff / positionSummary.averagePrice) * 100 : 0;
          const plColor = currentProfitLoss >= 0 ? 'text-green-400' : 'text-red-400';

          return (
            <div className="text-center mt-1">
              <div className={`text-xs ${statusColor}`}>{statusText}</div>
              <div className="mt-0.5">
                <span className={`text-sm md:text-base font-bold ${plColor}`}>
                  {formatProfitLoss(currentProfitLoss)}円
                </span>
                <span className={`text-xs ${diff >= 0 ? 'text-green-200' : 'text-red-300'} ml-1`}>
                  ({diff >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })() : (
          <div className={`text-xs text-center mt-1 ${
            progressData.isOverTarget ? 'text-green-400' : progressData.percentage < 30 ? 'text-red-400' : progressData.percentage < 70 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {progressData.isOverTarget ? '\u{1F3AF} 目標達成' : progressData.isUnderStop ? '\u{1F4A5} 損切ライン超過' : progressData.percentage < 30 ? '\u26A0\uFE0F 危険ゾーン' : progressData.percentage < 70 ? '\u{1F4CA} 中間ゾーン' : '\u{1F680} 好調ゾーン'}
          </div>
        )}
      </div>

      {/* 損益シミュレーション */}
      {profitLossInfo && (
        <ProfitLossSimulation
          profitLossInfo={profitLossInfo}
          positionSummary={positionSummary}
          riskRewardRatio={riskRewardRatio}
          stopLoss={stopLoss}
          targetPrice={targetPrice}
        />
      )}
    </div>
  );
}
