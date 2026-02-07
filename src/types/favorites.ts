// お気に入りグループの型定義

export interface FavoriteGroup {
  id: string;
  name: string;
  color: GroupColor;
  createdAt: string;
  stocks: string[]; // 銘柄コードの配列
}

export type GroupColor =
  | 'blue'     // デフォルト
  | 'green'    // 成長株
  | 'red'      // 配当株
  | 'purple'   // 長期保有
  | 'yellow'   // 注目株
  | 'orange'   // 売却検討
  | 'pink'     // 新規発見
  | 'indigo'   // テクニカル
  | 'teal'     // バリュー
  | 'gray';    // その他

export const GROUP_COLORS: Record<GroupColor, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-600' },
  green: { bg: 'bg-green-600', text: 'text-green-100', border: 'border-green-600' },
  red: { bg: 'bg-red-600', text: 'text-red-100', border: 'border-red-600' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-600' },
  yellow: { bg: 'bg-yellow-600', text: 'text-yellow-100', border: 'border-yellow-600' },
  orange: { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-600' },
  pink: { bg: 'bg-pink-600', text: 'text-pink-100', border: 'border-pink-600' },
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-100', border: 'border-indigo-600' },
  teal: { bg: 'bg-teal-600', text: 'text-teal-100', border: 'border-teal-600' },
  gray: { bg: 'bg-gray-600', text: 'text-gray-100', border: 'border-gray-600' }
};

export const DEFAULT_GROUPS: Omit<FavoriteGroup, 'id' | 'createdAt' | 'stocks'>[] = [
  { name: '注目株', color: 'yellow' },
  { name: '高配当候補', color: 'red' },
  { name: '成長株', color: 'green' },
  { name: '長期保有', color: 'purple' },
  { name: '売却検討', color: 'orange' }
];

export const MAX_GROUPS = 10;
export const MAX_GROUP_NAME_LENGTH = 20;