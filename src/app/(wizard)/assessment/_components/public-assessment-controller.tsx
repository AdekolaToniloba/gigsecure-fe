'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RiskAssessmentWizard } from '@/components/risk-assessment/wizard';
import { profileToWizardDefaults } from '@/lib/risk/profile-to-wizard-defaults';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';
import type { AssessmentResponse } from '@/types/api';

const PublicReportScreen = dynamic(() => import('./ReportScreen'), {
  loading: () => (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10" role="status">
      Preparing your risk report…
    </div>
  ),
});

const HANDOFF_TIMING_KEY = 'gs_waitlist_handoff_start_ms';

function getTimestampMs() {
  return performance.timeOrigin + performance.now();
}

function handlePublicSuccess() {
  // Task 11 owns mode-specific progress and query synchronization.
}

export default function PublicAssessmentController() {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const firstName = useAuthStore((state) => state.firstName);
  const lastName = useAuthStore((state) => state.lastName);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const reset = useWizardStore((state) => state.reset);
  const isRecoveringAuthentication = useRef(false);
  const initialDefaults = useMemo(
    () => profileToWizardDefaults({
      mode: 'public',
      waitlistUser: { firstName, lastName },
    }),
    [firstName, lastName],
  );

  useEffect(() => {
    if (!token && !isRecoveringAuthentication.current) router.push('/waitlist');
  }, [router, token]);

  useEffect(() => {
    if (!token) return;
    const startedAtRaw = sessionStorage.getItem(HANDOFF_TIMING_KEY);
    if (!startedAtRaw) return;
    const startedAtMs = Number.parseInt(startedAtRaw, 10);
    sessionStorage.removeItem(HANDOFF_TIMING_KEY);
    if (Number.isNaN(startedAtMs)) return;
    const gtag = (window as Window & {
      gtag?: (command: 'event', eventName: string, params?: Record<string, unknown>) => void;
    }).gtag;
    gtag?.('event', 'waitlist_to_assessment_handoff', {
      handoff_duration_ms: getTimestampMs() - startedAtMs,
    });
  }, [token]);

  const handleCancel = useCallback(() => {
    reset('public');
    router.push('/');
  }, [reset, router]);

  const handleAuthenticationFailure = useCallback(() => {
    isRecoveringAuthentication.current = true;
    clearAuth();
    reset('public');
    router.replace('/waitlist?expired=true');
  }, [clearAuth, reset, router]);

  const renderSuccess = useCallback((assessment: AssessmentResponse) => (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <PublicReportScreen data={assessment} />
    </div>
  ), []);

  if (!token) return null;

  return (
    <RiskAssessmentWizard
      mode="public"
      initialDefaults={initialDefaults}
      onCancel={handleCancel}
      onSuccess={handlePublicSuccess}
      onAuthenticationFailure={handleAuthenticationFailure}
      renderSuccess={renderSuccess}
    />
  );
}
