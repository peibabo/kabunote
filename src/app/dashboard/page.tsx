'use client';

import { useState, useEffect } from 'react';
import StockCard from '@/components/stock/StockCard';
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
import FloatingSnapshotButton from '@/components/settings/FloatingSnapshotButton';
import DashboardHeader from '@/components/layout/DashboardHeader';
import DashboardModals from '@/components/layout/DashboardModals';
import BulkTabSwitcher from '@/components/layout/BulkTabSwitcher';
import ExternalLinksArea from '@/components/settings/ExternalLinksArea';
import { loadStockData } from '@/data/stockNames';
import { initSoundEngine, playSound } from '@/lib/sound';
import { GROUP_COLORS } from '@/types/favorites';
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export default function Home() {
  const {
    stockData, stockDataMap, stockSymbols, isLoading: isStockDataLoading,
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
  const { hasPortfolioData } = usePortfolioData(stockData, isInitialized);
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
          <PortfolioSummary portfolioData={stockData} />
        </div>

        {stockSymbols.length > 0 && (
          <InvestmentScheduleWidget
            stockCalendarData={stockCalendarData}
            dividendBenefitData={dividendBenefitData}
            onStockClick={handleStockClick}
          />
        )}

        {/* 次のステップのヒント */}
        {shouldShowHints && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">💡</span>
              <h3 className="text-lg font-semibold text-white">次のステップのヒント</h3>
            </div>
            <div className="space-y-3">
              {!hasPortfolioData && (
                <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-300 text-sm font-medium">📊 ポートフォリオ分析を始めませんか？</span>
                  </div>
                  <p className="text-blue-200 text-sm">
                    銘柄カードの「💼 管理」タブで保有ポジションや現在株価を入力すると、
                    <span className="font-medium text-blue-100">ポートフォリオサマリーと分析グラフ</span>が表示されます
                  </p>
                </div>
              )}

              {!hasCalendarData && (
                <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-300 text-sm font-medium">📅 投資スケジュール管理はいかがですか？</span>
                  </div>
                  <p className="text-green-200 text-sm">
                    銘柄カードの「💼 管理」タブで決算発表日や権利確定日を設定すると、
                    <span className="font-medium text-green-100">投資カレンダー</span>が表示されます
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <FloatingSnapshotButton />

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

        {/* お気に入りグループフィルター */}
        {favoriteGroups.length > 0 && stockSymbols.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">⭐ お気に入りグループ</h3>
              <button
                onClick={() => modals.setIsGroupManagerOpen(true)}
                className="cursor-pointer text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                グループ管理
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
              <button
                onClick={() => { playSound('toggle'); handleGroupFilterChange(null); }}
                className={`cursor-pointer text-sm px-3 py-2 rounded-full transition-colors whitespace-nowrap shrink-0 md:shrink ${
                  selectedGroupFilter === null
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                すべて ({stockSymbols.length}/{MAX_STOCKS})
              </button>
              {favoriteGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => { playSound('toggle'); handleGroupFilterChange(group.id); }}
                  className={`cursor-pointer text-sm px-3 py-2 rounded-full transition-colors whitespace-nowrap shrink-0 md:shrink ${
                    selectedGroupFilter === group.id
                      ? `${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text}`
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  ★ {group.name} ({group.stocks.length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* グループ管理ボタン（グループがない場合） */}
        {favoriteGroups.length === 0 && stockSymbols.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-400 text-sm mb-3">お気に入りグループを作成して銘柄を整理しましょう</p>
            <button
              onClick={() => modals.setIsGroupManagerOpen(true)}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              グループを作成
            </button>
          </div>
        )}

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
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              {stockSymbols.length === 0 ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-medium text-white mb-3">🎯 銘柄カードを追加してください</h3>
                    <p className="text-gray-400 mb-4">投資の思考整理を始めましょう。まずは気になる銘柄を追加してみてください。</p>
                  </div>

                  <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-blue-300 text-sm">右下の</span>
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">
                        ＋
                      </div>
                      <span className="text-blue-300 text-sm">ボタンから銘柄を追加できます</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <span>💡</span>
                        <span>銘柄コード（例：7203）または会社名（例：トヨタ）で検索</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✨</span>
                      <span>銘柄を追加すると投資メモやタグ付けができます</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">📊</span>
                      <span>ポジション管理や損益シミュレーション機能も利用可能</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">🏷️</span>
                      <span>お気に入りグループで銘柄を整理できます</span>
                    </div>
                  </div>
                </>
              ) : searchQuery.trim() ? (
                <>
                  <h3 className="text-xl font-medium text-white mb-2">検索結果がありません</h3>
                  <p className="text-gray-400">「{searchQuery}」に一致する銘柄・メモ・タグが見つかりませんでした。</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="cursor-pointer mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    検索をクリア
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-medium text-white mb-2">表示する銘柄がありません</h3>
                  <p className="text-gray-400">選択したグループに銘柄が登録されていません。</p>
                </>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={() => {}}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredStocks} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 md:pb-0" style={{gridAutoRows: '1fr'}}>
                  {filteredStocks.map((stock) => (
                    <div key={stock} id={`stock-card-${stock}`} className="h-full">
                      <StockCard
                        symbol={stock}
                        onRemove={handleRemoveStock}
                        favoriteGroups={favoriteGroups}
                        onFavoriteGroupsChange={setFavoriteGroups}
                        initialStockData={stockDataMap.get(stock)}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
