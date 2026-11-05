import { describe, expect, it } from 'vitest';

import { feedSchema, profileViewSchema, sharedWorkoutSchema } from './schemas';

// Shapes as the database functions return them (taken from get_feed / get_workout_detail).
const user = {
  id: 'u1',
  username: 'marta_fit',
  avatar_path: null,
  display_name: 'Marta Gómez',
};

describe('social schemas', () => {
  it('reads a feed card', () => {
    const [item] = feedSchema.parse([
      {
        id: 'w1',
        user,
        liked: true,
        title: 'Pierna pesada',
        started_at: '2026-11-02T10:09:06+00:00',
        ended_at: '2026-11-02T11:09:06+00:00',
        exercises: [{ name: 'Sentadilla con barra', set_count: 3 }],
        set_count: 6,
        volume_kg: 2880,
        like_count: 2,
        visibility: 'public',
        record_count: 1,
        comment_count: 4,
        exercise_count: 2,
      },
    ]);
    expect(item).toMatchObject({
      user: { username: 'marta_fit', displayName: 'Marta Gómez', avatarPath: null },
      volumeKg: 2880,
      likeCount: 2,
      commentCount: 4,
      liked: true,
      exercises: [{ name: 'Sentadilla con barra', setCount: 3 }],
    });
  });

  it('reads someone else’s workout, naming its exercises', () => {
    const workout = sharedWorkoutSchema.parse({
      id: 'w1',
      user,
      notes: '',
      title: 'Pierna pesada',
      records: [{ set_id: 's1', record_type: 'max_weight' }],
      started_at: '2026-11-02T10:09:06+00:00',
      ended_at: '2026-11-02T11:09:06+00:00',
      visibility: 'followers',
      exercises: [
        {
          id: 'we1',
          exercise_id: 'x1',
          name: 'Press Technogym',
          tracking_type: 'weight_reps',
          notes: '',
          sets: [
            {
              id: 's1',
              reps: 8,
              calories: null,
              set_type: 'normal',
              weight_kg: 50,
              distance_m: null,
              duration_s: null,
            },
          ],
        },
      ],
    });
    expect(workout?.owner.username).toBe('marta_fit');
    expect(workout?.exerciseInfo.x1).toEqual({
      name: 'Press Technogym',
      trackingType: 'weight_reps',
    });
    expect(workout?.exercises[0]?.sets[0]).toMatchObject({ weightKg: 50, reps: 8 });
    expect(workout?.records).toEqual([{ setId: 's1', recordType: 'max_weight' }]);
  });

  it('treats a missing profile or workout as null', () => {
    expect(profileViewSchema.parse(null)).toBeNull();
    expect(sharedWorkoutSchema.parse(null)).toBeNull();
  });
});
