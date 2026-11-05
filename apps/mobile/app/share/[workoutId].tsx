import { workoutVolumeKg } from '@app-fit/shared/workouts';
import * as ImagePicker from 'expo-image-picker';
import { Asset, getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Download, Share2 } from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { useProfile, useSettings } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { useExerciseLibrary } from '@/features/exercises/api';
import { useWorkoutDetail } from '@/features/progress/api';
import type { WorkoutDetail } from '@/features/progress/types';
import { cardExercises, pickHighlight, type RecordHighlight } from '@/features/share/card';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  ShareCard,
  type CardDesign,
} from '@/features/share/components/ShareCard';
import { useWorkoutStore } from '@/features/workouts/workout-store';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

// The preview shows the 360 × 640 image at three quarters of its size.
const PREVIEW_SCALE = 0.75;

type Background = 'brand' | 'photo';

/** Turn one of your workouts into a story image: pick a design and background, then share. */
export default function ShareWorkoutScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const userId = useUserId();
  const { query, detail } = useWorkoutDetail(userId, workoutId);

  return (
    <Screen title={t('share.title')} onBack={() => router.back()} withBottomInset>
      {detail ? (
        <ShareEditor detail={detail} userId={userId} />
      ) : detail === null ? (
        <EmptyState title={t('share.notFoundTitle')} body={t('share.notFoundBody')} />
      ) : query.isError || query.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}

function ShareEditor({ detail, userId }: { detail: WorkoutDetail; userId: string }) {
  const { t } = useTranslation();
  const { radius, spacing } = useTheme();
  const unit = useSettings(userId).data?.units ?? 'kg';
  const username = useProfile(userId).data?.username ?? '';
  const library = useExerciseLibrary();
  const summary = useWorkoutStore((state) => state.lastSummary);
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [design, setDesign] = useState<CardDesign>('workout');
  const [background, setBackground] = useState<Background>('brand');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const exercisesById = new Map((library.data ?? []).map((exercise) => [exercise.id, exercise]));
  const workingSets = detail.exercises.map((exercise) => ({
    sets: exercise.sets.filter((set) => set.setType !== 'warmup'),
  }));

  // Right after finishing, the summary has the records (also offline); later, the server does.
  const records: RecordHighlight[] =
    summary?.workoutId === detail.id && summary.records
      ? summary.records.map((record) => ({
          exerciseId: record.exerciseId,
          recordType: record.recordType,
          value: record.value,
          previousValue: record.previousValue,
        }))
      : detail.records.flatMap((record) => {
          const exercise = detail.exercises.find((entry) =>
            entry.sets.some((set) => set.id === record.setId),
          );
          return exercise && record.value !== undefined
            ? [
                {
                  exerciseId: exercise.exerciseId,
                  recordType: record.recordType,
                  value: record.value,
                  previousValue: record.previousValue ?? null,
                },
              ]
            : [];
        });
  const best = pickHighlight(records);
  const bestExercise = best ? exercisesById.get(best.exerciseId) : undefined;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      // No crop step: iOS only crops square, and the photo fills the 9:16 image on its own.
      quality: 0.9,
    });
    const uri = result.canceled ? null : (result.assets[0]?.uri ?? null);
    if (uri) {
      setPhotoUri(uri);
      setBackground('photo');
    }
  };

  const chooseBackground = (next: Background) => {
    if (next === 'photo' && !photoUri) {
      void pickPhoto();
      return;
    }
    setBackground(next);
  };

  // Draws the card as a PNG file on the phone.
  const capture = () => captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });

  const share = async () => {
    setBusy(true);
    try {
      const uri = await capture();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: t('share.title'),
      });
    } catch {
      Alert.alert(t('share.failed'));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const current = await getPermissionsAsync(true);
      const permission = current.granted ? current : await requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(t('share.savePermissionTitle'), t('share.savePermissionBody'));
        return;
      }
      await Asset.create(await capture());
      // Right after iOS's permission dialog an alert shown at once gets lost: wait for it to close.
      if (!current.granted) await new Promise((resolve) => setTimeout(resolve, 600));
      Alert.alert(t('share.saved'));
    } catch {
      Alert.alert(t('share.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('share.previewLabel')}
        style={{
          alignSelf: 'center',
          width: CARD_WIDTH * PREVIEW_SCALE,
          height: CARD_HEIGHT * PREVIEW_SCALE,
          borderRadius: radius.md,
          overflow: 'hidden',
        }}
      >
        {/* Full size (what is captured), shrunk around its centre for the preview. */}
        <View
          style={{
            position: 'absolute',
            left: (CARD_WIDTH * (PREVIEW_SCALE - 1)) / 2,
            top: (CARD_HEIGHT * (PREVIEW_SCALE - 1)) / 2,
            transform: [{ scale: PREVIEW_SCALE }],
          }}
        >
          <ShareCard
            cardRef={cardRef}
            design={design}
            title={detail.title}
            startedAt={detail.startedAt}
            durationS={
              (new Date(detail.endedAt).getTime() - new Date(detail.startedAt).getTime()) / 1000
            }
            volumeKg={workoutVolumeKg(workingSets)}
            setCount={workingSets.reduce((total, exercise) => total + exercise.sets.length, 0)}
            exercises={cardExercises(
              detail.exercises.map((exercise, index) => ({
                name: exercisesById.get(exercise.exerciseId)?.name ?? '—',
                setCount: workingSets[index]?.sets.length ?? 0,
              })),
            )}
            highlight={
              best
                ? {
                    record: best,
                    exerciseName: bestExercise?.name ?? '—',
                    trackingType: bestExercise?.trackingType,
                  }
                : undefined
            }
            photoUri={background === 'photo' ? photoUri : null}
            username={username}
            unit={unit}
          />
        </View>
      </View>

      {best ? (
        <View style={{ gap: spacing[2] }}>
          <Text variant="label" color="textMuted">
            {t('share.designLabel')}
          </Text>
          <ChipGroup
            accessibilityLabel={t('share.designLabel')}
            options={[
              { value: 'workout', label: t('share.designWorkout') },
              { value: 'record', label: t('share.designRecord') },
            ]}
            value={design}
            onChange={setDesign}
          />
        </View>
      ) : null}

      <View style={{ gap: spacing[2] }}>
        <Text variant="label" color="textMuted">
          {t('share.backgroundLabel')}
        </Text>
        <ChipGroup
          accessibilityLabel={t('share.backgroundLabel')}
          options={[
            { value: 'brand', label: t('share.backgroundBrand') },
            { value: 'photo', label: t('share.backgroundPhoto') },
          ]}
          value={background}
          onChange={chooseBackground}
        />
        {background === 'photo' ? (
          <Button
            label={t('share.changePhoto')}
            variant="ghost"
            align="start"
            onPress={() => void pickPhoto()}
          />
        ) : null}
      </View>

      <View style={{ gap: spacing[2] }}>
        <Button
          label={t('share.action')}
          icon={Share2}
          loading={busy}
          onPress={() => void share()}
        />
        <Button
          label={t('share.save')}
          variant="secondary"
          icon={Download}
          disabled={busy}
          onPress={() => void save()}
        />
      </View>
    </>
  );
}
