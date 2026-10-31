import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { formatPace } from '../../features/recording/Calculations';

interface SplitRowProps {
  splitNumber: number;
  paceSecondsKm: number;
  elevationGainMeters: number;
  bestPaceSecKm: number;
  slowestPaceSecKm: number;
}

export function SplitRow({
  splitNumber,
  paceSecondsKm,
  elevationGainMeters,
  bestPaceSecKm,
  slowestPaceSecKm,
}: SplitRowProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  // Calculate normalized bar width: faster split = wider bar
  const range = Math.max(1, slowestPaceSecKm - bestPaceSecKm);
  const normalized = 1 - Math.max(0, Math.min(1, (paceSecondsKm - bestPaceSecKm) / range));
  const barWidthPercent = Math.max(20, Math.round(normalized * 100));

  return (
    <View style={[styles.row, { borderBottomColor: colors.borderSubtle }]}>
      <Text style={[styles.splitNumber, { color: colors.textSecondary }]}>
        {splitNumber}
      </Text>
      <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${barWidthPercent}%`,
              backgroundColor: colors.accent,
            },
          ]}
        />
      </View>
      <Text style={[styles.paceText, { color: colors.textPrimary }]}>
        {formatPace(paceSecondsKm)}
      </Text>
      <Text style={[styles.elevationText, { color: colors.textMuted }]}>
        {elevationGainMeters >= 0 ? `+${Math.round(elevationGainMeters)}m` : `${Math.round(elevationGainMeters)}m`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: borders.thin,
  },
  splitNumber: {
    ...typography.caption,
    fontWeight: '700',
    width: 24,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: radii.xs,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.xs,
  },
  paceText: {
    ...typography.caption,
    fontWeight: '700',
    width: 68,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  elevationText: {
    ...typography.caption,
    width: 48,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
