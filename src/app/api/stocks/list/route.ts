import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

export const GET = withAuth(async ({ user }) => {
  const stocks = await prisma.stock.findMany({
    where: { userId: user.id },
    orderBy: { order: 'asc' },
    include: {
      memo: true,
      prices: true,
      positions: { orderBy: { createdAt: 'asc' } },
      events: true,
      dividend: true,
      benefit: true,
      tags: { orderBy: { createdAt: 'asc' } },
      nextAction: true,
      newsItems: { orderBy: { order: 'asc' } },
    }
  })

  // 最新スナップショットの株価を取得（前回比表示用）
  const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
    where: { userId: user.id },
    orderBy: { snapshotDate: 'desc' },
    include: { stockSnapshots: true },
  })
  const snapshotPriceMap = new Map<string, { price: number; date: string }>()
  if (latestSnapshot) {
    const dateStr = latestSnapshot.snapshotDate.toISOString().split('T')[0]
    for (const ss of latestSnapshot.stockSnapshots) {
      if (ss.currentPrice != null) {
        snapshotPriceMap.set(ss.stockId, { price: Number(ss.currentPrice), date: dateStr })
      }
    }
  }

  const formattedStocks = stocks.map(stock => {
    const price = stock.prices[0] ?? null
    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      sector: stock.sector,
      market: stock.market,
      order: stock.order,
      currentPrice: price?.currentPrice != null ? Number(price.currentPrice) : null,
      targetPrice: price?.targetPrice != null ? Number(price.targetPrice) : null,
      stopLossPrice: price?.stopLossPrice != null ? Number(price.stopLossPrice) : null,
      per: price?.per != null ? Number(price.per) : null,
      pbr: price?.pbr != null ? Number(price.pbr) : null,
      memo: stock.memo?.content ?? '',
      positions: stock.positions.map(p => ({
        id: p.id,
        shares: p.shares,
        purchasePrice: Number(p.purchasePrice),
        purchaseDate: p.purchaseDate ?? '',
        memo: p.memo ?? '',
        taxRate: Number(p.taxRate),
        createdAt: p.createdAt.toISOString()
      })),
      events: stock.events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        eventDate: e.eventDate ? e.eventDate.toISOString().split('T')[0] : null,
        eventMonth: e.eventMonth,
        eventDay: e.eventDay,
        isRecurring: e.isRecurring,
        isActive: e.isActive,
      })),
      dividend: stock.dividend ? {
        dividendPerShare: stock.dividend.dividendPerShare != null ? Number(stock.dividend.dividendPerShare) : null,
        frequency: stock.dividend.frequency,
        rightsMonth: stock.dividend.rightsMonth,
        rightsDay: stock.dividend.rightsDay,
      } : null,
      benefit: stock.benefit ? {
        description: stock.benefit.description,
        minimumShares: stock.benefit.minimumShares,
        estimatedValue: stock.benefit.estimatedValue != null ? Number(stock.benefit.estimatedValue) : null,
        rightsMonth: stock.benefit.rightsMonth,
        rightsDay: stock.benefit.rightsDay,
      } : null,
      tags: stock.tags.map(t => ({
        id: t.id,
        label: t.name,
        color: t.color,
        createdAt: t.createdAt.toISOString(),
      })),
      nextActionPlan: stock.nextAction ? {
        actionType: stock.nextAction.actionType.toLowerCase(),
        priority: stock.nextAction.priority.toLowerCase(),
        targetPrice: stock.nextAction.targetPrice ? Number(stock.nextAction.targetPrice) : null,
        targetShares: stock.nextAction.targetShares,
        strategyMemo: stock.nextAction.strategyMemo || '',
      } : null,
      newsItems: stock.newsItems.map(n => ({
        id: n.id,
        url: n.url,
        comment: n.comment,
      })),
      snapshotPrice: snapshotPriceMap.get(stock.id)?.price ?? null,
      snapshotDate: snapshotPriceMap.get(stock.id)?.date ?? null,
      createdAt: stock.createdAt.toISOString(),
      updatedAt: stock.updatedAt.toISOString()
    }
  })

  return NextResponse.json({
    success: true,
    data: formattedStocks,
    count: formattedStocks.length,
    portfolioSnapshot: latestSnapshot ? {
      totalValue: Number(latestSnapshot.totalValue),
      totalInvestment: Number(latestSnapshot.totalInvestment),
      profitLoss: Number(latestSnapshot.profitLoss),
      cashAmount: Number(latestSnapshot.cashAmount),
      netAssets: Number(latestSnapshot.netAssets),
      snapshotDate: latestSnapshot.snapshotDate.toISOString().split('T')[0],
    } : null,
  })
}, '株式データの取得')
