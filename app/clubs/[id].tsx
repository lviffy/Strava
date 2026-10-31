import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ShareNetwork,
  Users,
  MapPin,
  ThumbsUp,
  ChatCircle,
  Bicycle,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../../services/ApiClient';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AthleteAvatar } from '../../components/activity/AthleteAvatar';
import { formatDistance, formatDuration } from '../../features/recording/Calculations';

const TABS = ['Feed', 'Members'] as const;
type TabType = typeof TABS[number];

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [club, setClub] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Feed');
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingMembership, setIsTogglingMembership] = useState(false);

  const loadClub = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ApiClient.getClub(id);
      if (res && res.club) {
        setClub(res.club);
      }
    } catch (err) {
      console.log('Error loading club:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClub();
  }, [loadClub]);

  const handleToggleJoin = async () => {
    if (!id) return;
    setIsTogglingMembership(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await ApiClient.toggleJoinClub(id);
      setClub((prev: any) => ({
        ...prev,
        isMember: res.isMember,
        memberCount: res.memberCount,
      }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error toggling club membership:', err);
    } finally {
      setIsTogglingMembership(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Club" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  if (!club) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Club" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Club not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader
        title={club.name}
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            onPress={() => Alert.alert('Share Club', `Invite your friends to join ${club.name}!`)}
            activeOpacity={0.7}
          >
            <ShareNetwork size={20} color={colors.textPrimary} weight="regular" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Cover / Header Banner */}
        <View style={[styles.clubHero, { backgroundColor: colors.surfaceSecondary }]}>
          {club.avatarUrl ? (
            <Image source={{ uri: club.avatarUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={[styles.coverFallback, { backgroundColor: colors.surfaceSecondary }]}>
              <Users size={48} color={colors.textMuted} weight="regular" />
            </View>
          )}

          <View style={styles.heroDetails}>
            <View style={styles.badgeRow}>
              <Badge label={club.sportType} variant="brand" />
              <View style={styles.locationBadge}>
                <MapPin size={13} color={colors.textMuted} weight="fill" style={{ marginRight: 3 }} />
                <Text style={[styles.locationText, { color: colors.textMuted }]}>{club.location}</Text>
              </View>
            </View>

            <Text style={[styles.clubTitle, { color: colors.textPrimary }]}>{club.name}</Text>
            <Text style={[styles.clubMemberStat, { color: colors.textSecondary }]}>
              {club.memberCount} Athletes enrolled
            </Text>

            {club.description ? (
              <Text style={[styles.clubDescription, { color: colors.textSecondary }]}>
                {club.description}
              </Text>
            ) : null}

            <Button
              title={club.isMember ? 'Leave Club' : 'Join Club'}
              variant={club.isMember ? 'secondary' : 'primary'}
              size="md"
              isLoading={isTogglingMembership}
              onPress={handleToggleJoin}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>

        {/* Tab Controls */}
        <View style={{ marginVertical: spacing.md }}>
          <SegmentedControl
            options={TABS as any}
            selectedOption={activeTab}
            onSelect={(opt) => setActiveTab(opt)}
          />
        </View>

        {/* Tab Content */}
        {activeTab === 'Feed' ? (
          <View style={styles.tabSection}>
            <Text style={[styles.tabHeader, { color: colors.textPrimary }]}>Recent Club Activities</Text>
            {club.recentActivities && club.recentActivities.length > 0 ? (
              club.recentActivities.map((act: any) => (
                <SurfaceCard key={act.id} style={styles.activityCard}>
                  <TouchableOpacity
                    onPress={() => router.push(`/activity/${act.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actTopRow}>
                      <View>
                        <Text style={[styles.actAthlete, { color: colors.accent }]}>{act.athleteName}</Text>
                        <Text style={[styles.actTitle, { color: colors.textPrimary }]}>{act.name}</Text>
                      </View>
                      <Badge label={act.sportType} variant="neutral" />
                    </View>

                    <View style={styles.actMetricsRow}>
                      <Text style={[styles.actMetric, { color: colors.textSecondary }]}>
                        {formatDistance(act.distanceMeters)}
                      </Text>
                      <Text style={[styles.actMetric, { color: colors.textSecondary }]}>•</Text>
                      <Text style={[styles.actMetric, { color: colors.textSecondary }]}>
                        {formatDuration(act.movingTimeSeconds)}
                      </Text>
                      <Text style={[styles.actMetric, { color: colors.textSecondary }]}>•</Text>
                      <Text style={[styles.actMetric, { color: colors.textSecondary }]}>
                        +{Math.round(act.elevationGainMeters)} m
                      </Text>
                    </View>

                    <View style={styles.actSocialRow}>
                      <View style={styles.socialStat}>
                        <ThumbsUp size={14} color={colors.textMuted} weight="regular" />
                        <Text style={[styles.socialStatText, { color: colors.textMuted }]}>{act.kudosCount || 0}</Text>
                      </View>
                      <View style={styles.socialStat}>
                        <ChatCircle size={14} color={colors.textMuted} weight="regular" />
                        <Text style={[styles.socialStatText, { color: colors.textMuted }]}>{act.commentsCount || 0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </SurfaceCard>
              ))
            ) : (
              <SurfaceCard style={styles.emptyCard}>
                <Bicycle size={32} color={colors.textMuted} weight="regular" />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No recent club activities logged yet.
                </Text>
              </SurfaceCard>
            )}
          </View>
        ) : (
          <View style={styles.tabSection}>
            <Text style={[styles.tabHeader, { color: colors.textPrimary }]}>Club Members ({club.memberCount})</Text>
            {club.members && club.members.length > 0 ? (
              club.members.map((m: any) => (
                <SurfaceCard key={m.id} style={styles.memberCard}>
                  <TouchableOpacity
                    style={styles.memberTouch}
                    onPress={() => router.push(`/profile/${m.id}`)}
                    activeOpacity={0.8}
                  >
                    <AthleteAvatar name={m.name} size="md" color={colors.routeColor} />
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: colors.textPrimary }]}>{m.name}</Text>
                      <Text style={[styles.memberRole, { color: colors.textMuted }]}>
                        {m.role === 'admin' ? 'Club Administrator' : 'Club Member'} {m.city ? `• ${m.city}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </SurfaceCard>
              ))
            ) : (
              <SurfaceCard style={styles.emptyCard}>
                <Text style={{ color: colors.textSecondary }}>No members yet.</Text>
              </SurfaceCard>
            )}
          </View>
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
  clubHero: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: borders.thin,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  coverImage: {
    width: '100%',
    height: 140,
  },
  coverFallback: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDetails: {
    padding: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
  },
  clubTitle: {
    ...typography.heading1,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  clubMemberStat: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  clubDescription: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  tabSection: {
    gap: spacing.sm,
  },
  tabHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  activityCard: {
    padding: spacing.md,
  },
  actTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  actAthlete: {
    fontSize: 12,
    fontWeight: '700',
  },
  actTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  actMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  actMetric: {
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
  memberCard: {
    padding: spacing.md,
  },
  memberTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberRole: {
    fontSize: 12,
    marginTop: 2,
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
