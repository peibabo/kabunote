'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { playSound } from '@/lib/sound';
import { getJSTHour, getTodayJST } from '@/lib/dateJst';

interface FloatingSnapshotButtonProps {
  hasSnapshotReady: boolean;
}

export default function FloatingSnapshotButton({ hasSnapshotReady }: FloatingSnapshotButtonProps) {
  const [isAfter15, setIsAfter15] = useState(() => getJSTHour() >= 15);
  const [todayRecorded, setTodayRecorded] = useState<boolean | null>(null); // null = 未確認
  const [isCreating, setIsCreating] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef(getTodayJST());

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

  // 1分間隔で15時チェック（日付が変わったら記録状態も再確認）
  useEffect(() => {
    const check = () => {
      setIsAfter15(getJSTHour() >= 15);
      const today = getTodayJST();
      if (today !== todayRef.current) {
        todayRef.current = today;
        setTodayRecorded(null);
        setIsExpanded(false);
        checkTodayRecorded();
      }
    };
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [checkTodayRecorded]);

  useEffect(() => {
    checkTodayRecorded();
  }, [checkTodayRecorded]);

  // スナップショット保存イベントを監視（アコーディオン内ボタンから保存された場合）
  useEffect(() => {
    const handler = () => setTodayRecorded(true);
    window.addEventListener('kabunote-snapshot-created', handler);
    return () => window.removeEventListener('kabunote-snapshot-created', handler);
  }, []);

  // 上書きメニュー展開中に外側をタップしたら閉じる
  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isExpanded]);

  const handleSnapshot = async (isOverwrite: boolean) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/portfolio/snapshot', { method: 'POST' });
      if (res.ok) {
        playSound('noteSave');
        window.dispatchEvent(new Event('kabunote-snapshot-created'));
        setIsExpanded(false);
        setSuccessMessage(isOverwrite ? '更新しました！' : '記録しました！');
        setTimeout(() => {
          setIsHiding(true);
          setTimeout(() => {
            setTodayRecorded(true);
            setIsHiding(false);
            setSuccessMessage(null);
          }, 500);
        }, 1500);
      }
    } catch {
      // エラー時は何もしない
    } finally {
      setIsCreating(false);
    }
  };

  // 表示条件: 15時以降 かつ 記録状態確認済み（翌日0時に自動で非表示になる）
  if (!isAfter15 || !hasSnapshotReady || todayRecorded === null) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-28 md:bottom-24 right-6 z-40 transition-all duration-500 ${
        isHiding ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
      }`}
    >
      {successMessage ? (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-medium text-white bg-green-600"
          style={{
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <span className="text-lg">✅</span>
          {successMessage}
        </div>
      ) : todayRecorded === false ? (
        <button
          onClick={() => handleSnapshot(false)}
          disabled={isCreating}
          className="cursor-pointer flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-pulse hover:animate-none"
          style={{
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
          title="本日の終値を確定"
        >
          <span className="text-lg">📸</span>
          {isCreating ? '記録中...' : '本日の終値を確定'}
        </button>
      ) : isExpanded ? (
        <button
          onClick={() => handleSnapshot(true)}
          disabled={isCreating}
          className="cursor-pointer flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="本日の記録を最新データで上書き"
        >
          <span className="text-lg">🔄</span>
          {isCreating ? '更新中...' : '最新データで上書き'}
        </button>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="cursor-pointer w-10 h-10 rounded-full bg-gray-800/90 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 shadow-lg flex items-center justify-center transition-all active:scale-95"
          aria-label="本日記録済み（タップで上書き）"
          title="本日記録済み・タップで最新データに上書きできます"
        >
          <span className="text-base">✅</span>
        </button>
      )}
    </div>
  );
}
