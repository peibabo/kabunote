'use client';

import MemoTemplateSelector from './MemoTemplateSelector';
import { evaluatePer, evaluatePbr } from '@/lib/positionCalc';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';

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
  isMemoLoading?: boolean;
  isMemoSaving?: boolean;
  memoError?: string | null;
  memoLastSaved?: Date | null;
  per: string;
  pbr: string;
  onPerChange: (value: string) => void;
  onPbrChange: (value: string) => void;
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
  onMemoModalOpen,
  isMemoLoading = false,
  isMemoSaving = false,
  memoError = null,
  memoLastSaved = null,
  per,
  pbr,
  onPerChange,
  onPbrChange,
}: BasicTabProps) {
  const externalLinks = getExternalLinks(symbol);
  const onChangeSound = useSoundOnChange();

  return (
    <div className="space-y-4">
      {/* PER/PBR バリュエーション指標 */}
      <div className="grid grid-cols-2 gap-3">
        {/* PER */}
        <div className="space-y-1">
          <label htmlFor={`per-${symbol}`} className="text-xs font-medium text-purple-300">
            📊 PER（株価収益率）
          </label>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id={`per-${symbol}`}
                type="number"
                step="0.1"
                value={per}
                onChange={(e) => { onPerChange(e.target.value); onChangeSound(); }}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-base md:text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">倍</span>
            </div>
            {per && parseFloat(per) > 0 && (() => {
              const evaluation = evaluatePer(parseFloat(per));
              return (
                <span className={`text-xs font-medium whitespace-nowrap ${evaluation.color}`}>
                  {evaluation.label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* PBR */}
        <div className="space-y-1">
          <label htmlFor={`pbr-${symbol}`} className="text-xs font-medium text-purple-300">
            📊 PBR（株価純資産倍率）
          </label>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id={`pbr-${symbol}`}
                type="number"
                step="0.01"
                value={pbr}
                onChange={(e) => { onPbrChange(e.target.value); onChangeSound(); }}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-base md:text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">倍</span>
            </div>
            {pbr && parseFloat(pbr) > 0 && (() => {
              const evaluation = evaluatePbr(parseFloat(pbr));
              return (
                <span className={`text-xs font-medium whitespace-nowrap ${evaluation.color}`}>
                  {evaluation.label}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* メモ欄 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor={`memo-${symbol}`} className="text-sm font-medium text-gray-300">
            株ノオト
          </label>
          <div className="flex items-center space-x-2">
            {isMemoLoading && (
              <div className="flex items-center space-x-1">
                <div className="animate-spin h-3 w-3 border border-blue-400 border-t-transparent rounded-full"></div>
                <span className="text-xs text-blue-400">読込中...</span>
              </div>
            )}
            {isMemoSaving && (
              <div className="flex items-center space-x-1">
                <div className="animate-pulse h-2 w-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-400">保存中...</span>
              </div>
            )}
            {memoLastSaved && !isMemoSaving && (
              <span className="text-xs text-gray-500">
                {memoLastSaved.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}に保存
              </span>
            )}
          </div>
        </div>
        {memoError && (
          <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
            エラー: {memoError}
          </div>
        )}
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
          <div className="flex items-center gap-3">
            <button
              onClick={onMemoModalOpen}
              className="text-xs cursor-pointer text-blue-400 hover:text-blue-300 transition-colors"
            >
              📝 株ノオトを大きく開く
            </button>
            <MemoTemplateSelector
              onSelect={(content) => onMemoChange(content)}
              currentMemo={memo}
            />
          </div>
          <span className={`text-xs ${memo.length > 1800 ? 'text-orange-400' : memo.length > 1900 ? 'text-red-400' : 'text-gray-400'}`}>
            {memo.length}/2000文字
          </span>
        </div>
      </div>

      {/* 外部リンクボタン */}
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
    </div>
  );
}