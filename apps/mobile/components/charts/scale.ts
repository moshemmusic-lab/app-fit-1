/** A value axis with round numbers: from `min` to `max`, with `ticks` evenly spaced. */
export interface ValueScale {
  min: number;
  max: number;
  ticks: number[];
}

/** 1, 2, 2.5 or 5 times a power of ten: the steps an axis reads easily. */
function niceStep(rawStep: number): number {
  if (rawStep <= 0 || !Number.isFinite(rawStep)) return 1;
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / power;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

/**
 * Round axis for some values. Bars start at zero (their length is the value); lines can
 * start near their lowest value, so a change of 2 kg in body weight is visible.
 */
export function niceScale(
  values: readonly number[],
  { fromZero, tickCount = 3 }: { fromZero: boolean; tickCount?: number },
): ValueScale {
  const present = values.filter((value) => Number.isFinite(value));
  let low = fromZero ? 0 : Math.min(...present);
  let high = Math.max(...present);
  if (present.length === 0) {
    low = 0;
    high = 1;
  }
  if (high === low) {
    // One value (or all equal): give it room above and, for lines, below.
    high = high === 0 ? 1 : high + Math.abs(high) * 0.1;
    if (!fromZero) low = low - (high - low);
  }
  const step = niceStep((high - low) / Math.max(tickCount - 1, 1));
  const min = fromZero ? 0 : Math.floor(low / step) * step;
  const max = Math.max(Math.ceil(high / step) * step, min + step);
  const ticks: number[] = [];
  for (let tick = min; tick <= max + step / 2; tick += step) ticks.push(Number(tick.toFixed(6)));
  return { min, max, ticks };
}

/** Position of a value between `min` (bottom, at `height`) and `max` (top, at 0). */
export function valueToY(value: number, scale: ValueScale, height: number): number {
  const span = scale.max - scale.min || 1;
  return height - ((value - scale.min) / span) * height;
}

/** Index of the item closest to a touch, for `count` items spread over `width`. */
export function indexAt(x: number, width: number, count: number): number {
  if (count <= 0 || width <= 0) return -1;
  const index = Math.floor((x / width) * count);
  return Math.min(Math.max(index, 0), count - 1);
}

/** Index of the point closest to a touch, for points at the given x positions. */
export function nearestIndex(x: number, positions: readonly number[]): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  positions.forEach((position, index) => {
    const distance = Math.abs(position - x);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/** "950", "12,5 mil", "1,2 M": short numbers for an axis or a bar. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const format = (number: number) => String(Math.round(number * 10) / 10).replace('.', ',');
  if (abs >= 1_000_000) return `${format(value / 1_000_000)} M`;
  if (abs >= 10_000) return `${format(value / 1000)} mil`;
  return format(value);
}
