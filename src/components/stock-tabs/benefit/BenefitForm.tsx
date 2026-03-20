'use client';

import { playSound } from '@/lib/sound';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';

interface RightsSettings {
  month: number | null;
  day: number | null;
  isRecurring: boolean;
  isActive: boolean;
}

interface BenefitFormProps {
  symbol: string;
  hasPosition: boolean;
  benefitDescription: string;
  minimumShares: string;
  estimatedValue: string;
  shareholderRightsSettings: RightsSettings;
  setBenefitDescription: (value: string) => void;
  setMinimumShares: (value: string) => void;
  setEstimatedValue: (value: string) => void;
  onShareholderRightsSettingsChange: (settings: RightsSettings) => void;
}

export default function BenefitForm({
  symbol,
  hasPosition,
  benefitDescription,
  minimumShares,
  estimatedValue,
  shareholderRightsSettings,
  setBenefitDescription,
  setMinimumShares,
  setEstimatedValue,
  onShareholderRightsSettingsChange,
}: BenefitFormProps) {
  const onChangeSound = useSoundOnChange();

  const handleMonthChange = (value: string) => {
    playSound('select');
    const month = value ? parseInt(value) : null;
    onShareholderRightsSettingsChange({
      ...shareholderRightsSettings,
      month,
      isActive: month !== null && shareholderRightsSettings.day !== null
    });
  };

  const handleDayChange = (value: string) => {
    playSound('select');
    const day = value ? parseInt(value) : null;
    onShareholderRightsSettingsChange({
      ...shareholderRightsSettings,
      day,
      isActive: shareholderRightsSettings.month !== null && day !== null
    });
  };

  const handleRecurringChange = (isRecurring: boolean) => {
    playSound('toggle');
    onShareholderRightsSettingsChange({
      ...shareholderRightsSettings,
      isRecurring
    });
  };

  return (
    <>
      {/* 株主優待権利確定日設定 */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-purple-300">
          株主優待権利確定日
        </label>

        {/* 月/日入力 */}
        <div className="flex items-center space-x-2">
          <select
            value={shareholderRightsSettings.month || ''}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs font-thin focus:border-purple-400 focus:outline-none"
          >
            <option value="">月</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month}>{month}月</option>
            ))}
          </select>
          <span className="text-gray-400 text-xs font-thin">/</span>
          <select
            value={shareholderRightsSettings.day || ''}
            onChange={(e) => handleDayChange(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs font-thin focus:border-purple-400 focus:outline-none"
          >
            <option value="">日</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>{day}日</option>
            ))}
          </select>
        </div>

        {/* 繰り返し設定 */}
        <div className="flex items-center space-x-2 pt-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shareholderRightsSettings.isRecurring}
              onChange={(e) => handleRecurringChange(e.target.checked)}
              className="w-3 h-3 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-1"
            />
            <span className="text-xs font-thin text-gray-300 flex items-center space-x-1">
              <span>毎年</span>
              <span className="text-purple-400">↻</span>
            </span>
          </label>
          {!shareholderRightsSettings.isRecurring && (
            <span className="text-xs font-thin text-orange-300">今回のみ</span>
          )}
        </div>
      </div>

      {/* 株主優待情報入力フィールド（ポジションがある場合のみ） */}
      {hasPosition && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor={`benefit-description-${symbol}`} className="text-xs font-medium text-purple-300">
              優待内容
            </label>
            <input
              id={`benefit-description-${symbol}`}
              type="text"
              value={benefitDescription}
              onChange={(e) => { setBenefitDescription(e.target.value); onChangeSound(); }}
              placeholder="例：お米券1000円分"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={`minimum-shares-${symbol}`} className="text-xs font-medium text-purple-300">
                必要株数（100株単位）
              </label>
              <div className="relative">
                <input
                  id={`minimum-shares-${symbol}`}
                  type="number"
                  value={minimumShares ? Math.floor(parseInt(minimumShares) / 100).toString() : ''}
                  onChange={(e) => {
                    const units = e.target.value;
                    const shares = units ? (parseInt(units) * 100).toString() : '';
                    setMinimumShares(shares);
                    onChangeSound();
                  }}
                  placeholder="1"
                  title="100株単位で入力してください（例：1 = 100株、5 = 500株）"
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm pr-12"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">×100株</span>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor={`estimated-value-${symbol}`} className="text-xs font-medium text-purple-300">
                優待推定価値
              </label>
              <div className="relative">
                <input
                  id={`estimated-value-${symbol}`}
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => { setEstimatedValue(e.target.value); onChangeSound(); }}
                  placeholder="1000"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm pr-8"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
