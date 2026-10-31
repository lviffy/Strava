import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Scissors, X, Minus, Plus } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ActivityDao, LocalCoordinate } from '../../database/ActivityDao';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { Button } from '../ui/Button';
import { SurfaceCard } from '../ui/SurfaceCard';

interface CropActivityModalProps {
  visible: boolean;
  activityId: string;
  coordinates: LocalCoordinate[];
  onClose: () => void;
  onCropped: (result: { newDistanceMeters: number; newMovingTimeSeconds: number }) => void;
}

export function CropActivityModal({
  visible,
  activityId,
  coordinates,
  onClose,
  onCropped,
}: CropActivityModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const totalPoints = coordinates.length;
  const [trimStartCount, setTrimStartCount] = useState(0);
  const [trimEndCount, setTrimEndCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingPoints = Math.max(0, totalPoints - trimStartCount - trimEndCount);

  const handleAdjustStart = (delta: number) => {
    const next = Math.max(0, Math.min(totalPoints - trimEndCount - 2, trimStartCount + delta));
    setTrimStartCount(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleAdjustEnd = (delta: number) => {
    const next = Math.max(0, Math.min(totalPoints - trimStartCount - 2, trimEndCount + delta));
    setTrimEndCount(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleApplyCrop = async () => {
    if (trimStartCount === 0 && trimEndCount === 0) {
      onClose();
      return;
    }

    if (remainingPoints < 2) {
      Alert.alert('Cannot Trim', 'An activity requires at least 2 coordinate points.');
      return;
    }

    const startSeq = coordinates[trimStartCount]?.sequence_index ?? 1;
    const endSeq = coordinates[totalPoints - 1 - trimEndCount]?.sequence_index ?? coordinates[totalPoints - 1]?.sequence_index;

    setIsSubmitting(true);
    try {
      const result = await ActivityDao.trimActivity(activityId, startSeq, endSeq);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCropped(result);
      onClose();
    } catch (err: any) {
      Alert.alert('Crop Failed', err.message || 'Could not trim activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={styles.headerLeft}>
              <Scissors size={20} color={colors.accent} weight="bold" style={styles.headerIcon} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Crop Activity</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={22} color={colors.textSecondary} weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <SurfaceCard style={styles.descCard}>
              <Text style={[styles.descTitle, { color: colors.textPrimary }]}>
                Trim Inadvertent GPS Data
              </Text>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>
                Accidentally leave your watch running in the car or forget to start moving? Trim points from the start or end of your activity.
              </Text>
            </SurfaceCard>

            {/* Metric Summary */}
            <View
              style={[
                styles.summaryBox,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
            >
              <View style={styles.statCol}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalPoints}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ORIGINAL PTS</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.statCol}>
                <Text style={[styles.statValue, { color: colors.accent }]}>{remainingPoints}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>REMAINING PTS</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
              <View style={styles.statCol}>
                <Text style={[styles.statValue, { color: colors.textMuted }]}>
                  {trimStartCount + trimEndCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TRIMMED PTS</Text>
              </View>
            </View>

            {/* Trim Start Control */}
            <View style={styles.controlGroup}>
              <View style={styles.controlHeader}>
                <Text style={[styles.controlTitle, { color: colors.textPrimary }]}>TRIM START</Text>
                <Text style={[styles.controlCount, { color: colors.accent }]}>
                  {trimStartCount} points removed
                </Text>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => handleAdjustStart(-5)}
                >
                  <Text style={[styles.stepperBtnText, { color: colors.textPrimary }]}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => handleAdjustStart(-1)}
                >
                  <Minus size={18} color={colors.textPrimary} weight="bold" />
                </TouchableOpacity>
                <Text style={[styles.currentValue, { color: colors.textPrimary }]}>{trimStartCount}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => handleAdjustStart(1)}
                >
                  <Plus size={18} color={colors.textPrimary} weight="bold" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => handleAdjustStart(5)}
                >
                  <Text style={[styles.stepperBtnText, { color: colors.textPrimary }]}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Trim End Control */}
            <View style={styles.controlGroup}>
              <View style={styles.controlHeader}>
                <Text style={[styles.controlTitle, { color: colors.textPrimary }]}>TRIM END</Text>
                <Text style={[styles.controlCount, { color: colors.accent }]}>
                  {trimEndCount} points removed
                </Text>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => handleAdjustEnd(-5)}
                >
                  <Text style={[styles.stepperBtnText, { color: colors.textPrimary }]}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => handleAdjustEnd(-1)}
                >
                  <Minus size={18} color={colors.textPrimary} weight="bold" />
                </TouchableOpacity>
                <Text style={[styles.currentValue, { color: colors.textPrimary }]}>{trimEndCount}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => handleAdjustEnd(1)}
                >
                  <Plus size={18} color={colors.textPrimary} weight="bold" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  onPress={() => handleAdjustEnd(5)}
                >
                  <Text style={[styles.stepperBtnText, { color: colors.textPrimary }]}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <Button
                title={trimStartCount > 0 || trimEndCount > 0 ? 'Apply Crop & Recalculate' : 'Done'}
                variant="primary"
                isLoading={isSubmitting}
                onPress={handleApplyCrop}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.heading2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  descCard: {
    marginBottom: spacing.md,
  },
  descTitle: {
    ...typography.heading3,
    marginBottom: 4,
  },
  descText: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.heading1,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  controlGroup: {
    marginBottom: spacing.lg,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  controlTitle: {
    ...typography.label,
    letterSpacing: 0.8,
  },
  controlCount: {
    ...typography.caption,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 44,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    ...typography.label,
    fontWeight: '700',
  },
  currentValue: {
    ...typography.heading2,
    minWidth: 40,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: spacing.md,
  },
});
