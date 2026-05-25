import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mail, User } from 'lucide-react';
import { AuthShell, AuthFormPanel } from '@/components/auth/shared/auth-shell';
import FormField from '@/components/auth/shared/form-field';
import PasswordField from '@/components/auth/shared/password-field';
import { PasswordChecklist } from '@/components/auth/shared/password-checklist';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import AuthSubmitButton from '@/components/auth/shared/auth-submit-button';
import { AuthStatus } from '@/components/auth/shared/auth-status';
import { AuthDivider } from '@/components/auth/shared/auth-divider';
import GoogleAuthButton from '@/components/auth/shared/google-auth-button';

vi.mock('next/image', async () => ({
  default: (await import('@/__tests__/mock-components')).MockImage,
}));

describe('shared auth UI primitives', () => {
  it('renders the auth shell with brand, cancel link, image, and quote area', () => {
    render(
      <AuthShell
        imageSrc="/auth-photo.jpg"
        imageAlt="Gig worker using a laptop"
        cancelHref="/"
      >
        <AuthFormPanel
          title="Welcome back"
          subtitle="Continue managing your income, risks, and protection"
        >
          <p>Form goes here</p>
        </AuthFormPanel>
      </AuthShell>
    );

    expect(screen.getByRole('link', { name: /GigSecure home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Cancel/i })).toHaveAttribute('href', '/');
    expect(screen.getByAltText('Gig worker using a laptop')).toHaveAttribute('src', '/auth-photo.jpg');
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByText(/Never depend on a single income/i)).toBeInTheDocument();
  });

  it('associates field labels, descriptions, and errors with inputs', () => {
    render(
      <FormField
        id="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        description="Use your work email"
        error="Email is required"
        icon={<Mail className="h-4 w-4" />}
        required
      />
    );

    const field = screen.getByLabelText(/Email/i);
    expect(field).toHaveAccessibleDescription(/Use your work email Email is required/i);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('toggles password visibility with an accessible button', async () => {
    const user = userEvent.setup();
    render(
      <PasswordField
        id="password"
        label="Password"
        placeholder="Enter your password"
        required
      />
    );

    const field = screen.getByLabelText(/Password/i, { selector: 'input' });
    expect(field).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /Show password/i }));
    expect(field).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Hide password/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('renders auth buttons, divider, checklist, alert, and status states accessibly', () => {
    render(
      <div>
        <GoogleAuthButton>Sign in with Google</GoogleAuthButton>
        <AuthDivider />
        <FormField id="first-name" label="First name" icon={<User className="h-4 w-4" />} />
        <PasswordChecklist
          items={[
            { id: 'length', label: 'At least 8 characters', isValid: true },
            { id: 'match', label: 'Passwords match', isValid: false },
          ]}
        />
        <AuthAlert variant="error" title="Could not continue">
          Try again with a different email.
        </AuthAlert>
        <AuthSubmitButton isLoading loadingLabel="Submitting">
          Submit
        </AuthSubmitButton>
        <AuthStatus title="Email sent" description="We sent a password reset link." />
      </div>
    );

    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not continue/i);
    expect(screen.getByRole('button', { name: /Submitting/i })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(/Email sent/i);
  });
});
