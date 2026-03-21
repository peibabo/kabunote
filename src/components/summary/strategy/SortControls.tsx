'use client';

import React from 'react';
import { SortKey } from './types';

interface SortControlsProps {
  sortBy: SortKey;
  sortOrder: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'priority', label: '優先度' },
  { key: 'alert', label: 'アラート' },
  { key: 'action', label: 'アクション' },
  { key: 'symbol', label: '銘柄コード' }
];

export default function SortControls({ sortBy, sortOrder, onSort }: SortControlsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <span className="text-sm text-gray-400 self-center mr-2">並び替え:</span>
      {SORT_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onSort(key)}
          className={`cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs rounded-md transition-colors ${
            sortBy === key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {label}
          {sortBy === key && (
            <span className="ml-1">{sortOrder === 'desc' ? '\u2193' : '\u2191'}</span>
          )}
        </button>
      ))}
    </div>
  );
}
