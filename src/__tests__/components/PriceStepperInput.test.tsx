import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PriceStepperInput from '@/components/stock-tabs/analysis/PriceStepperInput'

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

  it('現在値に応じた呼値を表示する', () => {
    renderInput({ value: '6000' })
    expect(screen.getByText('呼値 10円')).toBeInTheDocument()
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
})
