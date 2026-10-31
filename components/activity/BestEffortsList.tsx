import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ShieldCheck, CaretRight } from 'phosphor-react-native';
import { ActivityBestEffort } from '../../database/BestEffortsDao';
import { formatDuration, formatPace } from '../../features/recording/Calculations';
import { PrBadge } from './PrBadge';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, typography, radii, borders } from '../../constants/theme';

interface BestEffortsListProps {
  efforts: ActivityBestEffort[];
  totalAchievementsCount?: number;
}

export function BestEffortsList({ efforts, totalAchievementsCount = 7 }: BestEffortsListProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const [showAll, setShowAll] = useState(false);

  if (!efforts || efforts.length === 0) {
    return null;
  }

  const displayedEfforts = showAll ? efforts : efforts.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Summary Counts Row */}
      <View style={styles.summaryCountsRow}>
        <View style={styles.summaryCountItem}>
          <Text style={[styles.summaryCountLabel, { color: colors.textSecondary }]}>
            Best Efforts
          </Text>
          <Text style={[styles.summaryCountValue, { color: colors.textPrimary }]}>
            {efforts.length}
          </Text>
        </View>

        <View style={styles.summaryCountItem}>
          <Text style={[styles.summaryCountLabel, { color: colors.textSecondary }]}>
            Achievements
          </Text>
          <Text style={[styles.summaryCountValue, { color: colors.textPrimary }]}>
            {totalAchievementsCount}
          </Text>
        </View>
      </View>

      {/* Effort Rows */}
      {displayedEfforts.map((effort) => (
        <View key={effort.id} style={styles.effortRow}>
          <View style={styles.badgeColumn}>
            <PrBadge rank={effort.rank} size={30} label="PR" />
          </View>

          <View style={styles.effortDetails}>
            <Text style={[styles.benchmarkTitle, { color: colors.textPrimary }]}>
              {effort.benchmark_name}
            </Text>
            <View style={styles.metricsRow}>
              <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                {formatDuration(effort.elapsed_time_seconds)}
              </Text>
              <Text style={[styles.paceText, { color: colors.textSecondary }]}>
                {formatPace(effort.pace_seconds_per_km)}
              </Text>
            </View>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
              {effort.is_pr ? 'New best of all-time!' : `${effort.rank}nd-fastest effort`}
            </Text>
          </View>
        </View>
      ))}

      {/* Promotional Training / Goal Card */}
      <TouchableOpacity
        style={[styles.partnerCard, { backgroundColor: colors.surface, borderColor: '#059669' }]}
        activeOpacity={0.8}
      >
        <View style={styles.partnerLogoBox}>
          <ShieldCheck size={18} color="#10B981" weight="fill" />
        </View>
        <View style={styles.partnerTextCol}>
          <Text style={[styles.partnerTitle, { color: colors.textPrimary }]}>
            PR today, ready for your next?
          </Text>
          <Text style={[styles.partnerSub, { color: colors.textSecondary }]}>
            Train for your next best effort with Runna
          </Text>
        </View>
        <CaretRight size={18} color={colors.textSecondary} weight="bold" />
      </TouchableOpacity>

      {/* View All Results Link */}
      {efforts.length > 3 && (
        <TouchableOpacity
          onPress={() => setShowAll(!showAll)}
          style={styles.viewAllBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewAllText, { color: colors.accent }]}>
            {showAll ? 'Collapse Results' : 'View All Results'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  summaryCountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  summaryCountItem: {
    alignItems: 'center',
  },
  summaryCountLabel: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: 2,
  },
  summaryCountValue: {
    ...typography.heading1,
    fontSize: 22,
    fontWeight: '800',
  },
  effortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  badgeColumn: {
    width: 44,
    alignItems: 'flex-start',
  },
  effortDetails: {
    flex: 1,
  },
  benchmarkTitle: {
    ...typography.heading3,
    fontWeight: '700',
    marginBottom: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  timeText: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginRight: spacing.md,
  },
  paceText: {
    ...typography.caption,
    fontSize: 12,
  },
  statusSubtitle: {
    ...typography.caption,
    fontSize: 12,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  partnerLogoBox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  partnerTextCol: {
    flex: 1,
  },
  partnerTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  partnerSub: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 1,
  },
  viewAllBtn: {
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
