import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/useAuthStore';
import { BrandColors } from '../../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return;
    }
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

    const success = await login('athlete@strava.clone', 'password123');
    if (success) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo & Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="flame" size={38} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>STRAVA</Text>
            <Text style={styles.subtitle}>Record. Connect. Compete.</Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#FF453A" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Inputs */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={BrandColors.textSecondaryDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="athlete@example.com"
                placeholderTextColor="#636366"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) clearError();
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 18 }]}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={BrandColors.textSecondaryDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#636366"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) clearError();
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={BrandColors.textSecondaryDark}
                />
              </TouchableOpacity>
            </View>

            {/* Main Login Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!email || !password || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!email || !password || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Quick Demo Sign In */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={18} color={BrandColors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.demoButtonText}>Quick Demo Sign-In (Alex Rivera)</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Register Link */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkTouch}>
              <Text style={styles.linkText}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.backgroundDark,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.textSecondaryDark,
    marginTop: 6,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderColor: '#FF453A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: BrandColors.surfaceDark,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: BrandColors.borderDark,
  },
  inputLabel: {
    color: BrandColors.textSecondaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.surfaceCardDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.borderDark,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  eyeButton: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(252, 82, 0, 0.08)',
    marginTop: 14,
  },
  demoButtonText: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: BrandColors.textSecondaryDark,
    fontSize: 14,
  },
  linkTouch: {
    padding: 4,
  },
  linkText: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
