export interface KabunoteData {
  // メタデータ
  exportDate: string;
  version: string;

  // 銘柄関連データ
  stocks: string[];
  stocksOrder: string[];

  // 銘柄別データ
  memos: Record<string, string>;
  tags: Record<string, any[]>;
  targetPrices: Record<string, string>;
  stopLosses: Record<string, string>;
  currentPrices: Record<string, string>;
  earningsDates: Record<string, string>;
  rightsSettings: Record<string, string>;
  positions: Record<string, any[]>;
  activeTabs: Record<string, string>;
  dividendPerShare: Record<string, string>;
  dividendFrequency: Record<string, string>;

  // グローバル設定
  favoriteGroups: any[];
  selectedGroupFilter: string | null;
}

/**
 * localStorage から全ての Kabunote データを取得してエクスポート用オブジェクトを作成
 */
export const exportKabunoteData = (): KabunoteData => {
  const data: KabunoteData = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    stocks: [],
    stocksOrder: [],
    memos: {},
    tags: {},
    targetPrices: {},
    stopLosses: {},
    currentPrices: {},
    earningsDates: {},
    rightsSettings: {},
    positions: {},
    activeTabs: {},
    dividendPerShare: {},
    dividendFrequency: {},
    favoriteGroups: [],
    selectedGroupFilter: null,
  };

  // localStorage の全アイテムを走査
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('kabunote-')) continue;

    const value = localStorage.getItem(key);
    if (!value) continue;

    try {
      // キーの種類に応じて適切なカテゴリに分類
      if (key === 'kabunote-stocks') {
        data.stocks = JSON.parse(value);
      } else if (key === 'kabunote-stocks-order') {
        data.stocksOrder = JSON.parse(value);
      } else if (key === 'kabunote-favorite-groups') {
        data.favoriteGroups = JSON.parse(value);
      } else if (key === 'kabunote-selected-group-filter') {
        data.selectedGroupFilter = JSON.parse(value);
      } else if (key.startsWith('kabunote-memo-')) {
        const symbol = key.replace('kabunote-memo-', '');
        data.memos[symbol] = value; // メモは文字列のまま保存
      } else if (key.startsWith('kabunote-tags-')) {
        const symbol = key.replace('kabunote-tags-', '');
        data.tags[symbol] = JSON.parse(value);
      } else if (key.startsWith('kabunote-target-price-')) {
        const symbol = key.replace('kabunote-target-price-', '');
        data.targetPrices[symbol] = value;
      } else if (key.startsWith('kabunote-stop-loss-')) {
        const symbol = key.replace('kabunote-stop-loss-', '');
        data.stopLosses[symbol] = value;
      } else if (key.startsWith('kabunote-current-price-')) {
        const symbol = key.replace('kabunote-current-price-', '');
        data.currentPrices[symbol] = value;
      } else if (key.startsWith('kabunote-earnings-date-')) {
        const symbol = key.replace('kabunote-earnings-date-', '');
        data.earningsDates[symbol] = value;
      } else if (key.startsWith('kabunote-rights-settings-')) {
        const symbol = key.replace('kabunote-rights-settings-', '');
        data.rightsSettings[symbol] = value;
      } else if (key.startsWith('kabunote-positions-')) {
        const symbol = key.replace('kabunote-positions-', '');
        data.positions[symbol] = JSON.parse(value);
      } else if (key.startsWith('kabunote-active-tab-')) {
        const symbol = key.replace('kabunote-active-tab-', '');
        data.activeTabs[symbol] = value;
      } else if (key.startsWith('kabunote-dividend-per-share-')) {
        const symbol = key.replace('kabunote-dividend-per-share-', '');
        data.dividendPerShare[symbol] = value;
      } else if (key.startsWith('kabunote-dividend-frequency-')) {
        const symbol = key.replace('kabunote-dividend-frequency-', '');
        data.dividendFrequency[symbol] = value;
      }
    } catch (error) {
      console.warn(`Failed to parse localStorage key: ${key}`, error);
    }
  }

  return data;
};

/**
 * エクスポートされたデータを JSON ファイルとしてダウンロード
 */
export const downloadKabunoteData = () => {
  const data = exportKabunoteData();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kabunote-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * インポートされたデータを localStorage に保存
 */
export const importKabunoteData = (data: KabunoteData): { success: boolean; message: string; importedCount: number } => {
  try {
    let importedCount = 0;

    // 基本データの復元
    if (data.stocks && Array.isArray(data.stocks)) {
      localStorage.setItem('kabunote-stocks', JSON.stringify(data.stocks));
      importedCount++;
    }

    if (data.stocksOrder && Array.isArray(data.stocksOrder)) {
      localStorage.setItem('kabunote-stocks-order', JSON.stringify(data.stocksOrder));
      importedCount++;
    }

    if (data.favoriteGroups && Array.isArray(data.favoriteGroups)) {
      localStorage.setItem('kabunote-favorite-groups', JSON.stringify(data.favoriteGroups));
      importedCount++;
    }

    if (data.selectedGroupFilter !== undefined) {
      localStorage.setItem('kabunote-selected-group-filter', JSON.stringify(data.selectedGroupFilter));
      importedCount++;
    }

    // 銘柄別データの復元
    if (data.memos && typeof data.memos === 'object') {
      Object.entries(data.memos).forEach(([symbol, memo]) => {
        localStorage.setItem(`kabunote-memo-${symbol}`, memo);
        importedCount++;
      });
    }

    if (data.tags && typeof data.tags === 'object') {
      Object.entries(data.tags).forEach(([symbol, tags]) => {
        localStorage.setItem(`kabunote-tags-${symbol}`, JSON.stringify(tags));
        importedCount++;
      });
    }

    if (data.targetPrices && typeof data.targetPrices === 'object') {
      Object.entries(data.targetPrices).forEach(([symbol, price]) => {
        localStorage.setItem(`kabunote-target-price-${symbol}`, price);
        importedCount++;
      });
    }

    if (data.stopLosses && typeof data.stopLosses === 'object') {
      Object.entries(data.stopLosses).forEach(([symbol, price]) => {
        localStorage.setItem(`kabunote-stop-loss-${symbol}`, price);
        importedCount++;
      });
    }

    if (data.currentPrices && typeof data.currentPrices === 'object') {
      Object.entries(data.currentPrices).forEach(([symbol, price]) => {
        localStorage.setItem(`kabunote-current-price-${symbol}`, price);
        importedCount++;
      });
    }

    if (data.earningsDates && typeof data.earningsDates === 'object') {
      Object.entries(data.earningsDates).forEach(([symbol, date]) => {
        localStorage.setItem(`kabunote-earnings-date-${symbol}`, date);
        importedCount++;
      });
    }

    if (data.rightsSettings && typeof data.rightsSettings === 'object') {
      Object.entries(data.rightsSettings).forEach(([symbol, settings]) => {
        localStorage.setItem(`kabunote-rights-settings-${symbol}`, settings);
        importedCount++;
      });
    }

    if (data.positions && typeof data.positions === 'object') {
      Object.entries(data.positions).forEach(([symbol, positions]) => {
        localStorage.setItem(`kabunote-positions-${symbol}`, JSON.stringify(positions));
        importedCount++;
      });
    }

    if (data.activeTabs && typeof data.activeTabs === 'object') {
      Object.entries(data.activeTabs).forEach(([symbol, tab]) => {
        localStorage.setItem(`kabunote-active-tab-${symbol}`, tab);
        importedCount++;
      });
    }

    if (data.dividendPerShare && typeof data.dividendPerShare === 'object') {
      Object.entries(data.dividendPerShare).forEach(([symbol, dividend]) => {
        localStorage.setItem(`kabunote-dividend-per-share-${symbol}`, dividend);
        importedCount++;
      });
    }

    if (data.dividendFrequency && typeof data.dividendFrequency === 'object') {
      Object.entries(data.dividendFrequency).forEach(([symbol, frequency]) => {
        localStorage.setItem(`kabunote-dividend-frequency-${symbol}`, frequency);
        importedCount++;
      });
    }

    return {
      success: true,
      message: `データのインポートが完了しました。${importedCount}件のアイテムを復元しました。`,
      importedCount
    };

  } catch (error) {
    console.error('Import failed:', error);
    return {
      success: false,
      message: 'データのインポートに失敗しました。ファイル形式を確認してください。',
      importedCount: 0
    };
  }
};

/**
 * ファイル選択からデータをインポート
 */
export const importFromFile = (file: File): Promise<{ success: boolean; message: string; importedCount: number }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const data: KabunoteData = JSON.parse(jsonString);

        // 基本的な構造チェック
        if (!data.exportDate || !data.version) {
          resolve({
            success: false,
            message: 'Kabunoteのバックアップファイルではありません。',
            importedCount: 0
          });
          return;
        }

        const result = importKabunoteData(data);
        resolve(result);

      } catch (error) {
        console.error('File parsing failed:', error);
        resolve({
          success: false,
          message: 'ファイルの読み込みに失敗しました。JSON形式を確認してください。',
          importedCount: 0
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        message: 'ファイルの読み込みエラーが発生しました。',
        importedCount: 0
      });
    };

    reader.readAsText(file);
  });
};

/**
 * localStorage の全 Kabunote データを削除
 */
export const clearAllKabunoteData = (): number => {
  const keys = [];

  // kabunote- で始まるキーを収集
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('kabunote-')) {
      keys.push(key);
    }
  }

  // 収集したキーを削除
  keys.forEach(key => localStorage.removeItem(key));

  return keys.length;
};