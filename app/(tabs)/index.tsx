import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ActivityDao, LocalActivity } from '../../database/ActivityDao';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../../features/recording/Calculations';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

interface FeedItem {
  id: string;
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
}

export default function HomeFeedScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const localActivities = await ActivityDao.getAllSavedActivities();

      const userItems: FeedItem[] = localActivities.map((act) => ({
        id: act.id,
        athleteName: 'You',
        athleteAvatarColor: BrandColors.primary,
        title: act.name,
        sportType: act.sport_type,
        distanceMeters: act.distance_meters,
        movingTimeSeconds: act.moving_time_seconds,
        elevationGainMeters: act.elevation_gain_meters,
        timestamp: act.start_timestamp,
        kudosCount: 4,
        hasKudoed: false,
        commentsCount: 1,
      }));

      // Demo community items to populate feed
      const communityItems: FeedItem[] = [
        {
          id: 'demo_1',
          athleteName: 'Marcus Vance',
          athleteAvatarColor: '#007AFF',
          title: 'Morning Trail Run & Hill Repeats 🏃‍♂️',
          sportType: 'Run',
          distanceMeters: 8420,
          movingTimeSeconds: 2450,
          elevationGainMeters: 142,
          timestamp: Date.now() - 3600 * 1000 * 3,
          kudosCount: 18,
          hasKudoed: false,
          commentsCount: 3,
        },
        {
          id: 'demo_2',
          athleteName: 'Elena Rostova',
          athleteAvatarColor: '#34C759',
          title: 'Coastal Headlands Century Ride 🚴‍♀️',
          sportType: 'Ride',
          distanceMeters: 45200,
          movingTimeSeconds: 5800,
          elevationGainMeters: 620,
          timestamp: Date.now() - 3600 * 1000 * 7,
          kudosCount: 32,
          hasKudoed: true,
          commentsCount: 6,
        },
      ];

      setFeedItems([...userItems, ...communityItems]);
    } catch (err) {
      console.error('Error loading feed:', err);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadFeed();
    setIsRefreshing(false);
  };

  const handleKudos = async (item: FeedItem) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setFeedItems((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          const nextState = !i.hasKudoed;
          return {
            ...i,
            hasKudoed: nextState,
            kudosCount: nextState ? i.kudosCount + 1 : i.kudosCount - 1,
          };
        }
        return i;
      })
    );
  };

  const renderCard = ({ item }: { item: FeedItem }) => {
    const isSelf = item.athleteName === 'You';

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
          <View style={styles.sportTag}>
            <Text style={styles.sportTagText}>{item.sportType.toUpperCase()}</Text>
          </View>
        </View>

        {/* Title */}
        <TouchableOpacity
          onPress={() => {
            if (isSelf) {
              router.push(`/activity/${item.id}`);
            }
          }}
          activeOpacity={isSelf ? 0.7 : 1}>
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
            activeOpacity={0.7}>
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
              ]}>
              {item.kudosCount} Kudos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
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
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={BrandColors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No activities in feed yet.</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Record your first workout using the center Record button!
            </Text>
          </View>
        }
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  headerMeta: {
    flex: 1,
    marginLeft: 12,
  },
  athleteName: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeAgo: {
    fontSize: 12,
    marginTop: 2,
  },
  sportTag: {
    backgroundColor: 'rgba(252, 82, 0, 0.12)',
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
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
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
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
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
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
