// 株ノオト テンプレート定義

export interface MemoTemplate {
  id: string;
  name: string;
  icon: string;
  content: string;
}

export const MEMO_TEMPLATES: MemoTemplate[] = [
  {
    id: 'fundamental',
    name: 'ファンダメンタル分析',
    icon: '📊',
    content: `【業績】

【財務健全性】

【バリュエーション】PER:　/ PBR:　/ 配当利回り:

【成長性】

【総合評価】
`,
  },
  {
    id: 'technical',
    name: 'テクニカル分析',
    icon: '📈',
    content: `【トレンド】

【サポート/レジスタンス】支持線:　/ 抵抗線:

【出来高】

【エントリー条件】

【損切りライン】
`,
  },
  {
    id: 'dividend',
    name: '配当・優待分析',
    icon: '💰',
    content: `【配当実績】配当利回り:　/ 配当性向:

【増配傾向】

【優待内容】

【権利確定月】

【長期保有メリット】
`,
  },
  {
    id: 'research',
    name: '銘柄調査メモ',
    icon: '🔍',
    content: `【企業概要】

【競合優位性】

【リスク要因】

【注目ポイント】

【情報ソース】
`,
  },
  {
    id: 'buysell',
    name: '売買判断',
    icon: '⚖️',
    content: `【買いの理由】

【懸念点】

【目標株価】

【損切りライン】

【投資期間】短期 / 中期 / 長期
`,
  },
];
