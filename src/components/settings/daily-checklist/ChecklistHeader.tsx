'use client'

interface ChecklistHeaderProps {
  isExpanded: boolean
  totalCount: number
  checkedCount: number
  allCompleted: boolean
  onToggle: () => void
}

export default function ChecklistHeader({
  isExpanded,
  totalCount,
  checkedCount,
  allCompleted,
  onToggle,
}: ChecklistHeaderProps) {
  return (
    <button onClick={onToggle} className="cursor-pointer w-full flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">✅</span>
        <span className="text-sm font-medium text-white">今日のチェックリスト</span>
      </div>
      <div className="flex items-center gap-3">
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`,
                  background: allCompleted
                    ? 'rgb(34, 197, 94)'
                    : 'linear-gradient(90deg, rgb(20, 184, 166), rgb(59, 130, 246))',
                }}
              />
            </div>
            <span className={`text-xs ${allCompleted ? 'text-green-400 font-medium' : 'text-gray-400'}`}>
              {allCompleted ? '全完了!' : `${checkedCount}/${totalCount}`}
            </span>
          </div>
        )}
        <span className={`text-gray-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>
    </button>
  )
}
