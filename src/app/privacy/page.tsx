import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  alternates: {
    canonical: 'https://kabunote.jp/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-blue-400 hover:text-blue-300 text-sm mb-8 inline-block"
        >
          ← ホームに戻る
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">プライバシーポリシー</h1>

        <div className="space-y-8 leading-relaxed">
          {/* 1. はじめに */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. はじめに</h2>
            <p>
              カブノオト（以下「本サービス」）は、ユーザーの個人情報の保護を重要と考え、
              個人情報の保護に関する法律（個人情報保護法）を遵守し、以下のとおりプライバシーポリシーを定めます。
            </p>
          </section>

          {/* 2. 運営者情報 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. 運営者情報</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>運営者名: カブノオト開発チーム</li>
              <li>連絡先: support@kabunote.jp</li>
            </ul>
          </section>

          {/* 3. 収集する個人情報 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. 収集する個人情報</h2>
            <p className="mb-3">本サービスでは、以下の個人情報を収集します。</p>

            <h3 className="text-lg font-medium text-gray-100 mb-2">3.1 認証情報</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>メールアドレス</li>
              <li>名前</li>
              <li>プロフィール画像URL</li>
              <li>認証方法（Google OAuth / Magic Link）</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-100 mb-2">3.2 投資関連データ</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>銘柄情報（銘柄コード・会社名等）</li>
              <li>メモ・投資戦略・分析内容</li>
              <li>保有ポジション情報（株数・取得単価等）</li>
              <li>配当・株主優待情報</li>
              <li>イベント・アラート設定</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-100 mb-2">3.3 Cookie・セッション情報</h3>
            <p className="mb-4">
              認証・セッション管理のため、Supabase Authによるセッション用Cookieを使用します。
            </p>

            <h3 className="text-lg font-medium text-gray-100 mb-2">3.4 ローカルストレージ</h3>
            <p>
              UI状態の保持のためにブラウザのlocalStorageを使用しますが、
              個人情報は含まれません。
            </p>
          </section>

          {/* 4. 利用目的 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. 利用目的</h2>
            <p className="mb-3">収集した個人情報は、以下の目的で利用します。</p>
            <ul className="list-disc list-inside space-y-1">
              <li>本サービスの提供・運営</li>
              <li>ユーザー認証・アカウント管理</li>
              <li>ユーザーが入力したデータの保存・表示</li>
              <li>本サービスの改善・機能開発</li>
            </ul>
          </section>

          {/* 5. 第三者提供 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. 第三者提供</h2>
            <p className="mb-3">
              本サービスは、法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。
            </p>
            <p className="mb-3">本サービスでは、以下の外部サービスを利用しています。</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <span className="text-white font-medium">Supabase</span> — データベース・認証基盤（データの保存・ユーザー認証）
              </li>
              <li>
                <span className="text-white font-medium">Google OAuth</span> — Googleアカウントによるログイン認証
              </li>
              <li>
                <span className="text-white font-medium">Google Fonts</span> — Webフォントの配信
              </li>
            </ul>
          </section>

          {/* 6. 安全管理措置 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. 安全管理措置</h2>
            <p className="mb-3">本サービスは、個人情報の安全管理のため、以下の措置を講じています。</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Row Level Security（RLS）によるデータベースレベルのアクセス制御</li>
              <li>PKCE（Proof Key for Code Exchange）による安全な認証フロー</li>
              <li>HTTPS暗号化通信による全データの保護</li>
            </ul>
          </section>

          {/* 7. Cookieの利用 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookieの利用</h2>
            <p>
              本サービスでは、セッション管理を目的としたCookieのみを使用しています。
              広告やトラッキング目的のCookieは使用していません。
            </p>
          </section>

          {/* 8. 個人情報の開示・訂正・削除 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. 個人情報の開示・訂正・削除</h2>
            <p className="mb-3">
              ユーザーは、本サービス内で自身が入力したデータの編集・削除を行うことができます。
            </p>
            <p>
              アカウントの削除は、メニュー「設定・管理」&gt;「アカウント削除」から行うことができます。
              アカウントを削除すると、全データが完全に削除され復元できません。
            </p>
          </section>

          {/* 9. ポリシーの変更 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. ポリシーの変更</h2>
            <p>
              本ポリシーの内容は、法令等の変更やサービス内容の変更に伴い、
              予告なく変更する場合があります。変更後のプライバシーポリシーは、
              本ページに掲載した時点で効力を生じるものとします。
            </p>
          </section>

          {/* 10. お問い合わせ窓口 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. お問い合わせ窓口</h2>
            <p>
              個人情報の取り扱いに関するお問い合わせは、下記までご連絡ください。
            </p>
            <p className="mt-2">連絡先: support@kabunote.jp</p>
          </section>

          {/* 制定日 */}
          <section className="pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">制定日: 2026年3月9日</p>
          </section>
        </div>

        <Link
          href="/dashboard"
          className="text-blue-400 hover:text-blue-300 text-sm mt-8 inline-block"
        >
          ← ホームに戻る
        </Link>
      </div>
    </div>
  )
}
