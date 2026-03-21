'use client';

import { DividendCalculation } from '@/types/dividend';
import { formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';
import { PositionSummary } from '@/types/positions';

interface DividendSimulationProps {
  dividendCalculation: DividendCalculation | null;
  dividendPerShare: string;
  dividendFrequency: number;
  positionSummary: PositionSummary;
}

export default function DividendSimulation({
  dividendCalculation,
  dividendPerShare,
  dividendFrequency,
  positionSummary,
}: DividendSimulationProps) {
  if (dividendCalculation) {
    return (
      <div className="bg-green-900 bg-opacity-30 rounded-lg p-3">
        <h5 className="text-xs font-medium text-green-300 mb-2">{'\u{1F4B0}'} 配当シミュレーション</h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400">年間配当金額：</span>
            <div className="text-green-300 font-medium">{formatDividendAmount(dividendCalculation.annualDividend)}円</div>
            <div className="text-xs text-gray-400">
              {dividendPerShare}円 {'\u00D7'} {positionSummary.totalShares}株 {'\u00D7'} {dividendFrequency}回
            </div>
          </div>
          <div>
            <span className="text-gray-400">配当利回り：</span>
            <div className="text-green-300 font-medium">{formatDividendYield(dividendCalculation.dividendYield)}%</div>
            <div className="text-xs text-gray-400">
              年間配当 {'\u00F7'} 平均取得価額
            </div>
          </div>
          <div>
            <span className="text-gray-400">税引後受取額：</span>
            <div className="text-blue-300 font-medium">{formatDividendAmount(dividendCalculation.afterTaxAmount)}円</div>
            <div className="text-xs text-gray-400">
              税率{(positionSummary.weightedTaxRate * 100).toFixed(3)}%控除後
            </div>
          </div>
          <div>
            <span className="text-gray-400">税金額：</span>
            <div className="text-red-300 font-medium">{formatDividendAmount(dividendCalculation.taxAmount)}円</div>
            <div className="text-xs text-gray-400">
              源泉徴収額
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center bg-green-900 bg-opacity-20 border border-green-700 rounded-lg px-2 py-2">
      <div className="text-xs text-green-300 mb-1">配当シミュレーション</div>
      <div className="text-sm font-medium text-gray-400 mb-1">
        ---
      </div>
      <div className="text-xs text-green-400">
        {'\u{1F4A1}'} {dividendPerShare ? '正しい配当金額を入力してください' : '配当金を入力してください'}
      </div>
    </div>
  );
}
