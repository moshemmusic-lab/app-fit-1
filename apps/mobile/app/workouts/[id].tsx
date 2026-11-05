import type { TrackingType } from '@app-fit/shared/exercises';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { contentVisibilities } from '@app-fit/shared/social';
import { formatDuration, workoutVolumeKg } from '@app-fit/shared/workouts';
import { onlineManager } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronRight,
  CloudUpload,
  Ellipsis,
  Eye,
  Flag,
  Share2,
  Trash2,
  Trophy,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { OptionsSheet, type OptionsSheetConfig } from '@/components/ui/OptionsSheet';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useExerciseLibrary } from '@/features/exercises/api';
import { useDeleteWorkout, useWorkoutDetail } from '@/features/progress/api';
import { useProgressFormat } from '@/features/progress/format';
import type { HistoryExercise, SetRecord, WorkoutDetail } from '@/features/progress/types';
import { usePreviousFormatter } from '@/features/workouts/fields';
import { numberSets } from '@/features/workouts/finish';
import {
  useSetLike,
  useSetWorkoutVisibility,
  useSharedWorkout,
  useWorkoutSocial,
} from '@/features/social/api';
import { LikeCommentBar } from '@/features/social/components/LikeCommentBar';
import { UserRow } from '@/features/social/components/UserRow';
import { useSocialErrorAlert } from '@/features/social/format';
import { openComments, openUser } from '@/features/social/navigation';
import { useReportSheet } from '@/features/social/report';
import type { SharedWorkout, UserCard } from '@/features/social/types';
import { classifyError } from '@/lib/errors';
import { formatLongDate, formatTime } from '@/lib/dates';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * A finished workout: its totals, every set and the records it beat, with likes and comments.
 * Your own can be deleted and you choose who sees it; someone else's (opened with `?owner=`)
 * can be reported.
 */
export default function WorkoutDetailScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const { id, owner } = useLocalSearchParams<{ id: string; owner?: string }>();
  const userId = useUserId();
  const isOthers = owner !== undefined && owner !== userId;
  const own = useWorkoutDetail(userId, id, !isOthers);
  const shared = useSharedWorkout(userId, id, isOthers);
  const query = isOthers ? shared : own.query;
  const sharedDetail = isOthers ? shared.data : undefined;
  const detail: WorkoutDetail | null | undefined = isOthers ? shared.data : own.detail;
  const social = useWorkoutSocial(userId, id, detail != null && !detail.pending);
  const unit = useSettings(userId).data?.units ?? 'kg';
  const deleteWorkout = useDeleteWorkout(userId);
  const setVisibility = useSetWorkoutVisibility(userId);
  const setLike = useSetLike(userId);
  const reportSheet = useReportSheet();
  const showError = useSocialErrorAlert();
  const [sheet, setSheet] = useState<OptionsSheetConfig | null>(null);

  const confirmDelete = () =>
    Alert.alert(t('workoutDetail.deleteConfirmTitle'), t('workoutDetail.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('workoutDetail.delete'),
        style: 'destructive',
        onPress: () =>
          deleteWorkout.mutate(id, {
            onSuccess: () => router.back(),
            onError: (error) =>
              Alert.alert(
                t('workoutDetail.deleteFailed'),
                classifyError(error, onlineManager.isOnline()) === 'offline'
                  ? t('workoutDetail.offlineDelete')
                  : getErrorMessage(error),
              ),
          }),
      },
    ]);

  const chooseVisibility = (current: WorkoutDetail['visibility']) =>
    setSheet({
      title: t('visibility.title'),
      options: contentVisibilities.map((visibility) => ({
        label: t(`visibility.options.${visibility}`),
        selected: visibility === current,
        onPress: () => setVisibility.mutate({ workoutId: id, visibility }, { onError: showError }),
      })),
    });

  const ownOptions = (current: WorkoutDetail) =>
    setSheet({
      options: [
        {
          label: t('workoutDetail.share'),
          icon: Share2,
          onPress: () => router.push({ pathname: '/share/[workoutId]', params: { workoutId: id } }),
        },
        {
          label: `${t('visibility.change')}: ${t(`visibility.options.${current.visibility}`)}`,
          icon: Eye,
          onPress: () => chooseVisibility(current.visibility),
        },
        { label: t('workoutDetail.delete'), icon: Trash2, onPress: confirmDelete },
      ],
    });

  const othersOptions = (workout: SharedWorkout) =>
    setSheet({
      options: [
        {
          label: t('workoutDetail.report'),
          icon: Flag,
          onPress: () =>
            setSheet(reportSheet('workout', workout.id, workout.owner, () => router.back())),
        },
      ],
    });

  return (
    <Screen
      withBottomInset
      onBack={() => router.back()}
      title={detail?.title}
      headerRight={
        // A workout still on the phone has no options: deleting it would lose it before uploading.
        detail && !detail.pending ? (
          <IconButton
            icon={Ellipsis}
            label={t('workoutDetail.options')}
            disabled={deleteWorkout.isPending}
            onPress={() => (sharedDetail ? othersOptions(sharedDetail) : ownOptions(detail))}
          />
        ) : undefined
      }
    >
      {detail ? (
        <>
          {sharedDetail ? <OwnerRow owner={sharedDetail.owner} viewer={userId} /> : null}
          <WorkoutContent detail={detail} unit={unit} exerciseInfo={sharedDetail?.exerciseInfo} />
          {social.data ? (
            <LikeCommentBar
              likeCount={social.data.likeCount}
              commentCount={social.data.commentCount}
              liked={social.data.liked}
              onToggleLike={() =>
                setLike.mutate(
                  { workoutId: id, liked: !social.data?.liked },
                  { onError: showError },
                )
              }
              onOpenComments={() => openComments(id)}
            />
          ) : null}
        </>
      ) : detail === null ? (
        <EmptyState
          title={t('workoutDetail.notFoundTitle')}
          body={isOthers ? t('comments.unavailableBody') : t('workoutDetail.notFoundBody')}
        />
      ) : query.isError || query.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <LoadingState />
      )}
      <OptionsSheet config={sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}

function OwnerRow({ owner, viewer }: { owner: UserCard; viewer: string }) {
  return <UserRow user={owner} onPress={() => openUser(owner.id, viewer)} />;
}

type ExerciseInfo = Record<string, { name: string; trackingType: TrackingType }>;

function WorkoutContent({
  detail,
  unit,
  exerciseInfo,
}: {
  detail: WorkoutDetail;
  unit: WeightUnit;
  /** Names from the server, for someone else's workout (their custom exercises too). */
  exerciseInfo?: ExerciseInfo;
}) {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  const format = useProgressFormat(unit);
  const library = useExerciseLibrary();
  const exercisesById = new Map((library.data ?? []).map((exercise) => [exercise.id, exercise]));
  const startedAt = new Date(detail.startedAt);
  const durationS = (new Date(detail.endedAt).getTime() - startedAt.getTime()) / 1000;
  const workingSets = detail.exercises.map((exercise) => ({
    sets: exercise.sets.filter((set) => set.setType !== 'warmup'),
  }));
  const setCount = workingSets.reduce((total, exercise) => total + exercise.sets.length, 0);

  return (
    <>
      <Text variant="body" color="textMuted">
        {`${formatLongDate(startedAt)} · ${formatTime(startedAt)}`}
      </Text>

      {detail.pending ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <CloudUpload size={sizes.icon} strokeWidth={1.8} color={colors.textMuted} />
          <Text variant="body" color="textMuted" style={{ flex: 1 }}>
            {t('workoutDetail.pendingNote')}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing[2] }}>
        <StatTile label={t('workoutSummary.duration')} value={formatDuration(durationS)} />
        <StatTile
          label={t('workoutSummary.volume')}
          value={format.volume(workoutVolumeKg(workingSets))}
        />
        <StatTile label={t('workoutSummary.sets')} value={String(setCount)} />
      </View>

      {detail.notes ? (
        <View style={{ gap: spacing[1] }}>
          <Text variant="label" color="textMuted">
            {t('workoutDetail.notes')}
          </Text>
          <Text variant="body">{detail.notes}</Text>
        </View>
      ) : null}

      {detail.exercises.map((exercise) => {
        const libraryExercise = exercisesById.get(exercise.exerciseId);
        const info = exerciseInfo?.[exercise.exerciseId];
        return (
          <ExerciseBlock
            key={exercise.id}
            exercise={exercise}
            name={libraryExercise?.name ?? info?.name}
            trackingType={libraryExercise?.trackingType ?? info?.trackingType}
            // Only exercises in the reader's library have a page to open.
            linkable={libraryExercise !== undefined}
            records={detail.records}
            unit={unit}
          />
        );
      })}
    </>
  );
}

function ExerciseBlock({
  exercise,
  name,
  trackingType,
  linkable,
  records,
  unit,
}: {
  exercise: HistoryExercise;
  name: string | undefined;
  trackingType: TrackingType | undefined;
  linkable: boolean;
  records: readonly SetRecord[];
  unit: WeightUnit;
}) {
  const { t } = useTranslation();
  const { colors, sizes, spacing } = useTheme();
  const format = useProgressFormat(unit);
  const formatSet = usePreviousFormatter(unit);
  const numbers = numberSets(exercise.sets);

  return (
    <Card>
      <Pressable
        accessibilityRole="link"
        disabled={!linkable}
        onPress={() =>
          router.push({ pathname: '/exercises/[id]', params: { id: exercise.exerciseId } })
        }
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}
      >
        <Text variant="heading" style={{ flex: 1 }}>
          {name ?? '—'}
        </Text>
        {linkable ? (
          <ChevronRight size={sizes.icon} strokeWidth={1.8} color={colors.textSubtle} />
        ) : null}
      </Pressable>
      {exercise.notes ? (
        <Text variant="body" color="textMuted">
          {exercise.notes}
        </Text>
      ) : null}
      {exercise.sets.map((set, index) => {
        const number = numbers[index];
        const label =
          set.setType === 'normal'
            ? String(number)
            : t(`activeWorkout.setTypeShort.${set.setType}`);
        const setRecords = records.filter((record) => record.setId === set.id);
        const text = trackingType ? (formatSet(set, trackingType) ?? '—') : '—';
        return (
          <View
            key={set.id}
            accessible
            accessibilityLabel={
              setRecords.length > 0
                ? t('workoutDetail.recordSet', {
                    set: `${label}, ${text}`,
                    types: setRecords
                      .map((record) => format.recordLabel(record.recordType, trackingType))
                      .join(', '),
                  })
                : `${label}, ${text}`
            }
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
          >
            <Text
              variant="bodyStrong"
              color={set.setType === 'warmup' ? 'warm' : 'textMuted'}
              style={{ width: sizes.icon, textAlign: 'center' }}
            >
              {label}
            </Text>
            <Text variant="body" style={{ flex: 1 }}>
              {text}
            </Text>
            {setRecords.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                <Trophy size={sizes.icon * 0.7} strokeWidth={1.8} color={colors.accentText} />
                <Text variant="caption" color="accentText">
                  {t('workoutDetail.record')}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}
