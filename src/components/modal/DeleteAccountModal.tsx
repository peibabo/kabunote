'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONFIRMATION_TEXT = 'アカウント削除';

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const supabase = createClient();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const isConfirmed = confirmText === CONFIRMATION_TEXT;

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setError('');

    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'アカウント削除に失敗しました');
      }

      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アカウント削除に失敗しました');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-red-400">アカウント削除</h2>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm font-medium mb-2">この操作は取り消せません</p>
            <p className="text-red-200 text-sm">
              アカウントを削除すると、以下のデータがすべて完全に削除され、復元できません。
            </p>
            <ul className="text-red-200 text-sm mt-2 list-disc list-inside space-y-1">
              <li>登録銘柄・メモ・タグ</li>
              <li>保有ポジション・イベント</li>
              <li>配当・優待・アラート設定</li>
              <li>投資戦略・分析データ</li>
            </ul>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">
              確認のため「<span className="text-white font-medium">{CONFIRMATION_TEXT}</span>」と入力してください
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRMATION_TEXT}
              disabled={isDeleting}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-600 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="cursor-pointer flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="cursor-pointer flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  削除中...
                </>
              ) : (
                '削除する'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
