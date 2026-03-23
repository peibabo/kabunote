import { describe, it, expect } from 'vitest'
import {
  evaluatePer, evaluatePbr,
  calculateEps, calculateBps,
  calculateTheoreticalPriceByPer, calculateTheoreticalPriceByPbr,
  calculateDeviation,
} from '@/lib/positionCalc'

describe('evaluatePer（固定閾値・後方互換）', () => {
  it('PER 15以下は割安', () => {
    expect(evaluatePer(10)).toMatchObject({ label: '割安', color: 'text-green-400' })
    expect(evaluatePer(15)).toMatchObject({ label: '割安', color: 'text-green-400' })
  })

  it('PER 15超25以下は適正', () => {
    expect(evaluatePer(15.1)).toMatchObject({ label: '適正', color: 'text-yellow-400' })
    expect(evaluatePer(20)).toMatchObject({ label: '適正', color: 'text-yellow-400' })
    expect(evaluatePer(25)).toMatchObject({ label: '適正', color: 'text-yellow-400' })
  })

  it('PER 25超は割高', () => {
    expect(evaluatePer(25.1)).toMatchObject({ label: '割高', color: 'text-red-400' })
    expect(evaluatePer(50)).toMatchObject({ label: '割高', color: 'text-red-400' })
  })

  it('fairPer未設定時はhasFairValue=false', () => {
    expect(evaluatePer(10).hasFairValue).toBe(false)
    expect(evaluatePer(10).deviationPercent).toBeNull()
  })
})

describe('evaluatePer（適正値ベース）', () => {
  it('乖離率-10%以下で割安', () => {
    // 現在PER 13, 適正PER 15 → 乖離 -13.3%
    const result = evaluatePer(13, 15)
    expect(result.label).toBe('割安')
    expect(result.color).toBe('text-green-400')
    expect(result.hasFairValue).toBe(true)
    expect(result.deviationPercent).toBeCloseTo(-13.33, 1)
  })

  it('乖離率±10%以内で適正', () => {
    // 現在PER 16, 適正PER 15 → 乖離 +6.7%
    const result = evaluatePer(16, 15)
    expect(result.label).toBe('適正')
    expect(result.color).toBe('text-yellow-400')
  })

  it('乖離率+10%超で割高', () => {
    // 現在PER 20, 適正PER 15 → 乖離 +33.3%
    const result = evaluatePer(20, 15)
    expect(result.label).toBe('割高')
    expect(result.color).toBe('text-red-400')
    expect(result.deviationPercent).toBeCloseTo(33.33, 1)
  })

  it('fairPer=nullの場合は固定閾値にフォールバック', () => {
    expect(evaluatePer(10, null)).toMatchObject({ label: '割安', hasFairValue: false })
  })

  it('fairPer=0の場合は固定閾値にフォールバック', () => {
    expect(evaluatePer(10, 0)).toMatchObject({ label: '割安', hasFairValue: false })
  })
})

describe('evaluatePbr（固定閾値・後方互換）', () => {
  it('PBR 1.0未満は割安', () => {
    expect(evaluatePbr(0.5)).toMatchObject({ label: '割安', color: 'text-green-400' })
    expect(evaluatePbr(0.99)).toMatchObject({ label: '割安', color: 'text-green-400' })
  })

  it('PBR 1.0以上2.0以下は適正', () => {
    expect(evaluatePbr(1.0)).toMatchObject({ label: '適正', color: 'text-yellow-400' })
    expect(evaluatePbr(1.5)).toMatchObject({ label: '適正', color: 'text-yellow-400' })
    expect(evaluatePbr(2.0)).toMatchObject({ label: '適正', color: 'text-yellow-400' })
  })

  it('PBR 2.0超は割高', () => {
    expect(evaluatePbr(2.1)).toMatchObject({ label: '割高', color: 'text-red-400' })
    expect(evaluatePbr(5.0)).toMatchObject({ label: '割高', color: 'text-red-400' })
  })
})

describe('evaluatePbr（適正値ベース）', () => {
  it('乖離率-10%以下で割安', () => {
    // 現在PBR 0.8, 適正PBR 1.0 → 乖離 -20%
    const result = evaluatePbr(0.8, 1.0)
    expect(result.label).toBe('割安')
    expect(result.hasFairValue).toBe(true)
    expect(result.deviationPercent).toBeCloseTo(-20, 1)
  })

  it('乖離率±10%以内で適正', () => {
    // 現在PBR 1.05, 適正PBR 1.0 → 乖離 +5%
    const result = evaluatePbr(1.05, 1.0)
    expect(result.label).toBe('適正')
  })

  it('乖離率+10%超で割高', () => {
    // 現在PBR 1.5, 適正PBR 1.0 → 乖離 +50%
    const result = evaluatePbr(1.5, 1.0)
    expect(result.label).toBe('割高')
  })
})

describe('calculateEps', () => {
  it('正常計算: EPS = 現在株価 / PER', () => {
    expect(calculateEps(2000, 20)).toBe(100)
  })

  it('PER=0でnull', () => {
    expect(calculateEps(2000, 0)).toBeNull()
  })

  it('PER<0でnull', () => {
    expect(calculateEps(2000, -5)).toBeNull()
  })
})

describe('calculateBps', () => {
  it('正常計算: BPS = 現在株価 / PBR', () => {
    expect(calculateBps(2000, 2.0)).toBe(1000)
  })

  it('PBR=0でnull', () => {
    expect(calculateBps(2000, 0)).toBeNull()
  })
})

describe('calculateTheoreticalPriceByPer', () => {
  it('理論株価 = fairPer × EPS', () => {
    // 現在株価2000, 現在PER20 → EPS=100, 適正PER15 → 理論1500
    expect(calculateTheoreticalPriceByPer(2000, 20, 15)).toBe(1500)
  })

  it('現在PER=0でnull', () => {
    expect(calculateTheoreticalPriceByPer(2000, 0, 15)).toBeNull()
  })
})

describe('calculateTheoreticalPriceByPbr', () => {
  it('理論株価 = fairPbr × BPS', () => {
    // 現在株価2000, 現在PBR2.0 → BPS=1000, 適正PBR1.0 → 理論1000
    expect(calculateTheoreticalPriceByPbr(2000, 2.0, 1.0)).toBe(1000)
  })

  it('現在PBR=0でnull', () => {
    expect(calculateTheoreticalPriceByPbr(2000, 0, 1.0)).toBeNull()
  })
})

describe('calculateDeviation', () => {
  it('正の乖離（割高方向）', () => {
    expect(calculateDeviation(20, 15)).toBeCloseTo(33.33, 1)
  })

  it('負の乖離（割安方向）', () => {
    expect(calculateDeviation(10, 15)).toBeCloseTo(-33.33, 1)
  })

  it('乖離なし', () => {
    expect(calculateDeviation(15, 15)).toBe(0)
  })

  it('fair=0の場合は0', () => {
    expect(calculateDeviation(15, 0)).toBe(0)
  })
})
