import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="animate-orb-1 absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="animate-orb-2 absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="animate-orb-3 absolute bottom-1/4 left-1/2 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            投資の思考を、
            <br />
            <span
              className="animate-shimmer bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent"
            >
              ひとつに。
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            散らばる銘柄情報・メモ・戦略・スケジュール。
            <br className="hidden md:block" />
            カブノオトなら、すべてを一つのダッシュボードで整理できます。
            <br className="hidden md:block" />
            <span className="text-gray-400">毎日の投資習慣が、レベルアップの楽しさに変わります。</span>
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/login"
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
            >
              無料で始める
            </Link>
            <p className="text-sm text-gray-500">
              Google アカウントで30秒で登録 &mdash; クレジットカード不要
            </p>
          </div>

          {/* Dashboard mock */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="animate-hero-glow rounded-2xl bg-gray-800/80 border border-gray-700/50 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-gray-500">カブノオト ダッシュボード</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '登録銘柄', value: '12', color: 'text-blue-400' },
                  { label: '投資メモ', value: '48', color: 'text-cyan-400' },
                  { label: 'アラート', value: '3', color: 'text-amber-400' },
                  { label: 'イベント', value: '7', color: 'text-pink-400' },
                  { label: '投資家Lv', value: '12', color: 'text-violet-400' },
                  { label: 'ストリーク', value: '7日', color: 'text-orange-400' },
                  { label: '称号', value: '8/28', color: 'text-fuchsia-400' },
                  { label: '配当予定', value: '5', color: 'text-green-400' },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-900/60 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
