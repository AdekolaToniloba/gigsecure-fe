import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AssessmentMode } from '@/lib/risk/assessment-route-context';

interface WizardProgress {
  currentStep: number;
  answers: Record<string, unknown>;
  selectedCategory: string | null;
  healthConsent: boolean;
}

interface WizardState extends WizardProgress {
  mode: AssessmentMode;
  progressByMode: Record<AssessmentMode, WizardProgress>;
}

interface WizardActions {
  setMode: (mode: AssessmentMode) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStepAnswers: (values: Record<string, unknown>) => void;
  setSelectedCategory: (category: string) => void;
  setHealthConsent: (value: boolean) => void;
  reset: (mode?: AssessmentMode) => void;
}

type WizardStore = WizardState & WizardActions;

const createInitialProgress = (): WizardProgress => ({
  currentStep: 0,
  answers: {},
  selectedCategory: null,
  healthConsent: false,
});

const initialPublicProgress = createInitialProgress();
const initialDashboardProgress = createInitialProgress();

const initialState: WizardState = {
  ...initialPublicProgress,
  mode: 'public',
  progressByMode: {
    public: initialPublicProgress,
    dashboard: initialDashboardProgress,
  },
};

function withActiveProgress(
  state: WizardState,
  update: Partial<WizardProgress>,
): Partial<WizardState> {
  const progress = { ...state.progressByMode[state.mode], ...update };
  return {
    ...progress,
    progressByMode: {
      ...state.progressByMode,
      [state.mode]: progress,
    },
  };
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      ...initialState,

      setMode: (mode) =>
        set((state) => {
          if (state.mode === mode) return state;
          return {
            mode,
            ...state.progressByMode[mode],
          };
        }),

      setCurrentStep: (step) =>
        set((state) => withActiveProgress(state, {
          currentStep: Math.max(0, Math.min(step, 5)),
        })),

      nextStep: () =>
        set((state) => withActiveProgress(state, {
          currentStep: Math.min(state.currentStep + 1, 5),
        })),

      prevStep: () =>
        set((state) => withActiveProgress(state, {
          currentStep: Math.max(state.currentStep - 1, 0),
        })),

      setStepAnswers: (values) =>
        set((state) => withActiveProgress(state, {
          answers: { ...state.answers, ...values },
        })),

      setSelectedCategory: (category) =>
        set((state) => withActiveProgress(state, { selectedCategory: category })),

      setHealthConsent: (value) =>
        set((state) => withActiveProgress(state, { healthConsent: value })),

      reset: (mode) =>
        set((state) => {
          const targetMode = mode ?? state.mode;
          const resetProgress = createInitialProgress();
          const progressByMode = {
            ...state.progressByMode,
            [targetMode]: resetProgress,
          };

          return targetMode === state.mode
            ? { ...resetProgress, progressByMode }
            : { progressByMode };
        }),
    }),
    {
      name: 'gigsecure-wizard',
      version: 2,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
      migrate: (persistedState, version) => {
        if (version >= 2) return persistedState as WizardStore;

        const legacy = persistedState as Partial<WizardProgress>;
        const publicProgress: WizardProgress = {
          currentStep: legacy.currentStep ?? 0,
          answers: legacy.answers ?? {},
          selectedCategory: legacy.selectedCategory ?? null,
          healthConsent: legacy.healthConsent ?? false,
        };

        return {
          ...(persistedState as object),
          ...publicProgress,
          mode: 'public' as const,
          progressByMode: {
            public: publicProgress,
            dashboard: createInitialProgress(),
          },
        } as WizardStore;
      },
      partialize: (state) => ({
        mode: state.mode,
        currentStep: state.currentStep,
        answers: state.answers,
        selectedCategory: state.selectedCategory,
        healthConsent: state.healthConsent,
        progressByMode: state.progressByMode,
      }),
    },
  ),
);
