'use client';

import { useState, useEffect } from 'react';
import { loadStockData, getCompanyNameSync, isKnownStockSync, StockData } from '@/data/stockNames';
import { CustomTag, TAG_COLORS } from '@/types/tags';
import { FavoriteGroup, GROUP_COLORS } from '@/types/favorites';
import TagEditor from './TagEditor';
import FavoriteGroupSelector from './FavoriteGroupSelector';
import PositionManager from './PositionManager';
import { Position, PositionSummary, calculatePositionSummary, formatPrice, formatShares, ProfitLossInfo, calculateProfitLoss, formatProfitLoss } from '@/types/positions';

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
  const [currentPrice, setCurrentPrice] = useState('');
  const [earningsDate, setEarningsDate] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [isPositionManagerOpen, setIsPositionManagerOpen] = useState(false);
  const memoKey = `kabunote-memo-${symbol}`;
  const tagsKey = `kabunote-tags-${symbol}`;
  const targetPriceKey = `kabunote-target-price-${symbol}`;
  const stopLossKey = `kabunote-stop-loss-${symbol}`;
  const currentPriceKey = `kabunote-current-price-${symbol}`;
  const earningsDateKey = `kabunote-earnings-date-${symbol}`;
  const positionsKey = `kabunote-positions-${symbol}`;

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

  // プログレスバー用の計算
  const calculateProgress = () => {
    const target = parseFloat(targetPrice);
    const stop = parseFloat(stopLoss);
    const current = parseFloat(currentPrice);

    if (!target || !stop || !current) return null;

    // 損切ラインを0%、目標価格を100%として位置を計算
    const range = target - stop;
    const currentPosition = current - stop;
    const percentage = Math.max(0, Math.min(100, (currentPosition / range) * 100));

    // 目標までの残り
    const remainingToTarget = ((target - current) / (target - stop)) * 100;

    return {
      percentage,
      remainingToTarget: Math.max(0, remainingToTarget),
      isOverTarget: current > target,
      isUnderStop: current < stop
    };
  };

  const progressData = calculateProgress();

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

        // 現在の目安株価を読み込み
        const savedCurrentPrice = localStorage.getItem(currentPriceKey);
        if (savedCurrentPrice) {
          setCurrentPrice(savedCurrentPrice);
        }

        // 決算日を読み込み
        const savedEarningsDate = localStorage.getItem(earningsDateKey);
        if (savedEarningsDate) {
          setEarningsDate(savedEarningsDate);
        }

        // ポジション情報を読み込み
        const savedPositions = localStorage.getItem(positionsKey);
        if (savedPositions) {
          try {
            const parsedPositions = JSON.parse(savedPositions);
            setPositions(parsedPositions);
          } catch (error) {
            console.error('Failed to parse saved positions:', error);
          }
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
  }, [symbol, memoKey, tagsKey, targetPriceKey, stopLossKey, currentPriceKey, earningsDateKey, positionsKey]);

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

  // 現在の目安株価をlocalStorageに保存
  const handleCurrentPriceChange = (value: string) => {
    setCurrentPrice(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(currentPriceKey, value);
    }
  };

  // 決算日をlocalStorageに保存
  const handleEarningsDateChange = (value: string) => {
    setEarningsDate(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(earningsDateKey, value);
    }
  };

  // ポジション情報をlocalStorageに保存
  const handlePositionsChange = (updatedPositions: Position[]) => {
    setPositions(updatedPositions);
    if (typeof window !== 'undefined') {
      localStorage.setItem(positionsKey, JSON.stringify(updatedPositions));
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
                    {customTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`text-xs px-2 py-0.5 rounded-full ${TAG_COLORS[tag.color].bg} ${TAG_COLORS[tag.color].text}`}
                      >
                        🏷️ {tag.label}
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
          <p className="text-base text-gray-100 truncate font-bold" title={companyName}>
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
          maxLength={2000}
          className="w-full h-32 px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none font-mono leading-6 shadow-inner"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='24' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='17' x2='100' y2='17' stroke='%23a1a1aa' stroke-width='1' stroke-dasharray='3,3' opacity='0.4'/%3e%3c/svg%3e")`,
            backgroundSize: '100px 24px',
            backgroundPosition: '0 3px'
          }}
          rows={4}
        />
        <p className="text-xs text-gray-400 flex justify-between">
          <span>自動保存されます</span>
          <span className={`${memo.length > 1800 ? 'text-orange-400' : memo.length > 1900 ? 'text-red-400' : 'text-gray-400'}`}>
            {memo.length}/2000文字
          </span>
        </p>
      </div>

      {/* 決算情報 */}
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
      </div>

      {/* 目標株価・損切りライン */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">投資規律設定</h4>
        <div className="grid grid-cols-3 gap-3">
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

          {/* 現在の目安株価 */}
          <div className="space-y-1">
            <label htmlFor={`current-price-${symbol}`} className="text-xs font-medium text-blue-300">
              📈 現在の目安株価
            </label>
            <div className="relative">
              <input
                id={`current-price-${symbol}`}
                type="number"
                value={currentPrice}
                onChange={(e) => handleCurrentPriceChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
            </div>
          </div>

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
        </div>

        {/* 株価プログレスバーゲージ */}
        {progressData && targetPrice && stopLoss && currentPrice && (
          <div className="mt-4 p-3 bg-gray-600 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium text-gray-300">📊 株価ポジション</h5>
              <span className="text-xs text-gray-400">
                {progressData.isOverTarget
                  ? '🎯 利確目標達成!'
                  : progressData.isUnderStop
                    ? '⚠️ 損切ライン下'
                    : `利確目標まで${progressData.remainingToTarget.toFixed(1)}%`
                }
              </span>
            </div>

            {/* プログレスバー */}
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    progressData.isOverTarget
                      ? 'bg-green-500'
                      : progressData.percentage < 30
                        ? 'bg-red-500'
                        : progressData.percentage < 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, progressData.percentage)}%` }}
                />
              </div>

              {/* 現在価格のドット */}
              <div
                className="absolute top-0 w-3 h-3 bg-blue-400 border-2 border-white rounded-full transform -translate-x-1.5"
                style={{
                  left: `${Math.min(100, Math.max(0, progressData.percentage))}%`,
                  transform: 'translateX(-50%) translateY(0)'
                }}
              />
            </div>

            {/* 価格ラベル */}
            <div className="flex justify-between items-center mt-2 text-xs">
              <div className="text-red-300">
                <span>🔻 {formatPrice(parseFloat(stopLoss))}円</span>
              </div>
              <div className="text-blue-300 font-medium">
                <span>📈 {formatPrice(parseFloat(currentPrice))}円</span>
              </div>
              <div className="text-green-300">
                <span>💰 {formatPrice(parseFloat(targetPrice))}円</span>
              </div>
            </div>
          </div>
        )}

        {/* 含み益・含み損表示 */}
        {profitLossInfo && positionSummary.totalShares > 0 && (
          <div className="mt-4 p-3 bg-gray-600 rounded-lg">
            <h5 className="text-xs font-medium text-gray-300 mb-2">📊 損益シミュレーション</h5>
            <div className="grid grid-cols-2 gap-3">
              {/* 損切ラインでの損失 */}
              {stopLoss && (
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">損切ライン到達時</div>
                  <div className={`text-sm font-bold ${profitLossInfo.stopLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatProfitLoss(profitLossInfo.stopLoss)}円
                  </div>
                  <div className={`text-xs ${profitLossInfo.stopLossPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ({profitLossInfo.stopLossPercent >= 0 ? '+' : ''}{profitLossInfo.stopLossPercent.toFixed(1)}%)
                  </div>
                </div>
              )}

              {/* 目標価格での利益 */}
              {targetPrice && (
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">利確目標達成時</div>
                  <div className={`text-sm font-bold ${profitLossInfo.targetProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatProfitLoss(profitLossInfo.targetProfit)}円
                  </div>
                  <div className={`text-xs ${profitLossInfo.targetProfitPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ({profitLossInfo.targetProfitPercent >= 0 ? '+' : ''}{profitLossInfo.targetProfitPercent.toFixed(1)}%)
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              平均取得価額: {formatPrice(positionSummary.averagePrice)}円 × {formatShares(positionSummary.totalShares)}株
            </div>
          </div>
        )}
      </div>

      {/* ポジション管理 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">保有ポジション</h4>
          <button
            onClick={() => setIsPositionManagerOpen(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition-colors"
          >
            ポジション管理
          </button>
        </div>

        {positions.length > 0 ? (
          <div className="bg-gray-700 rounded-lg p-3 space-y-2">
            {/* ポジションサマリー */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">保有株数：</span>
                <span className="text-white font-medium">{formatShares(positionSummary.totalShares)}株</span>
              </div>
              <div>
                <span className="text-gray-400">平均取得：</span>
                <span className="text-green-300 font-medium">{formatPrice(positionSummary.averagePrice)}円</span>
              </div>
              <div>
                <span className="text-gray-400">総投資額：</span>
                <span className="text-blue-300 font-medium">{formatPrice(positionSummary.totalCost)}円</span>
              </div>
              <div>
                <span className="text-gray-400">ポジション数：</span>
                <span className="text-gray-200">{positionSummary.positionCount}件</span>
              </div>
            </div>

            {/* ポジション一覧（簡易表示） */}
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {positions.map((position) => (
                <div key={position.id} className="flex justify-between items-center text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                  <span>{formatShares(position.shares)}株 @ {formatPrice(position.purchasePrice)}円</span>
                  <span>{position.purchaseDate}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
            保有ポジションが登録されていません
          </div>
        )}

        {/* ポジション管理モーダル */}
        {isPositionManagerOpen && (
          <PositionManager
            positions={positions}
            onPositionsChange={handlePositionsChange}
            onClose={() => setIsPositionManagerOpen(false)}
          />
        )}

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