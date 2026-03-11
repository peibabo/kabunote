import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// AudioContext モック（サウンドテスト用）
class MockAudioContext {
  destination = {}
  currentTime = 0
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: 'sine' as OscillatorType,
    frequency: { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  }))
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  }))
}

global.AudioContext = MockAudioContext as unknown as typeof AudioContext

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
