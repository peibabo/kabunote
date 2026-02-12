'use client';

import { useState, useEffect } from 'react';
import StockCard from '@/components/StockCard';
import StockInput from '@/components/StockInput';
import FavoriteGroupManager from '@/components/FavoriteGroupManager';
import SearchBar from '@/components/SearchBar';
import { loadStockData, getStockData } from '@/data/stockNames';
import { FavoriteGroup, GROUP_COLORS } from '@/types/favorites';

const MAX_STOCKS = 30;
const STORAGE_KEY = 'kabunote-stocks';
const GROUPS_STORAGE_KEY = 'kabunote-favorite-groups';
const FILTER_STORAGE_KEY = 'kabunote-selected-group-filter';

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

            // グループが読み込まれた後、保存されているフィルター状態を復元
            const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
            if (savedFilter && parsedGroups.some((g: FavoriteGroup) => g.id === savedFilter)) {
              // 保存されたグループが実際に存在する場合のみ復元
              setSelectedGroupFilter(savedFilter);
            }
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

      // 選択されているグループが削除された場合、フィルターをクリア
      if (selectedGroupFilter && !favoriteGroups.some(g => g.id === selectedGroupFilter)) {
        handleGroupFilterChange(null);
      }
    }
  }, [favoriteGroups, isInitialized, selectedGroupFilter]);

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

    // お気に入りグループフィルターが選択されている場合、自動的にそのグループに追加
    if (selectedGroupFilter) {
      const updatedGroups = favoriteGroups.map(group => {
        if (group.id === selectedGroupFilter) {
          // 既にグループに含まれていない場合のみ追加
          if (!group.stocks.includes(code)) {
            return { ...group, stocks: [...group.stocks, code] };
          }
        }
        return group;
      });
      setFavoriteGroups(updatedGroups);
    }
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

  // フィルター変更時に状態を保存
  const handleGroupFilterChange = (groupId: string | null) => {
    setSelectedGroupFilter(groupId);
    if (typeof window !== 'undefined') {
      if (groupId) {
        localStorage.setItem(FILTER_STORAGE_KEY, groupId);
      } else {
        localStorage.removeItem(FILTER_STORAGE_KEY);
      }
    }
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
      {/* Header with Logo */}
      <header className="bg-slate-900 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 group cursor-pointer">
            <img
              src="/kabunote-logo.png"
              alt="Kabunote Logo"
              className="h-16 w-auto transition-all duration-300"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))'
              }}
            />
            <h1
              className="text-3xl text-white tracking-wider transition-all duration-300"
              style={{
                fontFamily: '"M PLUS 1p", sans-serif',
                fontWeight: 100,
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
              }}
            >
              カブノオト
            </h1>
            <style jsx>{`
              .group:hover img {
                filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.2)) !important;
              }
              .group:hover h1 {
                filter: drop-shadow(0 0 25px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 75px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 100px rgba(255, 255, 255, 0.1)) !important;
              }
            `}</style>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-400">投資家の思考を整理するダッシュボード</p>
            </div>
            <div className="md:w-80">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          </div>

          {/* 外部分析リンク */}
          <div className="flex flex-wrap gap-3 mb-4">
            <a
              href="https://kabutan.jp/warning/record_w52_high_price&dispmode=normal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="text-lg">📈</span>
              <span>本日、52週高値を更新した銘柄</span>
              <span className="text-xs opacity-80">（株探）</span>
            </a>

            <a
              href="https://sekai-kabuka.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="text-lg">🌍</span>
              <span>世界の株価</span>
            </a>

            <a
              href="https://www.release.tdnet.info/inbs/I_main_00.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="text-lg">📋</span>
              <span>適時開示情報</span>
            </a>
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
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-white">銘柄を追加</h2>
            {selectedGroupFilter && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">→</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    GROUP_COLORS[favoriteGroups.find(g => g.id === selectedGroupFilter)?.color || 'blue'].bg
                  } ${
                    GROUP_COLORS[favoriteGroups.find(g => g.id === selectedGroupFilter)?.color || 'blue'].text
                  }`}
                >
                  ★ {favoriteGroups.find(g => g.id === selectedGroupFilter)?.name}に自動追加
                </span>
              </div>
            )}
          </div>
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
                onClick={() => handleGroupFilterChange(null)}
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
                  onClick={() => handleGroupFilterChange(group.id)}
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
