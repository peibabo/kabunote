'use client';

import { RightsDateSettings, ShareholderMeetingSettings, createDefaultShareholderMeetingSettings } from '@/types/rightsDate';
import { useManagementTabState } from '@/hooks/useManagementTabState';
import { useStockPosition } from '@/hooks/useStockPosition';
import { calculatePositionSummary } from '@/types/positions';
import EventManagement from '@/components/EventManagement';
import DividendManagement from '@/components/DividendManagement';
import ShareholderBenefitManagement from '@/components/ShareholderBenefitManagement';
import PositionsManagement from '@/components/PositionsManagement';

interface ManagementTabProps {
  symbol: string;
  earningsDate: string;
  onEarningsDateChange: (value: string) => void;
  rightsDate: string;
  rightsSettings: RightsDateSettings;
  onRightsSettingsChange: (settings: RightsDateSettings) => void;
  onPositionManagerOpen: () => void;
  shareholderMeetingSettings: ShareholderMeetingSettings;
  onShareholderMeetingSettingsChange: (settings: ShareholderMeetingSettings) => void;
}


export default function ManagementTab({
  symbol,
  earningsDate,
  onEarningsDateChange,
  rightsDate,
  rightsSettings,
  onRightsSettingsChange,
  onPositionManagerOpen,
  shareholderMeetingSettings,
  onShareholderMeetingSettingsChange
}: ManagementTabProps) {
  const { activeTab, setActiveTab, tabs, isLoading } = useManagementTabState(symbol, 'positions');

  // ポジションサマリーを内部で取得（DividendManagement/ShareholderBenefitManagementに渡すため）
  const { positions } = useStockPosition(`stock-${symbol}`);
  const positionSummary = calculatePositionSummary(positions);

  if (isLoading) {
    return <div className="text-center text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* サブタブナビゲーション */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 sm:px-3 py-2.5 sm:py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white bg-gray-600 shadow-md'
                : 'text-gray-400 bg-gray-800 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* サブタブコンテンツ */}
      <div className="min-h-[400px]">
        <div className={activeTab === 'positions' ? '' : 'hidden'}>
          <PositionsManagement
            symbol={symbol}
            stockId={`stock-${symbol}`}
            onPositionManagerOpen={onPositionManagerOpen}
          />
        </div>

        <div className={activeTab === 'events' ? '' : 'hidden'}>
          <EventManagement
            symbol={symbol}
            earningsDate={earningsDate}
            onEarningsDateChange={onEarningsDateChange}
            shareholderMeetingSettings={shareholderMeetingSettings}
            onShareholderMeetingSettingsChange={onShareholderMeetingSettingsChange}
          />
        </div>

        <div className={activeTab === 'dividend' ? '' : 'hidden'}>
          <DividendManagement
            symbol={symbol}
            positionSummary={positionSummary}
          />
        </div>

        <div className={activeTab === 'shareholder' ? '' : 'hidden'}>
          <ShareholderBenefitManagement
            symbol={symbol}
            positionSummary={positionSummary}
          />
        </div>
      </div>
    </div>
  );
}
