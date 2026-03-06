import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'

// GET: イベント情報取得（決算日・株主総会日）
export const GET = withStock(async ({ stockId }) => {
  const events = await prisma.stockEvent.findMany({ where: { stockId } })

  const earnings = events.find(e => e.eventType === 'EARNINGS')
  const shareholderMeeting = events.find(e => e.eventType === 'SHAREHOLDER_MEETING')

  return NextResponse.json({
    success: true,
    data: {
      earnings: earnings ? {
        id: earnings.id,
        eventDate: earnings.eventDate ? earnings.eventDate.toISOString().split('T')[0] : null,
      } : null,
      shareholderMeeting: shareholderMeeting ? {
        id: shareholderMeeting.id,
        eventMonth: shareholderMeeting.eventMonth,
        eventDay: shareholderMeeting.eventDay,
        isRecurring: shareholderMeeting.isRecurring,
        isActive: shareholderMeeting.isActive,
      } : null,
    }
  })
}, 'イベントの取得')

// PUT: イベント更新（upsert）
export const PUT = withStock(async ({ stockId, request }) => {
  const body = await request.json()
  const { eventType } = body

  if (eventType !== 'EARNINGS' && eventType !== 'SHAREHOLDER_MEETING') {
    return NextResponse.json(
      { error: 'Bad Request', message: 'eventType は EARNINGS または SHAREHOLDER_MEETING である必要があります' },
      { status: 400 }
    )
  }

  let event

  if (eventType === 'EARNINGS') {
    const { eventDate } = body
    const eventDateObj = eventDate ? new Date(eventDate) : null

    event = await prisma.stockEvent.upsert({
      where: { stockId_eventType: { stockId, eventType } },
      update: { eventDate: eventDateObj },
      create: { stockId, eventType, eventDate: eventDateObj },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        eventDate: event.eventDate ? event.eventDate.toISOString().split('T')[0] : null,
      }
    })
  } else {
    const { eventMonth, eventDay, isRecurring, isActive } = body

    event = await prisma.stockEvent.upsert({
      where: { stockId_eventType: { stockId, eventType } },
      update: { eventMonth, eventDay, isRecurring, isActive },
      create: { stockId, eventType, eventMonth, eventDay, isRecurring: isRecurring ?? false, isActive: isActive ?? true },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        eventMonth: event.eventMonth,
        eventDay: event.eventDay,
        isRecurring: event.isRecurring,
        isActive: event.isActive,
      }
    })
  }
}, 'イベントの更新')

// DELETE: イベント削除
export const DELETE = withStock(async ({ stockId, request }) => {
  const { searchParams } = new URL(request.url)
  const eventType = searchParams.get('eventType')

  if (eventType !== 'EARNINGS' && eventType !== 'SHAREHOLDER_MEETING') {
    return NextResponse.json(
      { error: 'Bad Request', message: 'eventType クエリパラメータが必要です（EARNINGS または SHAREHOLDER_MEETING）' },
      { status: 400 }
    )
  }

  await prisma.stockEvent.deleteMany({ where: { stockId, eventType } })

  return NextResponse.json({ success: true, message: 'イベントを削除しました' })
}, 'イベントの削除')
