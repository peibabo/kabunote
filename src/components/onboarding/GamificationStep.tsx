'use client';

export default function GamificationStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-3">投資活動がレベルアップに！</h2>
      <p className="text-gray-300 mb-6">
        メモを書く、日記をつける、チェックリストを完了する。
        <br />
        投資活動がXP経験値になります
      </p>

      {/* レベル表示モック */}
      <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg px-3 py-1.5 text-white font-bold text-sm">
            Lv.1
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">見習い投資家</div>
            <div className="text-xs text-gray-400">次のレベルまで 50 XP</div>
          </div>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
          <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full" style={{ width: '10%' }} />
        </div>
        <div className="text-xs text-gray-400">銘柄追加で +15 XP、メモ保存で +10 XP...</div>
      </div>

      <div className="space-y-2 text-left">
        {[
          { icon: '⭐', label: '14種のXPアクティビティ', desc: 'メモ・日記・チェックリストなど' },
          { icon: '🔥', label: '連続ストリーク', desc: '毎日ログインでボーナスXP' },
          { icon: '🏆', label: '28種の称号コレクション', desc: '条件達成で称号をゲット' },
          { icon: '🎉', label: 'レベルアップ演出', desc: 'サウンド&エフェクトでお祝い' },
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
