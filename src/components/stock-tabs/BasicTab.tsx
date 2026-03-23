'use client';

import MemoTemplateSelector from './MemoTemplateSelector';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';
import type { NewsItem } from '@/types/diary';
import ValuationMetrics from './basic-tab/ValuationMetrics';
import StockNewsSection from './basic-tab/StockNewsSection';
import ExternalLinks from './basic-tab/ExternalLinks';

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
  fairPer: string;
  fairPbr: string;
  currentPrice: string;
  onPerChange: (value: string) => void;
  onPbrChange: (value: string) => void;
  onFairPerChange: (value: string) => void;
  onFairPbrChange: (value: string) => void;
  newsItems?: NewsItem[];
  onNewsDialogOpen?: () => void;
  isNewsLoading?: boolean;
}

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
  fairPer,
  fairPbr,
  currentPrice,
  onPerChange,
  onPbrChange,
  onFairPerChange,
  onFairPbrChange,
  newsItems = [],
  onNewsDialogOpen,
  isNewsLoading = false,
}: BasicTabProps) {
  const onChangeSound = useSoundOnChange();

  return (
    <div className="space-y-4">
      {/* PER/PBR バリュエーション指標 */}
      <ValuationMetrics
        symbol={symbol}
        per={per}
        pbr={pbr}
        fairPer={fairPer}
        fairPbr={fairPbr}
        currentPrice={currentPrice}
        onPerChange={onPerChange}
        onPbrChange={onPbrChange}
        onFairPerChange={onFairPerChange}
        onFairPbrChange={onFairPbrChange}
        onChangeSound={onChangeSound}
      />

      {/* 銘柄ニュース */}
      <StockNewsSection
        newsItems={newsItems}
        onNewsDialogOpen={onNewsDialogOpen}
        isNewsLoading={isNewsLoading}
      />

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
      <ExternalLinks symbol={symbol} />
    </div>
  );
}
