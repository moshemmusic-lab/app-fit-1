import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

import {
  AREA_OPACITY,
  AXIS_WIDTH,
  LINE_WIDTH,
  MARKER_RADIUS,
  MARKER_RING,
  PLOT_HEIGHT,
} from './constants';
import { nearestIndex, niceScale, valueToY } from './scale';

export interface LinePoint {
  key: string;
  date: Date;
  value: number;
}

interface LineChartProps {
  /** Oldest first. */
  points: readonly LinePoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatTick: (value: number) => string;
  formatDate: (date: Date) => string;
  /** Describes the chart and the selected point for screen readers. */
  accessibilityLabel: string;
}

// Room at both ends so the selected dot and its ring are never cut.
const EDGE = MARKER_RADIUS + MARKER_RING;

/**
 * Line chart of one series over time (points spaced by date). Tapping selects the closest
 * point; the screen shows its value above the chart.
 */
export function LineChart({
  points,
  selectedIndex,
  onSelect,
  formatTick,
  formatDate,
  accessibilityLabel,
}: LineChartProps) {
  const { colors, spacing, typography } = useTheme();
  const [width, setWidth] = useState(0);
  const plotWidth = Math.max(width - AXIS_WIDTH, 0);
  const scale = niceScale(
    points.map((point) => point.value),
    { fromZero: false },
  );
  const tickHeight = typography.caption.lineHeight;

  const first = points[0]?.date.getTime() ?? 0;
  const last = points[points.length - 1]?.date.getTime() ?? 0;
  const span = last - first;
  const xs = points.map((point) =>
    span > 0
      ? EDGE + ((point.date.getTime() - first) / span) * (plotWidth - 2 * EDGE)
      : plotWidth / 2,
  );
  const ys = points.map((point) => valueToY(point.value, scale, PLOT_HEIGHT - 2 * EDGE) + EDGE);
  const line = xs.map((x, index) => `${index === 0 ? 'M' : 'L'}${x},${ys[index]}`).join(' ');
  const area =
    points.length > 1
      ? `${line} L${xs[xs.length - 1]},${PLOT_HEIGHT} L${xs[0]},${PLOT_HEIGHT} Z`
      : null;
  const selectedX = xs[selectedIndex];
  const selectedY = ys[selectedIndex];
  const tickY = (tick: number) => valueToY(tick, scale, PLOT_HEIGHT - 2 * EDGE) + EDGE;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
        onSelect(Math.min(Math.max(selectedIndex + step, 0), points.length - 1));
      }}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={{ gap: spacing[1] }}
    >
      <View style={{ height: PLOT_HEIGHT, flexDirection: 'row' }}>
        <View style={{ width: AXIS_WIDTH, height: PLOT_HEIGHT }}>
          {scale.ticks.map((tick) => (
            <Text
              key={tick}
              variant="caption"
              color="textMuted"
              style={{
                position: 'absolute',
                right: spacing[2],
                top: tickY(tick) - tickHeight / 2,
              }}
            >
              {formatTick(tick)}
            </Text>
          ))}
        </View>
        <View style={{ width: plotWidth, height: PLOT_HEIGHT }}>
          <Svg width={plotWidth} height={PLOT_HEIGHT} pointerEvents="none">
            {scale.ticks.map((tick) => (
              <Line
                key={tick}
                x1={0}
                x2={plotWidth}
                y1={tickY(tick)}
                y2={tickY(tick)}
                stroke={colors.line}
                strokeWidth={1}
              />
            ))}
            {selectedX !== undefined ? (
              <Line
                x1={selectedX}
                x2={selectedX}
                y1={0}
                y2={PLOT_HEIGHT}
                stroke={colors.lineStrong}
                strokeWidth={1}
              />
            ) : null}
            {area ? <Path d={area} fill={colors.accentText} opacity={AREA_OPACITY} /> : null}
            {points.length > 1 ? (
              <Path
                d={line}
                fill="none"
                // accentText: lime on dark, dark green on light (contrast ≥ 3:1 on both).
                stroke={colors.accentText}
                strokeWidth={LINE_WIDTH}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {selectedX !== undefined && selectedY !== undefined ? (
              <Circle
                cx={selectedX}
                cy={selectedY}
                r={MARKER_RADIUS + MARKER_RING / 2}
                fill={colors.accentText}
                stroke={colors.surface}
                strokeWidth={MARKER_RING}
              />
            ) : null}
          </Svg>
          <Pressable
            accessible={false}
            onPress={(event) => onSelect(nearestIndex(event.nativeEvent.locationX, xs))}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
        </View>
      </View>
      {points.length > 0 ? (
        <View
          style={{
            height: tickHeight,
            marginLeft: AXIS_WIDTH,
            flexDirection: 'row',
            justifyContent: points.length > 1 ? 'space-between' : 'center',
          }}
        >
          <Text variant="caption" color="textMuted">
            {formatDate(points[0]?.date ?? new Date())}
          </Text>
          {points.length > 1 ? (
            <Text variant="caption" color="textMuted">
              {formatDate(points[points.length - 1]?.date ?? new Date())}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
