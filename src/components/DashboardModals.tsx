'use client';

import { ReactNode } from 'react';
import FavoriteGroupManager from '@/components/tag/FavoriteGroupManager';
import TagManager from '@/components/tag/TagManager';
import AlertSummaryPage from '@/components/alert/AlertSummaryPage';
import StrategySummaryPage from '@/components/summary/StrategySummaryPage';
import PortfolioPositionsPage from '@/components/summary/PortfolioPositionsPage';
import EventCalendarPage from '@/components/summary/EventCalendarPage';
import DividendBenefitListPage from '@/components/summary/DividendBenefitListPage';
import DeleteAccountModal from '@/components/modal/DeleteAccountModal';
import FeedbackModal from '@/components/modal/FeedbackModal';
import OnboardingWizard from '@/components/OnboardingWizard';
import SlideOutMenu from '@/components/SlideOutMenu';
import { FavoriteGroup } from '@/types/favorites';
import { AlertCounts } from '@/hooks/alert/useAlertCounts';
import { StockData } from '@/hooks/stock/useStockData';
import { CalendarDataMap } from '@/hooks/calendar/useCalendarData';
import { DividendBenefitStockData } from '@/hooks/dividend/useDividendBenefitData';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  children: ReactNode;
}

function FullScreenModal({ isOpen, onClose, title, maxWidth = 'max-w-6xl', children }: FullScreenModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-gray-900 rounded-lg p-4 ${maxWidth} w-full mx-4 max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors p-2 rounded"
          >
            ✕
          </button>
        </div>
        <div className="overflow-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

interface DashboardModalsProps {
  modals: {
    isGroupManagerOpen: boolean;
    setIsGroupManagerOpen: (v: boolean) => void;
    isTagManagerOpen: boolean;
    setIsTagManagerOpen: (v: boolean) => void;
    isAlertSummaryOpen: boolean;
    setIsAlertSummaryOpen: (v: boolean) => void;
    isStrategySummaryOpen: boolean;
    setIsStrategySummaryOpen: (v: boolean) => void;
    isPortfolioPositionsOpen: boolean;
    setIsPortfolioPositionsOpen: (v: boolean) => void;
    isEventCalendarOpen: boolean;
    setIsEventCalendarOpen: (v: boolean) => void;
    isDividendBenefitListOpen: boolean;
    setIsDividendBenefitListOpen: (v: boolean) => void;
    isDeleteAccountOpen: boolean;
    setIsDeleteAccountOpen: (v: boolean) => void;
    isFeedbackOpen: boolean;
    setIsFeedbackOpen: (v: boolean) => void;
    isMenuOpen: boolean;
    setIsMenuOpen: (v: boolean) => void;
    handleMenuItemClick: (item: string) => void;
  };
  stockData: StockData[];
  stockSymbols: string[];
  stockCalendarData: CalendarDataMap;
  dividendBenefitData: Record<string, DividendBenefitStockData>;
  favoriteGroups: FavoriteGroup[];
  setFavoriteGroups: (groups: FavoriteGroup[]) => void;
  alertCounts: AlertCounts;
  refreshData: () => void;
  onStockClick: (symbol: string) => void;
  showOnboarding: boolean;
  completeOnboarding: () => void;
  onOnboardingComplete: () => void;
}

export default function DashboardModals({
  modals,
  stockData,
  stockSymbols,
  stockCalendarData,
  dividendBenefitData,
  favoriteGroups,
  setFavoriteGroups,
  alertCounts,
  refreshData,
  onStockClick,
  showOnboarding,
  completeOnboarding,
  onOnboardingComplete,
}: DashboardModalsProps) {
  return (
    <>
      {/* グループ管理モーダル */}
      {modals.isGroupManagerOpen && (
        <FavoriteGroupManager
          groups={favoriteGroups}
          onGroupsChange={setFavoriteGroups}
          onClose={() => modals.setIsGroupManagerOpen(false)}
        />
      )}

      {/* タグ管理モーダル */}
      <TagManager
        isOpen={modals.isTagManagerOpen}
        onClose={() => { modals.setIsTagManagerOpen(false); refreshData(); }}
      />

      {/* アラート一覧モーダル */}
      <FullScreenModal
        isOpen={modals.isAlertSummaryOpen}
        onClose={() => modals.setIsAlertSummaryOpen(false)}
        title="🚨 アラート一覧"
      >
        <AlertSummaryPage stockData={stockData} />
      </FullScreenModal>

      {/* 戦略一覧ダッシュボードモーダル */}
      <FullScreenModal
        isOpen={modals.isStrategySummaryOpen}
        onClose={() => modals.setIsStrategySummaryOpen(false)}
        title="🎯 戦略一覧ダッシュボード"
        maxWidth="max-w-7xl"
      >
        <StrategySummaryPage stockData={stockData} />
      </FullScreenModal>

      {/* 保有ポジション一覧モーダル */}
      <FullScreenModal
        isOpen={modals.isPortfolioPositionsOpen}
        onClose={() => modals.setIsPortfolioPositionsOpen(false)}
        title="💼 保有ポジション一覧"
        maxWidth="max-w-7xl"
      >
        <PortfolioPositionsPage stockData={stockData} />
      </FullScreenModal>

      {/* イベント一覧モーダル */}
      <FullScreenModal
        isOpen={modals.isEventCalendarOpen}
        onClose={() => modals.setIsEventCalendarOpen(false)}
        title="📅 イベント一覧"
      >
        <EventCalendarPage
          stockSymbols={stockSymbols}
          stockData={stockCalendarData}
        />
      </FullScreenModal>

      {/* 配当・優待一覧モーダル */}
      <FullScreenModal
        isOpen={modals.isDividendBenefitListOpen}
        onClose={() => modals.setIsDividendBenefitListOpen(false)}
        title="💰 配当・優待一覧"
        maxWidth="max-w-7xl"
      >
        <DividendBenefitListPage
          stockSymbols={stockSymbols}
          stockData={dividendBenefitData}
          onStockClick={(symbol) => {
            modals.setIsDividendBenefitListOpen(false);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`kabunote-open-tab-${symbol}`, 'dividend');
            }
            onStockClick(symbol);
          }}
        />
      </FullScreenModal>

      {/* アカウント削除モーダル */}
      <DeleteAccountModal
        isOpen={modals.isDeleteAccountOpen}
        onClose={() => modals.setIsDeleteAccountOpen(false)}
      />

      {/* 目安箱モーダル */}
      <FeedbackModal
        isOpen={modals.isFeedbackOpen}
        onClose={() => modals.setIsFeedbackOpen(false)}
      />

      {/* オンボーディングウィザード */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={onOnboardingComplete}
          onClose={completeOnboarding}
        />
      )}

      {/* スライドアウトメニュー */}
      <SlideOutMenu
        isOpen={modals.isMenuOpen}
        onClose={() => modals.setIsMenuOpen(false)}
        alertCounts={alertCounts}
        onMenuItemClick={modals.handleMenuItemClick}
      />
    </>
  );
}
