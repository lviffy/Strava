import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRecordingStore, SportType } from '../../store/useRecordingStore';
import { ActivityDao } from '../../database/ActivityDao';
import { SyncManager } from '../../services/SyncManager';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../../features/recording/Calculations';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, borders, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { MetricGrid } from '../../components/activity/MetricGrid';
import { MetricItem } from '../../components/activity/MetricItem';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { InputText } from '../../components/ui/InputText';
import { Button } from '../../components/ui/Button';

const SPORTS: SportType[] = ['Run', 'Ride', 'Walk', 'Hike'];

export default function SaveActivityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

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

  const [title, setTitle] = useState(
    `${sportType} on ${new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })}`
  );
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

      // Trigger cloud synchronization in background
      SyncManager.syncPendingActivities().catch(() => {});

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
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            if (activityId) {
              await ActivityDao.discardActivity(activityId);
            }
            resetSession();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Save Activity"
        rightAction={
          <Button
            title="Discard"
            variant="ghost"
            size="sm"
            onPress={handleDiscard}
            style={{ paddingHorizontal: spacing.xs }}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map Polyline Preview */}
        {coordinates.length > 0 && (
          <View style={[styles.mapPreviewContainer, { borderColor: colors.border }]}>
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
              }}
            >
              <Polyline
                coordinates={coordinates}
                strokeColor={colors.accent}
                strokeWidth={4}
              />
            </MapView>
          </View>
        )}

        {/* Workout Performance Summary Card */}
        <SurfaceCard>
          <MetricGrid bordered={false}>
            <MetricItem
              label="Distance"
              value={formatDistance(distanceMeters)}
              unit="km"
              size="medium"
            />
            <MetricItem
              label="Moving Time"
              value={formatDuration(movingTime)}
              size="medium"
            />
          </MetricGrid>
          <MetricGrid bordered style={{ marginTop: spacing.xs }}>
            <MetricItem
              label="Avg Pace"
              value={formatPace(averagePaceSecKm)}
              unit="/km"
              size="medium"
            />
            <MetricItem
              label="Elev Gain"
              value={`+${Math.round(elevationGainMeters)}`}
              unit="m"
              size="medium"
            />
          </MetricGrid>
        </SurfaceCard>

        {/* Activity Details Form */}
        <SectionHeader title="ACTIVITY DETAILS" />

        <InputText
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Name your workout"
        />

        <View style={styles.formGroup}>
          <SectionHeader title="SPORT TYPE" />
          <SegmentedControl
            options={SPORTS}
            selectedOption={selectedSport}
            onSelect={(sport) => setSelectedSport(sport)}
          />
        </View>

        <InputText
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="How did it feel? (shoes, route, weather...)"
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        {/* Commit Action */}
        <View style={styles.actions}>
          <Button
            title="SAVE ACTIVITY"
            size="lg"
            variant="primary"
            onPress={handleSave}
            isLoading={isSaving}
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  mapPreviewContainer: {
    height: 160,
    borderRadius: radii.md,
    borderWidth: borders.thin,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.none,
  },
  mapPreview: {
    ...StyleSheet.absoluteFill,
  },
  formGroup: {
    marginBottom: spacing.xs,
  },
  textArea: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: spacing.md,
  },
});
