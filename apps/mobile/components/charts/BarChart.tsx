import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

import {
  AXIS_WIDTH,
  BAR_MAX_WIDTH,
  BAR_RADIUS,
  PLOT_HEIGHT,
  UNSELECTED_OPACITY,
} from './constants';
import { indexAt, niceScale, valueToY } from './scale';

export interface BarDatum {
  key: string;
  value: number;
}

interface BarChartProps {
  data: readonly BarDatum[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Labels under some bars, e.g. the first and the last. */
  xLabels: readonly { index: number; label: string }[];
  formatTick: (value: number) => string;
  /** Describes the chart and the selected bar for screen readers. */
  accessibilityLabel: string;
}

/** A bar with a rounded top (4 px) and a square base (docs: dataviz mark specs). */
function barPath(x: number, y: number, width: number, base: number): string {
  const r = Math.min(BAR_RADIUS, width / 2, base - y);
  return [
    `M${x},${base}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${base}`,
    'Z',
  ].join(' ');
}

/**
 * Column chart of one series. Tapping a bar selects it; the screen shows its value above the
 * chart (a tooltip that does not cover the bars).
 */
export function BarChart({
  data,
  selectedIndex,
  onSelect,
  xLabels,
  formatTick,
  accessibilityLabel,
}: BarChartProps) {
  const { colors, spacing, typography } = useTheme();
  const [width, setWidth] = useState(0);
  const plotWidth = Math.max(width - AXIS_WIDTH, 0);
  const scale = niceScale(
    data.map((datum) => datum.value),
    { fromZero: true },
  );
  const slot = data.length > 0 ? plotWidth / data.length : 0;
  const barWidth = Math.min(BAR_MAX_WIDTH, slot * 0.6);
  const tickHeight = typography.caption.lineHeight;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
        onSelect(Math.min(Math.max(selectedIndex + step, 0), data.length - 1));
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
                top: valueToY(tick, scale, PLOT_HEIGHT) - tickHeight / 2,
              }}
            >
              {formatTick(tick)}
            </Text>
          ))}
        </View>
        <View style={{ width: plotWidth, height: PLOT_HEIGHT }}>
          <Svg width={plotWidth} height={PLOT_HEIGHT} pointerEvents="none">
            {scale.ticks.map((tick) => {
              // Inside the drawing area, so the top and bottom lines are not cut in half.
              const y = Math.min(
                Math.max(valueToY(tick, scale, PLOT_HEIGHT), 0.5),
                PLOT_HEIGHT - 0.5,
              );
              return (
                <Line
                  key={tick}
                  x1={0}
                  x2={plotWidth}
                  y1={y}
                  y2={y}
                  stroke={colors.line}
                  strokeWidth={1}
                />
              );
            })}
            {data.map((datum, index) =>
              datum.value > 0 ? (
                <Path
                  key={datum.key}
                  d={barPath(
                    index * slot + (slot - barWidth) / 2,
                    valueToY(datum.value, scale, PLOT_HEIGHT),
                    barWidth,
                    PLOT_HEIGHT,
                  )}
                  // accentText: lime on dark, dark green on light (contrast ≥ 3:1 on both).
                  fill={colors.accentText}
                  opacity={index === selectedIndex ? 1 : UNSELECTED_OPACITY}
                />
              ) : null,
            )}
          </Svg>
          <Pressable
            accessible={false}
            onPress={(event) =>
              onSelect(indexAt(event.nativeEvent.locationX, plotWidth, data.length))
            }
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
        </View>
      </View>
      <View style={{ height: tickHeight, marginLeft: AXIS_WIDTH }}>
        {xLabels.map(({ index, label }) => {
          const center = index * slot + slot / 2;
          const isLast = index === data.length - 1;
          return (
            <Text
              key={index}
              variant="caption"
              color="textMuted"
              style={{
                position: 'absolute',
                ...(isLast ? { right: 0 } : { left: Math.max(center - slot, 0) }),
              }}
            >
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
