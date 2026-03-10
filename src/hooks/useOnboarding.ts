import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storageKeys';

export function useOnboarding() {
  const [completed, setCompleted, isLoading] = useLocalStorage<boolean>(
    STORAGE_KEYS.ONBOARDING_COMPLETED,
    false,
    0 // デバウンスなし（即座に保存）
  );

  const showOnboarding = !isLoading && !completed;

  const completeOnboarding = useCallback(() => {
    setCompleted(true);
  }, [setCompleted]);

  const resetOnboarding = useCallback(() => {
    setCompleted(false);
  }, [setCompleted]);

  return { showOnboarding, isLoading, completeOnboarding, resetOnboarding };
}
