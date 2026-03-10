import { useSyncExternalStore } from 'react'
import { soundStore, setSoundEnabled, setSoundVolume, playSound } from '@/lib/sound'
import type { SoundName } from '@/lib/sound'

export function useSound() {
  const settings = useSyncExternalStore(
    soundStore.subscribe,
    soundStore.getSnapshot,
    soundStore.getServerSnapshot
  )

  return {
    enabled: settings.enabled,
    volume: settings.volume,
    setEnabled: setSoundEnabled,
    setVolume: setSoundVolume,
    play: playSound,
  }
}

export type { SoundName }
