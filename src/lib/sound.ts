/**
 * サウンドフィードバックエンジン
 *
 * Web Audio API を使ったシンセサウンド生成。
 * useSyncExternalStore 対応の soundStore を公開する。
 */

import { STORAGE_KEYS } from './storageKeys';

// ─── 型定義 ──────────────────────────────────
export type SoundName =
  | 'textInput'
  | 'toggle'
  | 'select'
  | 'buttonAction'
  | 'buttonDelete'
  | 'searchClear';

interface SoundDef {
  waveform: OscillatorType;
  freqStart: number;
  freqEnd: number;
  duration: number; // seconds
}

const SOUND_DEFS: Record<SoundName, SoundDef> = {
  textInput:    { waveform: 'sine', freqStart: 1047, freqEnd: 1047, duration: 0.05 },
  toggle:       { waveform: 'sine', freqStart: 700,  freqEnd: 900,  duration: 0.08 },
  select:       { waveform: 'sine', freqStart: 880,  freqEnd: 1100, duration: 0.06 },
  buttonAction: { waveform: 'sine', freqStart: 660,  freqEnd: 880,  duration: 0.10 },
  buttonDelete: { waveform: 'sine', freqStart: 880,  freqEnd: 440,  duration: 0.15 },
  searchClear:  { waveform: 'sine', freqStart: 1047, freqEnd: 523,  duration: 0.08 },
};

// ─── 内部状態 ─────────────────────────────────
let audioCtx: AudioContext | null = null;
let enabled: boolean = true;
let volume: number = 0.5;

// SSR ガード付き localStorage 読み込み
if (typeof window !== 'undefined') {
  const storedEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
  if (storedEnabled !== null) enabled = storedEnabled === 'true';
  const storedVolume = localStorage.getItem(STORAGE_KEYS.SOUND_VOLUME);
  if (storedVolume !== null) volume = Number(storedVolume);
}

// ─── useSyncExternalStore 用 Store ──────────
type Listener = () => void;
const listeners = new Set<Listener>();

// getSnapshot はキャッシュ済みオブジェクトを返す（useSyncExternalStoreの要件）
let cachedSnapshot = { enabled, volume };
const serverSnapshot = { enabled: true, volume: 0.5 };

function emitChange() {
  cachedSnapshot = { enabled, volume };
  listeners.forEach((l) => l());
}

export const soundStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): { enabled: boolean; volume: number } {
    return cachedSnapshot;
  },
  getServerSnapshot(): { enabled: boolean; volume: number } {
    return serverSnapshot;
  },
};

// ─── Public API ──────────────────────────────

/** AudioContext を初期化する（ユーザー操作イベント内で呼ぶ） */
export function initSoundEngine(): void {
  if (audioCtx) return;
  if (typeof window === 'undefined') return;
  audioCtx = new AudioContext();
}

/** サウンドを再生する */
export function playSound(name: SoundName): void {
  if (!enabled || !audioCtx) return;
  const def = SOUND_DEFS[name];
  if (!def) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = def.waveform;
  osc.frequency.setValueAtTime(def.freqStart, audioCtx.currentTime);
  if (def.freqStart !== def.freqEnd) {
    osc.frequency.linearRampToValueAtTime(
      def.freqEnd,
      audioCtx.currentTime + def.duration,
    );
  }

  gain.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + def.duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + def.duration);
}

/** サウンド有効/無効を切り替え */
export function setSoundEnabled(value: boolean): void {
  enabled = value;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(value));
  }
  emitChange();
}

/** 音量を設定 (0–1) */
export function setSoundVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, String(volume));
  }
  emitChange();
}
