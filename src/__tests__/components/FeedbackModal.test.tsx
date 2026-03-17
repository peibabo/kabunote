import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FeedbackModal from '@/components/modal/FeedbackModal'

vi.mock('@/lib/apiClient', () => ({
  apiPost: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/sound', () => ({
  playSound: vi.fn(),
}))

import { apiPost } from '@/lib/apiClient'
import { toast } from '@/lib/toast'
import { playSound } from '@/lib/sound'

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FeedbackModal', () => {
  it('isOpen=false の場合は何も表示しない', () => {
    const { container } = render(<FeedbackModal isOpen={false} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('モーダルが表示される', () => {
    render(<FeedbackModal {...defaultProps} />)
    expect(screen.getByText('📮 目安箱')).toBeDefined()
    expect(screen.getByText('機能要望')).toBeDefined()
    expect(screen.getByText('改善提案')).toBeDefined()
    expect(screen.getByText('不具合報告')).toBeDefined()
    expect(screen.getByText('その他')).toBeDefined()
  })

  it('カテゴリを選択できる', () => {
    render(<FeedbackModal {...defaultProps} />)
    fireEvent.click(screen.getByText('機能要望'))
    expect(playSound).toHaveBeenCalledWith('select')
  })

  it('テキストを入力できる', () => {
    render(<FeedbackModal {...defaultProps} />)
    const textarea = screen.getByPlaceholderText('ご意見・ご要望をお書きください...')
    fireEvent.change(textarea, { target: { value: 'テスト入力' } })
    expect(screen.getByText('5 / 1000')).toBeDefined()
  })

  it('カテゴリ未選択・内容未入力で送信ボタンが無効', () => {
    render(<FeedbackModal {...defaultProps} />)
    const submitBtn = screen.getByText('送信する')
    expect(submitBtn.closest('button')?.disabled).toBe(true)
  })

  it('送信が成功するとトーストが表示される', async () => {
    vi.mocked(apiPost).mockResolvedValue({ success: true })
    render(<FeedbackModal {...defaultProps} />)

    fireEvent.click(screen.getByText('機能要望'))
    const textarea = screen.getByPlaceholderText('ご意見・ご要望をお書きください...')
    fireEvent.change(textarea, { target: { value: 'テスト内容' } })
    fireEvent.click(screen.getByText('送信する'))

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/api/feedback', {
        category: 'FEATURE_REQUEST',
        content: 'テスト内容',
      })
      expect(toast.success).toHaveBeenCalled()
      expect(playSound).toHaveBeenCalledWith('buttonAction')
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it('送信失敗時にエラーメッセージが表示される', async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error('サーバーエラー'))
    render(<FeedbackModal {...defaultProps} />)

    fireEvent.click(screen.getByText('改善提案'))
    const textarea = screen.getByPlaceholderText('ご意見・ご要望をお書きください...')
    fireEvent.change(textarea, { target: { value: 'テスト内容' } })
    fireEvent.click(screen.getByText('送信する'))

    await waitFor(() => {
      expect(screen.getByText('サーバーエラー')).toBeDefined()
    })
  })

  it('✕ボタンでモーダルが閉じる', () => {
    render(<FeedbackModal {...defaultProps} />)
    fireEvent.click(screen.getByText('✕'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('キャンセルボタンでモーダルが閉じる', () => {
    render(<FeedbackModal {...defaultProps} />)
    fireEvent.click(screen.getByText('キャンセル'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('文字数が1000を超えると赤い表示になる', () => {
    render(<FeedbackModal {...defaultProps} />)
    const textarea = screen.getByPlaceholderText('ご意見・ご要望をお書きください...')
    fireEvent.change(textarea, { target: { value: 'あ'.repeat(1001) } })
    expect(screen.getByText('1001 / 1000')).toBeDefined()
  })
})
