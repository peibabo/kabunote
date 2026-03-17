'use client';

import { useState, memo } from 'react';
import { FavoriteGroup } from '@/types/favorites';
import { StockData as DBStockData } from '@/hooks/stock/useStockData';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStockCardData } from '@/hooks/stock/useStockCardData';
import { playSound } from '@/lib/sound';
import { stockKey } from '@/lib/storageKeys';

// Components
import StockCardHeader from './StockCardHeader';
import BasicTab from '../stock-tabs/BasicTab';
import InvestmentStrategyTab from '../stock-tabs/InvestmentStrategyTab';
import ManagementTab from '../stock-tabs/ManagementTab';
import AlertDisplay from '../alert/AlertDisplay';
import TagEditor from '../tag/TagEditor';
import FavoriteGroupSelector from '../tag/FavoriteGroupSelector';

interface StockCardProps {
  symbol: string;
  onRemove: (symbol: string) => void;
  favoriteGroups: FavoriteGroup[];
  onFavoriteGroupsChange: (groups: FavoriteGroup[]) => void;
  initialStockData?: DBStockData;
}

function StockCard({ symbol, onRemove, favoriteGroups, onFavoriteGroupsChange, initialStockData }: StockCardProps) {
  // ドラッグ&ドロップ
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: symbol });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // UI状態
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [isFavoriteGroupSelectorOpen, setIsFavoriteGroupSelectorOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);

  // データ（ファサードフック）
  const {
    stockData, isLoading, companyName, isKnown, belongingGroups,
    activeTab, setActiveTab, tabs,
    memo, updateMemo, isMemoLoading, isMemoSaving, memoError, memoLastSaved,
    positionSummary, profitLossInfo,
    currentPrice, targetPrice, stopLoss, setCurrentPrice, setTargetPrice, setStopLoss,
    customTags, addTag, removeTagFromDB,
    earningsDate, shareholderMeetingSettings, updateEarningsDate, updateShareholderMeetingSettings,
    nextActionPlan, updateNap, deleteNap, isNapLoading, isNapSaving,
    targetPriceAlert, cardStyles,
  } = useStockCardData(symbol, favoriteGroups, initialStockData);

  // お気に入りグループの変更を処理
  const handleFavoriteGroupsChange = (groupIds: string[]) => {
    const updatedGroups = favoriteGroups.map(group => {
      const shouldIncludeStock = groupIds.includes(group.id);
      const currentlyIncludes = group.stocks.includes(symbol);

      if (shouldIncludeStock && !currentlyIncludes) {
        return { ...group, stocks: [...group.stocks, symbol] };
      } else if (!shouldIncludeStock && currentlyIncludes) {
        return { ...group, stocks: group.stocks.filter(s => s !== symbol) };
      }
      return group;
    });

    onFavoriteGroupsChange(updatedGroups);
  };

  return (
    <>
      <style jsx>{`
        @keyframes bgPulse {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <div
        ref={setNodeRef}
        style={{
          ...style,
          ...cardStyles.bgAnimationStyle
        }}
        {...attributes}
        className={`relative ${cardStyles.bgClass} rounded-lg border ${cardStyles.borderClass} shadow-lg p-4 space-y-4 transition-all duration-200 h-full flex flex-col ${
          isDragging ? 'z-50 shadow-2xl ring-2 ring-blue-500 ring-opacity-50 bg-gray-750' : 'hover:shadow-lg'
        }`}
      >
        {/* ヘッダー */}
        <StockCardHeader
          symbol={symbol}
          companyName={companyName}
          stockData={stockData}
          isLoading={isLoading}
          isKnown={isKnown}
          customTags={customTags}
          belongingGroups={belongingGroups}
          onTagEditorOpen={() => setIsTagEditorOpen(true)}
          onFavoriteGroupSelectorOpen={() => setIsFavoriteGroupSelectorOpen(true)}
          onTagRemove={(tagId) => removeTagFromDB(tagId)}
          onRemove={() => onRemove(symbol)}
          listeners={listeners}
        />

        {/* アラート表示 */}
        <AlertDisplay
          alerts={targetPriceAlert}
          onClick={() => {
            setActiveTab('analysis');
            const primaryAlert = targetPriceAlert.length > 0 ? targetPriceAlert[0] : null;
            const targetSubTab = (primaryAlert?.type === 'nextaction-approaching' ||
                                 primaryAlert?.type === 'nextaction-warning' ||
                                 primaryAlert?.type === 'insufficient-funds')
                                 ? 'nextaction' : 'analysis';

            localStorage.setItem(stockKey.investmentTab(symbol), targetSubTab);
            window.dispatchEvent(new CustomEvent('localStorageChange', {
              detail: { key: stockKey.investmentTab(symbol) }
            }));
          }}
        />

        {/* チャート確認ボタン */}
        <div className="mb-4">
          <button
            onClick={() => {
              const url = `https://finance.yahoo.co.jp/quote/${symbol}.T?term=1d`;
              window.open(url, 'stockChart', 'width=800,height=800,scrollbars=yes,resizable=yes');
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
          >
            📈 最新チャートを確認
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-600 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { playSound('toggle'); setActiveTab(tab.id); }}
              className={`cursor-pointer flex-1 py-2 px-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="tab-content flex-1">
          {activeTab === 'basic' && (
            <BasicTab
              symbol={symbol}
              memo={memo}
              onMemoChange={updateMemo}
              onMemoModalOpen={() => setIsMemoModalOpen(true)}
              isMemoLoading={isMemoLoading}
              isMemoSaving={isMemoSaving}
              memoError={memoError}
              memoLastSaved={memoLastSaved}
            />
          )}

          {activeTab === 'analysis' && (
            <InvestmentStrategyTab
              symbol={symbol}
              stockId={initialStockData?.id}
              targetPrice={targetPrice}
              stopLoss={stopLoss}
              currentPrice={currentPrice}
              onTargetPriceChange={setTargetPrice}
              onStopLossChange={setStopLoss}
              onCurrentPriceChange={setCurrentPrice}
              positionSummary={positionSummary}
              profitLossInfo={profitLossInfo}
              nextActionPlan={nextActionPlan}
              updateNextActionPlan={updateNap}
              deleteNextActionPlan={deleteNap}
              isNapLoading={isNapLoading}
              isNapSaving={isNapSaving}
            />
          )}

          {activeTab === 'management' && (
            <ManagementTab
              symbol={symbol}
              earningsDate={earningsDate}
              onEarningsDateChange={updateEarningsDate}
              onPositionManagerOpen={() => {}}
              shareholderMeetingSettings={shareholderMeetingSettings}
              onShareholderMeetingSettingsChange={updateShareholderMeetingSettings}
              positionSummary={positionSummary}
              initialPositions={initialStockData?.positions}
              initialDividend={initialStockData ? (initialStockData.dividend ?? null) : undefined}
              initialBenefit={initialStockData ? (initialStockData.benefit ?? null) : undefined}
            />
          )}
        </div>

        {/* メモ拡大モーダル */}
        {isMemoModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsMemoModalOpen(false)}>
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[95vh] m-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>📝</span>
                  <span>{companyName || symbol} - 株ノオト</span>
                </h3>
                <button
                  onClick={() => setIsMemoModalOpen(false)}
                  className="cursor-pointer text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <textarea
                  value={memo}
                  onChange={(e) => updateMemo(e.target.value)}
                  placeholder="この銘柄について詳しく思考を整理しましょう..."
                  maxLength={2000}
                  className="w-full h-[70vh] px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none font-mono leading-6 shadow-inner"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='24' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='17' x2='100' y2='17' stroke='%23a1a1aa' stroke-width='1' stroke-dasharray='3,3' opacity='0.4'/%3e%3c/svg%3e")`,
                    backgroundSize: '100px 24px',
                    backgroundPosition: '0 3px'
                  }}
                  autoFocus
                />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    自動保存されます
                  </p>
                  <span className={`text-xs ${memo.length > 1800 ? 'text-orange-400' : memo.length > 1900 ? 'text-red-400' : 'text-gray-400'}`}>
                    {memo.length}/2000文字
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* タグエディター */}
        {isTagEditorOpen && (
          <TagEditor
            symbol={symbol}
            currentTags={customTags}
            onAddTag={addTag}
            onRemoveTag={removeTagFromDB}
            onClose={() => setIsTagEditorOpen(false)}
          />
        )}

        {/* お気に入りグループセレクター */}
        {isFavoriteGroupSelectorOpen && (
          <FavoriteGroupSelector
            symbol={symbol}
            groups={favoriteGroups}
            selectedGroupIds={belongingGroups.map(g => g.id)}
            onGroupsChange={handleFavoriteGroupsChange}
            onClose={() => setIsFavoriteGroupSelectorOpen(false)}
          />
        )}
      </div>
    </>
  );
}

function arePropsEqual(prevProps: StockCardProps, nextProps: StockCardProps): boolean {
  if (prevProps.symbol !== nextProps.symbol) return false;
  if (prevProps.onRemove !== nextProps.onRemove) return false;
  if (prevProps.onFavoriteGroupsChange !== nextProps.onFavoriteGroupsChange) return false;
  if (prevProps.initialStockData !== nextProps.initialStockData) return false;

  const prevBelonging = prevProps.favoriteGroups
    .filter(g => g.stocks.includes(prevProps.symbol))
    .map(g => g.id)
    .sort()
    .join(',');
  const nextBelonging = nextProps.favoriteGroups
    .filter(g => g.stocks.includes(nextProps.symbol))
    .map(g => g.id)
    .sort()
    .join(',');
  if (prevBelonging !== nextBelonging) return false;

  const prevGroupData = prevProps.favoriteGroups
    .filter(g => g.stocks.includes(prevProps.symbol))
    .map(g => `${g.id}:${g.name}:${g.color}`)
    .sort()
    .join('|');
  const nextGroupData = nextProps.favoriteGroups
    .filter(g => g.stocks.includes(nextProps.symbol))
    .map(g => `${g.id}:${g.name}:${g.color}`)
    .sort()
    .join('|');
  if (prevGroupData !== nextGroupData) return false;

  return true;
}

export default memo(StockCard, arePropsEqual);
