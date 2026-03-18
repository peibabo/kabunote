/** チェックリスト項目 */
export interface ChecklistItem {
  id: string
  label: string
  order: number
  checked: boolean
}

/** チェックリストAPI レスポンス */
export interface ChecklistResponse {
  items: ChecklistItem[]
  totalCount: number
  checkedCount: number
  allCompleted: boolean
}
