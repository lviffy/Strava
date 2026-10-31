import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme, { radii, typography } from '../../constants/theme';

interface PrBadgeProps {
  rank?: number; // 1 = PR (Gold), 2 = 2nd (Silver), 3 = 3rd (Bronze)
  size?: number;
  label?: string;
}

export function PrBadge({ rank = 1, size = 32, label }: PrBadgeProps) {
  let bgColor = '#F59E0B'; // Gold Amber
  let textColor = '#FFFFFF';
  let badgeText = 'PR';

  if (rank === 2) {
    bgColor = '#94A3B8'; // Slate Silver
    badgeText = '2';
  } else if (rank === 3) {
    bgColor = '#D97706'; // Bronze
    badgeText = '3';
  }

  const iconSize = Math.round(size * 0.5);

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: bgColor }]}>
      <Ionicons name="trophy" size={iconSize} color={textColor} />
      <Text style={[styles.badgeText, { fontSize: Math.max(8, Math.round(size * 0.28)) }]}>
        {label || badgeText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: -2,
    letterSpacing: -0.5,
  },
});
