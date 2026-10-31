import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityDao } from '../../database/ActivityDao';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

interface Challenge {
  id: string;
  title: string;
  sportType: 'Run' | 'Ride' | 'Walk';
  targetKm: number;
  currentKm: number;
  daysRemaining: number;
  badgeIcon: any;
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

export default function GroupsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [activeTab, setActiveTab] = useState<'Challenges' | 'Clubs'>('Challenges');
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 'c1',
      title: 'November 50K Challenge',
      sportType: 'Run',
      targetKm: 50.0,
      currentKm: 0,
      daysRemaining: 18,
      badgeIcon: 'medal',
      joined: true,
    },
    {
      id: 'c2',
      title: 'Autumn Gran Fondo 100K',
      sportType: 'Ride',
      targetKm: 100.0,
      currentKm: 0,
      daysRemaining: 12,
      badgeIcon: 'trophy',
      joined: true,
    },
    {
      id: 'c3',
      title: 'Weekend 10K Time Trial',
      sportType: 'Run',
      targetKm: 10.0,
      currentKm: 0,
      daysRemaining: 2,
      badgeIcon: 'ribbon',
      joined: false,
    },
  ]);

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
              return { ...c, currentKm: Math.min(c.targetKm, runKm) };
            } else if (c.sportType === 'Ride') {
              return { ...c, currentKm: Math.min(c.targetKm, rideKm) };
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

  const toggleChallengeJoin = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, joined: !c.joined } : c))
    );
  };

  const toggleClubJoin = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Top Segmented Control */}
      <View style={styles.segmentContainer}>
        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'Challenges' && { backgroundColor: BrandColors.primary },
            ]}
            onPress={() => setActiveTab('Challenges')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: theme.text },
                activeTab === 'Challenges' && { color: '#FFFFFF', fontWeight: '800' },
              ]}
            >
              Challenges
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'Clubs' && { backgroundColor: BrandColors.primary },
            ]}
            onPress={() => setActiveTab('Clubs')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: theme.text },
                activeTab === 'Clubs' && { color: '#FFFFFF', fontWeight: '800' },
              ]}
            >
              Clubs
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Challenges' && (
          <View>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Active Monthly Challenges
            </Text>
            {challenges.map((challenge) => {
              const progressPct = Math.min(
                100,
                Math.round((challenge.currentKm / challenge.targetKm) * 100)
              );
              const isCompleted = progressPct >= 100;

              return (
                <View
                  key={challenge.id}
                  style={[
                    styles.challengeCard,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  ]}
                >
                  <View style={styles.challengeHeader}>
                    <View style={styles.badgeCircle}>
                      <Ionicons
                        name={challenge.badgeIcon}
                        size={24}
                        color={isCompleted ? BrandColors.primary : '#888888'}
                      />
                    </View>
                    <View style={styles.challengeMeta}>
                      <Text style={[styles.challengeTitle, { color: theme.text }]}>
                        {challenge.title}
                      </Text>
                      <Text style={[styles.daysLeft, { color: theme.textSecondary }]}>
                        {isCompleted
                          ? 'Completed! 🏆'
                          : `${challenge.daysRemaining} days remaining`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.joinChallengeBtn,
                        challenge.joined && styles.joinedChallengeBtn,
                      ]}
                      onPress={() => toggleChallengeJoin(challenge.id)}
                    >
                      <Text
                        style={[
                          styles.joinChallengeBtnText,
                          challenge.joined && styles.joinedChallengeBtnText,
                        ]}
                      >
                        {challenge.joined ? 'Joined' : 'Join'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${progressPct}%`,
                          backgroundColor: isCompleted
                            ? BrandColors.gpsGreen
                            : BrandColors.primary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.progressNumbersRow}>
                    <Text style={[styles.progressNumbers, { color: theme.text }]}>
                      {challenge.currentKm.toFixed(1)} / {challenge.targetKm} km
                    </Text>
                    <Text
                      style={[
                        styles.progressPercent,
                        {
                          color: isCompleted ? BrandColors.gpsGreen : BrandColors.primary,
                        },
                      ]}
                    >
                      {progressPct}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'Clubs' && (
          <View>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Your Clubs & Community
            </Text>
            {clubs.map((club) => (
              <View
                key={club.id}
                style={[
                  styles.clubCard,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
              >
                <View style={styles.clubAvatar}>
                  <Ionicons name="shield" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.clubMeta}>
                  <Text style={[styles.clubName, { color: theme.text }]}>{club.name}</Text>
                  <Text style={[styles.clubSub, { color: theme.textSecondary }]}>
                    {club.sportType} • {club.memberCount} members
                  </Text>
                  <Text style={[styles.clubLocation, { color: theme.textSecondary }]}>
                    {club.location}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    club.isMember && {
                      backgroundColor: 'transparent',
                      borderColor: theme.cardBorder,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => toggleClubJoin(club.id)}
                >
                  <Text
                    style={[
                      styles.joinButtonText,
                      club.isMember && { color: theme.textSecondary },
                    ]}
                  >
                    {club.isMember ? 'Joined' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
    marginTop: 6,
  },
  challengeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(252, 82, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeMeta: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  daysLeft: {
    fontSize: 12,
    marginTop: 2,
  },
  joinChallengeBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinedChallengeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#38383A',
  },
  joinChallengeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  joinedChallengeBtnText: {
    color: '#8E8E93',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(150,150,150,0.2)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressNumbers: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  clubAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clubMeta: {
    flex: 1,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '800',
  },
  clubSub: {
    fontSize: 12,
    marginTop: 2,
  },
  clubLocation: {
    fontSize: 11,
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
