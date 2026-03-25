import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WaitlistModal from '@/components/ui/WaitlistModal';
import JoinWaitlistButton from '@/components/ui/JoinWaitlistButton';
import { useUIStore } from '@/store/ui-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Waitlist Flow', () => {
  beforeEach(() => {
    useUIStore.setState({ activeModal: null });
    queryClient.clear();
  });

  it('renders nothing when modal is closed', () => {
    render(
      <TestWrapper>
        <WaitlistModal />
      </TestWrapper>
    );
    expect(screen.queryByText('Join the early access list')).not.toBeInTheDocument();
  });

  it('opens modal when clicking the join waitlist button', () => {
    render(
      <TestWrapper>
        <JoinWaitlistButton />
        <WaitlistModal />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /join our waitlist/i });
    fireEvent.click(button);

    expect(screen.getByText('Join the early access list')).toBeInTheDocument();
  });
});
