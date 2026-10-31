import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ShareNetwork,
  MapPin,
  ThumbsUp,
  ChatCircle,
  Footprints,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../../services/ApiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AthleteAvatar } from '../../components/activity/AthleteAvatar';
import { MetricGrid } from '../../components/activity/MetricGrid';
import { MetricItem } from '../../components/activity/MetricItem';
import { formatDistance, formatDuration } from '../../features/recording/Calculations';

export default function AthleteProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const { user: currentUser } = useAuthStore();

  const [profileData, setProfileData] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const isSelf = currentUser?.id === id;

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ApiClient.getAthleteProfile(id);
      if (res && res.athlete) {
        setProfileData(res);
        setFollowerCount(res.athlete._count?.followers || 0);
      }
    } catch (err) {
      console.error('Error loading athlete profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleFollow = async () => {
    if (!id || isSelf) return;
    setIsTogglingFollow(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await ApiClient.toggleFollow(id);
      setIsFollowing(res.following);
      setFollowerCount((prev) => (res.following ? prev + 1 : Math.max(0, prev - 1)));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Athlete" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  if (!profileData || !profileData.athlete) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Athlete" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Athlete not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  const { athlete, stats, recentActivities } = profileData;

  return (
    <ScreenContainer>
      <ScreenHeader
        title={`${athlete.firstName} ${athlete.lastName}`}
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            onPress={() => Alert.alert('Share Athlete', `Share ${athlete.firstName}'s Strava profile!`)}
            activeOpacity={0.7}
          >
            <ShareNetwork size={20} color={colors.textPrimary} weight="regular" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <SurfaceCard style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <AthleteAvatar
              name={`${athlete.firstName} ${athlete.lastName}`}
              size="lg"
              color={colors.accent}
            />
            <View style={styles.nameSection}>
              <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                {athlete.firstName} {athlete.lastName}
              </Text>
              {athlete.city ? (
                <View style={styles.cityRow}>
                  <MapPin size={13} color={colors.textMuted} weight="fill" style={{ marginRight: 3 }} />
                  <Text style={[styles.athleteCity, { color: colors.textMuted }]}>{athlete.city}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {athlete.bio ? (
            <Text style={[styles.athleteBio, { color: colors.textSecondary }]}>
              {athlete.bio}
            </Text>
          ) : null}

          {/* Social Stats Row */}
          <View style={[styles.socialRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <View style={styles.socialCol}>
              <Text style={[styles.socialNumber, { color: colors.textPrimary }]}>{followerCount}</Text>
              <Text style={[styles.socialLabel, { color: colors.textMuted }]}>Followers</Text>
            </View>
            <View style={[styles.socialDivider, { backgroundColor: colors.border }]} />
            <View style={styles.socialCol}>
              <Text style={[styles.socialNumber, { color: colors.textPrimary }]}>
                {athlete._count?.following || 0}
              </Text>
              <Text style={[styles.socialLabel, { color: colors.textMuted }]}>Following</Text>
            </View>
            <View style={[styles.socialDivider, { backgroundColor: colors.border }]} />
            <View style={styles.socialCol}>
              <Text style={[styles.socialNumber, { color: colors.textPrimary }]}>
                {stats?.totalActivities || 0}
              </Text>
              <Text style={[styles.socialLabel, { color: colors.textMuted }]}>Activities</Text>
            </View>
          </View>

          {!isSelf && (
            <Button
              title={isFollowing ? 'Following' : 'Follow'}
              variant={isFollowing ? 'secondary' : 'primary'}
              size="md"
              isLoading={isTogglingFollow}
              onPress={handleToggleFollow}
              style={{ marginTop: spacing.md }}
            />
          )}
        </SurfaceCard>

        {/* Lifetime Workout Totals */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Lifetime Performance</Text>
        <MetricGrid bordered style={{ marginBottom: spacing.xs }}>
          <MetricItem
            label="TOTAL DISTANCE"
            value={`${stats?.totalDistanceKm || '0.0'} km`}
          />
          <MetricItem
            label="TOTAL TIME"
            value={formatDuration(stats?.totalMovingTimeSeconds || 0)}
          />
        </MetricGrid>
        <MetricGrid bordered>
          <MetricItem
            label="ELEVATION GAIN"
            value={`+${Math.round(stats?.totalElevationGainMeters || 0)} m`}
          />
          <MetricItem
            label="CALORIES BURNED"
            value={`${(stats?.totalCalories || 0).toLocaleString()} kcal`}
          />
        </MetricGrid>

        {/* Recent Public Activities */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: spacing.lg }]}>
          Recent Activities
        </Text>

        {recentActivities && recentActivities.length > 0 ? (
          recentActivities.map((act: any) => (
            <SurfaceCard key={act.id} style={styles.activityCard}>
              <TouchableOpacity
                onPress={() => router.push(`/activity/${act.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.actTopRow}>
                  <Text style={[styles.actTitle, { color: colors.textPrimary }]}>{act.name}</Text>
                  <Badge label={act.sportType} variant="brand" />
                </View>

                <View style={styles.actMetricsRow}>
                  <Text style={[styles.actMetricText, { color: colors.textSecondary }]}>
                    {formatDistance(act.distanceMeters)}
                  </Text>
                  <Text style={[styles.actMetricText, { color: colors.textMuted }]}>•</Text>
                  <Text style={[styles.actMetricText, { color: colors.textSecondary }]}>
                    {formatDuration(act.movingTimeSeconds)}
                  </Text>
                  <Text style={[styles.actMetricText, { color: colors.textMuted }]}>•</Text>
                  <Text style={[styles.actMetricText, { color: colors.textSecondary }]}>
                    +{Math.round(act.elevationGainMeters)} m
                  </Text>
                </View>

                <View style={styles.actSocialRow}>
                  <View style={styles.socialStat}>
                    <ThumbsUp size={14} color={colors.textMuted} weight="regular" />
                    <Text style={[styles.socialStatText, { color: colors.textMuted }]}>
                      {act._count?.kudos || 0} kudos
                    </Text>
                  </View>
                  <View style={styles.socialStat}>
                    <ChatCircle size={14} color={colors.textMuted} weight="regular" />
                    <Text style={[styles.socialStatText, { color: colors.textMuted }]}>
                      {act._count?.comments || 0} comments
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </SurfaceCard>
          ))
        ) : (
          <SurfaceCard style={styles.emptyCard}>
            <Footprints size={32} color={colors.textMuted} weight="regular" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No recent public activities shared yet.
            </Text>
          </SurfaceCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: spacing.md,
  },
  profileCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nameSection: {
    marginLeft: spacing.md,
    flex: 1,
  },
  athleteName: {
    ...typography.heading1,
    fontSize: 20,
    fontWeight: '800',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  athleteCity: {
    fontSize: 13,
  },
  athleteBio: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: spacing.sm,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: borders.thin,
    borderBottomWidth: borders.thin,
    marginTop: spacing.xs,
  },
  socialCol: {
    alignItems: 'center',
    flex: 1,
  },
  socialDivider: {
    width: 1,
    height: 24,
  },
  socialNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  socialLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  activityCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  actMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: 4,
  },
  actMetricText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actSocialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  socialStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialStatText: {
    fontSize: 12,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
