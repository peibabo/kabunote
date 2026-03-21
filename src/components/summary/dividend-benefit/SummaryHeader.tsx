'use client';

import React from 'react';
import { formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';
import { formatBenefitValue } from '@/lib/shareholderCalc';

interface SummaryData {
  totalStocks: number;
  totalAnnualDividend: number;
  totalAfterTaxDividend: number;
  totalBenefitValue: number;
  eligibleBenefits: number;
  avgDividendYield: number;
  dividendStocks: number;
}

interface SummaryHeaderProps {
  summary: SummaryData;
}

export default function SummaryHeader({ summary }: SummaryHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">総銘柄数</div>
        <div className="text-2xl font-bold text-white">{summary.totalStocks}</div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">年間配当金額</div>
        <div className="text-xl font-bold text-green-400">
          {'\u00A5'}{formatDividendAmount(summary.totalAnnualDividend)}
        </div>
        <div className="text-xs text-gray-500">
          税引後: {'\u00A5'}{formatDividendAmount(summary.totalAfterTaxDividend)}
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">優待推定価値</div>
        <div className="text-xl font-bold text-purple-400">
          {'\u00A5'}{formatBenefitValue(summary.totalBenefitValue)}
        </div>
        <div className="text-xs text-gray-500">
          取得可能: {summary.eligibleBenefits}銘柄
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">平均配当利回り</div>
        <div className="text-xl font-bold text-blue-400">
          {formatDividendYield(summary.avgDividendYield)}%
        </div>
        <div className="text-xs text-gray-500">
          配当設定: {summary.dividendStocks}銘柄
        </div>
      </div>
    </div>
  );
}
