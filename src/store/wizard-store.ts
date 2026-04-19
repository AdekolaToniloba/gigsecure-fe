import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── State ────────────────────────────────────────────────────────
interface WizardState {
  currentStep: number;               // 0-indexed, 0–5 now
  answers: Record<string, unknown>;  // flat: { [questionId]: value }
  selectedCategory: string | null;
  healthConsent: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────
interface WizardActions {
  nextStep: () => void;
  prevStep: () => void;
  setStepAnswers: (values: Record<string, unknown>) => void;
  setSelectedCategory: (category: string) => void;
  setHealthConsent: (value: boolean) => void;
  reset: () => void;
}

type WizardStore = WizardState & WizardActions;

const initialState: WizardState = {
  currentStep: 0,
  answers: {},
  selectedCategory: null,
  healthConsent: false,
};

// ─── Store ────────────────────────────────────────────────────────
export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      ...initialState,

      nextStep: () =>
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),

      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      setStepAnswers: (values) =>
        set((state) => ({ answers: { ...state.answers, ...values } })),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

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
        selectedCategory: state.selectedCategory,
        healthConsent: state.healthConsent,
      }),
    }
  )
);
