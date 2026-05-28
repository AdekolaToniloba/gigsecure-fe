import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KycRequiredModal } from '@/components/kyc/shared/kyc-required-modal';

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigation.push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

beforeEach(() => {
  navigation.push.mockReset();
});

describe('KycRequiredModal', () => {
  it('renders accessible dialog semantics and focuses the close button', async () => {
    render(<KycRequiredModal isOpen onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: /KYC verification required/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(/Complete KYC verification/i);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Close KYC required dialog/i })).toHaveFocus();
    });
  });

  it('does not render when closed', () => {
    render(<KycRequiredModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes by button, Escape, and backdrop interaction', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<KycRequiredModal isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Not now/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(<KycRequiredModal isOpen onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(<KycRequiredModal isOpen onClose={onClose} />);
    await user.click(screen.getByTestId('kyc-required-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps keyboard focus inside the dialog', async () => {
    const user = userEvent.setup();
    render(<KycRequiredModal isOpen onClose={vi.fn()} />);

    const closeButton = screen.getByRole('button', { name: /Close KYC required dialog/i });
    const cta = screen.getByRole('button', { name: /Go to KYC/i });

    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    await user.tab({ shift: true });
    expect(cta).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('routes to KYC from the CTA and can preserve an intended destination', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<KycRequiredModal isOpen onClose={onClose} returnTo="/dashboard?tab=plans" />);

    await user.click(screen.getByRole('button', { name: /Go to KYC/i }));

    expect(navigation.push).toHaveBeenCalledWith('/kyc?redirect=%2Fdashboard%3Ftab%3Dplans');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
