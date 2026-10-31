import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, borders, shadows } from '../../constants/theme';

export default function TabLayout() {
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
          headerTitle: 'Strava',
          headerTitleStyle: {
            color: colors.accent,
            fontWeight: '900',
            fontSize: 20,
            letterSpacing: -0.5,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Maps',
          headerTitle: 'Explore Routes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={22} color={color as string} />
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
              <Ionicons name="radio-button-on" size={26} color="#FFFFFF" />
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
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          headerTitle: 'Profile & Progress',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color as string} />
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
});
