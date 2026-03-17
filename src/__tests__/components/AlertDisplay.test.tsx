import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import AlertDisplay from '@/components/alert/AlertDisplay'
import type { AlertInfo } from '@/utils/alertSystem'

describe('AlertDisplay', () => {
  it('アラートなしの場合何も表示しない', () => {
    const { container } = render(
      <AlertDisplay alerts={[]} onClick={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('stop-loss-exceededアラートでドットを表示', () => {
    const alerts: AlertInfo[] = [
      { type: 'stop-loss-exceeded', gapPercentage: 3.5, stopLossPrice: 1400 },
    ]
    const { container } = render(<AlertDisplay alerts={alerts} onClick={vi.fn()} />)
    // ドット要素が存在する
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument()
  })

  it('target-profitアラートで緑色ドットを表示', () => {
    const alerts: AlertInfo[] = [
      { type: 'target-profit', gapPercentage: 3, targetPrice: 1600 },
    ]
    const { container } = render(<AlertDisplay alerts={alerts} onClick={vi.fn()} />)
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
  })

  it('nextaction-warningアラートで黄色ドットを表示', () => {
    const alerts: AlertInfo[] = [
      { type: 'nextaction-warning', gapPercentage: 4, targetPrice: 1560 },
    ]
    const { container } = render(<AlertDisplay alerts={alerts} onClick={vi.fn()} />)
    expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument()
  })
})
