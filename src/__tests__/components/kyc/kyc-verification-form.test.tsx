import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KycVerificationForm } from '@/components/kyc/verify/kyc-verification-form';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';
import { mockRouter, renderWithProviders } from '@/__tests__/test-utils';

vi.mock('@/components/ui/DatePicker', () => ({
  default: ({
    id,
    name,
    value,
    onChange,
    onBlur,
    disabled,
    ariaDescribedBy,
  }: {
    id?: string;
    name?: string;
    value?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    disabled?: boolean;
    ariaDescribedBy?: string;
  }) => (
    <input
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      aria-describedby={ariaDescribedBy}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  ),
}));

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

function setAuthenticatedSession() {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'access-token',
      kycVerified: false,
      riskAssessed: true,
    });
  });
}

async function fillValidForm(documentNumber = '12345678901') {
  const user = userEvent.setup();

  await user.clear(screen.getByLabelText(/Document number/i));
  await user.type(screen.getByLabelText(/Document number/i), documentNumber);
  await user.clear(screen.getByLabelText(/First name/i));
  await user.type(screen.getByLabelText(/First name/i), 'Amaka');
  await user.clear(screen.getByLabelText(/Last name/i));
  await user.type(screen.getByLabelText(/Last name/i), 'Obi');
  await user.clear(screen.getByLabelText(/Date of birth/i));
  await user.type(screen.getByLabelText(/Date of birth/i), '15/06/1995');

  return user;
}

beforeEach(() => {
  mockRouter.push.mockReset();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('KycVerificationForm', () => {
  it('prefills profile fields when user profile data is available and keeps them editable', async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/users/me`, () =>
        HttpResponse.json({
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'amaka@example.com',
            first_name: 'Amaka',
            last_name: 'Obi',
            status: 'active',
            role: 'user',
            email_verified: true,
            phone_number: null,
            last_login_at: null,
            created_at: '2026-04-24T10:00:00Z',
          },
          profile: {
            date_of_birth: '1995-06-15',
            gender: null,
            address_line_1: null,
            address_line_2: null,
            city: null,
            state: null,
            country: null,
            postal_code: null,
            occupation: null,
            gig_platform: null,
            average_monthly_income: null,
            years_of_experience: null,
            profile_picture_url: null,
          },
          kyc_verified: false,
          risk_assessed: true,
        })
      )
    );
    setAuthenticatedSession();

    renderWithProviders(<KycVerificationForm />);

    expect(await screen.findByDisplayValue('Amaka')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Obi')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15/06/1995')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/First name/i));
    await userEvent.type(screen.getByLabelText(/First name/i), 'Ada');

    expect(screen.getByLabelText(/First name/i)).toHaveValue('Ada');
  });

  it('validates the document number before submission', async () => {
    setAuthenticatedSession();
    renderWithProviders(<KycVerificationForm />);
    const user = await fillValidForm('123');

    await user.click(screen.getByRole('button', { name: /Submit verification/i }));

    expect(await screen.findByText(/Document number must be exactly 11 digits/i)).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('submits the exact KYC payload and redirects after verified success', async () => {
    let submittedPayload: unknown;
    server.use(
      http.get(`${baseUrl}/api/v1/users/me`, () =>
        HttpResponse.json({
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'amaka@example.com',
            first_name: 'Amaka',
            last_name: 'Obi',
            status: 'active',
            role: 'user',
            email_verified: true,
            phone_number: null,
            last_login_at: null,
            created_at: '2026-04-24T10:00:00Z',
          },
          profile: null,
          kyc_verified: true,
          risk_assessed: true,
        })
      ),
      http.post(`${baseUrl}/api/v1/kyc/verify`, async ({ request }) => {
        submittedPayload = await request.json();
        return HttpResponse.json({
          status: 'verified',
          message: 'Identity verified successfully.',
          smile_job_id: '500000001',
        });
      })
    );
    setAuthenticatedSession();
    renderWithProviders(<KycVerificationForm />);
    const user = await fillValidForm();

    await user.click(screen.getByRole('button', { name: /Submit verification/i }));

    await waitFor(() => {
      expect(submittedPayload).toEqual({
        document_type: 'NIN',
        document_number: '12345678901',
        first_name: 'Amaka',
        last_name: 'Obi',
        date_of_birth: '1995-06-15',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
    expect(useAuthStore.getState().kycVerified).toBe(true);
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(/Identity verified/i);
  });

  it('shows rejected copy, leaves the store flag unchanged, and starts cooldown', async () => {
    setAuthenticatedSession();
    renderWithProviders(<KycVerificationForm />);
    const user = await fillValidForm('11111111111');

    await user.click(screen.getByRole('button', { name: /Submit verification/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Details did not match records/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/Double-check your identity slip or card details/i);
    expect(screen.getByText(/Retry cooldown active/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit verification/i })).toBeDisabled();
    expect(useAuthStore.getState().kycVerified).toBe(false);
  });

  it('shows failed copy without implying user fault and starts cooldown', async () => {
    setAuthenticatedSession();
    renderWithProviders(<KycVerificationForm />);
    const user = await fillValidForm('22222222222');

    await user.click(screen.getByRole('button', { name: /Submit verification/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Verification could not be completed/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/not caused by your details/i);
    expect(screen.getByText(/Retry cooldown active/i)).toBeInTheDocument();
    expect(useAuthStore.getState().kycVerified).toBe(false);
  });

  it('shows parsed API errors from failed verification requests', async () => {
    server.use(
      http.post(`${baseUrl}/api/v1/kyc/verify`, () =>
        HttpResponse.json({ detail: 'Verification service is unavailable.' }, { status: 400 })
      )
    );
    setAuthenticatedSession();
    renderWithProviders(<KycVerificationForm />);
    const user = await fillValidForm();

    await user.click(screen.getByRole('button', { name: /Submit verification/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Verification service is unavailable.');
  });

  it('keeps document type fixed without rendering a selectable document type option', () => {
    setAuthenticatedSession();
    renderWithProviders(<KycVerificationForm />);

    expect(screen.getByText('NIN')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Document type/i })).not.toBeInTheDocument();
  });
});
