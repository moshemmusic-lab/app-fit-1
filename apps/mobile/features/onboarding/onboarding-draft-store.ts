import { create } from 'zustand';

interface OnboardingDraftState {
  /** Apple shares the user's name only on their first sign-in; keep it for onboarding. */
  suggestedDisplayName: string;
  setSuggestedDisplayName: (name: string) => void;
}

export const useOnboardingDraftStore = create<OnboardingDraftState>()((set) => ({
  suggestedDisplayName: '',
  setSuggestedDisplayName: (name) => set({ suggestedDisplayName: name }),
}));
