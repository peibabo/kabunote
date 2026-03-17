export const FEEDBACK_CATEGORIES = [
  { value: 'FEATURE_REQUEST', label: '機能要望', icon: '💡' },
  { value: 'IMPROVEMENT', label: '改善提案', icon: '✨' },
  { value: 'BUG_REPORT', label: '不具合報告', icon: '🐛' },
  { value: 'OTHER', label: 'その他', icon: '📝' },
] as const

export type FeedbackCategoryValue = typeof FEEDBACK_CATEGORIES[number]['value']

export const VALID_FEEDBACK_CATEGORIES: readonly string[] = FEEDBACK_CATEGORIES.map(c => c.value)

export function getCategoryLabel(category: string): string {
  const found = FEEDBACK_CATEGORIES.find(c => c.value === category)
  return found ? `${found.icon} ${found.label}` : category
}
