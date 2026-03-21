'use client';

import { PositionSummary } from '@/types/positions';
import { playSound } from '@/lib/sound';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';
import { calculateDividendInfo } from '@/lib/dividendCalc';
import { useStockDividend } from '@/hooks/stock/useStockDividend';
import DividendRightsDateForm from './dividend/DividendRightsDateForm';
import DividendSimulation from './dividend/DividendSimulation';

interface DividendManagementProps {
  symbol: string;
  positionSummary: PositionSummary;
  initialDividend?: {
    dividendPerShare: number | null;
    frequency: number;
    rightsMonth: number | null;
    rightsDay: number | null;
  } | null;
}

export default function DividendManagement({
  symbol,
  positionSummary,
  initialDividend,
}: DividendManagementProps) {
  const {
    dividendPerShare,
    dividendFrequency,
    dividendRightsSettings,
    updateDividendPerShare,
    updateDividendFrequency,
    updateDividendRightsSettings,
  } = useStockDividend(`stock-${symbol}`, initialDividend !== undefined ? { initialData: initialDividend } : undefined);

  // 配当計算
  const dividendCalculation = (() => {
    const perShare = parseFloat(dividendPerShare);
    const frequency = dividendFrequency;

    if (!perShare || perShare <= 0 || positionSummary.totalShares === 0) {
      return null;
    }

    return calculateDividendInfo(
      perShare,
      frequency,
      positionSummary.totalShares,
      positionSummary.averagePrice,
      positionSummary.weightedTaxRate
    );
  })();

  const onChangeSound = useSoundOnChange();

  const handleMonthChange = (value: string) => {
    playSound('select');
    const month = value ? parseInt(value) : null;
    updateDividendRightsSettings({
      ...dividendRightsSettings,
      month,
      isActive: month !== null && dividendRightsSettings.day !== null
    });
  };

  const handleDayChange = (value: string) => {
    playSound('select');
    const day = value ? parseInt(value) : null;
    updateDividendRightsSettings({
      ...dividendRightsSettings,
      day,
      isActive: dividendRightsSettings.month !== null && day !== null
    });
  };

  const handleRecurringChange = (isRecurring: boolean) => {
    playSound('toggle');
    updateDividendRightsSettings({
      ...dividendRightsSettings,
      isRecurring
    });
  };

  return (
    <div className="space-y-4">
      {positionSummary.totalShares === 0 && (
        <div className="text-xs text-gray-400 text-center mt-1">配当権利確定日を入力すると投資タイムラインで<br></br>日程を確認できるようになります</div>
      )}

      {/* 配当権利確定日設定 */}
      <DividendRightsDateForm
        dividendRightsSettings={dividendRightsSettings}
        onMonthChange={handleMonthChange}
        onDayChange={handleDayChange}
        onRecurringChange={handleRecurringChange}
      />

      {/* 配当情報 */}
      <div className="space-y-3">
        {positionSummary.totalShares === 0 ? (
          <div className="text-center bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg px-2 py-2">
            <div className="text-xs text-yellow-300 mb-1">配当計算</div>
            <div className="text-sm font-medium text-gray-400 mb-1">
              ---
            </div>
            <div className="text-xs text-yellow-400">
              {'\u{1F4A1}'} 株式を保有している場合は、先に保有状況タブから<br></br>ポジションを設定してください
            </div>
          </div>
        ) : (
          <>
            {/* 配当金入力フィールド */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor={`dividend-per-share-${symbol}`} className="text-xs font-medium text-green-300">
                  1株当たり配当金
                </label>
                <div className="relative">
                  <input
                    id={`dividend-per-share-${symbol}`}
                    type="number"
                    value={dividendPerShare}
                    onChange={(e) => { updateDividendPerShare(e.target.value); onChangeSound(); }}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none text-sm pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor={`dividend-frequency-${symbol}`} className="text-xs font-medium text-green-300">
                  配当頻度
                </label>
                <select
                  id={`dividend-frequency-${symbol}`}
                  value={dividendFrequency}
                  onChange={(e) => { playSound('select'); updateDividendFrequency(parseInt(e.target.value) as 1 | 2 | 4); }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none text-sm"
                >
                  <option value="1">年1回</option>
                  <option value="2">年2回</option>
                  <option value="4">年4回</option>
                </select>
              </div>
            </div>

            {/* 配当計算結果 */}
            <DividendSimulation
              dividendCalculation={dividendCalculation}
              dividendPerShare={dividendPerShare}
              dividendFrequency={dividendFrequency}
              positionSummary={positionSummary}
            />
          </>
        )}
      </div>
    </div>
  );
}
