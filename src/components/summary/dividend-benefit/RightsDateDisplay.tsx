'use client';

import React from 'react';
import { formatMonthDay } from '@/lib/dateFormat';
import {
  calculateDaysUntil,
  getDaysUntilDisplay,
  type DividendBenefitItem,
} from '@/hooks/dividend/useDividendBenefitList';

interface RightsDateDisplayProps {
  item: DividendBenefitItem;
}

export default function RightsDateDisplay({ item }: RightsDateDisplayProps) {
  return (
    <div className="space-y-1">
      {item.dividendRightsDate && (
        <div className="text-xs">
          <div className="text-green-300">配当: {formatMonthDay(item.dividendRightsDate)}</div>
          <div className="text-gray-500">
            {getDaysUntilDisplay(calculateDaysUntil(item.dividendRightsDate))}
          </div>
        </div>
      )}
      {item.shareholderRightsDate && (
        <div className="text-xs">
          <div className="text-purple-300">優待: {formatMonthDay(item.shareholderRightsDate)}</div>
          <div className="text-gray-500">
            {getDaysUntilDisplay(calculateDaysUntil(item.shareholderRightsDate))}
          </div>
        </div>
      )}
      {!item.dividendRightsDate && !item.shareholderRightsDate && (
        <div className="text-xs text-gray-500">-</div>
      )}
    </div>
  );
}
