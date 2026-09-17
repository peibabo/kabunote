import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChartMemoModal from '@/components/portfolio/ChartMemoModal'
import type { ChartType } from '@/types/portfolio'

vi.mock('@/lib/sound', () => ({
  playSound: vi.fn(),
}))

const baseProps = {
  isOpen: true as const,
  onClose: vi.fn(),
  snapshotDate: '2024-06-15',
  existingContent: '',
  onSave: vi.fn().mockResolvedValue(true),
  onDelete: vi.fn().mockResolvedValue(true),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ChartMemoModal', () => {
  it('各 chartType で例外なく描画される', () => {
    const types: ChartType[] = ['value', 'netAssets', 'profitLoss', 'stocks']
    for (const chartType of types) {
      const { unmount } = render(
        <ChartMemoModal {...baseProps} chartType={chartType} symbol={chartType === 'stocks' ? '7203' : undefined} />
      )
      expect(screen.getByText('チャートメモ', { exact: false })).toBeDefined()
      unmount()
    }
  })

  // 回帰: CHART_TYPE_LABELS に無い chartType でも typeInfo.icon でクラッシュしない
  it('未知の chartType でもクラッシュせず描画される', () => {
    expect(() =>
      render(
        <ChartMemoModal {...baseProps} chartType={'unknown' as unknown as ChartType} />
      )
    ).not.toThrow()
    expect(screen.getByText('チャートメモ', { exact: false })).toBeDefined()
  })

  // 回帰: snapshotDate が文字列でなくても formatDateYMDJP の split でクラッシュしない
  it('非文字列の snapshotDate でもクラッシュせず描画される', () => {
    expect(() =>
      render(
        <ChartMemoModal
          {...baseProps}
          chartType="stocks"
          snapshotDate={12345 as unknown as string}
        />
      )
    ).not.toThrow()
    expect(screen.getByText('チャートメモ', { exact: false })).toBeDefined()
  })

  it('editablePrice と onSavePrice があると株価修正UIが表示される', () => {
    render(
      <ChartMemoModal
        {...baseProps}
        chartType="stocks"
        symbol="7203"
        editablePrice={{ snapshotId: 'snap-1', stockId: 'stock-1', symbol: '7203', currentPrice: 2000 }}
        onSavePrice={vi.fn().mockResolvedValue(true)}
      />
    )
    expect(screen.getByText('この日の株価を修正', { exact: false })).toBeDefined()
  })

  it('editablePrice が無ければ株価修正UIは表示されない', () => {
    render(<ChartMemoModal {...baseProps} chartType="stocks" symbol="7203" />)
    expect(screen.queryByText('この日の株価を修正', { exact: false })).toBeNull()
  })
})
