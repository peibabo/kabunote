import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch, apiPut } from '@/lib/apiClient'
import { playSound } from '@/lib/sound'
import { grantXp } from '@/lib/gamification'
import { useAsyncState } from '../util/useAsyncState'
import { useAutoSave } from '../util/useAutoSave'
import type { DiaryData, DiaryResponse, DiaryMonthResponse, DiaryField } from '@/types/diary'

const EMPTY_DIARY: DiaryData = {
  marketOverview: '',
  newsMemo: '',
  reflection: '',
  tomorrowFocus: '',
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function getMonth(date: string): string {
  return date.slice(0, 7)
}

interface UseDiaryReturn {
  diary: DiaryData
  selectedDate: string
  diaryDates: string[]
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  updateField: (field: DiaryField, value: string) => void
  changeDate: (date: string) => void
}

export function useDiary(): UseDiaryReturn {
  const [diary, setDiary] = useState<DiaryData>(EMPTY_DIARY)
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [diaryDates, setDiaryDates] = useState<string[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState(true)

  // 日記データの一意キーとして日付+内容のJSONを使う
  const serialized = JSON.stringify({ date: selectedDate, ...diary })

  const loadDiary = useCallback((date: string) => withLoading(async () => {
    const data = await apiFetch<DiaryResponse>(`/api/diary?date=${date}`)
    setDiary({
      marketOverview: data.marketOverview,
      newsMemo: data.newsMemo,
      reflection: data.reflection,
      tomorrowFocus: data.tomorrowFocus,
    })
    if (data.updatedAt) {
      setLastSaved(new Date(data.updatedAt))
    } else {
      setLastSaved(null)
    }
  }), [withLoading])

  const loadMonthDates = useCallback(async (month: string) => {
    try {
      const data = await apiFetch<DiaryMonthResponse>(`/api/diary?month=${month}`)
      setDiaryDates(data.dates)
    } catch {
      // 月データ取得失敗は無視
    }
  }, [])

  // 初回ロード
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      loadDiary(selectedDate)
      loadMonthDates(getMonth(selectedDate))
    }
  }, [selectedDate, loadDiary, loadMonthDates])

  // 自動保存
  const { markDirty } = useAutoSave({
    value: serialized,
    delay: 300,
    isLoading,
    onSave: async () => {
      await withSaving(async () => {
        const data = await apiPut<{ updatedAt: string }>('/api/diary', {
          date: selectedDate,
          ...diary,
        })
        if (data) {
          setLastSaved(new Date(data.updatedAt))
          playSound('noteSave')
          grantXp('DIARY_SAVE')
          // 月のドットリストを更新（新しい日付が追加された可能性）
          if (!diaryDates.includes(selectedDate)) {
            setDiaryDates(prev => [...prev, selectedDate].sort())
          }
        }
      })
    },
  })

  const updateField = useCallback((field: DiaryField, value: string) => {
    setDiary(prev => ({ ...prev, [field]: value }))
    markDirty()
  }, [markDirty])

  const changeDate = useCallback((date: string) => {
    const newMonth = getMonth(date)
    const oldMonth = getMonth(selectedDate)
    setSelectedDate(date)
    setDiary(EMPTY_DIARY)
    setLastSaved(null)
    loadDiary(date)
    if (newMonth !== oldMonth) {
      loadMonthDates(newMonth)
    }
  }, [selectedDate, loadDiary, loadMonthDates])

  return {
    diary, selectedDate, diaryDates,
    isLoading, isSaving, lastSaved,
    updateField, changeDate,
  }
}
