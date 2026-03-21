'use client';

import { useState, useEffect } from 'react';
import { useGamification } from '@/hooks/auth/useGamification';
import { useTitles } from '@/hooks/auth/useTitles';
import type { XpActivityLogEntry } from '@/types/gamification';
import MenuItems from './menu/MenuItems';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  alertCounts: { total: number; urgent: number };
  onMenuItemClick: (action: string) => void;
}

export default function SlideOutMenu({ isOpen, onClose, alertCounts, onMenuItemClick }: SlideOutMenuProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const { gamification } = useGamification();
  const { titles } = useTitles();
  const [activityLogs, setActivityLogs] = useState<XpActivityLogEntry[]>([]);

  // レベル詳細セクション展開時にアクティビティログを取得
  useEffect(() => {
    if (expandedSections.has('level') && isOpen) {
      fetch('/api/gamification/activity')
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.data) setActivityLogs(data.data) })
        .catch(() => {})
    }
  }, [expandedSections, isOpen]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleMenuClick = (action: string) => {
    onMenuItemClick(action);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* バックドロップ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* メニュー本体 */}
      <div className="fixed top-0 right-0 h-full w-[85vw] max-w-80 bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">メニュー</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* メニュー項目 */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          <MenuItems
            gamification={gamification}
            titles={titles}
            activityLogs={activityLogs}
            alertCounts={alertCounts}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onMenuClick={handleMenuClick}
          />
        </nav>
      </div>
    </>
  );
}
