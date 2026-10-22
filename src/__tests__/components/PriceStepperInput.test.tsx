import { describe, it, expect, vi, afterEach } from 'vitest'
import { act } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PriceStepperInput, { HOLD_DELAY_MS } from '@/components/stock-tabs/analysis/PriceStepperInput'

const renderInput = (props: Partial<Parameters<typeof PriceStepperInput>[0]> = {}) => {
  const onChange = vi.fn()
  render(
    <PriceStepperInput
      id="price"
      label="損切ライン"
      labelClassName=""
      focusClassName=""
      value=""
      onChange={onChange}
      isTopix500={false}
      {...props}
    />
  )
  return { onChange }
}

describe('PriceStepperInput', () => {
  it('＋ボタンで呼値1つ分上げる（TOPIX500以外・5,000円超は10円）', () => {
    const { onChange } = renderInput({ value: '6000' })
    fireEvent.click(screen.getByRole('button', { name: '1呼値上げる' }))
    expect(onChange).toHaveBeenCalledWith('6010')
  })

  it('−ボタンで呼値1つ分下げる（TOPIX500・1,000円以下は0.1円）', () => {
    const { onChange } = renderInput({ value: '500', isTopix500: true })
    fireEvent.click(screen.getByRole('button', { name: '1呼値下げる' }))
    expect(onChange).toHaveBeenCalledWith('499.9')
  })

  it('矢印キーでも呼値単位で上下する', () => {
    const { onChange } = renderInput({ value: '4000' })
    fireEvent.keyDown(screen.getByLabelText('損切ライン'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith('4005')
  })

  it('現在値に応じた呼値をツールチップに表示する', () => {
    renderInput({ value: '6000' })
    expect(screen.getByTitle('呼値 10円')).toBeInTheDocument()
  })

  it('未入力時は起点価格をそのまま入れる', () => {
    const { onChange } = renderInput({ value: '', fallbackBase: '2500' })
    fireEvent.click(screen.getByRole('button', { name: '1呼値上げる' }))
    expect(onChange).toHaveBeenCalledWith('2500')
  })

  it('未入力かつ起点価格もない場合はボタンを無効化する', () => {
    renderInput({ value: '' })
    expect(screen.getByRole('button', { name: '1呼値上げる' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '1呼値下げる' })).toBeDisabled()
  })

  describe('長押し', () => {
    afterEach(() => { vi.useRealTimers() })

    it('押した瞬間に1回、待ち時間後から連続して呼値単位で進む', () => {
      vi.useFakeTimers()
      const { onChange } = renderInput({ value: '6000' })
      const button = screen.getByRole('button', { name: '1呼値上げる' })

      fireEvent.pointerDown(button)
      expect(onChange).toHaveBeenLastCalledWith('6010')

      act(() => { vi.advanceTimersByTime(HOLD_DELAY_MS) })
      expect(onChange).toHaveBeenLastCalledWith('6020')

      act(() => { vi.advanceTimersByTime(150) })
      expect(onChange).toHaveBeenLastCalledWith('6030')
    })

    it('離すとリピートが止まり、保存（onBlur）を呼ぶ', () => {
      vi.useFakeTimers()
      const onBlur = vi.fn()
      const { onChange } = renderInput({ value: '1000', onBlur })
      const button = screen.getByRole('button', { name: '1呼値下げる' })

      fireEvent.pointerDown(button)
      act(() => { vi.advanceTimersByTime(HOLD_DELAY_MS) })
      fireEvent.pointerUp(button)
      const calls = onChange.mock.calls.length

      act(() => { vi.advanceTimersByTime(2000) })
      expect(onChange).toHaveBeenCalledTimes(calls)
      expect(onChange).toHaveBeenLastCalledWith('998')
      expect(onBlur).toHaveBeenCalledTimes(1)
    })

    it('押し続けるほどリピートが速くなる', () => {
      vi.useFakeTimers()
      const { onChange } = renderInput({ value: '100' })
      fireEvent.pointerDown(screen.getByRole('button', { name: '1呼値上げる' }))

      act(() => { vi.advanceTimersByTime(HOLD_DELAY_MS + 150 * 5) })
      const afterSlow = onChange.mock.calls.length
      act(() => { vi.advanceTimersByTime(800) })
      // 80ms間隔なら800msで10回進む（150ms間隔のままなら5回）
      expect(onChange.mock.calls.length - afterSlow).toBeGreaterThanOrEqual(10)
    })
  })
})
