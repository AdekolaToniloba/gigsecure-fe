import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Request a GigSecure password reset link.',
};

export default function ForgotPasswordPage() {
  return <div className="sr-only">Forgot password</div>;
}
