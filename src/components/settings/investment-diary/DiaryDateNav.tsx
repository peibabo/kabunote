'use client'

import { formatDateJP } from '@/lib/dateFormat'

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface DiaryDateNavProps {
  selectedDate: string
  today: string
  isToday: boolean
  isFutureDate: boolean
  diaryDates: string[]
  onChangeDate: (date: string) => void
}

export default function DiaryDateNav({
  selectedDate,
  today,
  isToday,
  isFutureDate,
  diaryDates,
  onChangeDate,
}: DiaryDateNavProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onChangeDate(addDays(selectedDate, -1))}
          className="cursor-pointer text-gray-400 hover:text-white text-sm px-2 py-1 transition-colors"
        >
          ◀
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-200">
            {formatDateJP(selectedDate)}
          </span>
          {!isToday && (
            <button
              onClick={() => onChangeDate(today)}
              className="cursor-pointer text-xs text-orange-400 hover:text-orange-300 px-2 py-0.5 border border-orange-400/30 rounded transition-colors"
            >
              今日
            </button>
          )}
        </div>
        <button
          onClick={() => onChangeDate(addDays(selectedDate, 1))}
          disabled={isToday || isFutureDate}
          className="cursor-pointer text-gray-400 hover:text-white text-sm px-2 py-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ▶
        </button>
      </div>

      {/* 月のドット */}
      {diaryDates.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 justify-center">
          {diaryDates.map(d => (
            <button
              key={d}
              onClick={() => onChangeDate(d)}
              className={`cursor-pointer w-6 h-6 rounded text-xs transition-colors ${
                d === selectedDate
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
              }`}
              title={formatDateJP(d)}
            >
              {new Date(d + 'T00:00:00').getDate()}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
