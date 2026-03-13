import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  extractUpcomingEvents,
  extractActiveAlerts,
  extractHighPriorityActions,
  calculatePortfolioHighlight,
  getEventTypeLabel,
} from '@/lib/dailyDigestCalc'
import type { CalendarDataMap } from '@/hooks/useCalendarData'
import type { StockData } from '@/hooks/useStockData'

// ---- テストヘルパー ----

const createMockStockData = (overrides: Partial<StockData> = {}): StockData => ({
  id: '1',
  symbol: '7203',
  name: 'トヨタ自動車',
  sector: '輸送用機器',
  market: 'プライム',
  order: 0,
  currentPrice: 2500,
  targetPrice: 3000,
  stopLossPrice: 2000,
  memo: '',
  positions: [],
  events: [],
  dividend: null,
  benefit: null,
  tags: [],
  nextActionPlan: null,
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

const createMockCalendarData = (): CalendarDataMap => ({})

const defaultRightsSettings = { month: null, day: null, isRecurring: true, isActive: false }

// ---- extractUpcomingEvents ----

describe('extractUpcomingEvents', () => {
  it('空のカレンダーデータでは空配列を返す', () => {
    const result = extractUpcomingEvents({}, 7, new Date(2026, 2, 14))
    expect(result).toEqual([])
  })

  it('期間内の決算イベントを抽出する', () => {
    const today = new Date(2026, 2, 14) // 2026-03-14
    const calendarData: CalendarDataMap = {
      '7203': {
        name: 'トヨタ自動車',
        earningsDate: '2026-03-16',
        dividendRightsSettings: defaultRightsSettings,
        shareholderRightsSettings: defaultRightsSettings,
        shareholderMeetingSettings: defaultRightsSettings,
      },
    }

    const result = extractUpcomingEvents(calendarData, 7, today)
    expect(result).toHaveLength(1)
    expect(result[0].symbol).toBe('7203')
    expect(result[0].type).toBe('earnings')
    expect(result[0].daysUntil).toBe(2)
  })

  it('期間外のイベントは含まない', () => {
    const today = new Date(2026, 2, 14)
    const calendarData: CalendarDataMap = {
      '7203': {
        name: 'トヨタ自動車',
        earningsDate: '2026-03-30',
        dividendRightsSettings: defaultRightsSettings,
        shareholderRightsSettings: defaultRightsSettings,
        shareholderMeetingSettings: defaultRightsSettings,
      },
    }

    const result = extractUpcomingEvents(calendarData, 7, today)
    expect(result).toHaveLength(0)
  })

  it('配当権利確定日を抽出する', () => {
    const today = new Date(2026, 2, 14)
    const calendarData: CalendarDataMap = {
      '9432': {
        name: 'NTT',
        earningsDate: '',
        dividendRightsSettings: { month: 3, day: 18, isRecurring: true, isActive: true },
        shareholderRightsSettings: defaultRightsSettings,
        shareholderMeetingSettings: defaultRightsSettings,
      },
    }

    const result = extractUpcomingEvents(calendarData, 7, today)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('dividend_rights')
    expect(result[0].daysUntil).toBe(4)
  })

  it('複数イベントをdaysUntil順にソートする', () => {
    const today = new Date(2026, 2, 14)
    const calendarData: CalendarDataMap = {
      '7203': {
        name: 'トヨタ',
        earningsDate: '2026-03-20',
        dividendRightsSettings: defaultRightsSettings,
        shareholderRightsSettings: defaultRightsSettings,
        shareholderMeetingSettings: defaultRightsSettings,
      },
      '9432': {
        name: 'NTT',
        earningsDate: '2026-03-15',
        dividendRightsSettings: defaultRightsSettings,
        shareholderRightsSettings: defaultRightsSettings,
        shareholderMeetingSettings: defaultRightsSettings,
      },
    }

    const result = extractUpcomingEvents(calendarData, 7, today)
    expect(result).toHaveLength(2)
    expect(result[0].symbol).toBe('9432') // 1日後
    expect(result[1].symbol).toBe('7203') // 6日後
  })

  it('今日のイベントはdaysUntil=0で含まれる', () => {
    const today = new Date(2026, 2, 14)
    const calendarData: CalendarDataMap = {
      '7203': {
        name: 'トヨタ',
        earningsDate: '2026-03-14',
        dividendRightsSettings: defaultRightsSettings,
        shareholderRightsSettings: defaultRightsSettings,
        shareholderMeetingSettings: defaultRightsSettings,
      },
    }

    const result = extractUpcomingEvents(calendarData, 7, today)
    expect(result).toHaveLength(1)
    expect(result[0].daysUntil).toBe(0)
  })
})

// ---- extractActiveAlerts ----

describe('extractActiveAlerts', () => {
  it('空のデータでは空配列を返す', () => {
    const result = extractActiveAlerts([], '0')
    expect(result).toEqual([])
  })

  it('現在価格が0以下の銘柄はスキップする', () => {
    const stockData = [createMockStockData({ currentPrice: 0 })]
    const result = extractActiveAlerts(stockData, '1000000')
    expect(result).toEqual([])
  })

  it('損切りライン超過のアラートを緊急として返す', () => {
    const stockData = [createMockStockData({
      currentPrice: 1900,
      stopLossPrice: 2000,
    })]

    const result = extractActiveAlerts(stockData, '1000000')
    expect(result.length).toBeGreaterThan(0)
    const stopLossAlert = result.find(a => a.type === 'stop-loss-exceeded')
    expect(stopLossAlert).toBeDefined()
    expect(stopLossAlert!.isUrgent).toBe(true)
  })

  it('スヌーズ中のアラートを除外する', () => {
    const stockData = [createMockStockData({
      currentPrice: 1900,
      stopLossPrice: 2000,
    })]

    const snoozedAlerts = [{
      alertKey: '7203-stop-loss-exceeded',
      symbol: '7203',
      alertType: 'stop-loss-exceeded' as const,
      snoozeUntil: Date.now() + 60000,
      snoozedAt: Date.now(),
      duration: 60 as const,
      originalAlert: {
        companyName: 'トヨタ',
        alertMessage: '',
        alertDetail: '',
        currentPrice: 1900,
        stopLossPrice: 2000,
      },
    }]

    const result = extractActiveAlerts(stockData, '1000000', snoozedAlerts)
    const stopLossAlert = result.find(a => a.type === 'stop-loss-exceeded')
    expect(stopLossAlert).toBeUndefined()
  })
})

// ---- extractHighPriorityActions ----

describe('extractHighPriorityActions', () => {
  it('空のデータでは空配列を返す', () => {
    const result = extractHighPriorityActions([], '0')
    expect(result).toEqual([])
  })

  it('NextActionPlanがない銘柄はスキップする', () => {
    const stockData = [createMockStockData({ nextActionPlan: null })]
    const result = extractHighPriorityActions(stockData, '0')
    expect(result).toEqual([])
  })

  it('NextActionPlanがある銘柄を返す', () => {
    const stockData = [createMockStockData({
      nextActionPlan: {
        actionType: 'buy',
        priority: 'high',
        targetPrice: 2400,
        targetShares: 100,
        strategyMemo: 'テスト',
      },
    })]

    const result = extractHighPriorityActions(stockData, '1000000')
    expect(result).toHaveLength(1)
    expect(result[0].actionType).toBe('buy')
    expect(result[0].priority).toBe('high')
  })

  it('優先度とapproachingでソートする', () => {
    const stockData = [
      createMockStockData({
        symbol: 'A',
        name: 'A社',
        currentPrice: 2500,
        nextActionPlan: {
          actionType: 'buy',
          priority: 'low',
          targetPrice: 2400,
          targetShares: 100,
          strategyMemo: '',
        },
      }),
      createMockStockData({
        symbol: 'B',
        name: 'B社',
        currentPrice: 2500,
        nextActionPlan: {
          actionType: 'buy',
          priority: 'high',
          targetPrice: 2000,
          targetShares: 100,
          strategyMemo: '',
        },
      }),
    ]

    const result = extractHighPriorityActions(stockData, '1000000')
    expect(result).toHaveLength(2)
    // A社は2500→2400で4%差=approaching, B社は2500→2000で20%差
    expect(result[0].symbol).toBe('A') // approachingが優先
    expect(result[1].symbol).toBe('B')
  })
})

// ---- calculatePortfolioHighlight ----

describe('calculatePortfolioHighlight', () => {
  it('ポジションがない場合はnullを返す', () => {
    const stockData = [createMockStockData()]
    const result = calculatePortfolioHighlight(stockData)
    expect(result).toBeNull()
  })

  it('ポジションありの場合はハイライト情報を返す', () => {
    const stockData = [createMockStockData({
      currentPrice: 2500,
      positions: [
        { id: '1', shares: 100, purchasePrice: 2000, purchaseDate: '', memo: '', createdAt: '' },
      ],
    })]

    const result = calculatePortfolioHighlight(stockData)
    expect(result).not.toBeNull()
    expect(result!.totalInvestment).toBe(200000) // 100 * 2000
    expect(result!.totalCurrentValue).toBe(250000) // 100 * 2500
    expect(result!.totalProfitLoss).toBe(50000)
    expect(result!.totalProfitLossRate).toBeCloseTo(25)
    expect(result!.stocksWithPositions).toBe(1)
  })

  it('現在価格が0の銘柄はスキップする', () => {
    const stockData = [createMockStockData({
      currentPrice: 0,
      positions: [
        { id: '1', shares: 100, purchasePrice: 2000, purchaseDate: '', memo: '', createdAt: '' },
      ],
    })]

    const result = calculatePortfolioHighlight(stockData)
    expect(result).toBeNull()
  })

  it('複数銘柄のポジションを合算する', () => {
    const stockData = [
      createMockStockData({
        symbol: '7203',
        currentPrice: 2500,
        positions: [
          { id: '1', shares: 100, purchasePrice: 2000, purchaseDate: '', memo: '', createdAt: '' },
        ],
      }),
      createMockStockData({
        symbol: '9432',
        currentPrice: 5000,
        positions: [
          { id: '2', shares: 200, purchasePrice: 4000, purchaseDate: '', memo: '', createdAt: '' },
        ],
      }),
    ]

    const result = calculatePortfolioHighlight(stockData)
    expect(result).not.toBeNull()
    expect(result!.totalInvestment).toBe(1000000) // 200000 + 800000
    expect(result!.totalCurrentValue).toBe(1250000) // 250000 + 1000000
    expect(result!.stocksWithPositions).toBe(2)
  })
})

// ---- getEventTypeLabel ----

describe('getEventTypeLabel', () => {
  it('正しいラベルを返す', () => {
    expect(getEventTypeLabel('earnings')).toBe('決算')
    expect(getEventTypeLabel('dividend_rights')).toBe('配当権利')
    expect(getEventTypeLabel('benefit_rights')).toBe('優待権利')
    expect(getEventTypeLabel('shareholder_meeting')).toBe('株主総会')
  })
})
