import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { CaretRight, Play } from 'phosphor-react-native';
import { ActivityInsight } from '../../database/InsightsDao';
import { PerformancePrediction } from '../../database/PredictionsDao';
import { ActivityBestEffort } from '../../database/BestEffortsDao';
import { LocalSplit } from '../../database/ActivityDao';
import { formatPace } from '../../features/recording/Calculations';
import { AthleteIntelligenceCard } from './AthleteIntelligenceCard';
import { PerformancePredictionsCard } from './PerformancePredictionsCard';
import { PrBadge } from './PrBadge';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, typography, radii, borders } from '../../constants/theme';

interface InsightsGridProps {
  insight: ActivityInsight | null;
  predictions: PerformancePrediction[];
  efforts: ActivityBestEffort[];
  splits: LocalSplit[];
  onFlyoverPress?: () => void;
}

export function InsightsGrid({
  insight,
  predictions,
  efforts,
  splits,
  onFlyoverPress,
}: InsightsGridProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const lapSplits = splits.slice(0, 3);
  const bestEffortItems = efforts.slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Get smarter insights for faster progress.
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Track your activity stats and reach your goals with subscription features.
        </Text>
      </View>

      {/* Athlete Intelligence Card */}
      <AthleteIntelligenceCard insight={insight} />

      {/* 2x2 Features Grid */}
      <View style={styles.gridContainer}>
        {/* Row 1 */}
        <View style={styles.gridRow}>
          {/* Card 1: Workout Analysis (Laps) */}
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Workout Analysis</Text>
            <Text style={[styles.cardSubHeader, { color: colors.textSecondary }]}>LAPS</Text>

            {lapSplits.map((lap, idx) => (
              <View
                key={lap.split_number}
                style={[
                  styles.lapRow,
                  idx === 0 && {
                    backgroundColor: colors.surfaceSecondary,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.routeColor,
                  },
                ]}
              >
                <Text style={[styles.lapIndex, { color: colors.textSecondary }]}>{lap.split_number}</Text>
                <Text style={[styles.lapPace, { color: colors.textPrimary }]}>
                  {formatPace(lap.average_pace_sec_per_unit)}
                </Text>
              </View>
            ))}

            <View style={styles.cardFooter}>
              <CaretRight size={16} color={colors.textSecondary} weight="bold" />
            </View>
          </View>

          {/* Card 2: Flyover 3D Preview */}
          <TouchableOpacity
            style={[styles.gridCard, styles.flyoverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onFlyoverPress}
            activeOpacity={0.8}
          >
            {/* Satellite Terrain Styled Backdrop */}
            <View style={[styles.satelliteTile, { backgroundColor: '#1E293B' }]}>
              {/* Simulated Orange GPS Route Line */}
              <View style={[styles.simulatedRouteLine, { borderColor: colors.accent }]} />
              <View style={[styles.simulatedDot, { backgroundColor: colors.routeColor }]} />
              <View style={styles.flyoverOverlay}>
                <Text style={styles.flyoverText}>Flyover</Text>
                <View style={styles.playIconCircle}>
                  <Play size={14} color="#FFFFFF" weight="fill" />
                </View>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <CaretRight size={16} color={colors.textSecondary} weight="bold" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          {/* Card 3: Best Efforts Preview */}
          <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Best Efforts</Text>

            {bestEffortItems.length > 0 ? (
              bestEffortItems.map((e, idx) => (
                <View key={e.id} style={styles.effortItemRow}>
                  <PrBadge rank={e.rank} size={26} label="PR" />
                  <View style={styles.effortTextCol}>
                    <Text style={[styles.effortTitle, { color: colors.textPrimary }]}>
                      {e.benchmark_name} {e.is_pr ? 'PR' : 'Effort'}
                    </Text>
                    <Text style={[styles.effortDate, { color: colors.textSecondary }]}>
                      31 Oct 2026
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.effortItemRow}>
                <PrBadge rank={1} size={26} label="PR" />
                <View style={styles.effortTextCol}>
                  <Text style={[styles.effortTitle, { color: colors.textPrimary }]}>5K PR</Text>
                  <Text style={[styles.effortDate, { color: colors.textSecondary }]}>31 Oct 2026</Text>
                </View>
              </View>
            )}

            <View style={styles.cardFooter}>
              <CaretRight size={16} color={colors.textSecondary} weight="bold" />
            </View>
          </View>

          {/* Card 4: Performance Predictions */}
          <PerformancePredictionsCard predictions={predictions} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading2,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
  gridContainer: {
    marginTop: spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  gridCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    marginHorizontal: 3,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.heading3,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubHeader: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 2,
    marginVertical: 1,
  },
  lapIndex: {
    width: 18,
    ...typography.caption,
    fontSize: 11,
  },
  lapPace: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  flyoverCard: {
    padding: 0,
    overflow: 'hidden',
  },
  satelliteTile: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
    position: 'relative',
  },
  simulatedRouteLine: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 30,
    height: 60,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderRadius: radii.md,
    transform: [{ rotate: '15deg' }],
  },
  simulatedDot: {
    position: 'absolute',
    top: 36,
    left: 45,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  flyoverOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flyoverText: {
    ...typography.heading3,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  effortItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  effortTextCol: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  effortTitle: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  effortDate: {
    ...typography.caption,
    fontSize: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
});
