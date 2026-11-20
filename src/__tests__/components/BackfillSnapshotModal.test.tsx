import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BackfillSnapshotModal from '@/components/portfolio/BackfillSnapshotModal'

vi.mock('@/lib/sound', () => ({ playSound: vi.fn() }))

const preview = (date: string, price: number | null) => ({
  success: true,
  data: {
    date,
    stocks: [{ stockId: 'stock-1', symbol: '7203', name: 'トヨタ自動車', shares: 100, cost: 200000, suggestedPrice: price }],
    suggestedCash: 400000,
  },
})

describe('BackfillSnapshotModal', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const u = String(url)
      const date = new URL(u, 'http://localhost').searchParams.get('date') ?? ''
      return { ok: true, json: async () => preview(date, date === '2026-11-18' ? 2500 : null) } as Response
    })
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('直近の未記録日を初期選択し、株価・現金の初期値を表示する', async () => {
    render(<BackfillSnapshotModal missingDates={['2026-11-18', '2026-11-16']} onClose={vi.fn()} onSave={vi.fn()} />)
    expect(await screen.findByDisplayValue('2500')).toBeDefined()
    expect(screen.getByDisplayValue('400000')).toBeDefined()
    expect(screen.getByText('100株')).toBeDefined()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('date=2026-11-18'), undefined)
  })

  it('保存すると入力値で onSave を呼び、閉じる', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    const onClose = vi.fn()
    render(<BackfillSnapshotModal missingDates={['2026-11-18']} onClose={onClose} onSave={onSave} />)
    const input = await screen.findByDisplayValue('2500')
    fireEvent.change(input, { target: { value: '2600' } })
    fireEvent.click(screen.getByText('この日の記録を追加'))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('2026-11-18', [{ stockId: 'stock-1', currentPrice: 2600 }], 400000))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('株価が空の銘柄があると保存できない', async () => {
    render(<BackfillSnapshotModal missingDates={['2026-11-16']} onClose={vi.fn()} onSave={vi.fn()} />)
    await screen.findByDisplayValue('400000')
    expect((screen.getByText('この日の記録を追加') as HTMLButtonElement).disabled).toBe(true)
  })

  it('日付を切り替えると初期値を取り直す', async () => {
    render(<BackfillSnapshotModal missingDates={['2026-11-18', '2026-11-16']} onClose={vi.fn()} onSave={vi.fn()} />)
    await screen.findByDisplayValue('2500')
    fireEvent.change(screen.getByLabelText('日付'), { target: { value: '2026-11-16' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('date=2026-11-16'), undefined))
  })

  it('取得エラーはメッセージを表示する', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ message: 'この日はすでに記録されています' }),
    } as Response)) as unknown as typeof fetch
    render(<BackfillSnapshotModal missingDates={['2026-11-18']} onClose={vi.fn()} onSave={vi.fn()} />)
    expect(await screen.findByText('この日はすでに記録されています')).toBeDefined()
  })
})
