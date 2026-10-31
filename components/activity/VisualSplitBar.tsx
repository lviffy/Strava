import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LocalSplit } from '../../database/ActivityDao';
import { formatPace } from '../../features/recording/Calculations';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, typography, radii } from '../../constants/theme';

interface VisualSplitBarProps {
  splits: LocalSplit[];
}

export function VisualSplitBar({ splits }: VisualSplitBarProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  if (!splits || splits.length === 0) {
    return null;
  }

  // Calculate min and max pace for proportional scaling
  const paces = splits.map((s) => s.average_pace_sec_per_unit);
  const minPace = Math.min(...paces); // fastest
  const maxPace = Math.max(...paces); // slowest
  const paceRange = Math.max(1, maxPace - minPace);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={[styles.headerRow, { borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.headerColKm, { color: colors.textSecondary }]}>Km</Text>
        <Text style={[styles.headerColPace, { color: colors.textSecondary }]}>Pace</Text>
        <View style={styles.barHeaderSpacer} />
        <Text style={[styles.headerColElev, { color: colors.textSecondary }]}>Elev</Text>
      </View>

      {/* Split Rows */}
      {splits.map((split) => {
        // Faster pace gets a longer bar (scaled between 40% and 100%)
        const fraction = 1 - (split.average_pace_sec_per_unit - minPace) / paceRange;
        const barWidthPct = Math.round(40 + fraction * 60);

        // Format elevation delta (e.g. +1, -1, -0)
        const elevGain = Math.round(split.elevation_delta_meters);
        const elevStr = elevGain > 0 ? `+${elevGain}` : elevGain === 0 ? '-0' : `${elevGain}`;

        return (
          <View key={split.split_number} style={styles.splitRow}>
            {/* Split Number */}
            <Text style={[styles.kmText, { color: colors.textSecondary }]}>
              {split.split_number}
            </Text>

            {/* Pace */}
            <Text style={[styles.paceText, { color: colors.textPrimary }]}>
              {formatPace(split.average_pace_sec_per_unit)}
            </Text>

            {/* Horizontal Blue Pace Bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${barWidthPct}%`,
                    backgroundColor: colors.routeColor, // Strava blue
                  },
                ]}
              />
            </View>

            {/* Elevation Delta */}
            <Text style={[styles.elevText, { color: colors.textSecondary }]}>
              {elevStr}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    marginBottom: spacing.xs,
  },
  headerColKm: {
    width: 32,
    ...typography.caption,
    fontSize: 12,
  },
  headerColPace: {
    width: 56,
    ...typography.caption,
    fontSize: 12,
  },
  barHeaderSpacer: {
    flex: 1,
  },
  headerColElev: {
    width: 36,
    textAlign: 'right',
    ...typography.caption,
    fontSize: 12,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  kmText: {
    width: 32,
    ...typography.bodySmall,
    fontWeight: '500',
  },
  paceText: {
    width: 56,
    ...typography.bodySmall,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 18,
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  barFill: {
    height: 14,
    borderRadius: radii.xs,
  },
  elevText: {
    width: 36,
    textAlign: 'right',
    ...typography.bodySmall,
    fontWeight: '500',
    fontSize: 12,
  },
});
