import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Lightning,
  Sparkle,
  AirplaneTilt,
  ChartLineUp,
  ShieldCheck,
  Flame,
  Trophy,
  CheckCircle,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../services/ApiClient';
import { useColorScheme } from '../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../constants/theme';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface Perk {
  icon: (props: { size: number; color: string; weight?: any }) => React.ReactElement;
  title: string;
  description: string;
}

const SUMMIT_PERKS: Perk[] = [
  {
    icon: (p) => <Sparkle {...p} weight="fill" />,
    title: 'Athlete Intelligence',
    description: 'Context-aware AI insights analyzing training load, recovery, and pacing recommendations after every workout.',
  },
  {
    icon: (p) => <AirplaneTilt {...p} weight="regular" />,
    title: '3D Route Flyover',
    description: 'Dynamic satellite animation tracking your path with 3D elevation contours and real-time pace coloring.',
  },
  {
    icon: (p) => <ChartLineUp {...p} weight="bold" />,
    title: 'Race Predictor & Best Efforts',
    description: 'Benchmark pace curves calculating projected 5K, 10K, Half Marathon, and Marathon finish times.',
  },
  {
    icon: (p) => <ShieldCheck {...p} weight="fill" />,
    title: 'Beacon Live Tracking',
    description: 'Safety feature sharing real-time GPS location coordinates and battery status with up to 3 safety contacts.',
  },
  {
    icon: (p) => <Flame {...p} weight="fill" />,
    title: 'Personal & Global Heatmaps',
    description: 'Visualize every road and trail you have conquered alongside community activity density layers.',
  },
  {
    icon: (p) => <Trophy {...p} weight="fill" />,
    title: 'Live Segments & KOM Competitions',
    description: 'Real-time audio and visual gap tracking against the King of the Mountain or your personal best.',
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual');
  const [subStatus, setSubStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await ApiClient.getSubscriptionStatus();
        setSubStatus(res);
      } catch (err) {
        console.log('Using default subscription status:', err);
        setSubStatus({
          subscription: { tier: 'summit', isActive: true },
          features: { athleteIntelligence: true, routeFlyover: true },
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadStatus();
  }, []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await ApiClient.upgradeSubscription(plan);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Subscription Activated', res.message || 'Welcome to Strava Summit!');
      const updated = await ApiClient.getSubscriptionStatus();
      setSubStatus(updated);
    } catch (err: any) {
      Alert.alert('Subscription Notice', err.message || 'Failed to update subscription.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const isActive = subStatus?.subscription?.isActive ?? true;

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Strava Subscription"
        showBack
        onBack={() => router.back()}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Hero Header */}
          <View style={styles.heroBanner}>
            <View style={[styles.flameCircle, { backgroundColor: colors.accent }]}>
              <Lightning size={32} color="#FFFFFF" weight="fill" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Strava Summit</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Unlock deeper performance analytics, 3D visualizations, and safety tools designed for dedicated athletes.
            </Text>
            {isActive && (
              <Badge
                label="ACTIVE SUBSCRIBER"
                variant="brand"
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>

          {/* Pricing Selector */}
          <SurfaceCard style={styles.pricingCard}>
            <View style={styles.planSwitchContainer}>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  plan === 'annual' && { backgroundColor: colors.accent, borderColor: colors.accent },
                  { borderColor: colors.border },
                ]}
                onPress={() => setPlan('annual')}
                activeOpacity={0.8}
              >
                <View style={styles.planHeaderRow}>
                  <Text style={[styles.planTitle, { color: plan === 'annual' ? '#FFFFFF' : colors.textPrimary }]}>
                    Annual
                  </Text>
                  <Badge label="SAVE 33%" variant="success" />
                </View>
                <Text style={[styles.planPrice, { color: plan === 'annual' ? '#FFFFFF' : colors.textPrimary }]}>
                  $79.99<Text style={styles.planPeriod}> / year</Text>
                </Text>
                <Text style={[styles.planBreakdown, { color: plan === 'annual' ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                  $6.67 / month billed annually
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planOption,
                  plan === 'monthly' && { backgroundColor: colors.accent, borderColor: colors.accent },
                  { borderColor: colors.border },
                ]}
                onPress={() => setPlan('monthly')}
                activeOpacity={0.8}
              >
                <Text style={[styles.planTitle, { color: plan === 'monthly' ? '#FFFFFF' : colors.textPrimary }]}>
                  Monthly
                </Text>
                <Text style={[styles.planPrice, { color: plan === 'monthly' ? '#FFFFFF' : colors.textPrimary }]}>
                  $11.99<Text style={styles.planPeriod}> / month</Text>
                </Text>
                <Text style={[styles.planBreakdown, { color: plan === 'monthly' ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                  Billed monthly, cancel anytime
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={isActive ? 'Renew / Manage Subscription' : 'Start 30-Day Free Trial'}
              variant="primary"
              size="lg"
              isLoading={isUpgrading}
              onPress={handleUpgrade}
              style={{ marginTop: spacing.md }}
            />
            <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
              Renews automatically. You can cancel anytime in Google Play Store settings.
            </Text>
          </SurfaceCard>

          {/* Perks Grid */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Features Included with Summit</Text>

          {SUMMIT_PERKS.map((perk, idx) => (
            <SurfaceCard key={idx} style={styles.perkCard}>
              <View style={[styles.perkIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                {perk.icon({ size: 22, color: colors.accent })}
              </View>
              <View style={styles.perkTextContent}>
                <Text style={[styles.perkTitle, { color: colors.textPrimary }]}>{perk.title}</Text>
                <Text style={[styles.perkDesc, { color: colors.textSecondary }]}>{perk.description}</Text>
              </View>
            </SurfaceCard>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
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
  contentContainer: {
    padding: spacing.md,
  },
  heroBanner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  flameCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.displayMedium,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  pricingCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  planSwitchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  planOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: borders.thin,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 4,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '400',
  },
  planBreakdown: {
    fontSize: 11,
    marginTop: 2,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading2,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  perkCard: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  perkIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  perkTextContent: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  perkDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
