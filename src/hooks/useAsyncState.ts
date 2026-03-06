import { useState, useCallback } from 'react'
import { toast } from '@/lib/toast'

export function useAsyncState(initialLoading = true) {
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '読み込みエラー'
      setError(msg)
      toast.error(msg)
      console.error('❌', err)
      return undefined
    } finally {
      setIsLoading(false)
    }
  }, [])

  const withSaving = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setIsSaving(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存エラー'
      setError(msg)
      toast.error(msg)
      console.error('❌', err)
      return undefined
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { isLoading, isSaving, error, setError, withLoading, withSaving }
}
