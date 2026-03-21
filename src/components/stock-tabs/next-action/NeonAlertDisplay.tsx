'use client';

import React from 'react';
import { NextActionPlanAnalysis } from '@/types/nextActionPlan';
import { formatProfitLoss } from '@/lib/positionCalc';

interface NeonAlertDisplayProps {
  analysis: NextActionPlanAnalysis;
}

export default function NeonAlertDisplay({ analysis }: NeonAlertDisplayProps) {
  return (
    <>
      {/* 進捗ゲージ */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">価格到達進捗</span>
          <span className="text-xs text-gray-300">{Math.abs(analysis.gapPercentage).toFixed(1)}% 差</span>
        </div>
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          {/* ネオングロー背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-green-900/30 rounded-full"></div>

          {/* 進捗バー */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, Math.max(0, 100 - Math.abs(analysis.gapPercentage)))}%`,
              background: analysis.gapPercentage >= 0
                ? 'linear-gradient(90deg, #3b82f6, #06b6d4)'
                : 'linear-gradient(90deg, #ef4444, #f59e0b)',
              boxShadow: analysis.gapPercentage >= 0
                ? '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(6, 182, 212, 0.3)'
                : '0 0 10px rgba(239, 68, 68, 0.5), 0 0 20px rgba(245, 158, 11, 0.3)'
            }}
          />
        </div>
      </div>

      {/* 目標価格アラート（段階的表示） */}
      {analysis.isApproaching && (
        <div className="relative p-3 bg-red-900/30 border border-red-500/50 rounded-md overflow-hidden">
          {/* ネオングロー背景 */}
          <div className="absolute inset-0 bg-red-400/5 animate-pulse"></div>

          <div className="relative flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 bg-red-400 rounded-full animate-pulse"
                style={{
                  boxShadow: '0 0 10px rgba(248, 113, 113, 0.8), 0 0 20px rgba(248, 113, 113, 0.4)'
                }}
              ></div>
              <span className="text-red-400 text-xs font-medium">{'\u{1F6A8}'} 目標価格に接近中</span>
            </div>
            <div className="text-xs text-red-300">（乖離率2%以内）</div>
          </div>

          {/* スキャンライン効果 */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-pulse"></div>
          </div>
        </div>
      )}

      {/* 目標価格警告（2-5%以内） */}
      {analysis.isWarning && (
        <div className="relative p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-md overflow-hidden">
          {/* ネオングロー背景 */}
          <div className="absolute inset-0 bg-yellow-400/5 animate-pulse"></div>

          <div className="relative flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
                style={{
                  boxShadow: '0 0 10px rgba(251, 191, 36, 0.8), 0 0 20px rgba(251, 191, 36, 0.4)'
                }}
              ></div>
              <span className="text-yellow-400 text-xs font-medium">{'\u26A0\uFE0F'} 注意：目標価格に接近</span>
            </div>
            <div className="text-xs text-yellow-300">（乖離率2-5%以内）</div>
          </div>

          {/* スキャンライン効果 */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse"></div>
          </div>
        </div>
      )}
    </>
  );
}
