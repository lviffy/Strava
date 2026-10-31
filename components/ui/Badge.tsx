import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';

export type BadgeVariant = 'brand' | 'neutral' | 'success' | 'warning' | 'error';

interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export function Badge({ label, variant = 'brand', icon, style, ...props }: BadgeProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  let bg = colors.tintSubtle;
  let textCol = colors.accent;
  let borderColor = 'transparent';

  switch (variant) {
    case 'brand':
      bg = colors.tintSubtle;
      textCol = colors.accent;
      break;
    case 'neutral':
      bg = colors.surfaceSecondary;
      textCol = colors.textSecondary;
      borderColor = colors.border;
      break;
    case 'success':
      bg = colorScheme === 'dark' ? '#0E2B16' : '#DCFCE7';
      textCol = colors.success;
      break;
    case 'warning':
      bg = colorScheme === 'dark' ? '#2F1E05' : '#FEF3C7';
      textCol = colors.warning;
      break;
    case 'error':
      bg = colorScheme === 'dark' ? '#330E0E' : '#FEE2E2';
      textCol = colors.error;
      break;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: borderColor !== 'transparent' ? borders.thin : 0,
        },
        style,
      ]}
      {...props}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color: textCol }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...typography.label,
    fontSize: 10,
    lineHeight: 12,
  },
});
