import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ActivityDao } from '../../database/ActivityDao';
import { ApiClient } from '../../services/ApiClient';
import { SyncManager } from '../../services/SyncManager';
import { useAuthStore } from '../../store/useAuthStore';
import { CommentModal, CommentItem } from '../../components/feed/CommentModal';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../../features/recording/Calculations';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

export interface FeedItem {
  id: string;
  athleteId?: string;
  athleteName: string;
  athleteAvatarColor: string;
  title: string;
  sportType: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elevationGainMeters: number;
  timestamp: number;
  kudosCount: number;
  hasKudoed: boolean;
  commentsCount: number;
  isLocalOnly?: boolean;
}

export default function HomeFeedScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
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
        athleteAvatarColor: BrandColors.primary,
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
            athleteAvatarColor: act.userId === user?.id ? BrandColors.primary : '#007AFF',
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
        athleteAvatarColor: BrandColors.primary,
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
  }, [user]);

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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    // Optimistic UI update
    setFeedItems((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          const nextState = !i.hasKudoed;
          return {
            ...i,
            hasKudoed: nextState,
            kudosCount: nextState ? i.kudosCount + 1 : Math.max(0, i.kudosCount - 1),
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
          i.id === activeCommentActivity.id ? { ...i, commentsCount: i.commentsCount + 1 } : i
        )
      );
    }
  };

  const renderCard = ({ item }: { item: FeedItem }) => {
    const isSelf = item.athleteId === user?.id || item.athleteName === 'You' || item.isLocalOnly;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: item.athleteAvatarColor }]}>
            <Text style={styles.avatarInitials}>
              {item.athleteName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={[styles.athleteName, { color: theme.text }]}>{item.athleteName}</Text>
            <Text style={[styles.timeAgo, { color: theme.textSecondary }]}>
              {new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              • {item.sportType}
            </Text>
          </View>
          <View style={styles.headerRightBadge}>
            {item.isLocalOnly && (
              <View style={styles.pendingBadge}>
                <Ionicons name="cloud-upload-outline" size={12} color="#FF9500" style={{ marginRight: 4 }} />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
            <View style={styles.sportTag}>
              <Text style={styles.sportTagText}>{item.sportType.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <TouchableOpacity
          onPress={() => {
            if (isSelf) {
              router.push(`/activity/${item.id}`);
            }
          }}
          activeOpacity={isSelf ? 0.7 : 1}
        >
          <Text style={[styles.activityTitle, { color: theme.text }]}>{item.title}</Text>
        </TouchableOpacity>

        {/* 3 Metric Summary Grid */}
        <View style={[styles.metricGrid, { borderColor: theme.cardBorder }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Distance</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {formatDistance(item.distanceMeters)} <Text style={styles.unitText}>km</Text>
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Pace</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {formatPace(
                item.distanceMeters > 0 ? item.movingTimeSeconds / (item.distanceMeters / 1000) : null
              )}{' '}
              <Text style={styles.unitText}>/km</Text>
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Time</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {formatDuration(item.movingTimeSeconds)}
            </Text>
          </View>
        </View>

        {/* Social Actions (Kudos & Comments) */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleKudos(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.hasKudoed ? 'thumbs-up' : 'thumbs-up-outline'}
              size={20}
              color={item.hasKudoed ? BrandColors.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.actionText,
                { color: item.hasKudoed ? BrandColors.primary : theme.textSecondary },
                item.hasKudoed && { fontWeight: '700' },
              ]}
            >
              {item.kudosCount} {item.kudosCount === 1 ? 'Kudo' : 'Kudos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenComments(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={19} color={theme.textSecondary} />
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>
              {item.commentsCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No activities in feed yet.</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Pull down to refresh or record your first workout using the center Record button!
            </Text>
          </View>
        }
      />

      {/* Interactive Comments Modal */}
      <CommentModal
        visible={!!activeCommentActivity}
        activityId={activeCommentActivity?.id || null}
        activityTitle={activeCommentActivity?.title || ''}
        comments={activeComments}
        onClose={() => setActiveCommentActivity(null)}
        onCommentAdded={handleCommentAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  headerMeta: {
    flex: 1,
  },
  athleteName: {
    fontSize: 15,
    fontWeight: '800',
  },
  timeAgo: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  pendingBadgeText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '700',
  },
  sportTag: {
    backgroundColor: 'rgba(252, 82, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sportTagText: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
    lineHeight: 22,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
