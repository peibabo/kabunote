'use client';

import { useState, useEffect, useCallback } from 'react';
import { playSound } from '@/lib/sound';

function getJSTHour(): number {
  const now = new Date();
  const jstOffset = 9 * 60;
  const jstDate = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);
  return jstDate.getHours();
}

function getTodayJST(): string {
  const now = new Date();
  const jstOffset = 9 * 60;
  const jstDate = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);
  return `${jstDate.getFullYear()}-${String(jstDate.getMonth() + 1).padStart(2, '0')}-${String(jstDate.getDate()).padStart(2, '0')}`;
}

export default function FloatingSnapshotButton() {
  const [isAfter15, setIsAfter15] = useState(() => getJSTHour() >= 15);
  const [todayRecorded, setTodayRecorded] = useState<boolean | null>(null); // null = 未確認
  const [isCreating, setIsCreating] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 1分間隔で15時チェック
  useEffect(() => {
    const check = () => setIsAfter15(getJSTHour() >= 15);
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  // 今日の記録有無を確認
  const checkTodayRecorded = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio/history?range=1W&detail=false');
      if (!res.ok) return;
      const json = await res.json();
      const today = getTodayJST();
      const recorded = (json.data || []).some((s: { snapshotDate: string }) => s.snapshotDate === today);
      setTodayRecorded(recorded);
    } catch {
      // エラー時は非表示のまま
    }
  }, []);

  useEffect(() => {
    checkTodayRecorded();
  }, [checkTodayRecorded]);

  // スナップショット保存イベントを監視（アコーディオン内ボタンから保存された場合）
  useEffect(() => {
    const handler = () => setTodayRecorded(true);
    window.addEventListener('kabunote-snapshot-created', handler);
    return () => window.removeEventListener('kabunote-snapshot-created', handler);
  }, []);

  const handleSnapshot = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/portfolio/snapshot', { method: 'POST' });
      if (res.ok) {
        playSound('noteSave');
        window.dispatchEvent(new Event('kabunote-snapshot-created'));
        setShowSuccess(true);
        setTimeout(() => {
          setIsHiding(true);
          setTimeout(() => {
            setTodayRecorded(true);
            setIsHiding(false);
            setShowSuccess(false);
          }, 500);
        }, 1500);
      }
    } catch {
      // エラー時は何もしない
    } finally {
      setIsCreating(false);
    }
  };

  // 表示条件: 15時以降 かつ (本日未記録 or 成功表示中)
  const shouldShow = isAfter15 && (todayRecorded === false || showSuccess);

  if (!shouldShow) return null;

  return (
    <div className={`fixed bottom-28 md:bottom-24 right-6 z-40 transition-all duration-500 ${
      isHiding ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
    }`}>
      {showSuccess ? (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-medium text-white bg-green-600"
          style={{
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <span className="text-lg">✅</span>
          記録しました！
        </div>
      ) : (
        <button
          onClick={handleSnapshot}
          disabled={isCreating}
          className="cursor-pointer flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-pulse hover:animate-none"
          style={{
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
          title="今日のポートフォリオを記録"
        >
          <span className="text-lg">📸</span>
          {isCreating ? '記録中...' : '今日の記録を確定'}
        </button>
      )}
    </div>
  );
}
