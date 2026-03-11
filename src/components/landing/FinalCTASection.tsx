import Link from 'next/link'
import ScrollAnimationWrapper from './ScrollAnimationWrapper'

export default function FinalCTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper>
          <div className="relative max-w-3xl mx-auto">
            {/* Decorative neon lines */}
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

            <div className="bg-gradient-to-br from-blue-900/40 via-gray-800/40 to-cyan-900/40 border border-gray-700/40 rounded-2xl p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                投資の思考整理を、
                <br />
                今日から始めよう
              </h2>
              <p className="text-gray-300 mb-10 text-lg">
                完全無料。アカウント登録だけですぐに使えます。
              </p>
              <Link
                href="/login"
                className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
              >
                無料で始める
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                クレジットカード不要
              </p>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  )
}
