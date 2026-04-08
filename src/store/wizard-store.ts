import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── State ────────────────────────────────────────────────────────
interface WizardState {
  currentStep: number;               // 0-indexed, 0–4
  answers: Record<string, unknown>;  // flat: { [questionId]: value }
  healthConsent: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────
interface WizardActions {
  nextStep: () => void;
  prevStep: () => void;
  setStepAnswers: (values: Record<string, unknown>) => void;
  setHealthConsent: (value: boolean) => void;
  reset: () => void;
}

type WizardStore = WizardState & WizardActions;

const initialState: WizardState = {
  currentStep: 0,
  answers: {},
  healthConsent: false,
};

// ─── Store ────────────────────────────────────────────────────────
export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      ...initialState,

      nextStep: () =>
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),

      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      setStepAnswers: (values) =>
        set((state) => ({ answers: { ...state.answers, ...values } })),

      setHealthConsent: (value) => set({ healthConsent: value }),

      reset: () => set(initialState),
    }),
    {
      name: 'gigsecure-wizard',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
      partialize: (state) => ({
        currentStep: state.currentStep,
        answers: state.answers,
        healthConsent: state.healthConsent,
      }),
    }
  )
);
