import { defaultExerciseLocale } from '@app-fit/shared/exercises';
import type { ContentVisibility, ReportReason, ReportTarget } from '@app-fit/shared/social';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { z } from 'zod';

import { supabase } from '@/lib/supabase';

import {
  blockedUsersSchema,
  commentsSchema,
  feedSchema,
  followRequestsSchema,
  profileViewSchema,
  searchResultsSchema,
  sharedRoutinesSchema,
  sharedWorkoutSchema,
  workoutSocialSchema,
} from './schemas';
import type { FeedItem, WorkoutSocial } from './types';

// Only Spanish (Spain) exists for now, like the exercise library.
const locale = defaultExerciseLocale;
const FEED_PAGE_SIZE = 20;

/** Query keys of the social data, per signed-in user. Invalidating `all` refreshes every one. */
export const socialKeys = {
  all: (viewer: string) => ['social', viewer] as const,
  feeds: (viewer: string) => ['social', viewer, 'feed'] as const,
  feed: (viewer: string, userId: string | null) =>
    ['social', viewer, 'feed', userId ?? 'home'] as const,
  profile: (viewer: string, userId: string) => ['social', viewer, 'profile', userId] as const,
  search: (viewer: string, query: string) => ['social', viewer, 'search', query] as const,
  requests: (viewer: string) => ['social', viewer, 'requests'] as const,
  blocked: (viewer: string) => ['social', viewer, 'blocked'] as const,
  workout: (viewer: string, workoutId: string) => ['social', viewer, 'workout', workoutId] as const,
  workoutSocial: (viewer: string, workoutId: string) =>
    ['social', viewer, 'workout-social', workoutId] as const,
  comments: (viewer: string, workoutId: string) =>
    ['social', viewer, 'comments', workoutId] as const,
  routines: (viewer: string, userId: string) => ['social', viewer, 'routines', userId] as const,
};

function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  return schema.parse(data);
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** The home feed, or one person's workouts with `userId`. Loads more as the list scrolls. */
export function useFeed(viewer: string, userId: string | null = null, enabled = true) {
  return useInfiniteQuery({
    queryKey: socialKeys.feed(viewer, userId),
    enabled,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_feed', {
        p_user_id: userId ?? undefined,
        p_before: pageParam ?? undefined,
        p_limit: FEED_PAGE_SIZE,
        p_locale: locale,
      });
      if (error) throw error;
      return parse(feedSchema, data);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length < FEED_PAGE_SIZE ? undefined : lastPage[lastPage.length - 1]?.startedAt,
  });
}

export function useProfileView(viewer: string, userId: string) {
  return useQuery({
    queryKey: socialKeys.profile(viewer, userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profile', { p_user_id: userId });
      if (error) throw error;
      return parse(profileViewSchema, data);
    },
  });
}

export function useSearchUsers(viewer: string, query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: socialKeys.search(viewer, trimmed),
    enabled: trimmed !== '',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_users', { p_query: trimmed });
      if (error) throw error;
      return parse(searchResultsSchema, data);
    },
    // Results go stale fast (follows change) and are not worth keeping on the phone.
    gcTime: 60_000,
  });
}

export function useFollowRequests(viewer: string) {
  return useQuery({
    queryKey: socialKeys.requests(viewer),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_follow_requests');
      if (error) throw error;
      return parse(followRequestsSchema, data);
    },
  });
}

export function useBlockedUsers(viewer: string) {
  return useQuery({
    queryKey: socialKeys.blocked(viewer),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_blocked_users');
      if (error) throw error;
      return parse(blockedUsersSchema, data);
    },
  });
}

/** Someone else's workout (null if it is not shared with the viewer). */
export function useSharedWorkout(viewer: string, workoutId: string, enabled = true) {
  return useQuery({
    queryKey: socialKeys.workout(viewer, workoutId),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_workout_detail', {
        p_workout_id: workoutId,
        p_locale: locale,
      });
      if (error) throw error;
      return parse(sharedWorkoutSchema, data);
    },
  });
}

export function useWorkoutSocial(viewer: string, workoutId: string, enabled = true) {
  return useQuery({
    queryKey: socialKeys.workoutSocial(viewer, workoutId),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_workout_social', { p_workout_id: workoutId });
      if (error) throw error;
      return parse(workoutSocialSchema, data);
    },
  });
}

export function useComments(viewer: string, workoutId: string) {
  return useQuery({
    queryKey: socialKeys.comments(viewer, workoutId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_comments', { p_workout_id: workoutId });
      if (error) throw error;
      return parse(commentsSchema, data);
    },
  });
}

export function useUserRoutines(viewer: string, userId: string, enabled = true) {
  return useQuery({
    queryKey: socialKeys.routines(viewer, userId),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_routines', {
        p_user_id: userId,
        p_locale: locale,
      });
      if (error) throw error;
      return parse(sharedRoutinesSchema, data);
    },
  });
}

// ---------------------------------------------------------------------------
// Changes (need a connection: they fail right away offline, so the screen can say so)
// ---------------------------------------------------------------------------

function useSocialMutation<TVariables, TResult = void>(
  viewer: string,
  mutationFn: (variables: TVariables) => Promise<TResult>,
  alsoInvalidate: readonly (readonly string[])[] = [],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    networkMode: 'always',
    onSettled: () =>
      Promise.all(
        [socialKeys.all(viewer), ...alsoInvalidate].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

async function call(result: PromiseLike<{ error: unknown }>): Promise<void> {
  const { error } = await result;
  if (error) throw error;
}

export function useFollow(viewer: string) {
  return useSocialMutation(viewer, (userId: string) =>
    call(supabase.rpc('follow_user', { p_user_id: userId })),
  );
}

export function useUnfollow(viewer: string) {
  return useSocialMutation(viewer, (userId: string) =>
    call(supabase.rpc('unfollow_user', { p_user_id: userId })),
  );
}

export function useRespondToRequest(viewer: string) {
  return useSocialMutation(
    viewer,
    ({ followerId, accept }: { followerId: string; accept: boolean }) =>
      call(
        supabase.rpc('respond_to_follow_request', { p_follower_id: followerId, p_accept: accept }),
      ),
  );
}

export function useRemoveFollower(viewer: string) {
  return useSocialMutation(viewer, (followerId: string) =>
    call(supabase.rpc('remove_follower', { p_follower_id: followerId })),
  );
}

export function useBlock(viewer: string) {
  return useSocialMutation(viewer, (userId: string) =>
    call(supabase.rpc('block_user', { p_user_id: userId })),
  );
}

export function useUnblock(viewer: string) {
  return useSocialMutation(viewer, (userId: string) =>
    call(supabase.rpc('unblock_user', { p_user_id: userId })),
  );
}

export function useReport(viewer: string) {
  return useSocialMutation(
    viewer,
    ({
      target,
      targetId,
      reason,
    }: {
      target: ReportTarget;
      targetId: string;
      reason: ReportReason;
    }) =>
      call(
        supabase.rpc('report_content', {
          p_target_type: target,
          p_target_id: targetId,
          p_reason: reason,
        }),
      ),
  );
}

export function useAddComment(viewer: string) {
  return useSocialMutation(viewer, ({ workoutId, body }: { workoutId: string; body: string }) =>
    call(supabase.rpc('add_comment', { p_workout_id: workoutId, p_body: body })),
  );
}

export function useDeleteComment(viewer: string) {
  return useSocialMutation(viewer, (commentId: string) =>
    call(supabase.rpc('delete_comment', { p_comment_id: commentId })),
  );
}

export function useSetWorkoutVisibility(viewer: string) {
  return useSocialMutation(
    viewer,
    ({ workoutId, visibility }: { workoutId: string; visibility: ContentVisibility }) =>
      call(
        supabase.rpc('set_workout_visibility', {
          p_workout_id: workoutId,
          p_visibility: visibility,
        }),
      ),
    [['progress', viewer]],
  );
}

export function useSetRoutineVisibility(viewer: string) {
  return useSocialMutation(
    viewer,
    ({ routineId, shared }: { routineId: string; shared: boolean }) =>
      call(
        supabase.rpc('set_routine_visibility', {
          p_routine_id: routineId,
          p_visibility: shared ? 'public' : 'private',
        }),
      ),
    [['routines']],
  );
}

/** Copies someone's shared routine; their custom exercises become the copier's own. */
export function useCopyRoutine(viewer: string) {
  return useSocialMutation(
    viewer,
    async (routineId: string) => {
      const { error } = await supabase.rpc('copy_routine', { p_routine_id: routineId });
      if (error) throw error;
    },
    [['routines'], ['exercises']],
  );
}

/** Likes or unlikes a workout. The heart changes at once; the server confirms after. */
export function useSetLike(viewer: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: ({ workoutId, liked }: { workoutId: string; liked: boolean }) =>
      call(supabase.rpc('set_workout_like', { p_workout_id: workoutId, p_liked: liked })),
    onMutate: async ({ workoutId, liked }) => {
      await queryClient.cancelQueries({ queryKey: socialKeys.all(viewer) });
      const delta = liked ? 1 : -1;
      queryClient.setQueriesData<InfiniteData<FeedItem[]>>(
        { queryKey: socialKeys.feeds(viewer) },
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) =>
              page.map((item) =>
                item.id === workoutId && item.liked !== liked
                  ? { ...item, liked, likeCount: item.likeCount + delta }
                  : item,
              ),
            ),
          },
      );
      queryClient.setQueryData<WorkoutSocial | null>(
        socialKeys.workoutSocial(viewer, workoutId),
        (social) =>
          social && social.liked !== liked
            ? { ...social, liked, likeCount: social.likeCount + delta }
            : social,
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: socialKeys.all(viewer) }),
  });
}
