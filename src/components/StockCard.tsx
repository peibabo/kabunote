'use client';

import { useState, useEffect } from 'react';
import { loadStockData, getCompanyNameSync, isKnownStockSync, StockData } from '@/data/stockNames';
import { CustomTag, TAG_COLORS } from '@/types/tags';
import TagEditor from './TagEditor';

interface StockCardProps {
  symbol: string;
  onRemove: () => void;
}

export default function StockCard({ symbol, onRemove }: StockCardProps) {
  const [memo, setMemo] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const memoKey = `kabunote-memo-${symbol}`;
  const tagsKey = `kabunote-tags-${symbol}`;

  // 同期版を使って即座に表示（キャッシュがある場合）
  const companyName = stockData ? stockData.name : getCompanyNameSync(symbol);
  const isKnown = stockData ? true : isKnownStockSync(symbol);

  // CSVデータとメモを読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

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
  }, [symbol, memoKey, tagsKey]);

  // メモをlocalStorageに保存（入力毎に即座に保存）
  const handleMemoChange = (value: string) => {
    setMemo(value);
    localStorage.setItem(memoKey, value);
  };

  // タグをlocalStorageに保存
  const handleTagsChange = (tags: CustomTag[]) => {
    setCustomTags(tags);
    localStorage.setItem(tagsKey, JSON.stringify(tags));
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
              <div className="flex flex-wrap gap-1">
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
                {customTags.map((tag) => (
                  <span
                    key={tag.id}
                    className={`text-xs px-2 py-0.5 rounded-full ${TAG_COLORS[tag.color].bg} ${TAG_COLORS[tag.color].text}`}
                  >
                    {tag.label}
                  </span>
                ))}
                <button
                  onClick={() => setIsTagEditorOpen(true)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full transition-colors"
                  title="タグを編集"
                >
                  + タグ
                </button>
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

        {/* タグエディター */}
        {isTagEditorOpen && (
          <TagEditor
            symbol={symbol}
            currentTags={customTags}
            onTagsChange={handleTagsChange}
            onClose={() => setIsTagEditorOpen(false)}
          />
        )}
      </div>
    </div>
  );
}