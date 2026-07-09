'use client';

import { Download } from 'lucide-react';
import { useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import { usePolicyReportDownload } from '@/hooks/policies/usePolicies';
import { parseApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

type ReportDownloadButtonProps = {
  policyId: string;
  isAvailable?: boolean;
  className?: string;
};

export function ReportDownloadButton({
  policyId,
  isAvailable = false,
  className,
}: ReportDownloadButtonProps) {
  const downloadReport = usePolicyReportDownload();
  const [statusMessage, setStatusMessage] = useState('');
  const isDownloadInFlightRef = useRef(false);
  const errorMessage = downloadReport.error ? parseApiError(downloadReport.error).message : '';

  async function handleDownload() {
    if (!isAvailable || downloadReport.isPending || isDownloadInFlightRef.current) return;

    setStatusMessage('');
    isDownloadInFlightRef.current = true;
    try {
      const report = await downloadReport.mutateAsync(policyId);
      const url = URL.createObjectURL(report.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatusMessage('Policy report downloaded.');
    } catch {
      setStatusMessage('');
    } finally {
      isDownloadInFlightRef.current = false;
    }
  }

  if (!isAvailable) {
    return (
      <div className={cn('min-w-0', className)}>
        <Button
          type="button"
          variant="secondary"
          disabled
          aria-describedby={`policy-report-unavailable-${policyId}`}
          className="w-full sm:w-auto"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Download Report
        </Button>
        <p
          id={`policy-report-unavailable-${policyId}`}
          className="mt-2 text-xs leading-5 text-slate-500"
        >
          Report download is unavailable until the backend confirms a PDF response.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('min-w-0', className)}>
      <Button
        type="button"
        variant="secondary"
        isLoading={downloadReport.isPending}
        onClick={() => void handleDownload()}
        className="w-full sm:w-auto"
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        {downloadReport.isPending ? 'Downloading' : 'Download Report'}
      </Button>
      <p className="sr-only" role="status" aria-live="polite">
        {downloadReport.isPending ? 'Downloading policy report.' : statusMessage}
      </p>
      {errorMessage ? (
        <p role="alert" className="mt-2 text-xs leading-5 text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
