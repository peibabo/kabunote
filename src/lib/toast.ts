import { playSound } from './sound'

type ToastType = 'success' | 'error' | 'warning'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

const EMPTY: ToastItem[] = []
let nextId = 0
let items: ToastItem[] = EMPTY
const listeners = new Set<() => void>()

const toastSoundMap = {
  success: 'toastSuccess',
  warning: 'toastWarning',
  error: 'toastError',
} as const

function emit() {
  listeners.forEach(fn => fn())
}

function add(type: ToastType, message: string) {
  const id = nextId++
  items = [...items, { id, type, message }]
  emit()
  playSound(toastSoundMap[type])

  const duration = type === 'success' ? 3000 : type === 'warning' ? 4000 : 5000
  setTimeout(() => remove(id), duration)
}

function remove(id: number) {
  items = items.filter(t => t.id !== id)
  emit()
}

export const toast = {
  success: (message: string) => add('success', message),
  error: (message: string) => add('error', message),
  warning: (message: string) => add('warning', message),
}

export const toastStore = {
  getSnapshot: () => items,
  getServerSnapshot: () => EMPTY,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  remove,
}
