'use client';

import { useState } from 'react';
import { StockData } from '@/data/stockNames';
import { CustomTag, TAG_COLORS } from '@/types/tags';
import { FavoriteGroup, GROUP_COLORS } from '@/types/favorites';

interface StockCardHeaderProps {
  symbol: string;
  companyName: string;
  stockData: StockData | null;
  isLoading: boolean;
  isKnown: boolean;
  customTags: CustomTag[];
  belongingGroups: FavoriteGroup[];
  onTagEditorOpen: () => void;
  onFavoriteGroupSelectorOpen: () => void;
  onTagRemove: (tagId: string) => void;
  onRemove: () => void;
  // ドラッグ&ドロップ関連
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  listeners: Record<string, Function> | undefined;
}

export default function StockCardHeader({
  symbol,
  companyName,
  stockData,
  isLoading,
  isKnown,
  customTags,
  belongingGroups,
  onTagEditorOpen,
  onFavoriteGroupSelectorOpen,
  onTagRemove,
  onRemove,
  listeners,
}: StockCardHeaderProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    onRemove();
  };

  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div>
      {/* 上部: 銘柄コード・ステータス・タグ・操作ボタン */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 max-w-[calc(100%-80px)]">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base md:text-lg font-bold text-white">{symbol}</h3>
            {isLoading ? (
              <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">
                読込中
              </span>
            ) : !isKnown ? (
              <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded-full">
                未登録
              </span>
            ) : (
              <div className="space-y-2">
                {/* 業種・市場（上部） */}
                {(stockData?.sector || stockData?.market) && (
                  <div className="flex flex-wrap gap-1 items-center">
                    {stockData?.sector && (
                      <span className="text-xs bg-blue-600 text-blue-100 px-2 py-0.5 rounded-full">
                        📊 {stockData.sector}
                      </span>
                    )}
                    {stockData?.market && (
                      <span className="text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded-full">
                        🏛️ {stockData.market}
                      </span>
                    )}
                  </div>
                )}

                {/* 区切り線（業種・市場がある場合に表示） */}
                {(stockData?.sector || stockData?.market) && (
                  <div className="border-t border-gray-700 my-2"></div>
                )}

                {/* タグ・グループ（下部） */}
                {(customTags.length > 0 || belongingGroups.length > 0) && (
                  <div className="flex flex-wrap gap-1 items-center">
                    {customTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`text-xs px-2 py-0.5 rounded-full ${TAG_COLORS[tag.color].bg} ${TAG_COLORS[tag.color].text} flex items-center gap-1`}
                      >
                        <span>🏷️ {tag.label}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTagRemove(tag.id);
                          }}
                          className="cursor-pointer bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none transition-all hover:scale-110"
                          title={`${tag.label}タグを削除`}
                          style={{ lineHeight: '1', transform: 'translateY(1px)' }}
                        >
                          <span style={{ transform: 'translateY(-0.5px)' }}>×</span>
                        </button>
                      </span>
                    ))}
                    {belongingGroups.map((group) => (
                      <span
                        key={group.id}
                        className={`text-xs px-2 py-0.5 rounded-full border ${GROUP_COLORS[group.color].border} ${GROUP_COLORS[group.color].text} bg-opacity-20 ${GROUP_COLORS[group.color].bg}`}
                      >
                        ★ {group.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* ボタン行（常に表示） */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={onTagEditorOpen}
                    className="cursor-pointer text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full transition-colors"
                    title="タグを編集"
                  >
                    + タグ
                  </button>
                  <button
                    onClick={onFavoriteGroupSelectorOpen}
                    className="cursor-pointer text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full transition-colors"
                    title="お気に入りグループを編集"
                  >
                    + お気に入り
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            {...listeners}
            className="bg-gray-600 hover:bg-gray-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-colors cursor-grab active:cursor-grabbing"
            aria-label="カードを移動"
            title="ドラッグして順序を変更"
          >
            ⋮⋮
          </button>
          <button
            onClick={handleDeleteClick}
            className="cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors"
            aria-label="銘柄カードを削除"
          >
            ×
          </button>
        </div>
      </div>

      {/* 会社名（独立した行） */}
      <div className="mt-2 w-full">
        <p className="text-sm md:text-base text-gray-100 font-bold leading-tight break-words" title={companyName}>
          {companyName}
        </p>
      </div>

      {/* 削除確認モーダル */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleDeleteCancel}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className="text-red-400 text-4xl">⚠️</div>
              <h3 className="text-lg font-bold text-white">銘柄カードを削除しますか？</h3>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">
                  <span className="font-medium text-white">{symbol}</span>
                  <br />
                  <span className="text-gray-100">{companyName}</span>
                </p>
                <p className="text-gray-400 text-xs">
                  この操作は取り消せません。株ノオト、タグ、投資情報なども全て削除されます。
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeleteCancel}
                  className="cursor-pointer flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="cursor-pointer flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}