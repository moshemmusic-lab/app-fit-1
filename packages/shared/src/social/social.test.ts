import { describe, expect, it } from 'vitest';

import { relativeTime } from './index';

describe('relativeTime', () => {
  const now = new Date('2026-11-05T12:00:00Z');
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

  it('says now, then minutes, hours and days, then the date after a week', () => {
    expect(relativeTime(ago(0), now)).toEqual({ unit: 'now' });
    expect(relativeTime(ago(5), now)).toEqual({ unit: 'minutes', count: 5 });
    expect(relativeTime(ago(59), now)).toEqual({ unit: 'minutes', count: 59 });
    expect(relativeTime(ago(60), now)).toEqual({ unit: 'hours', count: 1 });
    expect(relativeTime(ago(24 * 60), now)).toEqual({ unit: 'days', count: 1 });
    expect(relativeTime(ago(6 * 24 * 60), now)).toEqual({ unit: 'days', count: 6 });
    expect(relativeTime(ago(7 * 24 * 60), now)).toEqual({ unit: 'date' });
  });

  it('treats a clock slightly ahead as now', () => {
    expect(relativeTime(new Date(now.getTime() + 30_000), now)).toEqual({ unit: 'now' });
  });
});
