'use client';

import { useState, useEffect, useCallback } from 'react';
import StockCard from '@/components/StockCard';
import FavoriteGroupManager from '@/components/FavoriteGroupManager';
import TagManager from '@/components/TagManager';
import SearchBar from '@/components/SearchBar';
import InvestmentCalendar from '@/components/InvestmentCalendar';
import PortfolioSummary from '@/components/PortfolioSummary';
import FloatingAddButton from '@/components/FloatingAddButton';
import StrategySummaryPage from '@/components/StrategySummaryPage';
import PortfolioPositionsPage from '@/components/PortfolioPositionsPage';
import AlertSummaryPage from '@/components/AlertSummaryPage';
import HamburgerMenuButton from '@/components/HamburgerMenuButton';
import SlideOutMenu from '@/components/SlideOutMenu';
import EventCalendarPage from '@/components/EventCalendarPage';
import DividendBenefitListPage from '@/components/DividendBenefitListPage';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import AuthButton from '@/components/AuthButton';
import BulkTabSwitcher from '@/components/BulkTabSwitcher';
import { loadStockData, getStockData } from '@/data/stockNames';
import { initSoundEngine } from '@/lib/sound';
import { GROUP_COLORS } from '@/types/favorites';
import { useStockData } from '@/hooks/useStockData';
import { useFavoriteGroups } from '@/hooks/useFavoriteGroups';
import { useCash } from '@/hooks/useCash';
import { useModals } from '@/hooks/useModals';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingWizard from '@/components/OnboardingWizard';
import { useStockSearch } from '@/hooks/useStockSearch';
import { useAlertCounts } from '@/hooks/useAlertCounts';
import { useCalendarData } from '@/hooks/useCalendarData';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useDividendBenefitData } from '@/hooks/useDividendBenefitData';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

const MAX_STOCKS = 20;

export default function Home() {
  const {
    stockData, stockDataMap, stockSymbols, isLoading: isStockDataLoading,
    error: stockDataError, refreshData, reorderStocks, addStock,
    updateStockPrice, updateStockData, updateStockEvent,
  } = useStockData();

  const [additionalError, setAdditionalError] = useState('');
  const error = stockDataError || additionalError;
  const setError = setAdditionalError;

  const {
    groups: favoriteGroups, setGroups: setFavoriteGroups,
    selectedGroupFilter, handleGroupFilterChange,
  } = useFavoriteGroups();

  const { cashAmount } = useCash();

  const [isInitialized, setIsInitialized] = useState(false);
  const [forceOpenAdd, setForceOpenAdd] = useState(false);

  // Custom hooks
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
    stockSymbols, stockDataMap, modals.isDividendBenefitListOpen, isInitialized
  );

  // ドラッグ&ドロップセンサー
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ドラッグ開始ハンドラー
  const handleDragStart = (_event: DragStartEvent) => {
    // no-op: ドラッグ開始時の処理
  };

  // ドラッグ終了ハンドラー
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredStocks.indexOf(active.id as string);
      const newIndex = filteredStocks.indexOf(over.id as string);
      const newOrder = arrayMove(filteredStocks, oldIndex, newIndex);
      const otherStocks = stockSymbols.filter(stock => !filteredStocks.includes(stock));
      const updatedStocks = [...otherStocks, ...newOrder];

      reorderStocks(updatedStocks);

      fetch('/api/stocks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: updatedStocks }),
      }).catch(err => console.error('並び順の保存に失敗:', err));
    }
  };

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

  const handleAddStock = async (code: string) => {
    if (stockSymbols.length >= MAX_STOCKS) {
      setError(`最大${MAX_STOCKS}銘柄まで登録できます。不要な銘柄を削除してから追加してください。`);
      return;
    }
    if (stockSymbols.includes(code)) {
      setError('この銘柄は既に追加されています');
      return;
    }
    setError('');

    // CSVデータから銘柄名・業種・市場を取得
    const stockInfo = await getStockData(code);
    await addStock(code, stockInfo?.name, stockInfo?.sector, stockInfo?.market);

    if (selectedGroupFilter) {
      const updatedGroups = favoriteGroups.map(group => {
        if (group.id === selectedGroupFilter && !group.stocks.includes(code)) {
          return { ...group, stocks: [...group.stocks, code] };
        }
        return group;
      });
      setFavoriteGroups(updatedGroups);
    }
  };

  const handleRemoveStock = useCallback((code: string) => {
    const newStocks = stockSymbols.filter(stock => stock !== code);
    reorderStocks(newStocks);
    setError('');

    // DBから銘柄を削除（カスケードで関連データも削除）
    fetch('/api/stocks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: code }),
    }).catch(err => console.error('銘柄の削除に失敗:', err));

    const updatedGroups = favoriteGroups.map(group => ({
      ...group,
      stocks: group.stocks.filter(s => s !== code)
    }));
    setFavoriteGroups(updatedGroups);
  }, [stockSymbols, reorderStocks, favoriteGroups, setFavoriteGroups]);

  const handleStockClick = (symbol: string) => {
    const element = document.getElementById(`stock-card-${symbol}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.transform = 'scale(1.02)';
      element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
      setTimeout(() => {
        element.style.transform = '';
        element.style.boxShadow = '';
        element.style.transition = 'all 0.3s ease';
      }, 1000);
    }
  };

  const shouldShowHints = stockSymbols.length > 0 && (!hasPortfolioData || !hasCalendarData);

  return (
    <div className="min-h-screen bg-gray-900" onClick={() => initSoundEngine()}>
      {/* Header with Logo */}
      <header className="bg-slate-900 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-4 group cursor-pointer transition-transform duration-200 hover:scale-105"
              title="カブノオト ホームページ"
            >
            <img
              src="/kabunote-logo.png"
              alt="カブノオト - 投資思考整理ダッシュボード"
              className="h-12 md:h-16 w-auto transition-all duration-300"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
              }}
            />
            </a>

            {/* ナビゲーション */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <AuthButton />
              <HamburgerMenuButton
                onClick={() => modals.setIsMenuOpen(true)}
                alertCounts={alertCounts}
              />
            </div>
          </div>
        </div>
      </header>

      <style jsx>{`
        .group:hover img {
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.2)) !important;
        }
      `}</style>

      <main className="container mx-auto px-4 py-4">
        <div className="mb-4">
          {/* 外部リンク */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex overflow-x-auto gap-3 flex-shrink-0 pt-1 -mt-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { href: 'https://kabutan.jp/warning/record_w52_high_price&dispmode=normal', icon: '📈', label: '52週高値', gradient: 'from-green-600 to-blue-600' },
                { href: 'https://sekai-kabuka.com/', icon: '🌍', label: '世界の株価', gradient: 'from-purple-600 to-pink-600' },
                { href: 'https://www.release.tdnet.info/inbs/I_main_00.html', icon: '📋', label: '適時開示', gradient: 'from-orange-600 to-red-600' },
                { href: 'https://kabutan.jp/warning/pts_night_price_increase', icon: '🌙', label: 'PTS夜間', gradient: 'from-indigo-600 to-violet-600' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-shrink-0 flex flex-col items-center gap-1 group transition-transform duration-300 ease-out hover:-translate-y-1`}
                >
                  <span className={`w-9 h-9 rounded-full bg-gradient-to-r ${link.gradient} flex items-center justify-center text-lg shadow-lg transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-white/20`}>
                    {link.icon}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap transition-colors duration-300 group-hover:text-gray-200">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ポートフォリオサマリー */}
        <div className="portfolio-summary">
          <PortfolioSummary portfolioData={stockData} />
        </div>

        {/* 投資カレンダー */}
        {stockSymbols.length > 0 && hasCalendarData && (
          <InvestmentCalendar
            stockSymbols={stockSymbols}
            stockData={stockCalendarData}
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

      {/* フローティング銘柄追加ボタン */}
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
                onClick={() => handleGroupFilterChange(null)}
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
                  onClick={() => handleGroupFilterChange(group.id)}
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

        {/* 検索バー */}
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

                  {/* フローティングボタンへの誘導 */}
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

                  {/* 使い方のヒント */}
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
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredStocks} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{gridAutoRows: '1fr'}}>
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

        {/* グループ管理モーダル */}
        {modals.isGroupManagerOpen && (
          <FavoriteGroupManager
            groups={favoriteGroups}
            onGroupsChange={setFavoriteGroups}
            onClose={() => modals.setIsGroupManagerOpen(false)}
          />
        )}

        {/* タグ管理モーダル */}
        <TagManager
          isOpen={modals.isTagManagerOpen}
          onClose={() => { modals.setIsTagManagerOpen(false); refreshData(); }}
        />


        {/* アラート一覧モーダル */}
        {modals.isAlertSummaryOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-4 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">🚨 アラート一覧</h2>
                <button
                  onClick={() => modals.setIsAlertSummaryOpen(false)}
                  className="cursor-pointer text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-8rem)]">
                <AlertSummaryPage stockData={stockData} />
              </div>
            </div>
          </div>
        )}

        {/* 戦略一覧ダッシュボードモーダル */}
        {modals.isStrategySummaryOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-4 max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">🎯 戦略一覧ダッシュボード</h2>
                <button
                  onClick={() => modals.setIsStrategySummaryOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-8rem)]">
                <StrategySummaryPage stockData={stockData} />
              </div>
            </div>
          </div>
        )}

        {/* 保有ポジション一覧ダッシュボードモーダル */}
        {modals.isPortfolioPositionsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-4 max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">💼 保有ポジション一覧</h2>
                <button
                  onClick={() => modals.setIsPortfolioPositionsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-8rem)]">
                <PortfolioPositionsPage stockData={stockData} />
              </div>
            </div>
          </div>
        )}

        {/* イベント一覧モーダル */}
        {modals.isEventCalendarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-4 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">📅 イベント一覧</h2>
                <button
                  onClick={() => modals.setIsEventCalendarOpen(false)}
                  className="cursor-pointer text-gray-400 hover:text-white transition-colors p-2 rounded"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-8rem)]">
                <EventCalendarPage
                  stockSymbols={stockSymbols}
                  stockData={stockCalendarData}
                />
              </div>
            </div>
          </div>
        )}

        {/* 配当・優待一覧モーダル */}
        {modals.isDividendBenefitListOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-4 max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">💰 配当・優待一覧</h2>
                <button
                  onClick={() => modals.setIsDividendBenefitListOpen(false)}
                  className="cursor-pointer text-gray-400 hover:text-white transition-colors p-2 rounded"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-8rem)]">
                <DividendBenefitListPage
                    stockSymbols={stockSymbols}
                    stockData={dividendBenefitData}
                    onStockClick={(symbol) => {
                      modals.setIsDividendBenefitListOpen(false);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(`kabunote-open-tab-${symbol}`, 'dividend');
                      }
                      handleStockClick(symbol);
                    }}
                  />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* アカウント削除モーダル */}
      <DeleteAccountModal
        isOpen={modals.isDeleteAccountOpen}
        onClose={() => modals.setIsDeleteAccountOpen(false)}
      />

      {/* オンボーディングウィザード */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            completeOnboarding();
            setForceOpenAdd(true);
          }}
          onClose={completeOnboarding}
        />
      )}

      {/* スライドアウトメニュー */}
      <SlideOutMenu
        isOpen={modals.isMenuOpen}
        onClose={() => modals.setIsMenuOpen(false)}
        alertCounts={alertCounts}
        onMenuItemClick={modals.handleMenuItemClick}
      />
    </div>
  );
}
