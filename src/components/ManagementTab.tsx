'use client';

import { PositionSummary } from '@/types/positions';
import { RightsDateSettings, DividendRightsSettings, ShareholderRightsSettings, ShareholderMeetingSettings, createDefaultDividendRightsSettings, createDefaultShareholderRightsSettings, createDefaultShareholderMeetingSettings } from '@/types/rightsDate';
import { useManagementTabState } from '@/hooks/useManagementTabState';
import EventManagement from '@/components/EventManagement';
import DividendManagement from '@/components/DividendManagement';
import ShareholderBenefitManagement from '@/components/ShareholderBenefitManagement';

interface ManagementTabProps {
  symbol: string;
  earningsDate: string;
  onEarningsDateChange: (value: string) => void;
  rightsDate: string;
  rightsSettings: RightsDateSettings;
  onRightsSettingsChange: (settings: RightsDateSettings) => void;
  positionSummary: PositionSummary;
  dividendRightsSettings: DividendRightsSettings;
  onDividendRightsSettingsChange: (settings: DividendRightsSettings) => void;
  shareholderRightsSettings: ShareholderRightsSettings;
  onShareholderRightsSettingsChange: (settings: ShareholderRightsSettings) => void;
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
  positionSummary,
  dividendRightsSettings,
  onDividendRightsSettingsChange,
  shareholderRightsSettings,
  onShareholderRightsSettingsChange,
  shareholderMeetingSettings,
  onShareholderMeetingSettingsChange
}: ManagementTabProps) {
  const { activeTab, setActiveTab, tabs, isLoading } = useManagementTabState(symbol, 'events');

  if (isLoading) {
    return <div className="text-center text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* サブタブナビゲーション */}
      <div className="flex justify-center gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
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
        {activeTab === 'events' && (
          <EventManagement
            symbol={symbol}
            earningsDate={earningsDate}
            onEarningsDateChange={onEarningsDateChange}
            shareholderMeetingSettings={shareholderMeetingSettings}
            onShareholderMeetingSettingsChange={onShareholderMeetingSettingsChange}
          />
        )}

        {activeTab === 'dividend' && (
          <DividendManagement
            symbol={symbol}
            positionSummary={positionSummary}
            dividendRightsSettings={dividendRightsSettings}
            onDividendRightsSettingsChange={onDividendRightsSettingsChange}
          />
        )}

        {activeTab === 'shareholder' && (
          <ShareholderBenefitManagement
            symbol={symbol}
            positionSummary={positionSummary}
            shareholderRightsSettings={shareholderRightsSettings}
            onShareholderRightsSettingsChange={onShareholderRightsSettingsChange}
          />
        )}
      </div>
    </div>
  );
}