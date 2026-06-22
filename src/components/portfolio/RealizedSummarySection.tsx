'use client';

import { useState, useMemo } from 'react';
import { usePortfolioRealizedTrades } from '@/hooks/portfolio/useRealizedTrades';
import { useAccordionState } from '@/hooks/util/useAccordionState';
import { summarizeRealizedTrades } from '@/lib/realizedTradeCalc';
import { formatPrice, formatProfitLoss, formatShares } from '@/lib/positionCalc';
import { playSound } from '@/lib/sound';

export default function RealizedSummarySection() {
  const { trades, isLoading, deleteTrade } = usePortfolioRealizedTrades();
  const { isExpanded, toggle } = useAccordionState();

  const handleDelete = async (tradeId: string, stockId: string) => {
    if (!confirm('この売却記録を削除しますか？\n※ 保有株数は変更されません')) return;
    playSound('buttonDelete');
    await deleteTrade(tradeId, stockId);
  };

  // 売却日(YYYY-MM-DD)の先頭4桁から、データのある年を新しい順に列挙
  const yearOptions = useMemo(() => {
    const years = new Set(trades.map(t => t.sellDate.slice(0, 4)));
    return Array.from(years).sort().reverse();
  }, [trades]);

  // 初期表示は「データのある最新年」。未選択ならyearOptions[0]に追従
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const year = selectedYear ?? yearOptions[0] ?? null;

  // 売却実績が一度も無ければセクション自体を出さない（年フィルタ前の全件で判定）
  if (!isLoading && trades.length === 0) return null;

  const yearTrades = year ? trades.filter(t => t.sellDate.startsWith(`${year}-`)) : [];
  const summary = summarizeRealizedTrades(yearTrades);

  return (
    <div className="mt-2">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📜</span>
          <h3 className="text-sm font-medium text-gray-200">確定損益{year ? `（${year}年）` : ''}</h3>
          {summary.tradeCount > 0 && (
            <span className={`text-xs font-medium ${summary.totalGross >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatProfitLoss(summary.totalGross)}円
            </span>
          )}
        </div>
        <div className={`transform transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4H4z" />
          </svg>
        </div>
      </button>

      <div className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {/* 年セレクタ（データのある年のみ） */}
        {yearOptions.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {yearOptions.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`cursor-pointer text-xs px-2.5 py-1 rounded transition-colors ${
                  y === year ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {y}年
              </button>
            ))}
          </div>
        )}

        {/* 集計カード */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">売却代金合計</div>
            <div className="text-lg font-medium text-cyan-300">
              {formatPrice(summary.totalProceeds)}円
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">手元資金の増加額</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">税引後手取り</div>
            <div className="text-lg font-medium text-cyan-300">
              {formatPrice(Math.round(summary.totalAfterTaxProceeds))}円
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">税金差引後の現金</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">実現損益（税引前）</div>
            <div className={`text-lg font-medium ${summary.totalGross >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatProfitLoss(summary.totalGross)}円
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">実現損益（税引後）</div>
            <div className={`text-lg font-medium ${summary.totalAfterTax >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatProfitLoss(Math.round(summary.totalAfterTax))}円
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">取引回数</div>
            <div className="text-lg font-medium text-white">{summary.tradeCount}回</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">勝率</div>
            <div className="text-lg font-medium text-blue-300">
              {summary.tradeCount > 0 ? Math.round((summary.winCount / summary.tradeCount) * 100) : 0}%
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{summary.winCount}勝 {summary.lossCount}敗</div>
          </div>
        </div>

        {/* 明細 */}
        {yearTrades.length > 0 && (
          <div className="space-y-1.5">
            {yearTrades.map(t => (
              <div key={t.id} className="bg-gray-700/60 rounded px-3 py-2 text-xs flex items-center justify-between gap-2">
                <span className="text-gray-300 min-w-0 truncate">
                  {t.sellDate} ・ {t.symbol} ・ {formatShares(t.soldShares)}株 @ {formatPrice(t.sellPrice)}円
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-gray-400">代金 {formatPrice(t.sellPrice * t.soldShares)}円</span>
                  <span className={t.realizedPL >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                    {formatProfitLoss(t.realizedPL)}円
                  </span>
                  <button
                    onClick={() => handleDelete(t.id, t.stockId)}
                    className="cursor-pointer text-red-400 hover:text-red-300 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
