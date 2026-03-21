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
            <li><a href="#daily" className="hover:text-blue-300">デイリー機能</a></li>
            <li><a href="#gamification" className="hover:text-blue-300">ゲーミフィケーション</a></li>
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
            <p className="mb-3">
              デイリーチェックリストや投資日記で毎日の投資ルーティンを習慣化し、
              ゲーミフィケーション機能（レベル・XP・称号）で継続的な投資学習をサポートします。
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
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
                <div>
                  <p className="text-white font-medium">毎日の投資ルーティンを設定</p>
                  <p className="text-gray-400 text-sm">デイリーチェックリストで投資ルーティンを定義し、投資日記で日々の振り返りを記録しましょう。継続するとXPが貯まり、投資家レベルが上がります。</p>
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
                  <p><span className="text-white">テンプレート:</span> ファンダメンタル・テクニカル・配当優待・銘柄調査・売買判断の5種類のテンプレートから選んでメモを作成できます。</p>
                  <p><span className="text-white">タグ:</span> 銘柄にカスタムタグ（8色）を付けて分類できます。</p>
                  <p><span className="text-white">グループ:</span> お気に入りグループを作成して銘柄をグループ分けできます。</p>
                  <p><span className="text-white">ニュース:</span> 銘柄ごとにニュース記事のURLとコメントを記録できます。</p>
                </div>
              </details>

              {/* 情報管理タブ */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  情報管理タブ
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p><span className="text-white">基本タブ:</span> 銘柄の基本情報と株ノオト（メモ）を管理します。</p>
                  <p><span className="text-white">投資戦略タブ:</span> 分析メモ・バリュエーション指標（PER/PBR）・「次の一手」（Next Action）を記録できます。</p>
                  <p><span className="text-white">管理タブ:</span> 保有ポジション・イベント・配当・株主優待の4つのサブタブで詳細情報を管理します。</p>
                  <p><span className="text-white">ニュースタブ:</span> 銘柄に関するニュース記事をURL＋コメントで構造化して記録・管理できます。</p>
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
                  <p className="text-white font-medium mb-1">ポートフォリオサマリー</p>
                  <p><span className="text-white">構成比グラフ:</span> 投資額割合・業種別・タグ別・配当金額割合・優待価値割合の5種類の円グラフで保有銘柄を可視化します。</p>
                  <p><span className="text-white">損益分析:</span> 保有銘柄の含み損益やポートフォリオ全体のパフォーマンスを確認できます。</p>
                  <p><span className="text-white">投資余力・現金管理:</span> 総資産に対する現金比率を可視化し、Next Actionメモを管理できます。</p>
                  <p className="text-white font-medium mb-1 mt-3">ポートフォリオ推移</p>
                  <p><span className="text-white">日次スナップショット:</span> 毎日のポートフォリオ状態を記録し、推移を追跡できます。</p>
                  <p><span className="text-white">推移グラフ:</span> 評価額推移・純資産推移・損益推移・個別株価推移の4種類のグラフで表示します。期間は1W〜2Yで切替可能です。</p>
                  <p><span className="text-white">チャートメモ:</span> グラフ上のデータポイントにメモを付与して、その時点の判断や分析を記録できます。</p>
                  <p className="text-white font-medium mb-1 mt-3">その他のダッシュボード</p>
                  <p><span className="text-white">戦略一覧:</span> 全銘柄の投資戦略を一覧表示し、統計情報を確認できます。</p>
                  <p><span className="text-white">ポジション一覧:</span> 保有銘柄の損益分析やNISA/特定口座ポジション別の税率管理ができます。</p>
                  <p><span className="text-white">配当・優待一覧:</span> 配当金シミュレーションや株主優待の情報をまとめて確認できます。</p>
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
                  <p><span className="text-white">決算カウントダウン:</span> 直近30日以内に決算発表を控える銘柄をカウントダウン表示します。7日以内の銘柄は特に強調されます。</p>
                  <p><span className="text-white">権利確定日カウントダウン:</span> 配当・優待の権利確定日までの残り日数を一覧で確認できます。</p>
                  <p><span className="text-white">月別配当カレンダー:</span> 12ヶ月の配当金額を棒グラフで表示し、税引後金額も確認できます。</p>
                  <p><span className="text-white">配当利回りランキング:</span> 保有銘柄の配当利回りを降順で比較できます。</p>
                  <p><span className="text-white">銘柄カード決算バッジ:</span> 決算日が14日以内の銘柄にはカード上にバッジが表示されます。</p>
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

          {/* デイリー機能 */}
          <section id="daily">
            <h2 className="text-xl font-semibold text-white mb-4">デイリー機能</h2>
            <div className="space-y-3">
              {/* デイリーチェックリスト */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  デイリーチェックリスト
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>毎日の投資ルーティンをチェックリストとして管理できます。毎日自動でリセットされます。</p>
                  <p><span className="text-white">プリセット:</span> 初回利用時に「経済ニュースチェック」「保有銘柄の値動き確認」など5項目のプリセットが自動設定されます。</p>
                  <p><span className="text-white">カスタマイズ:</span> 編集モードで項目の追加・削除・名前変更ができます。ドラッグ＆ドロップで順序も変更可能です（最大25項目）。</p>
                  <p><span className="text-white">XP獲得:</span> すべての項目を完了するとXP（経験値）を獲得できます。</p>
                </div>
              </details>

              {/* 投資日記 */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  投資日記
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>1日1記録の投資日記です。4つのセクションで日々の投資活動を振り返れます。</p>
                  <p><span className="text-white">マーケット概況:</span> その日のマーケット全体の動向を記録します。</p>
                  <p><span className="text-white">気になったニュース:</span> ニュース記事のURLとコメントを構造化して記録できます（最大20件）。</p>
                  <p><span className="text-white">今日の振り返り:</span> 自分の投資判断や気づきを振り返ります。</p>
                  <p><span className="text-white">明日の注目ポイント:</span> 翌日に注目したいポイントを記録します。</p>
                  <p><span className="text-white">自動保存:</span> 入力内容は自動的に保存されます。日付ナビゲーションで過去の記録も閲覧できます。</p>
                  <p><span className="text-white">XP獲得:</span> 日記を保存するとXP（経験値）を獲得できます。</p>
                </div>
              </details>

              {/* ニュース一覧 */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  ニュース一覧
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>投資日記や銘柄カードに記録したニュースを横断して一覧表示できます。</p>
                  <p><span className="text-white">フィルター:</span> 「すべて」「日記」「銘柄」のタブで表示元を切り替えられます。</p>
                  <p><span className="text-white">表示情報:</span> ドメイン名・コメント・登録日・関連銘柄が表示されます。</p>
                </div>
              </details>

              {/* 投資格言 */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  今日の投資格言
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>ダッシュボード上部に日替わりで投資格言が表示されます（全100件）。</p>
                  <p>著名な投資家の格言から日々のモチベーションを得られます。</p>
                </div>
              </details>
            </div>
          </section>

          {/* ゲーミフィケーション */}
          <section id="gamification">
            <h2 className="text-xl font-semibold text-white mb-4">ゲーミフィケーション</h2>
            <div className="space-y-3">
              {/* 投資家レベル */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  投資家レベル・XP
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>カブノオトを使い続けることで経験値（XP）が貯まり、投資家レベルが上がります。</p>
                  <p><span className="text-white">レベル:</span> Lv.1「見習い投資家」からLv.20「投資の神」まで20段階のレベルがあります。</p>
                  <p><span className="text-white">XP獲得:</span> ログイン・銘柄追加・メモ保存・株価更新・ポジション追加・イベント登録・配当登録・優待登録・チェックリスト全完了・日記保存など14種類のアクションでXPを獲得できます。</p>
                  <p><span className="text-white">デイリー上限:</span> 1日に獲得できるXPは最大100XPです。</p>
                  <p><span className="text-white">レベルアップ演出:</span> レベルが上がると画面全体にレベルアップ演出が表示されます。</p>
                </div>
              </details>

              {/* ストリーク */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  連続ログインストリーク
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>毎日ログインすると連続日数（ストリーク）がカウントされます。</p>
                  <p><span className="text-white">営業日ベース:</span> 土日祝日を除いた営業日ベースでカウントされるため、休日にログインしなくてもストリークは途切れません。</p>
                  <p><span className="text-white">ストリークボーナス:</span> 7日連続で+20%、30日連続で+50%のXPボーナスが得られます。</p>
                </div>
              </details>

              {/* 称号 */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  称号コレクション
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>特定の条件を達成すると称号を獲得できます。全28種類の称号をコレクションしましょう。</p>
                  <p><span className="text-white">6カテゴリ:</span> 銘柄・記録・資産・戦略・継続・貢献の6カテゴリに分かれています。</p>
                  <p><span className="text-white">4段階レアリティ:</span> コモン・レア・エピック・レジェンダリーの4段階があります。レアリティが高いほど獲得条件が難しくなります。</p>
                  <p><span className="text-white">自動解放:</span> 条件を達成すると自動的に称号が解放され、トースト通知でお知らせします。</p>
                </div>
              </details>
            </div>
          </section>

          {/* その他の機能 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">その他の機能</h2>
            <div className="space-y-3">
              {/* サウンド */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  サウンドフィードバック
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>操作に応じた効果音でフィードバックを得られます。</p>
                  <p><span className="text-white">設定:</span> メニューの「設定・管理」からON/OFFの切替と音量調整ができます。</p>
                </div>
              </details>

              {/* 外部リンク */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  外部リンクカスタマイズ
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>ダッシュボード上部に表示される外部リンク（証券会社・ニュースサイト等）を自由にカスタマイズできます。</p>
                </div>
              </details>

              {/* 目安箱 */}
              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white font-medium hover:bg-gray-750">
                  目安箱（フィードバック）
                </summary>
                <div className="px-4 pb-4 text-gray-300 space-y-2">
                  <p>機能要望・改善提案・バグ報告などをメニューの「目安箱」から送信できます。</p>
                  <p>カテゴリ（機能要望・改善提案・バグ報告・その他）を選んでメッセージを送信してください。</p>
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
                <p className="px-4 pb-4 text-gray-300">株価は手動で入力・更新できます。また、メニューの「株価一括更新」から前日終値を一括取得することも可能です。リアルタイムの自動更新には対応していません。</p>
              </details>

              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white hover:bg-gray-750">
                  レベルやXPはどうやって上げますか？
                </summary>
                <p className="px-4 pb-4 text-gray-300">ログイン・銘柄追加・メモ保存・株価更新・チェックリスト完了・投資日記の保存など、日々の操作でXPを獲得できます。1日の上限は100XPです。XPが一定量貯まるとレベルが上がります。</p>
              </details>

              <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer text-white hover:bg-gray-750">
                  投資日記は何日分記録できますか？
                </summary>
                <p className="px-4 pb-4 text-gray-300">制限なく過去の日付を遡って記録・閲覧できます。日付ナビゲーションで前日・翌日に移動したり、「今日」ボタンで当日に戻ることができます。</p>
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
              <p><span className="text-white">バージョン:</span> 1.5.0</p>
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
