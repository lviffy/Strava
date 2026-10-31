import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRecordingStore, SportType } from '../../store/useRecordingStore';
import { ActivityDao } from '../../database/ActivityDao';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../../features/recording/Calculations';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

const SPORTS: SportType[] = ['Run', 'Ride', 'Walk', 'Hike'];

export default function SaveActivityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

  const {
    activityId,
    sportType,
    movingTime,
    distanceMeters,
    elevationGainMeters,
    averagePaceSecKm,
    calories,
    coordinates,
    resetSession,
  } = useRecordingStore();

  const [title, setTitle] = useState(`${sportType} on ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`);
  const [description, setDescription] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType>(sportType);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!activityId) return;

    setIsSaving(true);
    try {
      await ActivityDao.finalizeActivity(
        activityId,
        title.trim() || 'My Activity',
        selectedSport,
        Date.now(),
        calories
      );

      resetSession();
      router.replace('/(tabs)/you');
    } catch (err: any) {
      Alert.alert('Error Saving Workout', err.message || 'Could not commit activity to local storage.');
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Workout?',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (activityId) {
              await ActivityDao.discardActivity(activityId);
            }
            resetSession();
            router.replace('/(tabs)/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Save Activity</Text>
          <TouchableOpacity onPress={handleDiscard}>
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
        </View>

        {/* Map Polyline Preview */}
        {coordinates.length > 0 && (
          <View style={styles.mapPreviewContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.mapPreview}
              scrollEnabled={false}
              zoomEnabled={false}
              initialRegion={{
                latitude: coordinates[0].latitude,
                longitude: coordinates[0].longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}>
              <Polyline
                coordinates={coordinates}
                strokeColor={BrandColors.primary}
                strokeWidth={4}
              />
            </MapView>
          </View>
        )}

        {/* Summary Stat Cards */}
        <View style={[styles.statsSummaryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.summaryStatItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Distance</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatDistance(distanceMeters)} <Text style={styles.unitText}>km</Text>
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Time</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatDuration(movingTime)}
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Pace</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatPace(averagePaceSecKm)} <Text style={styles.unitText}>/km</Text>
            </Text>
          </View>

          <View style={styles.summaryStatItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Elevation</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {Math.round(elevationGainMeters)} <Text style={styles.unitText}>m</Text>
            </Text>
          </View>
        </View>

        {/* Form Inputs */}
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>TITLE</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.cardBorder }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Name your workout"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>SPORT</Text>
          <View style={styles.sportSelectorRow}>
            {SPORTS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sportPill,
                  { borderColor: theme.cardBorder },
                  selectedSport === s && { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary },
                ]}
                onPress={() => setSelectedSport(s)}>
                <Text
                  style={[
                    styles.sportPillText,
                    { color: theme.text },
                    selectedSport === s && { color: '#FFFFFF', fontWeight: '700' },
                  ]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>DESCRIPTION</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.cardBorder },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="How did it feel? (shoes, route, weather...)"
            placeholderTextColor="#888"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}>
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Activity'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  discardText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  mapPreviewContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapPreview: {
    ...StyleSheet.absoluteFill,
  },
  statsSummaryCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryStatItem: {
    width: '50%',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  sportSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sportPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  sportPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    marginTop: 10,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
