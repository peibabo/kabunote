import React, { useState } from 'react';
import { AlertInfo } from '@/utils/alertSystem';

interface AlertDisplayProps {
  alerts: AlertInfo[];
  onClick: () => void;
}

/**
 * アラート表示コンポーネント（左上アイコン + ホバーツールチップ）
 * 統合アラートシステムで判定された複数アラートを左上にコンパクトに表示
 */
export default function AlertDisplay({ alerts, onClick }: AlertDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);

  // アラートが無い場合は非表示
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // メインアラート（最優先）を取得
  const primaryAlert = alerts[0];

  // アラート種別に応じたスタイリング（メインアラートベース）
  const getAlertStyles = () => {
    switch (primaryAlert.type) {
      case 'nextaction-approaching':
      case 'stop-loss':
      case 'stop-loss-exceeded':
      case 'insufficient-funds':
        return {
          dotColor: 'bg-red-500',
          glowColor: 'shadow-red-500/50',
          animationSpeed: 'animate-pulse', // 高速点滅
          tooltipBg: 'bg-red-900/95 border-red-500/50'
        };
      case 'target-profit':
        return {
          dotColor: 'bg-green-500',
          glowColor: 'shadow-green-500/50',
          animationSpeed: 'animate-pulse', // 中速点滅
          tooltipBg: 'bg-green-900/95 border-green-500/50'
        };
      case 'nextaction-warning':
      default:
        return {
          dotColor: 'bg-yellow-500',
          glowColor: 'shadow-yellow-500/50',
          animationSpeed: 'animate-pulse', // ゆっくり点滅
          tooltipBg: 'bg-yellow-900/95 border-yellow-500/50'
        };
    }
  };

  // 個別アラートメッセージ取得
  const getAlertMessage = (alert: AlertInfo) => {
    switch (alert.type) {
      case 'nextaction-approaching': return '🚨 次の一手目標に接近中';
      case 'stop-loss': return '🔻 損切りラインに接近';
      case 'stop-loss-exceeded': return '💥 損切りライン超過';
      case 'target-profit': return '💰 利確目標に接近';
      case 'nextaction-warning': return '⚠️ 注意：次の一手目標に接近';
      case 'insufficient-funds': return '💸 資金不足：投資実行不可';
      default: return '';
    }
  };

  // 個別アラート詳細情報取得
  const getDetailMessage = (alert: AlertInfo) => {
    switch (alert.type) {
      case 'nextaction-approaching': return '乖離率2%以内';
      case 'nextaction-warning': return '乖離率2-5%以内';
      case 'stop-loss':
      case 'stop-loss-exceeded':
      case 'target-profit':
        return alert.gapPercentage ? `乖離率${alert.gapPercentage.toFixed(1)}%` : '';
      case 'insufficient-funds':
        if (alert.analysis && alert.analysis.requiredInvestment && alert.analysis.cashAvailable) {
          const shortfall = alert.analysis.requiredInvestment - alert.analysis.cashAvailable;
          return `不足額：${new Intl.NumberFormat('ja-JP').format(Math.round(shortfall))}円`;
        }
        return '資金確認が必要';
      default: return '';
    }
  };

  const styles = getAlertStyles();

  return (
    <div
      className="absolute top-2 left-2 z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 点滅するアラートドット */}
      <div
        onClick={onClick}
        className={`
          w-3 h-3 rounded-full cursor-pointer transition-all duration-200
          ${styles.dotColor} ${styles.animationSpeed} ${styles.glowColor}
          shadow-lg hover:scale-110
        `}
        style={{
          boxShadow: '0 0 10px currentColor, 0 0 20px currentColor'
        }}
      />

      {/* ホバーツールチップ */}
      {isHovered && (
        <div
          className={`
            absolute top-5 left-0 min-w-[200px] p-3 rounded-lg border
            text-white text-sm font-medium z-50 pointer-events-none
            ${styles.tooltipBg}
          `}
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* アラート一覧表示 */}
          {alerts.map((alert, index) => (
            <div key={`alert-${index}`} className={`${index > 0 ? 'mt-3 pt-3 border-t border-gray-600' : ''}`}>
              <div className="font-semibold mb-1">
                {getAlertMessage(alert)}
              </div>
              <div className="text-xs opacity-90">
                {getDetailMessage(alert)}
              </div>
            </div>
          ))}

          {/* 複数アラート表示時の統計情報 */}
          {alerts.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-600 text-xs opacity-70">
              合計 {alerts.length} 件のアラート
            </div>
          )}

          {/* ツールチップの矢印 */}
          <div className={`
            absolute -top-1 left-2 w-2 h-2 rotate-45
            ${styles.dotColor}
          `} />
        </div>
      )}
    </div>
  );
}