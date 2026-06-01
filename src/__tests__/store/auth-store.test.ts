import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useAuthStore } from '@/store/auth-store';

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('useAuthStore', () => {
  it('has correct cleared unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.firstName).toBeNull();
    expect(state.lastName).toBeNull();
    expect(state.kycVerified).toBeNull();
    expect(state.riskAssessed).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.status).toBe('unauthenticated');
  });

  it('setAccessToken sets token and marks authenticated', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'old-session-token',
        kycVerified: true,
        riskAssessed: true,
      });
      useAuthStore.getState().setAccessToken('test-token');
    });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('test-token');
    expect(state.isAuthenticated).toBe(true);
    expect(state.status).toBe('authenticated');
    expect(state.kycVerified).toBeNull();
    expect(state.riskAssessed).toBeNull();
  });

  it('setSession sets token and full-session flags', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'session-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('session-token');
    expect(state.kycVerified).toBe(false);
    expect(state.riskAssessed).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.status).toBe('authenticated');
  });

  it('setFlags updates session flags without changing the token', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'session-token',
        kycVerified: false,
        riskAssessed: false,
      });
      useAuthStore.getState().setFlags({ riskAssessed: true });
    });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('session-token');
    expect(state.kycVerified).toBe(false);
    expect(state.riskAssessed).toBe(true);
  });

  it('setAccessToken does not persist token to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    act(() => { useAuthStore.getState().setAccessToken('test-token'); });

    expect(localStorage.getItem('gigsecure-auth')).toBeNull();
    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
  });

  it('setAuthInitializing marks auth as initializing without a token', () => {
    act(() => { useAuthStore.getState().setAuthInitializing(); });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.status).toBe('initializing');
  });

  it('setUnauthenticated clears token and marks unauthenticated', () => {
    act(() => {
      useAuthStore.getState().setAccessToken('token');
      useAuthStore.getState().setFlags({ kycVerified: false, riskAssessed: true });
      useAuthStore.getState().setUnauthenticated();
    });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.kycVerified).toBeNull();
    expect(state.riskAssessed).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.status).toBe('unauthenticated');
  });

  it('setUserMeta sets firstName and lastName', () => {
    act(() => { useAuthStore.getState().setUserMeta('John', 'Doe'); });
    const state = useAuthStore.getState();
    expect(state.firstName).toBe('John');
    expect(state.lastName).toBe('Doe');
  });

  it('setUserMeta handles null lastName', () => {
    act(() => { useAuthStore.getState().setUserMeta('Jane', null); });
    expect(useAuthStore.getState().firstName).toBe('Jane');
    expect(useAuthStore.getState().lastName).toBeNull();
  });

  it('clearAuth resets everything', () => {
    act(() => {
      useAuthStore.getState().setAccessToken('token');
      useAuthStore.getState().setFlags({ kycVerified: true, riskAssessed: true });
      useAuthStore.getState().setUserMeta('John', 'Doe');
      useAuthStore.getState().clearAuth();
    });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.firstName).toBeNull();
    expect(state.lastName).toBeNull();
    expect(state.kycVerified).toBeNull();
    expect(state.riskAssessed).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.status).toBe('unauthenticated');
  });
});
