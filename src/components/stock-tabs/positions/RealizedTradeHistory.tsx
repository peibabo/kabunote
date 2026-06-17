'use client';

import { useRealizedTrades } from '@/hooks/stock/useRealizedTrades';
import { summarizeRealizedTrades, formatAcquisitionPeriod } from '@/lib/realizedTradeCalc';
import { formatPrice, formatProfitLoss, formatShares } from '@/lib/positionCalc';

interface RealizedTradeHistoryProps {
  stockId: string;
}

export default function RealizedTradeHistory({ stockId }: RealizedTradeHistoryProps) {
  const { trades, isLoading } = useRealizedTrades(stockId);

  if (isLoading || trades.length === 0) return null;

  const summary = summarizeRealizedTrades(trades);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">{'\u{1F4DC}'} 確定損益（{summary.tradeCount}件）</h4>
        <span className={`text-sm font-semibold ${summary.totalGross >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatProfitLoss(summary.totalGross)}円
        </span>
      </div>

      <div className="space-y-1.5">
        {trades.map(t => {
          const acquisitionPeriod = formatAcquisitionPeriod(t.consumedLots);
          return (
            <div key={t.id} className="bg-gray-700/60 rounded px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">
                  {t.sellDate} ・ {formatShares(t.soldShares)}株 @ {formatPrice(t.sellPrice)}円
                </span>
                <span className={t.realizedPL >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {formatProfitLoss(t.realizedPL)}円
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                <span>
                  取得 {formatPrice(t.costBasis)}円{t.taxRate === 0 && ' ・NISA'}
                  {acquisitionPeriod && ` ・取得日 ${acquisitionPeriod}`}
                </span>
                {t.memo && <span className="text-gray-400 truncate ml-2 max-w-[50%]">{t.memo}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
