import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ヘルプ | カブノオト',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-blue-400 hover:text-blue-300 text-sm mb-8 inline-block"
        >
          ← ホームに戻る
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">ヘルプ</h1>

        {/* 目次 */}
        <nav className="mb-10 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-3">目次</h2>
          <ul className="space-y-2 text-blue-400">
            <li><a href="#about" className="hover:text-blue-300">カブノオトとは</a></li>
            <li><a href="#getting-started" className="hover:text-blue-300">はじめかた</a></li>
            <li><a href="#features" className="hover:text-blue-300">主要機能ガイド</a></li>
            <li><a href="#faq" className="hover:text-blue-300">よくある質問（FAQ）</a></li>
            <li><a href="#version" className="hover:text-blue-300">About</a></li>
          </ul>
        </nav>

        <div className="space-y-10 leading-relaxed">
          {/* カブノオトとは */}
          <section id="about">
            <h2 className="text-xl font-semibold text-white mb-3">カブノオトとは</h2>
            <p className="mb-3">
              カブノオトは、投資家の思考を整理するためのWebアプリケーションです。
              銘柄ごとにメモ・分析・戦略・保有情報・イベントなどを一元管理し、
              投資判断をサポートします。
            </p>
            <p className="text-yellow-400 text-sm">
              ※ 本サービスは投資助言を行うものではありません。投資判断はご自身の責任で行ってください。
            </p>
          </section>

          {/* はじめかた */}
          <section id="getting-started">
            <h2 className="text-xl font-semibold text-white mb-3">はじめかた</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                <div>
                  <p className="text-white font-medium">ログイン</p>
                  <p className="text-gray-400 text-sm">GoogleアカウントまたはMagic Linkでログインします。</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                <div>
                  <p className="text-white font-medium">銘柄を追加</p>
                  <p className="text-gray-400 text-sm">画面右下の「＋」ボタンから、気になる銘柄を検索して追加します（最大20銘柄）。</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                <div>
                  <p className="text-white font-medium">情報を記録</p>
                  <p className="text-gray-400 text-sm">銘柄カードのタブを切り替えて、メモ・戦略・保有情報などを記録しましょう。</p>
                </div>
              </div>
            </div>
          </section>

          {/* 主要機能ガイド */}
          <section id="features">
            <h2 className="text-xl font-semibold text-white mb-4">主要機能ガイド</h2>
            <div className="space-y-3">
              {/* 銘柄管理 */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  銘柄管理
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p><span className="text-white">銘柄の追加:</span> 画面右下の「＋」ボタンから会社名・銘柄コード・ローマ字で検索して追加できます。</p>
                  <p><span className="text-white">銘柄の削除:</span> 銘柄カードの「×」ボタンで削除できます。</p>
                  <p><span className="text-white">並べ替え:</span> 銘柄カードをドラッグ＆ドロップで自由に並べ替えられます。</p>
                  <p><span className="text-white">メモ:</span> 銘柄カードの「株ノオト」エリアに自由にメモを記録できます。自動保存されます。</p>
                  <p><span className="text-white">タグ:</span> 銘柄にカスタムタグ（8色）を付けて分類できます。</p>
                  <p><span className="text-white">グループ:</span> お気に入りグループを作成して銘柄をグループ分けできます。</p>
                </div>
              </details>

              {/* 情報管理タブ */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  情報管理タブ
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p><span className="text-white">基本タブ:</span> 銘柄の基本情報と株ノオト（メモ）を管理します。</p>
                  <p><span className="text-white">投資戦略タブ:</span> 分析メモと「次の一手」（Next Action）を記録できます。</p>
                  <p><span className="text-white">管理タブ:</span> 保有ポジション・イベント・配当・株主優待の4つのサブタブで詳細情報を管理します。</p>
                </div>
              </details>

              {/* アラート */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  価格アラート
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>現在の株価と設定した目標価格を比較し、6段階のアラートで通知します。</p>
                  <p><span className="text-white">アラート一覧:</span> メニューからすべてのアラートを一覧表示できます。</p>
                  <p><span className="text-white">スヌーズ:</span> 不要なアラートは6段階のスヌーズ期間を設定して一時的に非表示にできます。</p>
                </div>
              </details>

              {/* 分析ダッシュボード */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  分析ダッシュボード
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p><span className="text-white">ポートフォリオ:</span> 保有銘柄の構成比・損益をグラフで可視化します。</p>
                  <p><span className="text-white">戦略一覧:</span> 全銘柄の投資戦略を一覧表示し、統計情報を確認できます。</p>
                  <p><span className="text-white">ポジション一覧:</span> 保有銘柄の損益分析やポートフォリオ構成を確認できます。</p>
                  <p><span className="text-white">配当・優待一覧:</span> 配当金シミュレーションや株主優待の情報をまとめて確認できます。</p>
                  <p><span className="text-white">投資余力・現金管理:</span> 総資産に対する現金比率を可視化し、Next Actionメモを管理できます。</p>
                </div>
              </details>

              {/* カレンダー・イベント */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  カレンダー・イベント
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>決算発表・権利確定日・配当支払日など6種類のイベントを管理できます。</p>
                  <p><span className="text-white">タイムライン:</span> 直近のイベントをタイムライン表示で確認できます。</p>
                  <p><span className="text-white">月間カレンダー:</span> イベントを月間カレンダーで一覧表示できます。</p>
                  <p><span className="text-white">カウントダウン:</span> 次のイベントまでの残り日数を表示します。</p>
                </div>
              </details>

              {/* 全体検索 */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  全体検索
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>画面上部の検索バーから、銘柄コード・会社名・業種・メモ・タグを横断してAND検索できます。</p>
                  <p>スペース区切りで複数キーワードを入力すると、すべてに一致する銘柄を絞り込みます。</p>
                </div>
              </details>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq">
            <h2 className="text-xl font-semibold text-white mb-4">よくある質問（FAQ）</h2>
            <div className="space-y-3">
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white hover:bg-gray-750">
                  銘柄は最大いくつまで登録できますか？
                </summary>
                <p className="px-4 pb-4 text-gray-300">最大20銘柄まで登録できます。</p>
              </details>

              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white hover:bg-gray-750">
                  データはどこに保存されますか？
                </summary>
                <p className="px-4 pb-4 text-gray-300">すべてのデータはクラウド上のデータベースに安全に保存されます。ログインすればどのデバイスからでもアクセスできます。</p>
              </details>

              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white hover:bg-gray-750">
                  株価は自動で更新されますか？
                </summary>
                <p className="px-4 pb-4 text-gray-300">現在、株価の自動更新機能はありません。株価は手動で入力・更新してください。</p>
              </details>

              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white hover:bg-gray-750">
                  アカウントを削除するとどうなりますか？
                </summary>
                <p className="px-4 pb-4 text-gray-300">アカウントを削除すると、登録した銘柄・メモ・設定などすべてのデータが完全に削除され、復元できません。メニューの「設定・管理」→「アカウント削除」から実行できます。</p>
              </details>

              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white hover:bg-gray-750">
                  スマートフォンでも使えますか？
                </summary>
                <p className="px-4 pb-4 text-gray-300">はい、モバイルブラウザに対応しています。レスポンシブデザインにより、スマートフォンやタブレットでも快適にご利用いただけます。</p>
              </details>

              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white hover:bg-gray-750">
                  利用料金はかかりますか？
                </summary>
                <p className="px-4 pb-4 text-gray-300">現在、カブノオトは無料でご利用いただけます。</p>
              </details>
            </div>
          </section>

          {/* About */}
          <section id="version">
            <h2 className="text-xl font-semibold text-white mb-3">About</h2>
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <p><span className="text-white">アプリ名:</span> カブノオト</p>
              <p><span className="text-white">バージョン:</span> 1.0.0</p>
              <div className="flex space-x-4 mt-3">
                <Link href="/terms" className="text-blue-400 hover:text-blue-300 text-sm">利用規約</Link>
                <Link href="/privacy" className="text-blue-400 hover:text-blue-300 text-sm">プライバシーポリシー</Link>
              </div>
            </div>
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
