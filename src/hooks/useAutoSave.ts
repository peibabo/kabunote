import { useEffect, useCallback, useRef } from 'react'
import { useDebounce } from './useDebounce'

interface UseAutoSaveOptions<T> {
  value: T
  delay: number
  isLoading: boolean
  onSave: (value: T) => Promise<void>
}

export function useAutoSave<T>({ value, delay, isLoading, onSave }: UseAutoSaveOptions<T>) {
  const hasUserInputRef = useRef(false)
  const debouncedValue = useDebounce(value, delay)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  useEffect(() => {
    if (hasUserInputRef.current && !isLoading) {
      hasUserInputRef.current = false
      onSaveRef.current(debouncedValue)
    }
  }, [debouncedValue, isLoading])

  const markDirty = useCallback(() => { hasUserInputRef.current = true }, [])

  return { markDirty }
}
