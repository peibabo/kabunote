'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/stock/SearchBar';
import InvestmentScheduleWidget from '@/components/calendar/InvestmentScheduleWidget';
import DailyChecklist from '@/components/settings/DailyChecklist';
import InvestmentDiary from '@/components/settings/InvestmentDiary';
import LevelBadge from '@/components/settings/LevelBadge';
import LevelUpCelebration from '@/components/settings/LevelUpCelebration';
import TitleUnlockedToast from '@/components/settings/TitleUnlockedToast';
import PortfolioSummary from '@/components/portfolio/PortfolioSummary';
import PortfolioHistoryWidget from '@/components/portfolio/PortfolioHistoryWidget';
import FloatingAddButton from '@/components/stock/FloatingAddButton';
import FloatingFeedbackButton from '@/components/layout/FloatingFeedbackButton';
import FloatingSnapshotButton from '@/components/settings/FloatingSnapshotButton';
import DashboardHeader from '@/components/layout/DashboardHeader';
import DashboardModals from '@/components/layout/DashboardModals';
import BulkTabSwitcher from '@/components/layout/BulkTabSwitcher';
import ExternalLinksArea from '@/components/settings/ExternalLinksArea';
import FavoriteGroupFilter from '@/components/dashboard/FavoriteGroupFilter';
import StockGrid from '@/components/dashboard/StockGrid';
import EmptyState from '@/components/dashboard/EmptyState';
import NextStepHints from '@/components/dashboard/NextStepHints';
import { loadStockData } from '@/data/stockNames';
import { initSoundEngine } from '@/lib/sound';
import { useStockData } from '@/hooks/stock/useStockData';
import { useFavoriteGroups } from '@/hooks/dashboard/useFavoriteGroups';
import { useCash } from '@/hooks/auth/useCash';
import { useModals } from '@/hooks/dashboard/useModals';
import { useOnboarding } from '@/hooks/other/useOnboarding';
import { useStockSearch } from '@/hooks/stock/useStockSearch';
import { useAlertCounts } from '@/hooks/alert/useAlertCounts';
import { useCalendarData } from '@/hooks/calendar/useCalendarData';
import { usePortfolioData } from '@/hooks/portfolio/usePortfolioData';
import { useDividendBenefitData } from '@/hooks/dividend/useDividendBenefitData';
import { useDashboardActions } from '@/hooks/dashboard/useDashboardActions';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export default function Home() {
  const {
    stockData, stockDataMap, stockSymbols, portfolioSnapshot,
    isLoading: isStockDataLoading,
    refreshData, reorderStocks, addStock,
    updateStockPrice, updateStockData, updateStockEvent,
  } = useStockData();

  const {
    groups: favoriteGroups, setGroups: setFavoriteGroups,
    selectedGroupFilter, handleGroupFilterChange,
  } = useFavoriteGroups();

  const { cashAmount } = useCash();

  const [isInitialized, setIsInitialized] = useState(false);

  const { showOnboarding, completeOnboarding, resetOnboarding } = useOnboarding();
  const modals = useModals(refreshData, resetOnboarding);
  const { searchQuery, setSearchQuery, isSearching, filteredStocks } = useStockSearch(
    stockSymbols, stockDataMap, selectedGroupFilter, favoriteGroups
  );
  const { alertCounts } = useAlertCounts(stockSymbols, stockData, isInitialized, cashAmount);
  const { stockCalendarData, hasCalendarData } = useCalendarData(
    stockSymbols, stockDataMap, isInitialized, updateStockPrice, updateStockData, updateStockEvent
  );
  const { hasPortfolioData, hasSnapshotReady } = usePortfolioData(stockData, isInitialized);
  const { dividendBenefitData } = useDividendBenefitData(
    stockSymbols, stockDataMap, true, isInitialized
  );

  const {
    additionalError, setAdditionalError,
    forceOpenAdd, setForceOpenAdd,
    handleAddStock, handleRemoveStock, handleDragEnd, handleStockClick,
    MAX_STOCKS,
  } = useDashboardActions({
    stockSymbols, filteredStocks, favoriteGroups, setFavoriteGroups,
    selectedGroupFilter, reorderStocks, addStock,
  });

  const error = additionalError;
  const setError = setAdditionalError;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadStockData();
      } catch (error) {
        console.error('Failed to preload stock data:', error);
      }
      setIsInitialized(true);
    };
    initializeApp();
  }, []);

  const shouldShowHints = stockSymbols.length > 0 && (!hasPortfolioData || !hasCalendarData);

  return (
    <div className="min-h-screen bg-gray-900" onClick={() => initSoundEngine()}>
      <DashboardHeader
        alertCounts={alertCounts}
        onMenuOpen={() => modals.setIsMenuOpen(true)}
      />

      <main className="container mx-auto px-4 py-4">
        {isStockDataLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            <span className="mt-3 text-gray-400">読み込み中...</span>
          </div>
        ) : (
        <>
        <div className="mb-4">
          <ExternalLinksArea />
        </div>

        <div className="mb-2">
          <LevelBadge />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 items-start">
          <DailyChecklist />
          <InvestmentDiary />
        </div>

        <LevelUpCelebration />
        <TitleUnlockedToast />

        {hasPortfolioData && (
          <PortfolioHistoryWidget />
        )}

        <div className="portfolio-summary">
          <PortfolioSummary portfolioData={stockData} portfolioSnapshot={portfolioSnapshot} />
        </div>

        {stockSymbols.length > 0 && (
          <InvestmentScheduleWidget
            stockCalendarData={stockCalendarData}
            dividendBenefitData={dividendBenefitData}
            onStockClick={handleStockClick}
          />
        )}

        {shouldShowHints && (
          <NextStepHints
            hasPortfolioData={hasPortfolioData}
            hasCalendarData={hasCalendarData}
          />
        )}

        <FloatingSnapshotButton hasSnapshotReady={hasSnapshotReady} />
        <FloatingFeedbackButton onClick={() => modals.setIsFeedbackOpen(true)} />

        <FloatingAddButton
          onAddStock={handleAddStock}
          error={error}
          setError={setError}
          disabled={stockSymbols.length >= MAX_STOCKS}
          currentCount={stockSymbols.length}
          maxCount={MAX_STOCKS}
          selectedGroupInfo={
            selectedGroupFilter
              ? {
                  name: favoriteGroups.find(g => g.id === selectedGroupFilter)?.name || '',
                  color: favoriteGroups.find(g => g.id === selectedGroupFilter)?.color || 'blue'
                }
              : null
          }
          isFirstTime={stockSymbols.length === 0}
          forceOpen={forceOpenAdd}
          onForceOpenHandled={() => setForceOpenAdd(false)}
        />

        <FavoriteGroupFilter
          favoriteGroups={favoriteGroups}
          selectedGroupFilter={selectedGroupFilter}
          stockSymbolsCount={stockSymbols.length}
          maxStocks={MAX_STOCKS}
          onGroupFilterChange={handleGroupFilterChange}
          onGroupManagerOpen={() => modals.setIsGroupManagerOpen(true)}
        />

        <BulkTabSwitcher stockSymbols={filteredStocks} />

        <div className="mb-2">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* 検索結果表示 */}
        {searchQuery.trim() && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSearching && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                )}
                <p className="text-sm text-gray-300">
                  「<span className="text-blue-400 font-medium">{searchQuery}</span>」の検索結果: {isSearching ? '検索中...' : `${filteredStocks.length}件`}
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="cursor-pointer text-xs text-gray-400 hover:text-white transition-colors"
              >
                検索をクリア
              </button>
            </div>
          </div>
        )}

        <div>
          {isStockDataLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
              <span className="ml-3 text-gray-400">データを読み込み中...</span>
            </div>
          ) : filteredStocks.length === 0 ? (
            <EmptyState
              stockSymbolsCount={stockSymbols.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          ) : (
            <StockGrid
              filteredStocks={filteredStocks}
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onRemoveStock={handleRemoveStock}
              favoriteGroups={favoriteGroups}
              onFavoriteGroupsChange={setFavoriteGroups}
              stockDataMap={stockDataMap}
            />
          )}
        </div>

        <DashboardModals
          modals={modals}
          stockData={stockData}
          stockSymbols={stockSymbols}
          stockCalendarData={stockCalendarData}
          dividendBenefitData={dividendBenefitData}
          favoriteGroups={favoriteGroups}
          setFavoriteGroups={setFavoriteGroups}
          alertCounts={alertCounts}
          refreshData={refreshData}
          onStockClick={handleStockClick}
          showOnboarding={showOnboarding}
          completeOnboarding={completeOnboarding}
          onOnboardingComplete={() => {
            completeOnboarding();
            setForceOpenAdd(true);
          }}
        />
        </>
        )}
      </main>
    </div>
  );
}
