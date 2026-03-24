# カブノオト 集客戦略プラン

> 作成日: 2026-03-21
> ステータス: 計画段階

## 背景

カブノオトがローンチを完了し、プロダクトとしての基盤は整っている。しかし、ユーザーがいなければ意味がない。個人開発で広告予算ゼロという制約の中、効率的にユーザーを獲得する戦略が必要。

### 現状の集客基盤

**整備済み:**
- SEO基礎（robots.txt, sitemap, メタデータ, OGP設定）
- JSON-LD構造化データ（WebApplication, FAQPage, Organization）
- SNS共有ボタン（X・LINE対応、レベルアップ・称号獲得・ランディングページ）
- OGP画像設定（動的生成 + 全ページmetadata設定）
- Google Analytics 4（Cookie同意バナー付き）
- Sentry（エラー監視）
- 充実したランディングページ（11セクション構成）
- ヘルプページ（FAQ付き）
- 利用規約・プライバシーポリシー
- フィードバック目安箱（Slack通知可能）

**未整備:**
- リファラル機能なし
- ブログ・コンテンツページなし
- メール送信機能なし（ウェルカムメール等）
- PWA非対応

---

## 短期施策（1-2週間）— 技術的な集客基盤整備

### S1. OGP画像の作成と設定 ✅完了
- `src/app/opengraph-image.tsx` で動的OGP画像生成（1200x630px、ロゴ+タイトル+説明）
- `src/app/layout.tsx` に `openGraph.images` / `twitter` をデフォルト設定（全ページ継承）
- `src/app/page.tsx`, `/help`, `/privacy`, `/terms` に個別の `openGraph` 設定
- **効果:** SNS共有時のCTR 2-3倍向上。全てのSNS施策の前提条件

### S2. JSON-LD 構造化データの追加 ✅完了
- `src/app/page.tsx` に `WebApplication` スキーマ（無料、FinanceApplication カテゴリ）
- `src/app/help/page.tsx` に `FAQPage` スキーマ（既存の7つのQ&Aを活用）
- `src/app/layout.tsx` に `Organization` スキーマ
- **効果:** Google検索でのリッチリザルト表示、FAQがSERP上に展開

### S3. メタデータ最適化 ✅完了
- `layout.tsx` に `alternates.canonical` を追加
- `title` テンプレート設定（`{ template: '%s | カブノオト', default: '...' }`）
- Google Search Console の verification コード設定（DNS認証で対応済み）
- `/login`, `/dashboard` に `robots: noindex` を明示設定（layout.tsx で対応）
- `robots.txt` を静的ファイルから `robots.ts`（Next.js動的生成）に移行
- **効果:** 検索インデックスの正規化

### S4. SNS共有ボタン — ゲーミフィケーション連携 ✅完了
- レベルアップ時・称号獲得時に「Xでシェア」ボタンを表示
- 共有テンプレート: `投資家レベルが○に上がりました！称号「○○」を獲得！ #カブノオト #投資`
- X(Twitter) と LINE の2プラットフォームに絞る（`window.open` ベース、外部SDK不要でCSP変更なし）
- ランディングページにも共有ボタン追加
- **効果:** ゲーミフィケーション × バイラルのシナジー

### S5. Google Search Console 設定
- サイト登録、sitemap.xml 手動送信、URL検査でインデックスリクエスト
- **効果:** インデックス速度の向上、検索パフォーマンスの可視化

---

## 中期施策（1-3ヶ月）— コンテンツとSNS

### M1. SEOブログの構築 ⭐最重要 ✅構築完了
- `src/app/blog/` にMDXベースのブログシステムを構築
- `content/blog/` にMDXファイルを配置（gray-matter + remark でパース）
- `sitemap.ts` を拡張して全記事を動的に含める
- BlogPosting JSON-LDスキーマで構造化データ対応
- LandingNavbar / LandingFooter にブログリンク追加
- 月2-4本ペースで無理なく継続

**記事テーマ（SEOキーワード狙い）:**

| テーマ | 狙うキーワード |
|---|---|
| 株式投資の思考整理法 | 株式投資 思考整理 / 投資 メモ 管理 |
| PER/PBRの見方と活用法 | PER 見方 / PBR 使い方 |
| 配当カレンダーの作り方 | 配当 カレンダー / 権利確定日 管理 |
| 投資日記の書き方と続け方 | 投資日記 書き方 |
| ポートフォリオ管理の始め方 | ポートフォリオ 管理 無料 |
| 株主優待の管理方法 | 株主優待 管理 アプリ |
| NISA口座と特定口座の使い分け | NISA 特定口座 違い |

各記事末尾に「カブノオトなら一元管理できます」のCTA。

- **効果:** 6ヶ月で月間1,000-3,000の検索流入

### M2. X(Twitter) アカウント運用
- アカウント名: `@kabunote_jp`（仮）
- フッター（`LandingFooter.tsx`）にリンク追加
- 週5投稿目安:
  - **開発アップデート**（週1-2回）— 個人開発ストーリーは共感を呼ぶ
  - **投資Tips**（週1-2回）— ブログ記事の要約
  - **機能紹介スクリーンショット**（週1回）
  - **投資格言**（不定期）— アプリ内の100件を転用
- ハッシュタグ: `#カブノオト` `#日本株` `#株クラ` `#投資` `#個人開発`
- **効果:** 3ヶ月で500-1,000フォロワー、月200-500のサイト流入

### M3. note / Zenn での発信（月2本） 🔄進行中
- **note（投資家向け）:** 投資の思考整理法、カブノオトの使い方
  - 第1弾: 開発ストーリー記事を下書き完了（`content/note/development-story.md`）
- **Zenn（開発者向け）:** Next.js 16 + Supabase + Prisma 7 の技術記事、ゲーミフィケーション設計
- 開発者にも投資家は多い → 間接的なユーザー獲得 + 被リンクでドメインパワー向上

### M4. ランディングページの社会的証明強化
- 登録ユーザー数のリアルタイム表示（`SocialProofSection.tsx` を拡張）
- ユーザーの声セクション追加（フィードバック目安箱からピックアップ、許可制）
- **効果:** CVR（登録率）の向上

---

## 長期施策（3-6ヶ月）— 持続的成長の仕組み

### L1. リファラル（紹介）機能
- `app_users` に `referral_code`, `referred_by` カラム追加
- `/invite/[code]` ルート作成
- 紹介者・被紹介者の両方にXPボーナス
- 「投資仲間の輪」等の紹介専用称号を追加
- **効果:** ゲーミフィケーション × リファラルのシナジー

### L2. PWA対応
- `public/manifest.json` + アイコン各サイズ（192x192, 512x512）
- `layout.tsx` に manifest リンク追加
- **効果:** 「ホーム画面に追加」でモバイルリテンション向上

### L3. 公開プロフィール/実績ページ
- `/u/[username]` ルート — レベル・称号・ストリーク日数を公開表示
- SEOインデックス対象にしてページ数を増やす
- 動的OGP画像生成（`next/og` の `ImageResponse`）
- **効果:** SNS拡散動機 + ユーザー生成コンテンツによるSEO強化

### L4. メールマーケティング基盤
- Resend でウェルカムメール → 週次サマリー → リエンゲージメント（7日/30日未ログイン）
- **効果:** リテンション率の向上、休眠ユーザーの復帰

---

## 優先順位まとめ

| # | 施策 | 工数 | 期待効果 |
|---|---|---|---|
| 1 | ~~S1. OGP画像~~ | ~~2-3h~~ | ✅完了 |
| 2 | ~~S5. Search Console~~ | ~~1h~~ | ✅完了（DNS認証+sitemap登録済み） |
| 3 | ~~S2. JSON-LD~~ | ~~2-3h~~ | ✅完了 |
| 4 | ~~S3. メタデータ最適化~~ | ~~1-2h~~ | ✅完了 |
| 5 | ~~S4. SNS共有ボタン~~ | ~~3-4h~~ | ✅完了 |
| 6 | M2. X運用開始 | 15-30分/日 | 認知拡大 |
| 7 | ~~M1. ブログ構築~~ | ~~初期8h+記事執筆~~ | ✅構築完了（記事追加は継続） |
| 8 | M4. 社会的証明 | 2-3h | CVR向上 |
| 9 | L1. リファラル | 15-20h | 持続的成長 |
| 10 | M3. note/Zenn | 月2本 | 被リンク・認知 |
| 11 | L2. PWA | 3-5h | リテンション |
| 12 | L3. 公開プロフィール | 15-20h | SEO+バイラル |
| 13 | L4. メール基盤 | 10-15h | リテンション |

---

## KPI（月次追跡）

| 指標 | 計測方法 |
|---|---|
| 新規登録数 | GA4の `/login` → `/dashboard` 遷移 |
| 検索流入数 | Google Search Console のクリック数 |
| SNS流入数 | GA4 の utm_source 別セッション |
| リテンション率 | 7日後/30日後のDAU/MAU |
| 共有数 | SNS共有ボタンのクリック数（GA4イベント） |

---

## 投資家コミュニティへのアプローチ先

| コミュニティ | アプローチ方法 |
|---|---|
| X(Twitter) #株クラ | 投資家フォロー・交流、開発アップデート発信 |
| ブログ村「株式投資」 | ブログランキング参加 |
| Discord 投資サーバー | 日本語の投資コミュニティに参加 |
| Product Hunt / MOONGIFT | プロダクト掲載 |
| 個人開発 Advent Calendar | 開発者コミュニティ向け発信 |

---

## 実装時の技術的注意点

- SNS共有は `window.open` ベースのインテントリンクで実装済み（外部SDK不要、CSP変更なし）
  - 実装: `src/components/common/ShareButtons.tsx`（X・LINE対応）
  - レベルアップ時: `LevelUpCelebration.tsx`、称号獲得時: `TitleUnlockedToast.tsx`、ランディングページ: `ShareSection.tsx`
- JSON-LD構造化データ実装済み: `WebApplication`（`page.tsx`）、`FAQPage`（`help/page.tsx`）、`Organization`（`layout.tsx`）
- OGP動的生成は `next/og` の `ImageResponse` を使用（`src/app/opengraph-image.tsx`）
- ブログはMDXベース、`sitemap.ts` を動的拡張
- 主要修正ファイル: `layout.tsx`, `page.tsx`, `sitemap.ts`, `FAQSection.tsx`, `next.config.ts`
