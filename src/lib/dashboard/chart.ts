export type NormalizedChartPoint = {
  x: number;
  y: number;
  value: number;
};

function isValidDimension(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function normalizeChartPoints(
  values: readonly number[],
  width: number,
  height: number,
  padding = 0,
): NormalizedChartPoint[] {
  if (
    values.length === 0 ||
    values.some((value) => !Number.isFinite(value)) ||
    !isValidDimension(width) ||
    !isValidDimension(height) ||
    !isValidDimension(padding)
  ) {
    return [];
  }

  const safePadding = Math.min(padding, width / 2, height / 2);
  const innerWidth = width - safePadding * 2;
  const innerHeight = height - safePadding * 2;
  let minimum = values[0];
  let maximum = values[0];

  for (let index = 1; index < values.length; index += 1) {
    minimum = Math.min(minimum, values[index]);
    maximum = Math.max(maximum, values[index]);
  }

  const range = maximum - minimum;
  const xStep = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: values.length === 1 ? width / 2 : safePadding + index * xStep,
    y: range === 0
      ? safePadding + innerHeight / 2
      : safePadding + ((maximum - value) / range) * innerHeight,
    value,
  }));
}

export function createChartPath(points: readonly NormalizedChartPoint[]): string {
  if (
    points.length === 0 ||
    points.some((point) =>
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(point.value))
  ) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

export function describeChartPoints(
  values: readonly number[],
  locale = 'en-NG',
): string {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    return 'No stability trend data available.';
  }

  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return `Stability trend values: ${values.map((value) => formatter.format(value)).join(', ')}.`;
}
