import ScrollAnimationWrapper from './ScrollAnimationWrapper'

const engagementCards = [
  {
    title: 'デイリーチェックリスト',
    description: '毎朝の投資ルーティンを定義して、毎日リセット。全完了でXP獲得。プリセット5項目で今すぐ始められます。',
    gradient: 'from-emerald-500 to-teal-500',
    mockContent: (
      <div className="space-y-2 mt-4">
        {[
          { label: '経済ニュースチェック', checked: true },
          { label: '保有銘柄の値動き確認', checked: true },
          { label: '投資日記を書く', checked: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 bg-gray-900/50 rounded-lg px-3 py-2">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'
            }`}>
              {item.checked && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
              {item.label}
            </span>
          </div>
        ))}
        <div className="text-xs text-emerald-400 text-center mt-2">2/3 完了 - あと1つでXP獲得!</div>
      </div>
    ),
  },
  {
    title: '投資家レベル & 称号',
    description: '投資活動がそのままXPに。20段階のレベルアップと、28種の称号コレクションで成長を実感。',
    gradient: 'from-violet-500 to-fuchsia-500',
    mockContent: (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg px-2.5 py-1 text-white font-bold text-xs">
            Lv.12
          </div>
          <span className="text-sm text-white">マーケット探偵</span>
          <span className="text-xs text-orange-400 ml-auto">🔥 7日</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-1.5 rounded-full" style={{ width: '65%' }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-xs">📈 上限マスター</span>
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">📝 筆まめ</span>
          <span className="px-2 py-0.5 bg-gray-700/50 text-gray-500 rounded text-xs">🔒 ???</span>
        </div>
      </div>
    ),
  },
  {
    title: '投資日記 & 格言',
    description: '1日1記録の投資日記。日替わりの投資格言100件で、毎日新しいインスピレーション。',
    gradient: 'from-amber-500 to-yellow-500',
    mockContent: (
      <div className="mt-4 space-y-3">
        <div className="bg-gray-900/50 rounded-lg p-3 border-l-2 border-amber-500">
          <div className="text-xs text-gray-500 mb-1">今日の振り返り</div>
          <div className="text-sm text-gray-300">利確タイミングの判断が...</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500" />
          <div className="pl-3">
            <div className="text-sm text-gray-300 italic leading-relaxed">&ldquo;最大の投資リスクは、投資しないことだ&rdquo;</div>
            <div className="text-xs text-gray-500 mt-1">- ウォーレン・バフェット</div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function DailyEngagementSection() {
  return (
    <section id="daily" className="py-20 md:py-28 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            毎日アクセスしたくなる、投資習慣
          </h2>
          <p className="text-gray-400 text-lg">
            カブノオトは、ただの管理ツールではありません。あなたの投資活動をゲームのように楽しくします。
          </p>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {engagementCards.map((card, i) => (
            <ScrollAnimationWrapper key={card.title} delay={i * 150}>
              <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6 hover:border-gray-600/60 transition-all h-full">
                <h3 className="text-lg font-bold text-white mb-2">
                  <span className={`bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                    {card.title}
                  </span>
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {card.description}
                </p>
                {card.mockContent}
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
