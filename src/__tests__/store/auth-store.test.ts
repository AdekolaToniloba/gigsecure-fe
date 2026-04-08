import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAuthStore } from '@/store/auth-store';

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('useAuthStore', () => {
  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.firstName).toBeNull();
    expect(state.lastName).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setAccessToken sets token and marks authenticated', () => {
    act(() => { useAuthStore.getState().setAccessToken('test-token'); });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('test-token');
    expect(state.isAuthenticated).toBe(true);
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
      useAuthStore.getState().setUserMeta('John', 'Doe');
      useAuthStore.getState().clearAuth();
    });
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.firstName).toBeNull();
    expect(state.lastName).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
