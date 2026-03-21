'use client';

export default function DailyHabitsStep() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-3">毎日の投資習慣を身につけよう</h2>
      <p className="text-gray-300 mb-6">
        カブノオトで毎日の投資ルーティンを
        <br />
        楽しく続けられます
      </p>

      <div className="space-y-3 text-left">
        {/* チェックリスト */}
        <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
          <div className="text-sm font-medium text-white mb-2">✅ デイリーチェックリスト</div>
          <div className="space-y-1.5">
            {[
              { label: '経済ニュースチェック', checked: true },
              { label: '保有銘柄の値動き確認', checked: true },
              { label: '投資日記を書く', checked: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'
                }`}>
                  {item.checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-emerald-400 mt-2">全完了でXP獲得!</div>
        </div>

        {/* 投資日記 */}
        <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
          <div className="text-sm font-medium text-white mb-2">📓 投資日記</div>
          <div className="text-xs text-gray-400">
            マーケット概況・ニュース・振り返り・明日の注目の4セクションで、毎日の投資思考を記録
          </div>
        </div>

        {/* 投資格言 */}
        <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
          <div className="text-sm font-medium text-white mb-2">💡 今日の投資格言</div>
          <div className="text-xs text-gray-400 italic">
            日替わり100件の投資格言で、毎日新しいインスピレーション
          </div>
        </div>
      </div>
    </div>
  );
}
