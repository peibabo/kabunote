import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FloatingSnapshotButton from '@/components/settings/FloatingSnapshotButton'
import { getJSTHour } from '@/lib/dateJst'

vi.mock('@/lib/sound', () => ({ playSound: vi.fn() }))
vi.mock('@/lib/dateJst', () => ({
  getJSTHour: vi.fn(() => 16),
  getTodayJST: vi.fn(() => '2026-08-27'),
}))

// 記録済み/未記録を切り替えられるfetchモック
const setupFetch = (recorded: boolean) => {
  const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'POST') {
      return { ok: true, json: async () => ({}) } as Response
    }
    return {
      ok: true,
      json: async () => ({ data: recorded ? [{ snapshotDate: '2026-08-27' }] : [] }),
    } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

describe('FloatingSnapshotButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getJSTHour as Mock).mockReturnValue(16)
  })

  describe('表示条件', () => {
    it('15時前は何も表示されない', async () => {
      ;(getJSTHour as Mock).mockReturnValue(10)
      const fetchMock = setupFetch(false)
      render(<FloatingSnapshotButton hasSnapshotReady={true} />)
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(screen.queryByText('本日の終値を確定')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('本日記録済み（タップで上書き）')).not.toBeInTheDocument()
    })

    it('hasSnapshotReady=false の場合は何も表示されない', async () => {
      const fetchMock = setupFetch(false)
      render(<FloatingSnapshotButton hasSnapshotReady={false} />)
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(screen.queryByText('本日の終値を確定')).not.toBeInTheDocument()
    })

    it('15時以降・本日未記録 → 「本日の終値を確定」ボタンが表示される', async () => {
      setupFetch(false)
      render(<FloatingSnapshotButton hasSnapshotReady={true} />)
      expect(await screen.findByText('本日の終値を確定')).toBeInTheDocument()
    })

    it('15時以降・本日記録済み → ミニ上書きボタンが表示される', async () => {
      setupFetch(true)
      render(<FloatingSnapshotButton hasSnapshotReady={true} />)
      expect(await screen.findByLabelText('本日記録済み（タップで上書き）')).toBeInTheDocument()
      expect(screen.queryByText('本日の終値を確定')).not.toBeInTheDocument()
    })
  })

  describe('上書きフロー', () => {
    it('ミニボタンをタップすると「最新データで上書き」に展開される', async () => {
      setupFetch(true)
      render(<FloatingSnapshotButton hasSnapshotReady={true} />)
      const mini = await screen.findByLabelText('本日記録済み（タップで上書き）')
      fireEvent.click(mini)
      expect(screen.getByText('最新データで上書き')).toBeInTheDocument()
    })

    it('「最新データで上書き」クリックでPOSTされ「更新しました！」が表示される', async () => {
      const fetchMock = setupFetch(true)
      render(<FloatingSnapshotButton hasSnapshotReady={true} />)
      fireEvent.click(await screen.findByLabelText('本日記録済み（タップで上書き）'))
      fireEvent.click(screen.getByText('最新データで上書き'))
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/portfolio/snapshot', { method: 'POST' })
      })
      expect(await screen.findByText('更新しました！')).toBeInTheDocument()
    })

    it('展開中に外側をクリックするとミニボタンに戻る', async () => {
      setupFetch(true)
      render(<FloatingSnapshotButton hasSnapshotReady={true} />)
      fireEvent.click(await screen.findByLabelText('本日記録済み（タップで上書き）'))
      expect(screen.getByText('最新データで上書き')).toBeInTheDocument()
      fireEvent.mouseDown(document.body)
      await waitFor(() => {
        expect(screen.queryByText('最新データで上書き')).not.toBeInTheDocument()
      })
      expect(screen.getByLabelText('本日記録済み（タップで上書き）')).toBeInTheDocument()
    })
  })

  describe('新規記録フロー', () => {
    it('「本日の終値を確定」クリックでPOSTされ「記録しました！」が表示される', async () => {
      const fetchMock = setupFetch(false)
      render(<FloatingSnapshotButton hasSnapshotReady={true} />)
      fireEvent.click(await screen.findByText('本日の終値を確定'))
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/portfolio/snapshot', { method: 'POST' })
      })
      expect(await screen.findByText('記録しました！')).toBeInTheDocument()
    })
  })
})
