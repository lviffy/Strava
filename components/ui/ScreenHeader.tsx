import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../useColorScheme';
import theme, { typography, spacing } from '../../constants/theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  subtitle?: string;
}

export function ScreenHeader({
  title,
  showBack = false,
  onBack,
  rightAction,
  subtitle,
}: ScreenHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>
        )}
        <View style={styles.titleWrapper}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    ...typography.heading2,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 1,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
