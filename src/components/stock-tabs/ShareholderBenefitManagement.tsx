'use client';

import { PositionSummary } from '@/types/positions';
import { calculateShareholderBenefit } from '@/lib/shareholderCalc';
import { calculateRightsDateFromSettings } from '@/types/rightsDate';
import { useStockBenefit } from '@/hooks/stock/useStockBenefit';
import BenefitForm from '@/components/stock-tabs/benefit/BenefitForm';
import BenefitDisplay from '@/components/stock-tabs/benefit/BenefitDisplay';

interface ShareholderBenefitManagementProps {
  symbol: string;
  positionSummary: PositionSummary;
  initialBenefit?: {
    description: string | null;
    minimumShares: number | null;
    estimatedValue: number | null;
    rightsMonth: number | null;
    rightsDay: number | null;
  } | null;
}

export default function ShareholderBenefitManagement({
  symbol,
  positionSummary,
  initialBenefit,
}: ShareholderBenefitManagementProps) {
  const {
    description: benefitDescription,
    minimumShares,
    estimatedValue,
    rightsSettings: shareholderRightsSettings,
    updateDescription: setBenefitDescription,
    updateMinimumShares: setMinimumShares,
    updateEstimatedValue: setEstimatedValue,
    updateRightsSettings: onShareholderRightsSettingsChange,
  } = useStockBenefit(`stock-${symbol}`, initialBenefit !== undefined ? { initialData: initialBenefit } : undefined)

  // 株主優待計算
  const shareholderBenefitCalculation = (() => {
    const minShares = parseInt(minimumShares);
    const estValue = parseFloat(estimatedValue);

    if (!minShares || minShares <= 0 || !estValue || estValue <= 0 || positionSummary.totalShares === 0) {
      return null;
    }

    return calculateShareholderBenefit(
      minShares,
      positionSummary.totalShares,
      estValue,
      positionSummary.totalCost
    );
  })();

  // 株主優待権利確定日の取得
  const shareholderRightsDate = calculateRightsDateFromSettings(shareholderRightsSettings);
  const hasPosition = positionSummary.totalShares > 0;

  return (
    <div className="space-y-4">
      {!hasPosition && (
        <div className="text-xs text-gray-400 text-center mt-1">株主優待権利確定日を入力すると投資タイムラインで<br></br>日程を確認できるようになります</div>
      )}

      <BenefitForm
        symbol={symbol}
        hasPosition={hasPosition}
        benefitDescription={benefitDescription}
        minimumShares={minimumShares}
        estimatedValue={estimatedValue}
        shareholderRightsSettings={shareholderRightsSettings}
        setBenefitDescription={setBenefitDescription}
        setMinimumShares={setMinimumShares}
        setEstimatedValue={setEstimatedValue}
        onShareholderRightsSettingsChange={onShareholderRightsSettingsChange}
      />

      <BenefitDisplay
        rightsDate={shareholderRightsDate}
        shareholderBenefitCalculation={shareholderBenefitCalculation}
        minimumShares={minimumShares}
        estimatedValue={estimatedValue}
        hasPosition={hasPosition}
      />
    </div>
  );
}
