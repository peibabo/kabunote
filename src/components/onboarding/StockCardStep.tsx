'use client';

export default function StockCardStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-3">シナリオを設定しよう</h2>
      <p className="text-gray-300 mb-6">
        銘柄カードの「📊 シナリオ」タブで
        <br />
        投資判断の軸を見える化できます
      </p>

      {/* シナリオのイメージ */}
      <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">損切ライン</span>
          <span className="text-xs text-gray-400">現在株価</span>
          <span className="text-xs text-gray-400">目標株価</span>
        </div>
        {/* プログレスバーのイメージ */}
        <div className="relative h-3 bg-gray-600 rounded-full overflow-hidden mb-2">
          <div className="absolute left-0 h-full w-[65%] bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
          <div className="absolute left-[65%] top-1/2 -translate-y-1/2 w-2 h-5 bg-white rounded-sm shadow" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-red-400">¥2,800</span>
          <span className="text-white font-medium">¥3,250</span>
          <span className="text-green-400">¥3,500</span>
        </div>
      </div>

      <div className="space-y-2 text-left">
        {[
          { icon: '🎯', label: '目標株価', desc: '利益確定の目安を設定' },
          { icon: '🛡️', label: '損切ライン', desc: 'リスク管理の基準を明確に' },
          { icon: '⚖️', label: 'リスクリワード比', desc: '自動計算で判断をサポート' },
          { icon: '📈', label: '損益シミュレーション', desc: '保有株数に応じた損益を試算' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 bg-gray-700 bg-opacity-30 rounded-lg px-3 py-2">
            <span className="text-lg">{item.icon}</span>
            <div>
              <div className="text-sm font-medium text-white">{item.label}</div>
              <div className="text-xs text-gray-400">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
