import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from './useDebounce'

interface UseAutoSaveOptions<T> {
  value: T
  delay: number
  isLoading: boolean
  onSave: (value: T) => Promise<void>
}

export function useAutoSave<T>({ value, delay, isLoading, onSave }: UseAutoSaveOptions<T>) {
  const [hasUserInput, setHasUserInput] = useState(false)
  const debouncedValue = useDebounce(value, delay)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  useEffect(() => {
    if (hasUserInput && !isLoading) {
      onSaveRef.current(debouncedValue).then(() => setHasUserInput(false))
    }
  }, [debouncedValue, hasUserInput, isLoading])

  const markDirty = useCallback(() => setHasUserInput(true), [])

  return { markDirty }
}
