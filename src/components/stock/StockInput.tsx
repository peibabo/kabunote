'use client';

import { useState, useRef, useEffect } from 'react';
import { searchCompanies, StockData } from '@/data/stockNames';

interface StockInputProps {
  onAddStock: (code: string) => void;
  isDisabled: boolean;
}

export default function StockInput({ onAddStock, isDisabled }: StockInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<StockData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // プリセット銘柄（人気銘柄）
  const presetStocks = [
    { code: '7203', name: 'トヨタ自動車' },
    { code: '9983', name: 'ファーストリテイリング' },
    { code: '6758', name: 'ソニーグループ' },
    { code: '8306', name: '三菱UFJ' },
  ];

  // 検索処理（デバウンス付き）
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (inputValue.trim().length >= 2) {
        setIsLoading(true);
        try {
          const results = await searchCompanies(inputValue.trim(), 8);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch (error) {
          console.error('Search failed:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setSelectedIndex(-1);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // 外部クリックでサジェストを非表示
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionSelect = (stock: StockData) => {
    onAddStock(stock.code);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setError('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputValue.trim();

    if (!code) {
      setError('会社名または銘柄コードを入力してください');
      return;
    }

    // 4桁の数字の場合は直接銘柄コードとして処理
    if (/^\d{4}$/.test(code)) {
      onAddStock(code);
      setInputValue('');
      setError('');
      return;
    }

    // 会社名の場合、完全一致する銘柄があれば選択
    const exactMatch = suggestions.find(s =>
      s.name.toLowerCase() === code.toLowerCase()
    );

    if (exactMatch) {
      handleSuggestionSelect(exactMatch);
    } else if (suggestions.length > 0) {
      // 部分一致の最初の候補を選択
      handleSuggestionSelect(suggestions[0]);
    } else {
      setError('該当する銘柄が見つかりません');
    }
  };

  const handlePresetClick = (code: string) => {
    onAddStock(code);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-400 text-gray-900">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <form onSubmit={handleManualSubmit} className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue.trim().length >= 2 && setShowSuggestions(suggestions.length > 0)}
              placeholder="銘柄コード（例：7203）または会社名（例：トヨタ）で検索"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-base text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              disabled={isDisabled}
              autoComplete="off"
            />

            {/* ローディングインジケーター */}
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm mt-1">{error}</p>
            )}

            {/* サジェストドロップダウン */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
              >
                {suggestions.map((stock, index) => (
                  <div
                    key={stock.code}
                    onClick={() => handleSuggestionSelect(stock)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-600 text-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium">
                          {highlightMatch(stock.name, inputValue)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {stock.market} | {stock.sector}
                        </div>
                      </div>
                      <div className="text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                        {stock.code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors whitespace-nowrap"
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
              className="cursor-pointer px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors text-left"
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