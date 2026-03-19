import type { Position, PositionSummary, StockTargetInfo, ProfitLossInfo } from '@/types/positions'
import type { NextActionPlan, ActionType, Priority } from '@/types/nextActionPlan'
import type { RightsDateSettings } from '@/types/rightsDate'
import type { CustomTag, TagColor } from '@/types/tags'

let idCounter = 0

export function createPosition(overrides?: Partial<Position>): Position {
  idCounter++
  return {
    id: `pos-${idCounter}`,
    shares: 100,
    purchasePrice: 1500,
    purchaseDate: '2024-06-01',
    taxRate: 0.20315,
    createdAt: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}

export function createPositionSummary(overrides?: Partial<PositionSummary>): PositionSummary {
  return {
    totalShares: 100,
    averagePrice: 1500,
    totalCost: 150000,
    positionCount: 1,
    weightedTaxRate: 0.20315,
    ...overrides,
  }
}

export function createProfitLossInfo(overrides?: Partial<ProfitLossInfo>): ProfitLossInfo {
  return {
    targetProfit: 10000,
    targetProfitPercent: 6.67,
    stopLoss: -5000,
    stopLossPercent: -3.33,
    ...overrides,
  }
}

export function createStockTargetInfo(overrides?: Partial<StockTargetInfo>): StockTargetInfo {
  return {
    symbol: '7203',
    positionSummary: createPositionSummary(),
    targetPrice: 1600,
    stopLossPrice: 1450,
    profitLossInfo: createProfitLossInfo(),
    ...overrides,
  }
}

export function createNextActionPlan(overrides?: Partial<NextActionPlan>): NextActionPlan {
  return {
    id: 'nap-1',
    targetPrice: 1500,
    targetQuantity: 100,
    memo: 'テストメモ',
    actionType: 'buy' as ActionType,
    priority: 'medium' as Priority,
    updatedAt: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}

export function createRightsDateSettings(overrides?: Partial<RightsDateSettings>): RightsDateSettings {
  return {
    month: 3,
    day: 31,
    isRecurring: true,
    isActive: true,
    ...overrides,
  }
}

export function createCustomTag(overrides?: Partial<CustomTag>): CustomTag {
  idCounter++
  return {
    id: `tag-${idCounter}`,
    label: 'テストタグ',
    color: 'blue' as TagColor,
    createdAt: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}
