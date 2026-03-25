import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

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
})
