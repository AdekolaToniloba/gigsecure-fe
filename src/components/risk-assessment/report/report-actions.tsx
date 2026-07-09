'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { RiskReportDisplayModel } from '@/lib/risk/report-display-model';

const REPORT_FILENAME = 'gigsecure-risk-report.pdf';

type DownloadState = 'idle' | 'pending' | 'success' | 'error';

type ReportActionsProps = {
  report: RiskReportDisplayModel;
  tone?: 'default' | 'accent';
};

export function ReportActions({ report, tone = 'default' }: ReportActionsProps) {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const isPending = downloadState === 'pending';

  const downloadReport = async () => {
    if (isPending) return;

    setDownloadState('pending');
    let objectUrl: string | null = null;
    let downloadLink: HTMLAnchorElement | null = null;

    try {
      const [{ pdf }, { default: RiskReportPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/app/(wizard)/assessment/_components/report/RiskReportPDF'),
      ]);
      const blob = await pdf(<RiskReportPDF report={report} />).toBlob();
      objectUrl = URL.createObjectURL(blob);
      downloadLink = document.createElement('a');
      downloadLink.href = objectUrl;
      downloadLink.download = REPORT_FILENAME;
      downloadLink.hidden = true;
      document.body.append(downloadLink);
      downloadLink.click();
      setDownloadState('success');
    } catch {
      setDownloadState('error');
    } finally {
      downloadLink?.remove();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  };

  const buttonClasses = tone === 'accent'
    ? 'bg-accent text-primary hover:bg-accent-alt'
    : 'border border-primary bg-white text-primary hover:bg-app-sidebar';
  const statusClasses = tone === 'accent' ? 'text-white' : 'text-primary-light';

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void downloadReport()}
        disabled={isPending}
        aria-busy={isPending}
        className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-body text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${buttonClasses}`}
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{downloadState === 'error' ? 'Try download again' : isPending ? 'Preparing PDF…' : 'Download PDF'}</span>
      </button>

      <div className={`min-w-0 text-sm ${statusClasses}`} aria-live="polite">
        {downloadState === 'pending' ? (
          <p role="status">Preparing your PDF report.</p>
        ) : downloadState === 'success' ? (
          <p role="status">Your PDF download is ready.</p>
        ) : downloadState === 'error' ? (
          <p role="alert">We couldn&apos;t create your PDF. Please try again.</p>
        ) : null}
      </div>
    </div>
  );
}
