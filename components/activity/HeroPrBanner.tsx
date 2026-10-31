import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Trophy } from 'phosphor-react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';

interface HeroPrBannerProps {
  benchmarkName?: string;
  customMessage?: string;
}

export function HeroPrBanner({ benchmarkName = '10K', customMessage }: HeroPrBannerProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const headline = customMessage || `Your fastest ${benchmarkName} ever!`;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.trophyIconBox}>
        <Trophy size={18} color="#F59E0B" weight="bold" />
        <Text style={styles.prSubText}>PR</Text>
      </View>
      <Text style={[styles.headlineText, { color: colors.textPrimary }]}>
        {headline}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    marginVertical: spacing.sm,
  },
  trophyIconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  prSubText: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '900',
    color: '#F59E0B',
    marginTop: -2,
  },
  headlineText: {
    flex: 1,
    ...typography.heading3,
    fontWeight: '700',
  },
});
