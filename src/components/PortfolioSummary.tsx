'use client';

import InvestmentPieChart from '@/components/InvestmentPieChart';
import PortfolioOverviewGrid from '@/components/PortfolioOverviewGrid';
import CashPositionSection from '@/components/CashPositionSection';
import TargetSummarySection from '@/components/TargetSummarySection';
import PortfolioHistory from '@/components/PortfolioHistory';
import { usePortfolioSummary, StockData } from '@/hooks/usePortfolioSummary';
import { useCash } from '@/hooks/auth/useCash';
import { useAccordionState } from '@/hooks/util/useAccordionState';
import { STORAGE_KEYS } from '@/lib/storageKeys';

interface PortfolioSummaryProps {
  portfolioData: StockData[];
}

export default function PortfolioSummary({ portfolioData }: PortfolioSummaryProps) {
  const { isExpanded: isChartsExpanded, toggle: toggleCharts } = useAccordionState();
  const { isExpanded: isTargetSummaryExpanded, toggle: toggleTargetSummary } = useAccordionState();
  const { isExpanded: isCashSectionExpanded, toggle: toggleCashSection } = useAccordionState({
    storageKey: STORAGE_KEYS.CASH_SECTION_EXPANDED,
    defaultExpanded: true,
  });
  const { cashAmount, nextActionMemo, updateCash, updateNextActionMemo } = useCash();
  const { overallSummary, chartPortfolioData } = usePortfolioSummary(portfolioData, cashAmount);

  if (portfolioData.length === 0) {
    return null;
  }

  const hasPositions = overallSummary.stocksWithPositions > 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 font-thin">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">💼</span>
          <h2 className="text-lg font-semibold text-white">ポートフォリオサマリー</h2>
          {hasPositions && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              ({overallSummary.stocksWithPositions}銘柄でポジション保有中)
            </span>
          )}
        </div>
      </div>

      {hasPositions && (
        <PortfolioOverviewGrid overallSummary={overallSummary} />
      )}

      <CashPositionSection
        overallSummary={overallSummary}
        cashAmount={cashAmount}
        nextActionMemo={nextActionMemo}
        updateCash={updateCash}
        updateNextActionMemo={updateNextActionMemo}
        isCashSectionExpanded={isCashSectionExpanded}
        toggleCashSection={toggleCashSection}
      />

      <TargetSummarySection
        targetSummary={overallSummary.targetSummary}
        isTargetSummaryExpanded={isTargetSummaryExpanded}
        toggleTargetSummary={toggleTargetSummary}
      />

      {/* 円グラフセクション（アコーディオン） */}
      {overallSummary.stocksWithPositions > 0 && (
        <div className="mt-2">
          <button
            onClick={toggleCharts}
            className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="text-sm font-medium text-gray-200">
                ポートフォリオ分析グラフ
              </h3>
              <span className="text-xs text-gray-400 hidden sm:inline">
                (投資額割合・業種別・タグ別・配当金額割合・株主優待価値割合)
              </span>
            </div>
            <div className={`transform transition-transform duration-200 text-gray-400 ${
              isChartsExpanded ? 'rotate-180' : 'rotate-0'
            }`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 6l4 4 4-4H4z"/>
              </svg>
            </div>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isChartsExpanded
              ? 'max-h-[3000px] opacity-100 mt-4'
              : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
              <InvestmentPieChart portfolioData={chartPortfolioData} type="investment" />
              <InvestmentPieChart portfolioData={chartPortfolioData} type="sector" />
              <InvestmentPieChart portfolioData={chartPortfolioData} type="tags" />
              <InvestmentPieChart portfolioData={chartPortfolioData} type="dividend" />
              <InvestmentPieChart portfolioData={chartPortfolioData} type="shareholder" />
            </div>
          </div>
        </div>
      )}

      {hasPositions && (
        <PortfolioHistory />
      )}
    </div>
  );
}
