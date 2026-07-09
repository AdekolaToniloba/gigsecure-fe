'use client';

import { createContext, useContext } from 'react';

type WizardNavigationContextValue = {
  onCancel: () => void;
  stepNumber: number;
  totalSteps: number;
  focusQuestion: (questionId: string) => void;
};

const WizardNavigationContext = createContext<WizardNavigationContextValue | null>(null);

export function WizardNavigationProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: WizardNavigationContextValue;
}) {
  return (
    <WizardNavigationContext.Provider value={value}>
      {children}
    </WizardNavigationContext.Provider>
  );
}

export function useWizardNavigation() {
  const context = useContext(WizardNavigationContext);
  if (!context) {
    throw new Error('Wizard step controls must be rendered inside RiskAssessmentWizard');
  }
  return context;
}
