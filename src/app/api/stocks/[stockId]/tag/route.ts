import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { resolveStockId } from '@/lib/resolveStockId'

// GET: タグ一覧取得
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

    const tags = await prisma.stockTag.findMany({
      where: { stockId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: tags.map(t => ({
        id: t.id,
        label: t.name,
        color: t.color,
        createdAt: t.createdAt.toISOString(),
      }))
    })

  } catch (error) {
    console.error('❌ タグ取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'タグの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: タグ追加
export async function POST(
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
    const { label, color } = body

    if (!label || typeof label !== 'string' || !label.trim()) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'label は必須です' },
        { status: 400 }
      )
    }

    const tag = await prisma.stockTag.upsert({
      where: { stockId_name: { stockId, name: label.trim() } },
      update: { color: color ?? 'blue' },
      create: { stockId, name: label.trim(), color: color ?? 'blue' }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: tag.id,
        label: tag.name,
        color: tag.color,
        createdAt: tag.createdAt.toISOString(),
      }
    })

  } catch (error) {
    console.error('❌ タグ追加エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'タグの追加に失敗しました' },
      { status: 500 }
    )
  }
}
