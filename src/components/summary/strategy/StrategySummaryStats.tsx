'use client';

import React from 'react';
import { formatPrice } from '@/lib/positionCalc';
import { StrategyRowData } from './types';

interface StrategySummaryStatsProps {
  strategiesData: StrategyRowData[];
  availableCash: number;
}

export default function StrategySummaryStats({ strategiesData, availableCash }: StrategySummaryStatsProps) {
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
        <div className="text-sm text-gray-400 mb-1">総戦略数</div>
        <div className="text-xl sm:text-2xl font-bold text-white">{strategiesData.length}</div>
      </div>

      <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
        <div className="text-sm text-gray-400 mb-1">高優先度</div>
        <div className="text-xl sm:text-2xl font-bold text-red-400">
          {strategiesData.filter(s => s.plan.priority === 'high').length}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
        <div className="text-sm text-gray-400 mb-1">アラート発生</div>
        <div className="text-xl sm:text-2xl font-bold text-yellow-400">
          {strategiesData.filter(s => s.alertType !== 'none').length}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
        <div className="text-sm text-gray-400 mb-1">必要資金合計</div>
        <div className="text-lg font-bold text-white">
          {formatPrice(
            strategiesData
              .filter(s => s.plan.actionType === 'buy' && s.analysis)
              .reduce((sum, s) => sum + (s.analysis?.requiredInvestment || 0), 0)
          )}円
        </div>
        <div className="text-xs text-gray-400">
          利用可能: {formatPrice(availableCash)}円
        </div>
      </div>
    </div>
  );
}
