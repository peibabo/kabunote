import ScrollAnimationWrapper from './ScrollAnimationWrapper'

const cards = [
  {
    icon: (
      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '完全無料',
    description: 'すべての機能を無料でお使いいただけます。隠れた課金や広告はありません。',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: '安心のデータ保護',
    description: 'データはクラウド上に安全に暗号化保存。デバイスを変えても、いつでもアクセスできます。',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: '投資が楽しくなる',
    description: 'ゲーミフィケーション・チェックリスト・投資日記で、毎日の投資活動が楽しい習慣に。',
  },
]

const badges = [
  '自動保存',
  'モバイル対応',
  'ダークテーマ',
  'サウンドフィードバック',
  '投資格言100件',
  'メモテンプレート5種',
  '20段階レベルアップ',
  '月別配当カレンダー',
]

export default function DifferentiationSection() {
  return (
    <section id="why-kabunote" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            カブノオトが選ばれる理由
          </h2>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {cards.map((card, i) => (
            <ScrollAnimationWrapper key={card.title} delay={i * 150}>
              <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-8 text-center hover:border-gray-600/60 transition-all h-full">
                <div className="w-16 h-16 rounded-2xl bg-gray-700/50 flex items-center justify-center mx-auto mb-5">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="text-gray-400 leading-relaxed">{card.description}</p>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        <ScrollAnimationWrapper delay={500}>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {badges.map((badge) => (
              <span
                key={badge}
                className="px-4 py-2 bg-gray-800/60 border border-gray-700/40 rounded-full text-sm text-gray-400"
              >
                {badge}
              </span>
            ))}
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  )
}
