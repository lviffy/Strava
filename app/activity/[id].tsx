import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ActivityDao, LocalActivity, LocalCoordinate, LocalSplit } from '../../database/ActivityDao';
import { ApiClient } from '../../services/ApiClient';
import { ElevationChart } from '../../components/activity/ElevationChart';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../../features/recording/Calculations';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Badge } from '../../components/ui/Badge';
import { MetricGrid } from '../../components/activity/MetricGrid';
import { MetricItem } from '../../components/activity/MetricItem';
import { SplitRow } from '../../components/activity/SplitRow';
import { IconButton } from '../../components/ui/IconButton';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [activity, setActivity] = useState<LocalActivity | null>(null);
  const [coordinates, setCoordinates] = useState<LocalCoordinate[]>([]);
  const [splits, setSplits] = useState<LocalSplit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const act = await ActivityDao.getActivityById(id);
        const coords = await ActivityDao.getCoordinatesForActivity(id);
        const sps = await ActivityDao.getSplitsForActivity(id);
        setActivity(act);
        setCoordinates(coords);
        setSplits(sps);
      } catch (err) {
        console.error('Failed to load activity details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await ActivityDao.deleteActivity(id);
            try {
              await ApiClient.deleteActivity(id);
            } catch {}
            router.back();
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenContainer style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </ScreenContainer>
    );
  }

  if (!activity) {
    return (
      <ScreenContainer style={styles.center}>
        <Text style={[styles.notFoundText, { color: colors.textPrimary }]}>Activity not found.</Text>
      </ScreenContainer>
    );
  }

  const mapCoords = coordinates.map((c) => ({
    latitude: c.latitude,
    longitude: c.longitude,
  }));

  const initialRegion =
    mapCoords.length > 0
      ? {
          latitude: mapCoords[0].latitude,
          longitude: mapCoords[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : undefined;

  // Compute best and slowest pace for relative split bars
  const splitPaces = splits.map((s) => s.average_pace_sec_per_unit).filter((p) => p > 0);
  const bestPace = splitPaces.length > 0 ? Math.min(...splitPaces) : 240;
  const slowestPace = splitPaces.length > 0 ? Math.max(...splitPaces) : 360;

  const paceSecKm =
    activity.distance_meters > 0
      ? activity.moving_time_seconds / (activity.distance_meters / 1000)
      : null;

  return (
    <ScreenContainer>
      <ScreenHeader
        title={activity.name}
        showBack
        rightAction={
          <IconButton
            icon={<Ionicons name="trash-outline" size={20} color={colors.error} />}
            onPress={handleDelete}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Full Map View */}
        {mapCoords.length > 0 && initialRegion && (
          <View style={[styles.mapContainer, { borderColor: colors.border }]}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={initialRegion}
              scrollEnabled={true}
              zoomEnabled={true}
            >
              <Polyline
                coordinates={mapCoords}
                strokeColor={colors.accent}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
              <Marker coordinate={mapCoords[0]} title="Start">
                <View style={[styles.startMarker, { backgroundColor: colors.success }]}>
                  <Ionicons name="flag" size={10} color="#FFFFFF" />
                </View>
              </Marker>
              <Marker coordinate={mapCoords[mapCoords.length - 1]} title="Finish">
                <View style={[styles.startMarker, { backgroundColor: colors.error }]}>
                  <Ionicons name="flag" size={10} color="#FFFFFF" />
                </View>
              </Marker>
            </MapView>
          </View>
        )}

        {/* Title and Metadata */}
        <View style={styles.titleSection}>
          <Badge label={activity.sport_type} variant="brand" style={{ marginBottom: spacing.xs }} />
          <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{activity.name}</Text>
          <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
            {new Date(activity.start_timestamp).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Core Metrics Matrix */}
        <SurfaceCard>
          <MetricGrid bordered={false}>
            <MetricItem
              label="Distance"
              value={formatDistance(activity.distance_meters)}
              unit="km"
              size="large"
            />
            <MetricItem
              label="Moving Time"
              value={formatDuration(activity.moving_time_seconds)}
              size="large"
            />
          </MetricGrid>
          <MetricGrid bordered style={{ marginTop: spacing.sm }}>
            <MetricItem
              label="Avg Pace"
              value={formatPace(paceSecKm)}
              unit="/km"
              size="medium"
            />
            <MetricItem
              label="Elev Gain"
              value={`+${Math.round(activity.elevation_gain_meters)}`}
              unit="m"
              size="medium"
            />
          </MetricGrid>
          <MetricGrid bordered={false} style={{ marginTop: spacing.xs, paddingBottom: 0 }}>
            <MetricItem
              label="Calories"
              value={activity.calories}
              unit="kcal"
              size="small"
            />
            <MetricItem
              label="Elapsed Time"
              value={formatDuration(activity.elapsed_time_seconds)}
              size="small"
            />
          </MetricGrid>
        </SurfaceCard>

        {/* Elevation Profile Chart */}
        <SurfaceCard>
          <ElevationChart
            altitudes={coordinates.map((c) => c.altitude)}
            totalDistanceMeters={activity.distance_meters}
            totalElevationGainMeters={activity.elevation_gain_meters}
          />
        </SurfaceCard>

        {/* Kilometer Splits Table */}
        {splits.length > 0 && (
          <SurfaceCard>
            <SectionHeader title="KILOMETER SPLITS" />
            {splits.map((split) => (
              <SplitRow
                key={split.split_number}
                splitNumber={split.split_number}
                paceSecondsKm={split.average_pace_sec_per_unit}
                elevationGainMeters={split.elevation_delta_meters}
                bestPaceSecKm={bestPace}
                slowestPaceSecKm={slowestPace}
              />
            ))}
          </SurfaceCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    ...typography.body,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  mapContainer: {
    height: 220,
    borderRadius: radii.md,
    borderWidth: borders.thin,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.none,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  startMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  activityTitle: {
    ...typography.displayMedium,
    marginBottom: 4,
  },
  activityDate: {
    ...typography.caption,
  },
});
