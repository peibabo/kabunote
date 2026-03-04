'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadStockData, getCompanyNameSync, isKnownStockSync, StockData } from '@/data/stockNames';
import { FavoriteGroup } from '@/types/favorites';
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
import { getAllActiveAlerts } from '@/utils/alertSystem';

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
  } = useStockMemo(`stock-${symbol}`);

  // 株式ポジション機能（複数ロット管理）
  const {
    positions,
    isLoading: isPositionLoading,
  } = useStockPosition(`stock-${symbol}`);

  const { tags: customTags, addTag, removeTag: removeTagFromDB } = useStockTag(`stock-${symbol}`);

  // 投資規律設定（価格情報）はDB管理（未認証時はlocalStorageフォールバック）
  const {
    currentPrice,
    targetPrice,
    stopLoss,
    setCurrentPrice,
    setTargetPrice,
    setStopLoss,
  } = useStockPrice(`stock-${symbol}`);
  const [rightsSettings, setRightsSettings] = useStringLocalStorage(`kabunote-rights-settings-${symbol}`, JSON.stringify(createDefaultRightsSettings()), 400);
  const {
    earningsDate,
    shareholderMeetingSettings,
    updateEarningsDate,
    updateShareholderMeetingSettings,
  } = useStockEvent(`stock-${symbol}`);

  // NextActionPlan の状態を取得
  const { nextActionPlan } = useNextActionPlan(`stock-${symbol}`);

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

    const tabInstruction = localStorage.getItem(`kabunote-open-tab-${symbol}`);
    if (tabInstruction) {
      // 指示を読み取った後は削除
      localStorage.removeItem(`kabunote-open-tab-${symbol}`);

      // 配当・優待関連は管理タブに移動
      if (tabInstruction === 'dividend' || tabInstruction === 'management') {
        setActiveTab('management');

        // 配当タブの場合は、管理タブ内の配当サブタブも設定
        if (tabInstruction === 'dividend') {
          // 少し遅延させて管理タブがマウントされた後に設定
          setTimeout(() => {
            localStorage.setItem(`kabunote-management-tab-${symbol}`, 'dividend');
            // カスタムイベントを発火して管理タブに通知
            window.dispatchEvent(new CustomEvent('localStorageChange', {
              detail: { key: `kabunote-management-tab-${symbol}` }
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
  const [cashAmount] = useStringLocalStorage('kabunote-cash-amount', '0');
  const availableCash = parseFloat(cashAmount) || 0;

  // アラート再計算用の状態
  const [alertTrigger, setAlertTrigger] = useState(0);

  // localStorage変更監視でアラート表示をリアルタイム更新
  useEffect(() => {
    const handleStorageChange = (event: CustomEvent) => {
      const { key } = event.detail;

      // このカードに関連するキーの変更を検知
      if (key === `kabunote-next-action-plan-${symbol}` ||
          key === `kabunote-current-price-${symbol}` ||
          key === `kabunote-target-price-${symbol}` ||
          key === `kabunote-stop-loss-${symbol}` ||
          key === `kabunote-positions-${symbol}` ||
          key === 'kabunote-cash-amount') {

        // アラート再計算をトリガー（少し遅延させて状態更新を待つ）
        setTimeout(() => {
          setAlertTrigger(prev => prev + 1);
        }, 50); // 50ms遅延
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [symbol]);

  // 統合アラート判定（NextActionPlan + 投資規律設定）
  const targetPriceAlert = useMemo(() => {
    // 直接localStorageから最新のNextActionPlanを取得
    let latestNextActionPlan = nextActionPlan;
    if (typeof window !== 'undefined') {
      try {
        const storedPlan = localStorage.getItem(`kabunote-next-action-plan-${symbol}`);
        if (storedPlan) {
          const parsedPlan = JSON.parse(storedPlan);
          latestNextActionPlan = parsedPlan;
        }
      } catch (e) {
        console.error('Failed to parse Next Action Plan from localStorage:', e);
      }
    }

    // 投資規律の利確目標価格を使用（Next Action Planの目標価格と分離）
    const investmentTargetPrice = parseFloat(targetPrice) || 0;

    if (!latestNextActionPlan) return [];
    const alerts = getAllActiveAlerts(
      latestNextActionPlan,
      parseFloat(currentPrice) || 0,
      investmentTargetPrice, // 投資規律の利確目標のみ使用
      stopLoss,
      positionSummary.totalShares > 0 ? positionSummary : undefined,
      availableCash
    );

    return alerts;
  }, [
    nextActionPlan?.targetPrice,
    nextActionPlan?.targetQuantity,
    nextActionPlan?.actionType,
    nextActionPlan?.priority,
    nextActionPlan?.memo,
    currentPrice,
    targetPrice,
    stopLoss,
    positionSummary,
    availableCash,
    alertTrigger, // 強制再計算トリガー
    isPositionLoading, // ポジション読み込み状態
    positions // ポジションデータ
  ]);

  // アラートに応じたカードスタイルを取得
  const getCardAlertStyles = () => {
    if (!targetPriceAlert || targetPriceAlert.length === 0) {
      return {
        bgClass: 'bg-gray-800',
        borderClass: 'border-gray-700',
        bgAnimationStyle: {}
      };
    }

    // メインアラート（最優先）に基づいてスタイル決定
    const primaryAlert = targetPriceAlert[0];

    switch (primaryAlert.type) {
      case 'insufficient-funds':
      case 'stop-loss-exceeded':
      case 'nextaction-approaching':
        return {
          bgClass: '',
          borderClass: 'border-red-500/40',
          bgAnimationStyle: {
            background: 'linear-gradient(45deg, rgb(31 41 55), rgb(55 31 31))',
            animation: 'bgPulse 2s ease-in-out infinite',
            backgroundSize: '400% 400%'
          }
        };
      case 'stop-loss':
        return {
          bgClass: '',
          borderClass: 'border-red-500/30',
          bgAnimationStyle: {
            background: 'linear-gradient(45deg, rgb(31 41 55), rgb(51 35 35))',
            animation: 'bgPulse 2.5s ease-in-out infinite',
            backgroundSize: '400% 400%'
          }
        };
      case 'target-profit':
        return {
          bgClass: '',
          borderClass: 'border-green-500/30',
          bgAnimationStyle: {
            background: 'linear-gradient(45deg, rgb(31 41 55), rgb(31 51 35))',
            animation: 'bgPulse 2.5s ease-in-out infinite',
            backgroundSize: '400% 400%'
          }
        };
      case 'nextaction-warning':
      default:
        return {
          bgClass: '',
          borderClass: 'border-yellow-500/30',
          bgAnimationStyle: {
            background: 'linear-gradient(45deg, rgb(31 41 55), rgb(51 47 31))',
            animation: 'bgPulse 3s ease-in-out infinite',
            backgroundSize: '400% 400%'
          }
        };
    }
  };

  const cardStyles = getCardAlertStyles();

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
        onRemove={onRemove}
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
          localStorage.setItem(`kabunote-investment-tab-${symbol}`, targetSubTab);

          // カスタムイベントを発火してサブタブコンポーネントに変更を通知
          window.dispatchEvent(new CustomEvent('localStorageChange', {
            detail: { key: `kabunote-investment-tab-${symbol}` }
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
            onClick={() => setActiveTab(tab.id)}
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
              console.log('ポジション管理はこのタブ内で直接編集できます')
            }}
            shareholderMeetingSettings={shareholderMeetingSettings}
            onShareholderMeetingSettingsChange={updateShareholderMeetingSettings}
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