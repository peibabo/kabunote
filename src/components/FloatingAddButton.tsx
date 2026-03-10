'use client';

import { useState, useEffect } from 'react';
import StockInput from '@/components/StockInput';
import { GROUP_COLORS, GroupColor } from '@/types/favorites';

interface FloatingAddButtonProps {
  onAddStock: (code: string) => void;
  error: string;
  setError: (error: string) => void;
  disabled?: boolean;
  currentCount: number;
  maxCount: number;
  selectedGroupInfo?: {
    name: string;
    color: GroupColor;
  } | null;
  isFirstTime?: boolean;
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
}

export default function FloatingAddButton({
  onAddStock,
  error,
  setError,
  disabled = false,
  currentCount,
  maxCount,
  selectedGroupInfo = null,
  isFirstTime = false,
  forceOpen = false,
  onForceOpenHandled,
}: FloatingAddButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 外部からモーダルを開く
  useEffect(() => {
    if (forceOpen) {
      setIsModalOpen(true);
      setError('');
      onForceOpenHandled?.();
    }
  }, [forceOpen, setError, onForceOpenHandled]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError(''); // エラーをクリア
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(''); // エラーをクリア
  };

  const handleAddStock = (code: string) => {
    onAddStock(code);
    if (!error) { // エラーがない場合のみモーダルを閉じる
      setIsModalOpen(false);
    }
  };

  // バッジの色を使用率に応じて決定
  const usageRatio = currentCount / maxCount;
  const getBadgeColor = () => {
    if (usageRatio >= 1) return 'bg-red-500 text-white';
    if (usageRatio >= 0.8) return 'bg-yellow-500 text-gray-900';
    return 'bg-gray-600 text-gray-200';
  };

  return (
    <>
      {/* フローティングボタン */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-1">
        {/* カウンターバッジ */}
        {currentCount > 0 && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getBadgeColor()} shadow-md`}
          >
            {currentCount}/{maxCount}
          </span>
        )}
        <button
          onClick={handleOpenModal}
          disabled={disabled}
          className={`
            cursor-pointer
            w-14 h-14 rounded-full shadow-lg
            flex items-center justify-center
            text-white text-2xl font-bold
            transition-all duration-200
            hover:scale-110 hover:shadow-xl
            ${disabled
              ? 'bg-gray-600 cursor-not-allowed'
              : 'hover:brightness-110 active:scale-95'
            }
            ${isFirstTime ? 'animate-pulse ring-4 ring-emerald-300 ring-opacity-50' : ''}
          `}
          style={!disabled ? { backgroundColor: '#36B164' } : undefined}
          title="銘柄を追加"
          aria-label="銘柄を追加"
        >
          ＋
        </button>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📈</span>
                銘柄を追加
                <span className="text-sm font-normal text-gray-400">({currentCount}/{maxCount})</span>
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700"
                aria-label="モーダルを閉じる"
              >
                ×
              </button>
            </div>

            {/* 選択中のグループ情報表示 */}
            {selectedGroupInfo && (
              <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">→</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${GROUP_COLORS[selectedGroupInfo.color].bg} ${GROUP_COLORS[selectedGroupInfo.color].text}`}
                  >
                    ★ {selectedGroupInfo.name}に自動追加
                  </span>
                </div>
              </div>
            )}

            {/* エラー表示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* 銘柄入力コンポーネント */}
            <div className="mb-4">
              <StockInput onAddStock={handleAddStock} isDisabled={false} />
            </div>

            {/* 説明テキスト */}
            <div className="text-xs text-gray-400 space-y-1">
              <p>💡 銘柄コード（例：7203）または会社名（例：トヨタ）を入力</p>
              <p>📝 オートコンプリートから選択するか、Enterキーで追加</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
