import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FloatingAddButton from '@/components/stock/FloatingAddButton'

// StockInputをモック
vi.mock('@/components/stock/StockInput', () => ({
  default: ({ onAddStock }: { onAddStock: (code: string) => void }) => (
    <input
      data-testid="stock-input-mock"
      placeholder="銘柄コードを入力"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onAddStock((e.target as HTMLInputElement).value)
        }
      }}
    />
  )
}))

const defaultProps = {
  onAddStock: vi.fn(),
  error: '',
  setError: vi.fn(),
  currentCount: 0,
  maxCount: 20,
}

describe('FloatingAddButton', () => {
  describe('カウンターバッジ表示', () => {
    it('currentCount > 0 時にカウンターバッジが表示される', () => {
      render(<FloatingAddButton {...defaultProps} currentCount={10} />)
      expect(screen.getByText('10/20')).toBeInTheDocument()
    })

    it('currentCount = 0 時はバッジが表示されない', () => {
      render(<FloatingAddButton {...defaultProps} currentCount={0} />)
      expect(screen.queryByText('0/20')).not.toBeInTheDocument()
    })
  })

  describe('バッジ色（使用率に応じた変化）', () => {
    it('使用率 < 80% → bg-gray-600', () => {
      render(<FloatingAddButton {...defaultProps} currentCount={10} />)
      const badge = screen.getByText('10/20')
      expect(badge.className).toContain('bg-gray-600')
    })

    it('使用率 80% → bg-yellow-500', () => {
      render(<FloatingAddButton {...defaultProps} currentCount={16} />)
      const badge = screen.getByText('16/20')
      expect(badge.className).toContain('bg-yellow-500')
    })

    it('使用率 100% → bg-red-500', () => {
      render(<FloatingAddButton {...defaultProps} currentCount={20} />)
      const badge = screen.getByText('20/20')
      expect(badge.className).toContain('bg-red-500')
    })
  })

  describe('ボタン制御', () => {
    it('disabled=false → ボタンが有効', () => {
      render(<FloatingAddButton {...defaultProps} disabled={false} />)
      const button = screen.getByRole('button', { name: '銘柄を追加' })
      expect(button).not.toBeDisabled()
    })

    it('disabled=true → ボタンが無効', () => {
      render(<FloatingAddButton {...defaultProps} disabled={true} />)
      const button = screen.getByRole('button', { name: '銘柄を追加' })
      expect(button).toBeDisabled()
    })
  })

  describe('モーダル表示', () => {
    it('ボタンクリックでモーダルが開く', () => {
      render(<FloatingAddButton {...defaultProps} currentCount={5} />)
      const button = screen.getByRole('button', { name: '銘柄を追加' })
      fireEvent.click(button)
      // モーダルが開き、StockInputが表示される
      expect(screen.getByTestId('stock-input-mock')).toBeInTheDocument()
      // 閉じるボタンが表示される
      expect(screen.getByRole('button', { name: 'モーダルを閉じる' })).toBeInTheDocument()
    })

    it('モーダル内にカウンターが表示される', () => {
      render(<FloatingAddButton {...defaultProps} currentCount={5} />)
      fireEvent.click(screen.getByRole('button', { name: '銘柄を追加' }))
      expect(screen.getByText('(5/20)')).toBeInTheDocument()
    })
  })

  describe('エラー表示', () => {
    it('error propが渡された場合にエラーメッセージが表示される', () => {
      render(<FloatingAddButton {...defaultProps} error="上限に達しました" />)
      // モーダルを開く
      fireEvent.click(screen.getByRole('button', { name: '銘柄を追加' }))
      expect(screen.getByText('上限に達しました')).toBeInTheDocument()
    })

    it('error propが空の場合はエラーメッセージが表示されない', () => {
      render(<FloatingAddButton {...defaultProps} error="" />)
      fireEvent.click(screen.getByRole('button', { name: '銘柄を追加' }))
      expect(screen.queryByText('上限に達しました')).not.toBeInTheDocument()
    })
  })
})
