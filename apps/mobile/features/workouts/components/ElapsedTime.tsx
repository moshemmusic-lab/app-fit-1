import type { TypographyVariant } from '@app-fit/shared/theme';
import { formatDuration } from '@app-fit/shared/workouts';
import { useEffect, useState } from 'react';

import { Text } from '@/components/ui/Text';

function secondsSince(startedAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

/** Time since the workout started, updated every second. Always computed from the start time. */
export function ElapsedTime({
  startedAt,
  variant = 'metric',
}: {
  startedAt: string;
  variant?: TypographyVariant;
}) {
  const [seconds, setSeconds] = useState(() => secondsSince(startedAt));

  useEffect(() => {
    const interval = setInterval(() => setSeconds(secondsSince(startedAt)), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return <Text variant={variant}>{formatDuration(seconds)}</Text>;
}
