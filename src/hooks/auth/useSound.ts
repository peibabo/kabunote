import { useSyncExternalStore, useCallback } from 'react';
import {
  soundStore,
  playSound as playSoundRaw,
  setSoundEnabled,
  setSoundVolume,
  type SoundName,
} from '@/lib/sound';

/**
 * サウンドフィードバック設定を購読し、操作関数を返すフック
 */
export function useSound() {
  const { enabled, volume } = useSyncExternalStore(
    soundStore.subscribe,
    soundStore.getSnapshot,
    soundStore.getServerSnapshot,
  );

  const play = useCallback((name: SoundName) => {
    playSoundRaw(name);
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setSoundEnabled(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    setSoundVolume(value);
  }, []);

  return { enabled, volume, play, setEnabled, setVolume };
}
