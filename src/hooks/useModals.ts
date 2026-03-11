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
  isDeleteAccountOpen: boolean;
  setIsDeleteAccountOpen: (open: boolean) => void;
  isFeedbackOpen: boolean;
  setIsFeedbackOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  handleMenuItemClick: (action: string) => void;
}

export function useModals(refreshData: () => Promise<void>, onTutorialClick?: () => void): UseModalsReturn {
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isStrategySummaryOpen, setIsStrategySummaryOpen] = useState(false);
  const [isPortfolioPositionsOpen, setIsPortfolioPositionsOpen] = useState(false);
  const [isAlertSummaryOpen, setIsAlertSummaryOpen] = useState(false);
  const [isEventCalendarOpen, setIsEventCalendarOpen] = useState(false);
  const [isDividendBenefitListOpen, setIsDividendBenefitListOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
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
      case 'deleteAccount':
        setIsDeleteAccountOpen(true);
        break;
      case 'feedback':
        setIsFeedbackOpen(true);
        break;
      case 'tutorial':
        if (onTutorialClick) {
          onTutorialClick();
        }
        break;
      default:
        break;
    }
  }, [refreshData, onTutorialClick]);

  return {
    isGroupManagerOpen, setIsGroupManagerOpen,
    isTagManagerOpen, setIsTagManagerOpen,
    isStrategySummaryOpen, setIsStrategySummaryOpen,
    isPortfolioPositionsOpen, setIsPortfolioPositionsOpen,
    isAlertSummaryOpen, setIsAlertSummaryOpen,
    isEventCalendarOpen, setIsEventCalendarOpen,
    isDividendBenefitListOpen, setIsDividendBenefitListOpen,
    isDeleteAccountOpen, setIsDeleteAccountOpen,
    isFeedbackOpen, setIsFeedbackOpen,
    isMenuOpen, setIsMenuOpen,
    handleMenuItemClick,
  };
}
