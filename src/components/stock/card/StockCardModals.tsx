'use client';

import { CustomTag, TagColor } from '@/types/tags';
import { FavoriteGroup } from '@/types/favorites';
import { NewsItem } from '@/types/diary';
import MemoTemplateSelector from '../../stock-tabs/MemoTemplateSelector';
import StockNewsDialog from '../../stock-tabs/StockNewsDialog';
import TagEditor from '../../tag/TagEditor';
import FavoriteGroupSelector from '../../tag/FavoriteGroupSelector';

interface StockCardModalsProps {
  symbol: string;
  companyName: string;
  // メモモーダル
  isMemoModalOpen: boolean;
  onMemoModalClose: () => void;
  memo: string;
  updateMemo: (value: string) => void;
  // ニュースダイアログ
  isNewsDialogOpen: boolean;
  onNewsDialogClose: () => void;
  newsItems: NewsItem[];
  addNewsItem: (url: string, comment: string) => void;
  removeNewsItem: (index: number) => void;
  updateNewsItem: (index: number, field: 'url' | 'comment', value: string) => void;
  isNewsSaving: boolean;
  newsLastSaved: Date | null;
  // タグエディター
  isTagEditorOpen: boolean;
  onTagEditorClose: () => void;
  customTags: CustomTag[];
  addTag: (label: string, color: TagColor) => Promise<void>;
  removeTagFromDB: (tagId: string) => Promise<void>;
  // お気に入りグループセレクター
  isFavoriteGroupSelectorOpen: boolean;
  onFavoriteGroupSelectorClose: () => void;
  favoriteGroups: FavoriteGroup[];
  belongingGroupIds: string[];
  onGroupsChange: (groupIds: string[]) => void;
}

export default function StockCardModals({
  symbol,
  companyName,
  isMemoModalOpen,
  onMemoModalClose,
  memo,
  updateMemo,
  isNewsDialogOpen,
  onNewsDialogClose,
  newsItems,
  addNewsItem,
  removeNewsItem,
  updateNewsItem,
  isNewsSaving,
  newsLastSaved,
  isTagEditorOpen,
  onTagEditorClose,
  customTags,
  addTag,
  removeTagFromDB,
  isFavoriteGroupSelectorOpen,
  onFavoriteGroupSelectorClose,
  favoriteGroups,
  belongingGroupIds,
  onGroupsChange,
}: StockCardModalsProps) {
  return (
    <>
      {/* メモ拡大モーダル */}
      {isMemoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onMemoModalClose}>
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[95vh] m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📝</span>
                <span>{companyName || symbol} - 株ノオト</span>
              </h3>
              <button
                onClick={onMemoModalClose}
                className="cursor-pointer text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={memo}
                onChange={(e) => updateMemo(e.target.value)}
                placeholder="この銘柄について詳しく思考を整理しましょう..."
                maxLength={2000}
                className="w-full h-[70vh] px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none font-mono leading-6 shadow-inner"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='24' xmlns='http://www.w3.org/2000/svg'%3e%3cline x1='0' y1='17' x2='100' y2='17' stroke='%23a1a1aa' stroke-width='1' stroke-dasharray='3,3' opacity='0.4'/%3e%3c/svg%3e")`,
                  backgroundSize: '100px 24px',
                  backgroundPosition: '0 3px'
                }}
                autoFocus
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-400">
                    自動保存されます
                  </p>
                  <MemoTemplateSelector
                    onSelect={(content) => updateMemo(content)}
                    currentMemo={memo}
                  />
                </div>
                <span className={`text-xs ${memo.length > 1800 ? 'text-orange-400' : memo.length > 1900 ? 'text-red-400' : 'text-gray-400'}`}>
                  {memo.length}/2000文字
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 銘柄ニュースダイアログ */}
      {isNewsDialogOpen && (
        <StockNewsDialog
          symbol={symbol}
          companyName={companyName}
          newsItems={newsItems}
          onAdd={addNewsItem}
          onRemove={removeNewsItem}
          onUpdate={updateNewsItem}
          isSaving={isNewsSaving}
          lastSaved={newsLastSaved}
          onClose={onNewsDialogClose}
        />
      )}

      {/* タグエディター */}
      {isTagEditorOpen && (
        <TagEditor
          symbol={symbol}
          currentTags={customTags}
          onAddTag={addTag}
          onRemoveTag={removeTagFromDB}
          onClose={onTagEditorClose}
        />
      )}

      {/* お気に入りグループセレクター */}
      {isFavoriteGroupSelectorOpen && (
        <FavoriteGroupSelector
          symbol={symbol}
          groups={favoriteGroups}
          selectedGroupIds={belongingGroupIds}
          onGroupsChange={onGroupsChange}
          onClose={onFavoriteGroupSelectorClose}
        />
      )}
    </>
  );
}
