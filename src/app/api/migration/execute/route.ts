import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import type { KabunoteData } from '@/utils/dataManager'

export async function POST(request: Request) {
  try {
    const { userId, localData }: { userId: string; localData: KabunoteData } = await request.json()

    // Supabase認証確認
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Cookie確認のためのデバッグ
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll().map(({ name, value }) => ({
      name,
      value: value.substring(0, 20) + '...' // 最初の20文字のみ表示
    }))

    if (!session || session.user.id !== userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // トランザクションで全データを移行
    const result = await prisma.$transaction(async (tx) => {
      const migrationStats = {
        users: 0,
        stocks: 0,
        memos: 0,
        tags: 0,
        positions: 0,
        events: 0,
        dividends: 0,
        benefits: 0,
        nextActionPlans: 0,
        favoriteGroups: 0,
        snoozedAlerts: 0,
        tabStates: 0
      }

      // ユーザーの現金情報を更新
      if (localData.cashAmount && parseFloat(localData.cashAmount) > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            cashAmount: parseFloat(localData.cashAmount),
            nextActionMemo: localData.nextActionMemo || null
          }
        })
        migrationStats.users = 1
      }

      // 銘柄データを移行
      for (let i = 0; i < localData.stocks.length; i++) {
        const symbol = localData.stocks[i]
        const order = localData.stocksOrder.indexOf(symbol)

        // 銘柄基本情報を作成
        const stock = await tx.stock.create({
          data: {
            userId,
            symbol,
            name: null, // CSVから取得する場合は後で更新
            sector: null,
            market: null,
            order: order >= 0 ? order : i
          }
        })
        migrationStats.stocks++

        // メモを移行
        const memo = localData.memos[symbol]
        if (memo) {
          await tx.stockMemo.create({
            data: {
              stockId: stock.id,
              content: memo
            }
          })
          migrationStats.memos++
        }

        // 株価情報を移行
        const currentPrice = localData.currentPrices[symbol]
        const targetPrice = localData.targetPrices[symbol]
        const stopLoss = localData.stopLosses[symbol]

        if (currentPrice || targetPrice || stopLoss) {
          await tx.stockPrice.create({
            data: {
              stockId: stock.id,
              currentPrice: currentPrice ? parseFloat(currentPrice) : null,
              targetPrice: targetPrice ? parseFloat(targetPrice) : null,
              stopLossPrice: stopLoss ? parseFloat(stopLoss) : null
            }
          })
        }

        // ポジション情報を移行
        const positions = localData.positions[symbol]
        if (positions && Array.isArray(positions)) {
          // Position[] 形式の場合（新フォーマット）
          if (positions.length > 0 && typeof positions[0] === 'object' && positions[0] !== null && 'purchasePrice' in positions[0]) {
            for (const pos of positions) {
              if (pos.shares > 0 && pos.purchasePrice > 0) {
                await tx.stockPosition.create({
                  data: {
                    stockId: stock.id,
                    shares: pos.shares,
                    purchasePrice: pos.purchasePrice,
                    purchaseDate: pos.purchaseDate || null,
                    memo: pos.memo || null
                  }
                })
                migrationStats.positions++
              }
            }
          } else if (positions.length >= 2) {
            // 旧フォーマット: [shares, averagePrice, totalInvestment]
            const [shares, averagePrice] = positions
            const sharesNum = parseInt(shares) || 0
            const avgPrice = averagePrice ? parseFloat(averagePrice) : 0
            if (sharesNum > 0 && avgPrice > 0) {
              await tx.stockPosition.create({
                data: {
                  stockId: stock.id,
                  shares: sharesNum,
                  purchasePrice: avgPrice,
                  purchaseDate: null,
                  memo: '移行データ'
                }
              })
              migrationStats.positions++
            }
          }
        }

        // 決算日を移行
        const earningsDate = localData.earningsDates[symbol]
        if (earningsDate) {
          try {
            const parsedDate = new Date(earningsDate)
            if (!isNaN(parsedDate.getTime())) {
              await tx.stockEvent.create({
                data: {
                  stockId: stock.id,
                  eventType: 'EARNINGS',
                  eventDate: parsedDate
                }
              })
              migrationStats.events++
            }
          } catch (error) {
            console.warn('Invalid earnings date:', earningsDate)
          }
        }

        // 配当情報を移行
        const dividendPerShare = localData.dividendPerShare[symbol]
        const dividendFrequency = localData.dividendFrequency[symbol]
        const dividendRightsSettings = localData.dividendRightsSettings[symbol]

        if (dividendPerShare || dividendFrequency || dividendRightsSettings) {
          let rightsMonth = null
          let rightsDay = null

          if (dividendRightsSettings) {
            try {
              const rightsData = JSON.parse(dividendRightsSettings)
              rightsMonth = rightsData.month
              rightsDay = rightsData.day
            } catch (e) {
              console.warn('Invalid dividend rights settings:', dividendRightsSettings)
            }
          }

          await tx.stockDividend.create({
            data: {
              stockId: stock.id,
              dividendPerShare: dividendPerShare ? parseFloat(dividendPerShare) : null,
              frequency: dividendFrequency ? parseInt(dividendFrequency) : 1,
              rightsMonth,
              rightsDay
            }
          })
          migrationStats.dividends++
        }

        // 株主優待情報を移行
        const benefitDescription = localData.benefitDescription[symbol]
        const minimumShares = localData.minimumShares[symbol]
        const estimatedValue = localData.estimatedValue[symbol]
        const shareholderRightsSettings = localData.shareholderRightsSettings[symbol]

        if (benefitDescription || minimumShares || estimatedValue || shareholderRightsSettings) {
          let rightsMonth = null
          let rightsDay = null

          if (shareholderRightsSettings) {
            try {
              const rightsData = JSON.parse(shareholderRightsSettings)
              rightsMonth = rightsData.month
              rightsDay = rightsData.day
            } catch (e) {
              console.warn('Invalid shareholder rights settings:', shareholderRightsSettings)
            }
          }

          await tx.stockBenefit.create({
            data: {
              stockId: stock.id,
              description: benefitDescription || null,
              minimumShares: minimumShares ? parseInt(minimumShares) : null,
              estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
              rightsMonth,
              rightsDay
            }
          })
          migrationStats.benefits++
        }

        // タグを移行
        const tags = localData.tags[symbol]
        if (tags && Array.isArray(tags)) {
          for (const tag of tags) {
            if (tag.name) {
              await tx.stockTag.create({
                data: {
                  stockId: stock.id,
                  name: tag.name,
                  color: tag.color || 'gray'
                }
              })
              migrationStats.tags++
            }
          }
        }

        // Next Action Planを移行
        const nextActionPlan = localData.nextActionPlans[symbol]
        if (nextActionPlan) {
          try {
            const planData = JSON.parse(nextActionPlan)
            await tx.nextActionPlan.create({
              data: {
                stockId: stock.id,
                actionType: planData.actionType || 'HOLD',
                priority: planData.priority || 'MEDIUM',
                targetPrice: planData.targetPrice ? parseFloat(planData.targetPrice) : null,
                targetShares: planData.targetShares ? parseInt(planData.targetShares) : null,
                strategyMemo: planData.strategyMemo || null
              }
            })
            migrationStats.nextActionPlans++
          } catch (e) {
            console.warn('Invalid next action plan:', nextActionPlan)
          }
        }

        // タブ状態を移行
        const activeTab = localData.activeTabs[symbol]
        const managementTab = localData.managementTabs[symbol]
        const investmentStrategyTab = localData.investmentStrategyTabs[symbol]

        if (activeTab) {
          await tx.stockTabState.create({
            data: {
              stockId: stock.id,
              tabType: 'active',
              currentTab: activeTab
            }
          })
          migrationStats.tabStates++
        }

        if (managementTab) {
          await tx.stockTabState.create({
            data: {
              stockId: stock.id,
              tabType: 'management',
              currentTab: managementTab
            }
          })
          migrationStats.tabStates++
        }

        if (investmentStrategyTab) {
          await tx.stockTabState.create({
            data: {
              stockId: stock.id,
              tabType: 'investment_strategy',
              currentTab: investmentStrategyTab
            }
          })
          migrationStats.tabStates++
        }
      }

      // お気に入りグループを移行
      for (const group of localData.favoriteGroups) {
        await tx.favoriteGroup.create({
          data: {
            userId,
            name: group.name,
            color: group.color,
            order: group.order || 0
          }
        })
        migrationStats.favoriteGroups++
      }

      // スヌーズアラートを移行
      for (const alert of localData.snoozedAlerts) {
        if (alert.snoozeUntil && new Date(alert.snoozeUntil) > new Date()) {
          await tx.snoozedAlert.create({
            data: {
              userId,
              stockSymbol: alert.stockSymbol,
              alertType: alert.alertType,
              snoozeUntil: new Date(alert.snoozeUntil)
            }
          })
          migrationStats.snoozedAlerts++
        }
      }

      return migrationStats
    })

    return NextResponse.json({
      success: true,
      message: '移行が完了しました',
      details: result
    })

  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json(
      { error: `移行中にエラーが発生しました: ${error}` },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}