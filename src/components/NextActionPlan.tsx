import React from 'react';
import {
  NextActionPlan as NextActionPlanType,
  NextActionPlanAnalysis,
  ActionType,
  Priority,
  analyzeNextActionPlan
} from '../types/nextActionPlan';
import { PositionSummary } from '../types/positions';
import { useNextActionPlan, hasNextActionPlan, isCompleteNextActionPlan } from '../hooks/useNextActionPlan';

interface NextActionPlanProps {
  symbol: string;
  currentPrice?: number;
  positionSummary?: PositionSummary;
}

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  buy: '📈 買い',
  sell: '📉 売り',
  hold: '🔄 様子見'
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '🔴 高',
  medium: '🟡 中',
  low: '🟢 低'
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'text-red-400 bg-red-900/20 border-red-500/30',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  low: 'text-green-400 bg-green-900/20 border-green-500/30'
};

export default function NextActionPlan({ symbol, currentPrice = 0, positionSummary }: NextActionPlanProps) {
  const { nextActionPlan, updateNextActionPlan, resetNextActionPlan, isLoading } = useNextActionPlan(symbol);

  if (isLoading) {
    return <div className="text-gray-400">読み込み中...</div>;
  }

  // 分析情報を計算
  const analysis: NextActionPlanAnalysis | null = currentPrice > 0 ?
    analyzeNextActionPlan(nextActionPlan, currentPrice, positionSummary || null) : null;

  const hasPlan = hasNextActionPlan(nextActionPlan);
  const isComplete = isCompleteNextActionPlan(nextActionPlan);

  // フォーマット関数
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(price));
  };

  const formatAmount = (amount: number): string => {
    const formatted = new Intl.NumberFormat('ja-JP').format(Math.abs(Math.round(amount)));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="relative space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">🎯 次の一手</h3>
          {hasPlan && (
            <div className={`px-2 py-1 rounded-md text-xs border ${PRIORITY_COLORS[nextActionPlan.priority]}`}>
              {PRIORITY_LABELS[nextActionPlan.priority]}
            </div>
          )}
        </div>
        {hasPlan && (
          <button
            onClick={resetNextActionPlan}
            className="cursor-pointer text-xs text-gray-400 hover:text-white transition-colors"
          >
            リセット
          </button>
        )}
      </div>

      {/* 基本設定 */}
      <div className="grid grid-cols-2 gap-4">
        {/* アクション種別 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">アクション</label>
          <select
            value={nextActionPlan.actionType}
            onChange={(e) => updateNextActionPlan({ actionType: e.target.value as ActionType })}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* 優先度 */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">優先度</label>
          <select
            value={nextActionPlan.priority}
            onChange={(e) => updateNextActionPlan({ priority: e.target.value as Priority })}
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
            value={nextActionPlan.targetPrice || ''}
            onChange={(e) => updateNextActionPlan({ targetPrice: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            step="1"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            {nextActionPlan.actionType === 'buy' ? '追加株数（単位：100株）' : nextActionPlan.actionType === 'sell' ? '売却株数（単位：100株）' : '対象株数（単位：100株）'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={Math.floor((nextActionPlan.targetQuantity || 0) / 100) || ''}
              onChange={(e) => {
                const units = parseInt(e.target.value) || 0;
                updateNextActionPlan({ targetQuantity: units * 100 });
              }}
              placeholder="20"
              min="0"
              step="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-16"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-400">×100株</span>
          </div>
          {nextActionPlan.targetQuantity > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              = {nextActionPlan.targetQuantity.toLocaleString()}株
            </div>
          )}
        </div>
      </div>

      {/* 分析情報 */}
      {nextActionPlan.targetPrice > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-600 shadow-lg">
          <h4 className="text-sm font-medium text-gray-300">📊 分析情報</h4>

          {/* 現在株価未入力時の誘導メッセージ */}
          {currentPrice === 0 ? (
            <div className="text-center py-4">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-2 border-blue-500 border-dashed rounded-full flex items-center justify-center">
                  <span className="text-blue-400 text-xl">📈</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-300 font-medium">分析を開始するために</p>
                  <p className="text-xs text-gray-400">現在の株価を上記の「投資規律設定」で入力してください</p>
                </div>
                <div className="px-3 py-1 bg-blue-900/30 border border-blue-500/50 rounded-md">
                  <span className="text-xs text-blue-300">💡 現在の株価が必要です</span>
                </div>
              </div>
            </div>
          ) : analysis && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">価格差：</span>
              <span className={`ml-2 ${analysis.priceGap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatAmount(analysis.priceGap)}円
              </span>
            </div>

            <div>
              <span className="text-gray-400">乖離率：</span>
              <span className={`ml-2 ${analysis.gapPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {analysis.gapPercentage.toFixed(1)}%
              </span>
            </div>

            <div className="whitespace-nowrap">
              <span className="text-gray-400">必要投資額：</span>
              <span className="ml-2 text-white">
                {formatPrice(analysis.requiredInvestment)}円
              </span>
            </div>

            {analysis.predictedAveragePrice && (
              <div>
                <span className="text-gray-400">予想平均単価：</span>
                <span className="ml-2 text-white">
                  {formatPrice(analysis.predictedAveragePrice)}円
                </span>
              </div>
            )}
          </div>

          {/* 進捗ゲージ */}
          {(
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">価格到達進捗</span>
                <span className="text-xs text-gray-300">{Math.abs(analysis.gapPercentage).toFixed(1)}% 差</span>
              </div>
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                {/* ネオングロー背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-green-900/30 rounded-full"></div>

                {/* 進捗バー */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, Math.max(0, 100 - Math.abs(analysis.gapPercentage)))}%`,
                    background: analysis.gapPercentage >= 0
                      ? 'linear-gradient(90deg, #3b82f6, #06b6d4)'
                      : 'linear-gradient(90deg, #ef4444, #f59e0b)',
                    boxShadow: analysis.gapPercentage >= 0
                      ? '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(6, 182, 212, 0.3)'
                      : '0 0 10px rgba(239, 68, 68, 0.5), 0 0 20px rgba(245, 158, 11, 0.3)'
                  }}
                />
              </div>
            </div>
          )}

          {/* 目標価格アラート（段階的表示） */}
          {analysis.isApproaching && (
            <div className="relative p-3 bg-red-900/30 border border-red-500/50 rounded-md overflow-hidden">
              {/* ネオングロー背景 */}
              <div className="absolute inset-0 bg-red-400/5 animate-pulse"></div>

              <div className="relative flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 bg-red-400 rounded-full animate-pulse"
                    style={{
                      boxShadow: '0 0 10px rgba(248, 113, 113, 0.8), 0 0 20px rgba(248, 113, 113, 0.4)'
                    }}
                  ></div>
                  <span className="text-red-400 text-xs font-medium">🚨 目標価格に接近中</span>
                </div>
                <div className="text-xs text-red-300">（乖離率2%以内）</div>
              </div>

              {/* スキャンライン効果 */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          )}

          {/* 目標価格警告（2-5%以内） */}
          {analysis.isWarning && (
            <div className="relative p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-md overflow-hidden">
              {/* ネオングロー背景 */}
              <div className="absolute inset-0 bg-yellow-400/5 animate-pulse"></div>

              <div className="relative flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
                    style={{
                      boxShadow: '0 0 10px rgba(251, 191, 36, 0.8), 0 0 20px rgba(251, 191, 36, 0.4)'
                    }}
                  ></div>
                  <span className="text-yellow-400 text-xs font-medium">⚠️ 注意：目標価格に接近</span>
                </div>
                <div className="text-xs text-yellow-300">（乖離率2-5%以内）</div>
              </div>

              {/* スキャンライン効果 */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse"></div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* メモ */}
      <div>
        <label className="block text-sm text-gray-300 mb-2">作戦理由・メモ</label>
        <textarea
          value={nextActionPlan.memo}
          onChange={(e) => updateNextActionPlan({ memo: e.target.value })}
          placeholder="投資の理由や条件を記録..."
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* ステータス表示 */}
      {hasPlan && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}
              style={{
                boxShadow: isComplete
                  ? '0 0 8px rgba(34, 197, 94, 0.6), 0 0 16px rgba(34, 197, 94, 0.3)'
                  : '0 0 8px rgba(251, 191, 36, 0.6), 0 0 16px rgba(251, 191, 36, 0.3)'
              }}
            ></div>
            <span className="text-sm text-gray-200 font-medium">
              {isComplete ? '✅ 作戦完了' : '⚡ 作戦の未入力があります'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}