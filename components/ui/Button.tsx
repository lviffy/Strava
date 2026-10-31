import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
  TextStyle,
} from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders, shadows } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  // Container styling based on variant
  let containerStyle: any = {
    borderRadius: radii.sm,
    borderWidth: 0,
    borderColor: 'transparent',
  };

  let textColor: string = '#FFFFFF';

  switch (variant) {
    case 'primary':
      containerStyle.backgroundColor = colors.accent;
      textColor = '#FFFFFF';
      break;
    case 'secondary':
      containerStyle.backgroundColor = colors.surfaceSecondary;
      containerStyle.borderWidth = borders.thin;
      containerStyle.borderColor = colors.border;
      textColor = colors.textPrimary;
      break;
    case 'destructive':
      containerStyle.backgroundColor = colors.error;
      textColor = '#FFFFFF';
      break;
    case 'ghost':
      containerStyle.backgroundColor = 'transparent';
      textColor = colors.textPrimary;
      break;
  }

  // Size styling
  let height: number = 44;
  let paddingHorizontal: number = spacing.lg;
  let textStyle: TextStyle = typography.button;

  if (size === 'sm') {
    height = 36;
    paddingHorizontal = spacing.md;
    textStyle = { ...typography.bodySmall, fontWeight: '700' };
  } else if (size === 'lg') {
    height = 52;
    paddingHorizontal = spacing.xl;
    textStyle = { ...typography.button, fontSize: 16 };
  }

  if (disabled || isLoading) {
    containerStyle.opacity = 0.55;
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { height, paddingHorizontal },
        containerStyle,
        shadows.none,
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.75}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
          <Text style={[styles.text, textStyle, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});
