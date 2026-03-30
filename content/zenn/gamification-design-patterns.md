# 個人開発のNext.jsアプリにゲーミフィケーションを実装して学んだ設計パターン

## はじめに

個人開発している投資思考整理アプリ「カブノオト」に、XP・レベル・称号・サウンドフィードバックからなるゲーミフィケーションシステムを実装しました。

個人開発アプリの最大の課題は **「作ったけど使い続けてもらえない」** こと。機能が揃っていても、毎日開く理由がなければユーザーは離れていきます。そこで「毎日使いたくなる仕組み」としてゲーミフィケーションを導入しました。

この記事では、実装する中で見つけた **3つの設計パターン** を紹介します。ゲーミフィケーションに限らず、SaaSの通知・分析・バッジなど、既存アプリに機能を「後付け」する場面で応用できるパターンです。

**技術スタック:** Next.js 16 + TypeScript + Supabase + Prisma 7

## 全体像：XP 14種 × レベル 20段階 × 称号 28個

まず全体の設計を簡単に紹介します。

### システム構成

| 要素 | 内容 |
|------|------|
| XPアクション | 14種（ログイン、銘柄追加、メモ保存、ポートフォリオ記録など） |
| レベル | 20段階（「見習い投資家」→「投資の神」） |
| 称号 | 28個（6カテゴリ × 4段階レアリティ） |
| 日次XP上限 | 100（ストリークボーナスは対象外） |
| カンストまで | 約105日（毎日上限まで使った場合） |

### DB設計：テーブルは2つだけ

ゲーミフィケーション用のテーブルは **`user_gamification`** と **`xp_activity_logs`** の2つだけです。

```
user_gamification
├── userId (PK, FK → app_users)
├── totalXp
├── level
├── currentStreak
├── longestStreak
├── lastActiveDate
└── dailyXpEarned

xp_activity_logs
├── id (PK)
├── userId (FK → app_users)
├── actionType (Enum: 14種)
├── xpEarned
└── createdAt
```

ポイントは **称号テーブルがないこと** です。28個の称号は全て「既存の集計データから算出可能」なので、専用テーブルを作らずにオンザフライで判定しています。これについては後述します。

### レベル曲線

```typescript
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(50 * (level - 1) * level / 2 + 50 * (level - 1))
}
```

この曲線は「毎日コツコツ使えば約3.5ヶ月でカンスト」を目標に設計しました。日次XP上限を100にしているので、1日1回ログインして数回操作するだけで上限に到達するゆるさです。ガチャやPay-to-Win要素は一切なく、純粋に「使い続けること」が唯一のレベルアップ手段です。

## パターン1：fire-and-forget XP付与

### 課題：14箇所のフックにXPロジックを織り込みたくない

カブノオトには銘柄追加、メモ保存、ポートフォリオ記録など14種類のXP獲得アクションがあります。それぞれのフックにXP付与のロジックを組み込むと、既存コードが複雑化し、XPシステムの障害がメイン機能に波及するリスクがあります。

### 解決：`grantXp()` 1行で完結する fire-and-forget パターン

```typescript
// 既存フックの成功コールバック内に1行追加するだけ
const handleAddStock = async (symbol: string) => {
  await addStock(symbol)       // 既存のメイン処理
  grantXp('STOCK_ADD')         // ← この1行を追加
}
```

`grantXp()` の実装はこうなっています：

```typescript
export function grantXp(actionType: XpActionType): void {
  if (typeof window === 'undefined') return

  fetch('/api/gamification/xp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType }),
  })
    .then(res => {
      if (res.ok) return res.json()
      return null
    })
    .then((data: { data: XpGrantResult } | null) => {
      if (!data?.data) return
      const result = data.data

      if (result.xpEarned > 0) {
        window.dispatchEvent(
          new CustomEvent('kabunote-xp-gained', { detail: result })
        )
      }
      if (result.leveledUp) {
        window.dispatchEvent(
          new CustomEvent('kabunote-level-up', {
            detail: { level: result.newLevel, levelName: result.newLevelName },
          })
        )
      }
    })
    .catch(() => {
      // XP付与失敗は無視
    })
}
```

### 設計のポイント

**1. `void` を返す（Promiseではない）**

`grantXp()` は意図的に `void` を返しています。`async` にして `await grantXp(...)` と書かせると、呼び出し側がエラーハンドリングの責務を負うことになります。fire-and-forgetの意図を型レベルで表現するために `void` にしました。

**2. `.catch(() => {})` は設計判断**

XP付与はあくまでおまけ機能です。ネットワークエラーやサーバーエラーでXPが付与されなくても、ユーザーの本来の操作（銘柄追加、メモ保存など）に影響を与えてはいけません。`.catch(() => {})` は「意図的な無視」であり、書き忘れではありません。

**3. CustomEvent で loose coupling**

XP付与の結果（獲得XP量、レベルアップの有無）は `CustomEvent` で通知しています。UI側の `useGamification` フックはこのイベントをリスニングして状態を再取得します：

```typescript
export function useGamification() {
  const [gamification, setGamification] = useState<GamificationState | null>(null)

  const fetchState = useCallback(async () => {
    const res = await fetch('/api/gamification')
    if (res.ok) {
      const json = await res.json()
      setGamification(json.data)
    }
  }, [])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  // XP獲得・レベルアップイベントをリスニングして再取得
  useEffect(() => {
    const handler = () => { fetchState() }
    window.addEventListener('kabunote-xp-gained', handler)
    window.addEventListener('kabunote-level-up', handler)
    return () => {
      window.removeEventListener('kabunote-xp-gained', handler)
      window.removeEventListener('kabunote-level-up', handler)
    }
  }, [fetchState])

  return { gamification, isLoading }
}
```

この設計により、`grantXp()` を呼ぶ側はXP付与後のUI更新を一切気にする必要がありません。既存の14箇所のフックに1行追加するだけで統合が完了しました。

### フロー図

```
ユーザー操作（例: 銘柄追加）
    │
    ▼
既存フック（useStockActions）
    │
    ├──→ メイン処理（DB保存） ← ここが本業
    │
    └──→ grantXp('STOCK_ADD')  ← fire-and-forget
              │
              ▼
         POST /api/gamification/xp
              │
              ▼
         CustomEvent 発火
         ├── 'kabunote-xp-gained'
         └── 'kabunote-level-up'（レベルアップ時のみ）
              │
              ▼
         useGamification がリスニング
              │
              ▼
         XPバー・レベル表示が自動更新
```

## パターン2：称号判定を純粋関数で実装する

### 28個の称号を宣言的に定義する

称号の条件判定は、配列に宣言的に定義しています：

```typescript
interface TitleWithCondition extends TitleDefinition {
  check: (data: TitleCheckData) => boolean
}

const TITLES: TitleWithCondition[] = [
  // ── 📈 銘柄 ──
  {
    id: 'first_stock',
    name: 'はじめの一歩',
    description: '最初の銘柄を登録',
    category: 'stock',
    icon: '🌱',
    rarity: 'common',
    check: d => d.stockCount >= 1,
  },
  {
    id: 'portfolio_10',
    name: 'ポートフォリオビルダー',
    description: '10銘柄を登録',
    category: 'stock',
    icon: '🏗️',
    rarity: 'rare',
    check: d => d.stockCount >= 10,
  },
  // ── 📝 記録 ──
  {
    id: 'all_memos',
    name: '全銘柄メモ達成',
    description: '全銘柄にメモを記入',
    category: 'record',
    icon: '📚',
    rarity: 'legendary',
    check: d => d.stockCount >= 1 && d.allStocksHaveMemo,
  },
  // ── 🔥 継続 ──
  {
    id: 'streak_3',
    name: '三日坊主突破',
    description: '営業日3日連続アクセス',
    category: 'streak',
    icon: '🔥',
    rarity: 'common',
    check: d => d.longestStreak >= 3,
  },
  // ... 全28個
]
```

そして判定ロジックはたった5行です：

```typescript
export function evaluateTitles(data: TitleCheckData): TitleStatus[] {
  return TITLES.map(({ check, ...def }) => ({
    ...def,
    unlocked: check(data),
  }))
}
```

### この設計のメリット

**1. テストが簡単**

`evaluateTitles()` は純粋関数なので、任意の `TitleCheckData` を渡すだけでテストできます。DBもAPIもモックも不要です。

```typescript
test('銘柄を1つ登録すると「はじめの一歩」がアンロックされる', () => {
  const data: TitleCheckData = {
    stockCount: 1,
    memoCount: 0,
    // ... 他のフィールド
  }
  const titles = evaluateTitles(data)
  const firstStock = titles.find(t => t.id === 'first_stock')
  expect(firstStock?.unlocked).toBe(true)
})
```

**2. 称号の追加が簡単**

新しい称号を追加したいときは、`TITLES` 配列に1要素追加するだけ。DB変更もマイグレーションも不要です。

**3. 公開APIから `check` 関数を隠蔽**

```typescript
export const TITLE_DEFINITIONS: TitleDefinition[] =
  TITLES.map(({ check: _, ...def }) => def)
```

`TitleWithCondition`（`check` 付き）はモジュール内部だけで使い、外部には `TitleDefinition`（`check` なし）を公開しています。UIコンポーネントが判定ロジックにアクセスする必要はないので、型レベルで責務を分離しています。

### なぜ称号テーブルを作らなかったのか

称号の獲得状態は「銘柄数」「メモ数」「ストリーク日数」など、既存のデータから全て算出可能です。もし称号テーブルを作ると：

- 既存データとの整合性を維持する必要がある（銘柄を削除したら称号も取り消す？）
- マイグレーションが増える
- 称号追加のたびにDBスキーマ変更が必要

オンザフライ計算なら、これらの問題が全て解消します。28個の判定を毎回走らせるコストは、条件がシンプルな比較演算だけなので実質ゼロです。

## パターン3：Web Audio API でサウンドフィードバック

### 音声ファイルゼロのサウンドシステム

レベルアップ時にはお祝いのサウンドを鳴らしたい。でも音声ファイルを使うとバンドルサイズが増え、ライセンス管理も必要になります。

Web Audio API を使えば、**ブラウザだけでサウンドを合成**できます。全9種のサウンドを音声ファイルゼロで実現しています。

### レベルアップのアルペジオ（C5→E5→G5→C6）

```typescript
function playLevelUpSound(): void {
  if (!audioCtx) return
  const t = audioCtx.currentTime
  const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
  const noteDelay = 0.1
  const noteDuration = 0.4

  for (let i = 0; i < notes.length; i++) {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = notes[i]
    const start = t + i * noteDelay
    gain.gain.setValueAtTime(volume * 0.3, start)
    gain.gain.linearRampToValueAtTime(0, start + noteDuration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(start)
    osc.stop(start + noteDuration)
  }
}
```

Cメジャーのアルペジオ（ド→ミ→ソ→ド）を0.1秒間隔で鳴らし、各音は0.4秒かけてフェードアウトします。上昇する音階が「レベルアップ感」を自然に演出します。

### メモ保存のペン書き音

```typescript
function playPenWriteSound(): void {
  if (!audioCtx) return
  const duration = 0.18
  const sampleRate = audioCtx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = audioCtx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  // ホワイトノイズに振幅変調（カリカリ感）を加える
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    const phase = (t / duration) * 3
    const stroke = Math.sin(phase * Math.PI) * 0.7 + 0.3
    data[i] = (Math.random() * 2 - 1) * stroke
  }

  const source = audioCtx.createBufferSource()
  source.buffer = buffer

  // バンドパスフィルターで「紙の上のペン」のような帯域に絞る
  const filter = audioCtx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 4500
  filter.Q.value = 0.8

  const gain = audioCtx.createGain()
  gain.gain.setValueAtTime(volume * 0.25, audioCtx.currentTime)
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(audioCtx.destination)
  source.start(audioCtx.currentTime)
  source.stop(audioCtx.currentTime + duration)
}
```

ホワイトノイズを生成し、`sin` で振幅変調をかけて「カリカリ」したストローク感を出し、4500Hzのバンドパスフィルターで「紙の上のペン」のような帯域に絞っています。メモを保存するたびにペンで書き留めたような触感が得られます。

### SSRセーフにするための工夫

Next.js（SSR環境）では `window` や `AudioContext` が存在しないため、いくつかの対策が必要です。

```typescript
// 1. AudioContextの遅延初期化（ユーザー操作時に初めて作る）
let audioCtx: AudioContext | null = null

export function initSoundEngine(): void {
  if (audioCtx) return
  if (typeof window === 'undefined') return
  audioCtx = new AudioContext()
}

// 2. useSyncExternalStore 対応の Store
//    サーバー側ではデフォルト値を返す
export const soundStore = {
  getSnapshot: () => cachedSnapshot,        // クライアント用
  getServerSnapshot: () => serverSnapshot,  // SSR用（固定値）
}
```

`AudioContext` はブラウザのAutoplay Policyにより、ユーザー操作（クリックなど）をトリガーにして初めて初期化する必要があります。`initSoundEngine()` を最初のユーザー操作時に呼び出すことで、この制約に対応しています。

実際のレベルアップ演出は動かして体験するのが一番わかりやすいので、興味があれば[カブノオト](https://kabunote.jp)で試してみてください。

## まとめ：アーキテクチャ全体像

```
┌──────────────────────────────────────────────────────┐
│  既存フック（14箇所）                                    │
│  useStockActions / useMemo / usePortfolio / ...       │
│                                                       │
│  銘柄追加成功 → grantXp('STOCK_ADD')  ← 1行追加      │
│  メモ保存成功 → grantXp('MEMO_SAVE')                  │
│  ...                                                  │
└───────────────┬───────────────────────────────────────┘
                │ fire-and-forget（void、失敗無視）
                ▼
┌──────────────────────────────────────────────────────┐
│  POST /api/gamification/xp                            │
│  ├── XP加算 + 日次上限チェック                          │
│  ├── レベル判定                                        │
│  └── レスポンス返却                                     │
└───────────────┬───────────────────────────────────────┘
                │ CustomEvent（kabunote-xp-gained / level-up）
                ▼
┌──────────────────────────────────────────────────────┐
│  useGamification（UIフック）                            │
│  ├── イベントリスニング → 状態再取得                     │
│  ├── XPバー・レベル表示更新                              │
│  └── レベルアップ時 → playLevelUpSound() 🔊             │
│                                                       │
│  evaluateTitles(data)（純粋関数）                       │
│  ├── 既存データから28称号を判定                          │
│  └── 新規アンロック → 通知表示                          │
└──────────────────────────────────────────────────────┘
```

この記事で紹介した3つのパターンをまとめると：

| パターン | 何に使える | ポイント |
|---------|----------|---------|
| fire-and-forget | 通知、分析、XP付与 | `void` を返す。失敗を無視。CustomEventで疎結合 |
| 宣言的な純粋関数判定 | バッジ、称号、実績 | 配列に条件を宣言。DBテーブル不要。テスト容易 |
| Web Audio合成 | UI効果音、フィードバック | 音声ファイル0。SSRセーフ。バンドルサイズ増加なし |

これらはゲーミフィケーションに限らず、既存アプリに機能を後付けする場面全般で使えるパターンです。

---

[カブノオト](https://kabunote.jp) — 投資家の思考を整理する無料Webアプリ

開発の経緯については [noteの記事](https://note.com/kabunote/n/n0db3ffe128c7) に書いています。バイブコーディング（Claude Code）で2ヶ月で25以上の機能を実装した話です。
