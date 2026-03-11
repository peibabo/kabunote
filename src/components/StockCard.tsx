'use client';

import { useState, useEffect, memo } from 'react';
import { loadStockData, getCompanyNameSync, isKnownStockSync, StockData } from '@/data/stockNames';
import { FavoriteGroup } from '@/types/favorites';
import { StockData as DBStockData } from '@/hooks/useStockData';
import { CustomTag } from '@/types/tags';
import { ProfitLossInfo, calculateProfitLoss, calculatePositionSummary } from '@/types/positions';
import { RightsDateSettings, createDefaultRightsSettings, calculateRightsDateFromSettings, shouldDeactivateRights } from '@/types/rightsDate';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStringLocalStorage } from '@/hooks/useLocalStorage';
import { useTabState } from '@/hooks/useTabState';
import { useNextActionPlan } from '@/hooks/useNextActionPlan';
import { useStockMemo } from '@/hooks/useStockMemo';
import { useStockPosition } from '@/hooks/useStockPosition';
import { useStockPrice } from '@/hooks/useStockPrice';
import { useStockEvent } from '@/hooks/useStockEvent';
import { useStockTag } from '@/hooks/useStockTag';
import { useStockAlerts } from '@/hooks/useStockAlerts';
import { useCash } from '@/hooks/useCash';
import { stockKey } from '@/lib/storageKeys';
import { playSound } from '@/lib/sound';

// Components
import StockCardHeader from './StockCardHeader';
import BasicTab from './BasicTab';
import InvestmentStrategyTab from './InvestmentStrategyTab';
import ManagementTab from './ManagementTab';
import AlertDisplay from './AlertDisplay';
import TagEditor from './TagEditor';
import FavoriteGroupSelector from './FavoriteGroupSelector';

interface StockCardProps {
  symbol: string;
  onRemove: (symbol: string) => void;
  favoriteGroups: FavoriteGroup[];
  onFavoriteGroupsChange: (groups: FavoriteGroup[]) => void;
  initialStockData?: DBStockData;
}

function StockCard({ symbol, onRemove, favoriteGroups, onFavoriteGroupsChange, initialStockData }: StockCardProps) {
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
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);

  // タブ状態管理
  const { activeTab, setActiveTab, tabs, isLoading: isTabLoading } = useTabState(symbol);

  // データ管理（ハイブリッドシステム：認証済み→DB、未認証→localStorage）
  const {
    memo,
    updateMemo,
    isLoading: isMemoLoading,
    isSaving: isMemoSaving,
    error: memoError,
    lastSaved: memoLastSaved
  } = useStockMemo(`stock-${symbol}`, initialStockData ? { initialData: initialStockData.memo } : undefined);

  // 株式ポジション機能（複数ロット管理）
  const {
    positions,
    isLoading: isPositionLoading,
  } = useStockPosition(`stock-${symbol}`, initialStockData ? { initialData: initialStockData.positions } : undefined);

  const { tags: customTags, addTag, removeTag: removeTagFromDB } = useStockTag(`stock-${symbol}`, initialStockData ? { initialData: initialStockData.tags as CustomTag[] } : undefined);

  // 投資規律設定（価格情報）はDB管理（未認証時はlocalStorageフォールバック）
  const {
    currentPrice,
    targetPrice,
    stopLoss,
    setCurrentPrice,
    setTargetPrice,
    setStopLoss,
  } = useStockPrice(`stock-${symbol}`, initialStockData ? {
    initialData: {
      currentPrice: initialStockData.currentPrice,
      targetPrice: initialStockData.targetPrice,
      stopLossPrice: initialStockData.stopLossPrice,
    }
  } : undefined);
  const [rightsSettings, setRightsSettings] = useStringLocalStorage(`kabunote-rights-settings-${symbol}`, JSON.stringify(createDefaultRightsSettings()), 400);
  const {
    earningsDate,
    shareholderMeetingSettings,
    updateEarningsDate,
    updateShareholderMeetingSettings,
  } = useStockEvent(`stock-${symbol}`, initialStockData ? {
    initialData: {
      earnings: (() => {
        const e = initialStockData.events.find(ev => ev.eventType === 'EARNINGS');
        return e ? { eventDate: e.eventDate } : null;
      })(),
      shareholderMeeting: (() => {
        const m = initialStockData.events.find(ev => ev.eventType === 'SHAREHOLDER_MEETING');
        return m ? { eventMonth: m.eventMonth, eventDay: m.eventDay, isRecurring: m.isRecurring, isActive: m.isActive } : null;
      })(),
    }
  } : undefined);

  // NextActionPlan の状態を取得（StockCard で一元管理し、子コンポーネントに props で渡す）
  const {
    nextActionPlan,
    updateNextActionPlan: updateNap,
    deleteNextActionPlan: deleteNap,
    isLoading: isNapLoading,
    isSaving: isNapSaving,
  } = useNextActionPlan(`stock-${symbol}`, initialStockData?.nextActionPlan ? {
    initialData: {
      id: 'db',
      actionType: initialStockData.nextActionPlan.actionType as 'buy' | 'sell' | 'hold',
      priority: initialStockData.nextActionPlan.priority as 'high' | 'medium' | 'low',
      targetPrice: initialStockData.nextActionPlan.targetPrice,
      targetQuantity: initialStockData.nextActionPlan.targetShares,
      memo: initialStockData.nextActionPlan.strategyMemo,
      updatedAt: new Date().toISOString(),
    }
  } : undefined);

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
    if (parsedRightsSettings.isActive && shouldDeactivateRights(parsedRightsSettings)) {
      const updatedSettings = { ...parsedRightsSettings, isActive: false };
      setRightsSettings(JSON.stringify(updatedSettings));
    }
  }, [
    parsedRightsSettings.isActive,
    parsedRightsSettings.isRecurring,
    parsedRightsSettings.month ?? 0,
    parsedRightsSettings.day ?? 0,
    setRightsSettings
  ]);

  // 株主総会設定の自動無効化チェック（一時的に無効化）
  // useEffect(() => {
  //   if (parsedShareholderMeetingSettings.isActive && shouldDeactivateShareholderMeeting(parsedShareholderMeetingSettings)) {
  //     const updatedSettings = { ...parsedShareholderMeetingSettings, isActive: false };
  //     setShareholderMeetingSettings(JSON.stringify(updatedSettings));
  //   }
  // }, [
  //   parsedShareholderMeetingSettings.isActive,
  //   parsedShareholderMeetingSettings.isRecurring,
  //   parsedShareholderMeetingSettings.month ?? 0,
  //   parsedShareholderMeetingSettings.day ?? 0,
  //   setShareholderMeetingSettings
  // ]);

  // 権利確定日文字列を計算
  const rightsDate = calculateRightsDateFromSettings(parsedRightsSettings);

  // 同期版を使って即座に表示（キャッシュがある場合）
  const companyName = stockData ? stockData.name : getCompanyNameSync(symbol);
  const isKnown = stockData ? true : isKnownStockSync(symbol);

  // この銘柄が含まれているお気に入りグループ
  const belongingGroups = favoriteGroups.filter(group => group.stocks.includes(symbol));

  // ポジションサマリーを複数ポジション配列から計算
  const positionSummary = calculatePositionSummary(positions);

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

  // 外部からのタブ切り替え指示を処理
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tabInstruction = localStorage.getItem(stockKey.openTab(symbol));
    if (tabInstruction) {
      // 指示を読み取った後は削除
      localStorage.removeItem(stockKey.openTab(symbol));

      // 配当・優待関連は管理タブに移動
      if (tabInstruction === 'dividend' || tabInstruction === 'management') {
        setActiveTab('management');

        // 配当タブの場合は、管理タブ内の配当サブタブも設定
        if (tabInstruction === 'dividend') {
          // 少し遅延させて管理タブがマウントされた後に設定
          setTimeout(() => {
            localStorage.setItem(stockKey.managementTab(symbol), 'dividend');
            // カスタムイベントを発火して管理タブに通知
            window.dispatchEvent(new CustomEvent('localStorageChange', {
              detail: { key: stockKey.managementTab(symbol) }
            }));
          }, 100);
        }
      }
    }
  }, [symbol, setActiveTab]);

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
    removeTagFromDB(tagId);
  };

  // 投資余力現金を取得
  const { cashAmount } = useCash();
  const availableCash = parseFloat(cashAmount) || 0;

  // アラート計算（localStorage変更リアルタイム監視・カードスタイル算出を含む）
  const { alerts: targetPriceAlert, cardStyles } = useStockAlerts(
    symbol,
    nextActionPlan,
    currentPrice,
    targetPrice,
    stopLoss,
    positionSummary,
    availableCash,
    isPositionLoading,
  );

  return (
    <>
      {/* カスタムCSS（背景アニメーション） */}
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
        onTagRemove={handleTagRemove}
        onRemove={() => onRemove(symbol)}
        listeners={listeners}
        isDragging={isDragging}
      />

      {/* 統合アラート表示（NextActionPlan + 投資規律設定） */}
      <AlertDisplay
        alerts={targetPriceAlert}
        onClick={() => {
          setActiveTab('analysis');
          // アラート種類に応じて適切なサブタブに移動（メインアラート基準）
          const primaryAlert = targetPriceAlert.length > 0 ? targetPriceAlert[0] : null;
          const targetSubTab = (primaryAlert?.type === 'nextaction-approaching' ||
                               primaryAlert?.type === 'nextaction-warning' ||
                               primaryAlert?.type === 'insufficient-funds')
                               ? 'nextaction' : 'analysis';

          // サブタブの状態を更新
          localStorage.setItem(stockKey.investmentTab(symbol), targetSubTab);

          // カスタムイベントを発火してサブタブコンポーネントに変更を通知
          window.dispatchEvent(new CustomEvent('localStorageChange', {
            detail: { key: stockKey.investmentTab(symbol) }
          }));
        }}
      />

      {/* チャート確認ボタン（常に表示） */}
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
            rightsDate={rightsDate}
            rightsSettings={parsedRightsSettings}
            onRightsSettingsChange={(newSettings) => setRightsSettings(JSON.stringify(newSettings))}
            onPositionManagerOpen={() => {
              // DB統合版では管理タブ内で直接編集するため、何もしない
            }}
            shareholderMeetingSettings={shareholderMeetingSettings}
            onShareholderMeetingSettingsChange={updateShareholderMeetingSettings}
            positionSummary={positionSummary}
            initialPositions={initialStockData?.positions}
            initialDividend={initialStockData ? (initialStockData.dividend ?? null) : undefined}
            initialBenefit={initialStockData ? (initialStockData.benefit ?? null) : undefined}
          />
        )}
      </div>

      {/* ポジション管理モーダル - DB統合版では不要（管理タブで直接編集） */}

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

  // favoriteGroups: この銘柄が属するグループだけ比較
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

  // グループ名・色の変更も検知
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