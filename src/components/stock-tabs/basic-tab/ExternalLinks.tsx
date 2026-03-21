'use client';

interface ExternalLink {
  name: string;
  icon: string;
  url: string;
  bgColor: string;
  hoverBgColor: string;
}

const getExternalLinks = (symbol: string): ExternalLink[] => [
  {
    name: 'Yahoo!',
    icon: '🟣',
    url: `https://finance.yahoo.co.jp/quote/${symbol}.T`,
    bgColor: '#ff0033',
    hoverBgColor: '#cc0029'
  },
  {
    name: '株探',
    icon: '🔍',
    url: `https://kabutan.jp/stock/chart?code=${symbol}`,
    bgColor: 'rgb(5,47,109)',
    hoverBgColor: 'rgb(3,35,82)'
  },
  {
    name: 'TradingView',
    icon: '📊',
    url: `https://jp.tradingview.com/symbols/TSE-${symbol}/`,
    bgColor: '#131722',
    hoverBgColor: '#0e1117'
  },
  {
    name: 'みんかぶ',
    icon: '🧑‍💼',
    url: `https://minkabu.jp/stock/${symbol}`,
    bgColor: 'rgb(255,111,97)',
    hoverBgColor: 'rgb(255,87,69)'
  },
  {
    name: 'バフェット・コード',
    icon: '💰',
    url: `https://www.buffett-code.com/company/${symbol}/`,
    bgColor: 'rgb(14,102,164)',
    hoverBgColor: 'rgb(11,82,131)'
  },
  {
    name: '適時開示',
    icon: '📋',
    url: `https://irbank.net/td/search?q=${symbol}`,
    bgColor: 'rgb(71,85,105)',
    hoverBgColor: 'rgb(51,65,85)'
  }
];

interface ExternalLinksProps {
  symbol: string;
}

export default function ExternalLinks({ symbol }: ExternalLinksProps) {
  const externalLinks = getExternalLinks(symbol);

  return (
    <div className="space-y-2">
      {/* モバイル: 横スクロール円形アイコン */}
      <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-1 md:hidden">
        {externalLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-0.5 flex-shrink-0 w-14"
            title={link.name}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg transition-all hover:scale-105"
              style={{ backgroundColor: link.bgColor }}
            >
              {link.icon}
            </div>
            <span className="text-[10px] text-gray-400 truncate w-full text-center">{link.name}</span>
          </a>
        ))}
      </div>
      {/* デスクトップ: 既存の3列グリッド */}
      <div className="hidden md:grid grid-cols-3 gap-2">
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
  );
}
