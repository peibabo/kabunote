import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiPut, apiDelete } from '@/lib/apiClient'
import { playSound } from '@/lib/sound'
import { grantXp } from '@/lib/gamification'
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents'
import { useAsyncState } from '../util/useAsyncState'
import { useAutoSave } from '../util/useAutoSave'

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
  const symbol = stockId.replace('stock-', '')
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
        if (data) {
          setLastSaved(new Date(data.updatedAt))
          playSound('noteSave')
          grantXp('MEMO_SAVE')
          emitAppEvent(APP_EVENTS.DB_MEMO_UPDATE, { symbol, memo: val })
        }
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
    emitAppEvent(APP_EVENTS.DB_MEMO_UPDATE, { symbol, memo: '' })
  }) as Promise<void>, [stockId, symbol, withSaving])

  return { memo, isLoading, isSaving, error, lastSaved, updateMemo, saveMemo: () => Promise.resolve(), deleteMemo }
}
