import { useMemo } from 'react';
import { NextActionPlan } from '@/types/nextActionPlan';
import { PositionSummary } from '@/types/positions';
import { getAllActiveAlerts, AlertInfo } from '@/utils/alertSystem';

interface CardStyles {
  bgClass: string;
  borderClass: string;
  bgAnimationStyle: React.CSSProperties;
}

interface UseStockAlertsReturn {
  alerts: AlertInfo[];
  cardStyles: CardStyles;
}

/**
 * 銘柄カードのアラート計算フック
 *
 * - アラート種別に応じたカードスタイル（背景色・ボーダー・アニメーション）を返す
 */
export function useStockAlerts(
  symbol: string,
  nextActionPlan: NextActionPlan | null,
  currentPrice: string,
  targetPrice: string,
  stopLoss: string,
  positionSummary: PositionSummary,
  availableCash: number,
  isPositionLoading: boolean,
): UseStockAlertsReturn {
  const alerts = useMemo<AlertInfo[]>(() => {
    if (!nextActionPlan) return [];

    return getAllActiveAlerts(
      nextActionPlan,
      parseFloat(currentPrice) || 0,
      parseFloat(targetPrice) || 0,
      stopLoss,
      positionSummary.totalShares > 0 ? positionSummary : undefined,
      availableCash
    );
  }, [
    symbol,
    nextActionPlan?.targetPrice,
    nextActionPlan?.targetQuantity,
    nextActionPlan?.actionType,
    nextActionPlan?.priority,
    nextActionPlan?.memo,
    currentPrice,
    targetPrice,
    stopLoss,
    positionSummary,
    availableCash,
    isPositionLoading,
  ]);

  const cardStyles = useMemo<CardStyles>(() => {
    if (alerts.length === 0) {
      return {
        bgClass: 'bg-gray-800',
        borderClass: 'border-gray-700',
        bgAnimationStyle: {}
      };
    }

    const primaryAlert = alerts[0];

    switch (primaryAlert.type) {
      case 'insufficient-funds':
      case 'stop-loss-exceeded':
      case 'nextaction-approaching':
        return {
          bgClass: '',
          borderClass: 'border-red-500/40',
          bgAnimationStyle: {
            backgroundImage: 'linear-gradient(45deg, rgb(31 41 55), rgb(55 31 31))',
            backgroundSize: '400% 400%',
            animation: 'bgPulse 2s ease-in-out infinite',
          }
        };
      case 'stop-loss':
        return {
          bgClass: '',
          borderClass: 'border-red-500/30',
          bgAnimationStyle: {
            backgroundImage: 'linear-gradient(45deg, rgb(31 41 55), rgb(51 35 35))',
            backgroundSize: '400% 400%',
            animation: 'bgPulse 2.5s ease-in-out infinite',
          }
        };
      case 'target-profit':
        return {
          bgClass: '',
          borderClass: 'border-green-500/30',
          bgAnimationStyle: {
            backgroundImage: 'linear-gradient(45deg, rgb(31 41 55), rgb(31 51 35))',
            backgroundSize: '400% 400%',
            animation: 'bgPulse 2.5s ease-in-out infinite',
          }
        };
      case 'nextaction-warning':
      default:
        return {
          bgClass: '',
          borderClass: 'border-yellow-500/30',
          bgAnimationStyle: {
            backgroundImage: 'linear-gradient(45deg, rgb(31 41 55), rgb(51 47 31))',
            backgroundSize: '400% 400%',
            animation: 'bgPulse 3s ease-in-out infinite',
          }
        };
    }
  }, [alerts]);

  return { alerts, cardStyles };
}
