import { useState, useEffect } from 'react';
import { loadStockData, getCompanyNameSync, isKnownStockSync, StockData } from '@/data/stockNames';
import { FavoriteGroup } from '@/types/favorites';
import { StockData as DBStockData } from '@/hooks/stock/useStockData';
import { CustomTag } from '@/types/tags';
import { ProfitLossInfo } from '@/types/positions';
import { calculateProfitLoss, calculatePositionSummary } from '@/lib/positionCalc';
import { RightsDateSettings, createDefaultRightsSettings, shouldDeactivateRights } from '@/types/rightsDate';
import { useStringLocalStorage } from '@/hooks/util/useLocalStorage';
import { useTabState } from '@/hooks/tab/useTabState';
import { useNextActionPlan } from '@/hooks/other/useNextActionPlan';
import { useStockMemo } from '@/hooks/stock/useStockMemo';
import { useStockPosition } from '@/hooks/stock/useStockPosition';
import { useStockPrice } from '@/hooks/stock/useStockPrice';
import { useStockEvent } from '@/hooks/stock/useStockEvent';
import { useStockTag } from '@/hooks/stock/useStockTag';
import { useStockAlerts } from '@/hooks/alert/useStockAlerts';
import { useStockNews } from '@/hooks/stock/useStockNews';
import { useCash } from '@/hooks/auth/useCash';
import { stockKey } from '@/lib/storageKeys';

export function useStockCardData(symbol: string, favoriteGroups: FavoriteGroup[], initialStockData?: DBStockData) {
  // 基本状態
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // タブ状態管理
  const { activeTab, setActiveTab, tabs } = useTabState(symbol);

  // メモ
  const {
    memo,
    updateMemo,
    isLoading: isMemoLoading,
    isSaving: isMemoSaving,
    error: memoError,
    lastSaved: memoLastSaved
  } = useStockMemo(`stock-${symbol}`, initialStockData ? { initialData: initialStockData.memo } : undefined);

  // ポジション
  const { positions } = useStockPosition(`stock-${symbol}`, initialStockData ? { initialData: initialStockData.positions } : undefined);

  // タグ
  const { tags: customTags, addTag, removeTag: removeTagFromDB } = useStockTag(`stock-${symbol}`, initialStockData ? { initialData: initialStockData.tags as CustomTag[] } : undefined);

  // 価格情報
  const {
    currentPrice,
    targetPrice,
    stopLoss,
    per,
    pbr,
    setCurrentPrice,
    setTargetPrice,
    setStopLoss,
    setPer,
    setPbr,
  } = useStockPrice(`stock-${symbol}`, initialStockData ? {
    initialData: {
      currentPrice: initialStockData.currentPrice,
      targetPrice: initialStockData.targetPrice,
      stopLossPrice: initialStockData.stopLossPrice,
      per: initialStockData.per ?? null,
      pbr: initialStockData.pbr ?? null,
    }
  } : undefined);

  // 銘柄ニュース
  const {
    newsItems,
    isLoading: isNewsLoading,
    isSaving: isNewsSaving,
    lastSaved: newsLastSaved,
    addNewsItem,
    removeNewsItem,
    updateNewsItem,
  } = useStockNews(`stock-${symbol}`, initialStockData?.newsItems ? { initialData: initialStockData.newsItems } : undefined);

  // 権利確定日設定
  const [rightsSettings, setRightsSettings] = useStringLocalStorage(`kabunote-rights-settings-${symbol}`, JSON.stringify(createDefaultRightsSettings()), 400);

  // イベント
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

  // NextActionPlan
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

  // 権利確定日の自動無効化チェック
  const rightsIsActive = parsedRightsSettings.isActive;
  const rightsIsRecurring = parsedRightsSettings.isRecurring;
  const rightsMonth = parsedRightsSettings.month ?? 0;
  const rightsDay = parsedRightsSettings.day ?? 0;
  useEffect(() => {
    if (parsedRightsSettings.isActive && shouldDeactivateRights(parsedRightsSettings)) {
      const updatedSettings = { ...parsedRightsSettings, isActive: false };
      setRightsSettings(JSON.stringify(updatedSettings));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- parsedRightsSettings はレンダー毎に新規オブジェクト。個別プロパティで依存管理
  }, [
    rightsIsActive,
    rightsIsRecurring,
    rightsMonth,
    rightsDay,
    setRightsSettings
  ]);

  // 銘柄名・既知判定
  const companyName = stockData ? stockData.name : getCompanyNameSync(symbol);
  const isKnown = stockData ? true : isKnownStockSync(symbol);

  // お気に入りグループ
  const belongingGroups = favoriteGroups.filter(group => group.stocks.includes(symbol));

  // ポジションサマリー
  const positionSummary = calculatePositionSummary(positions);

  // 損益計算
  const profitLossInfo: ProfitLossInfo | null = calculateProfitLoss(
    positionSummary,
    targetPrice ? parseFloat(targetPrice) : undefined,
    stopLoss ? parseFloat(stopLoss) : undefined
  );

  // CSVデータ読み込み
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

  // 外部からのタブ切り替え指示
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tabInstruction = localStorage.getItem(stockKey.openTab(symbol));
    if (tabInstruction) {
      localStorage.removeItem(stockKey.openTab(symbol));

      if (tabInstruction === 'dividend' || tabInstruction === 'management') {
        setActiveTab('management');

        if (tabInstruction === 'dividend') {
          setTimeout(() => {
            localStorage.setItem(stockKey.managementTab(symbol), 'dividend');
            window.dispatchEvent(new CustomEvent('localStorageChange', {
              detail: { key: stockKey.managementTab(symbol) }
            }));
          }, 100);
        }
      }
    }
  }, [symbol, setActiveTab]);

  // 投資余力現金
  const { cashAmount } = useCash();
  const availableCash = parseFloat(cashAmount) || 0;

  // アラート計算
  const { alerts: targetPriceAlert, cardStyles } = useStockAlerts(
    symbol,
    nextActionPlan,
    currentPrice,
    targetPrice,
    stopLoss,
    positionSummary,
    availableCash,
  );

  return {
    // 基本状態
    stockData,
    isLoading,
    companyName,
    isKnown,
    belongingGroups,

    // タブ
    activeTab,
    setActiveTab,
    tabs,

    // メモ
    memo,
    updateMemo,
    isMemoLoading,
    isMemoSaving,
    memoError,
    memoLastSaved,

    // ポジション
    positions,
    positionSummary,
    profitLossInfo,

    // 価格
    currentPrice,
    targetPrice,
    stopLoss,
    per,
    pbr,
    setCurrentPrice,
    setTargetPrice,
    setStopLoss,
    setPer,
    setPbr,

    // タグ
    customTags,
    addTag,
    removeTagFromDB,

    // イベント
    earningsDate,
    shareholderMeetingSettings,
    updateEarningsDate,
    updateShareholderMeetingSettings,

    // NextActionPlan
    nextActionPlan,
    updateNap,
    deleteNap,
    isNapLoading,
    isNapSaving,

    // アラート
    targetPriceAlert,
    cardStyles,

    // 銘柄ニュース
    newsItems,
    addNewsItem,
    removeNewsItem,
    updateNewsItem,
    isNewsLoading,
    isNewsSaving,
    newsLastSaved,
  };
}
