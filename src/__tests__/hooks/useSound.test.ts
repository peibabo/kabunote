/**
 * useSound フックのテスト
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSound } from '@/hooks/useSound'
import { setSoundEnabled, setSoundVolume, playSound } from '@/lib/sound'

describe('useSound', () => {
  it('enabled と volume を返す', () => {
    const { result } = renderHook(() => useSound())
    expect(typeof result.current.enabled).toBe('boolean')
    expect(typeof result.current.volume).toBe('number')
  })

  it('setEnabled を呼ぶと setSoundEnabled が呼ばれる', () => {
    const { result } = renderHook(() => useSound())
    act(() => {
      result.current.setEnabled(false)
    })
    expect(setSoundEnabled).toHaveBeenCalledWith(false)
  })

  it('setVolume を呼ぶと setSoundVolume が呼ばれる', () => {
    const { result } = renderHook(() => useSound())
    act(() => {
      result.current.setVolume(0.7)
    })
    expect(setSoundVolume).toHaveBeenCalledWith(0.7)
  })

  it('play を呼ぶと playSound が呼ばれる', () => {
    const { result } = renderHook(() => useSound())
    act(() => {
      result.current.play('stockAdd')
    })
    expect(playSound).toHaveBeenCalledWith('stockAdd')
  })

  it('play/setEnabled/setVolume が関数である', () => {
    const { result } = renderHook(() => useSound())
    expect(typeof result.current.play).toBe('function')
    expect(typeof result.current.setEnabled).toBe('function')
    expect(typeof result.current.setVolume).toBe('function')
  })
})
