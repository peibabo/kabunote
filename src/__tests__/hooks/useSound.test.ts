import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSound } from '@/hooks/useSound';

describe('useSound', () => {
  it('デフォルトの設定を返す', () => {
    const { result } = renderHook(() => useSound());
    expect(result.current.enabled).toBe(true);
    expect(result.current.volume).toBe(0.5);
    expect(typeof result.current.play).toBe('function');
    expect(typeof result.current.setEnabled).toBe('function');
    expect(typeof result.current.setVolume).toBe('function');
  });

  it('setEnabledで有効/無効を切り替えられる', () => {
    const { result } = renderHook(() => useSound());
    act(() => {
      result.current.setEnabled(false);
    });
    expect(result.current.enabled).toBe(false);
  });

  it('setVolumeで音量を変更できる', () => {
    const { result } = renderHook(() => useSound());
    act(() => {
      result.current.setVolume(0.8);
    });
    expect(result.current.volume).toBe(0.8);
  });
});
