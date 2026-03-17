'use client';

import { useState } from 'react';
import SoundSettings from '../settings/SoundSettings';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  alertCounts: { total: number; urgent: number };
  onMenuItemClick: (action: string) => void;
}

export default function SlideOutMenu({ isOpen, onClose, alertCounts, onMenuItemClick }: SlideOutMenuProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['analysis']));

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
        <nav className="p-4 space-y-2">
          {/* 開発者に機能要望を送る */}
          <button
            onClick={() => handleMenuClick('feedback')}
            className="w-full flex items-center space-x-3 p-3 text-left bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg transition-all cursor-pointer shadow-lg"
          >
            <span className="text-xl">📮</span>
            <span className="text-white font-medium">開発者に機能要望を送る</span>
          </button>

          {/* アラート一覧 */}
          <button
            onClick={() => handleMenuClick('alerts')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">🚨</span>
              <span className="text-white">アラート一覧</span>
            </div>
            {alertCounts.total > 0 && (
              <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${
                alertCounts.urgent > 0 ? 'bg-red-500' : 'bg-yellow-500'
              }`}>
                {alertCounts.total}
              </span>
            )}
          </button>

          {/* 分析・レポート */}
          <div>
            <button
              onClick={() => toggleSection('analysis')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📊</span>
                <span className="text-white">分析・レポート</span>
              </div>
              <span className={`text-gray-400 transition-transform ${
                expandedSections.has('analysis') ? 'rotate-90' : ''
              }`}>
                ▶
              </span>
            </button>

            {expandedSections.has('analysis') && (
              <div className="ml-8 mt-2 space-y-1">
                <button
                  onClick={() => handleMenuClick('strategy')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">🎯</span>
                  <span className="text-gray-300">戦略一覧</span>
                </button>
                <button
                  onClick={() => handleMenuClick('positions')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">💼</span>
                  <span className="text-gray-300">ポジション一覧</span>
                </button>
                <button
                  onClick={() => handleMenuClick('events')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">📅</span>
                  <span className="text-gray-300">イベント一覧</span>
                </button>
                <button
                  onClick={() => handleMenuClick('dividends')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">💰</span>
                  <span className="text-gray-300">配当・優待一覧</span>
                </button>
              </div>
            )}
          </div>

          {/* 設定・管理 */}
          <div>
            <button
              onClick={() => toggleSection('settings')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">⚙️</span>
                <span className="text-white">設定・管理</span>
              </div>
              <span className={`text-gray-400 transition-transform ${
                expandedSections.has('settings') ? 'rotate-90' : ''
              }`}>
                ▶
              </span>
            </button>

            {expandedSections.has('settings') && (
              <div className="ml-8 mt-2 space-y-1">
                <button
                  onClick={() => handleMenuClick('groups')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">👥</span>
                  <span className="text-gray-300">グループ管理</span>
                </button>
                <button
                  onClick={() => handleMenuClick('tags')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">🏷️</span>
                  <span className="text-gray-300">タグ管理</span>
                </button>
                <button
                  onClick={() => handleMenuClick('deleteAccount')}
                  className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-lg">🗑️</span>
                  <span className="text-red-400">アカウント削除</span>
                </button>

                {/* サウンド設定 */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <SoundSettings />
                </div>
              </div>
            )}
          </div>

          {/* ヘルプ・About */}
          <a
            href="/help"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-xl">ℹ️</span>
            <span className="text-white">ヘルプ・About</span>
          </a>

          {/* 利用規約 */}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-xl">📄</span>
            <span className="text-white">利用規約</span>
          </a>

          {/* プライバシーポリシー */}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-xl">🔒</span>
            <span className="text-white">プライバシーポリシー</span>
          </a>
        </nav>
      </div>
    </>
  );
}