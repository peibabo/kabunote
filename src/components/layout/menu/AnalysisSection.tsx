'use client';

interface AnalysisSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onMenuClick: (action: string) => void;
}

export default function AnalysisSection({ isExpanded, onToggle, onMenuClick }: AnalysisSectionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">&#x1F4CA;</span>
          <span className="text-white">分析・レポート</span>
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
            onClick={() => onMenuClick('strategy')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F3AF;</span>
            <span className="text-gray-300">戦略一覧</span>
          </button>
          <button
            onClick={() => onMenuClick('positions')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F4BC;</span>
            <span className="text-gray-300">ポジション一覧</span>
          </button>
          <button
            onClick={() => onMenuClick('events')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F4C5;</span>
            <span className="text-gray-300">イベント一覧</span>
          </button>
          <button
            onClick={() => onMenuClick('dividends')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F4B0;</span>
            <span className="text-gray-300">配当・優待一覧</span>
          </button>
          <button
            onClick={() => onMenuClick('news')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F4F0;</span>
            <span className="text-gray-300">ニュース一覧</span>
          </button>
          <button
            onClick={() => onMenuClick('chartMemos')}
            className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-lg">&#x1F4DD;</span>
            <span className="text-gray-300">チャートメモ一覧</span>
          </button>
        </div>
      )}
    </div>
  );
}
