'use client';

import { useState, useRef } from 'react';
import { downloadKabunoteData, importFromFile, clearAllKabunoteData, exportKabunoteData } from '@/utils/dataManager';

interface DataManagerProps {
  onClose: () => void;
  onDataImported: () => void; // データインポート後にページをリロードするため
}

export default function DataManager({ onClose, onDataImported }: DataManagerProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; importedCount: number } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // エクスポート処理
  const handleExport = () => {
    try {
      downloadKabunoteData();
      setImportResult({
        success: true,
        message: 'データのエクスポートが完了しました。ファイルがダウンロードされます。',
        importedCount: 0
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: 'エクスポートに失敗しました。',
        importedCount: 0
      });
    }
  };

  // インポートファイル選択
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // インポート処理
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importFromFile(file);
      setImportResult(result);

      if (result.success) {
        // 少し待ってからページをリロード
        setTimeout(() => {
          onDataImported();
        }, 2000);
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: 'インポート中にエラーが発生しました。',
        importedCount: 0
      });
    } finally {
      setIsImporting(false);
      // ファイル入力をクリア
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 全データ削除
  const handleClearAll = () => {
    const deletedCount = clearAllKabunoteData();
    setImportResult({
      success: true,
      message: `全データを削除しました。${deletedCount}件のアイテムが削除されました。`,
      importedCount: 0
    });
    setShowClearConfirm(false);

    // 少し待ってからページをリロード
    setTimeout(() => {
      onDataImported();
    }, 2000);
  };

  // 現在のデータ統計を取得
  const getDataStats = () => {
    const data = exportKabunoteData();
    return {
      stocks: data.stocks.length,
      groups: data.favoriteGroups.length,
      totalMemos: Object.keys(data.memos).length,
      totalTags: Object.keys(data.tags).length,
      totalPositions: Object.keys(data.positions).length,
    };
  };

  const stats = getDataStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl border border-gray-600 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💾</span>
            データ管理
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-full w-8 h-8 flex items-center cursor-pointer justify-center hover:bg-gray-700"
            aria-label="モーダルを閉じる"
          >
            ×
          </button>
        </div>

        {/* 現在のデータ統計 */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">📊 現在のデータ</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.stocks}</div>
              <div className="text-gray-300">銘柄</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.groups}</div>
              <div className="text-gray-300">グループ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.totalMemos}</div>
              <div className="text-gray-300">株ノオト</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.totalTags}</div>
              <div className="text-gray-300">タグ設定</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.totalPositions}</div>
              <div className="text-gray-300">ポジション</div>
            </div>
          </div>
        </div>

        {/* 結果メッセージ表示 */}
        {importResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            importResult.success
              ? 'bg-green-900 bg-opacity-30 border-green-700 text-green-300'
              : 'bg-red-900 bg-opacity-30 border-red-700 text-red-300'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{importResult.success ? '✅' : '❌'}</span>
              <span className="font-medium">
                {importResult.success ? '成功' : 'エラー'}
              </span>
            </div>
            <p className="text-sm">{importResult.message}</p>
          </div>
        )}

        {/* データ操作ボタン */}
        <div className="space-y-4">
          {/* エクスポート */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <span>📤</span>
              データエクスポート
            </h3>
            <p className="text-blue-200 text-sm mb-4">
              現在の全データをJSONファイルとしてダウンロードします。
              バックアップやデータ移行に使用してください。
            </p>
            <button
              onClick={handleExport}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              📥 データをダウンロード
            </button>
          </div>

          {/* インポート */}
          <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center gap-2">
              <span>📥</span>
              データインポート
            </h3>
            <p className="text-green-200 text-sm mb-4">
              エクスポートしたJSONファイルからデータを復元します。
              <span className="font-medium text-green-100">既存データに上書き</span>されますのでご注意ください。
            </p>
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              {isImporting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  インポート中...
                </span>
              ) : (
                '📁 ファイルを選択してインポート'
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          {/* 全データ削除 */}
          <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-300 mb-2 flex items-center gap-2">
              <span>🗑️</span>
              全データ削除
            </h3>
            <p className="text-red-200 text-sm mb-4">
              localStorage に保存されている全てのKabunoteデータを削除します。
              <span className="font-medium text-red-100">この操作は取り消せません</span>のでご注意ください。
            </p>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                ⚠️ 全データを削除
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-800 bg-opacity-50 border border-red-600 rounded-lg p-3">
                  <p className="text-red-100 text-sm text-center font-medium">
                    本当に全データを削除しますか？
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    削除実行
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター情報 */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <p className="text-xs text-gray-400 text-center">
            💡 データはブラウザの localStorage に保存されています。
            定期的なバックアップを推奨します。
          </p>
        </div>
      </div>
    </div>
  );
}