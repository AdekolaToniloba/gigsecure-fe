import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useWizardStore } from '@/store/wizard-store';

beforeEach(() => {
  act(() => {
    useWizardStore.getState().reset();
  });
});

describe('useWizardStore', () => {
  it('has correct initial state', () => {
    const state = useWizardStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.healthConsent).toBe(false);
  });

  it('nextStep increments currentStep', () => {
    act(() => { useWizardStore.getState().nextStep(); });
    expect(useWizardStore.getState().currentStep).toBe(1);
  });

  it('nextStep caps at 4', () => {
    act(() => {
      for (let i = 0; i < 10; i++) useWizardStore.getState().nextStep();
    });
    expect(useWizardStore.getState().currentStep).toBe(4);
  });

  it('prevStep decrements currentStep', () => {
    act(() => {
      useWizardStore.getState().nextStep();
      useWizardStore.getState().nextStep();
      useWizardStore.getState().prevStep();
    });
    expect(useWizardStore.getState().currentStep).toBe(1);
  });

  it('prevStep floors at 0', () => {
    act(() => {
      useWizardStore.getState().prevStep();
      useWizardStore.getState().prevStep();
    });
    expect(useWizardStore.getState().currentStep).toBe(0);
  });

  it('setStepAnswers merges into answers', () => {
    act(() => {
      useWizardStore.getState().setStepAnswers({ q1: 'A' });
      useWizardStore.getState().setStepAnswers({ q2: 'B' });
    });
    expect(useWizardStore.getState().answers).toEqual({ q1: 'A', q2: 'B' });
  });

  it('setHealthConsent sets the consent flag', () => {
    act(() => { useWizardStore.getState().setHealthConsent(true); });
    expect(useWizardStore.getState().healthConsent).toBe(true);
  });

  it('reset restores initial state', () => {
    act(() => {
      useWizardStore.getState().nextStep();
      useWizardStore.getState().setStepAnswers({ q1: 'A' });
      useWizardStore.getState().setHealthConsent(true);
      useWizardStore.getState().reset();
    });
    const state = useWizardStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.healthConsent).toBe(false);
  });
});
