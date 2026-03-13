export interface ExternalLink {
  id?: string;
  url: string;
  label: string;
  icon: string;
  gradient: string;
  order: number;
}

export const GRADIENT_PRESETS = [
  { value: 'from-green-600 to-blue-600', label: '緑→青' },
  { value: 'from-purple-600 to-pink-600', label: '紫→桃' },
  { value: 'from-orange-600 to-red-600', label: '橙→赤' },
  { value: 'from-indigo-600 to-violet-600', label: '藍→紫' },
  { value: 'from-cyan-600 to-teal-600', label: '水→翠' },
  { value: 'from-yellow-600 to-orange-600', label: '黄→橙' },
  { value: 'from-rose-600 to-red-600', label: '薔薇→赤' },
  { value: 'from-emerald-600 to-green-600', label: '翡翠→緑' },
] as const;

export const DEFAULT_EXTERNAL_LINKS: ExternalLink[] = [
  { url: 'https://kabutan.jp/warning/record_w52_high_price&dispmode=normal', icon: '📈', label: '52週高値', gradient: 'from-green-600 to-blue-600', order: 0 },
  { url: 'https://sekai-kabuka.com/', icon: '🌍', label: '世界の株価', gradient: 'from-purple-600 to-pink-600', order: 1 },
  { url: 'https://www.release.tdnet.info/inbs/I_main_00.html', icon: '📋', label: '適時開示', gradient: 'from-orange-600 to-red-600', order: 2 },
  { url: 'https://kabutan.jp/warning/pts_night_price_increase', icon: '🌙', label: 'PTS夜間', gradient: 'from-indigo-600 to-violet-600', order: 3 },
];

export const ICON_PRESETS = [
  '📈', '📉', '📊', '💹', '🌍', '🌏',
  '📋', '📰', '💰', '💵', '🏦', '🔔',
  '🌙', '⭐', '📌', '🔍', '💡', '📝',
  '🗓️', '🏢',
] as const;

export const MAX_EXTERNAL_LINKS = 8;
export const MAX_LINK_LABEL_LENGTH = 30;
export const MAX_LINK_ICON_LENGTH = 4;
export const MAX_LINK_URL_LENGTH = 2000;
