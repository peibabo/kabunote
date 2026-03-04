import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { resolveStockId } from '@/lib/resolveStockId'

// GET: イベント情報取得（決算日・株主総会日）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    const events = await prisma.stockEvent.findMany({
      where: { stockId }
    })

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

  } catch (error) {
    console.error('❌ イベント取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'イベントの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: イベント更新（upsert）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const { eventType } = body

    if (eventType !== 'EARNINGS' && eventType !== 'SHAREHOLDER_MEETING') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'eventType は EARNINGS または SHAREHOLDER_MEETING である必要があります' },
        { status: 400 }
      )
    }

    let event
    const existing = await prisma.stockEvent.findFirst({
      where: { stockId, eventType }
    })

    if (eventType === 'EARNINGS') {
      const { eventDate } = body
      const eventDateObj = eventDate ? new Date(eventDate) : null

      if (existing) {
        event = await prisma.stockEvent.update({
          where: { id: existing.id },
          data: { eventDate: eventDateObj }
        })
      } else {
        event = await prisma.stockEvent.create({
          data: { stockId, eventType, eventDate: eventDateObj }
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          id: event.id,
          eventDate: event.eventDate ? event.eventDate.toISOString().split('T')[0] : null,
        }
      })
    } else {
      // SHAREHOLDER_MEETING
      const { eventMonth, eventDay, isRecurring, isActive } = body

      if (existing) {
        event = await prisma.stockEvent.update({
          where: { id: existing.id },
          data: { eventMonth, eventDay, isRecurring, isActive }
        })
      } else {
        event = await prisma.stockEvent.create({
          data: { stockId, eventType, eventMonth, eventDay, isRecurring: isRecurring ?? false, isActive: isActive ?? true }
        })
      }

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

  } catch (error) {
    console.error('❌ イベント更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'イベントの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: イベント削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')

    if (eventType !== 'EARNINGS' && eventType !== 'SHAREHOLDER_MEETING') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'eventType クエリパラメータが必要です（EARNINGS または SHAREHOLDER_MEETING）' },
        { status: 400 }
      )
    }

    await prisma.stockEvent.deleteMany({
      where: { stockId, eventType }
    })

    return NextResponse.json({ success: true, message: 'イベントを削除しました' })

  } catch (error) {
    console.error('❌ イベント削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'イベントの削除に失敗しました' },
      { status: 500 }
    )
  }
}
