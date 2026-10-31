import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ActivityDao } from '../../database/ActivityDao';
import { ApiClient } from '../../services/ApiClient';
import { SyncManager } from '../../services/SyncManager';
import { useAuthStore } from '../../store/useAuthStore';
import { CommentModal, CommentItem } from '../../components/feed/CommentModal';
import { ActivityCard, ActivityCardData } from '../../components/activity/ActivityCard';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { EmptyState } from '../../components/ui/EmptyState';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { spacing } from '../../constants/theme';

export type FeedItem = ActivityCardData;

export default function HomeFeedScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const { user } = useAuthStore();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Comments modal state
  const [activeCommentActivity, setActiveCommentActivity] = useState<{ id: string; title: string } | null>(null);
  const [activeComments, setActiveComments] = useState<CommentItem[]>([]);

  const loadFeed = useCallback(async () => {
    try {
      // 1. Fetch pending/unsynced local activities from SQLite
      const localActivities = await ActivityDao.getAllSavedActivities();
      const localPending = localActivities.filter((a) => a.sync_status === 'PENDING');

      const localItems: FeedItem[] = localPending.map((act) => ({
        id: act.id,
        athleteName: user ? `${user.firstName} ${user.lastName}` : 'You',
        athleteAvatarColor: colors.accent,
        title: act.name,
        sportType: act.sport_type,
        distanceMeters: act.distance_meters,
        movingTimeSeconds: act.moving_time_seconds,
        elevationGainMeters: act.elevation_gain_meters,
        timestamp: act.start_timestamp,
        kudosCount: 0,
        hasKudoed: false,
        commentsCount: 0,
        isLocalOnly: true,
      }));

      // 2. Fetch server cloud activities feed
      try {
        const cloudRes = await ApiClient.getFeed(1, 20);
        if (cloudRes && cloudRes.activities) {
          const cloudItems: FeedItem[] = cloudRes.activities.map((act: any) => ({
            id: act.id,
            athleteId: act.userId,
            athleteName: act.user ? `${act.user.firstName} ${act.user.lastName}` : 'Athlete',
            athleteAvatarColor: act.userId === user?.id ? colors.accent : colors.routeColor,
            title: act.name,
            sportType: act.sportType,
            distanceMeters: act.distanceMeters,
            movingTimeSeconds: act.movingTimeSeconds,
            elevationGainMeters: act.elevationGainMeters,
            timestamp: new Date(act.startTime).getTime(),
            kudosCount: act._count?.kudos ?? (act.kudos ? act.kudos.length : 0),
            hasKudoed: !!act.hasKudoed,
            commentsCount: act._count?.comments ?? (act.comments ? act.comments.length : 0),
            isLocalOnly: false,
          }));

          // Avoid duplicates if local activity was already synced
          const cloudIds = new Set(cloudItems.map((c) => c.id));
          const uniqueLocal = localItems.filter((l) => !cloudIds.has(l.id));

          setFeedItems([...uniqueLocal, ...cloudItems]);
          return;
        }
      } catch (cloudErr) {
        console.log('Server feed unavailable, using local cache:', cloudErr);
      }

      // Fallback: If cloud fails or offline, display all local activities
      const allLocalItems: FeedItem[] = localActivities.map((act) => ({
        id: act.id,
        athleteName: user ? `${user.firstName} ${user.lastName}` : 'You',
        athleteAvatarColor: colors.accent,
        title: act.name,
        sportType: act.sport_type,
        distanceMeters: act.distance_meters,
        movingTimeSeconds: act.moving_time_seconds,
        elevationGainMeters: act.elevation_gain_meters,
        timestamp: act.start_timestamp,
        kudosCount: 1,
        hasKudoed: false,
        commentsCount: 0,
        isLocalOnly: act.sync_status === 'PENDING',
      }));

      setFeedItems(allLocalItems);
    } catch (err) {
      console.error('Error loading feed:', err);
    }
  }, [user, colors.accent, colors.routeColor]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await SyncManager.syncPendingActivities();
    } catch {}
    await loadFeed();
    setIsRefreshing(false);
  };

  const handleKudos = async (item: FeedItem) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // Optimistic UI update
    setFeedItems((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          const nextState = !i.hasKudoed;
          return {
            ...i,
            hasKudoed: nextState,
            kudosCount: nextState ? (i.kudosCount ?? 0) + 1 : Math.max(0, (i.kudosCount ?? 0) - 1),
          };
        }
        return i;
      })
    );

    // Call API if not local only
    if (!item.isLocalOnly) {
      try {
        const res = await ApiClient.toggleKudos(item.id);
        setFeedItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, hasKudoed: res.kudoed, kudosCount: res.kudosCount } : i))
        );
      } catch (e) {
        console.warn('Failed to toggle kudos on server:', e);
      }
    }
  };

  const handleOpenComments = async (item: FeedItem) => {
    setActiveCommentActivity({ id: item.id, title: item.title });
    setActiveComments([]);

    if (!item.isLocalOnly) {
      try {
        const res = await ApiClient.getActivity(item.id);
        if (res.activity && res.activity.comments) {
          setActiveComments(res.activity.comments);
        }
      } catch (err) {
        console.warn('Failed to load comments:', err);
      }
    }
  };

  const handleCommentAdded = (newComment: CommentItem) => {
    setActiveComments((prev) => [...prev, newComment]);
    if (activeCommentActivity) {
      setFeedItems((prev) =>
        prev.map((i) =>
          i.id === activeCommentActivity.id ? { ...i, commentsCount: (i.commentsCount ?? 0) + 1 } : i
        )
      );
    }
  };

  return (
    <ScreenContainer>
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            onPress={() => router.push(`/activity/${item.id}`)}
            onKudosPress={() => handleKudos(item)}
            onCommentPress={() => handleOpenComments(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            iconName="fitness-outline"
            title="No activities in feed"
            description="Record your first workout using the center Record button or pull down to refresh!"
          />
        }
      />

      {/* Interactive Comments Bottom Sheet */}
      <CommentModal
        visible={!!activeCommentActivity}
        activityId={activeCommentActivity?.id || null}
        activityTitle={activeCommentActivity?.title || ''}
        comments={activeComments}
        onClose={() => setActiveCommentActivity(null)}
        onCommentAdded={handleCommentAdded}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
});
