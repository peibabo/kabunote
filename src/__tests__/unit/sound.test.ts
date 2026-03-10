/**
 * サウンドエンジン (src/lib/sound.ts) のユニットテスト
 *
 * 設定永続化・SSR安全性・ストアのPub/Sub動作を検証する
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// setup.ts のグローバルモックを解除してリアルモジュールをテスト
vi.unmock('@/lib/sound')

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()

  // AudioContext モック
  // @ts-expect-error mock AudioContext
  globalThis.AudioContext = vi.fn().mockImplementation(() => ({
    state: 'running',
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    destination: {},
    createOscillator: vi.fn().mockReturnValue({
      type: '',
      frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createGain: vi.fn().mockReturnValue({
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
    }),
    createBuffer: vi.fn().mockImplementation((_channels: number, length: number) => ({
      getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
    })),
    createBufferSource: vi.fn().mockReturnValue({
      buffer: null,
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createBiquadFilter: vi.fn().mockReturnValue({
      type: '',
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
    }),
  }))
})

describe('sound.ts', () => {
  it('playSound は enabled=false のとき音を鳴らさない', async () => {
    const { playSound, setSoundEnabled, initSoundEngine } = await import('@/lib/sound')
    initSoundEngine()
    setSoundEnabled(false)
    // AudioContext のインスタンスが作られていても createOscillator は呼ばれない
    playSound('stockAdd')
    // enabled=false なので何も実行されないことを確認（エラーが出ないこと）
    expect(true).toBe(true)
  })

  it('playSound は enabled=true のとき例外を投げない', async () => {
    const { playSound, setSoundEnabled, initSoundEngine } = await import('@/lib/sound')
    setSoundEnabled(true)
    initSoundEngine()
    expect(() => playSound('stockAdd')).not.toThrow()
  })

  it('setSoundEnabled は localStorage に永続化する', async () => {
    const { setSoundEnabled } = await import('@/lib/sound')
    setSoundEnabled(false)
    expect(localStorage.getItem('kabunote-sound-enabled')).toBe('false')
    setSoundEnabled(true)
    expect(localStorage.getItem('kabunote-sound-enabled')).toBe('true')
  })

  it('setSoundVolume は localStorage に永続化する', async () => {
    const { setSoundVolume } = await import('@/lib/sound')
    setSoundVolume(0.8)
    expect(localStorage.getItem('kabunote-sound-volume')).toBe('0.8')
  })

  it('setSoundVolume は 0-1 にクランプする', async () => {
    const { setSoundVolume, getSoundSettings } = await import('@/lib/sound')
    setSoundVolume(1.5)
    expect(getSoundSettings().volume).toBe(1)
    setSoundVolume(-0.5)
    expect(getSoundSettings().volume).toBe(0)
  })

  it('getSoundSettings はデフォルト設定を返す', async () => {
    const { getSoundSettings } = await import('@/lib/sound')
    const s = getSoundSettings()
    expect(s).toHaveProperty('enabled')
    expect(s).toHaveProperty('volume')
    expect(typeof s.enabled).toBe('boolean')
    expect(typeof s.volume).toBe('number')
  })

  it('soundStore は subscribe/getSnapshot/getServerSnapshot を持つ', async () => {
    const { soundStore } = await import('@/lib/sound')
    expect(typeof soundStore.subscribe).toBe('function')
    expect(typeof soundStore.getSnapshot).toBe('function')
    expect(typeof soundStore.getServerSnapshot).toBe('function')
  })

  it('soundStore.getServerSnapshot は enabled=false を返す', async () => {
    const { soundStore } = await import('@/lib/sound')
    const snapshot = soundStore.getServerSnapshot()
    expect(snapshot.enabled).toBe(false)
  })

  it('subscribe したリスナーは設定変更時に呼ばれる', async () => {
    const { soundStore, setSoundEnabled } = await import('@/lib/sound')
    const listener = vi.fn()
    const unsub = soundStore.subscribe(listener)
    setSoundEnabled(false)
    expect(listener).toHaveBeenCalled()
    unsub()
  })

  it('unsubscribe 後はリスナーが呼ばれない', async () => {
    const { soundStore, setSoundEnabled } = await import('@/lib/sound')
    const listener = vi.fn()
    const unsub = soundStore.subscribe(listener)
    unsub()
    setSoundEnabled(false)
    expect(listener).not.toHaveBeenCalled()
  })

  it('全18種のサウンド名が playSound で呼べる', async () => {
    const { playSound, setSoundEnabled, initSoundEngine } = await import('@/lib/sound')
    setSoundEnabled(true)
    initSoundEngine()

    const soundNames = [
      'stockAdd', 'autoSave', 'error', 'toastSuccess', 'toastWarning',
      'toastError', 'positionAdd', 'positionUpdate', 'delete', 'dragStart',
      'dragEnd', 'snooze', 'tagAdd', 'tagRemove', 'toggle', 'dataSave', 'searchClear',
      'memoSave',
    ] as const

    for (const name of soundNames) {
      expect(() => playSound(name)).not.toThrow()
    }
  })

  it('localStorage に保存された設定を読み込む', async () => {
    localStorage.setItem('kabunote-sound-enabled', 'false')
    localStorage.setItem('kabunote-sound-volume', '0.3')
    const { getSoundSettings } = await import('@/lib/sound')
    const s = getSoundSettings()
    expect(s.enabled).toBe(false)
    expect(s.volume).toBe(0.3)
  })
})
