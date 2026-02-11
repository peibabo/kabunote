'use client';

import { useState } from 'react';
import { Position } from '@/types/positions';

interface PositionManagerProps {
  positions: Position[];
  onPositionsChange: (positions: Position[]) => void;
  onClose: () => void;
}

export default function PositionManager({ positions, onPositionsChange, onClose }: PositionManagerProps) {
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    shares: '',
    purchasePrice: '',
    purchaseDate: '',
    memo: ''
  });

  const resetForm = () => {
    setFormData({
      shares: '',
      purchasePrice: '',
      purchaseDate: '',
      memo: ''
    });
    setEditingPosition(null);
  };

  const handleAddPosition = () => {
    if (!formData.shares || !formData.purchasePrice || !formData.purchaseDate) {
      return;
    }

    const newPosition: Position = {
      id: `pos-${Date.now()}`,
      shares: parseInt(formData.shares),
      purchasePrice: parseFloat(formData.purchasePrice),
      purchaseDate: formData.purchaseDate,
      memo: formData.memo.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onPositionsChange([...positions, newPosition]);
    resetForm();
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      shares: position.shares.toString(),
      purchasePrice: position.purchasePrice.toString(),
      purchaseDate: position.purchaseDate,
      memo: position.memo || ''
    });
  };

  const handleUpdatePosition = () => {
    if (!editingPosition || !formData.shares || !formData.purchasePrice || !formData.purchaseDate) {
      return;
    }

    const updatedPositions = positions.map(pos =>
      pos.id === editingPosition.id
        ? {
            ...pos,
            shares: parseInt(formData.shares),
            purchasePrice: parseFloat(formData.purchasePrice),
            purchaseDate: formData.purchaseDate,
            memo: formData.memo.trim() || undefined
          }
        : pos
    );

    onPositionsChange(updatedPositions);
    resetForm();
  };

  const handleDeletePosition = (positionId: string) => {
    if (!confirm('このポジションを削除しますか？')) return;

    const updatedPositions = positions.filter(pos => pos.id !== positionId);
    onPositionsChange(updatedPositions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">保有ポジション管理</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* ポジション追加・編集フォーム */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            {editingPosition ? 'ポジション編集' : 'ポジション追加'}
          </h4>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">保有株数（100株単位）</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.shares ? Math.floor(parseInt(formData.shares) / 100).toString() : ''}
                  onChange={(e) => {
                    const units = e.target.value;
                    const shares = units ? (parseInt(units) * 100).toString() : '';
                    setFormData({ ...formData, shares });
                  }}
                  placeholder="1"
                  title="100株単位で入力してください（例：1 = 100株、5 = 500株）"
                  min="1"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none pr-12"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">×100株</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">取得価額（1株）</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="1500"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-300 mb-1">取得日</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-300 mb-1">メモ（任意）</label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="取得時の状況などを記録..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2">
            {editingPosition ? (
              <>
                <button
                  onClick={handleUpdatePosition}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  更新
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <button
                onClick={handleAddPosition}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
              >
                追加
              </button>
            )}
          </div>
        </div>

        {/* ポジション一覧 */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">保有ポジション一覧</h4>

          {positions.length > 0 ? (
            <div className="space-y-2">
              {positions.map((position) => (
                <div key={position.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">株数：</span>
                          <span className="text-white">{position.shares.toLocaleString()}株</span>
                        </div>
                        <div>
                          <span className="text-gray-400">単価：</span>
                          <span className="text-white">{position.purchasePrice.toLocaleString()}円</span>
                        </div>
                        <div>
                          <span className="text-gray-400">取得日：</span>
                          <span className="text-white">{position.purchaseDate}</span>
                        </div>
                      </div>

                      <div className="mt-1 text-sm">
                        <span className="text-gray-400">投資額：</span>
                        <span className="text-blue-300 font-medium">
                          {(position.shares * position.purchasePrice).toLocaleString()}円
                        </span>
                      </div>

                      {position.memo && (
                        <div className="mt-2 text-xs text-gray-300 bg-gray-800 p-2 rounded">
                          {position.memo}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEditPosition(position)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeletePosition(position.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              まだポジションが登録されていません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}