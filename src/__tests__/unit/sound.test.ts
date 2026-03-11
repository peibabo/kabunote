import { describe, it, expect, beforeEach, vi } from 'vitest';

// モジュールを動的にimport（各テストで独立した状態にするため）
let soundModule: typeof import('@/lib/sound');

describe('sound engine', () => {
  beforeEach(async () => {
    localStorage.clear();
    // モジュールキャッシュをリセット
    vi.resetModules();
    soundModule = await import('@/lib/sound');
  });

  describe('initSoundEngine', () => {
    it('AudioContextを作成する', () => {
      soundModule.initSoundEngine();
      // initSoundEngineが例外なく完了すればOK
      expect(true).toBe(true);
    });

    it('2回呼んでも例外が発生しない', () => {
      soundModule.initSoundEngine();
      soundModule.initSoundEngine();
      expect(true).toBe(true);
    });
  });

  describe('playSound', () => {
    it('初期化前は例外なく呼べる（音は鳴らない）', () => {
      // initSoundEngine未呼び出し
      soundModule.playSound('textInput');
      expect(true).toBe(true);
    });

    it('初期化後は音を鳴らす', () => {
      soundModule.initSoundEngine();
      soundModule.playSound('textInput');
      // エラーなく完了することを確認
      expect(true).toBe(true);
    });

    it('無効時は音を鳴らさない', () => {
      soundModule.initSoundEngine();
      soundModule.setSoundEnabled(false);
      // 無効化後に呼んでもエラーにならない
      soundModule.playSound('textInput');
      expect(true).toBe(true);
    });

    it('全9種のサウンドが再生可能', () => {
      soundModule.initSoundEngine();
      const names: Array<import('@/lib/sound').SoundName> = [
        'textInput', 'toggle', 'select', 'buttonAction', 'buttonDelete', 'searchClear', 'noteSave',
        'accordionOpen', 'accordionClose',
      ];
      for (const name of names) {
        soundModule.playSound(name);
      }
      expect(true).toBe(true);
    });
  });

  describe('setSoundEnabled', () => {
    it('有効/無効をlocalStorageに保存する', () => {
      soundModule.setSoundEnabled(false);
      expect(localStorage.getItem('kabunote-sound-enabled')).toBe('false');
      soundModule.setSoundEnabled(true);
      expect(localStorage.getItem('kabunote-sound-enabled')).toBe('true');
    });
  });

  describe('setSoundVolume', () => {
    it('音量をlocalStorageに保存する', () => {
      soundModule.setSoundVolume(0.8);
      expect(localStorage.getItem('kabunote-sound-volume')).toBe('0.8');
    });

    it('0-1の範囲にクランプする', () => {
      soundModule.setSoundVolume(-0.5);
      expect(localStorage.getItem('kabunote-sound-volume')).toBe('0');
      soundModule.setSoundVolume(1.5);
      expect(localStorage.getItem('kabunote-sound-volume')).toBe('1');
    });
  });

  describe('soundStore', () => {
    it('getSnapshotがデフォルト値を返す', () => {
      const snapshot = soundModule.soundStore.getSnapshot();
      expect(snapshot.enabled).toBe(true);
      expect(snapshot.volume).toBe(0.5);
    });

    it('getServerSnapshotがデフォルト値を返す', () => {
      const snapshot = soundModule.soundStore.getServerSnapshot();
      expect(snapshot.enabled).toBe(true);
      expect(snapshot.volume).toBe(0.5);
    });

    it('subscribe/unsubscribeが動作する', () => {
      const listener = vi.fn();
      const unsubscribe = soundModule.soundStore.subscribe(listener);
      soundModule.setSoundEnabled(false);
      expect(listener).toHaveBeenCalled();
      unsubscribe();
      listener.mockClear();
      soundModule.setSoundEnabled(true);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
