import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { CaretDown, CaretUp, CaretRight } from 'phosphor-react-native';
import { PerformancePrediction } from '../../database/PredictionsDao';
import { formatDuration, formatPace } from '../../features/recording/Calculations';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, typography, radii, borders } from '../../constants/theme';

interface PerformancePredictionsCardProps {
  predictions: PerformancePrediction[];
}

export function PerformancePredictionsCard({ predictions }: PerformancePredictionsCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const items = predictions.slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
        Performance Predictions
      </Text>

      {items.map((p) => {
        // Delta string: e.g. -100 -> ▼ 1:40
        const isImprovement = p.delta_seconds < 0;
        const absDelta = Math.abs(p.delta_seconds);
        const deltaFormatted = formatDuration(absDelta);

        return (
          <View key={p.distance_key} style={styles.predictionRow}>
            {/* Distance Polygon Badge */}
            <View style={[styles.distanceBadge, { borderColor: colors.accent }]}>
              <Text style={[styles.distanceBadgeText, { color: colors.accent }]}>
                {p.distance_key}
              </Text>
            </View>

            {/* Time & Pace */}
            <View style={styles.timePaceCol}>
              <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                {formatDuration(p.predicted_time_seconds)}
              </Text>
              <Text style={[styles.paceText, { color: colors.textSecondary }]}>
                {formatPace(p.predicted_pace_seconds_km)}
              </Text>
            </View>

            {/* Green Delta Pill */}
            {p.delta_seconds !== 0 && (
              <View style={[styles.deltaPill, { backgroundColor: isImprovement ? '#10B981' : '#6B7280' }]}>
                {isImprovement ? (
                  <CaretDown size={10} color="#FFFFFF" weight="bold" style={{ marginRight: 2 }} />
                ) : (
                  <CaretUp size={10} color="#FFFFFF" weight="bold" style={{ marginRight: 2 }} />
                )}
                <Text style={styles.deltaPillText}>{deltaFormatted}</Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.footerRow}>
        <View style={styles.spacer} />
        <CaretRight size={16} color={colors.textSecondary} weight="bold" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.heading3,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.xs + 2,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  distanceBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  distanceBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '900',
  },
  timePaceCol: {
    flex: 1,
  },
  timeText: {
    ...typography.bodySmall,
    fontWeight: '700',
    fontSize: 12,
  },
  paceText: {
    ...typography.caption,
    fontSize: 10,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  deltaPillText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
});
