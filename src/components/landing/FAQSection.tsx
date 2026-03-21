'use client'

import { useState } from 'react'
import ScrollAnimationWrapper from './ScrollAnimationWrapper'

const faqs = [
  {
    question: '本当に無料ですか？',
    answer: 'はい、カブノオトはすべての機能を完全無料でお使いいただけます。今後も基本機能は無料で提供を続けます。',
  },
  {
    question: 'どのデバイスで使えますか？',
    answer: 'PC・スマートフォン・タブレット、どのデバイスからでもお使いいただけます。Webブラウザがあれば、アプリのインストールは不要です。',
  },
  {
    question: '投資助言サービスですか？',
    answer: 'いいえ、カブノオトは投資助言サービスではありません。投資に関する思考や情報を整理するためのツールです。投資判断はご自身の責任でお願いいたします。',
  },
  {
    question: 'データは安全に保管されますか？',
    answer: 'はい、データはSupabase（AWS）のクラウドサーバーに暗号化して保存されます。お客様以外からのアクセスは行レベルセキュリティ（RLS）で保護されています。',
  },
  {
    question: '登録に必要なものは何ですか？',
    answer: 'Googleアカウント、またはメールアドレスだけで登録できます。クレジットカードや個人情報の入力は不要です。',
  },
  {
    question: 'ゲーミフィケーションとは何ですか？',
    answer: 'カブノオトでは、メモ作成や日記記入などの投資活動がXP（経験値）になり、投資家レベルが上がっていきます。28種の称号コレクションや連続ストリークなど、毎日のモチベーション維持を支援する仕組みです。',
  },
  {
    question: '投資日記は必須ですか？',
    answer: 'いいえ、すべての機能は任意でお使いいただけます。ただし、日記を書くとXPが獲得でき、振り返りの習慣が投資スキル向上につながります。',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 md:py-28 bg-gradient-to-b from-transparent via-gray-800/20 to-transparent">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            よくある質問
          </h2>
        </ScrollAnimationWrapper>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <ScrollAnimationWrapper key={faq.question} delay={i * 100}>
              <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-800/60 transition-colors"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: openIndex === i ? '200px' : '0px',
                    opacity: openIndex === i ? 1 : 0,
                  }}
                >
                  <p className="px-6 pb-5 text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
