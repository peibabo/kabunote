import { useLocalStorage } from './useLocalStorage';
import { NextActionPlan, createDefaultNextActionPlan } from '../types/nextActionPlan';

/**
 * NextActionPlan管理フック
 * 銘柄別にNextActionPlanデータをlocalStorageで管理
 * @param symbol - 株式銘柄コード
 * @returns [nextActionPlan, updateNextActionPlan, resetNextActionPlan, isLoading]
 */
export function useNextActionPlan(symbol: string) {
  const storageKey = `kabunote-next-action-plan-${symbol}`;

  const [nextActionPlan, setNextActionPlan, isLoading] = useLocalStorage<NextActionPlan>(
    storageKey,
    createDefaultNextActionPlan(),
    300 // 300ms debounce
  );

  /**
   * NextActionPlanを更新
   */
  const updateNextActionPlan = (updates: Partial<NextActionPlan>) => {
    setNextActionPlan(prev => ({
      ...prev,
      ...updates
    }));
  };

  /**
   * NextActionPlanをリセット（デフォルト値に戻す）
   */
  const resetNextActionPlan = () => {
    setNextActionPlan(createDefaultNextActionPlan());
  };

  /**
   * NextActionPlanを完全に設定
   */
  const setFullNextActionPlan = (plan: NextActionPlan) => {
    setNextActionPlan(plan);
  };

  return {
    nextActionPlan,
    updateNextActionPlan,
    resetNextActionPlan,
    setFullNextActionPlan,
    isLoading
  };
}

/**
 * NextActionPlanが設定されているかチェック
 */
export const hasNextActionPlan = (plan: NextActionPlan): boolean => {
  return plan.targetPrice > 0 ||
         plan.targetQuantity > 0 ||
         plan.memo.trim() !== '' ||
         plan.actionType !== 'buy' ||
         plan.priority !== 'medium';
};

/**
 * NextActionPlanが完全に設定されているかチェック
 */
export const isCompleteNextActionPlan = (plan: NextActionPlan): boolean => {
  return plan.targetPrice > 0 &&
         plan.targetQuantity > 0;
};