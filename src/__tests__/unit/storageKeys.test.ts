import { describe, it, expect } from 'vitest'
import { STORAGE_KEYS, stockKey } from '@/lib/storageKeys'

describe('STORAGE_KEYS', () => {
  it('全キーがユニーク', () => {
    const values = Object.values(STORAGE_KEYS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  it('全キーがkabunoteプレフィックスを持つ', () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      expect(key).toMatch(/^kabunote-/)
    })
  })
})

describe('stockKey', () => {
  it('activeTab がシンボルを含む', () => {
    expect(stockKey.activeTab('7203')).toBe('kabunote-active-tab-7203')
  })

  it('openTab がシンボルを含む', () => {
    expect(stockKey.openTab('7203')).toBe('kabunote-open-tab-7203')
  })

  it('investmentTab がシンボルを含む', () => {
    expect(stockKey.investmentTab('9984')).toBe('kabunote-investment-tab-9984')
  })

  it('managementTab がシンボルを含む', () => {
    expect(stockKey.managementTab('9984')).toBe('kabunote-management-tab-9984')
  })
})
