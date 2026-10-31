import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Sparkle, CaretRight, X } from 'phosphor-react-native';
import { ActivityInsight } from '../../database/InsightsDao';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, typography, radii, borders } from '../../constants/theme';

interface AthleteIntelligenceCardProps {
  insight: ActivityInsight | null;
}

export function AthleteIntelligenceCard({ insight }: AthleteIntelligenceCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const [modalVisible, setModalVisible] = useState(false);

  if (!insight) return null;

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        {/* Header Row: Sparkle Icon + Athlete Intelligence */}
        <View style={styles.headerRow}>
          <View style={styles.flameIconBox}>
            <Sparkle size={16} color={colors.accent} weight="fill" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Athlete Intelligence
          </Text>
        </View>

        {/* Critique Body */}
        <Text style={[styles.critiqueText, { color: colors.textSecondary }]} numberOfLines={3}>
          {insight.full_critique}
        </Text>

        {/* Footer Chevron */}
        <View style={styles.footerRow}>
          <View style={styles.spacer} />
          <CaretRight size={16} color={colors.textSecondary} weight="bold" />
        </View>
      </TouchableOpacity>

      {/* Full Athlete Intelligence Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.flameIconBox}>
                  <Sparkle size={18} color={colors.accent} weight="fill" />
                </View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Athlete Intelligence
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textSecondary} weight="bold" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHeadline, { color: colors.textPrimary }]}>
              {insight.summary_headline}
            </Text>

            <Text style={[styles.modalFullText, { color: colors.textSecondary }]}>
              {insight.full_critique}
            </Text>

            {/* Intensity Zones Breakdown */}
            <View style={[styles.zoneBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.zoneTitle, { color: colors.textPrimary }]}>Intensity Zones</Text>
              <View style={styles.zoneRow}>
                <Text style={[styles.zoneLabel, { color: colors.textSecondary }]}>Aerobic Zone</Text>
                <Text style={[styles.zoneValue, { color: colors.textPrimary }]}>{insight.aerobic_pct}%</Text>
              </View>
              <View style={styles.zoneRow}>
                <Text style={[styles.zoneLabel, { color: colors.textSecondary }]}>Anaerobic Zone</Text>
                <Text style={[styles.zoneValue, { color: colors.accent }]}>{insight.anaerobic_pct}%</Text>
              </View>
              <View style={styles.zoneRow}>
                <Text style={[styles.zoneLabel, { color: colors.textSecondary }]}>Pacing Strategy</Text>
                <Text style={[styles.zoneValue, { color: colors.success }]}>{insight.split_strategy || 'Even Split'}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  flameIconBox: {
    width: 24,
    height: 24,
    borderRadius: radii.xs,
    backgroundColor: 'rgba(252, 76, 2, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.heading3,
    fontSize: 14,
    fontWeight: '700',
  },
  critiqueText: {
    ...typography.bodySmall,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderWidth: borders.thin,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.heading2,
    fontWeight: '700',
  },
  modalHeadline: {
    ...typography.heading2,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  modalFullText: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  zoneBox: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
  },
  zoneTitle: {
    ...typography.heading3,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  zoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  zoneLabel: {
    ...typography.bodySmall,
  },
  zoneValue: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
});
