// カスタムタグの型定義

export interface CustomTag {
  id: string;
  label: string;
  color: TagColor;
  createdAt: string;
}

export type TagColor =
  | 'red'      // 高配当
  | 'green'    // グロース
  | 'purple'   // 優待
  | 'yellow'   // 監視中
  | 'blue'     // その他
  | 'orange'   // リスク
  | 'pink'     // 注目
  | 'gray';    // 保留

export const TAG_COLORS: Record<TagColor, { bg: string; text: string }> = {
  red: { bg: 'bg-red-600', text: 'text-red-100' },
  green: { bg: 'bg-green-600', text: 'text-green-100' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-100' },
  yellow: { bg: 'bg-yellow-600', text: 'text-yellow-100' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-100' },
  orange: { bg: 'bg-orange-600', text: 'text-orange-100' },
  pink: { bg: 'bg-pink-600', text: 'text-pink-100' },
  gray: { bg: 'bg-gray-600', text: 'text-gray-100' }
};

export const PRESET_TAGS: Omit<CustomTag, 'id' | 'createdAt'>[] = [
  { label: '高配当', color: 'red' },
  { label: '優待', color: 'green' },
  { label: '割安', color: 'purple' },
  { label: '成長', color: 'yellow' },
  { label: '要警戒', color: 'pink' },
  { label: '決算直前', color: 'orange' }
];