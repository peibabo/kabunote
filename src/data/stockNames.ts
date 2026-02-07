// 銘柄データの型定義
export interface StockData {
  code: string;
  name: string;
  sector: string;
  market: string;
}

// CSVデータをキャッシュする変数
let stockDataCache: Map<string, StockData> | null = null;

// CSVファイルから銘柄データを読み込む関数
export const loadStockData = async (): Promise<Map<string, StockData>> => {
  // キャッシュがあれば返す
  if (stockDataCache) {
    return stockDataCache;
  }

  try {
    const response = await fetch('/data/stocks.csv');
    const csvText = await response.text();

    // 簡易的なCSVパーサー関数
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);

    const stockMap = new Map<string, StockData>();

    // ヘッダー行をスキップして処理
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 4) {
        const stockData: StockData = {
          code: values[0].trim(),
          name: values[1].trim(),
          sector: values[3].trim(),
          market: values[2].trim()
        };
        stockMap.set(values[0].trim(), stockData);
      }
    }

    // キャッシュに保存
    stockDataCache = stockMap;
    return stockMap;
  } catch (error) {
    console.error('Failed to load stock data:', error);
    // エラー時は空のMapを返す
    return new Map<string, StockData>();
  }
};

// 会社名を取得する関数（非同期版）
export const getCompanyName = async (code: string): Promise<string> => {
  const stockData = await loadStockData();
  const stock = stockData.get(code);
  return stock ? stock.name : '銘柄情報なし';
};

// 銘柄データを取得する関数
export const getStockData = async (code: string): Promise<StockData | null> => {
  const stockData = await loadStockData();
  return stockData.get(code) || null;
};

// 銘柄コードが登録されているかチェックする関数（非同期版）
export const isKnownStock = async (code: string): Promise<boolean> => {
  const stockData = await loadStockData();
  return stockData.has(code);
};

// 同期版の関数（キャッシュがある場合のみ）
export const getCompanyNameSync = (code: string): string => {
  if (!stockDataCache) {
    return '読み込み中...';
  }
  const stock = stockDataCache.get(code);
  return stock ? stock.name : '銘柄情報なし';
};

export const isKnownStockSync = (code: string): boolean => {
  if (!stockDataCache) {
    return false;
  }
  return stockDataCache.has(code);
};