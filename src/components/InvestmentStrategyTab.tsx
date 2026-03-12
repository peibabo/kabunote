'use client';

import { PositionSummary, ProfitLossInfo } from '@/types/positions';
import { NextActionPlan } from '@/types/nextActionPlan';
import { useInvestmentTabState } from '@/hooks/useInvestmentTabState';
import AnalysisSubTab from '@/components/AnalysisSubTab';
import NextActionSubTab from '@/components/NextActionSubTab';

interface InvestmentStrategyTabProps {
  symbol: string;
  targetPrice: string;
  stopLoss: string;
  currentPrice: string;
  onTargetPriceChange: (value: string) => void;
  onStopLossChange: (value: string) => void;
  onCurrentPriceChange: (value: string) => void;
  positionSummary: PositionSummary;
  profitLossInfo: ProfitLossInfo | null;
  nextActionPlan: NextActionPlan | null;
  updateNextActionPlan: (data: Partial<Omit<NextActionPlan, 'id' | 'updatedAt'>>) => void;
  deleteNextActionPlan: () => Promise<void>;
  isNapLoading: boolean;
  isNapSaving: boolean;
}

export default function InvestmentStrategyTab({
  symbol,
  targetPrice,
  stopLoss,
  currentPrice,
  onTargetPriceChange,
  onStopLossChange,
  onCurrentPriceChange,
  positionSummary,
  profitLossInfo,
  nextActionPlan,
  updateNextActionPlan,
  deleteNextActionPlan,
  isNapLoading,
  isNapSaving,
}: InvestmentStrategyTabProps) {
  const { activeTab, setActiveTab, tabs, isLoading } = useInvestmentTabState(symbol, 'analysis');

  if (isLoading) {
    return <div className="text-center text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* サブタブナビゲーション */}
      <div className="flex justify-center gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'text-white bg-gray-600 shadow-md'
                : 'text-gray-400 bg-gray-800 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* サブタブコンテンツ */}
      <div className="min-h-[400px]">
        {activeTab === 'analysis' && (
          <AnalysisSubTab
            symbol={symbol}
            targetPrice={targetPrice}
            stopLoss={stopLoss}
            currentPrice={currentPrice}
            onTargetPriceChange={onTargetPriceChange}
            onStopLossChange={onStopLossChange}
            onCurrentPriceChange={onCurrentPriceChange}
            positionSummary={positionSummary}
            profitLossInfo={profitLossInfo}
          />
        )}

        {activeTab === 'nextaction' && (
          <NextActionSubTab
            symbol={symbol}
            currentPrice={parseFloat(currentPrice) || 0}
            positionSummary={positionSummary}
            nextActionPlan={nextActionPlan}
            updateNextActionPlan={updateNextActionPlan}
            deleteNextActionPlan={deleteNextActionPlan}
            isNapLoading={isNapLoading}
            isNapSaving={isNapSaving}
          />
        )}
      </div>
    </div>
  );
}