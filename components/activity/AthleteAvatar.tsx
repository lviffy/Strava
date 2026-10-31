import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, typography, borders } from '../../constants/theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AthleteAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  color?: string;
}

export function AthleteAvatar({
  name,
  avatarUrl,
  size = 'md',
  color,
}: AthleteAvatarProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  let dimension = 40;
  let textSize = 15;

  switch (size) {
    case 'sm':
      dimension = 32;
      textSize = 12;
      break;
    case 'md':
      dimension = 40;
      textSize = 15;
      break;
    case 'lg':
      dimension = 56;
      textSize = 20;
      break;
    case 'xl':
      dimension = 72;
      textSize = 26;
      break;
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AT';

  const bgColor = color || colors.accent;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            borderColor: colors.border,
            borderWidth: borders.thin,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: bgColor,
          borderColor: colors.border,
          borderWidth: borders.thin,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: textSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
