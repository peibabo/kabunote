'use client';

interface NextStepHintsProps {
  hasPortfolioData: boolean;
  hasCalendarData: boolean;
}

export default function NextStepHints({ hasPortfolioData, hasCalendarData }: NextStepHintsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-lg">💡</span>
        <h3 className="text-lg font-semibold text-white">次のステップのヒント</h3>
      </div>
      <div className="space-y-3">
        {!hasPortfolioData && (
          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-300 text-sm font-medium">📊 ポートフォリオ分析を始めませんか？</span>
            </div>
            <p className="text-blue-200 text-sm">
              銘柄カードの「💼 管理」タブで保有ポジションや現在株価を入力すると、
              <span className="font-medium text-blue-100">ポートフォリオサマリーと分析グラフ</span>が表示されます
            </p>
          </div>
        )}

        {!hasCalendarData && (
          <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-300 text-sm font-medium">📅 投資スケジュール管理はいかがですか？</span>
            </div>
            <p className="text-green-200 text-sm">
              銘柄カードの「💼 管理」タブで決算発表日や権利確定日を設定すると、
              <span className="font-medium text-green-100">投資カレンダー</span>が表示されます
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
