import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Lightning,
  CaretRight,
  MapPin,
  ShieldCheck,
  SignOut,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/useAuthStore';
import { AudioCues } from '../../features/recording/AudioCues';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const { user, logout } = useAuthStore();

  const [audioCues, setAudioCues] = useState(AudioCues.getConfig().enabled);
  const [autoPause, setAutoPause] = useState(true);
  const [useMetric, setUseMetric] = useState(true);
  const [activityVisibility, setActivityVisibility] = useState('Everyone');

  const handleToggleAudioCues = (val: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setAudioCues(val);
    AudioCues.setConfig({ enabled: val });
  };

  const handleToggleAutoPause = (val: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setAutoPause(val);
  };

  const handleToggleUnits = (val: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setUseMetric(val);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your athlete account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
            router.replace('/(auth)/login');
          } catch (err) {
            console.error('Logout error:', err);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Settings"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Account & Profile Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Athlete Account</Text>
        <SurfaceCard style={styles.cardGroup}>
          <View style={styles.userRow}>
            <View style={[styles.userAvatar, { backgroundColor: colors.accent }]}>
              <Text style={styles.userAvatarText}>
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'A'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {user ? `${user.firstName} ${user.lastName}` : 'Athlete'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>
                {user?.email || 'athlete@strava.clone'}
              </Text>
            </View>
          </View>
        </SurfaceCard>

        {/* Subscription Banner */}
        <TouchableOpacity onPress={() => router.push('/subscription')} activeOpacity={0.8}>
          <SurfaceCard style={[styles.subBanner, { borderColor: colors.accent }]}>
            <View style={[styles.flameIcon, { backgroundColor: `${colors.accent}20` }]}>
              <Lightning size={20} color={colors.accent} weight="fill" />
            </View>
            <View style={styles.subTextContent}>
              <Text style={[styles.subTitle, { color: colors.textPrimary }]}>Strava Summit Subscription</Text>
              <Text style={[styles.subDesc, { color: colors.textSecondary }]}>
                Athlete Intelligence, 3D Flyover, & Beacon Safety are active.
              </Text>
            </View>
            <CaretRight size={16} color={colors.textMuted} weight="bold" />
          </SurfaceCard>
        </TouchableOpacity>

        {/* Recording & Cues Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Workout Recording</Text>
        <SurfaceCard style={styles.cardGroup}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Voice Audio Cues</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                Voice pace and distance split announcements during workouts.
              </Text>
            </View>
            <Switch
              value={audioCues}
              onValueChange={handleToggleAudioCues}
              thumbColor="#FFFFFF"
              trackColor={{ false: colors.surfaceSecondary, true: colors.accent }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Run & Ride Auto-Pause</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                Automatically pauses moving time when stopped at traffic lights.
              </Text>
            </View>
            <Switch
              value={autoPause}
              onValueChange={handleToggleAutoPause}
              thumbColor="#FFFFFF"
              trackColor={{ false: colors.surfaceSecondary, true: colors.accent }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Units of Measurement</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                {useMetric ? 'Metric (Kilometers, Meters, km/h)' : 'Imperial (Miles, Feet, mph)'}
              </Text>
            </View>
            <Switch
              value={useMetric}
              onValueChange={handleToggleUnits}
              thumbColor="#FFFFFF"
              trackColor={{ false: colors.surfaceSecondary, true: colors.accent }}
            />
          </View>
        </SurfaceCard>

        {/* Privacy & Safety */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Privacy & Safety</Text>
        <SurfaceCard style={styles.cardGroup}>
          <TouchableOpacity
            style={[styles.clickableRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/(tabs)/you')}
            activeOpacity={0.7}
          >
            <View style={styles.rowIcon}>
              <MapPin size={20} color={colors.accent} weight="fill" />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Privacy Zones</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                Geofence radius around home or work to conceal start/end GPS.
              </Text>
            </View>
            <CaretRight size={16} color={colors.textMuted} weight="bold" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clickableRow}
            onPress={() => router.push('/(tabs)/you')}
            activeOpacity={0.7}
          >
            <View style={styles.rowIcon}>
              <ShieldCheck size={20} color={colors.accent} weight="fill" />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Beacon Safety Contacts</Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                Live tracking stream shared with trusted emergency contacts.
              </Text>
            </View>
            <CaretRight size={16} color={colors.textMuted} weight="bold" />
          </TouchableOpacity>
        </SurfaceCard>

        {/* About & Version */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Application Information</Text>
        <SurfaceCard style={styles.cardGroup}>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoKey, { color: colors.textPrimary }]}>Version Parity</Text>
            <Text style={[styles.infoVal, { color: colors.textMuted }]}>Strava v486.11 (Build 12400195)</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoKey, { color: colors.textPrimary }]}>Architecture</Text>
            <Text style={[styles.infoVal, { color: colors.textMuted }]}>React Native + Expo SDK 58</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: colors.textPrimary }]}>Local Storage</Text>
            <Text style={[styles.infoVal, { color: colors.textMuted }]}>expo-sqlite (WAL Enabled)</Text>
          </View>
        </SurfaceCard>

        {/* Log Out Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.error, backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <SignOut size={18} color={colors.error} weight="bold" style={{ marginRight: spacing.sm }} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out of Athlete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  cardGroup: {
    padding: 0,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  subBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: borders.thin,
  },
  flameIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  subTextContent: {
    flex: 1,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  subDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: borders.thin,
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: borders.thin,
  },
  rowIcon: {
    width: 32,
    marginRight: spacing.sm,
  },
  settingText: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: borders.thin,
  },
  infoKey: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: borders.thin,
    marginTop: spacing.lg,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
