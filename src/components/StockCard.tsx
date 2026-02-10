'use client';

import { useState, useEffect } from 'react';
import { loadStockData, getCompanyNameSync, isKnownStockSync, StockData } from '@/data/stockNames';
import { CustomTag, TAG_COLORS } from '@/types/tags';
import { FavoriteGroup, GROUP_COLORS } from '@/types/favorites';
import TagEditor from './TagEditor';
import FavoriteGroupSelector from './FavoriteGroupSelector';

interface StockCardProps {
  symbol: string;
  onRemove: () => void;
  favoriteGroups: FavoriteGroup[];
  onFavoriteGroupsChange: (groups: FavoriteGroup[]) => void;
}

export default function StockCard({ symbol, onRemove, favoriteGroups, onFavoriteGroupsChange }: StockCardProps) {
  const [memo, setMemo] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [isFavoriteGroupSelectorOpen, setIsFavoriteGroupSelectorOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [earningsDate, setEarningsDate] = useState('');
  const memoKey = `kabunote-memo-${symbol}`;
  const tagsKey = `kabunote-tags-${symbol}`;
  const targetPriceKey = `kabunote-target-price-${symbol}`;
  const stopLossKey = `kabunote-stop-loss-${symbol}`;
  const earningsDateKey = `kabunote-earnings-date-${symbol}`;

  // 同期版を使って即座に表示（キャッシュがある場合）
  const companyName = stockData ? stockData.name : getCompanyNameSync(symbol);
  const isKnown = stockData ? true : isKnownStockSync(symbol);

  // この銘柄が含まれているお気に入りグループ
  const belongingGroups = favoriteGroups.filter(group => group.stocks.includes(symbol));

  // CSVデータとメモを読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // クライアントサイドでのみlocalStorageにアクセス
      if (typeof window !== 'undefined') {
        // メモを読み込み
        const savedMemo = localStorage.getItem(memoKey);
        if (savedMemo) {
          setMemo(savedMemo);
        }

        // タグを読み込み
        const savedTags = localStorage.getItem(tagsKey);
        if (savedTags) {
          try {
            const parsedTags = JSON.parse(savedTags);
            setCustomTags(parsedTags);
          } catch (error) {
            console.error('Failed to parse saved tags:', error);
          }
        }

        // 目標株価を読み込み
        const savedTargetPrice = localStorage.getItem(targetPriceKey);
        if (savedTargetPrice) {
          setTargetPrice(savedTargetPrice);
        }

        // 損切りラインを読み込み
        const savedStopLoss = localStorage.getItem(stopLossKey);
        if (savedStopLoss) {
          setStopLoss(savedStopLoss);
        }

        // 決算日を読み込み
        const savedEarningsDate = localStorage.getItem(earningsDateKey);
        if (savedEarningsDate) {
          setEarningsDate(savedEarningsDate);
        }
      }

      // 株式データを読み込み
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
  }, [symbol, memoKey, tagsKey, targetPriceKey, stopLossKey, earningsDateKey]);

  // メモをlocalStorageに保存（入力毎に即座に保存）
  const handleMemoChange = (value: string) => {
    setMemo(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(memoKey, value);
    }
  };

  // タグをlocalStorageに保存
  const handleTagsChange = (tags: CustomTag[]) => {
    setCustomTags(tags);
    if (typeof window !== 'undefined') {
      localStorage.setItem(tagsKey, JSON.stringify(tags));
    }
  };

  // 目標株価をlocalStorageに保存
  const handleTargetPriceChange = (value: string) => {
    setTargetPrice(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(targetPriceKey, value);
    }
  };

  // 損切りラインをlocalStorageに保存
  const handleStopLossChange = (value: string) => {
    setStopLoss(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(stopLossKey, value);
    }
  };

  // 決算日をlocalStorageに保存
  const handleEarningsDateChange = (value: string) => {
    setEarningsDate(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(earningsDateKey, value);
    }
  };

  // カウントダウン計算ロジック
  const getEarningsCountdown = () => {
    if (!earningsDate) return null;

    const today = new Date();
    const earnings = new Date(earningsDate);
    const timeDiff = earnings.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // 決算日のフォーマット表示（M/D形式）
    const month = earnings.getMonth() + 1;
    const day = earnings.getDate();
    const formattedDate = `${month}/${day}`;

    if (daysDiff > 0) {
      return {
        text: `次回の決算日：${formattedDate}（あと${daysDiff}日）`,
        status: daysDiff <= 7 ? 'urgent' : 'normal'
      };
    } else if (daysDiff === 0) {
      return {
        text: `決算発表日：${formattedDate}（本日）`,
        status: 'today'
      };
    } else {
      return {
        text: `前回の決算日：${formattedDate}（${Math.abs(daysDiff)}日前）`,
        status: 'past'
      };
    }
  };

  // お気に入りグループの変更を処理
  const handleFavoriteGroupsChange = (groupIds: string[]) => {
    const updatedGroups = favoriteGroups.map(group => {
      const shouldIncludeStock = groupIds.includes(group.id);
      const currentlyIncludes = group.stocks.includes(symbol);

      if (shouldIncludeStock && !currentlyIncludes) {
        // 銘柄を追加
        return { ...group, stocks: [...group.stocks, symbol] };
      } else if (!shouldIncludeStock && currentlyIncludes) {
        // 銘柄を削除
        return { ...group, stocks: group.stocks.filter(s => s !== symbol) };
      }
      return group;
    });

    onFavoriteGroupsChange(updatedGroups);
  };

  const externalLinks = [
    {
      name: '株探',
      icon: '📊',
      url: `https://kabutan.jp/stock/chart?code=${symbol}`,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'TradingView',
      icon: '📈',
      url: `https://jp.tradingview.com/symbols/TSE-${symbol}/`,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Yahoo!',
      icon: '🟣',
      url: `https://finance.yahoo.co.jp/quote/${symbol}.T`,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      name: 'バフェット・コード',
      icon: '💰',
      url: `https://www.buffett-code.com/company/${symbol}/`,
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      name: '適時開示',
      icon: '📋',
      url: `https://irbank.net/td/search?q=${symbol}`,
      color: 'bg-gray-600 hover:bg-gray-700'
    }
  ];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white">{symbol}</h3>
            {isLoading ? (
              <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">
                読込中
              </span>
            ) : !isKnown ? (
              <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded-full">
                未登録
              </span>
            ) : (
              <div className="space-y-2">
                {/* 業種・市場（上部） */}
                {(stockData?.sector || stockData?.market) && (
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-xs text-gray-400 font-medium">📊</span>
                    {stockData?.sector && (
                      <span className="text-xs bg-blue-600 text-blue-100 px-2 py-0.5 rounded-full">
                        {stockData.sector}
                      </span>
                    )}
                    {stockData?.market && (
                      <span className="text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded-full">
                        {stockData.market}
                      </span>
                    )}
                  </div>
                )}

                {/* 区切り線（業種・市場がある場合に表示） */}
                {(stockData?.sector || stockData?.market) && (
                  <div className="border-t border-gray-700 my-2"></div>
                )}

                {/* タグ・グループ（下部） */}
                {(customTags.length > 0 || belongingGroups.length > 0) && (
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-xs text-gray-400 font-medium">🏷️</span>
                    {customTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`text-xs px-2 py-0.5 rounded-full ${TAG_COLORS[tag.color].bg} ${TAG_COLORS[tag.color].text}`}
                      >
                        {tag.label}
                      </span>
                    ))}
                    {belongingGroups.map((group) => (
                      <span
                        key={group.id}
                        className={`text-xs px-2 py-0.5 rounded-full border ${GROUP_COLORS[group.color].border} ${GROUP_COLORS[group.color].text} bg-opacity-20 ${GROUP_COLORS[group.color].bg}`}
                      >
                        ★ {group.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* ボタン行（常に表示） */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setIsTagEditorOpen(true)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full transition-colors"
                    title="タグを編集"
                  >
                    + タグ
                  </button>
                  <button
                    onClick={() => setIsFavoriteGroupSelectorOpen(true)}
                    className="text-xs bg-yellow-700 hover:bg-yellow-600 text-yellow-200 px-2 py-0.5 rounded-full transition-colors"
                    title="お気に入りグループに追加"
                  >
                    ★
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-100 truncate font-bold" title={companyName}>
            {companyName}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors ml-2 flex-shrink-0"
          aria-label="銘柄カードを削除"
        >
          ×
        </button>
      </div>

      {/* 外部リンクボタン */}
      <div className="space-y-2">
        {/* チャート確認ボタン */}
        <button
          onClick={() => {
            const url = `https://jp.tradingview.com/symbols/TSE-${symbol}/`;
            window.open(url, 'stockChart', 'width=800,height=800,scrollbars=yes,resizable=yes');
          }}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          📈 最新チャートを確認
        </button>

        {/* 外部リンク */}
        <div className="grid grid-cols-5 gap-1">
          {externalLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link.color} text-white text-xs py-2 px-1 rounded-lg transition-colors text-center flex flex-col items-center gap-1 hover:scale-105 transform`}
              title={link.name}
            >
              <span className="text-sm">{link.icon}</span>
              <span className="leading-tight">{link.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* メモ欄 */}
      <div className="space-y-2">
        <label htmlFor={`memo-${symbol}`} className="text-sm font-medium text-gray-300">
          投資メモ
        </label>
        <textarea
          id={`memo-${symbol}`}
          value={memo}
          onChange={(e) => handleMemoChange(e.target.value)}
          placeholder="この銘柄について思考を整理しましょう..."
          className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
          rows={4}
        />
        <p className="text-xs text-gray-400">
          {memo.length > 0 ? `${memo.length}文字` : '自動保存されます'}
        </p>
      </div>

      {/* 目標株価・損切りライン */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">投資規律設定</h4>
        <div className="grid grid-cols-2 gap-3">
          {/* 利確目標 */}
          <div className="space-y-1">
            <label htmlFor={`target-price-${symbol}`} className="text-xs font-medium text-green-300">
              💰 利確目標
            </label>
            <div className="relative">
              <input
                id={`target-price-${symbol}`}
                type="number"
                value={targetPrice}
                onChange={(e) => handleTargetPriceChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
            </div>
          </div>

          {/* 損切ライン */}
          <div className="space-y-1">
            <label htmlFor={`stop-loss-${symbol}`} className="text-xs font-medium text-red-300">
              🔻 損切ライン
            </label>
            <div className="relative">
              <input
                id={`stop-loss-${symbol}`}
                type="number"
                value={stopLoss}
                onChange={(e) => handleStopLossChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
            </div>
          </div>
        </div>
      </div>

      {/* 決算日カウントダウン */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">決算情報</h4>

        {/* 決算日設定 */}
        <div className="space-y-2">
          <label htmlFor={`earnings-date-${symbol}`} className="text-xs font-medium text-blue-300">
            📅 決算発表日
          </label>
          <input
            id={`earnings-date-${symbol}`}
            type="date"
            value={earningsDate}
            onChange={(e) => handleEarningsDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        {/* 決算カウントダウン表示 */}
        {(() => {
          const countdown = getEarningsCountdown();
          if (!countdown) return null;

          const getStatusColor = (status: string) => {
            switch (status) {
              case 'urgent':
                return 'bg-red-600 text-red-100 border-red-500';
              case 'today':
                return 'bg-yellow-600 text-yellow-100 border-yellow-500 animate-pulse';
              case 'normal':
                return 'bg-blue-600 text-blue-100 border-blue-500';
              case 'past':
                return 'bg-gray-600 text-gray-300 border-gray-500';
              default:
                return 'bg-gray-600 text-gray-300 border-gray-500';
            }
          };

          return (
            <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(countdown.status)}`}>
              📈 {countdown.text}
            </div>
          );
        })()}

        {/* タグエディター */}
        {isTagEditorOpen && (
          <TagEditor
            symbol={symbol}
            currentTags={customTags}
            onTagsChange={handleTagsChange}
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
    </div>
  );
}