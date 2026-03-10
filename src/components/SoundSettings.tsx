'use client';

import { useSound } from '@/hooks/useSound';
import { initSoundEngine } from '@/lib/sound';

export default function SoundSettings() {
  const { enabled, volume, setEnabled, setVolume, play } = useSound();

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      initSoundEngine();
      // トグルON時にプレビュー音を鳴らす
      setTimeout(() => play('toggle'), 50);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePreview = () => {
    initSoundEngine();
    play('toastSuccess');
  };

  return (
    <div className="px-2 py-3 space-y-3">
      {/* ON/OFF トグル */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">操作音</span>
        <button
          onClick={handleToggle}
          className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 音量スライダー */}
      {enabled && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-gray-400">🔊</span>
          <button
            onClick={handlePreview}
            className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
          >
            試聴
          </button>
        </div>
      )}
    </div>
  );
}
