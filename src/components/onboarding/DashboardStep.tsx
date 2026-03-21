'use client';

export default function DashboardStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-3">分析ダッシュボード</h2>
      <p className="text-gray-300 mb-6">右上の ☰ メニューから様々な機能にアクセスできます</p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '📊', label: 'ポートフォリオ', desc: '資産構成を可視化' },
          { icon: '📅', label: 'イベント一覧', desc: '決算日・権利日を管理' },
          { icon: '🚨', label: 'アラート一覧', desc: '目標株価の到達を通知' },
          { icon: '🎯', label: '戦略一覧', desc: '全銘柄の戦略を俯瞰' },
          { icon: '💼', label: 'ポジション一覧', desc: '保有銘柄の損益分析' },
          { icon: '💰', label: '配当・優待', desc: '配当利回り・優待情報' },
          { icon: '📓', label: '投資日記', desc: '毎日の振り返りを記録' },
          { icon: '🏆', label: 'レベル・称号', desc: '経験値と称号を確認' },
        ].map((item) => (
          <div key={item.label} className="bg-gray-700 bg-opacity-50 rounded-lg p-3 text-left">
            <div className="text-lg mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-white">{item.label}</div>
            <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
