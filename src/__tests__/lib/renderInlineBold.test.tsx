import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderInlineBold } from '@/app/(wizard)/assessment/_lib/renderInlineBold';

describe('renderInlineBold', () => {
  it('renders plain text as a single span with no bold', () => {
    const { container } = render(<>{renderInlineBold('normal text')}</>);
    expect(container.textContent).toBe('normal text');
    expect(container.querySelectorAll('strong')).toHaveLength(0);
  });

  it('renders **bold** text with a <strong> tag', () => {
    const { container } = render(<>{renderInlineBold('**bold** text')}</>);
    expect(container.textContent).toBe('bold text');
    const strongs = container.querySelectorAll('strong');
    expect(strongs).toHaveLength(1);
    expect(strongs[0].textContent).toBe('bold');
  });

  it('handles multiple bold segments', () => {
    const { container } = render(<>{renderInlineBold('text **bold1** more **bold2**')}</>);
    expect(container.textContent).toBe('text bold1 more bold2');
    expect(container.querySelectorAll('strong')).toHaveLength(2);
  });

  it('does not crash on empty string', () => {
    const { container } = render(<>{renderInlineBold('')}</>);
    expect(container.textContent).toBe('');
  });
});
