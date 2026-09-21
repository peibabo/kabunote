// 確定損益レコードのDB → APIレスポンス変換（sell / portfolio / stocks-list で共用）

import { parseConsumedLots } from '@/lib/realizedTradeCalc';
import type { RealizedTrade } from '@/types/realizedTrade';

/**
 * Prismaの RealizedTrade レコードのうちシリアライズに必要な項目のみを構造的に受け取る。
 * Decimal/Json は `unknown` として扱い、ここで number / ConsumedLot[] に正規化する。
 */
export interface RealizedTradeRecord {
  id: string;
  stockId: string;
  soldShares: number;
  sellPrice: unknown;
  costBasis: unknown;
  sellDate: string;
  realizedPL: unknown;
  taxRate: unknown;
  consumedLots: unknown;
  memo: string | null;
  createdAt: Date;
}

/**
 * 確定損益レコードをAPIレスポンス形式に変換する。
 * symbol はレコードに含まれないため、呼び出し側の文脈から渡す
 * （銘柄コンテキスト内で既知の場合は空文字でよい）。
 */
export const serializeRealizedTrade = (t: RealizedTradeRecord, symbol: string): RealizedTrade => ({
  id: t.id,
  stockId: t.stockId,
  symbol,
  soldShares: t.soldShares,
  sellPrice: Number(t.sellPrice),
  costBasis: Number(t.costBasis),
  sellDate: t.sellDate,
  realizedPL: Number(t.realizedPL),
  taxRate: Number(t.taxRate),
  consumedLots: parseConsumedLots(t.consumedLots),
  memo: t.memo ?? '',
  createdAt: t.createdAt.toISOString(),
});
