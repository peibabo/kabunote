// お気に入りグループの型定義

export interface FavoriteGroup {
  id: string;
  name: string;
  color: GroupColor;
  createdAt: string;
  stocks: string[]; // 銘柄コードの配列
}

export type GroupColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'indigo'
  | 'teal'
  | 'cyan'
  | 'lime'
  | 'gray';

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
  gray: { bg: 'bg-gray-600', text: 'text-gray-100', border: 'border-gray-600' },
  lime: { bg: 'bg-lime-600', text: 'text-lime-100', border: 'border-lime-600' },
  cyan: { bg: 'bg-cyan-600', text: 'text-cyan-100', border: 'border-cyan-600' }
};

export const DEFAULT_GROUPS: Omit<FavoriteGroup, 'id' | 'createdAt' | 'stocks'>[] = [
  { name: '主力保有株', color: 'blue' },
  { name: '短期決戦', color: 'orange' },
  { name: '配当・優待枠', color: 'green' },
  { name: 'ウォッチリスト', color: 'red' },
  { name: '出口戦略実行', color: 'cyan' },
  { name: '過去保有株', color: 'purple' },
];

export const MAX_GROUPS = 10;
export const MAX_GROUP_NAME_LENGTH = 20;