'use client';

import { useState, useEffect } from 'react';
import StockCard from '@/components/StockCard';
import StockInput from '@/components/StockInput';
import { loadStockData } from '@/data/stockNames';

const MAX_STOCKS = 5;
const STORAGE_KEY = 'kabunote-stocks';

export default function Home() {
  const [stocks, setStocks] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      // CSVデータを事前読み込み
      try {
        await loadStockData();
        console.log('Stock data preloaded successfully');
      } catch (error) {
        console.error('Failed to preload stock data:', error);
      }

      // 保存されている銘柄を読み込み
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsedStocks = JSON.parse(saved);
          setStocks(parsedStocks);
        } catch (e) {
          console.error('Failed to load saved stocks:', e);
        }
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
  }, [stocks]);

  const handleAddStock = (code: string) => {
    if (stocks.length >= MAX_STOCKS) {
      setError(`最大${MAX_STOCKS}銘柄まで表示できます`);
      return;
    }

    if (stocks.includes(code)) {
      setError('この銘柄は既に追加されています');
      return;
    }

    setStocks([...stocks, code]);
    setError('');
  };

  const handleRemoveStock = (code: string) => {
    setStocks(stocks.filter(stock => stock !== code));
    setError('');
    // メモも削除
    localStorage.removeItem(`kabunote-memo-${code}`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">カブノオト</h1>
          <p className="text-gray-400">投資家の思考を整理するダッシュボード</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">銘柄を追加</h2>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1">
              <StockInput
                onAddStock={handleAddStock}
                isDisabled={stocks.length >= MAX_STOCKS}
              />
            </div>
            <div className="flex flex-col gap-2 md:min-w-fit">
              {error && (
                <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div className="text-gray-400 text-sm">
                <p>{stocks.length}/{MAX_STOCKS} 銘柄を追加済み</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          {stocks.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium text-white mb-2">銘柄カードを追加してください</h3>
              <p className="text-gray-400">上記のフォームから銘柄コードを入力して、投資の思考整理を始めましょう。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stocks.map((stock) => (
                <StockCard
                  key={stock}
                  symbol={stock}
                  onRemove={() => handleRemoveStock(stock)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
