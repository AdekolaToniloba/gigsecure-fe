import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportActions } from '@/components/risk-assessment/report/report-actions';
import { createRiskReportDisplayModel } from '@/lib/risk/report-display-model';
import { mockAssessmentResponse } from '@/__tests__/fixtures/mockAssessmentResponse';

const pdfMocks = vi.hoisted(() => ({
  rendererLoads: 0,
  documentLoads: 0,
  pdf: vi.fn(),
  toBlob: vi.fn(),
}));

vi.mock('@react-pdf/renderer', () => {
  pdfMocks.rendererLoads += 1;
  return { pdf: pdfMocks.pdf };
});

vi.mock('@/app/(wizard)/assessment/_components/report/RiskReportPDF', () => {
  pdfMocks.documentLoads += 1;
  return { default: () => null };
});

const report = createRiskReportDisplayModel(mockAssessmentResponse);

describe('ReportActions', () => {
  beforeEach(() => {
    pdfMocks.pdf.mockReset();
    pdfMocks.toBlob.mockReset();
    pdfMocks.toBlob.mockResolvedValue(new Blob(['risk report'], { type: 'application/pdf' }));
    pdfMocks.pdf.mockReturnValue({ toBlob: pdfMocks.toBlob });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:risk-report');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('loads the PDF renderer and document only after activation', async () => {
    render(<ReportActions report={report} />);

    expect(pdfMocks.rendererLoads).toBe(0);
    expect(pdfMocks.documentLoads).toBe(0);
    expect(pdfMocks.pdf).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    await waitFor(() => expect(pdfMocks.toBlob).toHaveBeenCalledOnce());
    expect(pdfMocks.rendererLoads).toBe(1);
    expect(pdfMocks.documentLoads).toBe(1);
    expect(pdfMocks.pdf).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ report }) }),
    );
  });

  it('announces pending and success states, downloads a stable filename, and cleans up', async () => {
    let resolveBlob!: (blob: Blob) => void;
    pdfMocks.toBlob.mockReturnValue(new Promise<Blob>((resolve) => {
      resolveBlob = resolve;
    }));
    const user = userEvent.setup();
    render(<ReportActions report={report} />);

    await user.click(screen.getByRole('button', { name: 'Download PDF' }));

    expect(screen.getByRole('button', { name: 'Preparing PDF…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Preparing PDF…' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Preparing your PDF report.');

    resolveBlob(new Blob(['risk report'], { type: 'application/pdf' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Your PDF download is ready.');
    const clickedLink = vi.mocked(HTMLAnchorElement.prototype.click).mock.instances[0] as HTMLAnchorElement;
    expect(clickedLink).toHaveAttribute('download', 'gigsecure-risk-report.pdf');
    expect(document.body).not.toContainElement(clickedLink);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:risk-report');
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument();
  });

  it('announces generation failures and retries successfully', async () => {
    pdfMocks.toBlob
      .mockRejectedValueOnce(new Error('renderer failed'))
      .mockResolvedValueOnce(new Blob(['risk report'], { type: 'application/pdf' }));
    const user = userEvent.setup();
    render(<ReportActions report={report} />);

    await user.click(screen.getByRole('button', { name: 'Download PDF' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't create your PDF. Please try again.",
    );
    await user.click(screen.getByRole('button', { name: 'Try download again' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Your PDF download is ready.');
    expect(pdfMocks.toBlob).toHaveBeenCalledTimes(2);
  });
});
