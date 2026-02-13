'use client';

import { Position, PositionSummary, formatPrice, formatShares } from '@/types/positions';

interface EarningsCountdown {
  text: string;
  status: 'urgent' | 'today' | 'normal' | 'past';
}

interface ManagementTabProps {
  symbol: string;
  earningsDate: string;
  onEarningsDateChange: (value: string) => void;
  positions: Position[];
  positionSummary: PositionSummary;
  onPositionManagerOpen: () => void;
}

// 決算カウントダウン計算ロジック
const getEarningsCountdown = (earningsDate: string): EarningsCountdown | null => {
  if (!earningsDate) return null;

  const today = new Date();
  const earnings = new Date(earningsDate);
  const timeDiff = earnings.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // 決算日のフォーマット表示（M/D形式）
  const month = earnings.getMonth() + 1;
  const day = earnings.getDate();
  const formattedDate = `${month}/${day}`;

  if (daysDiff > 0) {
    return {
      text: `次回の決算日：${formattedDate}（あと${daysDiff}日）`,
      status: daysDiff <= 7 ? 'urgent' : 'normal'
    };
  } else if (daysDiff === 0) {
    return {
      text: `決算発表日：${formattedDate}（本日）`,
      status: 'today'
    };
  } else {
    return {
      text: `前回の決算日：${formattedDate}（${Math.abs(daysDiff)}日前）`,
      status: 'past'
    };
  }
};

// 決算ステータスに応じたCSSクラス
const getStatusColor = (status: string) => {
  switch (status) {
    case 'urgent':
      return 'bg-red-600 text-red-100 border-red-500';
    case 'today':
      return 'bg-yellow-600 text-yellow-100 border-yellow-500 animate-pulse';
    case 'normal':
      return 'bg-blue-600 text-blue-100 border-blue-500';
    case 'past':
      return 'bg-gray-600 text-gray-300 border-gray-500';
    default:
      return 'bg-gray-600 text-gray-300 border-gray-500';
  }
};

export default function ManagementTab({
  symbol,
  earningsDate,
  onEarningsDateChange,
  positions,
  positionSummary,
  onPositionManagerOpen
}: ManagementTabProps) {
  const countdown = getEarningsCountdown(earningsDate);

  return (
    <div className="space-y-4">
      {/* 管理タブ: ポジション・決算情報 */}
      {/* 決算情報 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">決算情報</h4>

        {/* 決算日設定 */}
        <div className="space-y-2">
          <label htmlFor={`earnings-date-${symbol}`} className="text-xs font-medium text-blue-300">
            📅 決算発表日
          </label>
          <input
            id={`earnings-date-${symbol}`}
            type="date"
            value={earningsDate}
            onChange={(e) => onEarningsDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        {/* 決算カウントダウン表示 */}
        {countdown && (
          <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(countdown.status)}`}>
            📈 {countdown.text}
          </div>
        )}
      </div>

      {/* ポジション管理 */}
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
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {positions.map((position) => (
                <div key={position.id} className="flex justify-between items-center text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                  <span>{formatShares(position.shares)}株 @ {formatPrice(position.purchasePrice)}円</span>
                  <span>{position.purchaseDate}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
            保有ポジションが登録されていません
          </div>
        )}
      </div>
    </div>
  );
}