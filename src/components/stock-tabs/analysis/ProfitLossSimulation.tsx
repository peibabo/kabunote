'use client';

import React from 'react';
import { PositionSummary, ProfitLossInfo } from '@/types/positions';
import { formatProfitLoss } from '@/lib/positionCalc';

interface ProfitLossSimulationProps {
  profitLossInfo: ProfitLossInfo;
  positionSummary: PositionSummary;
  riskRewardRatio: number | null;
  stopLoss: string;
  targetPrice: string;
}

export default function ProfitLossSimulation({
  profitLossInfo,
  positionSummary,
  riskRewardRatio,
  stopLoss,
  targetPrice,
}: ProfitLossSimulationProps) {
  if (positionSummary.totalShares <= 0) return null;

  const stopLossNum = parseFloat(stopLoss);
  const targetPriceNum = parseFloat(targetPrice);
  const hasStopLoss = !!stopLossNum;
  const hasTarget = !!targetPriceNum;

  return (
    <div className="mt-2 pt-2 md:mt-3 md:pt-3 border-t border-gray-700">
      <div className="grid grid-cols-2 gap-2 text-xs text-center">
        <div>
          <div className="text-gray-400 mb-0.5">損切時</div>
          {hasStopLoss ? (
            <div className={profitLossInfo.stopLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
              <span className="font-bold">{!isNaN(profitLossInfo.stopLoss) ? formatProfitLoss(profitLossInfo.stopLoss) : '---'}円</span>
              {!isNaN(profitLossInfo.stopLossPercent) && <span className="ml-0.5">({profitLossInfo.stopLossPercent >= 0 ? '+' : ''}{profitLossInfo.stopLossPercent.toFixed(1)}%)</span>}
            </div>
          ) : (
            <div className="text-red-400">{'\u{1F4A1}'} 未設定</div>
          )}
        </div>
        <div>
          <div className="text-gray-400 mb-0.5">利確時</div>
          {hasTarget ? (
            <div className={profitLossInfo.targetProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
              <span className="font-bold">{!isNaN(profitLossInfo.targetProfit) ? formatProfitLoss(profitLossInfo.targetProfit) : '---'}円</span>
              {!isNaN(profitLossInfo.targetProfitPercent) && <span className="ml-0.5">({profitLossInfo.targetProfitPercent >= 0 ? '+' : ''}{profitLossInfo.targetProfitPercent.toFixed(1)}%)</span>}
            </div>
          ) : (
            <div className="text-green-400">{'\u{1F4A1}'} 未設定</div>
          )}
        </div>
      </div>
      {/* リスクリワード比 */}
      {riskRewardRatio !== null && (
        <div className="text-center mt-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">リスクリワード比</span>
            <div className={`text-lg font-bold ${
              riskRewardRatio >= 2
                ? 'text-green-400'
                : riskRewardRatio >= 1.5
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}>
              {riskRewardRatio.toFixed(2)}
            </div>
            <div className={`text-xs font-medium ${
              riskRewardRatio >= 2
                ? 'text-green-300'
                : riskRewardRatio >= 1.5
                ? 'text-yellow-300'
                : 'text-red-300'
            }`}>
              {riskRewardRatio >= 2
                ? '\u{1F7E2} 優秀'
                : riskRewardRatio >= 1.5
                ? '\u{1F7E1} 適正'
                : '\u{1F534} リスク高'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
