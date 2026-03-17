import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';

// playSound をモック
vi.mock('@/lib/sound', () => ({
  playSound: vi.fn(),
}));

import { playSound } from '@/lib/sound';

describe('useSoundOnChange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  it('呼び出し直後は音を鳴らさない（デバウンス中）', () => {
    const { result } = renderHook(() => useSoundOnChange());
    act(() => {
      result.current();
    });
    expect(playSound).not.toHaveBeenCalled();
  });

  it('デバウンス後に1回だけ音を鳴らす', () => {
    const { result } = renderHook(() => useSoundOnChange(100));
    act(() => {
      result.current();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('textInput');
  });

  it('連続呼び出しでも最後の1回だけ鳴る', () => {
    const { result } = renderHook(() => useSoundOnChange(100));
    act(() => {
      result.current();
      result.current();
      result.current();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it('間隔を空けると2回鳴る', () => {
    const { result } = renderHook(() => useSoundOnChange(100));
    act(() => {
      result.current();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(playSound).toHaveBeenCalledTimes(1);

    act(() => {
      result.current();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(playSound).toHaveBeenCalledTimes(2);
  });
});
