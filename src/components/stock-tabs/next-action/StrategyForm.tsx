'use client';

import React from 'react';
import { playSound } from '@/lib/sound';
import { ActionType, Priority } from '@/types/nextActionPlan';

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  buy: '\u{1F4C8} \u8CB7\u3044',
  sell: '\u{1F4C9} \u58F2\u308A',
  hold: '\u{1F504} \u69D8\u5B50\u898B'
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '\u{1F534} \u9AD8',
  medium: '\u{1F7E1} \u4E2D',
  low: '\u{1F7E2} \u4F4E'
};

interface StrategyFormProps {
  actionType: ActionType;
  priority: Priority;
  targetPrice: number | null;
  targetQuantity: number | null;
  memo: string;
  onUpdate: (data: Record<string, unknown>) => void;
  onChangeSound: () => void;
}

export default function StrategyForm({
  actionType,
  priority,
  targetPrice,
  targetQuantity,
  memo,
  onUpdate,
  onChangeSound,
}: StrategyFormProps) {
  return (
    <>
      {/* 基本設定 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">アクション</label>
          <select
            value={actionType}
            onChange={(e) => { playSound('select'); onUpdate({ actionType: e.target.value as ActionType }); }}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">優先度</label>
          <select
            value={priority}
            onChange={(e) => { playSound('select'); onUpdate({ priority: e.target.value as Priority }); }}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 目標価格・株数 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">目標価格（円）</label>
          <input
            type="number"
            value={targetPrice || ''}
            onChange={(e) => { onUpdate({ targetPrice: parseFloat(e.target.value) || 0 }); onChangeSound(); }}
            placeholder="0"
            min="0"
            step="1"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2 whitespace-nowrap">
            {actionType === 'buy' ? '追加株数' : actionType === 'sell' ? '売却株数' : '対象株数'}
            <span className="text-xs text-gray-500 ml-1">(100株単位)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={Math.floor((targetQuantity || 0) / 100) || ''}
              onChange={(e) => {
                const units = parseInt(e.target.value) || 0;
                onUpdate({ targetQuantity: units * 100 });
                onChangeSound();
              }}
              placeholder="20"
              min="0"
              step="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-16"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">{'\u00D7'}100株</span>
          </div>
          {(targetQuantity ?? 0) > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              = {(targetQuantity ?? 0).toLocaleString()}株
            </div>
          )}
        </div>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">作戦理由・メモ</label>
        <textarea
          value={memo || ''}
          onChange={(e) => { onUpdate({ memo: e.target.value }); }}
          placeholder="投資の理由や条件を記録..."
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>
    </>
  );
}
