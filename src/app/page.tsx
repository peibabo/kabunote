import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'カブノオト - 投資家の思考を整理するダッシュボード',
  description: '日本株の投資情報と投資メモを一元管理。銘柄管理・分析・ポートフォリオ・カレンダーで、思考の整理から賢い投資判断を。',
}

const features = [
  {
    icon: '📝',
    title: '銘柄管理 & 投資メモ',
    description: '気になる銘柄をカードで管理。投資メモやタグ付けで思考を整理。会社名・ローマ字検索にも対応。',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '📊',
    title: 'ポートフォリオ分析',
    description: '保有ポジション・損益・構成比率を可視化。4種の円グラフとネオンライトで直感的に把握。',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: '📅',
    title: '投資カレンダー & アラート',
    description: '決算日・権利確定日・配当をカレンダーで一覧管理。6段階アラートで重要イベントを見逃さない。',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: '🎯',
    title: '戦略 & ダッシュボード',
    description: '銘柄ごとの投資戦略・次の一手を記録。戦略一覧ダッシュボードで全体を俯瞰。',
    gradient: 'from-orange-500 to-red-500',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* ナビバー */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/kabunote-logo.png"
                alt="カブノオト"
                className="h-10 md:h-12 w-auto"
                style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))' }}
              />
            </div>
            <Link
              href="/login"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              ログイン
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              投資家の思考を、
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                整理する。
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">
              銘柄管理・メモ・分析・スケジュールを一つのダッシュボードに。
              <br className="hidden md:block" />
              投資判断に必要な情報を、あなたの手元に。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                無料で始める
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Google アカウントまたはメールアドレスで簡単登録
            </p>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              主な機能
            </h2>
            <p className="text-gray-400 text-lg">
              投資家に必要な機能をオールインワンで
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8 hover:border-gray-600 transition-all hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl mb-5`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-800/50 rounded-2xl p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              投資の思考整理を始めよう
            </h2>
            <p className="text-gray-300 mb-8">
              完全無料。アカウント登録だけですぐに使えます。
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/kabunote-logo.png"
                alt="カブノオト"
                className="h-8 w-auto opacity-60"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-gray-300 transition-colors">利用規約</Link>
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">プライバシーポリシー</Link>
              <Link href="/help" className="hover:text-gray-300 transition-colors">ヘルプ</Link>
            </div>
            <p className="text-sm text-gray-600">
              &copy; 2025 カブノオト
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
