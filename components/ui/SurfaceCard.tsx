import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, borders, shadows } from '../../constants/theme';

interface SurfaceCardProps extends ViewProps {
  children: React.ReactNode;
  secondary?: boolean;
}

export function SurfaceCard({ children, style, secondary = false, ...props }: SurfaceCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: secondary ? colors.surfaceSecondary : colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: borders.thin,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.none,
  },
});
