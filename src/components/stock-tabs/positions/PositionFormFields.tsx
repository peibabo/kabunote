'use client';

import { formatPrice } from '@/lib/positionCalc';

export interface PositionForm {
  shares: string;
  purchasePrice: string;
  purchaseDate: string;
  memo: string;
  isNisa: boolean;
}

export const emptyForm: PositionForm = {
  shares: '',
  purchasePrice: '',
  purchaseDate: '',
  memo: '',
  isNisa: false
};

interface PositionFormFieldsProps {
  form: PositionForm;
  onChange: (f: PositionForm) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isValid: boolean;
  label: string;
}

export default function PositionFormFields({
  form,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isValid,
  label
}: PositionFormFieldsProps) {
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

      {/* NISA口座トグル */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange({ ...form, isNisa: !form.isNisa })}
          className={`cursor-pointer relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            form.isNisa ? 'bg-green-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              form.isNisa ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="text-sm text-gray-300">NISA口座（非課税）</span>
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
          className="cursor-pointer px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
        >
          {isSaving ? '保存中...' : label}
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
