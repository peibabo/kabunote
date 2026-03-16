import { describe, it, expect } from 'vitest'
import { chartMemoKey, VALID_CHART_TYPES } from '@/types/portfolio'

describe('chartMemoKey', () => {
  it('日付+チャートタイプでキーを生成', () => {
    expect(chartMemoKey('2024-06-15', 'value')).toBe('2024-06-15|value|')
    expect(chartMemoKey('2024-06-15', 'profitLoss')).toBe('2024-06-15|profitLoss|')
  })

  it('シンボルありでキーを生成', () => {
    expect(chartMemoKey('2024-06-15', 'stocks', '7203')).toBe('2024-06-15|stocks|7203')
  })

  it('シンボルがundefinedの場合は空文字', () => {
    expect(chartMemoKey('2024-06-15', 'value', undefined)).toBe('2024-06-15|value|')
  })

  it('シンボルが空文字の場合', () => {
    expect(chartMemoKey('2024-06-15', 'value', '')).toBe('2024-06-15|value|')
  })

  it('異なる日付/タイプ/シンボルは異なるキー', () => {
    const key1 = chartMemoKey('2024-06-15', 'value')
    const key2 = chartMemoKey('2024-06-16', 'value')
    const key3 = chartMemoKey('2024-06-15', 'profitLoss')
    const key4 = chartMemoKey('2024-06-15', 'stocks', '7203')
    const key5 = chartMemoKey('2024-06-15', 'stocks', '9984')

    expect(new Set([key1, key2, key3, key4, key5]).size).toBe(5)
  })
})

describe('VALID_CHART_TYPES', () => {
  it('4種類のチャートタイプが定義されている', () => {
    expect(VALID_CHART_TYPES).toEqual(['value', 'netAssets', 'profitLoss', 'stocks'])
  })
})
