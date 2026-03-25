import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from '@/components/ui/Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has the correct aria-label', () => {
    render(<Spinner />);
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it.each([
    ['sm', 16],
    ['md', 24],
    ['lg', 36],
  ] as const)('renders size="%s" with width=%i', (size, expectedSize) => {
    render(<Spinner size={size} />);
    const svg = screen.getByRole('status');
    expect(svg).toHaveAttribute('width', String(expectedSize));
    expect(svg).toHaveAttribute('height', String(expectedSize));
  });

  it('accepts a custom color', () => {
    render(<Spinner color="#FF0000" />);
    const svg = screen.getByRole('status');
    expect(svg).toBeInTheDocument();
  });
});
