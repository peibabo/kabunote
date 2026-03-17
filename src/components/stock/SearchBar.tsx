'use client';

import { useState, useEffect } from 'react';
import { playSound } from '@/lib/sound';
interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = "銘柄・メモ・タグを検索..."
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // 外部からのsearchQuery変更を反映
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // デバウンス機能付きで検索クエリを更新
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(localQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localQuery, onSearchChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleClear = () => {
    playSound('searchClear');
    setLocalQuery('');
    onSearchChange('');
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        {/* 検索アイコン */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 検索入力フィールド */}
        <input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* クリアボタン */}
        {localQuery && (
          <button
            onClick={handleClear}
            className="cursor-pointer absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 検索ヒント */}
      {localQuery.length > 0 && localQuery.length < 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-gray-800 border border-gray-600 rounded-lg text-xs text-gray-400">
          2文字以上入力してください
        </div>
      )}
    </div>
  );
}