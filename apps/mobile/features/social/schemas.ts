import { Constants } from '@app-fit/shared/database';
import { contentVisibilities } from '@app-fit/shared/social';
import { z } from 'zod';

import type {
  Comment,
  FeedItem,
  FollowRequest,
  ProfileView,
  SearchResult,
  SharedRoutine,
  SharedWorkout,
  UserCard,
  WorkoutSocial,
} from './types';

// The social functions return JSON: these schemas check it and turn it into the app's types.

const followStatus = z.enum(Constants.public.Enums.follow_status);
const visibility = z.enum(contentVisibilities);
const setType = z.enum(Constants.public.Enums.workout_set_type);
const trackingType = z.enum(Constants.public.Enums.exercise_tracking_type);
const recordType = z.enum(Constants.public.Enums.personal_record_type);
const count = z.number().int().nonnegative();

export const userCardSchema = z
  .object({
    id: z.string(),
    username: z.string().nullable(),
    display_name: z.string().nullable(),
    avatar_path: z.string().nullable(),
  })
  .transform((row): UserCard => ({
    id: row.id,
    username: row.username ?? '',
    displayName: row.display_name ?? row.username ?? '',
    avatarPath: row.avatar_path,
  }));

const exerciseLine = z
  .object({ name: z.string().nullable(), set_count: count })
  .transform((row) => ({ name: row.name ?? '—', setCount: row.set_count }));

export const feedSchema = z.array(
  z
    .object({
      id: z.string(),
      user: userCardSchema,
      title: z.string(),
      started_at: z.string(),
      ended_at: z.string(),
      visibility,
      volume_kg: z.number(),
      set_count: count,
      exercise_count: count,
      record_count: count,
      like_count: count,
      comment_count: count,
      liked: z.boolean(),
      exercises: z.array(exerciseLine),
    })
    .transform((row): FeedItem => ({
      id: row.id,
      user: row.user,
      title: row.title,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      visibility: row.visibility,
      volumeKg: row.volume_kg,
      setCount: row.set_count,
      exerciseCount: row.exercise_count,
      recordCount: row.record_count,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      liked: row.liked,
      exercises: row.exercises,
    })),
);

export const searchResultsSchema = z.array(
  z
    .object({
      id: z.string(),
      username: z.string(),
      display_name: z.string().nullable(),
      avatar_path: z.string().nullable(),
      is_private: z.boolean(),
      follow_status: followStatus.nullable(),
    })
    .transform((row): SearchResult => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name ?? row.username,
      avatarPath: row.avatar_path,
      isPrivate: row.is_private,
      followStatus: row.follow_status,
    })),
);

export const profileViewSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    display_name: z.string().nullable(),
    avatar_path: z.string().nullable(),
    bio: z.string().nullable(),
    is_private: z.boolean(),
    workout_count: count,
    follower_count: count,
    following_count: count,
    follow_status: followStatus.nullable(),
    follows_me: z.boolean(),
    blocked: z.boolean(),
    can_see: z.boolean(),
    pending_requests: count.nullable(),
  })
  .transform((row): ProfileView => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name ?? row.username,
    avatarPath: row.avatar_path,
    bio: row.bio ?? '',
    isPrivate: row.is_private,
    workoutCount: row.workout_count,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    followStatus: row.follow_status,
    followsMe: row.follows_me,
    blocked: row.blocked,
    canSee: row.can_see,
    pendingRequests: row.pending_requests,
  }))
  .nullable();

export const workoutSocialSchema = z
  .object({ like_count: count, comment_count: count, liked: z.boolean() })
  .transform((row): WorkoutSocial => ({
    likeCount: row.like_count,
    commentCount: row.comment_count,
    liked: row.liked,
  }))
  .nullable();

export const commentsSchema = z
  .array(
    z
      .object({
        id: z.string(),
        body: z.string(),
        created_at: z.string(),
        user: userCardSchema,
        can_delete: z.boolean(),
      })
      .transform((row): Comment => ({
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        user: row.user,
        canDelete: row.can_delete,
      })),
  )
  .nullable();

export const followRequestsSchema = z.array(
  z
    .object({ user: userCardSchema, requested_at: z.string() })
    .transform((row): FollowRequest => ({ user: row.user, requestedAt: row.requested_at })),
);

export const blockedUsersSchema = z.array(userCardSchema);

export const sharedRoutinesSchema = z.array(
  z
    .object({
      id: z.string(),
      name: z.string(),
      notes: z.string(),
      exercises: z.array(exerciseLine),
    })
    .transform((row): SharedRoutine => row),
);

const nullableNumber = z.number().nullable();

export const sharedWorkoutSchema = z
  .object({
    id: z.string(),
    user: userCardSchema,
    title: z.string(),
    notes: z.string(),
    started_at: z.string(),
    ended_at: z.string(),
    visibility,
    exercises: z.array(
      z.object({
        id: z.string(),
        exercise_id: z.string(),
        name: z.string().nullable(),
        tracking_type: trackingType,
        notes: z.string(),
        sets: z.array(
          z.object({
            id: z.string(),
            set_type: setType,
            weight_kg: nullableNumber,
            reps: nullableNumber,
            duration_s: nullableNumber,
            distance_m: nullableNumber,
            calories: nullableNumber,
          }),
        ),
      }),
    ),
    records: z.array(
      z.object({
        set_id: z.string(),
        record_type: recordType,
      }),
    ),
  })
  .transform((row): SharedWorkout => ({
    id: row.id,
    owner: row.user,
    visibility: row.visibility,
    title: row.title,
    notes: row.notes,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    pending: false,
    exercises: row.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exercise_id,
      notes: exercise.notes,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        setType: set.set_type,
        weightKg: set.weight_kg,
        reps: set.reps,
        durationS: set.duration_s,
        distanceM: set.distance_m,
        calories: set.calories,
      })),
    })),
    records: row.records.map((record) => ({
      setId: record.set_id,
      recordType: record.record_type,
    })),
    exerciseInfo: Object.fromEntries(
      row.exercises.map((exercise) => [
        exercise.exercise_id,
        {
          name: exercise.name ?? '—',
          trackingType: exercise.tracking_type,
        },
      ]),
    ),
  }))
  .nullable();
