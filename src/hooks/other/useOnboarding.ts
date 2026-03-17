import { useState, useEffect, useCallback } from 'react';

export function useOnboarding() {
  // フラッシュ防止: API応答前はtrue（ウィザード非表示）
  const [completed, setCompleted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/onboarding')
      .then((res) => res.json())
      .then((data) => {
        setCompleted(data.completed);
      })
      .catch(() => {
        // エラー時はウィザード非表示のまま
        setCompleted(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const showOnboarding = !isLoading && !completed;

  const completeOnboarding = useCallback(() => {
    setCompleted(true);
    fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    }).catch(() => {
      // バックグラウンド更新失敗時はUIはそのまま
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    setCompleted(false);
    fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: false }),
    }).catch(() => {
      // バックグラウンド更新失敗時はUIはそのまま
    });
  }, []);

  return { showOnboarding, isLoading, completeOnboarding, resetOnboarding };
}
