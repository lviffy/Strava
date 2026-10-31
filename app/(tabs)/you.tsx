import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ActivityDao, LocalActivity } from '../../database/ActivityDao';
import { GearDao, GearItem } from '../../database/GearDao';
import { AddGearModal } from '../../components/gear/AddGearModal';
import { BeaconModal } from '../../components/beacon/BeaconModal';
import { PrivacyZoneModal } from '../../components/privacy/PrivacyZoneModal';
import { useRecordingStore } from '../../store/useRecordingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SyncManager } from '../../services/SyncManager';
import {
  formatDuration,
  formatDistance,
} from '../../features/recording/Calculations';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Badge } from '../../components/ui/Badge';
import { AthleteAvatar } from '../../components/activity/AthleteAvatar';
import { MetricGrid } from '../../components/activity/MetricGrid';
import { MetricItem } from '../../components/activity/MetricItem';
import { ActivityCard } from '../../components/activity/ActivityCard';
import { EmptyState } from '../../components/ui/EmptyState';

export default function YouProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const { user, logout } = useAuthStore();

  const [savedActivities, setSavedActivities] = useState<LocalActivity[]>([]);
  const [unfinishedWorkout, setUnfinishedWorkout] = useState<LocalActivity | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [gearList, setGearList] = useState<GearItem[]>([]);
  const [showAddGearModal, setShowAddGearModal] = useState(false);
  const [showBeaconModal, setShowBeaconModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      const activities = await ActivityDao.getAllSavedActivities();
      const unfinished = await ActivityDao.getUnfinishedActivity();
      const pending = await ActivityDao.getPendingActivities();
      const gears = await GearDao.getAllGear();
      setSavedActivities(activities);
      setUnfinishedWorkout(unfinished);
      setPendingSyncCount(pending.length);
      setGearList(gears);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await SyncManager.syncPendingActivities();
      if (res.syncedCount > 0) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await loadProfileData();
    } catch (err: any) {
      Alert.alert('Sync Error', err.message || 'Failed to sync with cloud.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your athlete account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
            router.replace('/(auth)/login');
          } catch (e) {
            console.error('Logout failed:', e);
          }
        },
      },
    ]);
  };

  const handleResumeUnfinished = async () => {
    if (!unfinishedWorkout) return;
    try {
      const coords = await ActivityDao.getCoordinatesForActivity(unfinishedWorkout.id);
      useRecordingStore.getState().restoreSession({
        activityId: unfinishedWorkout.id,
        sportType: (unfinishedWorkout.sport_type as any) || 'Run',
        elapsedTime: unfinishedWorkout.elapsed_time_seconds,
        movingTime: unfinishedWorkout.moving_time_seconds,
        distanceMeters: unfinishedWorkout.distance_meters,
        elevationGainMeters: unfinishedWorkout.elevation_gain_meters,
        coordinates: coords.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
        status: 'PAUSED',
      });
      router.push('/(tabs)/record');
    } catch (err) {
      console.error('Failed to resume unfinished workout:', err);
    }
  };

  const handleDiscardUnfinished = async () => {
    if (!unfinishedWorkout) return;
    Alert.alert('Discard Workout', 'Are you sure you want to discard this recorded data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await ActivityDao.deleteActivity(unfinishedWorkout.id);
          setUnfinishedWorkout(null);
        },
      },
    ]);
  };

  // Cumulative Stats
  const totalDistanceMeters = savedActivities.reduce((acc, a) => acc + a.distance_meters, 0);
  const totalMovingTimeSeconds = savedActivities.reduce((acc, a) => acc + a.moving_time_seconds, 0);
  const totalElevationGain = savedActivities.reduce((acc, a) => acc + a.elevation_gain_meters, 0);

  // Weekly Goal Progress (Assume 30 km goal)
  const weeklyGoalKm = 30.0;
  const currentWeekKm = totalDistanceMeters / 1000;
  const goalProgressPct = Math.min(100, Math.round((currentWeekKm / weeklyGoalKm) * 100));

  const athleteFullName = user ? `${user.firstName} ${user.lastName}` : 'Athlete';
  const athleteCity = user?.city || 'San Francisco, CA';

  return (
    <ScreenContainer>
      <ScreenHeader
        title="You"
        rightAction={
          <IconButton
            icon={<Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />}
            onPress={handleLogout}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Interrupted Workout Recovery Card */}
        {unfinishedWorkout && (
          <SurfaceCard style={[styles.recoveryCard, { borderColor: colors.warning }]}>
            <View style={styles.recoveryHeader}>
              <Badge label="RECOVERY" variant="warning" />
              <Text style={[styles.recoveryTitle, { color: colors.warning }]}>
                Interrupted {unfinishedWorkout.sport_type}
              </Text>
            </View>
            <Text style={[styles.recoverySubtext, { color: colors.textSecondary }]}>
              A {formatDistance(unfinishedWorkout.distance_meters)} km workout was stopped unexpectedly. You can recover and resume tracking.
            </Text>
            <View style={styles.recoveryButtonsRow}>
              <Button
                title="Resume Workout"
                size="sm"
                variant="primary"
                onPress={handleResumeUnfinished}
                style={{ marginRight: spacing.sm }}
              />
              <Button
                title="Discard"
                size="sm"
                variant="ghost"
                onPress={handleDiscardUnfinished}
              />
            </View>
          </SurfaceCard>
        )}

        {/* Profile Identity Card */}
        <SurfaceCard style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <AthleteAvatar name={athleteFullName} size="lg" />
            <View style={styles.athleteInfo}>
              <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                {athleteFullName}
              </Text>
              <Text style={[styles.athleteLocation, { color: colors.textSecondary }]}>
                {athleteCity} {user?.bio ? `• ${user.bio}` : ''}
              </Text>
            </View>
          </View>

          {/* Social Stats Row */}
          <MetricGrid bordered style={{ marginTop: spacing.md, paddingVertical: spacing.sm }}>
            <MetricItem
              label="Following"
              value={user?._count?.following ?? 12}
              size="small"
              align="center"
            />
            <MetricItem
              label="Followers"
              value={user?._count?.followers ?? 34}
              size="small"
              align="center"
            />
            <MetricItem
              label="Activities"
              value={savedActivities.length}
              size="small"
              align="center"
            />
          </MetricGrid>
        </SurfaceCard>

        {/* Cloud Sync Status Bar */}
        <SurfaceCard style={styles.syncCard}>
          <View style={styles.syncLeft}>
            <Ionicons
              name={pendingSyncCount > 0 ? 'cloud-upload-outline' : 'cloud-done-outline'}
              size={18}
              color={pendingSyncCount > 0 ? colors.accent : colors.success}
            />
            <Text style={[styles.syncStatusText, { color: colors.textPrimary }]}>
              {pendingSyncCount > 0
                ? `${pendingSyncCount} ${pendingSyncCount === 1 ? 'activity' : 'activities'} waiting to sync`
                : 'All activities synced to cloud'}
            </Text>
          </View>
          {pendingSyncCount > 0 && (
            <Button
              title="Sync Now"
              size="sm"
              variant="secondary"
              isLoading={isSyncing}
              onPress={handleSyncNow}
            />
          )}
        </SurfaceCard>

        {/* Weekly Progress Card */}
        <SurfaceCard>
          <View style={styles.goalHeaderRow}>
            <View>
              <SectionHeader title="WEEKLY GOAL" />
              <Text style={[styles.goalSub, { color: colors.textSecondary }]}>
                {currentWeekKm.toFixed(1)} / {weeklyGoalKm} km completed
              </Text>
            </View>
            <Badge label={`${goalProgressPct}%`} variant="brand" />
          </View>

          <View style={[styles.goalTrack, { backgroundColor: colors.surfaceSecondary }]}>
            <View
              style={[
                styles.goalFill,
                { width: `${goalProgressPct}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>

          <MetricGrid bordered={false} style={{ marginTop: spacing.sm, paddingBottom: 0 }}>
            <MetricItem
              label="Distance"
              value={formatDistance(totalDistanceMeters)}
              unit="km"
              size="medium"
            />
            <MetricItem
              label="Time"
              value={formatDuration(totalMovingTimeSeconds)}
              size="medium"
            />
            <MetricItem
              label="Elevation"
              value={`+${Math.round(totalElevationGain)}`}
              unit="m"
              size="medium"
            />
          </MetricGrid>
        </SurfaceCard>

        {/* 4-Week Activity Heatmap */}
        <SurfaceCard>
          <SectionHeader title="ACTIVITY LOG (LAST 4 WEEKS)" />
          <View style={styles.heatmapGrid}>
            {Array.from({ length: 28 }).map((_, index) => {
              const hasActivity = index % 3 === 0 || index % 5 === 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.heatmapSquare,
                    {
                      backgroundColor: hasActivity ? colors.accent : colors.surfaceSecondary,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.surfaceSecondary }]} />
            <View style={[styles.legendDot, { backgroundColor: colors.accent, opacity: 0.5 }]} />
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
          </View>
        </SurfaceCard>

        {/* Athlete Gear & Equipment Section */}
        <SurfaceCard style={styles.gearCardSection}>
          <View style={styles.gearHeaderRow}>
            <SectionHeader title="MY GEAR & SHOES" />
            <TouchableOpacity
              onPress={() => setShowAddGearModal(true)}
              style={styles.addGearBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
              <Text style={[styles.addGearText, { color: colors.accent }]}>Add Gear</Text>
            </TouchableOpacity>
          </View>

          {gearList.length === 0 ? (
            <Text style={[styles.gearEmptyText, { color: colors.textMuted }]}>
              No gear added yet. Track mileage on your running shoes and bikes to stay on top of wear.
            </Text>
          ) : (
            gearList.map((g) => {
              const km = Math.round(g.distance_meters / 1000);
              const maxKm = Math.round(g.max_distance_meters / 1000);
              const pct = Math.min(100, Math.round((g.distance_meters / g.max_distance_meters) * 100));
              const isNearEnd = pct >= 80;

              return (
                <View
                  key={g.id}
                  style={[
                    styles.gearItemRow,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.gearIconBox}>
                    <Ionicons
                      name={g.type === 'Bike' ? 'bicycle' : 'footsteps'}
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.gearMainInfo}>
                    <View style={styles.gearTitleRow}>
                      <Text style={[styles.gearNameText, { color: colors.textPrimary }]}>{g.name}</Text>
                      {g.is_default === 1 && (
                        <Badge label="DEFAULT" variant="brand" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                    <Text style={[styles.gearSubText, { color: colors.textSecondary }]}>
                      {g.brand} {g.model} • {km} / {maxKm} km ({pct}%)
                    </Text>
                    {/* Wear progress bar */}
                    <View style={[styles.gearWearTrack, { backgroundColor: colors.surfaceSubtle }]}>
                      <View
                        style={[
                          styles.gearWearFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: isNearEnd ? colors.warning : colors.accent,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </SurfaceCard>

        {/* Safety & Privacy Tools Card */}
        <SurfaceCard style={styles.safetyCard}>
          <SectionHeader title="SAFETY & PRIVACY TOOLS" />
          <View style={styles.safetyToolsRow}>
            <TouchableOpacity
              style={[
                styles.safetyToolBtn,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
              onPress={() => setShowBeaconModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={20} color={colors.accent} style={{ marginBottom: 4 }} />
              <Text style={[styles.safetyToolTitle, { color: colors.textPrimary }]}>Beacon Safety</Text>
              <Text style={[styles.safetyToolSub, { color: colors.textSecondary }]}>Live location stream</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.safetyToolBtn,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
              onPress={() => setShowPrivacyModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-closed" size={20} color={colors.accent} style={{ marginBottom: 4 }} />
              <Text style={[styles.safetyToolTitle, { color: colors.textPrimary }]}>Privacy Zones</Text>
              <Text style={[styles.safetyToolSub, { color: colors.textSecondary }]}>Geofence redaction</Text>
            </TouchableOpacity>
          </View>
        </SurfaceCard>

        {/* Recent Activities Section */}
        <SectionHeader title="RECENT ACTIVITIES" />
        {savedActivities.length === 0 ? (
          <EmptyState
            iconName="trail-sign-outline"
            title="No saved activities"
            description="Hit Record to log your first run or ride!"
            actionTitle="Start Workout"
            onAction={() => router.push('/(tabs)/record')}
          />
        ) : (
          savedActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={{
                id: act.id,
                athleteName: athleteFullName,
                athleteAvatarColor: colors.accent,
                title: act.name,
                sportType: act.sport_type,
                distanceMeters: act.distance_meters,
                movingTimeSeconds: act.moving_time_seconds,
                elevationGainMeters: act.elevation_gain_meters,
                timestamp: act.start_timestamp,
                isLocalOnly: act.sync_status === 'PENDING',
              }}
              onPress={() => router.push(`/activity/${act.id}`)}
              showSocialActions={false}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <AddGearModal
        visible={showAddGearModal}
        onClose={() => setShowAddGearModal(false)}
        onSaved={loadProfileData}
      />
      <BeaconModal
        visible={showBeaconModal}
        onClose={() => setShowBeaconModal(false)}
      />
      <PrivacyZoneModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  recoveryCard: {
    padding: spacing.md,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recoveryTitle: {
    ...typography.heading3,
    marginLeft: spacing.sm,
  },
  recoverySubtext: {
    ...typography.bodySmall,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  recoveryButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCard: {
    padding: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  athleteInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  athleteName: {
    ...typography.heading2,
  },
  athleteLocation: {
    ...typography.caption,
    marginTop: 2,
  },
  syncCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  syncStatusText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  goalSub: {
    ...typography.caption,
    marginTop: -spacing.xs,
  },
  goalTrack: {
    height: 6,
    borderRadius: radii.xs,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  goalFill: {
    height: '100%',
    borderRadius: radii.xs,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: spacing.sm,
  },
  heatmapSquare: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: borders.thin,
    margin: 3,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  legendText: {
    ...typography.caption,
    fontSize: 10,
    marginHorizontal: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  gearCardSection: {
    marginVertical: spacing.sm,
  },
  gearHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  addGearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addGearText: {
    ...typography.label,
    fontWeight: '600',
    marginLeft: 4,
  },
  gearEmptyText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    marginVertical: spacing.sm,
  },
  gearItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    marginTop: spacing.sm,
  },
  gearIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  gearMainInfo: {
    flex: 1,
  },
  gearTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  gearNameText: {
    ...typography.body,
    fontWeight: '600',
  },
  gearSubText: {
    ...typography.caption,
    fontSize: 11,
    marginBottom: 4,
  },
  gearWearTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  gearWearFill: {
    height: '100%',
    borderRadius: 2,
  },
  safetyCard: {
    marginVertical: spacing.sm,
  },
  safetyToolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  safetyToolBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  safetyToolTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  safetyToolSub: {
    ...typography.caption,
    fontSize: 10,
    marginTop: 2,
  },
});
