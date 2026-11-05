import type { TrackingType } from '@app-fit/shared/exercises';
import type { ContentVisibility, FollowStatus } from '@app-fit/shared/social';

import type { WorkoutDetail } from '../progress/types';

/** Who someone is, as cards, rows and comments show them. */
export interface UserCard {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
}

export interface SearchResult extends UserCard {
  isPrivate: boolean;
  /** How the signed-in user follows them: null = not at all. */
  followStatus: FollowStatus | null;
}

/** A workout in a feed. */
export interface FeedItem {
  id: string;
  user: UserCard;
  title: string;
  startedAt: string;
  endedAt: string;
  visibility: ContentVisibility;
  volumeKg: number;
  setCount: number;
  exerciseCount: number;
  recordCount: number;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  /** In order, with their working sets. */
  exercises: { name: string; setCount: number }[];
}

/** A profile as the signed-in user sees it. */
export interface ProfileView extends UserCard {
  bio: string;
  isPrivate: boolean;
  workoutCount: number;
  followerCount: number;
  followingCount: number;
  followStatus: FollowStatus | null;
  followsMe: boolean;
  /** Blocked by the signed-in user. */
  blocked: boolean;
  /** Whether their workouts and routines can be shown. */
  canSee: boolean;
  /** Only on your own profile: requests waiting for an answer. */
  pendingRequests: number | null;
}

export interface WorkoutSocial {
  likeCount: number;
  commentCount: number;
  liked: boolean;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: UserCard;
  canDelete: boolean;
}

export interface FollowRequest {
  user: UserCard;
  requestedAt: string;
}

/** A routine someone shares on their profile. */
export interface SharedRoutine {
  id: string;
  name: string;
  notes: string;
  exercises: { name: string; setCount: number }[];
}

/** Someone else's workout: its owner and the exercises' names (their custom ones too). */
export interface SharedWorkout extends WorkoutDetail {
  owner: UserCard;
  visibility: ContentVisibility;
  exerciseInfo: Record<string, { name: string; trackingType: TrackingType }>;
}
