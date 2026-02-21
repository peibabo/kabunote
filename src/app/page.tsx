'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import StockCard from '@/components/StockCard';
import StockInput from '@/components/StockInput';
import FavoriteGroupManager from '@/components/FavoriteGroupManager';
import SearchBar from '@/components/SearchBar';
import InvestmentCalendar from '@/components/InvestmentCalendar';
import PortfolioSummary from '@/components/PortfolioSummary';
import FloatingAddButton from '@/components/FloatingAddButton';
import DataManager from '@/components/DataManager';
import StrategySummaryPage from '@/components/StrategySummaryPage';
import AlertSummaryPage from '@/components/AlertSummaryPage';
import { loadStockData, getStockData } from '@/data/stockNames';
import { Position } from '@/types/positions';
import { FavoriteGroup, GROUP_COLORS } from '@/types/favorites';
import { CustomTag } from '@/types/tags';
import { DividendRightsSettings, ShareholderRightsSettings, ShareholderMeetingSettings, createDefaultDividendRightsSettings, createDefaultShareholderRightsSettings, createDefaultShareholderMeetingSettings } from '@/types/rightsDate';
import { NextActionPlan } from '@/types/nextActionPlan';
import { hasNextActionPlan } from '@/hooks/useNextActionPlan';
import { getIntegratedAlert } from '@/utils/alertSystem';
import { calculatePositionSummary } from '@/types/positions';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

const MAX_STOCKS = 30;
const STORAGE_KEY = 'kabunote-stocks';
const GROUPS_STORAGE_KEY = 'kabunote-favorite-groups';
const FILTER_STORAGE_KEY = 'kabunote-selected-group-filter';
const ORDER_STORAGE_KEY = 'kabunote-stocks-order';

export default function Home() {
  const [stocks, setStocks] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [favoriteGroups, setFavoriteGroups] = useState<FavoriteGroup[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [isStrategySummaryOpen, setIsStrategySummaryOpen] = useState(false);
  const [isAlertSummaryOpen, setIsAlertSummaryOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stockCalendarData, setStockCalendarData] = useState<{ [symbol: string]: { name: string; earningsDate: string; dividendRightsSettings: DividendRightsSettings; shareholderRightsSettings: ShareholderRightsSettings; shareholderMeetingSettings: ShareholderMeetingSettings } }>({});
  const [portfolioData, setPortfolioData] = useState<{ symbol: string; name: string; positions: Position[]; currentPrice: string; sector: string; customTags: CustomTag[]; }[]>([]);

  // デバウンスされたお気に入りグループ保存関数（250ms後に保存）
  const debouncedSaveFavoriteGroups = useDebouncedCallback((groups: FavoriteGroup[]) => {
    if (typeof window !== 'undefined') {
      const groupsJson = JSON.stringify(groups);
      localStorage.setItem(GROUPS_STORAGE_KEY, groupsJson);
      console.log('🌟 お気に入りグループ保存:', `${groups.length}個のグループ:`, groups.map(g => g.name).join(', '));
    }
  }, 250);

  // ドラッグ&ドロップセンサー
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ドラッグ終了ハンドラー
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredStocks.indexOf(active.id as string);
      const newIndex = filteredStocks.indexOf(over.id as string);

      // ソートされた新しい順序を計算
      const newOrder = arrayMove(filteredStocks, oldIndex, newIndex);

      // stocks配列を新しい順序で再構成
      const newStocks = [...stocks];
      const otherStocks = stocks.filter(stock => !filteredStocks.includes(stock));

      // フィルターされた株のみ並び替えて、他の株は元の位置に
      const updatedStocks = [...otherStocks, ...newOrder];

      setStocks(updatedStocks);

      // localStorage に順序を保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updatedStocks));
      }
    }
  };

  // デバッグ用
  console.log('Current favoriteGroups state:', favoriteGroups);

  useEffect(() => {
    const initializeApp = async () => {
      // CSVデータを事前読み込み
      try {
        await loadStockData();
        console.log('Stock data preloaded successfully');
      } catch (error) {
        console.error('Failed to preload stock data:', error);
      }

      // クライアントサイドでのみlocalStorageにアクセス
      if (typeof window !== 'undefined') {
        // 保存されている銘柄と順序を読み込み
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedOrder = localStorage.getItem(ORDER_STORAGE_KEY);

        if (saved) {
          try {
            const parsedStocks = JSON.parse(saved);

            // 保存された順序がある場合は使用、ない場合はデフォルトの順序
            let orderedStocks = parsedStocks;
            if (savedOrder) {
              try {
                const parsedOrder = JSON.parse(savedOrder);
                // 順序配列にあるもののみ使用し、存在しないものは末尾に追加
                const existingStocks = parsedOrder.filter((stock: string) => parsedStocks.includes(stock));
                const newStocks = parsedStocks.filter((stock: string) => !parsedOrder.includes(stock));
                orderedStocks = [...existingStocks, ...newStocks];
              } catch (e) {
                console.error('Failed to load saved order:', e);
              }
            }

            setStocks(orderedStocks);
            console.log('Loaded stocks:', orderedStocks);
          } catch (e) {
            console.error('Failed to load saved stocks:', e);
          }
        }

        // 保存されているお気に入りグループを読み込み
        const savedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
        console.log('Raw saved groups from localStorage:', savedGroups);
        if (savedGroups) {
          try {
            const parsedGroups = JSON.parse(savedGroups);
            console.log('Parsed groups:', parsedGroups);
            setFavoriteGroups(parsedGroups);

            // グループが読み込まれた後、保存されているフィルター状態を復元
            const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
            if (savedFilter && parsedGroups.some((g: FavoriteGroup) => g.id === savedFilter)) {
              // 保存されたグループが実際に存在する場合のみ復元
              setSelectedGroupFilter(savedFilter);
            }
          } catch (e) {
            console.error('Failed to load saved groups:', e);
          }
        } else {
          console.log('No saved groups found in localStorage');
        }
      }

      setIsInitialized(true);
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
      console.log('Saved stocks:', stocks);
    }
  }, [stocks, isInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      // デバウンスで保存
      debouncedSaveFavoriteGroups(favoriteGroups);

      // 選択されているグループが削除された場合、フィルターをクリア
      if (selectedGroupFilter && !favoriteGroups.some(g => g.id === selectedGroupFilter)) {
        handleGroupFilterChange(null);
      }
    }
  }, [favoriteGroups, isInitialized, selectedGroupFilter, debouncedSaveFavoriteGroups]);

  // カレンダー用データの更新
  useEffect(() => {
    const updateCalendarData = async () => {
      if (!isInitialized || stocks.length === 0) return;

      const calendarData: { [symbol: string]: { name: string; earningsDate: string; dividendRightsSettings: DividendRightsSettings; shareholderRightsSettings: ShareholderRightsSettings; shareholderMeetingSettings: ShareholderMeetingSettings } } = {};

      // 株式データを読み込み
      await loadStockData();

      for (const symbol of stocks) {
        const stockInfo = await getStockData(symbol);

        // 決算発表日を取得
        const earningsDate = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-earnings-date-${symbol}`) || ''
          : '';

        // 配当権利確定日設定を取得
        const dividendRightsSettingsStr = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-dividend-rights-settings-${symbol}`)
          : null;

        let dividendRightsSettings: DividendRightsSettings;
        try {
          dividendRightsSettings = dividendRightsSettingsStr
            ? JSON.parse(dividendRightsSettingsStr)
            : createDefaultDividendRightsSettings();
        } catch {
          dividendRightsSettings = createDefaultDividendRightsSettings();
        }

        // 株主優待権利確定日設定を取得
        const shareholderRightsSettingsStr = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-shareholder-rights-settings-${symbol}`)
          : null;

        let shareholderRightsSettings: ShareholderRightsSettings;
        try {
          shareholderRightsSettings = shareholderRightsSettingsStr
            ? JSON.parse(shareholderRightsSettingsStr)
            : createDefaultShareholderRightsSettings();
        } catch {
          shareholderRightsSettings = createDefaultShareholderRightsSettings();
        }

        // 株主総会設定を取得
        const shareholderMeetingSettingsStr = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-shareholder-meeting-${symbol}`)
          : null;

        let shareholderMeetingSettings: ShareholderMeetingSettings;
        try {
          shareholderMeetingSettings = shareholderMeetingSettingsStr
            ? JSON.parse(shareholderMeetingSettingsStr)
            : createDefaultShareholderMeetingSettings();
        } catch {
          shareholderMeetingSettings = createDefaultShareholderMeetingSettings();
        }

        calendarData[symbol] = {
          name: stockInfo?.name || symbol,
          earningsDate,
          dividendRightsSettings,
          shareholderRightsSettings,
          shareholderMeetingSettings
        };
      }

      setStockCalendarData(calendarData);
    };

    updateCalendarData();
  }, [stocks, isInitialized]);

  // カレンダーデータのリアルタイム更新
  useEffect(() => {
    if (!isInitialized) return;

    const handleStorageChange = (event: CustomEvent) => {
      const { key } = event.detail;

      // カレンダー関連のキーかチェック
      if (key.includes('earnings-date-') ||
          key.includes('dividend-rights-settings-') ||
          key.includes('shareholder-rights-settings-') ||
          key.includes('shareholder-meeting-')) {

        // カレンダーデータを再更新
        const updateCalendarData = async () => {
          if (stocks.length === 0) return;

          const calendarData: { [symbol: string]: { name: string; earningsDate: string; dividendRightsSettings: DividendRightsSettings; shareholderRightsSettings: ShareholderRightsSettings; shareholderMeetingSettings: ShareholderMeetingSettings } } = {};

          await loadStockData();

          for (const symbol of stocks) {
            const stockInfo = await getStockData(symbol);

            // 決算発表日を取得
            const earningsDate = localStorage.getItem(`kabunote-earnings-date-${symbol}`) || '';

            // 配当権利確定日設定を取得
            const dividendRightsSettingsStr = localStorage.getItem(`kabunote-dividend-rights-settings-${symbol}`);
            let dividendRightsSettings: DividendRightsSettings;
            try {
              dividendRightsSettings = dividendRightsSettingsStr
                ? JSON.parse(dividendRightsSettingsStr)
                : createDefaultDividendRightsSettings();
            } catch {
              dividendRightsSettings = createDefaultDividendRightsSettings();
            }

            // 株主優待権利確定日設定を取得
            const shareholderRightsSettingsStr = localStorage.getItem(`kabunote-shareholder-rights-settings-${symbol}`);
            let shareholderRightsSettings: ShareholderRightsSettings;
            try {
              shareholderRightsSettings = shareholderRightsSettingsStr
                ? JSON.parse(shareholderRightsSettingsStr)
                : createDefaultShareholderRightsSettings();
            } catch {
              shareholderRightsSettings = createDefaultShareholderRightsSettings();
            }

            // 株主総会設定を取得
            const shareholderMeetingSettingsStr = localStorage.getItem(`kabunote-shareholder-meeting-${symbol}`);
            let shareholderMeetingSettings: ShareholderMeetingSettings;
            try {
              shareholderMeetingSettings = shareholderMeetingSettingsStr
                ? JSON.parse(shareholderMeetingSettingsStr)
                : createDefaultShareholderMeetingSettings();
            } catch {
              shareholderMeetingSettings = createDefaultShareholderMeetingSettings();
            }

            calendarData[symbol] = {
              name: stockInfo?.name || symbol,
              earningsDate,
              dividendRightsSettings,
              shareholderRightsSettings,
              shareholderMeetingSettings
            };
          }

          setStockCalendarData(calendarData);
        };

        updateCalendarData();
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [isInitialized, stocks]);

  // ポートフォリオ用データの更新
  useEffect(() => {
    const updatePortfolioData = async () => {
      if (!isInitialized || stocks.length === 0) return;

      const portfolio: { symbol: string; name: string; positions: Position[]; currentPrice: string; sector: string; customTags: CustomTag[]; }[] = [];

      // 株式データを読み込み
      await loadStockData();

      for (const symbol of stocks) {
        const stockInfo = await getStockData(symbol);

        // ポジション情報を取得
        const positionsStr = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-positions-${symbol}`)
          : null;

        let positions: Position[] = [];
        try {
          positions = positionsStr ? JSON.parse(positionsStr) : [];
        } catch {
          positions = [];
        }

        // 現在株価を取得
        const currentPrice = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-current-price-${symbol}`) || ''
          : '';

        // カスタムタグを取得
        const tagsStr = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-tags-${symbol}`)
          : null;

        let customTags: CustomTag[] = [];
        try {
          customTags = tagsStr ? JSON.parse(tagsStr) : [];
        } catch {
          customTags = [];
        }

        // ポジションを持つ銘柄のみ追加
        if (positions.length > 0) {
          portfolio.push({
            symbol,
            name: stockInfo?.name || symbol,
            positions,
            currentPrice,
            sector: stockInfo?.sector || 'その他',
            customTags
          });
        }
      }

      setPortfolioData(portfolio);
    };

    updatePortfolioData();
  }, [stocks, isInitialized]);

  // ポートフォリオデータのリアルタイム更新
  useEffect(() => {
    if (!isInitialized) return;

    const handleStorageChange = (event: CustomEvent) => {
      const { key } = event.detail;

      // ポートフォリオ関連のキーかチェック
      if (key.includes('positions-') ||
          key.includes('current-price-') ||
          key.includes('tags-') ||
          key.includes('dividend-per-share-') ||
          key.includes('dividend-frequency-') ||
          key.includes('estimated-value-') ||
          key.includes('minimum-shares-') ||
          key.includes('benefit-description-')) {

        // ポートフォリオデータを再更新
        const updatePortfolioData = async () => {
          if (stocks.length === 0) return;

          const portfolio: { symbol: string; name: string; positions: Position[]; currentPrice: string; sector: string; customTags: CustomTag[]; }[] = [];

          await loadStockData();

          for (const symbol of stocks) {
            const stockInfo = await getStockData(symbol);

            // ポジション情報を取得
            const positionsStr = localStorage.getItem(`kabunote-positions-${symbol}`);
            let positions: Position[] = [];
            try {
              positions = positionsStr ? JSON.parse(positionsStr) : [];
            } catch {
              positions = [];
            }

            // 現在株価を取得
            const currentPrice = localStorage.getItem(`kabunote-current-price-${symbol}`) || '';

            // カスタムタグを取得
            const tagsStr = localStorage.getItem(`kabunote-tags-${symbol}`);
            let customTags: CustomTag[] = [];
            try {
              customTags = tagsStr ? JSON.parse(tagsStr) : [];
            } catch {
              customTags = [];
            }

            // ポジションを持つ銘柄のみ追加
            if (positions.length > 0) {
              portfolio.push({
                symbol,
                name: stockInfo?.name || symbol,
                positions,
                currentPrice,
                sector: stockInfo?.sector || 'その他',
                customTags
              });
            }
          }

          setPortfolioData(portfolio);
        };

        updatePortfolioData();
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [isInitialized, stocks]);

  const handleAddStock = (code: string) => {
    if (stocks.length >= MAX_STOCKS) {
      setError(`最大${MAX_STOCKS}銘柄まで表示できます`);
      return;
    }

    if (stocks.includes(code)) {
      setError('この銘柄は既に追加されています');
      return;
    }

    const newStocks = [...stocks, code];
    setStocks(newStocks);
    setError('');

    // localStorage に順序を保存
    if (typeof window !== 'undefined') {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(newStocks));
    }

    // お気に入りグループフィルターが選択されている場合、自動的にそのグループに追加
    if (selectedGroupFilter) {
      const updatedGroups = favoriteGroups.map(group => {
        if (group.id === selectedGroupFilter) {
          // 既にグループに含まれていない場合のみ追加
          if (!group.stocks.includes(code)) {
            return { ...group, stocks: [...group.stocks, code] };
          }
        }
        return group;
      });
      setFavoriteGroups(updatedGroups);
    }
  };

  const handleRemoveStock = (code: string) => {
    const newStocks = stocks.filter(stock => stock !== code);
    setStocks(newStocks);
    setError('');

    // localStorage に順序を保存
    if (typeof window !== 'undefined') {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(newStocks));
    }

    // クライアントサイドでのみlocalStorageにアクセス
    if (typeof window !== 'undefined') {
      // メモも削除
      localStorage.removeItem(`kabunote-memo-${code}`);
      // タグも削除
      localStorage.removeItem(`kabunote-tags-${code}`);
    }

    // お気に入りグループからも削除
    const updatedGroups = favoriteGroups.map(group => ({
      ...group,
      stocks: group.stocks.filter(s => s !== code)
    }));
    setFavoriteGroups(updatedGroups);
  };

  // フィルター変更時に状態を保存
  const handleGroupFilterChange = (groupId: string | null) => {
    setSelectedGroupFilter(groupId);
    if (typeof window !== 'undefined') {
      if (groupId) {
        localStorage.setItem(FILTER_STORAGE_KEY, groupId);
      } else {
        localStorage.removeItem(FILTER_STORAGE_KEY);
      }
    }
  };

  // 銘柄カードへのスムーススクロール
  const handleStockClick = (symbol: string) => {
    const element = document.getElementById(`stock-card-${symbol}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // スクロール後にカードを少し強調表示
      element.style.transform = 'scale(1.02)';
      element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
      setTimeout(() => {
        element.style.transform = '';
        element.style.boxShadow = '';
        element.style.transition = 'all 0.3s ease';
      }, 1000);
    }
  };

  // データインポート後のページリロード
  const handleDataImported = () => {
    window.location.reload();
  };

  // 投資カレンダーにデータがあるかどうかを判定
  const hasCalendarData = Object.values(stockCalendarData).some(data => {
    return data.earningsDate ||
           (data.dividendRightsSettings.isActive && data.dividendRightsSettings.month && data.dividendRightsSettings.day) ||
           (data.shareholderRightsSettings.isActive && data.shareholderRightsSettings.month && data.shareholderRightsSettings.day) ||
           (data.shareholderMeetingSettings && data.shareholderMeetingSettings.isActive && data.shareholderMeetingSettings.month && data.shareholderMeetingSettings.day);
  });

  // ポートフォリオデータがあるかどうかを判定
  const hasPortfolioData = portfolioData.length > 0;

  // 次のステップのヒントが必要かどうかを判定
  const shouldShowHints = stocks.length > 0 && (!hasPortfolioData || !hasCalendarData);

  // 検索機能
  const searchStocks = async (stocks: string[], query: string): Promise<string[]> => {
    if (!query || query.length < 2) return stocks;

    // クエリを正規化（全角→半角、大文字→小文字、カタカナ→ひらがな）
    const normalizedQuery = query
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
      })
      .replace(/[\u30A1-\u30F6]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0x60);
      })
      .toLowerCase();

    const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 0);

    // 株式データを事前に読み込み
    await loadStockData();

    const results: string[] = [];

    for (const stockCode of stocks) {
      // 検索対象データを準備
      const stockInfo = await getStockData(stockCode);

      const searchData = {
        code: stockCode,
        // 会社名を取得
        name: stockInfo?.name || '',
        // 業種を取得
        sector: stockInfo?.sector || '',
        // 市場を取得
        market: stockInfo?.market || '',
        // メモを取得
        memo: typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-memo-${stockCode}`) || ''
          : '',
        // タグを取得
        tags: typeof window !== 'undefined'
          ? (() => {
              try {
                const savedTags = localStorage.getItem(`kabunote-tags-${stockCode}`);
                return savedTags ? JSON.parse(savedTags).map((tag: any) => tag.label).join(' ') : '';
              } catch {
                return '';
              }
            })()
          : '',
        // グループ名を取得
        groups: favoriteGroups
          .filter(group => group.stocks.includes(stockCode))
          .map(group => group.name)
          .join(' ')
      };

      // 検索対象テキストを結合して正規化
      const searchText = [
        searchData.code,
        searchData.name,
        searchData.sector,
        searchData.market,
        searchData.memo,
        searchData.tags,
        searchData.groups
      ].join(' ')
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
          return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
        })
        .replace(/[\u30A1-\u30F6]/g, (char) => {
          return String.fromCharCode(char.charCodeAt(0) - 0x60);
        })
        .toLowerCase();

      // すべての検索語が含まれているかチェック（AND検索）
      if (searchTerms.every(term => searchText.includes(term))) {
        results.push(stockCode);
      }
    }

    return results;
  };

  // 検索処理のuseEffect
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        // グループフィルターが適用されている場合はそれを考慮
        const baseStocks = selectedGroupFilter
          ? stocks.filter(stock => {
              const group = favoriteGroups.find(g => g.id === selectedGroupFilter);
              return group?.stocks.includes(stock);
            })
          : stocks;

        const results = await searchStocks(baseStocks, searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, stocks, selectedGroupFilter, favoriteGroups]);

  // フィルタリングされた株式リスト
  const filteredStocks = searchQuery.trim()
    ? searchResults
    : selectedGroupFilter
    ? stocks.filter(stock => {
        const group = favoriteGroups.find(g => g.id === selectedGroupFilter);
        return group?.stocks.includes(stock);
      })
    : stocks;

  // アラート件数を計算（リアルタイム更新対応）
  const [alertCounts, setAlertCounts] = useState({ total: 0, urgent: 0 });

  const calculateAlertCounts = useCallback(() => {
    if (!isInitialized || stocks.length === 0) {
      return { total: 0, urgent: 0 };
    }

    const cashAmount = typeof window !== 'undefined' ? localStorage.getItem('kabunote-cash-amount') || '0' : '0';
    const availableCash = parseFloat(cashAmount) || 0;

    let totalAlerts = 0;
    let urgentAlerts = 0;

    stocks.forEach(symbol => {
      // 現在価格チェック（NextActionPlanの有無に関係なく）
      const currentPriceStr = typeof window !== 'undefined' ? localStorage.getItem(`kabunote-current-price-${symbol}`) || '0' : '0';
      const targetPriceStr = typeof window !== 'undefined' ? localStorage.getItem(`kabunote-target-price-${symbol}`) || '0' : '0';
      const stopLossStr = typeof window !== 'undefined' ? localStorage.getItem(`kabunote-stop-loss-${symbol}`) || '0' : '0';
      const currentPrice = parseFloat(currentPriceStr);

      if (currentPrice <= 0) return; // 現在価格未設定はスキップ

      try {
        // NextActionPlanを取得（なくても投資規律アラートはチェック）
        const planData = typeof window !== 'undefined' ? localStorage.getItem(`kabunote-next-action-plan-${symbol}`) : null;
        let plan: NextActionPlan;

        if (planData) {
          plan = JSON.parse(planData);
        } else {
          // NextActionPlanがない場合はデフォルトプラン作成
          plan = {
            targetPrice: 0,
            targetQuantity: 0,
            memo: '',
            actionType: 'buy',
            priority: 'medium'
          };
        }

        // ポジション情報取得
        const positionsData = typeof window !== 'undefined' ? localStorage.getItem(`kabunote-positions-${symbol}`) : null;
        let positionSummary = null;
        if (positionsData) {
          try {
            const positions = JSON.parse(positionsData);
            positionSummary = calculatePositionSummary(positions);
          } catch (e) {
            // Ignore parsing errors
          }
        }

        const alert = getIntegratedAlert(
          plan,
          currentPrice,
          targetPriceStr,
          stopLossStr,
          positionSummary && positionSummary.totalShares > 0 ? positionSummary : undefined,
          availableCash
        );

        if (alert.type !== 'none') {
          totalAlerts++;
          // 緊急アラート判定（資金不足・損切り超過・次の一手緊急）
          if (alert.type === 'insufficient-funds' ||
              alert.type === 'stop-loss-exceeded' ||
              alert.type === 'nextaction-approaching') {
            urgentAlerts++;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });

    return { total: totalAlerts, urgent: urgentAlerts };
  }, [stocks, isInitialized]);

  // 初期アラート件数計算 & stocks/isInitialized変更時の再計算
  useEffect(() => {
    const counts = calculateAlertCounts();
    setAlertCounts(counts);
  }, [calculateAlertCounts]);

  // localStorage変更監視でアラート件数をリアルタイム更新
  useEffect(() => {
    if (!isInitialized) return;

    const handleStorageChange = (event: CustomEvent) => {
      const { key } = event.detail;

      // アラートに影響するキーの変更を検知
      if (key.includes('current-price-') ||
          key.includes('target-price-') ||
          key.includes('stop-loss-') ||
          key.includes('next-action-plan-') ||
          key.includes('positions-') ||
          key === 'kabunote-cash-amount') {

        // アラート件数を再計算
        setTimeout(() => {
          const counts = calculateAlertCounts();
          setAlertCounts(counts);
        }, 100); // 少し遅延させて確実にデータが更新された後に計算
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [isInitialized, calculateAlertCounts]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with Logo */}
      <header className="bg-slate-900 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center gap-4 group cursor-default flex-1">
            <img
              src="/kabunote-logo.png"
              alt="Kabunote Logo"
              className="h-16 w-auto transition-all duration-300"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
              }}
            />
            <h1
              className="text-3xl text-white tracking-wider transition-all duration-300"
              style={{
                fontFamily: '"M PLUS 1p", sans-serif',
                fontWeight: 100,
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
              }}
            >
              カブノオト
            </h1>
            <style jsx>{`
              .group:hover img {
                filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.2)) !important;
              }
              .group:hover h1 {
                filter: drop-shadow(0 0 25px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 75px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 100px rgba(255, 255, 255, 0.1)) !important;
              }
            `}</style>
            </div>

            {/* ナビゲーションボタン */}
            <div className="flex-shrink-0 flex gap-2">
              {/* アラート一覧ボタン */}
              <button
                onClick={() => setIsAlertSummaryOpen(true)}
                className={`p-2 cursor-pointer rounded-lg transition-all duration-200 relative ${
                  alertCounts.total === 0
                    ? 'text-gray-600 hover:text-gray-400 hover:bg-gray-700'
                    : alertCounts.urgent > 0
                    ? 'text-red-400 hover:bg-red-900/20 animate-pulse'
                    : alertCounts.total >= 4
                    ? 'text-red-400 hover:bg-red-900/20 animate-bounce'
                    : 'text-yellow-400 hover:bg-yellow-900/20 animate-pulse'
                }`}
                title="アラート一覧"
                style={{
                  animationDuration: alertCounts.urgent > 0 ? '0.5s' : alertCounts.total >= 4 ? '1s' : '2s'
                }}
              >
                <span className="text-xl">🚨</span>
                {alertCounts.total > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {alertCounts.total > 9 ? '9+' : alertCounts.total}
                  </span>
                )}
              </button>

              {/* 戦略一覧ボタン */}
              <button
                onClick={() => setIsStrategySummaryOpen(true)}
                className="p-2 cursor-pointer text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="戦略一覧"
              >
                <span className="text-xl">🎯</span>
              </button>

              {/* データ管理ボタン */}
              <button
                onClick={() => setIsDataManagerOpen(true)}
                className="p-2 cursor-pointer text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="データ管理"
              >
                <span className="text-xl">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-400">投資家の思考を整理するダッシュボード</p>
            </div>
            <div className="md:w-80">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>

          {/* 外部分析リンク */}
          <div className="flex flex-wrap gap-3 mb-4">
            <a
              href="https://kabutan.jp/warning/record_w52_high_price&dispmode=normal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="text-lg">📈</span>
              <span>本日、52週高値を更新した銘柄</span>
              <span className="text-xs opacity-80">（株探）</span>
            </a>

            <a
              href="https://sekai-kabuka.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="text-lg">🌍</span>
              <span>世界の株価</span>
            </a>

            <a
              href="https://www.release.tdnet.info/inbs/I_main_00.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="text-lg">📋</span>
              <span>適時開示情報</span>
            </a>
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
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  検索をクリア
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ポートフォリオサマリー */}
        <PortfolioSummary portfolioData={portfolioData} />

        {/* 投資カレンダー */}
        {stocks.length > 0 && hasCalendarData && (
          <InvestmentCalendar
            stockSymbols={stocks}
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
        disabled={stocks.length >= MAX_STOCKS}
        selectedGroupInfo={
          selectedGroupFilter
            ? {
                name: favoriteGroups.find(g => g.id === selectedGroupFilter)?.name || '',
                color: favoriteGroups.find(g => g.id === selectedGroupFilter)?.color || 'blue'
              }
            : null
        }
        isFirstTime={stocks.length === 0}
      />

        {/* お気に入りグループフィルター */}
        {favoriteGroups.length > 0 && stocks.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">⭐ お気に入りグループ</h3>
              <button
                onClick={() => setIsGroupManagerOpen(true)}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                グループ管理
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGroupFilterChange(null)}
                className={`cursor-pointer text-sm px-3 py-2 rounded-full transition-colors ${
                  selectedGroupFilter === null
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                すべて ({stocks.length})
              </button>
              {favoriteGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupFilterChange(group.id)}
                  className={`cursor-pointer text-sm px-3 py-2 rounded-full transition-colors ${
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
        {favoriteGroups.length === 0 && stocks.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-400 text-sm mb-3">お気に入りグループを作成して銘柄を整理しましょう</p>
            <button
              onClick={() => setIsGroupManagerOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              グループを作成
            </button>
          </div>
        )}

        <div>
          {filteredStocks.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              {stocks.length === 0 ? (
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
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredStocks} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{gridAutoRows: '1fr'}}>
                  {filteredStocks.map((stock) => (
                    <div key={stock} id={`stock-card-${stock}`} className="h-full">
                      <StockCard
                        symbol={stock}
                        onRemove={() => handleRemoveStock(stock)}
                        favoriteGroups={favoriteGroups}
                        onFavoriteGroupsChange={setFavoriteGroups}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* グループ管理モーダル */}
        {isGroupManagerOpen && (
          <FavoriteGroupManager
            groups={favoriteGroups}
            onGroupsChange={setFavoriteGroups}
            onClose={() => setIsGroupManagerOpen(false)}
          />
        )}

        {/* データ管理モーダル */}
        {isDataManagerOpen && (
          <DataManager
            onClose={() => setIsDataManagerOpen(false)}
            onDataImported={handleDataImported}
          />
        )}

        {/* アラート一覧モーダル */}
        {isAlertSummaryOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-4 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">🚨 アラート一覧</h2>
                <button
                  onClick={() => setIsAlertSummaryOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-8rem)]">
                <AlertSummaryPage />
              </div>
            </div>
          </div>
        )}

        {/* 戦略一覧ダッシュボードモーダル */}
        {isStrategySummaryOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-4 max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">🎯 戦略一覧ダッシュボード</h2>
                <button
                  onClick={() => setIsStrategySummaryOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-8rem)]">
                <StrategySummaryPage />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
