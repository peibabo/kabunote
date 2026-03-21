import ScrollAnimationWrapper from './ScrollAnimationWrapper'

const problems = [
  {
    icon: (
      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: '銘柄の情報がバラバラ',
    description: '証券会社のサイト、Excel、メモアプリ...投資情報があちこちに散らばって、必要な時にすぐ見つからない。',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    title: '投資判断の根拠を忘れる',
    description: 'なぜその銘柄を買ったのか、売り時の根拠は何だったか。時間が経つと思い出せなくなる。',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: '重要日程を見逃す',
    description: '決算発表日、配当の権利確定日、株主優待の期限...気づいた時にはもう遅い。',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
    title: '投資の習慣が続かない',
    description: '市場チェックや振り返りが大事だとわかっていても、忙しい日々の中で継続するのは難しい。',
  },
]

export default function ProblemSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            こんな悩み、ありませんか？
          </h2>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {problems.map((problem, i) => (
            <ScrollAnimationWrapper key={problem.title} delay={i * 150}>
              <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-8 text-center hover:border-gray-600/60 transition-all">
                <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-5">
                  {problem.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{problem.title}</h3>
                <p className="text-gray-400 leading-relaxed">{problem.description}</p>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
