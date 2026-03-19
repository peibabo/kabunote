import { useEffect, useCallback, useRef } from 'react'

interface UseAutoSaveOptions<T> {
  value: T
  delay: number
  isLoading: boolean
  onSave: (value: T) => Promise<void>
}

export function useAutoSave<T>({ value, delay, isLoading, onSave }: UseAutoSaveOptions<T>) {
  const hasUserInputRef = useRef(false)
  const onSaveRef = useRef(onSave)
  const latestValueRef = useRef(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const pendingSaveRef = useRef(false)

  useEffect(() => { onSaveRef.current = onSave }, [onSave])
  useEffect(() => { latestValueRef.current = value }, [value])

  const executeSave = useCallback(() => {
    hasUserInputRef.current = false
    pendingSaveRef.current = false
    isSavingRef.current = true

    onSaveRef.current(latestValueRef.current).finally(() => {
      isSavingRef.current = false
      if (pendingSaveRef.current && hasUserInputRef.current) {
        pendingSaveRef.current = false
        hasUserInputRef.current = false
        isSavingRef.current = true
        onSaveRef.current(latestValueRef.current).finally(() => {
          isSavingRef.current = false
        })
      }
    })
  }, [])

  const doSave = useCallback(() => {
    if (!hasUserInputRef.current) return
    if (isSavingRef.current) {
      pendingSaveRef.current = true
      return
    }
    executeSave()
  }, [executeSave])

  // デバウンスタイマー: value変更時にリセット
  useEffect(() => {
    if (!hasUserInputRef.current || isLoading) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      doSave()
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [value, delay, isLoading, doSave])

  // アンマウント時にペンディング保存をフラッシュ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (hasUserInputRef.current) {
        hasUserInputRef.current = false
        onSaveRef.current(latestValueRef.current)
      }
    }
  }, [])

  const markDirty = useCallback(() => { hasUserInputRef.current = true }, [])

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    doSave()
  }, [doSave])

  return { markDirty, flush }
}
