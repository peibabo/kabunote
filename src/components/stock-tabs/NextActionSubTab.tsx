import React from 'react';
import { playSound } from '@/lib/sound';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';
import {
  NextActionPlan as NextActionPlanType,
  ActionType,
  Priority,
} from '@/types/nextActionPlan';
import { analyzeNextActionPlan, hasNextActionPlan, isCompleteNextActionPlan } from '@/lib/nextActionPlanCalc';
import { PositionSummary } from '@/types/positions';
import { useCash } from '@/hooks/auth/useCash';
import AnalysisInfoDisplay from './next-action/AnalysisInfoDisplay';
import StrategyForm from './next-action/StrategyForm';

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'text-red-400 bg-red-900/20 border-red-500/30',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  low: 'text-green-400 bg-green-900/20 border-green-500/30'
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '\u{1F534} \u9AD8',
  medium: '\u{1F7E1} \u4E2D',
  low: '\u{1F7E2} \u4F4E'
};

interface NextActionSubTabProps {
  symbol: string;
  currentPrice?: number;
  positionSummary?: PositionSummary;
  nextActionPlan: NextActionPlanType | null;
  updateNextActionPlan: (data: Partial<Omit<NextActionPlanType, 'id' | 'updatedAt'>>) => void;
  deleteNextActionPlan: () => Promise<void>;
  isNapLoading: boolean;
  isNapSaving: boolean;
}

export default function NextActionSubTab({
  currentPrice = 0,
  positionSummary,
  nextActionPlan,
  updateNextActionPlan,
  deleteNextActionPlan: resetNextActionPlan,
  isNapLoading: isLoading,
}: NextActionSubTabProps) {
  const { cashAmount } = useCash();
  const availableCash = parseFloat(cashAmount) || 0;
  const onChangeSound = useSoundOnChange();

  if (isLoading) {
    return <div className="text-gray-400">読み込み中...</div>;
  }

  const plan = nextActionPlan ?? {
    id: '',
    actionType: 'buy' as ActionType,
    priority: 'medium' as Priority,
    targetPrice: null as number | null,
    targetQuantity: null as number | null,
    memo: '',
    updatedAt: ''
  };

  const analysis = currentPrice > 0 && nextActionPlan ?
    analyzeNextActionPlan(nextActionPlan, currentPrice, positionSummary || null, availableCash) : null;

  const hasPlan = nextActionPlan ? hasNextActionPlan(nextActionPlan) : false;
  const isComplete = nextActionPlan ? isCompleteNextActionPlan(nextActionPlan) : false;

  return (
    <div className="relative space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">{'\u{1F3AF}'} 次の一手</h3>
          {hasPlan && (
            <div className={`px-2 py-1 rounded-md text-xs border ${PRIORITY_COLORS[plan.priority]}`}>
              {PRIORITY_LABELS[plan.priority]}
            </div>
          )}
        </div>
        {hasPlan && (
          <button
            onClick={() => { playSound('buttonDelete'); resetNextActionPlan(); }}
            className="cursor-pointer text-xs text-gray-400 hover:text-white transition-colors"
          >
            リセット
          </button>
        )}
      </div>

      <StrategyForm
        actionType={plan.actionType}
        priority={plan.priority}
        targetPrice={plan.targetPrice}
        targetQuantity={plan.targetQuantity}
        memo={plan.memo || ''}
        onUpdate={updateNextActionPlan}
        onChangeSound={onChangeSound}
      />

      {/* 分析情報 */}
      {(plan.targetPrice ?? 0) > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-600 shadow-lg">
          <h4 className="text-sm font-medium text-gray-300">{'\u{1F4CA}'} 分析情報</h4>
          {currentPrice === 0 ? (
            <AnalysisInfoDisplay
              analysis={null}
              currentPrice={0}
              actionType={plan.actionType}
              targetPrice={plan.targetPrice}
              targetQuantity={plan.targetQuantity}
            />
          ) : analysis && (
            <AnalysisInfoDisplay
              analysis={analysis}
              currentPrice={currentPrice}
              actionType={plan.actionType}
              targetPrice={plan.targetPrice}
              targetQuantity={plan.targetQuantity}
            />
          )}
        </div>
      )}

      {/* ステータス表示 */}
      {hasPlan && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}
              style={{
                boxShadow: isComplete
                  ? '0 0 8px rgba(34, 197, 94, 0.6), 0 0 16px rgba(34, 197, 94, 0.3)'
                  : '0 0 8px rgba(251, 191, 36, 0.6), 0 0 16px rgba(251, 191, 36, 0.3)'
              }}
            ></div>
            <span className="text-sm text-gray-200 font-medium">
              {isComplete ? '\u2705 作戦完了' : '\u26A1 作戦の未入力があります'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
