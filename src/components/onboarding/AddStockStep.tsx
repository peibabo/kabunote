'use client';

export default function AddStockStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-3">銘柄を追加しよう</h2>
      <p className="text-gray-300 mb-6">まずは気になる銘柄を追加してみましょう</p>

      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="text-gray-300">右下の</span>
        <div className="text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" style={{ backgroundColor: '#36B164', boxShadow: '0 4px 14px rgba(52, 211, 153, 0.3)' }}>
          ＋
        </div>
        <span className="text-gray-300">ボタンをタップ</span>
      </div>

      <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 text-left space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-blue-400 text-lg">🔍</span>
          <div>
            <div className="text-sm font-medium text-white">銘柄コードで検索</div>
            <div className="text-xs text-gray-400">例: 7203（トヨタ自動車）</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-green-400 text-lg">🏢</span>
          <div>
            <div className="text-sm font-medium text-white">会社名で検索</div>
            <div className="text-xs text-gray-400">日本語・英語・ローマ字対応</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 text-lg">📋</span>
          <div>
            <div className="text-sm font-medium text-white">最大20銘柄まで登録可能</div>
            <div className="text-xs text-gray-400">厳選した銘柄を深く分析しましょう</div>
          </div>
        </div>
      </div>
    </div>
  );
}
