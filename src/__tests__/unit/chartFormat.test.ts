import { describe, it, expect } from 'vitest'
import { formatYAxisValue } from '@/lib/chartFormat'

describe('formatYAxisValue', () => {
  it('1万未満はそのまま整数で返す', () => {
    expect(formatYAxisValue(0)).toBe('0')
    expect(formatYAxisValue(1500)).toBe('1500')
    expect(formatYAxisValue(9999)).toBe('9999')
  })

  it('小数は四捨五入する', () => {
    expect(formatYAxisValue(1500.4)).toBe('1500')
    expect(formatYAxisValue(1500.6)).toBe('1501')
  })

  it('1万以上は「万」表記にする', () => {
    expect(formatYAxisValue(10000)).toBe('1万')
    expect(formatYAxisValue(1234567)).toBe('123万')
  })

  it('1000万以上は「千万」表記にする', () => {
    expect(formatYAxisValue(10000000)).toBe('1.0千万')
    expect(formatYAxisValue(25000000)).toBe('2.5千万')
  })

  it('負の値も絶対値で桁を判定する', () => {
    expect(formatYAxisValue(-10000)).toBe('-1万')
    expect(formatYAxisValue(-500)).toBe('-500')
  })

  // 銘柄ミニチャートのY軸（株価）は千万の桁に達しないため、
  // 統合前の実装（千万分岐なし）と表示が一致することを確認する
  it('株価レンジでは「万」までの表記に収まる', () => {
    expect(formatYAxisValue(3500)).toBe('3500')
    expect(formatYAxisValue(120000)).toBe('12万')
  })
})
