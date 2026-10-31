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

export default function RegisterScreen() {
  const router = useRouter();
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.logoBadge}>
              <Ionicons name="flame" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>JOIN STRAVA</Text>
            <Text style={styles.subtitle}>Track your runs, rides, and share with friends</Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#FF453A" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name Row */}
            <View style={styles.row}>
              <View style={[styles.column, { marginRight: 8 }]}>
                <Text style={styles.inputLabel}>FIRST NAME</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Alex"
                    placeholderTextColor="#636366"
                    value={firstName}
                    onChangeText={(t) => {
                      setFirstName(t);
                      if (error) clearError();
                    }}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={[styles.column, { marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>LAST NAME</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Rivera"
                    placeholderTextColor="#636366"
                    value={lastName}
                    onChangeText={(t) => {
                      setLastName(t);
                      if (error) clearError();
                    }}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>LOCATION / CITY</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color={BrandColors.textSecondaryDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="San Francisco, CA"
                placeholderTextColor="#636366"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={BrandColors.textSecondaryDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="athlete@example.com"
                placeholderTextColor="#636366"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) clearError();
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>PASSWORD (MIN 6 CHARS)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={BrandColors.textSecondaryDark} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#636366"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
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

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isFormValid || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Athlete Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Back to Login */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkTouch}>
              <Text style={styles.linkText}> Log In</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 4,
    padding: 8,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: BrandColors.textSecondaryDark,
    marginTop: 4,
    textAlign: 'center',
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
    marginBottom: 16,
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
    padding: 20,
    borderWidth: 1,
    borderColor: BrandColors.borderDark,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  inputLabel: {
    color: BrandColors.textSecondaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.surfaceCardDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.borderDark,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
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
    marginTop: 22,
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
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
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
