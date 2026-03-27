'use client';

import { PositionSummary, ProfitLossInfo } from '@/types/positions';
import { NextActionPlan } from '@/types/nextActionPlan';
import { useInvestmentTabState } from '@/hooks/tab/useInvestmentTabState';
import AnalysisSubTab from '@/components/stock-tabs/AnalysisSubTab';
import NextActionSubTab from '@/components/stock-tabs/NextActionSubTab';


interface InvestmentStrategyTabProps {
  symbol: string;
  stockId?: string;
  targetPrice: string;
  stopLoss: string;
  currentPrice: string;
  onTargetPriceChange: (value: string) => void;
  onStopLossChange: (value: string) => void;
  onCurrentPriceChange: (value: string) => void;
  onPriceBlur?: () => void;
  positionSummary: PositionSummary;
  profitLossInfo: ProfitLossInfo | null;
  nextActionPlan: NextActionPlan | null;
  updateNextActionPlan: (data: Partial<Omit<NextActionPlan, 'id' | 'updatedAt'>>) => void;
  deleteNextActionPlan: () => Promise<void>;
  isNapLoading: boolean;
  isNapSaving: boolean;
  snapshotPrice?: number | null;
  snapshotDate?: string | null;
  snapshotValue?: number | null;
  snapshotCost?: number | null;
}

export default function InvestmentStrategyTab({
  symbol,
  stockId,
  targetPrice,
  stopLoss,
  currentPrice,
  onTargetPriceChange,
  onStopLossChange,
  onCurrentPriceChange,
  onPriceBlur,
  positionSummary,
  profitLossInfo,
  nextActionPlan,
  updateNextActionPlan,
  deleteNextActionPlan,
  isNapLoading,
  isNapSaving,
  snapshotPrice,
  snapshotDate,
  snapshotValue,
  snapshotCost,
}: InvestmentStrategyTabProps) {
  const { activeTab, setActiveTab, tabs, isLoading } = useInvestmentTabState(symbol, 'analysis');

  if (isLoading) {
    return <div className="text-center text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* サブタブナビゲーション */}
      <div className="flex items-center justify-center gap-2 mb-4">
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
        {currentPrice && parseFloat(currentPrice) > 0 && (
          <>
            <span className="text-gray-600 text-xs">|</span>
            <span className="px-2 py-1 text-xs text-gray-300 bg-gray-700/50 rounded-full">
              📈 ¥{parseFloat(currentPrice).toLocaleString()}
            </span>
          </>
        )}
      </div>

      {/* サブタブコンテンツ */}
      <div className="min-h-[400px]">
        {activeTab === 'analysis' && (
          <AnalysisSubTab
            symbol={symbol}
            stockId={stockId}
            targetPrice={targetPrice}
            stopLoss={stopLoss}
            currentPrice={currentPrice}
            onTargetPriceChange={onTargetPriceChange}
            onStopLossChange={onStopLossChange}
            onCurrentPriceChange={onCurrentPriceChange}
            onPriceBlur={onPriceBlur}
            positionSummary={positionSummary}
            profitLossInfo={profitLossInfo}
            snapshotPrice={snapshotPrice ?? null}
            snapshotDate={snapshotDate ?? null}
            snapshotValue={snapshotValue ?? null}
            snapshotCost={snapshotCost ?? null}
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
