'use client';

import { useState, useEffect } from 'react';
import StockCard from '@/components/StockCard';
import StockInput from '@/components/StockInput';
import FavoriteGroupManager from '@/components/FavoriteGroupManager';
import SearchBar from '@/components/SearchBar';
import { loadStockData, getStockData } from '@/data/stockNames';
import { FavoriteGroup, GROUP_COLORS } from '@/types/favorites';

const MAX_STOCKS = 5;
const STORAGE_KEY = 'kabunote-stocks';
const GROUPS_STORAGE_KEY = 'kabunote-favorite-groups';

export default function Home() {
  const [stocks, setStocks] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [favoriteGroups, setFavoriteGroups] = useState<FavoriteGroup[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // デバッグ用
  console.log('Current favoriteGroups state:', favoriteGroups);

  useEffect(() => {
    const initializeApp = async () => {
      // CSVデータを事前読み込み
      try {
        await loadStockData();
        console.log('Stock data preloaded successfully');
      } catch (error) {
        console.error('Failed to preload stock data:', error);
      }

      // クライアントサイドでのみlocalStorageにアクセス
      if (typeof window !== 'undefined') {
        // 保存されている銘柄を読み込み
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsedStocks = JSON.parse(saved);
            setStocks(parsedStocks);
            console.log('Loaded stocks:', parsedStocks);
          } catch (e) {
            console.error('Failed to load saved stocks:', e);
          }
        }

        // 保存されているお気に入りグループを読み込み
        const savedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
        console.log('Raw saved groups from localStorage:', savedGroups);
        if (savedGroups) {
          try {
            const parsedGroups = JSON.parse(savedGroups);
            console.log('Parsed groups:', parsedGroups);
            setFavoriteGroups(parsedGroups);
          } catch (e) {
            console.error('Failed to load saved groups:', e);
          }
        } else {
          console.log('No saved groups found in localStorage');
        }
      }

      setIsInitialized(true);
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
      console.log('Saved stocks:', stocks);
    }
  }, [stocks, isInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      const groupsJson = JSON.stringify(favoriteGroups);
      localStorage.setItem(GROUPS_STORAGE_KEY, groupsJson);
      console.log('Saving groups to localStorage:', favoriteGroups);
      console.log('JSON string saved:', groupsJson);

      // 確認のため即座に読み戻し
      const verification = localStorage.getItem(GROUPS_STORAGE_KEY);
      console.log('Verification read:', verification);
    }
  }, [favoriteGroups, isInitialized]);

  const handleAddStock = (code: string) => {
    if (stocks.length >= MAX_STOCKS) {
      setError(`最大${MAX_STOCKS}銘柄まで表示できます`);
      return;
    }

    if (stocks.includes(code)) {
      setError('この銘柄は既に追加されています');
      return;
    }

    setStocks([...stocks, code]);
    setError('');
  };

  const handleRemoveStock = (code: string) => {
    setStocks(stocks.filter(stock => stock !== code));
    setError('');

    // クライアントサイドでのみlocalStorageにアクセス
    if (typeof window !== 'undefined') {
      // メモも削除
      localStorage.removeItem(`kabunote-memo-${code}`);
      // タグも削除
      localStorage.removeItem(`kabunote-tags-${code}`);
    }

    // お気に入りグループからも削除
    const updatedGroups = favoriteGroups.map(group => ({
      ...group,
      stocks: group.stocks.filter(s => s !== code)
    }));
    setFavoriteGroups(updatedGroups);
  };

  // 検索機能
  const searchStocks = async (stocks: string[], query: string): Promise<string[]> => {
    if (!query || query.length < 2) return stocks;

    // クエリを正規化（全角→半角、大文字→小文字、カタカナ→ひらがな）
    const normalizedQuery = query
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
      })
      .replace(/[\u30A1-\u30F6]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0x60);
      })
      .toLowerCase();

    const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 0);

    // 株式データを事前に読み込み
    await loadStockData();

    const results: string[] = [];

    for (const stockCode of stocks) {
      // 検索対象データを準備
      const stockInfo = await getStockData(stockCode);

      const searchData = {
        code: stockCode,
        // 会社名を取得
        name: stockInfo?.name || '',
        // 業種を取得
        sector: stockInfo?.sector || '',
        // 市場を取得
        market: stockInfo?.market || '',
        // メモを取得
        memo: typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-memo-${stockCode}`) || ''
          : '',
        // タグを取得
        tags: typeof window !== 'undefined'
          ? (() => {
              try {
                const savedTags = localStorage.getItem(`kabunote-tags-${stockCode}`);
                return savedTags ? JSON.parse(savedTags).map((tag: any) => tag.label).join(' ') : '';
              } catch {
                return '';
              }
            })()
          : '',
        // グループ名を取得
        groups: favoriteGroups
          .filter(group => group.stocks.includes(stockCode))
          .map(group => group.name)
          .join(' ')
      };

      // 検索対象テキストを結合して正規化
      const searchText = [
        searchData.code,
        searchData.name,
        searchData.sector,
        searchData.market,
        searchData.memo,
        searchData.tags,
        searchData.groups
      ].join(' ')
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
          return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
        })
        .replace(/[\u30A1-\u30F6]/g, (char) => {
          return String.fromCharCode(char.charCodeAt(0) - 0x60);
        })
        .toLowerCase();

      // すべての検索語が含まれているかチェック（AND検索）
      if (searchTerms.every(term => searchText.includes(term))) {
        results.push(stockCode);
      }
    }

    return results;
  };

  // 検索処理のuseEffect
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        // グループフィルターが適用されている場合はそれを考慮
        const baseStocks = selectedGroupFilter
          ? stocks.filter(stock => {
              const group = favoriteGroups.find(g => g.id === selectedGroupFilter);
              return group?.stocks.includes(stock);
            })
          : stocks;

        const results = await searchStocks(baseStocks, searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, stocks, selectedGroupFilter, favoriteGroups]);

  // フィルタリングされた株式リスト
  const filteredStocks = searchQuery.trim()
    ? searchResults
    : selectedGroupFilter
    ? stocks.filter(stock => {
        const group = favoriteGroups.find(g => g.id === selectedGroupFilter);
        return group?.stocks.includes(stock);
      })
    : stocks;

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">カブノオト</h1>
              <p className="text-gray-400">投資家の思考を整理するダッシュボード</p>
            </div>
            <div className="md:w-80">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>

          {/* 検索結果表示 */}
          {searchQuery.trim() && (
            <div className="bg-gray-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSearching && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  )}
                  <p className="text-sm text-gray-300">
                    「<span className="text-blue-400 font-medium">{searchQuery}</span>」の検索結果: {isSearching ? '検索中...' : `${filteredStocks.length}件`}
                  </p>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  検索をクリア
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">銘柄を追加</h2>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1">
              <StockInput
                onAddStock={handleAddStock}
                isDisabled={stocks.length >= MAX_STOCKS}
              />
            </div>
            <div className="flex flex-col gap-2 md:min-w-fit">
              {error && (
                <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div className="text-gray-400 text-sm">
                <p>{stocks.length}/{MAX_STOCKS} 銘柄を追加済み</p>
              </div>
            </div>
          </div>
        </div>


        {/* お気に入りグループフィルター */}
        {favoriteGroups.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">お気に入りグループ</h3>
              <button
                onClick={() => setIsGroupManagerOpen(true)}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                グループ管理
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGroupFilter(null)}
                className={`text-sm px-3 py-2 rounded-full transition-colors ${
                  selectedGroupFilter === null
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                すべて ({stocks.length})
              </button>
              {favoriteGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupFilter(group.id)}
                  className={`text-sm px-3 py-2 rounded-full transition-colors ${
                    selectedGroupFilter === group.id
                      ? `${GROUP_COLORS[group.color].bg} ${GROUP_COLORS[group.color].text}`
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  ★ {group.name} ({group.stocks.length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* グループ管理ボタン（グループがない場合） */}
        {favoriteGroups.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-400 text-sm mb-3">お気に入りグループを作成して銘柄を整理しましょう</p>
            <button
              onClick={() => setIsGroupManagerOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              グループを作成
            </button>
          </div>
        )}

        <div>
          {filteredStocks.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              {stocks.length === 0 ? (
                <>
                  <h3 className="text-xl font-medium text-white mb-2">銘柄カードを追加してください</h3>
                  <p className="text-gray-400">上記のフォームから銘柄コードを入力して、投資の思考整理を始めましょう。</p>
                </>
              ) : searchQuery.trim() ? (
                <>
                  <h3 className="text-xl font-medium text-white mb-2">検索結果がありません</h3>
                  <p className="text-gray-400">「{searchQuery}」に一致する銘柄・メモ・タグが見つかりませんでした。</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    検索をクリア
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-medium text-white mb-2">表示する銘柄がありません</h3>
                  <p className="text-gray-400">選択したグループに銘柄が登録されていません。</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStocks.map((stock) => (
                <StockCard
                  key={stock}
                  symbol={stock}
                  onRemove={() => handleRemoveStock(stock)}
                  favoriteGroups={favoriteGroups}
                  onFavoriteGroupsChange={setFavoriteGroups}
                />
              ))}
            </div>
          )}
        </div>

        {/* グループ管理モーダル */}
        {isGroupManagerOpen && (
          <FavoriteGroupManager
            groups={favoriteGroups}
            onGroupsChange={setFavoriteGroups}
            onClose={() => setIsGroupManagerOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
