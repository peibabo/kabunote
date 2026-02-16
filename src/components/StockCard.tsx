'use client';

import { useState, useEffect } from 'react';
import { loadStockData, getCompanyNameSync, isKnownStockSync, StockData } from '@/data/stockNames';
import { CustomTag } from '@/types/tags';
import { FavoriteGroup } from '@/types/favorites';
import { Position, PositionSummary, calculatePositionSummary, ProfitLossInfo, calculateProfitLoss } from '@/types/positions';
import { RightsDateSettings, createDefaultRightsSettings, calculateRightsDateFromSettings, shouldDeactivateRights } from '@/types/rightsDate';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStringLocalStorage, useArrayLocalStorage } from '@/hooks/useLocalStorage';
import { useTabState } from '@/hooks/useTabState';

// Components
import StockCardHeader from './StockCardHeader';
import BasicTab from './BasicTab';
import AnalysisTab from './AnalysisTab';
import ManagementTab from './ManagementTab';
import TagEditor from './TagEditor';
import FavoriteGroupSelector from './FavoriteGroupSelector';
import PositionManager from './PositionManager';

interface StockCardProps {
  symbol: string;
  onRemove: () => void;
  favoriteGroups: FavoriteGroup[];
  onFavoriteGroupsChange: (groups: FavoriteGroup[]) => void;
}

export default function StockCard({ symbol, onRemove, favoriteGroups, onFavoriteGroupsChange }: StockCardProps) {
  // ドラッグ&ドロップ機能
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: symbol });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 基本状態
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [isFavoriteGroupSelectorOpen, setIsFavoriteGroupSelectorOpen] = useState(false);
  const [isPositionManagerOpen, setIsPositionManagerOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);

  // タブ状態管理
  const { activeTab, setActiveTab, tabs, isLoading: isTabLoading } = useTabState(symbol);

  // データ管理（localStorage）
  const [memo, setMemo] = useStringLocalStorage(`kabunote-memo-${symbol}`, '', 500);
  const [customTags, setCustomTags] = useArrayLocalStorage<CustomTag>(`kabunote-tags-${symbol}`, [], 250);
  const [targetPrice, setTargetPrice] = useStringLocalStorage(`kabunote-target-price-${symbol}`, '', 300);
  const [stopLoss, setStopLoss] = useStringLocalStorage(`kabunote-stop-loss-${symbol}`, '', 300);
  const [currentPrice, setCurrentPrice] = useStringLocalStorage(`kabunote-current-price-${symbol}`, '', 300);
  const [earningsDate, setEarningsDate] = useStringLocalStorage(`kabunote-earnings-date-${symbol}`, '', 400);
  const [rightsSettings, setRightsSettings] = useStringLocalStorage(`kabunote-rights-settings-${symbol}`, JSON.stringify(createDefaultRightsSettings()), 400);
  const [positions, setPositions] = useArrayLocalStorage<Position>(`kabunote-positions-${symbol}`, [], 200);

  // 権利確定日設定をパース
  const parsedRightsSettings: RightsDateSettings = (() => {
    try {
      return JSON.parse(rightsSettings);
    } catch {
      return createDefaultRightsSettings();
    }
  })();

  // 権利確定日の自動無効化チェック（単発イベントが過去になった場合）
  useEffect(() => {
    if (shouldDeactivateRights(parsedRightsSettings)) {
      const updatedSettings = { ...parsedRightsSettings, isActive: false };
      setRightsSettings(JSON.stringify(updatedSettings));
    }
  }, [parsedRightsSettings, setRightsSettings]);

  // 権利確定日文字列を計算
  const rightsDate = calculateRightsDateFromSettings(parsedRightsSettings);

  // 同期版を使って即座に表示（キャッシュがある場合）
  const companyName = stockData ? stockData.name : getCompanyNameSync(symbol);
  const isKnown = stockData ? true : isKnownStockSync(symbol);

  // この銘柄が含まれているお気に入りグループ
  const belongingGroups = favoriteGroups.filter(group => group.stocks.includes(symbol));

  // ポジションサマリーを計算
  const positionSummary: PositionSummary = calculatePositionSummary(positions);

  // 含み益・含み損を計算
  const profitLossInfo: ProfitLossInfo | null = calculateProfitLoss(
    positionSummary,
    targetPrice ? parseFloat(targetPrice) : undefined,
    stopLoss ? parseFloat(stopLoss) : undefined
  );

  // CSVデータを読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const stockMap = await loadStockData();
        const stock = stockMap.get(symbol);
        setStockData(stock || null);
      } catch (error) {
        console.error('Failed to load stock data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [symbol]);

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

  // 個別タグ削除を処理
  const handleTagRemove = (tagId: string) => {
    const updatedTags = customTags.filter(tag => tag.id !== tagId);
    setCustomTags(updatedTags);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4 transition-all duration-200 h-full flex flex-col ${
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
        onTagRemove={handleTagRemove}
        onRemove={onRemove}
        listeners={listeners}
        isDragging={isDragging}
      />

      {/* チャート確認ボタン（常に表示） */}
      <div className="mb-4">
        <button
          onClick={() => {
            const url = `https://jp.tradingview.com/symbols/TSE-${symbol}/`;
            window.open(url, 'stockChart', 'width=800,height=800,scrollbars=yes,resizable=yes');
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          📈 最新チャートを確認
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className="flex border-b border-gray-600 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label.split(' ')[1]} {/* アイコンの後の文字のみ表示 */}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="tab-content flex-1">
        {activeTab === 'basic' && (
          <BasicTab
            symbol={symbol}
            memo={memo}
            onMemoChange={setMemo}
            onMemoModalOpen={() => setIsMemoModalOpen(true)}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab
            symbol={symbol}
            targetPrice={targetPrice}
            stopLoss={stopLoss}
            currentPrice={currentPrice}
            onTargetPriceChange={setTargetPrice}
            onStopLossChange={setStopLoss}
            onCurrentPriceChange={setCurrentPrice}
            positionSummary={positionSummary}
            profitLossInfo={profitLossInfo}
            positions={positions}
            onPositionManagerOpen={() => setIsPositionManagerOpen(true)}
          />
        )}

        {activeTab === 'management' && (
          <ManagementTab
            symbol={symbol}
            earningsDate={earningsDate}
            onEarningsDateChange={setEarningsDate}
            rightsDate={rightsDate}
            rightsSettings={parsedRightsSettings}
            onRightsSettingsChange={(newSettings) => setRightsSettings(JSON.stringify(newSettings))}
            positionSummary={positionSummary}
          />
        )}
      </div>

      {/* ポジション管理モーダル */}
      {isPositionManagerOpen && (
        <PositionManager
          positions={positions}
          onPositionsChange={setPositions}
          onClose={() => setIsPositionManagerOpen(false)}
        />
      )}

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
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
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
          onTagsChange={setCustomTags}
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
  );
}