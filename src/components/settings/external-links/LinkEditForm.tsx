'use client';

import {
  GRADIENT_PRESETS,
  ICON_PRESETS,
  MAX_LINK_LABEL_LENGTH,
  MAX_LINK_URL_LENGTH,
} from '@/lib/defaultExternalLinks';

export interface EditingLink {
  url: string;
  label: string;
  icon: string;
  gradient: string;
}

export interface LinkEditFormProps {
  isAdding: boolean;
  editForm: EditingLink;
  onEditFormChange: (form: EditingLink) => void;
  onSave: () => void;
  onCancel: () => void;
}

function isFormValid(editForm: EditingLink): boolean {
  try {
    const url = new URL(editForm.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  } catch {
    return false;
  }
  return (
    editForm.url.length <= MAX_LINK_URL_LENGTH &&
    editForm.label.trim().length > 0 &&
    editForm.label.length <= MAX_LINK_LABEL_LENGTH &&
    editForm.icon.trim().length > 0
  );
}

export default function LinkEditForm({ isAdding, editForm, onEditFormChange, onSave, onCancel }: LinkEditFormProps) {
  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4 space-y-3">
      <div className="text-sm font-medium text-gray-300 mb-2">
        {isAdding ? 'リンクを追加' : 'リンクを編集'}
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">ラベル</label>
        <input
          type="text"
          value={editForm.label}
          onChange={(e) => onEditFormChange({ ...editForm, label: e.target.value })}
          placeholder="例: Yahoo!ファイナンス"
          maxLength={MAX_LINK_LABEL_LENGTH}
          className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">URL</label>
        <input
          type="url"
          value={editForm.url}
          onChange={(e) => onEditFormChange({ ...editForm, url: e.target.value })}
          placeholder="https://..."
          className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">アイコン</label>
        <div className="flex flex-wrap gap-1.5">
          {ICON_PRESETS.map((icon) => (
            <button
              key={icon}
              onClick={() => onEditFormChange({ ...editForm, icon })}
              className={`cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                editForm.icon === icon ? 'bg-gray-500 ring-2 ring-white scale-110' : 'bg-gray-600 hover:bg-gray-500 opacity-60 hover:opacity-100'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">カラー</label>
        <div className="flex flex-wrap gap-2">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onEditFormChange({ ...editForm, gradient: preset.value })}
              className={`cursor-pointer w-8 h-8 rounded-full bg-gradient-to-r ${preset.value} transition-all ${
                editForm.gradient === preset.value ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-700 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              title={preset.label}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="cursor-pointer px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={onSave}
          disabled={!isFormValid(editForm)}
          className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? '追加' : '更新'}
        </button>
      </div>
    </div>
  );
}
