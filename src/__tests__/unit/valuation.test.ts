import { describe, it, expect } from 'vitest'
import { evaluatePer, evaluatePbr } from '@/lib/positionCalc'

describe('evaluatePer', () => {
  it('PER 15以下は割安', () => {
    expect(evaluatePer(10)).toEqual({ label: '割安', color: 'text-green-400' })
    expect(evaluatePer(15)).toEqual({ label: '割安', color: 'text-green-400' })
  })

  it('PER 15超25以下は適正', () => {
    expect(evaluatePer(15.1)).toEqual({ label: '適正', color: 'text-yellow-400' })
    expect(evaluatePer(20)).toEqual({ label: '適正', color: 'text-yellow-400' })
    expect(evaluatePer(25)).toEqual({ label: '適正', color: 'text-yellow-400' })
  })

  it('PER 25超は割高', () => {
    expect(evaluatePer(25.1)).toEqual({ label: '割高', color: 'text-red-400' })
    expect(evaluatePer(50)).toEqual({ label: '割高', color: 'text-red-400' })
  })
})

describe('evaluatePbr', () => {
  it('PBR 1.0未満は割安', () => {
    expect(evaluatePbr(0.5)).toEqual({ label: '割安', color: 'text-green-400' })
    expect(evaluatePbr(0.99)).toEqual({ label: '割安', color: 'text-green-400' })
  })

  it('PBR 1.0以上2.0以下は適正', () => {
    expect(evaluatePbr(1.0)).toEqual({ label: '適正', color: 'text-yellow-400' })
    expect(evaluatePbr(1.5)).toEqual({ label: '適正', color: 'text-yellow-400' })
    expect(evaluatePbr(2.0)).toEqual({ label: '適正', color: 'text-yellow-400' })
  })

  it('PBR 2.0超は割高', () => {
    expect(evaluatePbr(2.1)).toEqual({ label: '割高', color: 'text-red-400' })
    expect(evaluatePbr(5.0)).toEqual({ label: '割高', color: 'text-red-400' })
  })
})
