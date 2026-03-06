import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiPut, apiDelete } from '@/lib/apiClient'
import { useAsyncState } from './useAsyncState'
import { useAutoSave } from './useAutoSave'

interface UseStockMemoReturn {
  memo: string
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSaved: Date | null
  updateMemo: (content: string) => void
  saveMemo: () => Promise<void>
  deleteMemo: () => Promise<void>
}

interface UseStockMemoOptions {
  initialData?: string
}

export function useStockMemo(stockId: string, options?: UseStockMemoOptions): UseStockMemoReturn {
  const hasInitialData = options?.initialData !== undefined
  const [memo, setMemo] = useState(options?.initialData ?? '')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { isLoading, isSaving, error, withLoading, withSaving } = useAsyncState(!hasInitialData)

  const loadMemo = useCallback(() => withLoading(async () => {
    const data = await apiFetch<{ content: string; updatedAt: string }>(`/api/stocks/${stockId}/memo`)
    setMemo(data.content)
    setLastSaved(new Date(data.updatedAt))
  }), [stockId, withLoading])

  useEffect(() => { if (!hasInitialData) loadMemo() }, [loadMemo, hasInitialData])

  const { markDirty } = useAutoSave({
    value: memo,
    delay: 300,
    isLoading,
    onSave: async (val) => {
      await withSaving(async () => {
        const data = await apiPut<{ updatedAt: string }>(`/api/stocks/${stockId}/memo`, { content: val })
        if (data) setLastSaved(new Date(data.updatedAt))
      })
    },
  })

  const updateMemo = useCallback((content: string) => {
    setMemo(content)
    markDirty()
  }, [markDirty])

  const deleteMemo = useCallback(() => withSaving(async () => {
    await apiDelete(`/api/stocks/${stockId}/memo`)
    setMemo('')
    setLastSaved(null)
  }) as Promise<void>, [stockId, withSaving])

  return { memo, isLoading, isSaving, error, lastSaved, updateMemo, saveMemo: () => Promise.resolve(), deleteMemo }
}
