'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChecklist } from '@/hooks/dashboard/useChecklist'
import { useAccordionState } from '@/hooks/util/useAccordionState'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import { MAX_CHECKLIST_ITEMS } from '@/lib/checklistPresets'
import { playSound } from '@/lib/sound'
import type { ChecklistItem } from '@/types/checklist'
import ChecklistHeader from './daily-checklist/ChecklistHeader'
import ChecklistNormalMode from './daily-checklist/ChecklistNormalMode'
import ChecklistEditMode from './daily-checklist/ChecklistEditMode'

export default function DailyChecklist() {
  const {
    items, isLoading, hasLoaded,
    totalCount, checkedCount, allCompleted,
    toggleCheck, addItem, deleteItem, updateItems, applyPreset,
  } = useChecklist()

  const { isExpanded, toggle } = useAccordionState({
    storageKey: STORAGE_KEYS.CHECKLIST_EXPANDED,
    defaultExpanded: false,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [newItemLabel, setNewItemLabel] = useState('')
  const [editingItems, setEditingItems] = useState<ChecklistItem[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevAllCompleted = useRef(false)

  useEffect(() => {
    if (allCompleted && !prevAllCompleted.current && totalCount > 0) {
      playSound('levelUp')
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 2000)
      return () => clearTimeout(timer)
    }
    prevAllCompleted.current = allCompleted
  }, [allCompleted, totalCount])

  const startEditing = () => {
    setEditingItems(items.map(i => ({ ...i })))
    setIsEditing(true)
    playSound('buttonAction')
  }

  const finishEditing = () => {
    const reordered = editingItems.map((item, idx) => ({ ...item, order: idx }))
    updateItems(reordered)
    setIsEditing(false)
    playSound('buttonAction')
  }

  const handleLabelChange = (id: string, label: string) => {
    setEditingItems(prev => prev.map(i => i.id === id ? { ...i, label } : i))
  }

  const handleEditDelete = (id: string) => {
    setEditingItems(prev => prev.filter(i => i.id !== id))
    deleteItem(id)
    playSound('buttonDelete')
  }

  const handleDragStart = (index: number) => { setDragIndex(index) }
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setEditingItems(prev => {
      const newItems = [...prev]
      const [dragged] = newItems.splice(dragIndex, 1)
      newItems.splice(index, 0, dragged)
      return newItems
    })
    setDragIndex(index)
  }
  const handleDragEnd = () => { setDragIndex(null) }

  const handleAddItem = async () => {
    if (!newItemLabel.trim()) return
    const success = await addItem(newItemLabel.trim())
    if (success) { setNewItemLabel(''); playSound('buttonAction') }
  }

  const handleToggle = useCallback((id: string, currentChecked: boolean) => {
    toggleCheck(id, !currentChecked)
    playSound('toggle')
  }, [toggleCheck])

  const handleApplyPreset = async () => { await applyPreset(); playSound('buttonAction') }

  if (isLoading || !hasLoaded) return null

  const borderColor = allCompleted ? 'rgb(34, 197, 94)' : 'rgb(20, 184, 166)'
  const shadowColor = allCompleted ? 'rgba(34, 197, 94, 0.3)' : 'rgba(20, 184, 166, 0.3)'

  return (
    <div
      className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg animate-fade-in"
      style={{ borderLeftWidth: '2px', borderLeftColor: borderColor, boxShadow: `-2px 0 8px ${shadowColor}` }}
    >
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full animate-confetti"
              style={{
                left: `${15 + Math.random() * 70}%`, top: '-4px',
                backgroundColor: ['#a855f7', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#ec4899', '#06b6d4', '#f97316'][i],
                animationDelay: `${i * 0.1}s`, animationDuration: `${1.2 + Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      <ChecklistHeader isExpanded={isExpanded} totalCount={totalCount} checkedCount={checkedCount} allCompleted={allCompleted} onToggle={toggle} />

      {isExpanded && (
        <div className="px-4 pb-3">
          {totalCount === 0 && (
            <div className="text-center py-3">
              <p className="text-gray-400 text-sm mb-3">毎日の投資ルーティンを設定しましょう</p>
              <button onClick={handleApplyPreset} className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                おすすめプリセットを使う
              </button>
              <p className="text-gray-500 text-xs mt-2">または下の入力欄から自由に追加できます</p>
            </div>
          )}

          {!isEditing ? (
            <ChecklistNormalMode items={items} onToggle={handleToggle} />
          ) : (
            <ChecklistEditMode editingItems={editingItems} dragIndex={dragIndex} onLabelChange={handleLabelChange} onEditDelete={handleEditDelete} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} />
          )}

          <div className="flex items-center justify-between mt-3">
            {!isEditing && totalCount < MAX_CHECKLIST_ITEMS && (
              <div className="flex items-center gap-2 flex-1">
                <input ref={inputRef} type="text" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddItem() }} placeholder="+ 項目を追加" className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 border-b border-gray-700 focus:border-teal-500 outline-none py-1" maxLength={100} />
                {newItemLabel.trim() && (
                  <button onClick={handleAddItem} className="cursor-pointer text-teal-400 hover:text-teal-300 text-xs transition-colors">追加</button>
                )}
              </div>
            )}
            {isEditing && <div className="flex-1" />}
            {totalCount > 0 && (
              <button onClick={isEditing ? finishEditing : startEditing} className="cursor-pointer text-gray-500 hover:text-gray-300 text-xs ml-3 transition-colors">
                {isEditing ? '完了' : '⚙ 編集'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
