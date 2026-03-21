import { describe, it, expect } from 'vitest'
import {
  calculateDaysUntil,
  getDaysUntilDisplay,
  calculateRightsDate,
  processDividendBenefitData,
  filterDividendBenefitData,
  sortDividendBenefitData,
  calculateDividendBenefitSummary,
  type StockDataInput,
  type DividendBenefitItem,
} from '@/lib/dividendBenefitCalc'

describe('calculateDaysUntil', () => {
  it('空文字列の場合 Infinity を返す', () => {
    expect(calculateDaysUntil('')).toBe(Infinity)
  })

  it('今日の日付の場合 0 を返す', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    expect(calculateDaysUntil(dateStr)).toBe(0)
  })

  it('未来の日付の場合正の値を返す', () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)
    const year = future.getFullYear()
    const month = String(future.getMonth() + 1).padStart(2, '0')
    const day = String(future.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    expect(calculateDaysUntil(dateStr)).toBe(10)
  })

  it('過去の日付の場合負の値を返す', () => {
    const past = new Date()
    past.setDate(past.getDate() - 5)
    const year = past.getFullYear()
    const month = String(past.getMonth() + 1).padStart(2, '0')
    const day = String(past.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    expect(calculateDaysUntil(dateStr)).toBe(-5)
  })
})

describe('getDaysUntilDisplay', () => {
  it('Infinity の場合 "-" を返す', () => {
    expect(getDaysUntilDisplay(Infinity)).toBe('-')
  })

  it('0 の場合 "今日" を返す', () => {
    expect(getDaysUntilDisplay(0)).toBe('今日')
  })

  it('1 の場合 "明日" を返す', () => {
    expect(getDaysUntilDisplay(1)).toBe('明日')
  })

  it('負の値の場合 "N日前" を返す', () => {
    expect(getDaysUntilDisplay(-3)).toBe('3日前')
  })

  it('正の値の場合 "N日後" を返す', () => {
    expect(getDaysUntilDisplay(7)).toBe('7日後')
  })
})

describe('calculateRightsDate', () => {
  it('非アクティブの場合空文字を返す', () => {
    expect(calculateRightsDate({
      isActive: false,
      isRecurring: false,
      month: 3,
      day: 25,
    })).toBe('')
  })

  it('月が未設定の場合空文字を返す', () => {
    expect(calculateRightsDate({
      isActive: true,
      isRecurring: false,
      month: 0,
      day: 25,
    })).toBe('')
  })

  it('日が未設定の場合空文字を返す', () => {
    expect(calculateRightsDate({
      isActive: true,
      isRecurring: false,
      month: 3,
      day: 0,
    })).toBe('')
  })

  it('アクティブかつ有効な設定の場合日付文字列を返す', () => {
    const result = calculateRightsDate({
      isActive: true,
      isRecurring: false,
      month: 6,
      day: 15,
    })
    // toISOString()はUTCで出力されるため、タイムゾーンによって1日ずれる場合がある
    expect(result).toMatch(/^\d{4}-06-1[45]$/)
  })
})

describe('processDividendBenefitData', () => {
  it('空のシンボルリストの場合空配列を返す', () => {
    const result = processDividendBenefitData([], {}, {})
    expect(result).toEqual([])
  })

  it('データが存在しないシンボルをスキップする', () => {
    const result = processDividendBenefitData(['1234'], {}, {})
    expect(result).toEqual([])
  })

  it('配当のみの銘柄を正しく処理する', () => {
    const stockData: StockDataInput = {
      '1234': {
        name: 'テスト株',
        dividendInfo: { dividendPerShare: '50', dividendFrequency: 2, lastUpdated: '' },
        dividendRightsSettings: { isActive: false, isRecurring: false, month: 0, day: 0 },
        shareholderRightsSettings: { isActive: false, isRecurring: false, month: 0, day: 0 },
        position: { totalShares: 100, averagePrice: 1000, weightedTaxRate: 0.20315, purchaseDate: '2024-01-01', notes: '' },
      },
    }
    const result = processDividendBenefitData(['1234'], stockData, { '1234': 'テスト株式会社' })
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('dividend')
    expect(result[0].companyName).toBe('テスト株式会社')
    expect(result[0].annualDividend).toBe(10000) // 50 * 2 * 100
    expect(result[0].hasPosition).toBe(true)
  })

  it('優待のみの銘柄を正しく処理する', () => {
    const stockData: StockDataInput = {
      '5678': {
        name: '優待株',
        shareholderBenefitInfo: {
          benefitDescription: 'クオカード',
          minimumShares: '100',
          benefitMonth: '3',
          estimatedValue: '1000',
          lastUpdated: '',
        },
        dividendRightsSettings: { isActive: false, isRecurring: false, month: 0, day: 0 },
        shareholderRightsSettings: { isActive: false, isRecurring: false, month: 0, day: 0 },
        position: { totalShares: 100, averagePrice: 1000, weightedTaxRate: 0, purchaseDate: '2024-01-01', notes: '' },
      },
    }
    const result = processDividendBenefitData(['5678'], stockData, {})
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('benefit')
    expect(result[0].isEligible).toBe(true)
    expect(result[0].benefitValue).toBe(1000)
  })

  it('配当も優待もない銘柄は type=none', () => {
    const stockData: StockDataInput = {
      '9999': {
        name: 'なし株',
        dividendRightsSettings: { isActive: false, isRecurring: false, month: 0, day: 0 },
        shareholderRightsSettings: { isActive: false, isRecurring: false, month: 0, day: 0 },
      },
    }
    const result = processDividendBenefitData(['9999'], stockData, {})
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('none')
  })

  it('ポジションなしの場合 hasPosition=false', () => {
    const stockData: StockDataInput = {
      '1234': {
        name: 'テスト',
        dividendInfo: { dividendPerShare: '50', dividendFrequency: 2, lastUpdated: '' },
        dividendRightsSettings: { isActive: false, isRecurring: false, month: 0, day: 0 },
        shareholderRightsSettings: { isActive: false, isRecurring: false, month: 0, day: 0 },
      },
    }
    const result = processDividendBenefitData(['1234'], stockData, {})
    expect(result[0].hasPosition).toBe(false)
    expect(result[0].annualDividend).toBe(0) // ポジションなしなので計算されない
  })
})

describe('filterDividendBenefitData', () => {
  const items: DividendBenefitItem[] = [
    { symbol: '1234', companyName: 'テスト', type: 'dividend', hasPosition: true },
    { symbol: '5678', companyName: '優待テスト', type: 'benefit', hasPosition: true },
    { symbol: '9012', companyName: '両方', type: 'both', hasPosition: false },
  ]

  it('all フィルターは全件返す', () => {
    expect(filterDividendBenefitData(items, 'all', '')).toHaveLength(3)
  })

  it('dividend フィルターは配当のみ返す', () => {
    const result = filterDividendBenefitData(items, 'dividend', '')
    expect(result).toHaveLength(1)
    expect(result[0].symbol).toBe('1234')
  })

  it('検索クエリでフィルターする', () => {
    const result = filterDividendBenefitData(items, 'all', '優待')
    expect(result).toHaveLength(1)
    expect(result[0].symbol).toBe('5678')
  })

  it('シンボルで検索できる', () => {
    const result = filterDividendBenefitData(items, 'all', '9012')
    expect(result).toHaveLength(1)
    expect(result[0].symbol).toBe('9012')
  })

  it('空白クエリは無視される', () => {
    expect(filterDividendBenefitData(items, 'all', '   ')).toHaveLength(3)
  })
})

describe('sortDividendBenefitData', () => {
  const items: DividendBenefitItem[] = [
    { symbol: 'B', companyName: 'B', type: 'dividend', hasPosition: true, dividendYield: 3, annualDividend: 200 },
    { symbol: 'A', companyName: 'A', type: 'dividend', hasPosition: true, dividendYield: 5, annualDividend: 100 },
    { symbol: 'C', companyName: 'C', type: 'dividend', hasPosition: true, dividendYield: 1, annualDividend: 300 },
  ]

  it('symbol 昇順ソート', () => {
    const result = sortDividendBenefitData(items, 'symbol', 'asc')
    expect(result.map(i => i.symbol)).toEqual(['A', 'B', 'C'])
  })

  it('dividendYield 降順ソート', () => {
    const result = sortDividendBenefitData(items, 'dividendYield', 'desc')
    expect(result.map(i => i.symbol)).toEqual(['A', 'B', 'C'])
  })

  it('annualDividend 昇順ソート', () => {
    const result = sortDividendBenefitData(items, 'annualDividend', 'asc')
    expect(result.map(i => i.symbol)).toEqual(['A', 'B', 'C'])
  })
})

describe('calculateDividendBenefitSummary', () => {
  it('空配列の場合デフォルト値を返す', () => {
    const result = calculateDividendBenefitSummary([])
    expect(result.totalStocks).toBe(0)
    expect(result.dividendStocks).toBe(0)
    expect(result.benefitStocks).toBe(0)
    expect(result.totalAnnualDividend).toBe(0)
    expect(result.avgDividendYield).toBe(0)
  })

  it('配当銘柄のサマリーを正しく計算する', () => {
    const items: DividendBenefitItem[] = [
      { symbol: '1234', companyName: 'A', type: 'dividend', hasPosition: true, annualDividend: 10000, afterTaxDividend: 7968, dividendYield: 5 },
      { symbol: '5678', companyName: 'B', type: 'both', hasPosition: true, annualDividend: 5000, afterTaxDividend: 3984, dividendYield: 3, benefitValue: 1000, isEligible: true },
    ]
    const result = calculateDividendBenefitSummary(items)
    expect(result.totalStocks).toBe(2)
    expect(result.dividendStocks).toBe(2) // dividend + both
    expect(result.benefitStocks).toBe(1) // both のみ
    expect(result.totalAnnualDividend).toBe(15000)
    expect(result.totalAfterTaxDividend).toBe(11952)
    expect(result.avgDividendYield).toBe(4) // (5+3)/2
    expect(result.totalBenefitValue).toBe(1000)
    expect(result.eligibleBenefits).toBe(1)
  })
})
