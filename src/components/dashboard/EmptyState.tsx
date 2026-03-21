'use client';

interface EmptyStateProps {
  stockSymbolsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function EmptyState({ stockSymbolsCount, searchQuery, setSearchQuery }: EmptyStateProps) {
  if (stockSymbolsCount === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="mb-6">
          <h3 className="text-xl font-medium text-white mb-3">🎯 銘柄カードを追加してください</h3>
          <p className="text-gray-400 mb-4">投資の思考整理を始めましょう。まずは気になる銘柄を追加してみてください。</p>
        </div>

        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-blue-300 text-sm">右下の</span>
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">
              ＋
            </div>
            <span className="text-blue-300 text-sm">ボタンから銘柄を追加できます</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <span>💡</span>
              <span>銘柄コード（例：7203）または会社名（例：トヨタ）で検索</span>
            </div>
          </div>
        </div>

        <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✨</span>
            <span>銘柄を追加すると投資メモやタグ付けができます</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">📊</span>
            <span>ポジション管理や損益シミュレーション機能も利用可能</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">🏷️</span>
            <span>お気に入りグループで銘柄を整理できます</span>
          </div>
        </div>
      </div>
    );
  }

  if (searchQuery.trim()) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <h3 className="text-xl font-medium text-white mb-2">検索結果がありません</h3>
        <p className="text-gray-400">「{searchQuery}」に一致する銘柄・メモ・タグが見つかりませんでした。</p>
        <button
          onClick={() => setSearchQuery('')}
          className="cursor-pointer mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          検索をクリア
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <h3 className="text-xl font-medium text-white mb-2">表示する銘柄がありません</h3>
      <p className="text-gray-400">選択したグループに銘柄が登録されていません。</p>
    </div>
  );
}
