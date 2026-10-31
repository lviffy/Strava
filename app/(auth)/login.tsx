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
import {
  Lightning,
  WarningCircle,
  EnvelopeSimple,
  Lock,
  Eye,
  EyeSlash,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiClient } from '../../services/ApiClient';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { InputText } from '../../components/ui/InputText';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const { login, loginAsDemoAthlete, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const success = await login(email.trim(), password);
    if (success) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace('/(tabs)');
    }
  };

  const handleDemoSignIn = async () => {
    clearError();
    setEmail('athlete@strava.clone');
    setPassword('password123');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const success = await loginAsDemoAthlete();
    if (success) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace('/(tabs)');
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <View style={styles.headerContainer}>
            <View style={[styles.logoBadge, { backgroundColor: colors.accent }]}>
              <Lightning size={32} color="#FFFFFF" weight="fill" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>STRAVA</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Record. Connect. Compete.
            </Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.error }]}>
              <WarningCircle size={18} color={colors.error} weight="bold" style={{ marginRight: 8 }} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            <InputText
              label="Email Address"
              placeholder="athlete@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) clearError();
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              leftIcon={<EnvelopeSimple size={18} color={colors.textSecondary} weight="bold" />}
            />

            <InputText
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) clearError();
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Lock size={18} color={colors.textSecondary} weight="bold" />}
              rightIcon={
                showPassword ? (
                  <EyeSlash size={18} color={colors.textSecondary} weight="bold" />
                ) : (
                  <Eye size={18} color={colors.textSecondary} weight="bold" />
                )
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Main Login Button */}
            <Button
              title="LOG IN"
              size="lg"
              variant="primary"
              onPress={handleLogin}
              disabled={!email || !password || isLoading}
              isLoading={isLoading}
              style={styles.actionBtn}
            />

            {/* Quick Demo Sign In */}
            <Button
              title="DEMO ATHLETE (ALEX RIVERA)"
              size="md"
              variant="secondary"
              onPress={handleDemoSignIn}
              disabled={isLoading}
              icon={<Lightning size={18} color={colors.accent} weight="fill" />}
              style={styles.actionBtn}
            />
          </View>

          {/* Footer Register Link */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an athlete account?
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkTouch}>
              <Text style={[styles.linkText, { color: colors.accent }]}> Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.serverInfo}>
            <Text style={[styles.serverText, { color: colors.textMuted }]}>
              Server: {ApiClient.getBaseUrl()}
            </Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    ...typography.displayMedium,
    letterSpacing: 2,
    fontWeight: '900',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 4,
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
    marginBottom: spacing.xl,
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
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
  serverInfo: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  serverText: {
    ...typography.caption,
    fontSize: 10,
  },
});
