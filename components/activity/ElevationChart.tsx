import React, { useState } from 'react';
import { StyleSheet, View, Text, PanResponder } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders, shadows } from '../../constants/theme';

interface ElevationChartProps {
  altitudes: (number | null)[];
  totalDistanceMeters: number;
  totalElevationGainMeters: number;
}

export function ElevationChart({
  altitudes,
  totalDistanceMeters,
  totalElevationGainMeters,
}: ElevationChartProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  // Filter and smooth valid altitude points
  const validAltitudes: number[] = altitudes
    .filter((a): a is number => a !== null && isFinite(a))
    .slice(0, 150);

  if (validAltitudes.length < 2) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No elevation data recorded for this activity.
        </Text>
      </View>
    );
  }

  const minAlt = Math.floor(Math.min(...validAltitudes));
  const maxAlt = Math.ceil(Math.max(...validAltitudes));
  const range = Math.max(10, maxAlt - minAlt);

  const chartWidth = 320;
  const chartHeight = 120;
  const paddingBottom = 20;
  const paddingTop = 10;
  const usableHeight = chartHeight - paddingBottom - paddingTop;

  // Build SVG Path points
  const points = validAltitudes.map((alt, idx) => {
    const x = (idx / (validAltitudes.length - 1)) * chartWidth;
    const y = paddingTop + usableHeight - ((alt - minAlt) / range) * usableHeight;
    return { x, y, alt };
  });

  const linePath = points.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const areaPath = `${linePath} L ${chartWidth} ${chartHeight - paddingBottom} L 0 ${
    chartHeight - paddingBottom
  } Z`;

  // Pan Responder for interactive touch scrubbing
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const touchX = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, touchX / chartWidth));
      setScrubIndex(Math.round(ratio * (validAltitudes.length - 1)));
    },
    onPanResponderMove: (evt) => {
      const touchX = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, touchX / chartWidth));
      setScrubIndex(Math.round(ratio * (validAltitudes.length - 1)));
    },
    onPanResponderRelease: () => {
      setScrubIndex(null);
    },
  });

  const activePoint = scrubIndex !== null ? points[scrubIndex] : null;
  const activeDistanceKm =
    scrubIndex !== null
      ? ((scrubIndex / (validAltitudes.length - 1)) * (totalDistanceMeters / 1000)).toFixed(2)
      : null;

  const flatAreaFill = colorScheme === 'dark' ? colors.tintSubtle : '#FFF2EB';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Elevation Profile</Text>
          <Text style={[styles.gainText, { color: colors.textSecondary }]}>
            Gain: +{Math.round(totalElevationGainMeters)} m
          </Text>
        </View>

        {activePoint && (
          <View
            style={[
              styles.scrubTooltip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              shadows.none,
            ]}
          >
            <Text style={[styles.scrubAlt, { color: colors.textPrimary }]}>
              {Math.round(activePoint.alt)} m
            </Text>
            <Text style={[styles.scrubDist, { color: colors.textSecondary }]}>
              at {activeDistanceKm} km
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chartWrapper} {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Solid Flat Area Fill (Zero Gradient) */}
          <Path d={areaPath} fill={flatAreaFill} />

          {/* Elevation Profile Line */}
          <Path d={linePath} fill="none" stroke={colors.accent} strokeWidth="2" />

          {/* Active scrub cursor line */}
          {activePoint && (
            <Line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={chartHeight - paddingBottom}
              stroke={colors.textPrimary}
              strokeWidth="1.5"
              strokeDasharray="4, 3"
            />
          )}
        </Svg>

        {/* Min / Max Labels */}
        <View style={styles.yLabels}>
          <Text style={[styles.labelText, { color: colors.textMuted }]}>{maxAlt} m</Text>
          <Text style={[styles.labelText, { color: colors.textMuted }]}>{minAlt} m</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading3,
  },
  gainText: {
    ...typography.caption,
    marginTop: 2,
  },
  scrubTooltip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    alignItems: 'flex-end',
  },
  scrubAlt: {
    ...typography.caption,
    fontWeight: '700',
  },
  scrubDist: {
    ...typography.caption,
    fontSize: 10,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yLabels: {
    marginLeft: spacing.sm,
    height: 100,
    justifyContent: 'space-between',
  },
  labelText: {
    ...typography.caption,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  emptyContainer: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: borders.thin,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
  },
});
