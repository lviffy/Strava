import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/useAuthStore';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { InputText } from '../../components/ui/InputText';
import { Button } from '../../components/ui/Button';

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const { register, isLoading, error, clearError } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      return;
    }
    clearError();
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const success = await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      city: city.trim() || 'San Francisco, CA',
      email: email.trim(),
      password,
    });

    if (success) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace('/(tabs)');
    }
  };

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().includes('@') &&
    password.length >= 6;

  return (
    <ScreenContainer>
      <ScreenHeader title="Join Strava" showBack />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Subtitle */}
          <View style={styles.headerSubtitle}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Track your runs, rides, and share progress with the community.
            </Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.error }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.row}>
              <View style={[styles.column, { marginRight: spacing.sm }]}>
                <InputText
                  label="First Name"
                  placeholder="Alex"
                  value={firstName}
                  onChangeText={(t) => {
                    setFirstName(t);
                    if (error) clearError();
                  }}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.column, { marginLeft: spacing.sm }]}>
                <InputText
                  label="Last Name"
                  placeholder="Rivera"
                  value={lastName}
                  onChangeText={(t) => {
                    setLastName(t);
                    if (error) clearError();
                  }}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <InputText
              label="Location / City"
              placeholder="San Francisco, CA"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              leftIcon={<Ionicons name="location-outline" size={18} color={colors.textSecondary} />}
            />

            <InputText
              label="Email Address"
              placeholder="athlete@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) clearError();
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textSecondary} />}
            />

            <InputText
              label="Password (min 6 chars)"
              placeholder="Create a password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) clearError();
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />}
              rightIcon={
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Button
              title="CREATE ATHLETE ACCOUNT"
              size="lg"
              variant="primary"
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
              isLoading={isLoading}
              style={{ marginTop: spacing.md }}
            />
          </View>

          {/* Footer Link */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.linkTouch}>
              <Text style={[styles.linkText, { color: colors.accent }]}> Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerSubtitle: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: borders.thin,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    flex: 1,
  },
  formContainer: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  footerText: {
    ...typography.bodySmall,
  },
  linkTouch: {
    paddingVertical: 4,
  },
  linkText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
