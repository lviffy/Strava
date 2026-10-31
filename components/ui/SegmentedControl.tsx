import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';

interface SegmentedControlProps<T extends string> {
  options: T[];
  selectedOption: T;
  onSelect: (option: T) => void;
  renderLabel?: (option: T) => string;
}

export function SegmentedControl<T extends string>({
  options,
  selectedOption,
  onSelect,
  renderLabel,
}: SegmentedControlProps<T>) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      {options.map((option) => {
        const isSelected = option === selectedOption;
        const label = renderLabel ? renderLabel(option) : option;

        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.segment,
              isSelected && [
                styles.selectedSegment,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ],
            ]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? colors.textPrimary : colors.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm - 2,
  },
  selectedSegment: {
    borderWidth: borders.thin,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
  },
});
