import { useState, useCallback } from 'react';

interface UseModalsReturn {
  isGroupManagerOpen: boolean;
  setIsGroupManagerOpen: (open: boolean) => void;
  isTagManagerOpen: boolean;
  setIsTagManagerOpen: (open: boolean) => void;
  isStrategySummaryOpen: boolean;
  setIsStrategySummaryOpen: (open: boolean) => void;
  isPortfolioPositionsOpen: boolean;
  setIsPortfolioPositionsOpen: (open: boolean) => void;
  isAlertSummaryOpen: boolean;
  setIsAlertSummaryOpen: (open: boolean) => void;
  isEventCalendarOpen: boolean;
  setIsEventCalendarOpen: (open: boolean) => void;
  isDividendBenefitListOpen: boolean;
  setIsDividendBenefitListOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  handleMenuItemClick: (action: string) => void;
}

export function useModals(refreshData: () => Promise<void>): UseModalsReturn {
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isStrategySummaryOpen, setIsStrategySummaryOpen] = useState(false);
  const [isPortfolioPositionsOpen, setIsPortfolioPositionsOpen] = useState(false);
  const [isAlertSummaryOpen, setIsAlertSummaryOpen] = useState(false);
  const [isEventCalendarOpen, setIsEventCalendarOpen] = useState(false);
  const [isDividendBenefitListOpen, setIsDividendBenefitListOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuItemClick = useCallback((action: string) => {
    switch (action) {
      case 'alerts':
        setIsAlertSummaryOpen(true);
        break;
      case 'strategy':
        setIsStrategySummaryOpen(true);
        refreshData();
        break;
      case 'positions':
        setIsPortfolioPositionsOpen(true);
        refreshData();
        break;
      case 'portfolio':
        document.querySelector('.portfolio-summary')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'events':
        setIsEventCalendarOpen(true);
        refreshData();
        break;
      case 'dividends':
        setIsDividendBenefitListOpen(true);
        refreshData();
        break;
      case 'groups':
        setIsGroupManagerOpen(true);
        break;
      case 'tags':
        setIsTagManagerOpen(true);
        break;
      case 'help':
        alert('ヘルプ機能は今後実装予定です');
        break;
      default:
        break;
    }
  }, [refreshData]);

  return {
    isGroupManagerOpen, setIsGroupManagerOpen,
    isTagManagerOpen, setIsTagManagerOpen,
    isStrategySummaryOpen, setIsStrategySummaryOpen,
    isPortfolioPositionsOpen, setIsPortfolioPositionsOpen,
    isAlertSummaryOpen, setIsAlertSummaryOpen,
    isEventCalendarOpen, setIsEventCalendarOpen,
    isDividendBenefitListOpen, setIsDividendBenefitListOpen,
    isMenuOpen, setIsMenuOpen,
    handleMenuItemClick,
  };
}
