import type { TrackingType } from '@app-fit/shared/exercises';
import type { WeightUnit } from '@app-fit/shared/schemas';
import { formatDuration } from '@app-fit/shared/workouts';
import { Image } from 'expo-image';
import type { ComponentRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Wordmark } from '@/components/Wordmark';
import { Text } from '@/components/ui/Text';
import { useProgressFormat } from '@/features/progress/format';
import { formatLongDate } from '@/lib/dates';
import { FixedTheme, useTheme } from '@/theme/ThemeProvider';

import type { CardExercise, RecordHighlight } from '../card';

/** Story size in points: 9:16, so 1080 × 1920 pixels on a 3x screen. */
export const CARD_WIDTH = 360;
export const CARD_HEIGHT = 640;

export type CardDesign = 'workout' | 'record';

export interface ShareCardProps {
  design: CardDesign;
  title: string;
  startedAt: string;
  durationS: number;
  volumeKg: number;
  setCount: number;
  exercises: { shown: CardExercise[]; more: number };
  highlight?: { record: RecordHighlight; exerciseName: string; trackingType?: TrackingType };
  /** A photo from the gallery as background; null = the Movyn background. */
  photoUri: string | null;
  username: string;
  unit: WeightUnit;
  /** The view to turn into an image. */
  cardRef?: Ref<ComponentRef<typeof View>>;
}

/** The image to share: always drawn in the dark theme, the brand's look. */
export function ShareCard(props: ShareCardProps) {
  return (
    <FixedTheme mode="dark">
      <CardContent {...props} />
    </FixedTheme>
  );
}

function CardContent({
  design,
  title,
  startedAt,
  durationS,
  volumeKg,
  setCount,
  exercises,
  highlight,
  photoUri,
  username,
  unit,
  cardRef,
}: ShareCardProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const format = useProgressFormat(unit);
  const showRecord = design === 'record' && highlight !== undefined;

  const stats = [
    { label: t('workoutSummary.duration'), value: formatDuration(durationS) },
    { label: t('workoutSummary.volume'), value: format.volume(volumeKg) },
    { label: t('workoutSummary.sets'), value: String(setCount) },
  ];

  return (
    <View
      ref={cardRef}
      // Must stay a real view so it can be captured.
      collapsable={false}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        padding: spacing[6],
        justifyContent: 'space-between',
        overflow: 'hidden',
        backgroundColor: colors.bg,
      }}
    >
      {photoUri ? (
        <>
          <Image
            source={{ uri: photoUri }}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          {/* Darkens the photo so the white text always reads. */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: colors.bg,
              opacity: 0.55,
            }}
          />
        </>
      ) : (
        // The brand's lime bar, the only accent.
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: spacing[6],
            width: 56,
            height: 6,
            borderBottomLeftRadius: radius.sm,
            borderBottomRightRadius: radius.sm,
            backgroundColor: colors.lime,
          }}
        />
      )}

      <View style={{ gap: spacing[1] }}>
        <Wordmark />
        <Text variant="caption" color="textMuted">
          {formatLongDate(new Date(startedAt))}
        </Text>
      </View>

      {showRecord && highlight ? (
        <View style={{ gap: spacing[3] }}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
              borderRadius: radius.md,
              backgroundColor: colors.lime,
            }}
          >
            <Text variant="label" color="inkOnLime">
              {t('share.newRecord')}
            </Text>
          </View>
          <Text variant="heading">{highlight.exerciseName}</Text>
          <View style={{ gap: spacing[1] }}>
            <Text variant="label" color="textMuted">
              {format.recordLabel(highlight.record.recordType, highlight.trackingType)}
            </Text>
            <Text variant="displayL" color="accentText">
              {format.recordValue(highlight.record.recordType, highlight.record.value)}
            </Text>
            {highlight.record.previousValue !== null ? (
              <Text variant="body" color="textMuted">
                {t('share.before', {
                  value: format.recordValue(
                    highlight.record.recordType,
                    highlight.record.previousValue,
                  ),
                })}
              </Text>
            ) : null}
          </View>
          <Text variant="bodyStrong">{title}</Text>
        </View>
      ) : (
        <View style={{ gap: spacing[4] }}>
          <Text variant="screenTitle" numberOfLines={2}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  gap: 2,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                }}
              >
                <Text variant="caption" color="textMuted">
                  {stat.label}
                </Text>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ gap: spacing[1] }}>
            {exercises.shown.map((exercise, index) => (
              <Text key={`${index}-${exercise.name}`} variant="body" numberOfLines={1}>
                {t('share.exerciseLine', { sets: exercise.setCount, name: exercise.name })}
              </Text>
            ))}
            {exercises.more > 0 ? (
              <Text variant="caption" color="textMuted">
                {t('share.moreExercises', { count: exercises.more })}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <Text variant="bodyStrong" color="textMuted">
        @{username}
      </Text>
    </View>
  );
}
