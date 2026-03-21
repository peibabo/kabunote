'use client';

import React from 'react';
import { NextActionPlanAnalysis, ActionType } from '@/types/nextActionPlan';
import { formatPrice, formatProfitLoss } from '@/lib/positionCalc';
import NeonAlertDisplay from './NeonAlertDisplay';

interface AnalysisInfoDisplayProps {
  analysis: NextActionPlanAnalysis | null;
  currentPrice: number;
  actionType: ActionType;
  targetPrice: number | null;
  targetQuantity: number | null;
}

export default function AnalysisInfoDisplay({
  analysis,
  currentPrice,
  actionType,
  targetPrice,
  targetQuantity,
}: AnalysisInfoDisplayProps) {
  if (currentPrice === 0 || !analysis) {
    return (
      <div className="text-center py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-blue-500 border-dashed rounded-full flex items-center justify-center">
            <span className="text-blue-400 text-xl">{'\u{1F4C8}'}</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-300 font-medium">分析を開始するために</p>
            <p className="text-xs text-gray-400">現在の株価を上記の「投資規律設定」で入力してください</p>
          </div>
          <div className="px-3 py-1 bg-blue-900/30 border border-blue-500/50 rounded-md">
            <span className="text-xs text-blue-300">{'\u{1F4A1}'} 現在の株価が必要です</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 text-sm">
        <div>
          <span className="text-gray-400">価格差：</span>
          <span className={`ml-2 ${analysis.priceGap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatProfitLoss(analysis.priceGap)}円
          </span>
        </div>

        <div>
          <span className="text-gray-400">乖離率：</span>
          <span className={`ml-2 ${analysis.gapPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {analysis.gapPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
        <div className="whitespace-nowrap">
          <span className="text-gray-400">必要投資額：</span>
          <span className="ml-2 text-white">
            {formatPrice(analysis.requiredInvestment)}円
          </span>
        </div>

        {analysis.predictedAveragePrice && (
          <div>
            <span className="text-gray-400">予想平均単価：</span>
            <span className="ml-2 text-white">
              {formatPrice(analysis.predictedAveragePrice)}円
            </span>
          </div>
        )}
      </div>

      {/* 投資余力現金分析 */}
      {actionType === 'buy' && (targetPrice ?? 0) > 0 && (targetQuantity ?? 0) > 0 && (
        <div className="pt-3 border-t border-gray-700">
          <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            {'\u{1F4B0}'} 投資余力状況
            {!analysis.canExecute && (
              <span className="text-xs px-2 py-1 bg-red-900/30 text-red-400 border border-red-500/30 rounded-md">
                {'\u274C'} 資金不足
              </span>
            )}
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-gray-400">利用可能現金：</div>
              <div className="text-white pl-2">
                {formatPrice(analysis.cashAvailable)}円
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-gray-400">投資後残高：</div>
              <div className={`pl-2 ${analysis.canExecute ? 'text-white' : 'text-red-400'}`}>
                {formatPrice(analysis.cashAfterInvestment)}円
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-gray-400">現金比率影響：</span>
              <span className={`ml-2 ${
                analysis.cashRatioImpact >= 0
                  ? 'text-green-400'
                  : Math.abs(analysis.cashRatioImpact) > 10
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}>
                {analysis.cashRatioImpact > 0 ? '+' : ''}{analysis.cashRatioImpact.toFixed(1)}%
                {Math.abs(analysis.cashRatioImpact) > 10 && (
                  <span className="text-xs ml-1 text-red-300">（大幅変動）</span>
                )}
              </span>
            </div>

            {!analysis.canExecute && (
              <div className="col-span-2 p-2 bg-red-900/20 border border-red-500/30 rounded-md">
                <div className="text-xs text-red-300 flex items-center gap-2">
                  <span>{'\u26A0\uFE0F'}</span>
                  <span>不足額：{formatPrice(analysis.requiredInvestment - analysis.cashAvailable)}円</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <NeonAlertDisplay analysis={analysis} />
    </>
  );
}
