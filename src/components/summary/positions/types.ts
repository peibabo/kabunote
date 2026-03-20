export interface PositionRowData {
  symbol: string;
  companyName: string;
  totalShares: number;
  averagePrice: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossRate: number;
  profitLossAfterTax: number;
  portfolioWeight: number;
}

export type SortKey = 'symbol' | 'totalShares' | 'averagePrice' | 'totalCost' | 'currentValue' | 'profitLoss' | 'profitLossRate';
