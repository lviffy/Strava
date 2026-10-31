import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ThumbsUp,
  ChatCircle,
  UserPlus,
  Trophy,
  Users,
  Bell,
  BellSlash,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../services/ApiClient';
import { useColorScheme } from '../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../constants/theme';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

const FILTER_TYPES = ['All', 'Kudos', 'Comments', 'Challenges', 'Clubs'] as const;
type FilterType = typeof FILTER_TYPES[number];

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await ApiClient.getNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.log('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await ApiClient.markNotificationRead(undefined, true);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handlePressItem = async (item: NotificationItem) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!item.isRead) {
        await ApiClient.markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }

      if (item.entityId) {
        if (item.type === 'kudos' || item.type === 'comment') {
          router.push(`/activity/${item.entityId}`);
        } else if (item.type === 'club') {
          router.push(`/clubs/${item.entityId}`);
        } else if (item.type === 'challenge') {
          router.push(`/challenges/${item.entityId}`);
        }
      }
    } catch (err) {
      console.error('Error navigating from notification:', err);
    }
  };

  const getIconForType = (type: string): { icon: React.ReactNode; color: string } => {
    switch (type) {
      case 'kudos':
        return { icon: <ThumbsUp size={18} color={colors.accent} weight="fill" />, color: colors.accent };
      case 'comment':
        return { icon: <ChatCircle size={18} color={colors.routeColor} weight="fill" />, color: colors.routeColor };
      case 'follow':
        return { icon: <UserPlus size={18} color={colors.success} weight="fill" />, color: colors.success };
      case 'challenge':
        return { icon: <Trophy size={18} color="#F59E0B" weight="fill" />, color: '#F59E0B' };
      case 'club':
        return { icon: <Users size={18} color="#8B5CF6" weight="fill" />, color: '#8B5CF6' };
      default:
        return { icon: <Bell size={18} color={colors.textSecondary} weight="fill" />, color: colors.textSecondary };
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      const diffMs = Date.now() - dt.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Kudos') return n.type === 'kudos';
    if (filter === 'Comments') return n.type === 'comment';
    if (filter === 'Challenges') return n.type === 'challenge';
    if (filter === 'Clubs') return n.type === 'club';
    return true;
  });

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Notifications"
        showBack
        onBack={() => router.back()}
        rightAction={
          notifications.some((n) => !n.isRead) ? (
            <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
              <Text style={[styles.markReadText, { color: colors.accent }]}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TYPES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterListContainer}
          renderItem={({ item }) => {
            const isSelected = filter === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surfaceSecondary,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setFilter(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          contentContainerStyle={filteredNotifications.length === 0 ? styles.emptyListContainer : styles.listContainer}
          ListEmptyComponent={
            <EmptyState
              icon={<BellSlash size={32} color={colors.textSecondary} weight="regular" />}
              title="No Notifications"
              description="You're all caught up! Kudos, comments, and challenge updates will appear here."
            />
          }
          renderItem={({ item }) => {
            const iconConfig = getIconForType(item.type);
            return (
              <TouchableOpacity
                style={[
                  styles.notifItem,
                  {
                    backgroundColor: item.isRead ? colors.surface : colors.surfaceSecondary,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => handlePressItem(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: `${iconConfig.color}18` }]}>
                  {iconConfig.icon}
                </View>

                <View style={styles.textContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                      {formatTimestamp(item.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>
                    {item.message}
                  </Text>
                </View>

                {!item.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterBar: {
    paddingVertical: spacing.sm,
    borderBottomWidth: borders.thin,
  },
  filterListContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: borders.thin,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: borders.thin,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 11,
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
});
