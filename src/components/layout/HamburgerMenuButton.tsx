'use client';

import { useMemo } from 'react';

interface HamburgerMenuButtonProps {
  onClick: () => void;
  alertCounts: { total: number; urgent: number };
}

export default function HamburgerMenuButton({ onClick, alertCounts }: HamburgerMenuButtonProps) {
  // アラートの緊急度に基づく表示スタイル
  const alertStyle = useMemo(() => {
    if (alertCounts.total === 0) {
      return {
        showBadge: false,
        badgeColor: '',
        shouldPulse: false
      };
    }

    // 緊急アラートがある場合は赤で点滅
    if (alertCounts.urgent > 0) {
      return {
        showBadge: true,
        badgeColor: 'bg-red-500',
        shouldPulse: true
      };
    }

    // 警告アラートのみの場合は黄色で点滅
    return {
      showBadge: true,
      badgeColor: 'bg-yellow-500',
      shouldPulse: true
    };
  }, [alertCounts]);

  return (
    <button
      onClick={onClick}
      className="cursor-pointer relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      title="メニューを開く"
    >
      {/* ハンバーガーアイコン */}
      <div className="w-6 h-6 flex flex-col justify-center space-y-1">
        <div className="w-full h-0.5 bg-current"></div>
        <div className="w-full h-0.5 bg-current"></div>
        <div className="w-full h-0.5 bg-current"></div>
      </div>

      {/* アラート件数バッジ */}
      {alertStyle.showBadge && (
        <span
          className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs font-bold text-white rounded-full flex items-center justify-center ${
            alertStyle.badgeColor
          } ${alertStyle.shouldPulse ? 'animate-pulse' : ''}`}
        >
          {alertCounts.total > 99 ? '99+' : alertCounts.total}
        </span>
      )}
    </button>
  );
}