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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BeaconDao, BeaconContact } from '../../database/BeaconDao';
import { BeaconService } from '../../features/beacon/BeaconService';
import { useColorScheme } from '../useColorScheme';
import theme, { radii, spacing, typography, borders } from '../../constants/theme';
import { InputText } from '../ui/InputText';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SurfaceCard } from '../ui/SurfaceCard';
import { SectionHeader } from '../ui/SectionHeader';

interface BeaconModalProps {
  visible: boolean;
  onClose: () => void;
  sportType?: string;
}

export function BeaconModal({ visible, onClose, sportType = 'Run' }: BeaconModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [contacts, setContacts] = useState<BeaconContact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relation, setRelation] = useState('Partner');
  const [copied, setCopied] = useState(false);

  const session = BeaconService.getSession();
  const liveUrl = session.beaconUrl || 'https://strava.app/beacon/live/demo-athlete';

  const loadContacts = async () => {
    const list = await BeaconDao.getContacts();
    setContacts(list);
  };

  useEffect(() => {
    if (visible) {
      loadContacts();
      setCopied(false);
    }
  }, [visible]);

  const handleCopyLink = async () => {
    try {
      const msg = BeaconService.formatSafetyMessage(sportType);
      // Fallback if expo-clipboard isn't available or on web
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(msg);
      }
      setCopied(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      Alert.alert('Link Ready', `Share your safety link:\n${liveUrl}`);
    }
  };

  const handleAddContact = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('Missing Info', 'Please enter both name and contact phone number.');
      return;
    }

    await BeaconDao.addContact({
      name: name.trim(),
      phone_number: phoneNumber.trim(),
      relation: relation.trim() || 'Safety Contact',
      is_active: 1,
    });

    setName('');
    setPhoneNumber('');
    setShowAddForm(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await loadContacts();
  };

  const handleDeleteContact = async (id: string) => {
    await BeaconDao.deleteContact(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadContacts();
  };

  const handleToggleContact = async (contact: BeaconContact) => {
    await BeaconDao.toggleContact(contact.id, !contact.is_active);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadContacts();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.beaconDot, { backgroundColor: session.isActive ? colors.success : colors.accent }]} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Strava Beacon Safety</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Status Card */}
            <SurfaceCard style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
                    {session.isActive ? 'Live Tracking Active' : 'Beacon Safety Standby'}
                  </Text>
                  <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                    {session.isActive
                      ? 'Your emergency contacts can see your live GPS location.'
                      : 'Share your real-time GPS coordinates with safety contacts during your workout.'}
                  </Text>
                </View>
                <Badge
                  label={session.isActive ? 'LIVE' : 'READY'}
                  variant={session.isActive ? 'success' : 'neutral'}
                />
              </View>

              {/* Share Live Link Action */}
              <TouchableOpacity
                style={[
                  styles.copyBox,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'link-outline'}
                  size={18}
                  color={copied ? colors.success : colors.accent}
                  style={styles.copyIcon}
                />
                <Text
                  style={[
                    styles.copyText,
                    { color: copied ? colors.success : colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {copied ? 'Safety Message Copied!' : liveUrl}
                </Text>
                <Text style={[styles.copyAction, { color: colors.accent }]}>
                  {copied ? 'Copied' : 'Copy Link'}
                </Text>
              </TouchableOpacity>
            </SurfaceCard>

            {/* Emergency Contacts Section */}
            <View style={styles.sectionRow}>
              <SectionHeader title="DESIGNATED SAFETY CONTACTS" />
              <TouchableOpacity
                onPress={() => setShowAddForm(!showAddForm)}
                style={styles.addContactTrigger}
              >
                <Ionicons
                  name={showAddForm ? 'close' : 'add-circle-outline'}
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.addContactText, { color: colors.accent }]}>
                  {showAddForm ? 'Cancel' : 'Add Contact'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline Add Contact Form */}
            {showAddForm && (
              <View
                style={[
                  styles.addForm,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
                <InputText
                  label="CONTACT NAME"
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChangeText={setName}
                />
                <View style={styles.fieldSpacing}>
                  <InputText
                    label="MOBILE PHONE"
                    placeholder="e.g. +1 (555) 019-2831"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
                <View style={styles.fieldSpacing}>
                  <InputText
                    label="RELATIONSHIP"
                    placeholder="e.g. Partner, Parent, Coach"
                    value={relation}
                    onChangeText={setRelation}
                  />
                </View>
                <View style={styles.fieldSpacing}>
                  <Button
                    title="Add Safety Contact"
                    variant="primary"
                    onPress={handleAddContact}
                  />
                </View>
              </View>
            )}

            {/* Contacts List */}
            {contacts.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No safety contacts added yet. Add trusted contacts who can receive your live location.
              </Text>
            ) : (
              contacts.map((c) => (
                <View
                  key={c.id}
                  style={[
                    styles.contactCard,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.contactCheck}
                    onPress={() => handleToggleContact(c)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={c.is_active ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={c.is_active ? colors.accent : colors.textMuted}
                    />
                  </TouchableOpacity>

                  <View style={styles.contactMain}>
                    <Text style={[styles.contactName, { color: colors.textPrimary }]}>{c.name}</Text>
                    <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                      {c.phone_number} • {c.relation}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteContact(c.id)}
                    style={styles.contactDelete}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Protocol Explanation */}
            <View style={styles.footerNote}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} style={styles.shieldIcon} />
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Strava Beacon transmits encrypted, real-time GPS telemetry directly to your browser-accessible emergency stream.
              </Text>
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
  beaconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statusInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  statusTitle: {
    ...typography.heading3,
    marginBottom: 4,
  },
  statusDesc: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
  copyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  copyIcon: {
    marginRight: spacing.xs,
  },
  copyText: {
    ...typography.caption,
    flex: 1,
  },
  copyAction: {
    ...typography.label,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  addContactTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addContactText: {
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  contactCheck: {
    marginRight: spacing.md,
  },
  contactMain: {
    flex: 1,
  },
  contactName: {
    ...typography.body,
    fontWeight: '600',
  },
  contactPhone: {
    ...typography.caption,
    marginTop: 2,
  },
  contactDelete: {
    padding: spacing.xs,
  },
  emptyText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    marginVertical: spacing.md,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  shieldIcon: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  footerText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
