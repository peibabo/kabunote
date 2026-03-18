'use client';

import { useState, useRef, useEffect } from 'react';
import { MEMO_TEMPLATES } from '@/types/memoTemplates';
import { playSound } from '@/lib/sound';

const MEMO_MAX_LENGTH = 2000;

interface MemoTemplateSelectorProps {
  onSelect: (content: string) => void;
  currentMemo: string;
}

export default function MemoTemplateSelector({ onSelect, currentMemo }: MemoTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null);
  const [overflowWarning, setOverflowWarning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setConfirmTemplate(null);
        setOverflowWarning(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  function handleTemplateClick(content: string) {
    if (currentMemo.trim() === '') {
      // メモが空なら即挿入
      if (content.length > MEMO_MAX_LENGTH) {
        setOverflowWarning(true);
        return;
      }
      playSound('select');
      onSelect(content);
      setIsOpen(false);
    } else {
      // 既存メモありなら確認表示
      setConfirmTemplate(content);
      setOverflowWarning(false);
    }
  }

  function handleAppend() {
    if (!confirmTemplate) return;
    const combined = currentMemo + '\n\n' + confirmTemplate;
    if (combined.length > MEMO_MAX_LENGTH) {
      setOverflowWarning(true);
      return;
    }
    playSound('select');
    onSelect(combined);
    setIsOpen(false);
    setConfirmTemplate(null);
    setOverflowWarning(false);
  }

  function handleOverwrite() {
    if (!confirmTemplate) return;
    if (confirmTemplate.length > MEMO_MAX_LENGTH) {
      setOverflowWarning(true);
      return;
    }
    playSound('select');
    onSelect(confirmTemplate);
    setIsOpen(false);
    setConfirmTemplate(null);
    setOverflowWarning(false);
  }

  function handleCancel() {
    setConfirmTemplate(null);
    setOverflowWarning(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); setConfirmTemplate(null); setOverflowWarning(false); }}
        className="text-xs cursor-pointer text-purple-400 hover:text-purple-300 transition-colors"
      >
        📋 テンプレート
      </button>

      {isOpen && (
        <div className="absolute bottom-6 left-0 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[200px]">
          {confirmTemplate ? (
            <div className="px-3 py-2 space-y-2">
              <p className="text-xs text-gray-300">既存のメモがあります</p>
              {overflowWarning && (
                <p className="text-xs text-red-400">2000文字を超えるため挿入できません</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleAppend}
                  className="cursor-pointer text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                >
                  末尾に追加
                </button>
                <button
                  onClick={handleOverwrite}
                  className="cursor-pointer text-xs px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors"
                >
                  上書き
                </button>
                <button
                  onClick={handleCancel}
                  className="cursor-pointer text-xs px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                >
                  戻る
                </button>
              </div>
            </div>
          ) : (
            <>
              {overflowWarning && (
                <p className="text-xs text-red-400 px-3 py-1">2000文字を超えるため挿入できません</p>
              )}
              {MEMO_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateClick(t.content)}
                  className="cursor-pointer w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
