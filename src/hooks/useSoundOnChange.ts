import { useRef, useCallback } from 'react';
import { playSound } from '@/lib/sound';

/**
 * テキスト/数値入力の onChange 時にデバウンス付きで音を鳴らすフック
 *
 * キー入力やスピナー操作のたびに呼ばれるが、
 * 連続入力中は音を鳴らさず、150ms 入力が止まったら1回だけ鳴る。
 *
 * @example
 * const onChangeSound = useSoundOnChange();
 * <input onChange={(e) => { setValue(e.target.value); onChangeSound(); }} />
 */
export function useSoundOnChange(delayMs = 150) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      playSound('textInput');
      timerRef.current = null;
    }, delayMs);
  }, [delayMs]);

  return trigger;
}
