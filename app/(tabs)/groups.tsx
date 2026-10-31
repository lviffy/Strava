import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Medal, ShieldCheck } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ActivityDao } from '../../database/ActivityDao';
import { ApiClient } from '../../services/ApiClient';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface Challenge {
  id: string;
  title: string;
  sportType: 'Run' | 'Ride' | 'Walk';
  targetKm: number;
  currentKm: number;
  daysRemaining: number;
  badgeIcon?: string;
  badgeType?: 'medal' | 'trophy' | 'ribbon';
  joined: boolean;
}

interface Club {
  id: string;
  name: string;
  sportType: string;
  memberCount: number;
  location: string;
  isMember: boolean;
}

const INITIAL_CLUBS: Club[] = [
  {
    id: 'cl1',
    name: 'San Francisco Trail Runners',
    sportType: 'Running Club',
    memberCount: 1420,
    location: 'San Francisco, CA',
    isMember: true,
  },
  {
    id: 'cl2',
    name: 'Bay Area Cycling Syndicate',
    sportType: 'Cycling Team',
    memberCount: 3890,
    location: 'Palo Alto, CA',
    isMember: false,
  },
  {
    id: 'cl3',
    name: 'Dawn Patrol Early Risers',
    sportType: 'Multi-Sport',
    memberCount: 820,
    location: 'Marin County, CA',
    isMember: true,
  },
];

const TABS = ['Challenges', 'Clubs'] as const;
type TabType = typeof TABS[number];

export default function GroupsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const [activeTab, setActiveTab] = useState<TabType>('Challenges');
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 'c1',
      title: 'November 50K Challenge',
      sportType: 'Run',
      targetKm: 50.0,
      currentKm: 0,
      daysRemaining: 18,
      badgeIcon: 'medal-outline',
      joined: true,
    },
    {
      id: 'c2',
      title: 'Autumn Gran Fondo 100K',
      sportType: 'Ride',
      targetKm: 100.0,
      currentKm: 0,
      daysRemaining: 12,
      badgeIcon: 'trophy-outline',
      joined: true,
    },
    {
      id: 'c3',
      title: 'Weekend 10K Time Trial',
      sportType: 'Run',
      targetKm: 10.0,
      currentKm: 0,
      daysRemaining: 2,
      badgeIcon: 'ribbon-outline',
      joined: false,
    },
  ]);

  // Load from API with local fallback
  useEffect(() => {
    async function loadApiData() {
      try {
        const [challengesRes, clubsRes] = await Promise.allSettled([
          ApiClient.getChallenges(),
          ApiClient.getClubs(),
        ]);

        if (challengesRes.status === 'fulfilled' && challengesRes.value?.challenges) {
          setChallenges(challengesRes.value.challenges);
        }

        if (clubsRes.status === 'fulfilled' && clubsRes.value?.clubs) {
          setClubs(clubsRes.value.clubs);
        }
      } catch (err) {
        console.log('Using offline groups fallback:', err);
      }
    }
    loadApiData();
  }, []);

  // Dynamically calculate user's actual mileage for challenges
  useEffect(() => {
    async function calculateMileage() {
      try {
        const activities = await ActivityDao.getAllSavedActivities();

        const runMeters = activities
          .filter((a) => a.sport_type === 'Run')
          .reduce((acc, a) => acc + a.distance_meters, 0);

        const rideMeters = activities
          .filter((a) => a.sport_type === 'Ride')
          .reduce((acc, a) => acc + a.distance_meters, 0);

        const runKm = +(runMeters / 1000).toFixed(1);
        const rideKm = +(rideMeters / 1000).toFixed(1);

        setChallenges((prev) =>
          prev.map((c) => {
            if (c.sportType === 'Run') {
              return { ...c, currentKm: Math.max(c.currentKm, Math.min(c.targetKm, runKm)) };
            } else if (c.sportType === 'Ride') {
              return { ...c, currentKm: Math.max(c.currentKm, Math.min(c.targetKm, rideKm)) };
            }
            return c;
          })
        );
      } catch (e) {
        console.error('Failed to calculate challenge mileage:', e);
      }
    }
    calculateMileage();
  }, []);

  const toggleChallengeJoin = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await ApiClient.toggleJoinChallenge(id).catch(() => {});
    } catch {}
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, joined: !c.joined } : c))
    );
  };

  const toggleClubJoin = async (id: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await ApiClient.toggleJoinClub(id).catch(() => {});
    } catch {}
    setClubs((prev) =>
      prev.map((cl) => {
        if (cl.id === id) {
          const isJoining = !cl.isMember;
          return {
            ...cl,
            isMember: isJoining,
            memberCount: isJoining ? cl.memberCount + 1 : cl.memberCount - 1,
          };
        }
        return cl;
      })
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.tabContainer}>
        <SegmentedControl
          options={TABS as unknown as string[]}
          selectedOption={activeTab}
          onSelect={(tab) => setActiveTab(tab as TabType)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Challenges' && (
          <View>
            <SectionHeader title="ACTIVE MONTHLY CHALLENGES" />
            {challenges.map((challenge) => {
              const progressPct = Math.min(
                100,
                Math.round((challenge.currentKm / challenge.targetKm) * 100)
              );
              const isCompleted = progressPct >= 100;

              return (
                <SurfaceCard key={challenge.id}>
                  <View style={styles.cardHeader}>
                    <TouchableOpacity
                      style={styles.cardTouchArea}
                      onPress={() => router.push(`/challenges/${challenge.id}`)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.badgeIconWrapper, { backgroundColor: colors.surfaceSecondary }]}>
                        {challenge.title.toLowerCase().includes('fondo') || challenge.title.toLowerCase().includes('climb') ? (
                          <Trophy
                            size={22}
                            color={isCompleted ? colors.accent : colors.textSecondary}
                            weight="fill"
                          />
                        ) : (
                          <Medal
                            size={22}
                            color={isCompleted ? colors.accent : colors.textSecondary}
                            weight="fill"
                          />
                        )}
                      </View>
                      <View style={styles.cardMeta}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          {challenge.title}
                        </Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                          {isCompleted
                            ? 'Goal Completed'
                            : `${challenge.daysRemaining} days remaining`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <Button
                      title={challenge.joined ? 'Joined' : 'Join'}
                      size="sm"
                      variant={challenge.joined ? 'secondary' : 'primary'}
                      onPress={() => toggleChallengeJoin(challenge.id)}
                    />
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${progressPct}%`,
                          backgroundColor: isCompleted ? colors.success : colors.accent,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.progressNumbersRow}>
                    <Text style={[styles.progressNumbers, { color: colors.textPrimary }]}>
                      {challenge.currentKm.toFixed(1)} / {challenge.targetKm} km
                    </Text>
                    <Badge
                      label={`${progressPct}%`}
                      variant={isCompleted ? 'success' : 'neutral'}
                    />
                  </View>
                </SurfaceCard>
              );
            })}
          </View>
        )}

        {activeTab === 'Clubs' && (
          <View>
            <SectionHeader title="YOUR CLUBS & COMMUNITY" />
            {clubs.map((club) => (
              <SurfaceCard key={club.id}>
                <View style={styles.cardHeader}>
                  <TouchableOpacity
                    style={styles.cardTouchArea}
                    onPress={() => router.push(`/clubs/${club.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.badgeIconWrapper, { backgroundColor: colors.surfaceSecondary }]}>
                      <ShieldCheck size={22} color={colors.accent} weight="bold" />
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                        {club.name}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                        {club.sportType} • {club.memberCount} members
                      </Text>
                      <Text style={[styles.locationText, { color: colors.textMuted }]}>
                        {club.location}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Button
                    title={club.isMember ? 'Joined' : 'Join'}
                    size="sm"
                    variant={club.isMember ? 'secondary' : 'primary'}
                    onPress={() => toggleClubJoin(club.id)}
                  />
                </View>
              </SurfaceCard>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    ...typography.heading3,
  },
  cardSub: {
    ...typography.caption,
    marginTop: 2,
  },
  locationText: {
    ...typography.caption,
    fontSize: 10,
    marginTop: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: radii.xs,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: radii.xs,
  },
  progressNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  progressNumbers: {
    ...typography.caption,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
