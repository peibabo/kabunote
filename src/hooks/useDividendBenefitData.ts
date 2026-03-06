import { useState, useEffect } from 'react';
import { getStockData } from '@/data/stockNames';
import { StockData } from '@/hooks/useStockData';
import { DividendInfo } from '@/types/dividend';
import { ShareholderBenefitInfo } from '@/types/shareholder';
import {
  DividendRightsSettings,
  ShareholderRightsSettings,
  createDefaultRightsSettings,
} from '@/types/rightsDate';

export type DividendBenefitStockData = {
  name: string;
  dividendInfo?: DividendInfo;
  shareholderBenefitInfo?: ShareholderBenefitInfo;
  dividendRightsSettings: DividendRightsSettings;
  shareholderRightsSettings: ShareholderRightsSettings;
  position?: { totalShares: number; averagePrice: number; purchaseDate: string; notes: string };
};

interface UseDividendBenefitDataReturn {
  dividendBenefitData: Record<string, DividendBenefitStockData>;
}

export function useDividendBenefitData(
  stocks: string[],
  stockData: StockData[],
  isOpen: boolean,
  isInitialized: boolean
): UseDividendBenefitDataReturn {
  const [dividendBenefitData, setDividendBenefitData] = useState<Record<string, DividendBenefitStockData>>({});

  useEffect(() => {
    if (!isOpen || !isInitialized) return;

    const loadData = async () => {
      const result: Record<string, DividendBenefitStockData> = {};

      for (const symbol of stocks) {
        const stockInfo = await getStockData(symbol);
        const dbStock = stockData.find(s => s.symbol === symbol);

        const dividendInfo = dbStock?.dividend?.dividendPerShare != null
          ? {
              dividendPerShare: String(dbStock.dividend.dividendPerShare),
              dividendFrequency: (dbStock.dividend.frequency ?? 1) as 1 | 2 | 4,
              lastUpdated: new Date().toISOString()
            }
          : undefined;

        const dividendRightsSettings = dbStock?.dividend?.rightsMonth != null && dbStock?.dividend?.rightsDay != null
          ? { month: dbStock.dividend.rightsMonth, day: dbStock.dividend.rightsDay, isRecurring: true, isActive: true }
          : createDefaultRightsSettings();

        const shareholderBenefitInfo = dbStock?.benefit?.description
          ? {
              benefitDescription: dbStock.benefit.description,
              minimumShares: dbStock.benefit.minimumShares != null ? String(dbStock.benefit.minimumShares) : '',
              benefitMonth: dbStock.benefit.rightsMonth != null ? String(dbStock.benefit.rightsMonth) : '12',
              estimatedValue: dbStock.benefit.estimatedValue != null ? String(dbStock.benefit.estimatedValue) : '',
              lastUpdated: new Date().toISOString()
            }
          : undefined;

        const shareholderRightsSettings = dbStock?.benefit?.rightsMonth != null && dbStock?.benefit?.rightsDay != null
          ? { month: dbStock.benefit.rightsMonth, day: dbStock.benefit.rightsDay, isRecurring: true, isActive: true }
          : createDefaultRightsSettings();

        // stockData からポジション情報を直接取得
        let position: DividendBenefitStockData['position'] = undefined;
        const positions = dbStock?.positions ?? [];
        if (positions.length > 0) {
          const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
          const totalCost = positions.reduce((sum, pos) => sum + (pos.shares * pos.purchasePrice), 0);
          const averagePrice = totalShares > 0 ? totalCost / totalShares : 0;

          position = {
            totalShares,
            averagePrice,
            purchaseDate: positions[0].purchaseDate,
            notes: positions.map(p => p.memo).filter(Boolean).join(', ')
          };
        }

        result[symbol] = {
          name: dbStock?.name || stockInfo?.name || symbol,
          dividendInfo,
          shareholderBenefitInfo,
          dividendRightsSettings,
          shareholderRightsSettings,
          position
        };
      }

      setDividendBenefitData(result);
    };

    loadData();
  }, [isOpen, isInitialized, stocks, stockData]);

  return { dividendBenefitData };
}
