'use client';

import { useState } from 'react';
import { playSound } from '@/lib/sound';
import { getTodayJST } from '@/lib/dateJst';
import { calculateRealizedTrade } from '@/lib/realizedTradeCalc';
import { formatPrice, formatProfitLoss, formatShares } from '@/lib/positionCalc';
import type { PositionSummary } from '@/types/positions';
import type { RealizedTrade, SellPositionInput } from '@/types/realizedTrade';

interface SellPositionFormProps {
  summary: PositionSummary;
  isSaving: boolean;
  onSell: (data: SellPositionInput) => Promise<RealizedTrade | null>;
  onClose: () => void;
}

export default function SellPositionForm({ summary, isSaving, onSell, onClose }: SellPositionFormProps) {
  const [shares, setShares] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellDate, setSellDate] = useState(getTodayJST());
  const [memo, setMemo] = useState('');

  const sharesNum = parseInt(shares);
  const priceNum = parseFloat(sellPrice);
  const hasInput = sharesNum > 0 && priceNum > 0;
  const overflow = sharesNum > summary.totalShares;
  const isValid = hasInput && !overflow && sellDate.length > 0;

  // 実現損益のライブプレビュー（加重平均原価ベース）
  const preview = hasInput
    ? calculateRealizedTrade(sharesNum, priceNum, summary.averagePrice, summary.weightedTaxRate)
    : null;

  const handleSell = async () => {
    if (!isValid) return;
    const trade = await onSell({ soldShares: sharesNum, sellPrice: priceNum, sellDate, memo: memo || undefined });
    if (trade) {
      // 利確なら祝福音、損切りなら通常音
      playSound(trade.realizedPL > 0 ? 'levelUp' : 'buttonAction');
      onClose();
    }
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 border border-amber-600/40">
      <h5 className="text-sm font-medium text-amber-300 mb-3">{'\u{1F4B0}'} ポジションを売却</h5>

      <div className="text-xs text-gray-400 mb-3">
        保有 {formatShares(summary.totalShares)}株 / 平均取得 {formatPrice(summary.averagePrice)}円
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            売却株数 <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder={String(summary.totalShares)}
            min="1"
            max={summary.totalShares}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShares(String(summary.totalShares))}
            className="cursor-pointer mt-1 text-[10px] text-amber-400 hover:text-amber-300"
          >
            全株売却（{formatShares(summary.totalShares)}株）
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            売却単価（円） <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            placeholder="1600"
            min="0.01"
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            売却日 <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={sellDate}
            onChange={(e) => setSellDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">売却理由メモ</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="なぜ売ったか"
            maxLength={500}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 保有超過エラー */}
      {overflow && (
        <div className="mt-2 text-xs text-red-400">
          {'⚠️'} 保有株数（{formatShares(summary.totalShares)}株）を超えています
        </div>
      )}

      {/* 実現損益プレビュー */}
      {preview && !overflow && (
        <div className="mt-3 bg-gray-800 rounded p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">売却代金</span>
            <span className="text-white">{formatPrice(preview.proceeds)}円</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">実現損益（税引前）</span>
            <span className={preview.gross >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              {formatProfitLoss(preview.gross)}円（{preview.plPercent >= 0 ? '+' : ''}{preview.plPercent.toFixed(2)}%）
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">実現損益（税引後）</span>
            <span className={preview.afterTax >= 0 ? 'text-green-300' : 'text-red-300'}>
              {formatProfitLoss(preview.afterTax)}円
              {summary.weightedTaxRate === 0 && <span className="ml-1 text-green-500">(NISA非課税)</span>}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSell}
          disabled={isSaving || !isValid}
          className="cursor-pointer px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
        >
          {isSaving ? '売却処理中...' : '売却を記録'}
        </button>
        <button
          onClick={onClose}
          className="cursor-pointer px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
