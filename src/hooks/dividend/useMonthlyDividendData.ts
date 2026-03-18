import { useMemo } from 'react';
import { DividendBenefitStockData } from '@/hooks/dividend/useDividendBenefitData';
import { calculateAfterTaxDividend } from '@/lib/dividendCalc';

export interface MonthlyDividendStock {
  symbol: string;
  name: string;
  amount: number;
  afterTaxAmount: number;
}

export interface MonthlyDividendEntry {
  month: number;
  label: string;
  grossAmount: number;
  afterTaxAmount: number;
  stocks: MonthlyDividendStock[];
}

export interface MonthlyDividendSummary {
  months: MonthlyDividendEntry[];
  yearlyGross: number;
  yearlyAfterTax: number;
  maxMonthlyAmount: number;
  stockCount: number;
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getPaymentMonths(rightsMonth: number, frequency: number): number[] {
  // 配当は権利確定月の約3ヶ月後に支払われるのが一般的
  // ただしここでは「権利確定月」をベースに配分
  const months: number[] = [rightsMonth];

  if (frequency === 2) {
    // 半年ごと
    const secondMonth = ((rightsMonth - 1 + 6) % 12) + 1;
    months.push(secondMonth);
  } else if (frequency === 4) {
    // 四半期ごと
    for (let i = 1; i < 4; i++) {
      const m = ((rightsMonth - 1 + 3 * i) % 12) + 1;
      months.push(m);
    }
  }

  return months;
}

export function useMonthlyDividendData(
  dividendBenefitData: Record<string, DividendBenefitStockData>
): MonthlyDividendSummary {
  return useMemo(() => {
    const monthData: MonthlyDividendEntry[] = MONTH_LABELS.map((label, i) => ({
      month: i + 1,
      label,
      grossAmount: 0,
      afterTaxAmount: 0,
      stocks: [],
    }));

    let stockCount = 0;

    for (const [symbol, data] of Object.entries(dividendBenefitData)) {
      if (!data.dividendInfo?.dividendPerShare || !data.position) continue;

      const dividendPerShare = parseFloat(data.dividendInfo.dividendPerShare);
      if (dividendPerShare <= 0) continue;

      const frequency = data.dividendInfo.dividendFrequency || 1;
      const totalShares = data.position.totalShares;
      const rightsMonth = data.dividendRightsSettings?.month;

      if (!rightsMonth || !data.dividendRightsSettings?.isActive) continue;

      stockCount++;

      // 年間配当 = 1株配当 × 頻度 × 保有株数
      const annualDividend = dividendPerShare * frequency * totalShares;
      // 1回あたりの配当
      const perPayment = annualDividend / frequency;

      const paymentMonths = getPaymentMonths(rightsMonth, frequency);

      for (const month of paymentMonths) {
        const entry = monthData[month - 1];
        const afterTax = calculateAfterTaxDividend(perPayment);
        entry.grossAmount += perPayment;
        entry.afterTaxAmount += afterTax;
        entry.stocks.push({
          symbol,
          name: data.name,
          amount: perPayment,
          afterTaxAmount: afterTax,
        });
      }
    }

    const yearlyGross = monthData.reduce((sum, m) => sum + m.grossAmount, 0);
    const yearlyAfterTax = monthData.reduce((sum, m) => sum + m.afterTaxAmount, 0);
    const maxMonthlyAmount = Math.max(...monthData.map(m => m.grossAmount), 1);

    return { months: monthData, yearlyGross, yearlyAfterTax, maxMonthlyAmount, stockCount };
  }, [dividendBenefitData]);
}
