# Kabunote - 株式銘柄メモアプリ

## プロジェクト概要
- Next.js 16.1.6 + TypeScript + Tailwind CSS
- 株式銘柄のコード検索・メモ機能
- 業種・市場区分表示
- 外部リンク（株探、TradingView、Yahoo!ファイナンス）

## 開発サーバー
```bash
npm run dev
```
- ポート: localhost:3000

## プロジェクト構成

### データファイル
- `public/data/stocks.csv`: 株式銘柄データ（銘柄コード、会社名、市場、業種）
- フォーマット: `code,name,market,sector`

### 主要コンポーネント
- `src/components/StockInput.tsx`: 銘柄検索・入力フォーム
- `src/components/StockCard.tsx`: 銘柄カード表示
- `src/data/stockNames.ts`: CSVデータ読み込み・検索機能

### 機能
1. **銘柄検索**: 銘柄コードまたは会社名での検索
2. **投資メモ**: 銘柄ごとの自動保存メモ（localStorage使用）
3. **外部リンク**: 株探、TradingView、Yahoo!ファイナンスへのワンクリックアクセス
4. **業種・市場表示**: 業種（青バッジ）と市場区分（緑バッジ）

### データ管理
- CSVパーサー: カンマ区切りに対応した簡易パーサー実装
- キャッシュ機能: ページリロード時の高速表示
- エラーハンドリング: 未登録銘柄の適切な表示

## 最近の修正
- CSV列順序修正（market/sector位置）
- 堅牢なCSVパーサー実装
- 市場区分表示追加
- Next.js開発サーバー安定化