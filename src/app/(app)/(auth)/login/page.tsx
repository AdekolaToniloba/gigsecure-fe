import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your GigSecure account.',
};

export default function LoginPage() {
  return <div className="sr-only">Login</div>;
}
