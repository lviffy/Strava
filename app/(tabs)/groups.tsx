import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
}

interface Club {
  id: string;
  name: string;
  sportType: string;
  memberCount: number;
  location: string;
  isMember: boolean;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'November 50K Challenge',
    sportType: 'Run',
    targetKm: 50.0,
    currentKm: 34.2,
    daysRemaining: 18,
    badgeIcon: 'medal',
  },
  {
    id: 'c2',
    title: 'Autumn Gran Fondo 100K',
    sportType: 'Ride',
    targetKm: 100.0,
    currentKm: 68.5,
    daysRemaining: 12,
    badgeIcon: 'trophy',
  },
  {
    id: 'c3',
    title: 'Weekend 10K Time Trial',
    sportType: 'Run',
    targetKm: 10.0,
    currentKm: 10.0,
    daysRemaining: 2,
    badgeIcon: 'ribbon',
  },
];

const CLUBS: Club[] = [
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Segmented Control */}
      <View style={styles.segmentContainer}>
        <View style={[styles.segmentedControl, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'Challenges' && { backgroundColor: BrandColors.primary }]}
            onPress={() => setActiveTab('Challenges')}>
            <Text
              style={[
                styles.segmentText,
                { color: theme.text },
                activeTab === 'Challenges' && { color: '#FFFFFF', fontWeight: '800' },
              ]}>
              Challenges
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentButton, activeTab === 'Clubs' && { backgroundColor: BrandColors.primary }]}
            onPress={() => setActiveTab('Clubs')}>
            <Text
              style={[
                styles.segmentText,
                { color: theme.text },
                activeTab === 'Clubs' && { color: '#FFFFFF', fontWeight: '800' },
              ]}>
              Clubs
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Challenges' && (
          <View>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>Active Monthly Challenges</Text>
            {CHALLENGES.map((challenge) => {
              const progressPct = Math.min(100, Math.round((challenge.currentKm / challenge.targetKm) * 100));
              const isCompleted = progressPct >= 100;

              return (
                <View
                  key={challenge.id}
                  style={[styles.challengeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={styles.challengeHeader}>
                    <View style={styles.badgeCircle}>
                      <Ionicons
                        name={challenge.badgeIcon}
                        size={24}
                        color={isCompleted ? BrandColors.primary : '#888888'}
                      />
                    </View>
                    <View style={styles.challengeMeta}>
                      <Text style={[styles.challengeTitle, { color: theme.text }]}>{challenge.title}</Text>
                      <Text style={[styles.daysLeft, { color: theme.textSecondary }]}>
                        {isCompleted ? 'Completed! 🏆' : `${challenge.daysRemaining} days remaining`}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressPct}%`, backgroundColor: isCompleted ? BrandColors.gpsGreen : BrandColors.primary },
                      ]}
                    />
                  </View>

                  <View style={styles.progressNumbersRow}>
                    <Text style={[styles.progressNumbers, { color: theme.text }]}>
                      {challenge.currentKm} / {challenge.targetKm} km
                    </Text>
                    <Text style={[styles.progressPercent, { color: isCompleted ? BrandColors.gpsGreen : BrandColors.primary }]}>
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
            <Text style={[styles.sectionHeading, { color: theme.text }]}>Your Clubs & Community</Text>
            {CLUBS.map((club) => (
              <View
                key={club.id}
                style={[styles.clubCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.clubAvatar}>
                  <Ionicons name="shield" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.clubMeta}>
                  <Text style={[styles.clubName, { color: theme.text }]}>{club.name}</Text>
                  <Text style={[styles.clubSub, { color: theme.textSecondary }]}>
                    {club.sportType} • {club.memberCount} members
                  </Text>
                  <Text style={[styles.clubLocation, { color: theme.textSecondary }]}>{club.location}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    club.isMember && { backgroundColor: 'transparent', borderColor: theme.cardBorder, borderWidth: 1 },
                  ]}>
                  <Text style={[styles.joinButtonText, club.isMember && { color: theme.textSecondary }]}>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  challengeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(252, 82, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeMeta: {
    marginLeft: 14,
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  daysLeft: {
    fontSize: 13,
    marginTop: 2,
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
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  clubAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubMeta: {
    marginLeft: 12,
    flex: 1,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '700',
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
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
