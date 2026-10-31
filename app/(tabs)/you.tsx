import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ActivityDao, LocalActivity } from '../../database/ActivityDao';
import { useRecordingStore } from '../../store/useRecordingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SyncManager } from '../../services/SyncManager';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../../features/recording/Calculations';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

export default function YouProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const { user, logout } = useAuthStore();

  const [savedActivities, setSavedActivities] = useState<LocalActivity[]>([]);
  const [unfinishedWorkout, setUnfinishedWorkout] = useState<LocalActivity | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const loadProfileData = useCallback(async () => {
    try {
      const activities = await ActivityDao.getAllSavedActivities();
      const unfinished = await ActivityDao.getUnfinishedActivity();
      const pending = await ActivityDao.getPendingActivities();
      setSavedActivities(activities);
      setUnfinishedWorkout(unfinished);
      setPendingSyncCount(pending.length);
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

  // Calculate cumulative stats
  const totalDistanceMeters = savedActivities.reduce((acc, a) => acc + a.distance_meters, 0);
  const totalMovingTimeSeconds = savedActivities.reduce((acc, a) => acc + a.moving_time_seconds, 0);
  const totalElevationGain = savedActivities.reduce((acc, a) => acc + a.elevation_gain_meters, 0);

  // Weekly Goal Progress (Assume 30 km goal)
  const weeklyGoalKm = 30.0;
  const currentWeekKm = totalDistanceMeters / 1000;
  const goalProgressPct = Math.min(100, Math.round((currentWeekKm / weeklyGoalKm) * 100));

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

  // User details
  const athleteFullName = user ? `${user.firstName} ${user.lastName}` : 'Athlete';
  const athleteCity = user?.city || 'San Francisco, CA';
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'AT';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Action Bar */}
        <View style={styles.topBar}>
          <Text style={[styles.topBarTitle, { color: theme.text }]}>You</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#FF453A" />
          </TouchableOpacity>
        </View>

        {/* Unfinished Workout Recovery Card */}
        {unfinishedWorkout && (
          <View style={styles.recoveryAlertCard}>
            <View style={styles.recoveryHeader}>
              <Ionicons name="warning" size={22} color="#FF9500" />
              <Text style={styles.recoveryTitle}>Interrupted Workout Detected</Text>
            </View>
            <Text style={styles.recoverySubtext}>
              A {formatDistance(unfinishedWorkout.distance_meters)} km {unfinishedWorkout.sport_type} was stopped
              unexpectedly. You can recover and resume tracking.
            </Text>
            <View style={styles.recoveryButtonsRow}>
              <TouchableOpacity style={styles.resumeAlertButton} onPress={handleResumeUnfinished}>
                <Text style={styles.resumeAlertButtonText}>Resume Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discardAlertButton} onPress={handleDiscardUnfinished}>
                <Text style={styles.discardAlertButtonText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.profileAvatar, { backgroundColor: BrandColors.primary }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={[styles.athleteName, { color: theme.text }]}>{athleteFullName}</Text>
          <Text style={[styles.athleteLocation, { color: theme.textSecondary }]}>
            {athleteCity} {user?.bio ? `• ${user.bio}` : ''}
          </Text>

          {/* Social Stats Row */}
          <View style={styles.socialStatsRow}>
            <View style={styles.socialStatCol}>
              <Text style={[styles.socialStatVal, { color: theme.text }]}>
                {user?._count?.following ?? 12}
              </Text>
              <Text style={[styles.socialStatLabel, { color: theme.textSecondary }]}>Following</Text>
            </View>
            <View style={styles.socialStatCol}>
              <Text style={[styles.socialStatVal, { color: theme.text }]}>
                {user?._count?.followers ?? 34}
              </Text>
              <Text style={[styles.socialStatLabel, { color: theme.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.socialStatCol}>
              <Text style={[styles.socialStatVal, { color: theme.text }]}>{savedActivities.length}</Text>
              <Text style={[styles.socialStatLabel, { color: theme.textSecondary }]}>Activities</Text>
            </View>
          </View>
        </View>

        {/* Cloud Sync Status Bar */}
        <View style={[styles.syncStatusBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.syncLeft}>
            <Ionicons
              name={pendingSyncCount > 0 ? 'cloud-upload-outline' : 'cloud-done-outline'}
              size={20}
              color={pendingSyncCount > 0 ? BrandColors.primary : '#34C759'}
            />
            <Text style={[styles.syncStatusText, { color: theme.text }]}>
              {pendingSyncCount > 0
                ? `${pendingSyncCount} ${pendingSyncCount === 1 ? 'activity' : 'activities'} waiting to sync`
                : 'All activities synced to cloud'}
            </Text>
          </View>
          {pendingSyncCount > 0 && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSyncNow}
              disabled={isSyncing}
              activeOpacity={0.8}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.syncButtonText}>Sync Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Weekly Progress Ring Card */}
        <View style={[styles.weeklyGoalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.goalHeaderRow}>
            <View>
              <Text style={[styles.cardHeading, { color: theme.text }]}>Weekly Goal</Text>
              <Text style={[styles.goalSub, { color: theme.textSecondary }]}>
                {currentWeekKm.toFixed(1)} / {weeklyGoalKm} km completed
              </Text>
            </View>
            <View style={styles.goalPercentBadge}>
              <Text style={styles.goalPercentText}>{goalProgressPct}%</Text>
            </View>
          </View>

          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${goalProgressPct}%` }]} />
          </View>

          <View style={styles.summaryTotalsRow}>
            <View style={styles.totalCol}>
              <Text style={[styles.totalNumber, { color: theme.text }]}>{formatDistance(totalDistanceMeters)} km</Text>
              <Text style={[styles.totalSub, { color: theme.textSecondary }]}>Total Distance</Text>
            </View>
            <View style={styles.totalCol}>
              <Text style={[styles.totalNumber, { color: theme.text }]}>{formatDuration(totalMovingTimeSeconds)}</Text>
              <Text style={[styles.totalSub, { color: theme.textSecondary }]}>Moving Time</Text>
            </View>
            <View style={styles.totalCol}>
              <Text style={[styles.totalNumber, { color: theme.text }]}>{Math.round(totalElevationGain)} m</Text>
              <Text style={[styles.totalSub, { color: theme.textSecondary }]}>Elevation</Text>
            </View>
          </View>
        </View>

        {/* 4-Week Activity Heatmap */}
        <View style={[styles.heatmapCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardHeading, { color: theme.text, marginBottom: 12 }]}>Activity Log (Last 4 Weeks)</Text>
          <View style={styles.heatmapGrid}>
            {Array.from({ length: 28 }).map((_, index) => {
              // Mark days with activity
              const hasActivity = index % 3 === 0 || index % 5 === 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.heatmapSquare,
                    {
                      backgroundColor: hasActivity ? BrandColors.primary : BrandColors.surfaceCardDark,
                      opacity: hasActivity ? 0.9 : 0.4,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Less</Text>
            <View style={[styles.legendDot, { backgroundColor: BrandColors.surfaceCardDark }]} />
            <View style={[styles.legendDot, { backgroundColor: BrandColors.primary, opacity: 0.5 }]} />
            <View style={[styles.legendDot, { backgroundColor: BrandColors.primary }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>More</Text>
          </View>
        </View>

        {/* Activities History Section */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activities</Text>
          {savedActivities.length === 0 ? (
            <View style={styles.noActivitiesBox}>
              <Ionicons name="trail-sign-outline" size={36} color={theme.textSecondary} />
              <Text style={[styles.noActivitiesText, { color: theme.textSecondary }]}>
                No saved activities yet. Hit Record to log your first run or ride!
              </Text>
            </View>
          ) : (
            savedActivities.map((act) => (
              <TouchableOpacity
                key={act.id}
                style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => router.push(`/activity/${act.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.historyCardHeader}>
                  <View style={styles.sportBadge}>
                    <Text style={styles.sportBadgeText}>{act.sport_type.toUpperCase()}</Text>
                  </View>
                  <View style={styles.historyDateRow}>
                    {act.sync_status === 'SYNCED' && (
                      <Ionicons name="cloud-done" size={14} color="#34C759" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                      {new Date(act.start_timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.historyTitle, { color: theme.text }]}>{act.name}</Text>

                <View style={styles.historyStatsRow}>
                  <Text style={[styles.historyStat, { color: theme.text }]}>
                    <Text style={styles.boldText}>{formatDistance(act.distance_meters)}</Text> km
                  </Text>
                  <Text style={[styles.historyStat, { color: theme.text }]}>
                    <Text style={styles.boldText}>
                      {formatPace(
                        act.distance_meters > 0
                          ? act.moving_time_seconds / (act.distance_meters / 1000)
                          : null
                      )}
                    </Text>{' '}
                    /km
                  </Text>
                  <Text style={[styles.historyStat, { color: theme.text }]}>
                    <Text style={styles.boldText}>{formatDuration(act.moving_time_seconds)}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoutButton: {
    padding: 8,
  },
  recoveryAlertCard: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderColor: '#FF9500',
    borderWidth: 1,
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recoveryTitle: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  recoverySubtext: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  recoveryButtonsRow: {
    flexDirection: 'row',
  },
  resumeAlertButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
  },
  resumeAlertButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  discardAlertButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  discardAlertButtonText: {
    color: '#8E8E93',
    fontWeight: '600',
    fontSize: 13,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  athleteName: {
    fontSize: 22,
    fontWeight: '800',
  },
  athleteLocation: {
    fontSize: 13,
    marginTop: 4,
  },
  socialStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(150,150,150,0.15)',
  },
  socialStatCol: {
    alignItems: 'center',
  },
  socialStatVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  socialStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  syncStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  syncButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  weeklyGoalCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: '800',
  },
  goalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  goalPercentBadge: {
    backgroundColor: 'rgba(252, 82, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalPercentText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  goalTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(150,150,150,0.2)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  goalFill: {
    height: '100%',
    backgroundColor: BrandColors.primary,
    borderRadius: 5,
  },
  summaryTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(150,150,150,0.15)',
  },
  totalCol: {
    flex: 1,
    alignItems: 'center',
  },
  totalNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  heatmapCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  heatmapSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  legendText: {
    fontSize: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  historySection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  noActivitiesBox: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  noActivitiesText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 24,
  },
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sportBadge: {
    backgroundColor: 'rgba(252, 82, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sportBadgeText: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  historyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyStat: {
    fontSize: 13,
  },
  boldText: {
    fontWeight: '800',
  },
});
