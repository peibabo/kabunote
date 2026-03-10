import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// サウンドエンジンをグローバルモック（全テストでWeb Audio API依存を排除）
const _soundSnapshot = { enabled: true, volume: 0.5 }
const _soundServerSnapshot = { enabled: false, volume: 0.5 }
vi.mock('@/lib/sound', () => ({
  playSound: vi.fn(),
  initSoundEngine: vi.fn(),
  setSoundEnabled: vi.fn(),
  setSoundVolume: vi.fn(),
  getSoundSettings: vi.fn(() => ({ enabled: true, volume: 0.5 })),
  soundStore: {
    subscribe: vi.fn((cb: () => void) => {
      // useSyncExternalStore は subscribe 内で即座に呼ばない
      void cb
      return () => {}
    }),
    getSnapshot: vi.fn(() => _soundSnapshot),
    getServerSnapshot: vi.fn(() => _soundServerSnapshot),
  },
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
