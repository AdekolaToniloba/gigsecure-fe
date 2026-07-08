'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { RefreshCw } from 'lucide-react';
import { createRiskReportDisplayModel } from '@/lib/risk/report-display-model';
import type { AssessmentResponse } from '@/types/api';
import { PersonalizedInsights } from './personalized-insights';
import { RecommendedProducts } from './recommended-products';
import { ReportActions } from './report-actions';
import { RiskExposureGrid } from './risk-exposure-grid';
import { RiskScoreCard } from './risk-score-card';

type AssessedReportProps = {
  assessment: AssessmentResponse;
  onReassess: () => void;
  updateButtonRef: RefObject<HTMLButtonElement | null>;
};

export function AssessedReport({ assessment, onReassess, updateButtonRef }: AssessedReportProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreUpdateFocus = useRef(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const report = createRiskReportDisplayModel(assessment);

  useEffect(() => headingRef.current?.focus(), []);

  useEffect(() => {
    if (!showConfirmation) {
      if (restoreUpdateFocus.current) {
        restoreUpdateFocus.current = false;
        updateButtonRef.current?.focus();
      }
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showConfirmation, updateButtonRef]);

  const closeConfirmation = () => {
    restoreUpdateFocus.current = true;
    setShowConfirmation(false);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeConfirmation();
      return;
    }
    if (event.key !== 'Tab') return;

    const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <section aria-labelledby="assessment-summary-title" className="min-w-0">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            ref={headingRef}
            id="assessment-summary-title"
            tabIndex={-1}
            className="break-words font-heading text-2xl font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary [overflow-wrap:anywhere]"
          >
            {report.applicant.fullName ? `${report.applicant.fullName}’s risk profile` : 'Your risk profile'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-light sm:text-base">
            Your latest score and personalized assessment insights.
          </p>
        </div>
        <button
          ref={updateButtonRef}
          type="button"
          onClick={() => setShowConfirmation(true)}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Update assessment
        </button>
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.7fr)]">
        <RiskScoreCard
          applicant={report.applicant}
          score={report.score}
          riskProfile={report.riskProfile}
        />
        <PersonalizedInsights insights={report.insights} />
      </div>
      <RiskExposureGrid exposures={report.exposures} />
      <RecommendedProducts />
      <section
        aria-labelledby="risk-report-actions-title"
        className="mt-8 min-w-0 rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6"
      >
        <h3 id="risk-report-actions-title" className="font-heading text-xl font-bold text-primary">
          Save your risk summary
        </h3>
        <p className="mt-2 text-sm leading-6 text-primary-light">
          Download a PDF of your full risk profile.
        </p>
        <div className="mt-4">
          <ReportActions report={report} />
        </div>
      </section>

      {showConfirmation ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeConfirmation();
          }}
        >
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reassessment-confirmation-title"
            aria-describedby="reassessment-confirmation-description"
            onKeyDown={handleDialogKeyDown}
            className="w-full max-w-md rounded-2xl border border-app-border bg-white p-6 shadow-2xl sm:p-7"
          >
            <h3 id="reassessment-confirmation-title" className="font-heading text-xl font-bold text-primary">
              Start a new assessment?
            </h3>
            <p id="reassessment-confirmation-description" className="mt-3 text-sm leading-6 text-slate-600">
              Your saved report will stay unchanged until you submit. Any unfinished reassessment answers will be cleared.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={closeConfirmation}
                className="min-h-11 rounded-lg border border-primary px-5 py-2.5 text-sm font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Keep current report
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmation(false);
                  onReassess();
                }}
                className="min-h-11 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Start new assessment
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
