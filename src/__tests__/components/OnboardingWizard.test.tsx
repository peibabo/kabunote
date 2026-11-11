import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { trackOnboardingEvent } from '@/lib/onboardingEvents'

vi.mock('@/lib/onboardingEvents', () => ({
  trackOnboardingEvent: vi.fn(),
}))

const defaultProps = {
  onComplete: vi.fn(),
  onClose: vi.fn(),
}

describe('OnboardingWizard', () => {
  it('ステップ1（ウェルカム）が最初に表示される', () => {
    render(<OnboardingWizard {...defaultProps} />)
    expect(screen.getByText('カブノオトへようこそ')).toBeDefined()
  })

  it('「次へ」でステップ2に進む', () => {
    render(<OnboardingWizard {...defaultProps} />)
    fireEvent.click(screen.getByText('次へ'))
    expect(screen.getByText('3ステップで始めよう')).toBeDefined()
  })

  it('「戻る」で前のステップに戻る', () => {
    render(<OnboardingWizard {...defaultProps} />)
    fireEvent.click(screen.getByText('次へ'))
    expect(screen.getByText('3ステップで始めよう')).toBeDefined()
    fireEvent.click(screen.getByText('戻る'))
    expect(screen.getByText('カブノオトへようこそ')).toBeDefined()
  })

  it('ステップ1では「戻る」ボタンが表示されない', () => {
    render(<OnboardingWizard {...defaultProps} />)
    expect(screen.queryByText('戻る')).toBeNull()
  })

  it('全3ステップを遷移できる', () => {
    render(<OnboardingWizard {...defaultProps} />)
    expect(screen.getByText('カブノオトへようこそ')).toBeDefined()

    fireEvent.click(screen.getByText('次へ'))
    expect(screen.getByText('3ステップで始めよう')).toBeDefined()

    fireEvent.click(screen.getByText('次へ'))
    expect(screen.getByText('さあ、始めましょう！')).toBeDefined()
  })

  it('最終ステップでは「次へ」ボタンが表示されない', () => {
    render(<OnboardingWizard {...defaultProps} />)
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByText('次へ'))
    }
    expect(screen.queryByText('次へ')).toBeNull()
  })

  it('✕ボタンでonCloseが呼ばれる', () => {
    const onClose = vi.fn()
    render(<OnboardingWizard {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('閉じる'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('最終ステップ「さっそく始める」でonCompleteが呼ばれる', () => {
    const onComplete = vi.fn()
    render(<OnboardingWizard {...defaultProps} onComplete={onComplete} />)
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByText('次へ'))
    }
    fireEvent.click(screen.getByText('さっそく始める'))
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('最終ステップ「あとで始める」でonCloseが呼ばれる', () => {
    const onClose = vi.fn()
    render(<OnboardingWizard {...defaultProps} onClose={onClose} />)
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByText('次へ'))
    }
    fireEvent.click(screen.getByText('あとで始める'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('進捗ドットが3つ表示される', () => {
    const { container } = render(<OnboardingWizard {...defaultProps} />)
    const dots = container.querySelectorAll('.rounded-full.w-2\\.5')
    expect(dots.length).toBe(3)
  })

  describe('ステップ計測', () => {
    beforeEach(() => {
      vi.mocked(trackOnboardingEvent).mockClear()
    })

    it('表示時に shown を1回だけ記録', () => {
      const { rerender } = render(<OnboardingWizard {...defaultProps} />)
      rerender(<OnboardingWizard {...defaultProps} />)
      expect(vi.mocked(trackOnboardingEvent).mock.calls.filter(c => c[0] === 'shown')).toEqual([['shown', 0]])
    })

    it('次へ・戻るで step_view を記録', () => {
      render(<OnboardingWizard {...defaultProps} />)
      fireEvent.click(screen.getByText('次へ'))
      fireEvent.click(screen.getByText('次へ'))
      fireEvent.click(screen.getByText('戻る'))
      expect(trackOnboardingEvent).toHaveBeenCalledWith('step_view', 1)
      expect(trackOnboardingEvent).toHaveBeenCalledWith('step_view', 2)
      expect(vi.mocked(trackOnboardingEvent).mock.calls.at(-1)).toEqual(['step_view', 1])
    })

    it('「さっそく始める」で get_started を記録', () => {
      render(<OnboardingWizard {...defaultProps} />)
      fireEvent.click(screen.getByText('次へ'))
      fireEvent.click(screen.getByText('次へ'))
      fireEvent.click(screen.getByText('さっそく始める'))
      expect(trackOnboardingEvent).toHaveBeenCalledWith('get_started', 2)
    })

    it('「あとで始める」で later を記録', () => {
      render(<OnboardingWizard {...defaultProps} />)
      fireEvent.click(screen.getByText('次へ'))
      fireEvent.click(screen.getByText('次へ'))
      fireEvent.click(screen.getByText('あとで始める'))
      expect(trackOnboardingEvent).toHaveBeenCalledWith('later', 2)
    })

    it('✕ で閉じると、そのときのステップ付きで close を記録', () => {
      render(<OnboardingWizard {...defaultProps} />)
      fireEvent.click(screen.getByText('次へ'))
      fireEvent.click(screen.getByLabelText('閉じる'))
      expect(trackOnboardingEvent).toHaveBeenCalledWith('close', 1)
    })
  })
})
