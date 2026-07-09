import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PersonalInformationSection } from '@/components/dashboard/profile/personal-information-section';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  emptyProfileResponseFixture,
  fullProfileResponseFixture,
} from '@/mocks/fixtures/profile';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const PROFILE_URL = `${BASE}${ENDPOINTS.USERS.ME}`;

function renderSection(
  ui: React.ReactElement,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
) {
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setSession({
      accessToken: 'profile-section-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
});

describe('PersonalInformationSection', () => {
  it('renders contracted personal fields, including read-only email and empty-value fallbacks', () => {
    renderSection(
      <PersonalInformationSection profileResponse={emptyProfileResponseFixture} />,
    );

    expect(screen.getByText('test@gigsecure.com')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('test@gigsecure.com')).not.toBeInTheDocument();
    expect(screen.getByText('Basic details')).toBeInTheDocument();
    expect(screen.getByText('Personal details')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Work profile')).toBeInTheDocument();
    expect(screen.getAllByText('Not provided').length).toBeGreaterThan(1);
  });

  it('keeps save disabled until a documented field changes', async () => {
    const user = userEvent.setup();
    renderSection(
      <PersonalInformationSection profileResponse={fullProfileResponseFixture} />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Basic details' }));

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('test@gigsecure.com')).not.toBeInTheDocument();
  });

  it('cancels unsaved edits, restores the original values, and returns focus to the edit trigger', async () => {
    const user = userEvent.setup();
    renderSection(
      <PersonalInformationSection profileResponse={fullProfileResponseFixture} />,
    );

    const editButton = screen.getByRole('button', { name: 'Edit Basic details' });
    await user.click(editButton);

    const firstNameInput = screen.getByLabelText('First name');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Ada');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Basic details' })).toHaveFocus();
  });

  it('submits only changed documented fields, announces success, and reports changed relevant fields', async () => {
    const user = userEvent.setup();
    const onAssessmentRelevantUpdate = vi.fn();
    let submittedBody: Record<string, unknown> | null = null;

    server.use(
      http.put(PROFILE_URL, async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          ...fullProfileResponseFixture,
          user: {
            ...fullProfileResponseFixture.user,
            first_name: 'Ada',
          },
        });
      }),
    );

    renderSection(
      <PersonalInformationSection
        profileResponse={fullProfileResponseFixture}
        onAssessmentRelevantUpdate={onAssessmentRelevantUpdate}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Basic details' }));
    const firstNameInput = screen.getByLabelText('First name');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Ada');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Changes saved successfully.')).toBeInTheDocument();
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
    expect(submittedBody).toEqual({ first_name: 'Ada' });
    expect(onAssessmentRelevantUpdate).toHaveBeenCalledWith(['first_name']);
  });

  it('maps 422 field errors back to the matching form control', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(PROFILE_URL, () =>
        HttpResponse.json(
          {
            detail: [
              {
                loc: ['body', 'occupation'],
                msg: 'Enter a more specific occupation.',
                type: 'value_error',
              },
            ],
          },
          { status: 422 },
        ),
      ),
    );

    renderSection(
      <PersonalInformationSection profileResponse={fullProfileResponseFixture} />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Work profile' }));
    const occupationInput = screen.getByLabelText('Occupation');
    await user.clear(occupationInput);
    await user.type(occupationInput, 'Driver');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findAllByText('Enter a more specific occupation.')).toHaveLength(2);
    expect(occupationInput).toHaveAttribute('aria-invalid', 'true');
    expect(occupationInput).toHaveAttribute('aria-describedby', 'occupation-error');
  });

  it('shows generic API errors through parseApiError output', async () => {
    const user = userEvent.setup();

    server.use(
      http.put(PROFILE_URL, () =>
        HttpResponse.json({ detail: 'Unable to update your profile right now.' }, { status: 400 }),
      ),
    );

    renderSection(
      <PersonalInformationSection profileResponse={fullProfileResponseFixture} />,
    );

    await user.click(screen.getByRole('button', { name: 'Edit Basic details' }));
    const firstNameInput = screen.getByLabelText('First name');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Ada');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to update your profile right now.',
    );
  });

  it('keeps each section mobile-safe without introducing horizontal overflow wrappers', () => {
    const { container } = renderSection(
      <PersonalInformationSection profileResponse={fullProfileResponseFixture} />,
    );

    const sections = container.querySelectorAll('section.rounded-2xl');
    expect(sections).toHaveLength(4);
    sections.forEach((section) => {
      expect(section.className).not.toContain('overflow-x-auto');
    });

    const workSection = screen.getByRole('heading', { name: 'Work profile' }).closest('section');
    expect(workSection).not.toBeNull();
    expect(
      within(workSection as HTMLElement).getByText('tech_freelancer'),
    ).toBeInTheDocument();
  });
});
