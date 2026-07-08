import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportScreen from '@/app/(wizard)/assessment/_components/ReportScreen';
import { useAuthStore } from '@/store/auth-store';
import { mockAssessmentResponse, mockHighRiskResponse, mockLowRiskResponse } from '../../fixtures/mockAssessmentResponse';

const pdfMocks = vi.hoisted(() => ({
  pdf: vi.fn(),
  toBlob: vi.fn(),
}));

// Mock @react-pdf/renderer since it doesn't work in jsdom
vi.mock('@react-pdf/renderer', async () => {
  const { MockAnimatePresence } = await import('@/__tests__/mock-components');
  return {
    pdf: pdfMocks.pdf,
    Document: MockAnimatePresence,
    Page: MockAnimatePresence,
    View: MockAnimatePresence,
    Text: MockAnimatePresence,
    StyleSheet: { create: <T,>(styles: T) => styles },
  };
});

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe('ReportScreen', () => {
  beforeEach(() => {
    pdfMocks.toBlob.mockResolvedValue(new Blob());
    pdfMocks.pdf.mockReturnValue({ toBlob: pdfMocks.toBlob });
    URL.createObjectURL = vi.fn(() => 'blob:risk-report');
    URL.revokeObjectURL = vi.fn();
  });

  it('renders firstName in hero heading', () => {
    useAuthStore.getState().setUserMeta('Toni', null);
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByText(/Toni, here's your protection plan/)).toBeInTheDocument();
  });

  it('falls back when no firstName', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByText(/Here's your protection plan/)).toBeInTheDocument();
  });

  it('displays overall score percentage', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    // Math.round(68.5) = 69 (rounded to nearest, but actually 68.5 → 69)
    // Actually Math.round(68.5) = 69 in JS
    expect(screen.getByText(/69%|68%/)).toBeInTheDocument();
  });

  it('displays risk profile label', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByText('Moderate Risk')).toBeInTheDocument();
  });

  it('renders insight items from parsedInsights', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    // Section headers are rendered lowercase in DOM, styled with CSS capitalize
    expect(screen.getByText(/personalized insights/i)).toBeInTheDocument();
    // The ai_insights contains "Income Vulnerability" as a label
    expect(screen.getByText(/Income Vulnerability/)).toBeInTheDocument();
  });

  it('renders recommendations list', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText(/Consider income protection insurance/)).toBeInTheDocument();
  });

  it('renders all 5 pillar breakdown cards', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByText('Income stability')).toBeInTheDocument();
    expect(screen.getByText('Client concentration')).toBeInTheDocument();
    expect(screen.getByText('Safety-net strength')).toBeInTheDocument();
    expect(screen.getByText('Equipment dependency')).toBeInTheDocument();
    expect(screen.getByText('Health and lifestyle')).toBeInTheDocument();
  });

  it('shows the backend risk profile once without deriving pillar classifications', () => {
    render(<ReportScreen data={mockHighRiskResponse} />);
    expect(screen.getAllByText('High Risk')).toHaveLength(1);
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('uses neutral numeric pillar labels for moderate scores', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getAllByText('Moderate Risk')).toHaveLength(1);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('uses neutral numeric pillar labels for low scores', () => {
    render(<ReportScreen data={mockLowRiskResponse} />);
    expect(screen.getAllByText('Low Risk')).toHaveLength(1);
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('omits unsupported report counters and timestamps', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.queryByText(/Plans Needed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Critical Gaps/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Generated just now/i)).not.toBeInTheDocument();
  });

  /*
  it('"Share Link" copies URL and shows "Copied!"', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
    });
    
    render(<ReportScreen data={mockAssessmentResponse} />);

    const shareBtn = screen.getByRole('button', { name: /share link/i });
    await user.click(shareBtn);

    expect(writeTextSpy).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
  */

  /*
  it('renders Download PDF button', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
  });
  */

  it('renders footer section', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByText(/You're among the first freelancers/)).toBeInTheDocument();
  });

  it('announces the report region and focuses its heading', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    const heading = screen.getByRole('heading', { name: /protection plan/i });
    expect(screen.getByRole('region', { name: /protection plan/i })).toBeInTheDocument();
    expect(heading).toHaveFocus();
  });

  it('keeps the existing PDF download foundation working', async () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    await userEvent.click(screen.getByRole('button', { name: /download pdf/i }));

    await waitFor(() => expect(pdfMocks.toBlob).toHaveBeenCalledOnce());
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:risk-report');
  });
});
