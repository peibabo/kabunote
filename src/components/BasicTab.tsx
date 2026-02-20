'use client';

interface ExternalLink {
  name: string;
  icon: string;
  url: string;
  bgColor: string;
  hoverBgColor: string;
}

interface BasicTabProps {
  symbol: string;
  memo: string;
  onMemoChange: (value: string) => void;
  onMemoModalOpen: () => void;
}

const getExternalLinks = (symbol: string): ExternalLink[] => [
  {
    name: 'Yahoo!',
    icon: '🟣',
    url: `https://finance.yahoo.co.jp/quote/${symbol}.T`,
    bgColor: '#ff0033', // Yahoo!の正式ブランドカラー
    hoverBgColor: '#cc0029' // 少し暗めのホバー色
  },
  {
    name: '株探',
    icon: '🔍',
    url: `https://kabutan.jp/stock/chart?code=${symbol}`,
    bgColor: 'rgb(5,47,109)', // 株探の正式ブランドカラー
    hoverBgColor: 'rgb(3,35,82)' // 少し暗めのホバー色
  },
  {
    name: 'TradingView',
    icon: '📊',
    url: `https://jp.tradingview.com/symbols/TSE-${symbol}/`,
    bgColor: '#131722', // TradingViewの公式ダークカラー
    hoverBgColor: '#0e1117' // 少し暗めのホバー色
  },
  {
    name: 'みんかぶ',
    icon: '🧑‍💼',
    url: `https://minkabu.jp/stock/${symbol}`,
    bgColor: 'rgb(255,111,97)', // みんかぶのオレンジ系ブランドカラー
    hoverBgColor: 'rgb(255,87,69)' // 少し暗めのホバー色
  },
  {
    name: 'バフェット・コード',
    icon: '💰',
    url: `https://www.buffett-code.com/company/${symbol}/`,
    bgColor: 'rgb(14,102,164)', // バフェット・コードの正式ブランドカラー
    hoverBgColor: 'rgb(11,82,131)' // 少し暗めのホバー色
  },
  {
    name: '適時開示',
    icon: '📋',
    url: `https://irbank.net/td/search?q=${symbol}`,
    bgColor: 'rgb(71,85,105)', // 適時開示のグレー系
    hoverBgColor: 'rgb(51,65,85)' // 少し暗めのホバー色
  }
];

export default function BasicTab({
  symbol,
  memo,
  onMemoChange,
  onMemoModalOpen
}: BasicTabProps) {
  const externalLinks = getExternalLinks(symbol);

  return (
    <div className="space-y-4">
      {/* 基本タブ: メモ + チャート・外部リンク */}
      {/* メモ欄 */}
      <div className="space-y-2">
        <label htmlFor={`memo-${symbol}`} className="text-sm font-medium text-gray-300">
          株ノオト
        </label>
        <textarea
          id={`memo-${symbol}`}
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="この銘柄について思考を整理しましょう..."
          maxLength={2000}
          className="w-full h-50 px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none font-mono leading-6 shadow-inner"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='24' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='17' x2='100' y2='17' stroke='%23a1a1aa' stroke-width='1' stroke-dasharray='3,3' opacity='0.4'/%3e%3c/svg%3e")`,
            backgroundSize: '100px 24px',
            backgroundPosition: '0 19px'
          }}
          rows={4}
        />
        <div className="flex items-center justify-between">
          <button
            onClick={onMemoModalOpen}
            className="text-xs cursor-pointer text-blue-400 hover:text-blue-300 transition-colors"
          >
            📝 株ノオトを大きく開く
          </button>
          <span className={`text-xs ${memo.length > 1800 ? 'text-orange-400' : memo.length > 1900 ? 'text-red-400' : 'text-gray-400'}`}>
            {memo.length}/2000文字
          </span>
        </div>
      </div>

      {/* 外部リンクボタン */}
      <div className="space-y-2">
        {/* 外部リンク */}
        <div className="grid grid-cols-3 gap-2">
          {externalLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-xs py-2 px-1 rounded-lg transition-all text-center flex flex-col items-center gap-1 hover:scale-105 transform"
              style={{
                backgroundColor: link.bgColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = link.hoverBgColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = link.bgColor;
              }}
              title={link.name}
            >
              <span className="text-sm">{link.icon}</span>
              <span className="leading-tight">{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}