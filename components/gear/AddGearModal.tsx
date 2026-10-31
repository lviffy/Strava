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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GearDao } from '../../database/GearDao';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { SegmentedControl } from '../ui/SegmentedControl';
import { InputText } from '../ui/InputText';
import { Button } from '../ui/Button';

interface AddGearModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddGearModal({ visible, onClose, onSaved }: AddGearModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [gearTypeIndex, setGearTypeIndex] = useState(0); // 0: Shoes, 1: Bike
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [nickname, setNickname] = useState('');
  const [maxDistanceKm, setMaxDistanceKm] = useState('600');
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const type = gearTypeIndex === 0 ? 'Shoes' : 'Bike';

  const handleTypeChange = (index: number) => {
    setGearTypeIndex(index);
    if (index === 0) {
      setMaxDistanceKm('600');
    } else {
      setMaxDistanceKm('5000');
    }
  };

  const handleSave = async () => {
    if (!brand.trim() || !model.trim()) {
      Alert.alert('Required Fields', 'Please enter both brand and model name.');
      return;
    }

    const maxKm = parseFloat(maxDistanceKm) || (type === 'Shoes' ? 600 : 5000);
    const displayName = nickname.trim() || `${brand.trim()} ${model.trim()}`;

    setIsSubmitting(true);
    try {
      await GearDao.addGear({
        athlete_id: 'athlete_self',
        name: displayName,
        brand: brand.trim(),
        model: model.trim(),
        type,
        max_distance_meters: maxKm * 1000,
        is_default: isDefault ? 1 : 0,
        default_sports: type === 'Shoes' ? 'Run,Walk,Hike' : 'Ride',
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
      onClose();
      // Reset form
      setBrand('');
      setModel('');
      setNickname('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add gear.');
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
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add New Gear</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Sport / Gear Type Picker */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>GEAR TYPE</Text>
            <SegmentedControl
              options={['Running Shoes', 'Bicycle']}
              selectedOption={type === 'Shoes' ? 'Running Shoes' : 'Bicycle'}
              onSelect={(opt) => handleTypeChange(opt === 'Running Shoes' ? 0 : 1)}
            />

            {/* Brand Input */}
            <View style={styles.fieldSpacing}>
              <InputText
                label="BRAND"
                placeholder={type === 'Shoes' ? 'e.g. Nike, Hoka, Saucony' : 'e.g. Specialized, Trek, Canyon'}
                value={brand}
                onChangeText={setBrand}
              />
            </View>

            {/* Model Input */}
            <View style={styles.fieldSpacing}>
              <InputText
                label="MODEL"
                placeholder={type === 'Shoes' ? 'e.g. Vaporfly 3, Clifton 9' : 'e.g. Tarmac SL8, Domane'}
                value={model}
                onChangeText={setModel}
              />
            </View>

            {/* Nickname Input */}
            <View style={styles.fieldSpacing}>
              <InputText
                label="NICKNAME (OPTIONAL)"
                placeholder="e.g. Race Day Speed, Sunday Roadie"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            {/* Target Lifespan */}
            <View style={styles.fieldSpacing}>
              <InputText
                label={`TARGET LIFESPAN (${type === 'Shoes' ? 'KM (Typically 500-800km)' : 'KM (Typically 3000-8000km)'})`}
                placeholder={type === 'Shoes' ? '600' : '5000'}
                keyboardType="numeric"
                value={maxDistanceKm}
                onChangeText={setMaxDistanceKm}
              />
            </View>

            {/* Set Default Toggle */}
            <TouchableOpacity
              style={[
                styles.toggleRow,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
              onPress={() => setIsDefault(!isDefault)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                  Set as Default {type}
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                  Automatically assigned to future {type === 'Shoes' ? 'runs and walks' : 'rides'}
                </Text>
              </View>
              <Ionicons
                name={isDefault ? 'checkbox' : 'square-outline'}
                size={24}
                color={isDefault ? colors.accent : colors.textMuted}
              />
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                title="Save Gear"
                variant="primary"
                isLoading={isSubmitting}
                onPress={handleSave}
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
  label: {
    ...typography.label,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  fieldSpacing: {
    marginTop: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  toggleDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.xl,
  },
});
