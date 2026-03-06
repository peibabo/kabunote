'use client'

import { useSyncExternalStore } from 'react'
import { toastStore } from '@/lib/toast'

const typeStyles = {
  success: 'bg-green-800 border-green-600 text-green-100',
  error: 'bg-red-900 border-red-600 text-red-100',
  warning: 'bg-yellow-900 border-yellow-600 text-yellow-100',
} as const

const typeIcons = {
  success: '\u2714',
  error: '\u2716',
  warning: '\u26A0',
} as const

export default function ToastContainer() {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, () => [])

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {items.map(item => (
        <div
          key={item.id}
          className={`flex items-start gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm animate-[slideIn_0.2s_ease-out] ${typeStyles[item.type]}`}
        >
          <span className="mt-0.5 shrink-0">{typeIcons[item.type]}</span>
          <span className="flex-1">{item.message}</span>
          <button
            onClick={() => toastStore.remove(item.id)}
            className="shrink-0 opacity-60 hover:opacity-100 ml-2"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
