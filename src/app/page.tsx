import type { Metadata } from 'next'
import LandingNavbar from '@/components/landing/LandingNavbar'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import SolutionSection from '@/components/landing/SolutionSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import DailyEngagementSection from '@/components/landing/DailyEngagementSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import SocialProofSection from '@/components/landing/SocialProofSection'
import DifferentiationSection from '@/components/landing/DifferentiationSection'
import FAQSection from '@/components/landing/FAQSection'
import FinalCTASection from '@/components/landing/FinalCTASection'
import LandingFooter from '@/components/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'カブノオト - 投資の思考を、ひとつに。',
  description: '散らばる銘柄情報・メモ・戦略・スケジュールを一つのダッシュボードで整理。投資家レベル・称号コレクション・投資日記で毎日の投資習慣が楽しくなる。日本株の投資思考を整理する無料Webアプリ。',
  keywords: ['株式投資', '投資管理', 'ポートフォリオ', '銘柄管理', '投資メモ', '配当管理', '株主優待', '投資カレンダー', '投資日記', 'ゲーミフィケーション', 'カブノオト'],
  alternates: {
    canonical: 'https://kabunote.jp',
  },
  openGraph: {
    title: 'カブノオト - 投資の思考を、ひとつに。',
    description: '散らばる銘柄情報・メモ・戦略・スケジュールを一つのダッシュボードで整理。投資家レベル・称号コレクション・投資日記で毎日の投資習慣が楽しくなる。日本株の投資思考を整理する無料Webアプリ。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'カブノオト',
    url: 'https://kabunote.jp',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'カブノオト - 投資の思考を、ひとつに。',
    description: '散らばる銘柄情報・メモ・戦略・スケジュールを一つのダッシュボードで整理。投資家レベルで毎日の投資が楽しくなる無料Webアプリ。',
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'カブノオト',
    url: 'https://kabunote.jp',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: '散らばる銘柄情報・メモ・戦略・スケジュールを一つのダッシュボードで整理。日本株の投資思考を整理する無料Webアプリ。',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    featureList: '銘柄管理, 投資メモ, ポートフォリオ管理, 配当・優待管理, アラート, カレンダー, ゲーミフィケーション, 投資日記',
    inLanguage: 'ja',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '本当に無料ですか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'はい、カブノオトはすべての機能を完全無料でお使いいただけます。今後も基本機能は無料で提供を続けます。',
        },
      },
      {
        '@type': 'Question',
        name: 'どのデバイスで使えますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PC・スマートフォン・タブレット、どのデバイスからでもお使いいただけます。Webブラウザがあれば、アプリのインストールは不要です。',
        },
      },
      {
        '@type': 'Question',
        name: '投資助言サービスですか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'いいえ、カブノオトは投資助言サービスではありません。投資に関する思考や情報を整理するためのツールです。投資判断はご自身の責任でお願いいたします。',
        },
      },
      {
        '@type': 'Question',
        name: 'データは安全に保管されますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'はい、データはSupabase（AWS）のクラウドサーバーに暗号化して保存されます。お客様以外からのアクセスは行レベルセキュリティ（RLS）で保護されています。',
        },
      },
      {
        '@type': 'Question',
        name: '登録に必要なものは何ですか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Googleアカウント、またはメールアドレスだけで登録できます。クレジットカードや個人情報の入力は不要です。',
        },
      },
      {
        '@type': 'Question',
        name: 'ゲーミフィケーションとは何ですか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'カブノオトでは、メモ作成や日記記入などの投資活動がXP（経験値）になり、投資家レベルが上がっていきます。28種の称号コレクションや連続ストリークなど、毎日のモチベーション維持を支援する仕組みです。',
        },
      },
      {
        '@type': 'Question',
        name: '投資日記は必須ですか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'いいえ、すべての機能は任意でお使いいただけます。ただし、日記を書くとXPが獲得でき、振り返りの習慣が投資スキル向上につながります。',
        },
      },
    ],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <DailyEngagementSection />
      <HowItWorksSection />
      <SocialProofSection />
      <DifferentiationSection />
      <FAQSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  )
}
