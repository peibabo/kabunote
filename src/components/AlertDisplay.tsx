import React from 'react';
import { AlertInfo } from '@/utils/alertSystem';

interface AlertDisplayProps {
  alert: AlertInfo;
  onClick: () => void;
}

/**
 * アラート表示コンポーネント
 * 統合アラートシステムで判定されたアラートを視覚的に表示
 */
export default function AlertDisplay({ alert, onClick }: AlertDisplayProps) {
  if (alert.type === 'none') {
    return null;
  }

  // アラート種別に応じたスタイリング
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'nextaction-approaching':
      case 'stop-loss':
      case 'stop-loss-exceeded':
      case 'insufficient-funds':
        return {
          containerClass: 'bg-red-900/30 border border-red-500/50 hover:bg-red-900/40',
          glowClass: 'bg-red-400/5',
          dotClass: 'bg-red-400',
          textClass: 'text-red-400',
          detailClass: 'text-red-300',
          scanlineClass: 'via-red-400/10',
          boxShadow: '0 0 10px rgba(248, 113, 113, 0.8), 0 0 20px rgba(248, 113, 113, 0.4)'
        };
      case 'target-profit':
        return {
          containerClass: 'bg-green-900/30 border border-green-500/50 hover:bg-green-900/40',
          glowClass: 'bg-green-400/5',
          dotClass: 'bg-green-400',
          textClass: 'text-green-400',
          detailClass: 'text-green-300',
          scanlineClass: 'via-green-400/10',
          boxShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.4)'
        };
      case 'nextaction-warning':
      default:
        return {
          containerClass: 'bg-yellow-900/30 border border-yellow-500/50 hover:bg-yellow-900/40',
          glowClass: 'bg-yellow-400/5',
          dotClass: 'bg-yellow-400',
          textClass: 'text-yellow-400',
          detailClass: 'text-yellow-300',
          scanlineClass: 'via-yellow-400/10',
          boxShadow: '0 0 10px rgba(251, 191, 36, 0.8), 0 0 20px rgba(251, 191, 36, 0.4)'
        };
    }
  };

  // アラート種別に応じたメッセージ
  const getAlertMessage = () => {
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

  // 詳細情報の表示
  const getDetailMessage = () => {
    switch (alert.type) {
      case 'nextaction-approaching': return '（乖離率2%以内）';
      case 'nextaction-warning': return '（乖離率2-5%以内）';
      case 'stop-loss':
      case 'stop-loss-exceeded':
      case 'target-profit':
        return alert.gapPercentage ? `（乖離率${alert.gapPercentage.toFixed(1)}%）` : '';
      case 'insufficient-funds':
        if (alert.analysis && alert.analysis.requiredInvestment && alert.analysis.cashAvailable) {
          const shortfall = alert.analysis.requiredInvestment - alert.analysis.cashAvailable;
          return `（不足額：${new Intl.NumberFormat('ja-JP').format(Math.round(shortfall))}円）`;
        }
        return '（資金確認が必要）';
      default: return '';
    }
  };

  const styles = getAlertStyles();

  return (
    <div
      onClick={onClick}
      className={`mb-4 relative p-3 rounded-lg overflow-hidden cursor-pointer transition-colors ${styles.containerClass}`}
    >
      {/* ネオングロー背景 */}
      <div className={`absolute inset-0 animate-pulse ${styles.glowClass}`}></div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${styles.dotClass}`}
              style={{ boxShadow: styles.boxShadow }}
            ></div>
            <span className={`text-sm font-medium ${styles.textClass}`}>
              {getAlertMessage()}
            </span>
          </div>
          <div className={`text-xs ${styles.detailClass}`}>
            {getDetailMessage()}
          </div>
        </div>
      </div>

      {/* スキャンライン効果 */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent animate-pulse ${styles.scanlineClass}`}></div>
      </div>
    </div>
  );
}