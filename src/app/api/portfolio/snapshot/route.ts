import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { buildSnapshotData } from '@/lib/snapshotCalc'
import type { Position } from '@/types/positions'

// POST: 今日のポートフォリオスナップショットを作成/更新
export const POST = withAuth(async ({ user }) => {
  // 全銘柄 + ポジション + 株価を取得
  const stocks = await prisma.stock.findMany({
    where: { userId: user.id },
    include: {
      prices: true,
      positions: true,
    },
  })

  // 現金取得
  const appUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { cashAmount: true },
  })
  const cashAmount = Number(appUser?.cashAmount ?? 0)

  // 計算用データに変換
  const stockInputs = stocks.map(stock => ({
    id: stock.id,
    symbol: stock.symbol,
    currentPrice: stock.prices[0]?.currentPrice != null
      ? Number(stock.prices[0].currentPrice)
      : null,
    positions: stock.positions.map(p => ({
      id: p.id,
      shares: p.shares,
      purchasePrice: Number(p.purchasePrice),
      purchaseDate: p.purchaseDate || '',
      createdAt: p.createdAt.toISOString(),
    })) as Position[],
  }))

  const snapshotData = buildSnapshotData(stockInputs, cashAmount)

  // ポジション保有銘柄が1つもない場合はスナップショット不要
  const hasPositionSnapshots = snapshotData.stockSnapshots.some(s => s.shares > 0);
  if (!hasPositionSnapshots) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'ポジションが設定されていません' },
      { status: 400 }
    )
  }

  // 今日の日付（JST基準、UTC midnightとして保存）
  const now = new Date()
  const jstOffset = 9 * 60
  const jstDate = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000)
  const todayStr = `${jstDate.getFullYear()}-${String(jstDate.getMonth() + 1).padStart(2, '0')}-${String(jstDate.getDate()).padStart(2, '0')}`
  const today = new Date(todayStr + 'T00:00:00.000Z')

  // トランザクションでupsert
  const snapshot = await prisma.$transaction(async (tx) => {
    const result = await tx.portfolioSnapshot.upsert({
      where: {
        userId_snapshotDate: { userId: user.id, snapshotDate: today },
      },
      update: {
        totalInvestment: snapshotData.totalInvestment,
        totalValue: snapshotData.totalValue,
        profitLoss: snapshotData.profitLoss,
        cashAmount: snapshotData.cashAmount,
        netAssets: snapshotData.netAssets,
      },
      create: {
        userId: user.id,
        snapshotDate: today,
        totalInvestment: snapshotData.totalInvestment,
        totalValue: snapshotData.totalValue,
        profitLoss: snapshotData.profitLoss,
        cashAmount: snapshotData.cashAmount,
        netAssets: snapshotData.netAssets,
      },
    })

    // 既存の銘柄スナップショットを削除して再作成
    await tx.stockPriceSnapshot.deleteMany({
      where: { snapshotId: result.id },
    })

    if (snapshotData.stockSnapshots.length > 0) {
      await tx.stockPriceSnapshot.createMany({
        data: snapshotData.stockSnapshots.map(s => ({
          snapshotId: result.id,
          stockId: s.stockId,
          symbol: s.symbol,
          currentPrice: s.currentPrice,
          shares: s.shares,
          value: s.value,
          cost: s.cost,
        })),
      })
    }

    return result
  })

  return NextResponse.json({
    success: true,
    data: {
      id: snapshot.id,
      snapshotDate: snapshot.snapshotDate.toISOString().split('T')[0],
      totalInvestment: Number(snapshot.totalInvestment),
      totalValue: Number(snapshot.totalValue),
      profitLoss: Number(snapshot.profitLoss),
      cashAmount: Number(snapshot.cashAmount),
      netAssets: Number(snapshot.netAssets),
    },
  })
}, 'スナップショットの作成')
