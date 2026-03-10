'use client';

import { useState } from 'react';
import WelcomeStep from './onboarding/WelcomeStep';
import AddStockStep from './onboarding/AddStockStep';
import StockCardStep from './onboarding/StockCardStep';
import DashboardStep from './onboarding/DashboardStep';
import GetStartedStep from './onboarding/GetStartedStep';

const TOTAL_STEPS = 5;

interface OnboardingWizardProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function OnboardingWizard({ onComplete, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGetStarted = () => {
    onComplete();
  };

  const handleLater = () => {
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const steps = [
    <WelcomeStep key="welcome" />,
    <AddStockStep key="add-stock" />,
    <StockCardStep key="stock-card" />,
    <DashboardStep key="dashboard" />,
    <GetStartedStep key="get-started" onGetStarted={handleGetStarted} onLater={handleLater} />,
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 max-w-lg w-full rounded-2xl border border-gray-600 relative overflow-hidden">
        {/* 閉じるボタン */}
        <button
          onClick={handleSkip}
          className="cursor-pointer absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700"
          aria-label="閉じる"
        >
          ✕
        </button>

        {/* ステップコンテンツ */}
        <div className="p-6 pt-10" key={currentStep} style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {steps[currentStep]}
        </div>

        {/* フッター: 進捗ドット + ナビゲーション */}
        <div className="px-6 pb-6 flex items-center justify-between">
          {/* 戻るボタン */}
          <div className="w-16">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors"
              >
                戻る
              </button>
            )}
          </div>

          {/* 進捗ドット */}
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'bg-blue-500'
                    : i < currentStep
                      ? 'bg-blue-800'
                      : 'bg-gray-600'
                }`}
                style={
                  i === currentStep
                    ? { boxShadow: '0 0 8px rgba(59, 130, 246, 0.8), 0 0 16px rgba(59, 130, 246, 0.4)' }
                    : undefined
                }
              />
            ))}
          </div>

          {/* 次へボタン */}
          <div className="w-16 text-right">
            {currentStep < TOTAL_STEPS - 1 && (
              <button
                onClick={handleNext}
                className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                次へ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
