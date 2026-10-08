/**
 * サウンドフィードバックエンジン
 *
 * Web Audio API を使ったシンセサウンド生成。
 * useSyncExternalStore 対応の soundStore を公開する。
 */

import { STORAGE_KEYS } from './storageKeys';
import { safeGetItem, safeSetItem } from './safeStorage';

// ─── 型定義 ──────────────────────────────────
export type SoundName =
  | 'textInput'
  | 'toggle'
  | 'select'
  | 'buttonAction'
  | 'buttonDelete'
  | 'searchClear'
  | 'noteSave'
  | 'accordionOpen'
  | 'accordionClose'
  | 'levelUp';

interface SoundDef {
  waveform: OscillatorType;
  freqStart: number;
  freqEnd: number;
  duration: number; // seconds
}

const SOUND_DEFS: Record<Exclude<SoundName, 'noteSave' | 'accordionOpen' | 'accordionClose' | 'levelUp'>, SoundDef> = {
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
  const storedEnabled = safeGetItem(STORAGE_KEYS.SOUND_ENABLED);
  if (storedEnabled !== null) enabled = storedEnabled === 'true';
  const storedVolume = safeGetItem(STORAGE_KEYS.SOUND_VOLUME);
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

/** ペンで書いているような摩擦音を再生する（ノイズ+バンドパスフィルター） */
function playPenWriteSound(): void {
  if (!audioCtx) return;
  const duration = 0.18;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // ホワイトノイズに振幅変調（カリカリ感）を加える
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // 3つの短いストローク（山）を作る振幅エンベロープ
    const phase = (t / duration) * 3;
    const stroke = Math.sin(phase * Math.PI) * 0.7 + 0.3;
    data[i] = (Math.random() * 2 - 1) * stroke;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  // バンドパスフィルターで「紙の上のペン」のような帯域に絞る
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 4500;
  filter.Q.value = 0.8;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume * 0.25, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(audioCtx.currentTime);
  source.stop(audioCtx.currentTime + duration);
}

/** iPhone風の軽いタップ音を再生する（開閉で音程を変える） */
function playChimeSound(open: boolean): void {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  // 開く: 低→高の軽い2音、閉じる: 高→低の軽い2音
  // iPhoneのUI音に近い周波数帯（やや高めで軽快）
  const freq = open ? 1400 : 1200;
  const duration = 0.06;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // triangle波で柔らかくも輪郭のある音色（iPhone風）
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t);
  // わずかに周波数を変化させてタップ感を出す
  osc.frequency.linearRampToValueAtTime(
    open ? freq * 1.15 : freq * 0.85,
    t + duration,
  );

  // 瞬時に立ち上がり、素早く減衰（クリスプなタップ感）
  gain.gain.setValueAtTime(volume * 0.3, t);
  gain.gain.linearRampToValueAtTime(0, t + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

/** レベルアップ時の上昇アルペジオ（C5→E5→G5→C6） */
function playLevelUpSound(): void {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  const noteDelay = 0.1;
  const noteDuration = 0.4;

  for (let i = 0; i < notes.length; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = notes[i];
    const start = t + i * noteDelay;
    gain.gain.setValueAtTime(volume * 0.3, start);
    gain.gain.linearRampToValueAtTime(0, start + noteDuration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + noteDuration);
  }
}

/** サウンドを再生する */
export function playSound(name: SoundName): void {
  if (!enabled || !audioCtx) return;

  // レベルアップのアルペジオ
  if (name === 'levelUp') {
    playLevelUpSound();
    return;
  }

  // noteSave はノイズベースのペン書き音
  if (name === 'noteSave') {
    playPenWriteSound();
    return;
  }

  // アコーディオン開閉のチャイム音
  if (name === 'accordionOpen' || name === 'accordionClose') {
    playChimeSound(name === 'accordionOpen');
    return;
  }

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
    safeSetItem(STORAGE_KEYS.SOUND_ENABLED, String(value));
  }
  emitChange();
}

/** 音量を設定 (0–1) */
export function setSoundVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
  if (typeof window !== 'undefined') {
    safeSetItem(STORAGE_KEYS.SOUND_VOLUME, String(volume));
  }
  emitChange();
}
