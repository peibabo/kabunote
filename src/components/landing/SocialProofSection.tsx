import ScrollAnimationWrapper from './ScrollAnimationWrapper'

const stats = [
  { value: '25+', label: '主要機能', color: 'text-blue-400' },
  { value: '28', label: '種の称号', color: 'text-violet-400' },
  { value: '100', label: '件の投資格言', color: 'text-amber-400' },
  { value: '¥0', label: 'すべて無料', color: 'text-green-400' },
]

export default function SocialProofSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  )
}
