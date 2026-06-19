import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { recalcSnapshotAggregates } from '@/lib/snapshotCalc'
import { isValidRequiredPrice } from '@/lib/validation'
import { getTodayJST, dateStrToUTCMidnight } from '@/lib/dateJst'

// PATCH: 過去スナップショットの個別株価を修正（評価額・損益・純資産を再計算）
export const PATCH = withAuth(async ({ user, request, params }) => {
  const id = params.id as string
  if (!id) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'スナップショットIDが必要です' },
      { status: 400 }
    )
  }

  const { stockPrices } = await request.json()

  // バリデーション
  if (!Array.isArray(stockPrices) || stockPrices.length === 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'stockPricesは1件以上の配列で指定してください' },
      { status: 400 }
    )
  }
  for (const sp of stockPrices) {
    if (typeof sp?.stockId !== 'string' || sp.stockId.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'stockIdが不正です' },
        { status: 400 }
      )
    }
    if (!isValidRequiredPrice(sp.currentPrice)) {
      return NextResponse.json(
        { error: 'Bad Request', message: '株価は0より大きい有効な数値である必要があります' },
        { status: 400 }
      )
    }
  }

  const snapshot = await prisma.portfolioSnapshot.findUnique({
    where: { id },
    include: { stockSnapshots: true },
  })

  // 所有権検証（存在しない・他ユーザーのもの → 404）
  if (!snapshot || snapshot.userId !== user.id) {
    return NextResponse.json(
      { error: 'Not Found', message: 'スナップショットが見つかりません' },
      { status: 404 }
    )
  }

  // 当日分は既存の「最新データで上書き」に委ねる（昨日以前のみ修正可）
  const todayUTC = dateStrToUTCMidnight(getTodayJST())
  if (snapshot.snapshotDate.getTime() >= todayUTC.getTime()) {
    return NextResponse.json(
      { error: 'Bad Request', message: '当日のスナップショットは「最新データで上書き」から更新してください' },
      { status: 400 }
    )
  }

  // 指定された stockId がスナップショットに存在するか確認
  const existingIds = new Set(snapshot.stockSnapshots.map(s => s.stockId))
  for (const sp of stockPrices) {
    if (!existingIds.has(sp.stockId)) {
      return NextResponse.json(
        { error: 'Not Found', message: '対象の銘柄スナップショットが見つかりません' },
        { status: 404 }
      )
    }
  }

  // 修正後の株価をマージし、再計算用の行を構築
  const priceMap = new Map<string, number>()
  for (const sp of stockPrices) priceMap.set(sp.stockId, sp.currentPrice)

  const updatedRows = snapshot.stockSnapshots.map(s => {
    const newPrice = priceMap.get(s.stockId)
    return {
      id: s.id,
      stockId: s.stockId,
      symbol: s.symbol,
      shares: s.shares,
      cost: Number(s.cost),
      currentPrice: newPrice !== undefined
        ? newPrice
        : (s.currentPrice != null ? Number(s.currentPrice) : null),
      changed: newPrice !== undefined,
    }
  })

  const cashAmount = Number(snapshot.cashAmount)
  const agg = recalcSnapshotAggregates(updatedRows, cashAmount)

  await prisma.$transaction(async (tx) => {
    // 価格が変更された行のみ value を書き直す。未変更行の保存済み value は、
    // 作成時も recalcSnapshotAggregates と同一ロジック（buildSnapshotData）で算出されるため
    // 必ず agg.values[i] と一致し、Σ(行のvalue) = totalValue は保たれる。
    // ※ 将来 value の算出基準を変えたりレガシーデータを混在させる場合は、
    //   ここで全行を書き直さないと totalValue と行合計がズレ得る点に注意。
    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i]
      if (!row.changed) continue
      await tx.stockPriceSnapshot.update({
        where: { id: row.id },
        data: { currentPrice: row.currentPrice, value: agg.values[i] },
      })
    }
    await tx.portfolioSnapshot.update({
      where: { id },
      data: {
        totalInvestment: agg.totalInvestment,
        totalValue: agg.totalValue,
        profitLoss: agg.profitLoss,
        netAssets: agg.netAssets,
      },
    })
  })

  // 更新後の完全なスナップショットを返す（フロントで差し替え）
  const stockSnapshots = updatedRows.map((row, i) => ({
    stockId: row.stockId,
    symbol: row.symbol,
    currentPrice: row.currentPrice,
    shares: row.shares,
    value: agg.values[i],
    cost: row.cost,
  }))

  return NextResponse.json({
    success: true,
    data: {
      id: snapshot.id,
      snapshotDate: snapshot.snapshotDate.toISOString().split('T')[0],
      totalInvestment: agg.totalInvestment,
      totalValue: agg.totalValue,
      profitLoss: agg.profitLoss,
      cashAmount,
      netAssets: agg.netAssets,
      stockSnapshots,
    },
  })
}, 'スナップショットの更新')
