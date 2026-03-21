'use client';

import { useState } from 'react';
import { playSound } from '@/lib/sound';
import { useStockPosition } from '@/hooks/stock/useStockPosition';
import { Position } from '@/types/positions';
import { calculatePositionSummary, formatPrice, formatShares } from '@/lib/positionCalc';
import PositionFormFields, { PositionForm, emptyForm } from './positions/PositionFormFields';
import PositionListItem from './positions/PositionListItem';

interface PositionsManagementProps {
  symbol: string;
  stockId: string;
  onPositionManagerOpen: () => void;
  initialPositions?: Position[];
}

export default function PositionsManagement({
  stockId,
  initialPositions,
}: PositionsManagementProps) {
  const { positions, isLoading, isSaving, error, addPosition, updatePosition, deletePosition } = useStockPosition(stockId, initialPositions ? { initialData: initialPositions } : undefined);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PositionForm>(emptyForm);

  const summary = calculatePositionSummary(positions);

  const handleAddClick = () => {
    playSound('buttonAction');
    setEditingId(null);
    setForm(emptyForm);
    setIsAdding(true);
  };

  const handleEditClick = (pos: Position) => {
    setIsAdding(false);
    setEditingId(pos.id);
    setForm({
      shares: pos.shares.toString(),
      purchasePrice: pos.purchasePrice.toString(),
      purchaseDate: pos.purchaseDate || '',
      memo: pos.memo || '',
      isNisa: pos.taxRate === 0
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleAddSave = async () => {
    const shares = parseInt(form.shares);
    const purchasePrice = parseFloat(form.purchasePrice);
    if (!shares || shares <= 0 || !purchasePrice || purchasePrice <= 0) return;

    playSound('buttonAction');
    await addPosition({
      shares,
      purchasePrice,
      purchaseDate: form.purchaseDate || '',
      memo: form.memo || undefined,
      taxRate: form.isNisa ? 0 : 0.20315
    });
    setIsAdding(false);
    setForm(emptyForm);
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    const shares = parseInt(form.shares);
    const purchasePrice = parseFloat(form.purchasePrice);
    if (!shares || shares <= 0 || !purchasePrice || purchasePrice <= 0) return;

    playSound('buttonAction');
    await updatePosition(editingId, {
      shares,
      purchasePrice,
      purchaseDate: form.purchaseDate || '',
      memo: form.memo || undefined,
      taxRate: form.isNisa ? 0 : 0.20315
    });
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このポジションを削除しますか？')) return;
    playSound('buttonDelete');
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
          className="cursor-pointer text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-2 py-1 rounded transition-colors"
        >
          ＋ 追加
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="text-xs text-red-400 bg-red-900 bg-opacity-20 rounded px-2 py-1">
          {'\u274C'} {error}
        </div>
      )}

      {/* ローディング */}
      {isLoading ? (
        <div className="bg-gray-700 rounded-lg p-4 text-center text-gray-400">
          {'\u{1F4CA}'} 読み込み中...
        </div>
      ) : (
        <>
          {/* ポジション合計サマリー */}
          {positions.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-3 space-y-2">
              <div className="text-xs text-gray-400 font-medium">合計（{summary.positionCount}ロット）</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
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
              <div className="text-gray-400 mb-2">{'\u{1F4CA}'} ポジションが未登録です</div>
              <p className="text-xs text-gray-500 mb-3">
                保有株式を登録すると損益シミュレーションなどが利用できます
              </p>
              <button
                onClick={handleAddClick}
                className="cursor-pointer text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded transition-colors"
              >
                最初のポジションを追加
              </button>
            </div>
          )}

          {positions.map(pos => (
            <PositionListItem
              key={pos.id}
              pos={pos}
              editingId={editingId}
              form={form}
              onFormChange={setForm}
              onEditClick={handleEditClick}
              onEditSave={handleEditSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
              isSaving={isSaving}
              isFormValid={isFormValid()}
            />
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
