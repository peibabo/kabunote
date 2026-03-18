'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/apiClient';
import { toast } from '@/lib/toast';
import { playSound } from '@/lib/sound';
import { grantXp } from '@/lib/gamification';
import { FEEDBACK_CATEGORIES } from '@/lib/feedbackCategories';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = FEEDBACK_CATEGORIES;

const MAX_LENGTH = 1000;

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<string>('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = category !== '' && content.trim().length > 0 && content.length <= MAX_LENGTH;

  const handleClose = () => {
    if (isSending) return;
    setCategory('');
    setContent('');
    setError('');
    setIsSending(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSending) return;

    setIsSending(true);
    setError('');

    try {
      await apiPost('/api/feedback', { category, content: content.trim() });
      playSound('buttonAction');
      grantXp('FEEDBACK');
      setIsSending(false);
      handleClose();
      toast.success('ご意見ありがとうございます！今後の改善に活かしていきます 🙏');
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">📮 目安箱</h2>
            <button
              onClick={handleClose}
              disabled={isSending}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-4">
            機能の要望や改善のアイデアなど、お気軽にお聞かせください。
          </p>

          {/* カテゴリ選択 */}
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">カテゴリ</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); playSound('select'); }}
                  disabled={isSending}
                  className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === cat.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* テキストエリア */}
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ご意見・ご要望をお書きください..."
              disabled={isSending}
              rows={5}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none"
            />
            <div className={`text-xs text-right mt-1 ${
              content.length > MAX_LENGTH ? 'text-red-400' : 'text-gray-500'
            }`}>
              {content.length} / {MAX_LENGTH}
            </div>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-600 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSending}
              className="cursor-pointer flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSending}
              className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  送信中...
                </>
              ) : (
                '送信する'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
