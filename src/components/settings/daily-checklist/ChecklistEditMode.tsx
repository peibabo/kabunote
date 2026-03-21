'use client'

import type { ChecklistItem } from '@/types/checklist'

interface ChecklistEditModeProps {
  editingItems: ChecklistItem[]
  dragIndex: number | null
  onLabelChange: (id: string, label: string) => void
  onEditDelete: (id: string) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
}

export default function ChecklistEditMode({
  editingItems,
  dragIndex,
  onLabelChange,
  onEditDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: ChecklistEditModeProps) {
  return (
    <div className="space-y-1">
      {editingItems.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => onDragOver(e, index)}
          onDragEnd={onDragEnd}
          className={`flex items-center gap-2 py-1 px-2 rounded-md bg-gray-700/30 ${
            dragIndex === index ? 'opacity-50' : ''
          }`}
        >
          <span className="text-gray-500 cursor-grab text-xs">☰</span>
          <input
            type="text"
            value={item.label}
            onChange={e => onLabelChange(item.id, e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-200 border-b border-gray-600 focus:border-teal-500 outline-none py-1"
            maxLength={100}
          />
          <button
            onClick={() => onEditDelete(item.id)}
            className="cursor-pointer text-gray-500 hover:text-red-400 text-xs transition-colors"
            title="削除"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
