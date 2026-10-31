import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders, shadows } from '../../constants/theme';
import { AthleteAvatar } from './AthleteAvatar';
import { Badge } from '../ui/Badge';
import { MetricGrid } from './MetricGrid';
import { MetricItem } from './MetricItem';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../../features/recording/Calculations';

export interface ActivityCardData {
  id: string;
  athleteId?: string;
  athleteName: string;
  athleteAvatarColor?: string;
  title: string;
  sportType: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elevationGainMeters: number;
  timestamp: number;
  kudosCount?: number;
  hasKudoed?: boolean;
  commentsCount?: number;
  isLocalOnly?: boolean;
}

interface ActivityCardProps {
  activity: ActivityCardData;
  onPress?: () => void;
  onKudosPress?: () => void;
  onCommentPress?: () => void;
  showSocialActions?: boolean;
}

export function ActivityCard({
  activity,
  onPress,
  onKudosPress,
  onCommentPress,
  showSocialActions = true,
}: ActivityCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const paceSecKm =
    activity.distanceMeters > 0
      ? activity.movingTimeSeconds / (activity.distanceMeters / 1000)
      : null;

  const timeAgo = formatTimeAgo(activity.timestamp);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.none,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <AthleteAvatar
          name={activity.athleteName}
          size="md"
          color={activity.athleteAvatarColor}
        />
        <View style={styles.headerMeta}>
          <Text style={[styles.athleteName, { color: colors.textPrimary }]} numberOfLines={1}>
            {activity.athleteName}
          </Text>
          <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{timeAgo}</Text>
        </View>
        <View style={styles.headerRight}>
          {activity.isLocalOnly && (
            <Badge label="Pending" variant="warning" style={styles.badgeMargin} />
          )}
          <Badge label={activity.sportType} variant="brand" />
        </View>
      </View>

      {/* Activity Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {activity.title}
      </Text>

      {/* Metric Grid */}
      <MetricGrid bordered>
        <MetricItem
          label="Distance"
          value={formatDistance(activity.distanceMeters)}
          unit="km"
          size="medium"
        />
        <MetricItem
          label="Pace"
          value={formatPace(paceSecKm)}
          unit="/km"
          size="medium"
        />
        <MetricItem
          label="Time"
          value={formatDuration(activity.movingTimeSeconds)}
          size="medium"
        />
        {activity.elevationGainMeters > 0 ? (
          <MetricItem
            label="Elev Gain"
            value={`+${Math.round(activity.elevationGainMeters)}`}
            unit="m"
            size="medium"
          />
        ) : null}
      </MetricGrid>

      {/* Social Actions Footer */}
      {showSocialActions && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onKudosPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={activity.hasKudoed ? 'heart' : 'heart-outline'}
              size={18}
              color={activity.hasKudoed ? colors.accent : colors.textSecondary}
            />
            <Text
              style={[
                styles.actionCount,
                { color: activity.hasKudoed ? colors.accent : colors.textSecondary },
              ]}
            >
              {activity.kudosCount ?? 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onCommentPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={17}
              color={colors.textSecondary}
            />
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
              {activity.commentsCount ?? 0}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: borders.thin,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerMeta: {
    flex: 1,
    marginLeft: spacing.md,
  },
  athleteName: {
    ...typography.heading3,
  },
  timeAgo: {
    ...typography.caption,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeMargin: {
    marginRight: spacing.xs,
  },
  title: {
    ...typography.heading2,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
    paddingVertical: spacing.xs,
  },
  actionCount: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginLeft: 6,
    fontVariant: ['tabular-nums'],
  },
});
