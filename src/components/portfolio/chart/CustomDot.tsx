'use client';

import type { ChartType, ChartMemoMap } from '@/types/portfolio';
import { chartMemoKey } from '@/types/portfolio';

interface CustomDotProps {
  cx?: number;
  cy?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  fill?: string;
  r?: number;
  chartType: ChartType;
  symbol?: string;
  memoMap: ChartMemoMap;
  onClick: (snapshotDate: string, chartType: ChartType, symbol?: string) => void;
}

export default function CustomDot({ cx, cy, payload, fill, chartType, symbol, memoMap, onClick }: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null;

  const fullDate = payload.fullDate as string;
  if (!fullDate) return null;

  const key = chartMemoKey(fullDate, chartType, symbol);
  const hasMemo = memoMap.has(key);

  return (
    <g
      onClick={(e) => { e.stopPropagation(); onClick(fullDate, chartType, symbol); }}
      style={{ cursor: 'pointer' }}
    >
      {/* 透明なヒットエリア（クリック領域拡大） */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" stroke="none" />
      {hasMemo ? (
        <>
          <circle cx={cx} cy={cy} r={6} fill="#fbbf24" stroke="#f59e0b" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={2} fill="#fff" />
        </>
      ) : (
        <circle cx={cx} cy={cy} r={3} fill={fill || '#60a5fa'} />
      )}
    </g>
  );
}
