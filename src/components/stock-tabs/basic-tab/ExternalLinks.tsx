'use client';

import { useState, useMemo } from 'react';
import {
  STOCK_EXTERNAL_LINKS,
  DEFAULT_STOCK_LINK_SETTINGS,
  buildStockLinkUrl,
  getStockLinkDef,
  type StockExternalLinkDef,
} from '@/lib/stockExternalLinks';
import { useStockLinkSettings } from '@/hooks/dashboard/useStockLinkSettings';
import StockLinkSettingsModal from '@/components/settings/StockLinkSettingsModal';

interface ExternalLinksProps {
  symbol: string;
}

export default function ExternalLinks({ symbol }: ExternalLinksProps) {
  const { settings, isLoading, saveSettings } = useStockLinkSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const visibleLinks = useMemo(() => {
    const activeSettings = settings.length > 0 ? settings : DEFAULT_STOCK_LINK_SETTINGS;
    return [...activeSettings]
      .sort((a, b) => a.order - b.order)
      .filter(s => s.visible)
      .map(s => getStockLinkDef(s.key))
      .filter((def): def is StockExternalLinkDef => def !== undefined);
  }, [settings]);

  // ローディング中はデフォルト全表示
  const linksToShow = isLoading ? STOCK_EXTERNAL_LINKS : visibleLinks;

  return (
    <div>
      {linksToShow.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="text-gray-500 text-sm">表示するリンクがありません</span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="cursor-pointer text-gray-500 hover:text-gray-300 transition-colors"
            title="外部リンク設定"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-1 items-start">
          {linksToShow.map((link) => (
            <a
              key={link.key}
              href={buildStockLinkUrl(link.urlTemplate, symbol)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-0.5 flex-shrink-0 w-14"
              title={link.name}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg transition-all hover:scale-105"
                style={{ backgroundColor: link.bgColor }}
              >
                {link.icon}
              </div>
              <span className="text-[10px] text-gray-400 truncate w-full text-center">{link.name}</span>
            </a>
          ))}
          {/* 歯車アイコン: リンク列の末尾 */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="cursor-pointer flex flex-col items-center gap-0.5 flex-shrink-0 w-14"
            title="外部リンク設定"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 transition-all hover:scale-105">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400 truncate w-full text-center">設定</span>
          </button>
        </div>
      )}

      {/* 設定モーダル */}
      <StockLinkSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings.length > 0 ? settings : DEFAULT_STOCK_LINK_SETTINGS}
        onSave={saveSettings}
      />
    </div>
  );
}
