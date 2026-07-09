import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  size?: SpinnerSize;
  color?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 36,
};

export default function Spinner({
  size = 'md',
  color = '#004E4C', // primary
  className,
  role = 'status',
  'aria-label': ariaLabel = 'Loading',
  'aria-hidden': ariaHidden,
  ...props
}: SpinnerProps) {
  const dimension = sizeMap[size];
  const isHidden = ariaHidden === true || ariaHidden === 'true';

  return (
    <svg
      role={isHidden ? undefined : role}
      aria-label={isHidden ? undefined : ariaLabel}
      aria-hidden={ariaHidden}
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('animate-spin', className)}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
