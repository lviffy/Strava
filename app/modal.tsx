import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Lightning, CheckCircle } from 'phosphor-react-native';
import { useColorScheme } from '../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../constants/theme';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { SectionHeader } from '../components/ui/SectionHeader';

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: colors.accent }]}>
            <Lightning size={32} color="#FFFFFF" weight="fill" />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Strava Mobile</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            Version 1.0.0 • Production Build
          </Text>
        </View>

        <SurfaceCard>
          <SectionHeader title="PRODUCT ARCHITECTURE" />
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Built with React Native, Expo SDK 58, TypeScript, and a centralized design system. Engineered for high performance, battery-efficient GPS recording, local SQLite offline persistence, and seamless background cloud synchronization.
          </Text>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader title="DESIGN PRINCIPLES" />
          <View style={styles.bulletRow}>
            <CheckCircle size={16} color={colors.accent} weight="bold" style={styles.bulletIcon} />
            <Text style={[styles.bulletText, { color: colors.textPrimary }]}>
              Quiet Excellence: Minimalist, athletic typography with tabular numerals.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <CheckCircle size={16} color={colors.accent} weight="bold" style={styles.bulletIcon} />
            <Text style={[styles.bulletText, { color: colors.textPrimary }]}>
              Zero Drop Shadows: Flat structural planes with 1px hairline borders.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <CheckCircle size={16} color={colors.accent} weight="bold" style={styles.bulletIcon} />
            <Text style={[styles.bulletText, { color: colors.textPrimary }]}>
              Zero Gradients: Crisp vector fills with high daylight legibility.
            </Text>
          </View>
        </SurfaceCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.displayMedium,
  },
  version: {
    ...typography.caption,
    marginTop: 4,
  },
  bodyText: {
    ...typography.body,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletIcon: {
    marginRight: spacing.sm,
    marginTop: 3,
  },
  bulletText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 20,
  },
});
