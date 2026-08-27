'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface HelpItem {
  id: string
  title: string
  keywords: string
  content: React.ReactNode
  type: 'details' | 'faq'
}

interface HelpSection {
  id: string
  title: string
  items: HelpItem[]
  /** セクション自体の固定コンテンツ（検索対象外の概要文など） */
  intro?: React.ReactNode
}

const SECTIONS: HelpSection[] = [
  {
    id: 'features',
    title: '主要機能ガイド',
    items: [
      {
        id: 'stock-management',
        title: '銘柄管理',
        type: 'details',
        keywords: '銘柄 追加 削除 並べ替え ドラッグ ドロップ メモ テンプレート タグ グループ ニュース 検索 株ノオト お気に入り',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p><span className="text-white">銘柄の追加:</span> 画面右下の「＋」ボタンから会社名・銘柄コード・ローマ字で検索して追加できます。</p>
            <p><span className="text-white">銘柄の削除:</span> 銘柄カードの「×」ボタンで削除できます。</p>
            <p><span className="text-white">並べ替え:</span> 銘柄カードをドラッグ＆ドロップで自由に並べ替えられます。</p>
            <p><span className="text-white">メモ:</span> 銘柄カードの「株ノオト」エリアに自由にメモを記録できます。自動保存されます。</p>
            <p><span className="text-white">テンプレート:</span> ファンダメンタル・テクニカル・配当優待・銘柄調査・売買判断の5種類のテンプレートから選んでメモを作成できます。</p>
            <p><span className="text-white">タグ:</span> 銘柄にカスタムタグ（8色）を付けて分類できます。</p>
            <p><span className="text-white">グループ:</span> お気に入りグループを作成して銘柄をグループ分けできます。</p>
            <p><span className="text-white">ニュースクリップ:</span> 銘柄ごとにニュース記事のURLとコメントを記録できます。</p>
          </div>
        ),
      },
      {
        id: 'info-tabs',
        title: '情報管理タブ',
        type: 'details',
        keywords: '基本 投資戦略 PER PBR バリュエーション 次の一手 Next Action 管理 ポジション イベント 配当 優待 ニュース タブ',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p><span className="text-white">基本タブ:</span> 銘柄の基本情報と株ノオト（メモ）を管理します。</p>
            <p><span className="text-white">投資戦略タブ:</span> 分析メモ・バリュエーション指標（PER/PBR）・「次の一手」（Next Action）を記録できます。</p>
            <p><span className="text-white">管理タブ:</span> 保有ポジション・イベント・配当・株主優待の4つのサブタブで詳細情報を管理します。</p>
            <p><span className="text-white">ニュースクリップ:</span> 銘柄に関するニュース記事をURL＋コメントで構造化して記録・管理できます。</p>
          </div>
        ),
      },
      {
        id: 'alerts',
        title: '価格アラート',
        type: 'details',
        keywords: 'アラート 価格 目標 通知 スヌーズ 株価',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>現在の株価と設定した目標価格を比較し、6段階のアラートで通知します。</p>
            <p><span className="text-white">アラート一覧:</span> メニューからすべてのアラートを一覧表示できます。</p>
            <p><span className="text-white">スヌーズ:</span> 不要なアラートは6段階のスヌーズ期間を設定して一時的に非表示にできます。</p>
          </div>
        ),
      },
      {
        id: 'dashboard',
        title: '分析ダッシュボード',
        type: 'details',
        keywords: 'ポートフォリオ サマリー 円グラフ 損益 構成比 投資額 業種 タグ 配当 優待 推移 スナップショット チャートメモ 戦略 ポジション NISA 税率 現金 投資余力',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p className="text-white font-medium mb-1">ポートフォリオサマリー</p>
            <p><span className="text-white">構成比グラフ:</span> 投資額割合・業種別・タグ別・配当金額割合・優待価値割合の5種類の円グラフで保有銘柄を可視化します。</p>
            <p><span className="text-white">損益分析:</span> 保有銘柄の含み損益やポートフォリオ全体のパフォーマンスを確認できます。</p>
            <p><span className="text-white">投資余力・現金管理:</span> 総資産に対する現金比率を可視化し、Next Actionメモを管理できます。</p>
            <p className="text-white font-medium mb-1 mt-3">ポートフォリオ推移</p>
            <p><span className="text-white">日次スナップショット:</span> 毎日のポートフォリオ状態を記録し、推移を追跡できます。</p>
            <p><span className="text-white">推移グラフ:</span> 評価額推移・純資産推移・損益推移・値上がり率推移の4種類のグラフで表示します。値上がり率は表示期間の起点を0%とした各銘柄の騰落率です。期間は1W〜2Yで切替可能です。</p>
            <p><span className="text-white">チャートメモ:</span> グラフ上のデータポイントにメモを付与して、その時点の判断や分析を記録できます。</p>
            <p className="text-white font-medium mb-1 mt-3">その他のダッシュボード</p>
            <p><span className="text-white">戦略一覧:</span> 全銘柄の投資戦略を一覧表示し、統計情報を確認できます。</p>
            <p><span className="text-white">ポジション一覧:</span> 保有銘柄の損益分析やNISA/特定口座ポジション別の税率管理ができます。</p>
            <p><span className="text-white">配当・優待一覧:</span> 配当金シミュレーションや株主優待の情報をまとめて確認できます。</p>
          </div>
        ),
      },
      {
        id: 'calendar',
        title: 'カレンダー・イベント',
        type: 'details',
        keywords: 'カレンダー イベント 決算 権利確定 配当 支払 タイムライン カウントダウン バッジ 利回り ランキング',
        content: (
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
        ),
      },
      {
        id: 'search',
        title: '全体検索',
        type: 'details',
        keywords: '検索 銘柄コード 会社名 業種 メモ タグ AND 絞り込み',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>画面上部の検索バーから、銘柄コード・会社名・業種・メモ・タグを横断してAND検索できます。</p>
            <p>スペース区切りで複数キーワードを入力すると、すべてに一致する銘柄を絞り込みます。</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'daily',
    title: 'デイリー機能',
    items: [
      {
        id: 'checklist',
        title: 'デイリーチェックリスト',
        type: 'details',
        keywords: 'チェックリスト ルーティン 毎日 リセット プリセット 編集 ドラッグ ドロップ XP 経験値 完了',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>毎日の投資ルーティンをチェックリストとして管理できます。毎日自動でリセットされます。</p>
            <p><span className="text-white">プリセット:</span> 初回利用時に「経済ニュースチェック」「保有銘柄の値動き確認」など5項目のプリセットが自動設定されます。</p>
            <p><span className="text-white">カスタマイズ:</span> 編集モードで項目の追加・削除・名前変更ができます。ドラッグ＆ドロップで順序も変更可能です（最大25項目）。</p>
            <p><span className="text-white">XP獲得:</span> すべての項目を完了するとXP（経験値）を獲得できます。</p>
          </div>
        ),
      },
      {
        id: 'diary',
        title: '投資日記',
        type: 'details',
        keywords: '日記 マーケット 概況 ニュース 振り返り 注目 自動保存 日付 XP 経験値',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>1日1記録の投資日記です。4つのセクションで日々の投資活動を振り返れます。</p>
            <p><span className="text-white">マーケット概況:</span> その日のマーケット全体の動向を記録します。</p>
            <p><span className="text-white">気になったニュース:</span> ニュース記事のURLとコメントを構造化して記録できます（最大20件）。</p>
            <p><span className="text-white">今日の振り返り:</span> 自分の投資判断や気づきを振り返ります。</p>
            <p><span className="text-white">明日の注目ポイント:</span> 翌日に注目したいポイントを記録します。</p>
            <p><span className="text-white">自動保存:</span> 入力内容は自動的に保存されます。日付ナビゲーションで過去の記録も閲覧できます。</p>
            <p><span className="text-white">XP獲得:</span> 日記を保存するとXP（経験値）を獲得できます。</p>
          </div>
        ),
      },
      {
        id: 'news-list',
        title: 'ニュース一覧',
        type: 'details',
        keywords: 'ニュース 一覧 フィルター 日記 銘柄 ドメイン URL',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>投資日記や銘柄カードに記録したニュースを横断して一覧表示できます。</p>
            <p><span className="text-white">フィルター:</span> 「すべて」「日記」「銘柄」のタブで表示元を切り替えられます。</p>
            <p><span className="text-white">表示情報:</span> ドメイン名・コメント・登録日・関連銘柄が表示されます。</p>
          </div>
        ),
      },
      {
        id: 'quote',
        title: '今日の投資格言',
        type: 'details',
        keywords: '格言 投資家 モチベーション 日替わり',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>ダッシュボード上部に日替わりで投資格言が表示されます（全100件）。</p>
            <p>著名な投資家の格言から日々のモチベーションを得られます。</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'gamification',
    title: 'ゲーミフィケーション',
    items: [
      {
        id: 'level-xp',
        title: '投資家レベル・XP',
        type: 'details',
        keywords: 'レベル XP 経験値 投資家 見習い ログイン 銘柄追加 メモ保存 株価更新 レベルアップ 演出',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>カブノオトを使い続けることで経験値（XP）が貯まり、投資家レベルが上がります。</p>
            <p><span className="text-white">レベル:</span> Lv.1「見習い投資家」からLv.20「投資の神」まで20段階のレベルがあります。</p>
            <p><span className="text-white">XP獲得:</span> ログイン・銘柄追加・メモ保存・株価更新・ポジション追加・イベント登録・配当登録・優待登録・チェックリスト全完了・日記保存など14種類のアクションでXPを獲得できます。</p>
            <p><span className="text-white">デイリー上限:</span> 1日に獲得できるXPは最大100XPです。</p>
            <p><span className="text-white">レベルアップ演出:</span> レベルが上がると画面全体にレベルアップ演出が表示されます。</p>
          </div>
        ),
      },
      {
        id: 'streak',
        title: '連続ログインストリーク',
        type: 'details',
        keywords: 'ストリーク 連続 ログイン 営業日 土日 祝日 ボーナス XP',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>毎日ログインすると連続日数（ストリーク）がカウントされます。</p>
            <p><span className="text-white">営業日ベース:</span> 土日祝日を除いた営業日ベースでカウントされるため、休日にログインしなくてもストリークは途切れません。</p>
            <p><span className="text-white">ストリークボーナス:</span> 7日連続で+20%、30日連続で+50%のXPボーナスが得られます。</p>
          </div>
        ),
      },
      {
        id: 'titles',
        title: '称号コレクション',
        type: 'details',
        keywords: '称号 コレクション カテゴリ レアリティ コモン レア エピック レジェンダリー 獲得 条件 トースト',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>特定の条件を達成すると称号を獲得できます。全28種類の称号をコレクションしましょう。</p>
            <p><span className="text-white">6カテゴリ:</span> 銘柄・記録・資産・戦略・継続・貢献の6カテゴリに分かれています。</p>
            <p><span className="text-white">4段階レアリティ:</span> コモン・レア・エピック・レジェンダリーの4段階があります。レアリティが高いほど獲得条件が難しくなります。</p>
            <p><span className="text-white">自動解放:</span> 条件を達成すると自動的に称号が解放され、トースト通知でお知らせします。</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'others',
    title: 'その他の機能',
    items: [
      {
        id: 'sound',
        title: 'サウンドフィードバック',
        type: 'details',
        keywords: 'サウンド 音 効果音 ON OFF 音量 設定',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>操作に応じた効果音でフィードバックを得られます。</p>
            <p><span className="text-white">設定:</span> メニューの「設定・管理」からON/OFFの切替と音量調整ができます。</p>
          </div>
        ),
      },
      {
        id: 'external-links',
        title: '外部リンクカスタマイズ',
        type: 'details',
        keywords: '外部リンク 証券会社 ニュースサイト カスタマイズ',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>ダッシュボード上部に表示される外部リンク（証券会社・ニュースサイト等）を自由にカスタマイズできます。</p>
          </div>
        ),
      },
      {
        id: 'feedback-box',
        title: '目安箱（フィードバック）',
        type: 'details',
        keywords: '目安箱 フィードバック 機能要望 改善 バグ 報告',
        content: (
          <div className="px-4 pb-4 text-gray-300 space-y-2">
            <p>機能要望・改善提案・バグ報告などをメニューの「目安箱」から送信できます。</p>
            <p>カテゴリ（機能要望・改善提案・バグ報告・その他）を選んでメッセージを送信してください。</p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'faq',
    title: 'よくある質問（FAQ）',
    items: [
      {
        id: 'faq-max-stocks',
        title: '銘柄は最大いくつまで登録できますか？',
        type: 'faq',
        keywords: '銘柄 最大 上限 登録 20',
        content: <p className="px-4 pb-4 text-gray-300">最大20銘柄まで登録できます。</p>,
      },
      {
        id: 'faq-data-storage',
        title: 'データはどこに保存されますか？',
        type: 'faq',
        keywords: 'データ 保存 クラウド データベース デバイス',
        content: <p className="px-4 pb-4 text-gray-300">すべてのデータはクラウド上のデータベースに安全に保存されます。ログインすればどのデバイスからでもアクセスできます。</p>,
      },
      {
        id: 'faq-stock-price',
        title: '株価は自動で更新されますか？',
        type: 'faq',
        keywords: '株価 自動 更新 手動 一括 前日終値',
        content: <p className="px-4 pb-4 text-gray-300">株価は手動で入力・更新できます。また、メニューの「株価一括更新」から前日終値を一括取得することも可能です。リアルタイムの自動更新には対応していません。</p>,
      },
      {
        id: 'faq-level-xp',
        title: 'レベルやXPはどうやって上げますか？',
        type: 'faq',
        keywords: 'レベル XP 経験値 上げる 獲得 上限 100',
        content: <p className="px-4 pb-4 text-gray-300">ログイン・銘柄追加・メモ保存・株価更新・チェックリスト完了・投資日記の保存など、日々の操作でXPを獲得できます。1日の上限は100XPです。XPが一定量貯まるとレベルが上がります。</p>,
      },
      {
        id: 'faq-diary-limit',
        title: '投資日記は何日分記録できますか？',
        type: 'faq',
        keywords: '投資日記 日数 制限 過去 日付 ナビゲーション',
        content: <p className="px-4 pb-4 text-gray-300">制限なく過去の日付を遡って記録・閲覧できます。日付ナビゲーションで前日・翌日に移動したり、「今日」ボタンで当日に戻ることができます。</p>,
      },
      {
        id: 'faq-delete-account',
        title: 'アカウントを削除するとどうなりますか？',
        type: 'faq',
        keywords: 'アカウント 削除 データ 復元 設定',
        content: <p className="px-4 pb-4 text-gray-300">アカウントを削除すると、登録した銘柄・メモ・設定などすべてのデータが完全に削除され、復元できません。メニューの「設定・管理」→「アカウント削除」から実行できます。</p>,
      },
      {
        id: 'faq-mobile',
        title: 'スマートフォンでも使えますか？',
        type: 'faq',
        keywords: 'スマートフォン モバイル タブレット レスポンシブ',
        content: <p className="px-4 pb-4 text-gray-300">はい、モバイルブラウザに対応しています。レスポンシブデザインにより、スマートフォンやタブレットでも快適にご利用いただけます。</p>,
      },
      {
        id: 'faq-pricing',
        title: '利用料金はかかりますか？',
        type: 'faq',
        keywords: '料金 無料 費用',
        content: <p className="px-4 pb-4 text-gray-300">現在、カブノオトは無料でご利用いただけます。</p>,
      },
    ],
  },
]

function matchesQuery(item: HelpItem, query: string): boolean {
  const target = `${item.title} ${item.keywords}`.toLowerCase()
  return query.split(/\s+/).every(word => target.includes(word))
}

export default function HelpContent() {
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()
  const isSearching = normalizedQuery.length > 0

  const filteredSections = useMemo(() => {
    if (!isSearching) return SECTIONS
    return SECTIONS
      .map(section => ({
        ...section,
        items: section.items.filter(item => matchesQuery(item, normalizedQuery)),
      }))
      .filter(section => section.items.length > 0)
  }, [normalizedQuery, isSearching])

  const matchCount = isSearching
    ? filteredSections.reduce((sum, s) => sum + s.items.length, 0)
    : 0

  return (
    <>
      <Link
        href="/dashboard"
        className="text-blue-400 hover:text-blue-300 text-sm mb-8 inline-block"
      >
        ← ホームに戻る
      </Link>

      <h1 className="text-3xl font-bold text-white mb-8">ヘルプ</h1>

      {/* 検索バー */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ヘルプ内を検索..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>
        {isSearching && (
          <p className="text-gray-500 text-sm mt-2">
            {matchCount > 0 ? `${matchCount}件の項目が見つかりました` : '該当する項目が見つかりませんでした'}
          </p>
        )}
      </div>

      {/* 目次（検索中は非表示） */}
      {!isSearching && (
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
      )}

      <div className="space-y-10 leading-relaxed">
        {/* カブノオトとは（検索中は非表示） */}
        {!isSearching && (
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
        )}

        {/* はじめかた（検索中は非表示） */}
        {!isSearching && (
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
        )}

        {/* 検索可能セクション */}
        {filteredSections.map(section => (
          <section key={section.id} id={section.id}>
            <h2 className="text-xl font-semibold text-white mb-4">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map(item => (
                <details key={item.id} className="bg-gray-800 rounded-lg" open={isSearching}>
                  <summary className={`p-4 cursor-pointer text-white ${item.type === 'details' ? 'font-medium' : ''} hover:bg-gray-750`}>
                    {item.title}
                  </summary>
                  {item.content}
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* About（検索中は非表示） */}
        {!isSearching && (
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
        )}
      </div>

      <Link
        href="/dashboard"
        className="text-blue-400 hover:text-blue-300 text-sm mt-8 inline-block"
      >
        ← ホームに戻る
      </Link>
    </>
  )
}
