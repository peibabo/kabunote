'use client';

import { useState } from 'react';

interface StockInputProps {
  onAddStock: (code: string) => void;
  isDisabled: boolean;
}

export default function StockInput({ onAddStock, isDisabled }: StockInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const presetStocks = [
    { code: '7203', name: 'トヨタ自動車' },
    { code: '9983', name: 'ファーストリテイリング' },
    { code: '6758', name: 'ソニーグループ' },
    { code: '8306', name: '三菱UFJ' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputValue.trim();

    if (!code) {
      setError('銘柄コードを入力してください');
      return;
    }

    if (!/^\d{4}$/.test(code)) {
      setError('4桁の数字を入力してください');
      return;
    }

    onAddStock(code);
    setInputValue('');
    setError('');
  };

  const handlePresetClick = (code: string) => {
    onAddStock(code);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 flex-1">
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="4桁の銘柄コードを入力 (例: 7203)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              disabled={isDisabled}
              maxLength={4}
            />
            {error && (
              <p className="text-red-400 text-sm mt-1">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isDisabled}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            {isDisabled ? '上限達成' : '追加'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-white text-sm font-medium mb-2">人気銘柄</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {presetStocks.map((stock) => (
            <button
              key={stock.code}
              onClick={() => handlePresetClick(stock.code)}
              disabled={isDisabled}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white text-sm rounded-lg transition-colors text-left"
            >
              <div className="font-medium">{stock.code}</div>
              <div className="text-xs text-gray-300 truncate">{stock.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}