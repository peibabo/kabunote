'use client';

import { Position } from '@/types/positions';
import { formatPrice } from '@/lib/positionCalc';
import PositionFormFields, { PositionForm } from './PositionFormFields';

interface PositionListItemProps {
  pos: Position;
  editingId: string | null;
  form: PositionForm;
  onFormChange: (f: PositionForm) => void;
  onEditClick: (pos: Position) => void;
  onEditSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  isFormValid: boolean;
}

export default function PositionListItem({
  pos,
  editingId,
  form,
  onFormChange,
  onEditClick,
  onEditSave,
  onCancel,
  onDelete,
  isSaving,
  isFormValid,
}: PositionListItemProps) {
  return (
    <div className="bg-gray-700 rounded-lg p-3">
      {editingId === pos.id ? (
        <PositionFormFields
          form={form}
          onChange={onFormChange}
          onSave={onEditSave}
          onCancel={onCancel}
          isSaving={isSaving}
          isValid={isFormValid}
          label="ポジションを更新"
        />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              {pos.taxRate === 0 && (
                <span className="text-xs bg-green-900 text-green-300 border border-green-700 px-1.5 py-0.5 rounded">NISA</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEditClick(pos)}
                className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                編集
              </button>
              <button
                onClick={() => onDelete(pos.id)}
                disabled={isSaving}
                className="cursor-pointer text-xs text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                削除
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-gray-400 text-xs">株数</div>
              <div className="text-white">{pos.shares.toLocaleString()}株</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">単価</div>
              <div className="text-green-300">{formatPrice(pos.purchasePrice)}円</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">計</div>
              <div className="text-blue-300">{formatPrice(pos.shares * pos.purchasePrice)}円</div>
            </div>
          </div>
          {pos.purchaseDate && (
            <div className="text-xs text-gray-400">取得日: {pos.purchaseDate}</div>
          )}
          {pos.memo && (
            <div className="text-xs text-gray-400 truncate">メモ: {pos.memo}</div>
          )}
        </div>
      )}
    </div>
  );
}
