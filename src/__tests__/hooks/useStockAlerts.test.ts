import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStockAlerts } from '@/hooks/useStockAlerts'
import { createNextActionPlan, createPositionSummary } from '../helpers/mockFactories'

describe('useStockAlerts', () => {
  it('アラートを計算する', () => {
    const plan = createNextActionPlan({ targetPrice: 1510 })
    const summary = createPositionSummary()

    const { result } = renderHook(() =>
      useStockAlerts('7203', plan, '1500', '1600', '1400', summary, 200000, false)
    )

    expect(result.current.alerts.length).toBeGreaterThanOrEqual(1)
  })

  it('アラートなしの場合のカードスタイル', () => {
    const plan = createNextActionPlan({ targetPrice: null })
    const summary = createPositionSummary()

    const { result } = renderHook(() =>
      useStockAlerts('7203', plan, '1500', '0', '0', summary, 200000, false)
    )

    expect(result.current.cardStyles.bgClass).toBe('bg-gray-800')
    expect(result.current.cardStyles.borderClass).toBe('border-gray-700')
  })

  it('nextActionPlan=nullの場合アラートなし', () => {
    const summary = createPositionSummary()

    const { result } = renderHook(() =>
      useStockAlerts('7203', null, '1500', '1600', '1400', summary, 200000, false)
    )

    expect(result.current.alerts).toEqual([])
  })
})
