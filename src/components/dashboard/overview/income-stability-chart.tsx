import { createChartPath, describeChartPoints, normalizeChartPoints } from '@/lib/dashboard/chart';
import { cn } from '@/lib/utils';

const CHART_WIDTH = 640;
const CHART_HEIGHT = 240;
const CHART_PADDING = 24;

type IncomeStabilityChartProps = {
  points: readonly number[];
  className?: string;
};

export function IncomeStabilityChart({ points, className }: IncomeStabilityChartProps) {
  const normalizedPoints = normalizeChartPoints(
    points,
    CHART_WIDTH,
    CHART_HEIGHT,
    CHART_PADDING,
  );
  const path = createChartPath(normalizedPoints);

  return (
    <svg
      role="img"
      aria-label={describeChartPoints(points)}
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="none"
      className={cn('block h-52 w-full min-w-0 overflow-visible sm:h-60', className)}
      data-point-count={normalizedPoints.length}
    >
      <g aria-hidden="true" className="text-app-border">
        {[24, 72, 120, 168, 216].map((y) => (
          <line
            key={y}
            x1={CHART_PADDING}
            x2={CHART_WIDTH - CHART_PADDING}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeDasharray="5 7"
          />
        ))}
      </g>

      {path ? (
        <path
          data-testid="income-stability-path"
          d={path}
          fill="none"
          stroke="var(--color-primary-light)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {normalizedPoints.map((point, index) => (
        <circle
          key={index}
          aria-hidden="true"
          data-chart-point={index + 1}
          cx={point.x}
          cy={point.y}
          r="5"
          fill="var(--color-accent)"
          stroke="var(--color-primary)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
