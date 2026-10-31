import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Compass } from 'phosphor-react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, typography } from '../../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  iconName?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  iconName,
  icon,
  title,
  description,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceSecondary }]}>
        {icon ? (
          icon
        ) : (
          <Compass size={32} color={colors.textSecondary} weight="regular" />
        )}
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {actionTitle && onAction ? (
        <View style={styles.actionWrapper}>
          <Button title={actionTitle} size="sm" variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xxl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionWrapper: {
    marginTop: spacing.lg,
  },
});
