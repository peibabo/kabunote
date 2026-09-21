// 銘柄別の株価履歴リクエストを一括リクエストにまとめるローダー（N+1 API Call 対策）
//
// ダッシュボードは銘柄カードを同時マウントするため、投資戦略タブを開いている
// カードの数だけ `/api/stocks/{id}/price-history` が並列に飛んでいた。しかも
// このAPIは「期間内の全スナップショットを読んでから1銘柄ぶんに絞る」実装なので、
// 同じ重いスキャンがカード数ぶん繰り返されていた。
//
// ここでは同一フレームで発生した要求を貯めてから1本の一括リクエストに変換する。
// 全銘柄を先読みしないため、カードが数枚のときに転送量が増えることもない。

import type { StockPriceHistoryItem } from '@/types/portfolio';

interface PendingRequest {
  stockId: string;
  resolve: (items: StockPriceHistoryItem[]) => void;
  reject: (error: unknown) => void;
}

/** 期間ごとに待ち合わせる（期間が違えば別リクエスト） */
const pendingByRange = new Map<string, PendingRequest[]>();
const scheduledRanges = new Set<string>();

async function flush(range: string): Promise<void> {
  const pending = pendingByRange.get(range) ?? [];
  pendingByRange.delete(range);
  scheduledRanges.delete(range);
  if (pending.length === 0) return;

  // 同じ銘柄を複数カードが要求することもあるため一意化してから問い合わせる
  const stockIds = [...new Set(pending.map(p => p.stockId))];

  try {
    const params = new URLSearchParams({ range, stockIds: stockIds.join(',') });
    const res = await fetch(`/api/stocks/price-history?${params.toString()}`);
    if (!res.ok) throw new Error('株価履歴の取得に失敗しました');
    const json = await res.json();
    const history: Record<string, StockPriceHistoryItem[]> = json.history ?? {};
    // 履歴が1件も無い銘柄はキー自体が返らないため、空配列にフォールバックする
    pending.forEach(p => p.resolve(history[p.stockId] ?? []));
  } catch (e) {
    pending.forEach(p => p.reject(e));
  }
}

/**
 * 指定銘柄・指定期間の株価履歴を取得する。
 * 同一フレーム内の呼び出しは期間ごとに1本の一括リクエストへまとめられる。
 */
export function loadPriceHistory(stockId: string, range: string): Promise<StockPriceHistoryItem[]> {
  return new Promise<StockPriceHistoryItem[]>((resolve, reject) => {
    const pending = pendingByRange.get(range);
    if (pending) {
      pending.push({ stockId, resolve, reject });
    } else {
      pendingByRange.set(range, [{ stockId, resolve, reject }]);
    }

    // マイクロタスクではなくタイマーで待つ。カードのマウントは同一フレーム内でも
    // レンダリングが分かれることがあり、マイクロタスクだと束ね損ねるため
    if (!scheduledRanges.has(range)) {
      scheduledRanges.add(range);
      setTimeout(() => { void flush(range); }, 0);
    }
  });
}
