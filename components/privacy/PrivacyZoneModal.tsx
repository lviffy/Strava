import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Lock,
  X,
  PlusCircle,
  ShieldCheck,
  Shield,
  Trash,
} from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { PrivacyZoneDao, PrivacyZone } from '../../database/PrivacyZoneDao';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { InputText } from '../ui/InputText';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SurfaceCard } from '../ui/SurfaceCard';
import { SectionHeader } from '../ui/SectionHeader';
import { SegmentedControl } from '../ui/SegmentedControl';

interface PrivacyZoneModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const RADIUS_OPTIONS = ['200m', '500m', '1000m'];
const RADIUS_VALUES = [200, 500, 1000];

export function PrivacyZoneModal({ visible, onClose, onSaved }: PrivacyZoneModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [zones, setZones] = useState<PrivacyZone[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [radiusIndex, setRadiusIndex] = useState(1); // 500m default

  const loadZones = async () => {
    const list = await PrivacyZoneDao.getPrivacyZones();
    setZones(list);
  };

  useEffect(() => {
    if (visible) {
      loadZones();
    }
  }, [visible]);

  const handleAddZone = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Required Fields', 'Please enter a zone name (e.g. Home) and address.');
      return;
    }

    // Default coordinates in San Francisco Bay Area if arbitrary address
    const defaultLat = 37.798 + (Math.random() - 0.5) * 0.05;
    const defaultLon = -122.466 + (Math.random() - 0.5) * 0.05;

    await PrivacyZoneDao.addPrivacyZone({
      name: name.trim(),
      address: address.trim(),
      latitude: defaultLat,
      longitude: defaultLon,
      radius_meters: RADIUS_VALUES[radiusIndex],
      is_active: 1,
    });

    setName('');
    setAddress('');
    setShowAddForm(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await loadZones();
    if (onSaved) onSaved();
  };

  const handleDelete = async (id: string) => {
    await PrivacyZoneDao.deletePrivacyZone(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadZones();
    if (onSaved) onSaved();
  };

  const handleToggle = async (zone: PrivacyZone) => {
    await PrivacyZoneDao.togglePrivacyZone(zone.id, !zone.is_active);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadZones();
    if (onSaved) onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={styles.headerLeft}>
              <Lock size={20} color={colors.accent} weight="fill" style={styles.headerIcon} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy Zones</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={22} color={colors.textSecondary} weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Overview Explanation */}
            <SurfaceCard style={styles.infoCard}>
              <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                Conceal Start & End Locations
              </Text>
              <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
                Strava automatically crops activity polyline points within your designated privacy zones so others cannot see where you live or work.
              </Text>
            </SurfaceCard>

            {/* Header + Add Trigger */}
            <View style={styles.sectionRow}>
              <SectionHeader title="ACTIVE PRIVACY ZONES" />
              <TouchableOpacity
                onPress={() => setShowAddForm(!showAddForm)}
                style={styles.addTrigger}
              >
                {showAddForm ? (
                  <X size={20} color={colors.accent} weight="bold" />
                ) : (
                  <PlusCircle size={20} color={colors.accent} weight="bold" />
                )}
                <Text style={[styles.addText, { color: colors.accent }]}>
                  {showAddForm ? 'Cancel' : 'Add Zone'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Add Zone Form */}
            {showAddForm && (
              <View
                style={[
                  styles.addForm,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
                <InputText
                  label="ZONE NAME"
                  placeholder="e.g. Home, Workplace, Gym"
                  value={name}
                  onChangeText={setName}
                />
                <View style={styles.fieldSpacing}>
                  <InputText
                    label="ADDRESS OR NEIGHBORHOOD"
                    placeholder="e.g. Presidio Park, San Francisco, CA"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
                <View style={styles.fieldSpacing}>
                  <Text style={[styles.radiusLabel, { color: colors.textSecondary }]}>PRIVACY RADIUS</Text>
                  <SegmentedControl
                    options={RADIUS_OPTIONS}
                    selectedOption={RADIUS_OPTIONS[radiusIndex]}
                    onSelect={(opt) => setRadiusIndex(RADIUS_OPTIONS.indexOf(opt))}
                  />
                </View>
                <View style={styles.fieldSpacing}>
                  <Button
                    title="Create Privacy Zone"
                    variant="primary"
                    onPress={handleAddZone}
                  />
                </View>
              </View>
            )}

            {/* Zones List */}
            {zones.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No privacy zones created. Add your home or office to protect your route privacy.
              </Text>
            ) : (
              zones.map((z) => (
                <View
                  key={z.id}
                  style={[
                    styles.zoneCard,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.zoneCheck}
                    onPress={() => handleToggle(z)}
                    activeOpacity={0.7}
                  >
                    {z.is_active ? (
                      <ShieldCheck size={24} color={colors.accent} weight="fill" />
                    ) : (
                      <Shield size={24} color={colors.textMuted} weight="regular" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.zoneMain}>
                    <View style={styles.zoneHeaderRow}>
                      <Text style={[styles.zoneName, { color: colors.textPrimary }]}>{z.name}</Text>
                      <Badge
                        label={`${z.radius_meters}m Radius`}
                        variant={z.is_active ? 'warning' : 'neutral'}
                      />
                    </View>
                    <Text style={[styles.zoneAddress, { color: colors.textSecondary }]}>
                      {z.address}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(z.id)}
                    style={styles.zoneDelete}
                    activeOpacity={0.7}
                  >
                    <Trash size={18} color={colors.textMuted} weight="bold" />
                  </TouchableOpacity>
                </View>
              ))
            )}
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
  infoCard: {
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.heading3,
    marginBottom: 4,
  },
  infoDesc: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    ...typography.label,
    fontWeight: '600',
    marginLeft: 4,
  },
  addForm: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  fieldSpacing: {
    marginTop: spacing.sm,
  },
  radiusLabel: {
    ...typography.label,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  zoneCheck: {
    marginRight: spacing.md,
  },
  zoneMain: {
    flex: 1,
  },
  zoneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  zoneName: {
    ...typography.body,
    fontWeight: '600',
  },
  zoneAddress: {
    ...typography.caption,
  },
  zoneDelete: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    marginVertical: spacing.md,
  },
});
