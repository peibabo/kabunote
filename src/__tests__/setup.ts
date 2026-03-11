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
  sampleRate = 44100
  createBuffer = vi.fn(() => ({
    getChannelData: vi.fn(() => new Float32Array(4410)),
  }))
  createBufferSource = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
  }))
  createBiquadFilter = vi.fn(() => ({
    connect: vi.fn(),
    type: 'bandpass' as BiquadFilterType,
    frequency: { value: 440 },
    Q: { value: 1 },
  }))
}

global.AudioContext = MockAudioContext as unknown as typeof AudioContext

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
