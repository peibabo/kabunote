// 確定損益（売却記録）用の型定義

/**
 * 消し込んだ買いロットの内訳（取得日の保全・保有期間分析用）。
 * 原価は加重平均法だが、消し込みは古い順（FIFO）で行うため、これは
 * 「物理的にどのロットを引き当てたか」の記録であり、税務上の特定口座の
 * 取得単価とは独立した情報（保有開始時期の目安として扱う）。
 */
export interface ConsumedLot {
  shares: number;        // このロットから売却した株数
  purchaseDate: string;  // 取得日（YYYY-MM-DD。未設定ロットは空文字）
}

/** 確定損益レコード（DBから取得） */
export interface RealizedTrade {
  id: string;
  stockId: string;
  symbol: string;        // 銘柄コード（一覧表示用、銘柄横断ビューで使用）
  soldShares: number;    // 売却株数
  sellPrice: number;     // 売却単価（1株あたり）
  costBasis: number;     // 売却時点の加重平均取得単価
  sellDate: string;      // 売却日（YYYY-MM-DD, JST）
  realizedPL: number;    // 実現損益（税引前）
  taxRate: number;       // 売却時の加重平均税率（0=NISA）
  consumedLots: ConsumedLot[]; // 消し込んだ買いロットの内訳（古い順）
  memo?: string;         // 売却理由メモ
  createdAt: string;
}

/** 売却リクエスト（フォーム入力 → API） */
export interface SellPositionInput {
  soldShares: number;
  sellPrice: number;
  sellDate: string;      // YYYY-MM-DD
  memo?: string;
}

/** 売却前プレビュー・実現損益計算結果 */
export interface RealizedTradeResult {
  gross: number;         // 税引前実現損益
  afterTax: number;      // 税引後実現損益（損失時は課税せずそのまま）
  plPercent: number;     // 損益率 = (sellPrice - costBasis) / costBasis * 100
  proceeds: number;      // 売却代金 = sellPrice * soldShares
}

/** 確定損益の集計サマリー（銘柄別・年間・全体） */
export interface RealizedTradeSummary {
  totalGross: number;    // 税引前実現損益合計
  totalAfterTax: number; // 税引後実現損益合計
  totalProceeds: number; // 売却代金合計（税引前手取り）= Σ(sellPrice * soldShares)
  totalAfterTaxProceeds: number; // 税引後手取り = 売却代金 − 利益にかかる税金（NISAは非課税）
  winCount: number;      // 利益が出たトレード数
  lossCount: number;     // 損失が出たトレード数
  tradeCount: number;    // 総トレード数
}
