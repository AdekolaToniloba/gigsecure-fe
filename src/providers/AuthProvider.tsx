'use client';

import { useEffect, useRef } from 'react';
import { initializeAuthSession } from '@/lib/auth/session';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    void initializeAuthSession();
  }, []);

  return <>{children}</>;
}
