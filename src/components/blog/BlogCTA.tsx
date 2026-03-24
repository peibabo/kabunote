import Link from 'next/link'

export default function BlogCTA() {
  return (
    <section className="mt-12 p-8 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 text-center">
      <h2 className="text-xl font-bold text-white mb-3">
        投資の思考を、ひとつに。
      </h2>
      <p className="text-gray-300 mb-6 text-sm max-w-lg mx-auto">
        カブノオトなら銘柄情報・メモ・戦略・配当・スケジュールを
        ひとつのダッシュボードで管理できます。無料で今すぐ始めましょう。
      </p>
      <Link
        href="/login"
        className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hover:scale-105"
      >
        無料で始める
      </Link>
    </section>
  )
}
