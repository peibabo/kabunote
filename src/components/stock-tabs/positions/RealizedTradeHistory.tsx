'use client';

import { useRealizedTrades } from '@/hooks/stock/useRealizedTrades';
import { summarizeRealizedTrades, formatAcquisitionPeriod } from '@/lib/realizedTradeCalc';
import { formatPrice, formatProfitLoss, formatShares } from '@/lib/positionCalc';
import { playSound } from '@/lib/sound';
import type { RealizedTrade } from '@/types/realizedTrade';

interface RealizedTradeHistoryProps {
  stockId: string;
  /** 一括取得済みの確定損益。渡すと個別フェッチを行わない */
  initialTrades?: RealizedTrade[];
}

export default function RealizedTradeHistory({ stockId, initialTrades }: RealizedTradeHistoryProps) {
  const { trades, isLoading, deleteTrade } = useRealizedTrades(stockId, initialTrades ? { initialData: initialTrades } : undefined);

  if (isLoading || trades.length === 0) return null;

  const summary = summarizeRealizedTrades(trades);

  const handleDelete = async (tradeId: string) => {
    if (!confirm('この売却記録を削除しますか？\n※ 保有株数は変更されません')) return;
    playSound('buttonDelete');
    await deleteTrade(tradeId);
  };

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
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-300 min-w-0 truncate">
                  {t.sellDate} ・ {formatShares(t.soldShares)}株 @ {formatPrice(t.sellPrice)}円
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={t.realizedPL >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                    {formatProfitLoss(t.realizedPL)}円
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="cursor-pointer text-red-400 hover:text-red-300 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                <span>平均取得単価 {formatPrice(t.costBasis)}円{t.taxRate === 0 && ' ・NISA'}</span>
                {t.memo && <span className="text-gray-400 truncate ml-2 max-w-[55%]">{t.memo}</span>}
              </div>
              {acquisitionPeriod && (
                <div className="text-[10px] text-gray-500 mt-0.5">保有開始 {acquisitionPeriod}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
