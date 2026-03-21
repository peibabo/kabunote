'use client';

import SoundSettings from '../../settings/SoundSettings';

interface SettingsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onMenuClick: (action: string) => void;
}

export default function SettingsSection({ isExpanded, onToggle, onMenuClick }: SettingsSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">&#x2699;&#xFE0F;</span>
          <span className="text-white">設定・管理</span>
        </div>
        <span className={`text-gray-400 transition-transform ${
          isExpanded ? 'rotate-90' : ''
        }`}>
          &#x25B6;
        </span>
      </button>

      {isExpanded && (
        <div className="ml-8 mt-2 space-y-1">
          <button
            onClick={() => onMenuClick('groups')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F465;</span>
            <span className="text-gray-300">グループ管理</span>
          </button>
          <button
            onClick={() => onMenuClick('tags')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F3F7;&#xFE0F;</span>
            <span className="text-gray-300">タグ管理</span>
          </button>
          <button
            onClick={() => onMenuClick('deleteAccount')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F5D1;&#xFE0F;</span>
            <span className="text-red-400">アカウント削除</span>
          </button>

          {/* サウンド設定 */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <SoundSettings />
          </div>
        </div>
      )}
    </div>
  );
}
