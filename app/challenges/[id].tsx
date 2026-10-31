import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ShareNetwork,
  Trophy,
  Clock,
  CheckCircle,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../../services/ApiClient';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AthleteAvatar } from '../../components/activity/AthleteAvatar';

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [challenge, setChallenge] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingJoin, setIsTogglingJoin] = useState(false);

  const loadChallenge = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ApiClient.getChallenge(id);
      if (res && res.challenge) {
        setChallenge(res.challenge);
      }
    } catch (err) {
      console.log('Error loading challenge:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const handleToggleJoin = async () => {
    if (!id) return;
    setIsTogglingJoin(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await ApiClient.toggleJoinChallenge(id);
      setChallenge((prev: any) => ({
        ...prev,
        joined: res.joined,
        participantCount: res.participantCount,
      }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error toggling challenge enrollment:', err);
    } finally {
      setIsTogglingJoin(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Challenge" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  if (!challenge) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Challenge" showBack onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Challenge not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  const progressPercent = challenge.progressPercent || 0;

  return (
    <ScreenContainer>
      <ScreenHeader
        title={challenge.title}
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            onPress={() => Alert.alert('Share Challenge', `Invite athletes to take on the ${challenge.title}!`)}
            activeOpacity={0.7}
          >
            <ShareNetwork size={20} color={colors.textPrimary} weight="regular" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Challenge Hero Card */}
        <SurfaceCard style={styles.heroCard}>
          <View style={styles.badgeTopRow}>
            <View style={[styles.trophyCircle, { backgroundColor: `${colors.accent}18` }]}>
              <Trophy size={32} color={colors.accent} weight="fill" />
            </View>
            <View style={styles.daysBadge}>
              <Clock size={13} color={colors.accent} weight="bold" style={{ marginRight: 4 }} />
              <Text style={[styles.daysText, { color: colors.accent }]}>
                {challenge.daysRemaining > 0 ? `${challenge.daysRemaining} days left` : 'Challenge Ending'}
              </Text>
            </View>
          </View>

          <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>{challenge.title}</Text>
          <Text style={[styles.challengeDescription, { color: colors.textSecondary }]}>
            {challenge.description}
          </Text>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressCurrent, { color: colors.textPrimary }]}>
                {challenge.currentKm} km / {challenge.targetKm} km
              </Text>
              <Text style={[styles.progressPercent, { color: colors.accent }]}>
                {progressPercent}%
              </Text>
            </View>

            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: challenge.completed ? colors.success : colors.accent,
                  },
                ]}
              />
            </View>
          </View>

          <Button
            title={challenge.joined ? 'Leave Challenge' : 'Join Challenge'}
            variant={challenge.joined ? 'secondary' : 'primary'}
            size="lg"
            isLoading={isTogglingJoin}
            onPress={handleToggleJoin}
            style={{ marginTop: spacing.md }}
          />
        </SurfaceCard>

        {/* Challenge Qualifying Rules */}
        <SurfaceCard style={styles.rulesCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Qualifying Rules</Text>
          <View style={styles.ruleItem}>
            <CheckCircle size={18} color={colors.success} weight="fill" style={{ marginRight: spacing.sm }} />
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              Sport types: {challenge.sportType} GPS activities recorded during the challenge window.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <CheckCircle size={18} color={colors.success} weight="fill" style={{ marginRight: spacing.sm }} />
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              Qualifying workouts must have privacy set to "Everyone" or "Followers".
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <CheckCircle size={18} color={colors.success} weight="fill" style={{ marginRight: spacing.sm }} />
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              Earn a verified digital finisher badge in your trophy case upon completion.
            </Text>
          </View>
        </SurfaceCard>

        {/* Leaderboard Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginVertical: spacing.sm }]}>
          Leaderboard ({challenge.participantCount} athletes)
        </Text>

        {challenge.leaderboard && challenge.leaderboard.length > 0 ? (
          challenge.leaderboard.map((item: any) => (
            <SurfaceCard key={item.rank} style={styles.leaderboardRow}>
              <Text style={[styles.rankNumber, { color: item.rank <= 3 ? colors.accent : colors.textMuted }]}>
                #{item.rank}
              </Text>

              <TouchableOpacity
                style={styles.athleteInfo}
                onPress={() => router.push(`/profile/${item.athleteId}`)}
                activeOpacity={0.8}
              >
                <AthleteAvatar name={item.name} size="sm" color={colors.routeColor} />
                <View style={styles.athleteDetails}>
                  <Text style={[styles.athleteName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.athleteCity, { color: colors.textMuted }]}>{item.city || 'Athlete'}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.distanceBox}>
                <Text style={[styles.distText, { color: colors.textPrimary }]}>{item.distanceKm} km</Text>
                {item.completed && (
                  <Badge label="COMPLETED" variant="success" />
                )}
              </View>
            </SurfaceCard>
          ))
        ) : (
          <SurfaceCard style={styles.emptyCard}>
            <Text style={{ color: colors.textSecondary }}>Be the first athlete to join and record mileage!</Text>
          </SurfaceCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  heroCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  badgeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trophyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: 'rgba(252, 76, 2, 0.1)',
  },
  daysText: {
    fontSize: 12,
    fontWeight: '700',
  },
  challengeTitle: {
    ...typography.heading1,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  challengeDescription: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  progressSection: {
    marginVertical: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressCurrent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rulesCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  rankNumber: {
    width: 32,
    fontSize: 14,
    fontWeight: '800',
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  athleteDetails: {
    marginLeft: spacing.sm,
  },
  athleteName: {
    fontSize: 14,
    fontWeight: '700',
  },
  athleteCity: {
    fontSize: 11,
  },
  distanceBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  distText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
});
