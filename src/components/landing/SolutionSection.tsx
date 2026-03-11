import ScrollAnimationWrapper from './ScrollAnimationWrapper'

const checkpoints = [
  { text: '銘柄カードで情報を一か所に集約', color: 'text-blue-400' },
  { text: 'タグとメモで思考を構造化', color: 'text-cyan-400' },
  { text: 'カレンダーとアラートで見逃しゼロ', color: 'text-green-400' },
]

export default function SolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 max-w-6xl mx-auto">
          {/* Left text */}
          <ScrollAnimationWrapper direction="left" className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              カブノオトが、
              <br />
              <span className="text-blue-400">すべて解決します。</span>
            </h2>
            <div className="space-y-5">
              {checkpoints.map((cp) => (
                <div key={cp.text} className="flex items-start gap-3">
                  <svg className={`w-6 h-6 ${cp.color} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-300 text-lg">{cp.text}</span>
                </div>
              ))}
            </div>
          </ScrollAnimationWrapper>

          {/* Right CSS mock */}
          <ScrollAnimationWrapper direction="right" className="flex-1 w-full">
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl p-6 max-w-md mx-auto lg:mx-0 lg:ml-auto">
              {/* Mock stock card */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  7203
                </div>
                <div>
                  <div className="text-white font-medium text-sm">トヨタ自動車</div>
                  <div className="text-gray-500 text-xs">輸送用機器</div>
                </div>
              </div>
              {/* Mock tabs */}
              <div className="flex gap-1 mb-3">
                {['基本', '戦略', '管理'].map((tab, i) => (
                  <div
                    key={tab}
                    className={`px-3 py-1 rounded text-xs ${
                      i === 0
                        ? 'bg-blue-600/30 text-blue-300'
                        : 'bg-gray-700/30 text-gray-500'
                    }`}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              {/* Mock memo */}
              <div className="bg-gray-900/60 rounded-lg p-3 mb-3">
                <div className="text-xs text-gray-500 mb-1">投資メモ</div>
                <div className="text-sm text-gray-300 leading-relaxed">
                  EV戦略の進捗に注目。次の決算で生産台数の数字を確認...
                </div>
              </div>
              {/* Mock tags */}
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">長期保有</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs">高配当</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">決算注目</span>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  )
}
