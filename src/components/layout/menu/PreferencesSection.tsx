'use client';

import SoundSettings from '../../settings/SoundSettings';

interface PreferencesSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function PreferencesSection({ isExpanded, onToggle }: PreferencesSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">&#x2699;&#xFE0F;</span>
          <span className="text-white">設定</span>
        </div>
        <span className={`text-gray-400 transition-transform ${
          isExpanded ? 'rotate-90' : ''
        }`}>
          &#x25B6;
        </span>
      </button>

      {isExpanded && (
        <div className="ml-8 mt-2">
          <SoundSettings />
        </div>
      )}
    </div>
  );
}
