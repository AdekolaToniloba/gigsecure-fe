import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your GigSecure account password.',
};

export default function ResetPasswordPage() {
  return <div className="sr-only">Reset password</div>;
}
