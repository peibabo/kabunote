/**
 * サウンドフィードバックエンジン
 *
 * Web Audio API でシンセ音を生成し、外部ファイル不要で軽量なサウンドフィードバックを提供する。
 * toast.ts と同じシングルトン Pub/Sub ストアパターン。
 */
import { STORAGE_KEYS } from './storageKeys'

// ─────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────
export type SoundName =
  | 'stockAdd'
  | 'autoSave'
  | 'error'
  | 'toastSuccess'
  | 'toastWarning'
  | 'toastError'
  | 'positionAdd'
  | 'positionUpdate'
  | 'delete'
  | 'dragStart'
  | 'dragEnd'
  | 'snooze'
  | 'tagAdd'
  | 'tagRemove'
  | 'toggle'
  | 'dataSave'
  | 'searchClear'
  | 'memoSave'

interface SoundSettings {
  enabled: boolean
  volume: number
}

// ─────────────────────────────────────────
// 内部状態
// ─────────────────────────────────────────
let audioContext: AudioContext | null = null
let settings: SoundSettings = { enabled: true, volume: 0.5 }
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(fn => fn())
}

// ─────────────────────────────────────────
// localStorage 永続化
// ─────────────────────────────────────────
function loadSettings(): SoundSettings {
  if (typeof window === 'undefined') return { enabled: true, volume: 0.5 }
  try {
    const enabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED)
    const volume = localStorage.getItem(STORAGE_KEYS.SOUND_VOLUME)
    return {
      enabled: enabled !== null ? enabled === 'true' : true,
      volume: volume !== null ? Math.max(0, Math.min(1, parseFloat(volume))) : 0.5,
    }
  } catch {
    return { enabled: true, volume: 0.5 }
  }
}

function saveSettings() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(settings.enabled))
    localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, String(settings.volume))
  } catch {
    // localStorage が使えない環境では無視
  }
}

// 初期読み込み
if (typeof window !== 'undefined') {
  settings = loadSettings()
}

// ─────────────────────────────────────────
// AudioContext 管理
// ─────────────────────────────────────────
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    try {
      audioContext = new AudioContext()
    } catch {
      return null
    }
  }
  return audioContext
}

export function initSoundEngine(): void {
  if (typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (ctx?.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

// ─────────────────────────────────────────
// 音の生成ヘルパー
// ─────────────────────────────────────────
type OscType = OscillatorType

function createOsc(ctx: AudioContext, type: OscType, freq: number, gain: number, startTime: number, endTime: number, endFreq?: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  if (endFreq !== undefined) {
    osc.frequency.linearRampToValueAtTime(endFreq, endTime)
  }
  g.gain.setValueAtTime(gain * settings.volume, startTime)
  g.gain.linearRampToValueAtTime(0, endTime)
  osc.connect(g).connect(ctx.destination)
  osc.start(startTime)
  osc.stop(endTime)
}

// ─────────────────────────────────────────
// 18種のサウンド定義
// ─────────────────────────────────────────
const soundGenerators: Record<SoundName, (ctx: AudioContext) => void> = {
  // 1. 銘柄追加 - sine 880→1320Hz 上昇(150ms)
  stockAdd(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 880, 0.3, t, t + 0.15, 1320)
  },

  // 2. 自動保存 - sine 1047Hz 極短(60ms)
  autoSave(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 1047, 0.15, t, t + 0.06)
  },

  // 3. エラー - square 220→180Hz 下降(200ms)
  error(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'square', 220, 0.15, t, t + 0.2, 180)
  },

  // 4. 成功トースト - triangle 880+1100Hz 和音(100ms)
  toastSuccess(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'triangle', 880, 0.2, t, t + 0.1)
    createOsc(ctx, 'triangle', 1100, 0.2, t, t + 0.1)
  },

  // 5. 警告トースト - triangle 440Hz 2回パルス(80ms×2)
  toastWarning(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'triangle', 440, 0.2, t, t + 0.08)
    createOsc(ctx, 'triangle', 440, 0.2, t + 0.12, t + 0.2)
  },

  // 6. エラートースト - square 220Hz(150ms)
  toastError(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'square', 220, 0.15, t, t + 0.15)
  },

  // 7. ポジション追加 - sine 660→880Hz(100ms)
  positionAdd(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 660, 0.25, t, t + 0.1, 880)
  },

  // 8. ポジション更新 - sine 784Hz(80ms)
  positionUpdate(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 784, 0.2, t, t + 0.08)
  },

  // 9. 削除完了 - sine 880→440Hz 下降+フェード(200ms)
  delete(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 880, 0.25, t, t + 0.2, 440)
  },

  // 10. D&D開始 - sine 523Hz(50ms)
  dragStart(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 523, 0.2, t, t + 0.05)
  },

  // 11. D&Dドロップ - sine 659→523Hz(100ms)
  dragEnd(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 659, 0.2, t, t + 0.1, 523)
  },

  // 12. スヌーズ - sine 1047→784Hz(150ms)
  snooze(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 1047, 0.2, t, t + 0.15, 784)
  },

  // 13. タグ追加 - sine 1200Hz(40ms)
  tagAdd(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 1200, 0.2, t, t + 0.04)
  },

  // 14. タグ削除 - sine 800→600Hz(60ms)
  tagRemove(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 800, 0.2, t, t + 0.06, 600)
  },

  // 15. グループ操作 - sine 700/900Hz(80ms)
  toggle(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 700, 0.15, t, t + 0.04)
    createOsc(ctx, 'sine', 900, 0.15, t + 0.04, t + 0.08)
  },

  // 16. データ保存 - triangle 784+1047Hz(120ms)
  dataSave(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'triangle', 784, 0.15, t, t + 0.12)
    createOsc(ctx, 'triangle', 1047, 0.15, t, t + 0.12)
  },

  // 17. 検索クリア - sine 1047→523Hz(80ms)
  searchClear(ctx) {
    const t = ctx.currentTime
    createOsc(ctx, 'sine', 1047, 0.2, t, t + 0.08, 523)
  },

  // 18. メモ保存 - ホワイトノイズ+バンドパスで「サッ」という筆記音(80ms)
  memoSave(ctx) {
    const t = ctx.currentTime
    const duration = 0.08
    const sampleRate = ctx.sampleRate
    const bufferSize = Math.ceil(sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(4000, t)
    filter.Q.setValueAtTime(1.5, t)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.12 * settings.volume, t)
    gain.gain.linearRampToValueAtTime(0, t + duration)
    source.connect(filter).connect(gain).connect(ctx.destination)
    source.start(t)
    source.stop(t + duration)
  },
}

// ─────────────────────────────────────────
// 公開API
// ─────────────────────────────────────────
export function playSound(name: SoundName): void {
  if (typeof window === 'undefined') return
  if (!settings.enabled) return
  const ctx = getAudioContext()
  if (!ctx || ctx.state === 'suspended') return
  soundGenerators[name](ctx)
}

export function setSoundEnabled(enabled: boolean): void {
  settings = { ...settings, enabled }
  saveSettings()
  emit()
}

export function setSoundVolume(volume: number): void {
  settings = { ...settings, volume: Math.max(0, Math.min(1, volume)) }
  saveSettings()
  emit()
}

export function getSoundSettings(): SoundSettings {
  return { ...settings }
}

// ─────────────────────────────────────────
// useSyncExternalStore 用ストア
// ─────────────────────────────────────────
export const soundStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot(): SoundSettings {
    return settings
  },
  getServerSnapshot(): SoundSettings {
    return { enabled: false, volume: 0.5 }
  },
}
