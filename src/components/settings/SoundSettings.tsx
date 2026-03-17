'use client';

import { useSound } from '@/hooks/auth/useSound';
import { initSoundEngine, playSound } from '@/lib/sound';

/**
 * サウンドフィードバック設定パネル
 * ON/OFFトグル、音量スライダー、試聴ボタン
 */
export default function SoundSettings() {
  const { enabled, volume, setEnabled, setVolume } = useSound();

  const handleToggle = () => {
    initSoundEngine();
    const next = !enabled;
    setEnabled(next);
    if (next) playSound('buttonAction');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    initSoundEngine();
    setVolume(Number(e.target.value));
  };

  const handlePreview = () => {
    initSoundEngine();
    playSound('buttonAction');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">操作音</span>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-8">音量</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <button
            onClick={handlePreview}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            試聴
          </button>
        </>
      )}
    </div>
  );
}
