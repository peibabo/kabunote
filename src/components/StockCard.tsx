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
  const memoKey = `kabunote-memo-${symbol}`;
  const tagsKey = `kabunote-tags-${symbol}`;
  const targetPriceKey = `kabunote-target-price-${symbol}`;
  const stopLossKey = `kabunote-stop-loss-${symbol}`;

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
  }, [symbol, memoKey, tagsKey, targetPriceKey, stopLossKey]);

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
      url: `https://kabutan.jp/stock/chart?code=${symbol}`,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'TradingView',
      url: `https://jp.tradingview.com/symbols/TSE-${symbol}/`,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Yahoo!',
      url: `https://finance.yahoo.co.jp/quote/${symbol}.T`,
      color: 'bg-purple-600 hover:bg-purple-700'
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
          <p className="text-sm text-gray-300 truncate" title={companyName}>
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
        <div className="grid grid-cols-3 gap-2">
          {externalLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link.color} text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors text-center`}
            >
              {link.name}
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