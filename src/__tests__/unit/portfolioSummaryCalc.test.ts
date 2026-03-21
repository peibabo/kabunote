import { describe, it, expect } from 'vitest'
import { calculateOverallSummary, type PortfolioStockData } from '@/lib/portfolioSummaryCalc'

const makeStock = (overrides: Partial<PortfolioStockData> = {}): PortfolioStockData => ({
  id: '1',
  symbol: '1234',
  name: 'テスト株',
  sector: null,
  currentPrice: null,
  targetPrice: null,
  stopLossPrice: null,
  positions: [],
  dividend: null,
  benefit: null,
  tags: [],
  ...overrides,
})

describe('calculateOverallSummary', () => {
  it('空のポートフォリオの場合デフォルト値を返す', () => {
    const result = calculateOverallSummary([], '0')
    expect(result.totalInvestment).toBe(0)
    expect(result.totalCurrentValue).toBe(0)
    expect(result.totalProfitLoss).toBe(0)
    expect(result.totalProfitLossRate).toBe(0)
    expect(result.totalShares).toBe(0)
    expect(result.stocksWithPositions).toBe(0)
    expect(result.stocksWithPrices).toBe(0)
    expect(result.stocksWithoutPrices).toBe(0)
  })

  it('現金のみの場合現金比率100%', () => {
    const result = calculateOverallSummary([], '1000000')
    expect(result.cashAmount).toBe(1000000)
    expect(result.cashRatio).toBe(100)
    expect(result.stockRatio).toBe(0)
    expect(result.totalAssets).toBe(1000000)
  })

  it('不正な現金額は0として扱う', () => {
    const result = calculateOverallSummary([], 'abc')
    expect(result.cashAmount).toBe(0)
  })

  it('ポジションのある銘柄を正しく集計する', () => {
    const stocks: PortfolioStockData[] = [
      makeStock({
        symbol: '1234',
        currentPrice: 1500,
        positions: [
          { id: '1', shares: 100, purchasePrice: 1000, purchaseDate: '2024-01-01', taxRate: 0.20315, createdAt: '2024-01-01' },
        ],
      }),
    ]
    const result = calculateOverallSummary(stocks, '0')
    expect(result.stocksWithPositions).toBe(1)
    expect(result.stocksWithPrices).toBe(1)
    expect(result.totalInvestment).toBe(100000) // 100 * 1000
    expect(result.totalCurrentValue).toBe(150000) // 100 * 1500
    expect(result.totalProfitLoss).toBe(50000)
    expect(result.totalProfitLossRate).toBe(50)
    expect(result.totalShares).toBe(100)
  })

  it('現在価格がない銘柄は stocksWithoutPrices に計上', () => {
    const stocks: PortfolioStockData[] = [
      makeStock({
        currentPrice: null,
        positions: [
          { id: '1', shares: 100, purchasePrice: 1000, purchaseDate: '2024-01-01', taxRate: 0.20315, createdAt: '2024-01-01' },
        ],
      }),
    ]
    const result = calculateOverallSummary(stocks, '0')
    expect(result.stocksWithPrices).toBe(0)
    expect(result.stocksWithoutPrices).toBe(1)
    expect(result.totalCurrentValue).toBe(0)
  })

  it('ポジションなしの銘柄はスキップされる', () => {
    const stocks: PortfolioStockData[] = [
      makeStock({ positions: [] }),
    ]
    const result = calculateOverallSummary(stocks, '0')
    expect(result.stocksWithPositions).toBe(0)
  })

  it('配当サマリーを正しく計算する', () => {
    const stocks: PortfolioStockData[] = [
      makeStock({
        currentPrice: 1000,
        dividend: { dividendPerShare: 50, frequency: 2, rightsMonth: 3, rightsDay: 25 },
        positions: [
          { id: '1', shares: 100, purchasePrice: 1000, purchaseDate: '2024-01-01', taxRate: 0.20315, createdAt: '2024-01-01' },
        ],
      }),
    ]
    const result = calculateOverallSummary(stocks, '0')
    expect(result.dividendSummary.stocksWithDividend).toBe(1)
    expect(result.dividendSummary.totalAnnualDividend).toBe(10000) // 50 * 2 * 100
    expect(result.dividendSummary.averageDividendYield).toBe(10) // (10000 / 100000) * 100
  })

  it('株主優待サマリーを正しく計算する', () => {
    const stocks: PortfolioStockData[] = [
      makeStock({
        benefit: { minimumShares: 100, estimatedValue: 5000, description: 'クオカード', rightsMonth: 3, rightsDay: 25 },
        positions: [
          { id: '1', shares: 100, purchasePrice: 1000, purchaseDate: '2024-01-01', taxRate: 0, createdAt: '2024-01-01' },
        ],
      }),
    ]
    const result = calculateOverallSummary(stocks, '0')
    expect(result.shareholderSummary.totalStocksWithBenefits).toBe(1)
    expect(result.shareholderSummary.totalEligibleStocks).toBe(1)
    expect(result.shareholderSummary.totalEstimatedValue).toBe(5000)
  })

  it('現金と株式の比率を正しく計算する', () => {
    const stocks: PortfolioStockData[] = [
      makeStock({
        currentPrice: 1000,
        positions: [
          { id: '1', shares: 100, purchasePrice: 1000, purchaseDate: '2024-01-01', taxRate: 0.20315, createdAt: '2024-01-01' },
        ],
      }),
    ]
    // 株式評価額 100,000 + 現金 100,000 = 総資産 200,000
    const result = calculateOverallSummary(stocks, '100000')
    expect(result.totalAssets).toBe(200000)
    expect(result.stockRatio).toBe(50)
    expect(result.cashRatio).toBe(50)
  })

  it('複数銘柄の集計が正しい', () => {
    const stocks: PortfolioStockData[] = [
      makeStock({
        symbol: 'A',
        currentPrice: 2000,
        positions: [
          { id: '1', shares: 50, purchasePrice: 1000, purchaseDate: '2024-01-01', taxRate: 0.20315, createdAt: '2024-01-01' },
        ],
      }),
      makeStock({
        symbol: 'B',
        currentPrice: 500,
        positions: [
          { id: '2', shares: 200, purchasePrice: 1000, purchaseDate: '2024-01-01', taxRate: 0, createdAt: '2024-01-01' },
        ],
      }),
    ]
    const result = calculateOverallSummary(stocks, '0')
    expect(result.stocksWithPositions).toBe(2)
    expect(result.stocksWithPrices).toBe(2)
    expect(result.totalInvestment).toBe(250000) // 50*1000 + 200*1000
    expect(result.totalCurrentValue).toBe(200000) // 50*2000 + 200*500
    expect(result.totalProfitLoss).toBe(-50000)
    expect(result.totalShares).toBe(250)
  })

  it('損益目標サマリーが含まれる', () => {
    const stocks: PortfolioStockData[] = [
      makeStock({
        currentPrice: 1000,
        targetPrice: 1500,
        stopLossPrice: 800,
        positions: [
          { id: '1', shares: 100, purchasePrice: 1000, purchaseDate: '2024-01-01', taxRate: 0.20315, createdAt: '2024-01-01' },
        ],
      }),
    ]
    const result = calculateOverallSummary(stocks, '0')
    expect(result.targetSummary.targetSetCount).toBe(1)
    expect(result.targetSummary.stopLossSetCount).toBe(1)
    expect(result.targetSummary.totalTargetProfit).toBe(50000) // (1500-1000)*100
    expect(result.targetSummary.totalStopLoss).toBe(-20000) // (800-1000)*100
  })
})
