'use client';

interface AlertStats {
  total: number;
  urgent: number;
  byType: Record<string, number>;
}

interface AlertStatsSummaryProps {
  stats: AlertStats;
}

export default function AlertStatsSummary({ stats }: AlertStatsSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">総アラート数</div>
        <div className="text-2xl font-bold text-white">{stats.total}</div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">緊急アラート</div>
        <div className="text-2xl font-bold text-red-400">{stats.urgent}</div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">資金不足</div>
        <div className="text-2xl font-bold text-red-400">
          {stats.byType['insufficient-funds'] || 0}
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">損切り関連</div>
        <div className="text-2xl font-bold text-red-400">
          {(stats.byType['stop-loss-exceeded'] || 0) + (stats.byType['stop-loss'] || 0)}
        </div>
      </div>
    </div>
  );
}
