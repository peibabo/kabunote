/**
 * 銘柄カード基本タブの外部リンク定義
 * 表示/非表示・順番変更のカスタマイズ対応
 */

export interface StockExternalLinkDef {
  key: string;
  name: string;
  icon: string;
  urlTemplate: string; // ${symbol} がプレースホルダ
  bgColor: string;
  hoverBgColor: string;
}

export interface StockLinkSetting {
  key: string;
  visible: boolean;
  order: number;
}

export const STOCK_EXTERNAL_LINKS: StockExternalLinkDef[] = [
  {
    key: 'yahoo',
    name: 'Yahoo!',
    icon: '🟣',
    urlTemplate: 'https://finance.yahoo.co.jp/quote/${symbol}.T',
    bgColor: '#ff0033',
    hoverBgColor: '#cc0029',
  },
  {
    key: 'kabutan',
    name: '株探',
    icon: '🔍',
    urlTemplate: 'https://kabutan.jp/stock/chart?code=${symbol}',
    bgColor: 'rgb(5,47,109)',
    hoverBgColor: 'rgb(3,35,82)',
  },
  {
    key: 'tradingview',
    name: 'TradingView',
    icon: '📊',
    urlTemplate: 'https://jp.tradingview.com/symbols/TSE-${symbol}/',
    bgColor: '#131722',
    hoverBgColor: '#0e1117',
  },
  {
    key: 'minkabu',
    name: 'みんかぶ',
    icon: '🧑‍💼',
    urlTemplate: 'https://minkabu.jp/stock/${symbol}',
    bgColor: 'rgb(255,111,97)',
    hoverBgColor: 'rgb(255,87,69)',
  },
  {
    key: 'buffett-code',
    name: 'バフェット・コード',
    icon: '💰',
    urlTemplate: 'https://www.buffett-code.com/company/${symbol}/',
    bgColor: 'rgb(14,102,164)',
    hoverBgColor: 'rgb(11,82,131)',
  },
  {
    key: 'tdnet',
    name: '適時開示',
    icon: '📋',
    urlTemplate: 'https://irbank.net/td/search?q=${symbol}',
    bgColor: 'rgb(71,85,105)',
    hoverBgColor: 'rgb(51,65,85)',
  },
  {
    key: 'irbank',
    name: 'IR BANK',
    icon: '🏦',
    urlTemplate: 'https://irbank.net/${symbol}',
    bgColor: 'rgb(30,64,110)',
    hoverBgColor: 'rgb(22,48,83)',
  },
  {
    key: 'shikiho',
    name: '四季報',
    icon: '📕',
    urlTemplate: 'https://shikiho.toyokeizai.net/stocks/${symbol}',
    bgColor: 'rgb(180,30,30)',
    hoverBgColor: 'rgb(140,24,24)',
  },
  {
    key: 'nikkei',
    name: '日経',
    icon: '📰',
    urlTemplate: 'https://www.nikkei.com/nkd/company/?scode=${symbol}',
    bgColor: 'rgb(0,102,51)',
    hoverBgColor: 'rgb(0,77,38)',
  },
];

export const VALID_STOCK_LINK_KEYS = STOCK_EXTERNAL_LINKS.map(l => l.key);

export const STOCK_LINK_COUNT = STOCK_EXTERNAL_LINKS.length;

export const DEFAULT_STOCK_LINK_SETTINGS: StockLinkSetting[] =
  STOCK_EXTERNAL_LINKS.map((l, i) => ({ key: l.key, visible: true, order: i }));

/** keyからリンク定義を取得 */
export function getStockLinkDef(key: string): StockExternalLinkDef | undefined {
  return STOCK_EXTERNAL_LINKS.find(l => l.key === key);
}

/** urlTemplateのsymbolを置換してURLを生成 */
export function buildStockLinkUrl(template: string, symbol: string): string {
  return template.replace('${symbol}', symbol);
}
