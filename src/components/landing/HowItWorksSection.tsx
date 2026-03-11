import ScrollAnimationWrapper from './ScrollAnimationWrapper'

const steps = [
  {
    number: '1',
    title: 'アカウント登録',
    description: 'Googleアカウントまたはメールアドレスで、30秒で登録完了。',
    color: 'from-blue-500 to-blue-600',
  },
  {
    number: '2',
    title: '銘柄を追加',
    description: '会社名やコードで検索して、気になる銘柄をワンクリック追加。',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    number: '3',
    title: '思考を整理',
    description: 'メモ・分析・戦略・スケジュールを記録して、投資判断を研ぎ澄ます。',
    color: 'from-green-500 to-green-600',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-gradient-to-b from-transparent via-gray-800/20 to-transparent">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            3ステップで、今すぐ始められます
          </h2>
        </ScrollAnimationWrapper>

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-4">
            {steps.map((step, i) => (
              <ScrollAnimationWrapper
                key={step.number}
                delay={i * 200}
                className="flex-1 relative"
              >
                <div className="text-center">
                  {/* Number badge */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg`}>
                    {step.number}
                  </div>

                  {/* Connector line (hidden on mobile, hidden for last item) */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] border-t-2 border-dashed border-gray-700" />
                  )}

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
