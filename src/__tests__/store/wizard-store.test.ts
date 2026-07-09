import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useWizardStore } from '@/store/wizard-store';

beforeEach(() => {
  act(() => {
    useWizardStore.getState().reset('public');
    useWizardStore.getState().reset('dashboard');
    useWizardStore.getState().setMode('public');
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

  it('nextStep caps at 5', () => {
    act(() => {
      for (let i = 0; i < 10; i++) useWizardStore.getState().nextStep();
    });
    expect(useWizardStore.getState().currentStep).toBe(5);
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

  it('keeps public and dashboard progress isolated', () => {
    act(() => {
      useWizardStore.getState().setStepAnswers({ first_name: 'Public user' });
      useWizardStore.getState().setSelectedCategory('public_category');
      useWizardStore.getState().nextStep();
      useWizardStore.getState().setMode('dashboard');
    });

    expect(useWizardStore.getState()).toMatchObject({
      mode: 'dashboard',
      currentStep: 0,
      answers: {},
      selectedCategory: null,
    });

    act(() => {
      useWizardStore.getState().setStepAnswers({ first_name: 'Dashboard user' });
      useWizardStore.getState().setSelectedCategory('dashboard_category');
      useWizardStore.getState().setMode('public');
    });

    expect(useWizardStore.getState()).toMatchObject({
      mode: 'public',
      currentStep: 1,
      answers: { first_name: 'Public user' },
      selectedCategory: 'public_category',
    });

    act(() => useWizardStore.getState().setMode('dashboard'));
    expect(useWizardStore.getState()).toMatchObject({
      answers: { first_name: 'Dashboard user' },
      selectedCategory: 'dashboard_category',
    });
  });

  it('resets only the requested mode', () => {
    act(() => {
      useWizardStore.getState().setStepAnswers({ first_name: 'Public user' });
      useWizardStore.getState().setMode('dashboard');
      useWizardStore.getState().setStepAnswers({ first_name: 'Dashboard user' });
      useWizardStore.getState().reset('public');
    });

    expect(useWizardStore.getState().answers).toEqual({ first_name: 'Dashboard user' });
    act(() => useWizardStore.getState().setMode('public'));
    expect(useWizardStore.getState().answers).toEqual({});
  });

  it('persists only namespaced wizard progress in session storage', () => {
    act(() => {
      useWizardStore.getState().setStepAnswers({ first_name: 'Public user' });
    });

    const persisted = sessionStorage.getItem('gigsecure-wizard');
    expect(persisted).toContain('progressByMode');
    expect(persisted).toContain('Public user');
    expect(persisted).not.toContain('access_token');
    expect(localStorage.getItem('gigsecure-wizard')).toBeNull();
  });
});
