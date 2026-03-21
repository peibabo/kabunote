'use client'

import type { ChecklistItem } from '@/types/checklist'

interface ChecklistNormalModeProps {
  items: ChecklistItem[]
  onToggle: (id: string, currentChecked: boolean) => void
}

export default function ChecklistNormalMode({ items, onToggle }: ChecklistNormalModeProps) {
  return (
    <div className="space-y-1">
      {items.map(item => (
        <label
          key={item.id}
          className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-gray-700/30 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => onToggle(item.id, item.checked)}
            className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-0 bg-gray-700 cursor-pointer"
          />
          <span
            className={`text-sm transition-all duration-300 ${
              item.checked
                ? 'text-gray-500 line-through'
                : 'text-gray-200'
            }`}
          >
            {item.label}
          </span>
        </label>
      ))}
    </div>
  )
}
