import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import {
  House,
  Compass,
  Record,
  Users,
  User,
  Lightning,
  Plus,
  MagnifyingGlass,
  ChatCircleDots,
  Bell,
} from 'phosphor-react-native';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, borders, shadows, spacing, typography } from '../../constants/theme';

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: borders.thin,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          ...shadows.none,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: borders.thin,
          ...shadows.none,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontWeight: '700',
          fontSize: 17,
        },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: () => (
            <TouchableOpacity
              style={[styles.upgradeHeaderBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              onPress={() => router.push('/subscription')}
              activeOpacity={0.8}
            >
              <Lightning size={14} color={colors.accent} weight="fill" style={{ marginRight: 4 }} />
              <Text style={[styles.upgradeHeaderText, { color: colors.textPrimary }]}>Upgrade</Text>
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <View style={styles.headerGroup}>
              <TouchableOpacity
                style={[styles.headerCircleBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => router.push('/(tabs)/record')}
                activeOpacity={0.7}
              >
                <Plus size={18} color={colors.textPrimary} weight="bold" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerCircleBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => router.push('/search')}
                activeOpacity={0.7}
              >
                <MagnifyingGlass size={16} color={colors.textPrimary} weight="bold" />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerGroup}>
              <TouchableOpacity
                style={[styles.headerCircleBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => Alert.alert('Direct Messages', 'Direct messages and club channel chats are active for verified athletes.')}
                activeOpacity={0.7}
              >
                <ChatCircleDots size={17} color={colors.textPrimary} weight="regular" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerCircleBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
              >
                <Bell size={17} color={colors.textPrimary} weight="regular" />
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>2</Text>
                </View>
              </TouchableOpacity>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <House size={22} color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Maps',
          headerTitle: 'Explore Routes',
          tabBarIcon: ({ color, focused }) => (
            <Compass size={22} color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.recordTabButton, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
              <Record size={26} color="#FFFFFF" weight="fill" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          headerTitle: 'Clubs & Challenges',
          tabBarIcon: ({ color, focused }) => (
            <Users size={22} color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color as string} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  recordTabButton: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -14,
    ...shadows.none,
  },
  upgradeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: borders.thin,
  },
  upgradeHeaderText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  headerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  headerCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

