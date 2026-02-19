'use client';

import { Position, PositionSummary, formatPrice, formatShares } from '@/types/positions';

interface PositionsManagementProps {
  symbol: string;
  positions: Position[];
  positionSummary: PositionSummary;
  onPositionManagerOpen: () => void;
}

export default function PositionsManagement({
  symbol,
  positions,
  positionSummary,
  onPositionManagerOpen
}: PositionsManagementProps) {
  return (
    <div className="space-y-4">
      {/* 保有ポジション管理 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">保有ポジション</h4>
          <button
            onClick={onPositionManagerOpen}
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
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {positions.map((position) => (
                <div key={position.id} className="flex justify-between items-center text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                  <span>{formatShares(position.shares)}株 @ {formatPrice(position.purchasePrice)}円</span>
                  <span>{position.purchaseDate}</span>
                </div>
              ))}
            </div>

            {/* 詳細情報 */}
            <div className="mt-3 pt-2 border-t border-gray-600">
              <div className="text-xs text-gray-300 text-center">
                平均取得価額: {formatPrice(positionSummary.averagePrice)}円 × {formatShares(positionSummary.totalShares)}株
              </div>
              <div className="text-xs text-gray-400 text-center mt-1">
                ポジション管理ボタンから詳細な編集が可能です
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <div className="text-gray-400 mb-3">
                📊 保有ポジションが登録されていません
              </div>
              <p className="text-xs text-gray-500 mb-3">
                株社を保有している場合、ポジションの登録すると<br></br>様々な機能が利用できます
              </p>
              <button
                onClick={onPositionManagerOpen}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded transition-colors"
              >
                最初のポジションを追加
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}