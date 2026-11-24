import type { ComponentType } from 'react';
import type { ViewId } from '@/popup/components/BottomNav';
import { loadStreakRatingEligibility, STREAK_RATING_DIALOG_ID, StreakRatingPrompt } from './StreakRatingPrompt';

export interface PopupDialogContentProps {
  onDismiss: () => void;
  onNavigate: (view: ViewId) => void;
}

export interface PopupDialogEntry {
  id: string;
  loadEligibility: () => Promise<boolean>;
  Content: ComponentType<PopupDialogContentProps>;
}

// Array order is display order.
export const popupDialogRegistry: readonly PopupDialogEntry[] = [
  {
    id: STREAK_RATING_DIALOG_ID,
    loadEligibility: loadStreakRatingEligibility,
    Content: StreakRatingPrompt,
  },
];

export const dialogEligibilityQueryKey = (id: string) => ['popupDialogs', 'eligibility', id] as const;
