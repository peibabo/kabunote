import type { Metadata } from 'next'
import HelpContent from '@/components/help/HelpContent'

export const metadata: Metadata = {
  title: 'ヘルプ',
  description: 'カブノオトの使い方ガイド。銘柄管理・投資メモ・ポートフォリオ・配当カレンダー・ゲーミフィケーションなど、各機能の詳しい使い方を解説。',
  alternates: {
    canonical: 'https://kabunote.jp/help',
  },
  openGraph: {
    title: 'ヘルプ | カブノオト',
    description: 'カブノオトの使い方ガイド。銘柄管理・投資メモ・ポートフォリオ・配当カレンダー・ゲーミフィケーションなど、各機能の詳しい使い方を解説。',
    url: 'https://kabunote.jp/help',
  },
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <HelpContent />
      </div>
    </div>
  )
}
