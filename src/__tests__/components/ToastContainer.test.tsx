import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ToastContainer from '@/components/layout/ToastContainer'
import { toast } from '@/lib/toast'

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('初期状態では何も表示しない', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('success通知を表示', () => {
    const { rerender } = render(<ToastContainer />)
    act(() => { toast.success('保存しました') })
    rerender(<ToastContainer />)
    expect(screen.getByText('保存しました')).toBeInTheDocument()
  })

  it('error通知を表示', () => {
    const { rerender } = render(<ToastContainer />)
    act(() => { toast.error('エラーが発生しました') })
    rerender(<ToastContainer />)
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
  })
})
