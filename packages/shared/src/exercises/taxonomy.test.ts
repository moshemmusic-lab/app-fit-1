import { describe, expect, it } from 'vitest';

import { muscleGroups, muscleRegionOrder, muscleRegions } from './taxonomy';

describe('muscleRegions', () => {
  it('puts every muscle in exactly one region', () => {
    const grouped = muscleRegionOrder.flatMap((region) => muscleRegions[region]);
    expect([...grouped].sort()).toEqual([...muscleGroups].sort());
  });
});
