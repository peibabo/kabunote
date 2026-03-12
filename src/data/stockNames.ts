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

export const getSectorSync = (code: string): string | null => {
  if (!stockDataCache) return null;
  const stock = stockDataCache.get(code);
  return stock?.sector || null;
};

// 日本語をローマ字に変換するマッピング（簡易版）
const toRomaji = (text: string): string => {
  const romajiMap: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'ざ': 'za', 'じ': 'zi', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'だ': 'da', 'ぢ': 'di', 'づ': 'du', 'で': 'de', 'ど': 'do',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'ー': '-'
  };

  return text.toLowerCase().split('').map(char => romajiMap[char] || char).join('');
};

// 全角・半角を正規化する関数
const normalizeText = (text: string): string => {
  return text
    // 全角英数字を半角に変換
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    })
    // カタカナをひらがなに変換
    .replace(/[\u30A1-\u30F6]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0x60);
    })
    .toLowerCase();
};

// 会社名で部分一致検索する関数（日本語・ローマ字・英語対応）
export const searchCompanies = async (query: string, limit: number = 10): Promise<StockData[]> => {
  const stockData = await loadStockData();

  if (!query.trim()) {
    return [];
  }

  const searchQuery = normalizeText(query);
  const results: StockData[] = [];
  const seen = new Set<string>();

  for (const stock of stockData.values()) {
    if (seen.has(stock.code)) continue;

    const companyName = normalizeText(stock.name);
    const companyRomaji = toRomaji(companyName);

    // 正規化した名前での部分一致、または、ローマ字での部分一致
    if (companyName.includes(searchQuery) || companyRomaji.includes(searchQuery)) {
      results.push(stock);
      seen.add(stock.code);
      if (results.length >= limit) {
        break;
      }
    }
  }

  return results;
};

// 同期版の会社名検索（キャッシュがある場合のみ）
export const searchCompaniesSync = (query: string, limit: number = 10): StockData[] => {
  if (!stockDataCache || !query.trim()) {
    return [];
  }

  const searchQuery = normalizeText(query);
  const results: StockData[] = [];
  const seen = new Set<string>();

  for (const stock of stockDataCache.values()) {
    if (seen.has(stock.code)) continue;

    const companyName = normalizeText(stock.name);
    const companyRomaji = toRomaji(companyName);

    // 正規化した名前での部分一致、または、ローマ字での部分一致
    if (companyName.includes(searchQuery) || companyRomaji.includes(searchQuery)) {
      results.push(stock);
      seen.add(stock.code);
      if (results.length >= limit) {
        break;
      }
    }
  }

  return results;
};