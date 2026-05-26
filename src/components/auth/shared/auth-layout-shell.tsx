'use client';

import { usePathname } from 'next/navigation';
import { AuthShell } from '@/components/auth/shared/auth-shell';

const REGISTER_IMAGE = '/assets/images/auth-register.png';
const LOGIN_IMAGE = '/assets/images/auth-login.png';
const FORGOT_PASSWORD_IMAGE = '/assets/images/auth-forgot-password.png';

const registerImageAlt = 'Smiling gig worker recording content at a desk';
const forgotPasswordImageAlt = 'Gig worker in an orange jacket working on a laptop';

type AuthLayoutShellProps = {
  children: React.ReactNode;
};

function getShellProps(pathname: string) {
  if (pathname === '/login') {
    return {
      imageSrc: LOGIN_IMAGE,
      imageAlt: 'Gig worker seated at a desk looking focused',
    };
  }

  if (pathname === '/forgot-password' || pathname === '/reset-password') {
    return {
      imageSrc: FORGOT_PASSWORD_IMAGE,
      imageAlt: forgotPasswordImageAlt,
    };
  }

  return {
    imageSrc: REGISTER_IMAGE,
    imageAlt: registerImageAlt,
  };
}

export default function AuthLayoutShell({ children }: AuthLayoutShellProps) {
  const pathname = usePathname();

  return <AuthShell {...getShellProps(pathname)}>{children}</AuthShell>;
}
