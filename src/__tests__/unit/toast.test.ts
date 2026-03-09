import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { toast, toastStore } from '@/lib/toast'

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('success を追加する', () => {
    toast.success('成功しました')
    const items = toastStore.getSnapshot()
    expect(items).toHaveLength(1)
    expect(items[0].type).toBe('success')
    expect(items[0].message).toBe('成功しました')
  })

  it('error を追加する', () => {
    toast.error('エラーが発生')
    const items = toastStore.getSnapshot()
    expect(items.some(i => i.type === 'error')).toBe(true)
  })

  it('warning を追加する', () => {
    toast.warning('注意')
    const items = toastStore.getSnapshot()
    expect(items.some(i => i.type === 'warning')).toBe(true)
  })

  it('subscribe でリスナーが呼ばれる', () => {
    const listener = vi.fn()
    const unsub = toastStore.subscribe(listener)
    toast.success('test')
    expect(listener).toHaveBeenCalled()
    unsub()
  })

  it('remove で削除される', () => {
    toast.success('削除テスト')
    const items = toastStore.getSnapshot()
    const id = items[items.length - 1].id
    toastStore.remove(id)
    expect(toastStore.getSnapshot().find(i => i.id === id)).toBeUndefined()
  })

  it('success は3秒後に自動削除される', () => {
    toast.success('自動削除')
    const items = toastStore.getSnapshot()
    const id = items[items.length - 1].id
    vi.advanceTimersByTime(3000)
    expect(toastStore.getSnapshot().find(i => i.id === id)).toBeUndefined()
  })
})
