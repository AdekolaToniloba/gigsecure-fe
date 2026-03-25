import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/store/ui-store';
import { act } from '@testing-library/react';

// Reset the Zustand store state before each test
beforeEach(() => {
  act(() => {
    useUIStore.setState({
      isSidebarOpen: false,
      activeModal: null,
    });
  });
});

describe('useUIStore', () => {
  // ─── Sidebar ──────────────────────────────────────────────────────

  it('has isSidebarOpen=false by default', () => {
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
  });

  it('toggleSidebar opens the sidebar when it is closed', () => {
    act(() => {
      useUIStore.getState().toggleSidebar();
    });
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });

  it('toggleSidebar closes the sidebar when it is open', () => {
    act(() => {
      useUIStore.setState({ isSidebarOpen: true });
      useUIStore.getState().toggleSidebar();
    });
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
  });

  // ─── Modal ────────────────────────────────────────────────────────

  it('has activeModal=null by default', () => {
    expect(useUIStore.getState().activeModal).toBeNull();
  });

  it('openModal sets the activeModal id', () => {
    act(() => {
      useUIStore.getState().openModal('confirm-delete');
    });
    expect(useUIStore.getState().activeModal).toBe('confirm-delete');
  });

  it('openModal replaces an existing active modal', () => {
    act(() => {
      useUIStore.getState().openModal('first-modal');
      useUIStore.getState().openModal('second-modal');
    });
    expect(useUIStore.getState().activeModal).toBe('second-modal');
  });

  it('closeModal resets activeModal to null', () => {
    act(() => {
      useUIStore.getState().openModal('some-modal');
      useUIStore.getState().closeModal();
    });
    expect(useUIStore.getState().activeModal).toBeNull();
  });
});
