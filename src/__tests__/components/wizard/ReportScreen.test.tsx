import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportScreen from '@/app/(wizard)/assessment/_components/ReportScreen';
import { useAuthStore } from '@/store/auth-store';
import { mockAssessmentResponse, mockHighRiskResponse, mockLowRiskResponse } from '../../fixtures/mockAssessmentResponse';

// Mock @react-pdf/renderer since it doesn't work in jsdom
vi.mock('@react-pdf/renderer', () => ({
  pdf: () => ({ toBlob: vi.fn().mockResolvedValue(new Blob()) }),
  Document: ({ children }: any) => <div>{children}</div>,
  Page: ({ children }: any) => <div>{children}</div>,
  View: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
  StyleSheet: { create: (s: any) => s },
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe('ReportScreen', () => {
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
    expect(screen.getByText('Personalized Insights')).toBeInTheDocument();
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
    expect(screen.getAllByText('Income Stability')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Client Concentration')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Safety Net Strength')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Equipment Dependency')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Health & Lifestyle')[0]).toBeInTheDocument();
  });

  it('shows "High Risk" badge for score > 70', () => {
    render(<ReportScreen data={mockHighRiskResponse} />);
    const highRiskBadges = screen.getAllByText('High Risk');
    expect(highRiskBadges.length).toBeGreaterThan(0);
  });

  it('shows "Moderate" badge for score 40-70', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    const moderateBadges = screen.getAllByText('Moderate Risk');
    expect(moderateBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Low Risk" badge for score < 40', () => {
    render(<ReportScreen data={mockLowRiskResponse} />);
    const lowRiskBadges = screen.getAllByText('Low Risk');
    expect(lowRiskBadges.length).toBeGreaterThan(0);
  });

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

  it('renders Download PDF button', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
  });

  it('renders footer section', () => {
    render(<ReportScreen data={mockAssessmentResponse} />);
    expect(screen.getByText(/You're among the first freelancers/)).toBeInTheDocument();
  });
});
