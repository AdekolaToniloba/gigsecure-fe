import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaitlistPage from '@/app/(wizard)/waitlist/page';
import { renderWithProviders, mockRouter, mockSearchParams } from '../test-utils';
import { useAuthStore } from '@/store/auth-store';
import { delay, http, HttpResponse } from 'msw';
import { server } from '@/mocks/index';
import { WAITLIST_RISK_ACCESS_TOKEN } from '@/mocks/fixtures/risk-assessment';

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

describe('WaitlistPage', () => {
  it('renders email, first name, and last name fields', () => {
    renderWithProviders(<WaitlistPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start my assessment/i })).toBeInTheDocument();
  });

  it('empty submit shows validation errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WaitlistPage />);
    
    const btn = screen.getByRole('button', { name: /start my assessment/i });
    
    await user.click(btn);
    
    expect(await screen.findAllByText(/First name is required/i)).toHaveLength(1); // first name
  });

  it('invalid email shows format error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WaitlistPage />);
    
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.click(screen.getByRole('button', { name: /start my assessment/i }));
    
    expect(await screen.findByText(/Invalid email/i)).toBeInTheDocument();
  });

  it('successful submit stores token, shows success message, and redirects', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WaitlistPage />);
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    
    await user.click(screen.getByRole('button', { name: /start my assessment/i }));
    
    // Expect success UI
    expect(await screen.findByText('You are on the list!')).toBeInTheDocument();
    
    // Store should be updated
    expect(useAuthStore.getState().accessToken).toBe(WAITLIST_RISK_ACCESS_TOKEN);
    expect(useAuthStore.getState().firstName).toBe('John');
    
    // Wait for the 2000ms redirect
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/assessment');
    }, { timeout: 2500 });
  });

  it('API error shows inline error message', async () => {
    server.use(
      http.post('/api/auth/waitlist', () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 400 })
      )
    );
    
    const user = userEvent.setup();
    renderWithProviders(<WaitlistPage />);
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    
    await user.click(screen.getByRole('button', { name: /start my assessment/i }));
    
    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });

  it('submit button disabled while pending', async () => {
    server.use(
      http.post('/api/auth/waitlist', async () => {
        await delay(250);
        return HttpResponse.json({
          message: 'Successfully joined the waitlist!',
          user_id: 'user-id',
          access_token: 'mock-waitlist-token',
          token_type: 'bearer',
        });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<WaitlistPage />);
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    
    const button = screen.getByRole('button', { name: /start my assessment/i });
    await user.click(button);
    
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/authenticating/i);
  });

  it('displays session expired banner when ?expired=true', () => {
    mockSearchParams.set('expired', 'true');
    renderWithProviders(<WaitlistPage />);
    
    expect(screen.getByRole('status')).toHaveTextContent(/your session expired/i);
    mockSearchParams.delete('expired'); // cleanup
  });

  it('prefetches the public assessment route without routing through login', () => {
    renderWithProviders(<WaitlistPage />);
    expect(mockRouter.prefetch).toHaveBeenCalledWith('/assessment');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/login');
  });
});
