'use client';

import { useState } from 'react';
import { useStockPosition } from '@/hooks/useStockPosition';
import { Position, calculatePositionSummary, formatPrice, formatShares } from '@/types/positions';

interface PositionsManagementProps {
  symbol: string;
  stockId: string;
  onPositionManagerOpen: () => void;
}

interface PositionForm {
  shares: string;
  purchasePrice: string;
  purchaseDate: string;
  memo: string;
}

const emptyForm: PositionForm = {
  shares: '',
  purchasePrice: '',
  purchaseDate: '',
  memo: ''
};

export default function PositionsManagement({
  symbol,
  stockId,
}: PositionsManagementProps) {
  const { positions, isLoading, isSaving, error, addPosition, updatePosition, deletePosition } = useStockPosition(stockId);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PositionForm>(emptyForm);

  const summary = calculatePositionSummary(positions);

  // フォームを開いて追加モード
  const handleAddClick = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsAdding(true);
  };

  // 編集モードを開始
  const handleEditClick = (pos: Position) => {
    setIsAdding(false);
    setEditingId(pos.id);
    setForm({
      shares: pos.shares.toString(),
      purchasePrice: pos.purchasePrice.toString(),
      purchaseDate: pos.purchaseDate || '',
      memo: pos.memo || ''
    });
  };

  // キャンセル
  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // 新規ポジション保存
  const handleAddSave = async () => {
    const shares = parseInt(form.shares);
    const purchasePrice = parseFloat(form.purchasePrice);
    if (!shares || shares <= 0 || !purchasePrice || purchasePrice <= 0) return;

    await addPosition({
      shares,
      purchasePrice,
      purchaseDate: form.purchaseDate || '',
      memo: form.memo || undefined
    });
    setIsAdding(false);
    setForm(emptyForm);
  };

  // 既存ポジション更新
  const handleEditSave = async () => {
    if (!editingId) return;
    const shares = parseInt(form.shares);
    const purchasePrice = parseFloat(form.purchasePrice);
    if (!shares || shares <= 0 || !purchasePrice || purchasePrice <= 0) return;

    await updatePosition(editingId, {
      shares,
      purchasePrice,
      purchaseDate: form.purchaseDate || '',
      memo: form.memo || undefined
    });
    setEditingId(null);
    setForm(emptyForm);
  };

  // 削除確認
  const handleDelete = async (id: string) => {
    if (!confirm('このポジションを削除しますか？')) return;
    await deletePosition(id);
  };

  const isFormValid = () => {
    const shares = parseInt(form.shares);
    const price = parseFloat(form.purchasePrice);
    return shares > 0 && price > 0;
  };

  return (
    <div className="space-y-4">
      {/* サマリーヘッダー */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">保有ポジション</h4>
        <button
          onClick={handleAddClick}
          disabled={isSaving}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
        >
          ＋ 追加
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="text-xs text-red-400 bg-red-900 bg-opacity-20 rounded px-2 py-1">
          ❌ {error}
        </div>
      )}

      {/* ローディング */}
      {isLoading ? (
        <div className="bg-gray-700 rounded-lg p-4 text-center text-gray-400">
          📊 読み込み中...
        </div>
      ) : (
        <>
          {/* ポジション合計サマリー */}
          {positions.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-3 space-y-2">
              <div className="text-xs text-gray-400 font-medium">合計（{summary.positionCount}ロット）</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-xs text-gray-400">保有株数</div>
                  <div className="text-white font-medium">{formatShares(summary.totalShares)}株</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">平均取得価額</div>
                  <div className="text-green-300 font-medium">{formatPrice(summary.averagePrice)}円</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">総投資額</div>
                  <div className="text-blue-300 font-medium">{formatPrice(summary.totalCost)}円</div>
                </div>
              </div>
            </div>
          )}

          {/* ポジション一覧 */}
          {positions.length === 0 && !isAdding && (
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-gray-400 mb-2">📊 ポジションが未登録です</div>
              <p className="text-xs text-gray-500 mb-3">
                保有株式を登録すると損益シミュレーションなどが利用できます
              </p>
              <button
                onClick={handleAddClick}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded transition-colors"
              >
                最初のポジションを追加
              </button>
            </div>
          )}

          {positions.map(pos => (
            <div key={pos.id} className="bg-gray-700 rounded-lg p-3">
              {editingId === pos.id ? (
                // 編集フォーム
                <PositionFormFields
                  form={form}
                  onChange={setForm}
                  onSave={handleEditSave}
                  onCancel={handleCancel}
                  isSaving={isSaving}
                  isValid={isFormValid()}
                  label="ポジションを更新"
                />
              ) : (
                // 表示モード
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex gap-4 text-sm">
                      <span>
                        <span className="text-gray-400">株数: </span>
                        <span className="text-white">{pos.shares.toLocaleString()}株</span>
                      </span>
                      <span>
                        <span className="text-gray-400">単価: </span>
                        <span className="text-green-300">{formatPrice(pos.purchasePrice)}円</span>
                      </span>
                      <span>
                        <span className="text-gray-400">計: </span>
                        <span className="text-blue-300">{formatPrice(pos.shares * pos.purchasePrice)}円</span>
                      </span>
                    </div>
                    {pos.purchaseDate && (
                      <div className="text-xs text-gray-400">取得日: {pos.purchaseDate}</div>
                    )}
                    {pos.memo && (
                      <div className="text-xs text-gray-400 truncate">メモ: {pos.memo}</div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <button
                      onClick={() => handleEditClick(pos)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(pos.id)}
                      disabled={isSaving}
                      className="text-xs text-red-400 hover:text-red-300 disabled:text-gray-500 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 追加フォーム */}
          {isAdding && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-300 mb-3">新規ポジションを追加</h5>
              <PositionFormFields
                form={form}
                onChange={setForm}
                onSave={handleAddSave}
                onCancel={handleCancel}
                isSaving={isSaving}
                isValid={isFormValid()}
                label="追加"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// フォームフィールドの共通コンポーネント
function PositionFormFields({
  form,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isValid,
  label
}: {
  form: PositionForm;
  onChange: (f: PositionForm) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isValid: boolean;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            株数 <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={form.shares}
            onChange={(e) => onChange({ ...form, shares: e.target.value })}
            placeholder="100"
            min="1"
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            取得単価（円） <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={form.purchasePrice}
            onChange={(e) => onChange({ ...form, purchasePrice: e.target.value })}
            placeholder="1500"
            min="0.01"
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">取得日</label>
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(e) => onChange({ ...form, purchaseDate: e.target.value })}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">メモ</label>
          <input
            type="text"
            value={form.memo}
            onChange={(e) => onChange({ ...form, memo: e.target.value })}
            placeholder="任意のメモ"
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* プレビュー */}
      {form.shares && form.purchasePrice && (
        <div className="text-xs text-gray-400 bg-gray-800 rounded px-2 py-1">
          投資額: {formatPrice(parseInt(form.shares || '0') * parseFloat(form.purchasePrice || '0'))}円
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving || !isValid}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
        >
          {isSaving ? '保存中...' : label}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
