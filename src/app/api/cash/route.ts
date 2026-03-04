import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 現金残高と次の一手メモを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        cashAmount: true,
        nextActionMemo: true,
      },
    });

    if (!user) {
      return NextResponse.json({ cashAmount: '0', nextActionMemo: '' });
    }

    return NextResponse.json({
      cashAmount: user.cashAmount?.toString() || '0',
      nextActionMemo: user.nextActionMemo || '',
    });
  } catch (error) {
    console.error('現金残高取得エラー:', error);
    return NextResponse.json({ error: '現金残高の取得に失敗しました' }, { status: 500 });
  }
}

// POST/PUT: 現金残高と次の一手メモを更新
export async function POST(request: NextRequest) {
  try {
    const { userId, cashAmount, nextActionMemo } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    // 現金残高の検証
    if (cashAmount !== undefined && cashAmount !== null) {
      const numericAmount = parseFloat(cashAmount);
      if (isNaN(numericAmount) || numericAmount < 0) {
        return NextResponse.json({ error: '有効な現金残高を入力してください' }, { status: 400 });
      }
    }

    const updateData: Partial<{ cashAmount: string; nextActionMemo: string }> = {};
    if (cashAmount !== undefined) {
      updateData.cashAmount = cashAmount;
    }
    if (nextActionMemo !== undefined) {
      updateData.nextActionMemo = nextActionMemo;
    }

    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      update: updateData,
      create: {
        id: userId,
        email: `temp_${userId}@example.com`, // 一時的なメール
        authProvider: 'unknown',
        ...updateData,
      },
      select: {
        cashAmount: true,
        nextActionMemo: true,
      },
    });

    return NextResponse.json({
      cashAmount: updatedUser.cashAmount?.toString() || '0',
      nextActionMemo: updatedUser.nextActionMemo || '',
    });
  } catch (error) {
    console.error('現金残高更新エラー:', error);
    return NextResponse.json({ error: '現金残高の更新に失敗しました' }, { status: 500 });
  }
}