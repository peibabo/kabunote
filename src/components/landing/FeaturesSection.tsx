import ScrollAnimationWrapper from './ScrollAnimationWrapper'

interface FeatureGroup {
  badge: string
  title: string
  description: string
  highlights: string[]
  gradient: string
  badgeBg: string
  direction: 'left' | 'right'
  mockContent: React.ReactNode
}

const featureGroups: FeatureGroup[] = [
  {
    badge: '最大20銘柄管理',
    title: '銘柄管理 & メモ',
    description: '会社名・コード・ローマ字で瞬時に検索。カスタムタグ8色、お気に入りグループ、AND検索で思考を整理。',
    highlights: ['フローティング追加UI', '自動保存メモ', 'ドラッグ&ドロップ並べ替え'],
    gradient: 'from-blue-500 to-cyan-500',
    badgeBg: 'bg-blue-500/20 text-blue-300',
    direction: 'left',
    mockContent: (
      <div className="space-y-2">
        {['トヨタ自動車', 'ソニーグループ', '任天堂'].map((name, i) => (
          <div key={name} className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-3">
            <div className={`w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-500 opacity-${80 - i * 15}`} />
            <span className="text-sm text-gray-300">{name}</span>
            <div className="ml-auto flex gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="w-2 h-2 rounded-full bg-green-400" />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    badge: '4種の円グラフ',
    title: '投資戦略 & 分析',
    description: 'タブ式管理で分析・次の一手・損益目標を記録。ポートフォリオ全体を円グラフとダッシュボードで俯瞰。',
    highlights: ['戦略一覧ダッシュボード', 'ネオンライト可視化', '損益目標管理'],
    gradient: 'from-purple-500 to-pink-500',
    badgeBg: 'bg-purple-500/20 text-purple-300',
    direction: 'right',
    mockContent: (
      <div className="flex items-center justify-center gap-6">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#374151" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="60 40" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="-60" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">構成比</div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-purple-500" /><span className="text-gray-400">製造業 60%</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-pink-500" /><span className="text-gray-400">IT 25%</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-600" /><span className="text-gray-400">その他 15%</span></div>
        </div>
      </div>
    ),
  },
  {
    badge: '6段階アラート',
    title: 'カレンダー & アラート',
    description: '決算日・権利確定日・配当日など6種イベントをカレンダーとタイムラインで一覧管理。スヌーズ機能付き。',
    highlights: ['カウントダウン表示', 'スマートナビゲーション', 'リアルタイム更新'],
    gradient: 'from-green-500 to-emerald-500',
    badgeBg: 'bg-green-500/20 text-green-300',
    direction: 'left',
    mockContent: (
      <div className="space-y-2">
        {[
          { date: '3/15', event: '決算発表', color: 'bg-amber-500', tag: 'あと4日' },
          { date: '3/28', event: '権利確定日', color: 'bg-green-500', tag: 'あと17日' },
          { date: '4/10', event: '配当支払日', color: 'bg-blue-500', tag: 'あと30日' },
        ].map((item) => (
          <div key={item.event} className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-3">
            <div className={`w-2 h-8 rounded ${item.color}`} />
            <div>
              <div className="text-sm text-gray-300">{item.event}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
            <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{item.tag}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    badge: '利回り自動計算',
    title: '配当・優待 & 資産管理',
    description: '配当シミュレーション・税引後計算・優待の取得資格判定。投資余力と現金比率もリアルタイムで把握。',
    highlights: ['配当優待一覧ダッシュボード', '現金比率可視化', 'Next Actionメモ'],
    gradient: 'from-orange-500 to-red-500',
    badgeBg: 'bg-orange-500/20 text-orange-300',
    direction: 'right',
    mockContent: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-400">3.2%</div>
            <div className="text-xs text-gray-500">配当利回り</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">¥48,000</div>
            <div className="text-xs text-gray-500">年間配当予想</div>
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>現金比率</span>
            <span>35%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: '35%' }} />
          </div>
        </div>
      </div>
    ),
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            充実の機能で、投資を支援
          </h2>
          <p className="text-gray-400 text-lg">
            投資家に必要な機能をオールインワンで
          </p>
        </ScrollAnimationWrapper>

        <div className="space-y-24 max-w-6xl mx-auto">
          {featureGroups.map((group, i) => {
            const isReversed = i % 2 === 1
            return (
              <div
                key={group.title}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-16`}
              >
                {/* Text side */}
                <ScrollAnimationWrapper
                  direction={group.direction}
                  className="flex-1"
                >
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${group.badgeBg}`}>
                    {group.badge}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    <span className={`bg-gradient-to-r ${group.gradient} bg-clip-text text-transparent`}>
                      {group.title}
                    </span>
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    {group.description}
                  </p>
                  <ul className="space-y-2">
                    {group.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-gray-300 text-sm">
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {h}
                      </li>
                    ))}
                  </ul>
                </ScrollAnimationWrapper>

                {/* Mock side */}
                <ScrollAnimationWrapper
                  direction={isReversed ? 'left' : 'right'}
                  delay={200}
                  className="flex-1 w-full"
                >
                  <div className="bg-gray-800/50 border border-gray-700/40 rounded-2xl p-6 max-w-md mx-auto">
                    {group.mockContent}
                  </div>
                </ScrollAnimationWrapper>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
