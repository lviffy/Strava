import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, borders, shadows } from '../../constants/theme';

interface IconButtonProps extends TouchableOpacityProps {
  icon: React.ReactNode;
  size?: number;
  bordered?: boolean;
}

export function IconButton({
  icon,
  size = 40,
  bordered = false,
  style,
  ...props
}: IconButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radii.sm,
          borderWidth: bordered ? borders.thin : 0,
          borderColor: bordered ? colors.border : 'transparent',
          backgroundColor: bordered ? colors.surfaceSecondary : 'transparent',
        },
        shadows.none,
        style,
      ]}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      {...props}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
