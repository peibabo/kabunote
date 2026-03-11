import type { Metadata } from 'next'
import LandingNavbar from '@/components/landing/LandingNavbar'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import SolutionSection from '@/components/landing/SolutionSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import DifferentiationSection from '@/components/landing/DifferentiationSection'
import FAQSection from '@/components/landing/FAQSection'
import FinalCTASection from '@/components/landing/FinalCTASection'
import LandingFooter from '@/components/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'カブノオト - 投資の思考を、ひとつに。',
  description: '散らばる銘柄情報・メモ・戦略・スケジュールを一つのダッシュボードで整理。日本株の投資思考を整理する無料Webアプリ。',
  keywords: ['株式投資', '投資管理', 'ポートフォリオ', '銘柄管理', '投資メモ', '配当管理', '株主優待', '投資カレンダー', 'カブノオト'],
  openGraph: {
    title: 'カブノオト - 投資の思考を、ひとつに。',
    description: '散らばる銘柄情報・メモ・戦略・スケジュールを一つのダッシュボードで整理。日本株の投資思考を整理する無料Webアプリ。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'カブノオト',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'カブノオト - 投資の思考を、ひとつに。',
    description: '散らばる銘柄情報・メモ・戦略・スケジュールを一つのダッシュボードで整理。',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DifferentiationSection />
      <FAQSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  )
}
