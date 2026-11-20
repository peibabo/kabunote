import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import PortfolioChart from '@/components/portfolio/PortfolioChart'
import type { PortfolioSnapshotData } from '@/types/portfolio'

// jsdom ではグラフを描画できないため、子要素を素通しするだけのモックにする
vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Empty = () => null
  return {
    ResponsiveContainer: Pass,
    LineChart: Pass,
    AreaChart: Pass,
    Line: Empty,
    Area: Empty,
    XAxis: Empty,
    YAxis: Empty,
    CartesianGrid: Empty,
    Tooltip: Empty,
    ReferenceLine: Empty,
  }
})
vi.mock('@/data/stockNames', () => ({ loadStockData: vi.fn().mockResolvedValue(new Map()) }))

const snapshot: PortfolioSnapshotData = {
  id: 's1',
  snapshotDate: '2026-11-19',
  totalInvestment: 100000,
  totalValue: 110000,
  profitLoss: 10000,
  cashAmount: 0,
  netAssets: 110000,
  stockSnapshots: [],
}

describe('PortfolioChart 過去の株価修正の案内', () => {
  it('記録0件では案内を出さない（空状態の説明のみ）', () => {
    render(<PortfolioChart data={[]} />)
    expect(screen.queryByTestId('past-price-edit-hint')).toBeNull()
    expect(screen.getByText(/株価は自動では更新されない/)).toBeDefined()
  })

  it('評価額タブでは「値上がり率」タブへの切り替えリンクを出し、押すと修正方法の案内に変わる', () => {
    render(<PortfolioChart data={[snapshot]} />)
    const hint = screen.getByTestId('past-price-edit-hint')
    expect(hint.textContent).toContain('記録した日の株価を後から直すには')

    // 上部のグラフ種別タブとは別の、案内文中のリンクを押す
    fireEvent.click(within(hint).getByRole('button', { name: /値上がり率/ }))
    expect(screen.getByTestId('past-price-edit-hint').textContent).toContain('昨日以前の点をクリックすると、その日の株価を修正できます')
  })
})
