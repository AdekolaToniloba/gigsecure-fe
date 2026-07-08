import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UnassessedState } from '@/components/risk-assessment/dashboard/unassessed-state';

describe('UnassessedState', () => {
  it('renders the screenshot-owned content and an optimized decorative image', () => {
    const { container } = render(<UnassessedState onStart={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Discover your risk profile' })).toBeVisible();
    expect(screen.getByText('Takes about 5 minutes')).toBeVisible();
    expect(screen.getByRole('note')).toHaveTextContent(
      'Your answers are used to generate your personal risk assessment',
    );

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', expect.stringContaining('risk-assessment-empty.webp'));
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('width', '720');
    expect(image).toHaveAttribute('height', '480');
  });

  it('opens the assessment from the keyboard and supports focus restoration refs', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const startButtonRef = createRef<HTMLButtonElement>();
    render(<UnassessedState onStart={onStart} startButtonRef={startButtonRef} />);

    await user.tab();
    expect(startButtonRef.current).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onStart).toHaveBeenCalledOnce();
  });

  it('uses fluid mobile-safe containment without fixed panel heights', () => {
    const { container } = render(<UnassessedState onStart={vi.fn()} />);
    const section = container.querySelector('section');

    expect(section).toHaveClass('min-w-0', 'overflow-hidden');
    expect(section?.className).not.toMatch(/min-h-|h-screen|w-screen/);
    expect(screen.getByRole('button', { name: 'Take assessment' })).toHaveClass(
      'w-full',
      'sm:w-auto',
    );
  });
});
