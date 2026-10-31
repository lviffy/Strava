import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
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
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

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
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
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
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Activity not found.</Text>
      </View>
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

  // Compute average pace for comparative split bars
  const avgPaceSec =
    splits.length > 0
      ? splits.reduce((acc, s) => acc + s.average_pace_sec_per_unit, 0) / splits.length
      : 300;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1}>
          {activity.name}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Full interactive Map */}
        {mapCoords.length > 0 && initialRegion && (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={initialRegion}
            >
              <Polyline
                coordinates={mapCoords}
                strokeColor={BrandColors.primary}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
              <Marker coordinate={mapCoords[0]} title="Start" pinColor="#00D084" />
              <Marker
                coordinate={mapCoords[mapCoords.length - 1]}
                title="Finish"
                pinColor="#FF3B30"
              />
            </MapView>
          </View>
        )}

        {/* Title and Date */}
        <View style={styles.titleSection}>
          <View style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>{activity.sport_type.toUpperCase()}</Text>
          </View>
          <Text style={[styles.activityTitle, { color: theme.text }]}>{activity.name}</Text>
          <Text style={[styles.activityDate, { color: theme.textSecondary }]}>
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

        {/* Core Metric Grid */}
        <View
          style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        >
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Distance</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {formatDistance(activity.distance_meters)} <Text style={styles.statUnit}>km</Text>
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Moving Time</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {formatDuration(activity.moving_time_seconds)}
              </Text>
            </View>
          </View>

          <View style={[styles.metricRow, { marginTop: 16 }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Pace</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {formatPace(
                  activity.distance_meters > 0
                    ? activity.moving_time_seconds / (activity.distance_meters / 1000)
                    : null
                )}{' '}
                <Text style={styles.statUnit}>/km</Text>
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Elevation Gain</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {Math.round(activity.elevation_gain_meters)} <Text style={styles.statUnit}>m</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.metricRow, { marginTop: 16 }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Calories</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {activity.calories} <Text style={styles.statUnit}>kcal</Text>
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Elapsed Time</Text>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {formatDuration(activity.elapsed_time_seconds)}
              </Text>
            </View>
          </View>
        </View>

        {/* Interactive Elevation Profile Chart */}
        <View
          style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        >
          <ElevationChart
            altitudes={coordinates.map((c) => c.altitude)}
            totalDistanceMeters={activity.distance_meters}
            totalElevationGainMeters={activity.elevation_gain_meters}
          />
        </View>

        {/* Splits Section with Comparative Bars */}
        {splits.length > 0 && (
          <View style={styles.splitsSection}>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>Splits (Kilometers)</Text>
            {splits.map((split) => {
              const isFaster = split.average_pace_sec_per_unit <= avgPaceSec;
              const ratio = Math.min(
                100,
                Math.max(20, Math.round((avgPaceSec / split.average_pace_sec_per_unit) * 60))
              );

              return (
                <View
                  key={split.split_number}
                  style={[styles.splitRow, { borderBottomColor: theme.cardBorder }]}
                >
                  <Text style={[styles.splitNumber, { color: theme.text }]}>
                    {split.split_number}
                  </Text>

                  {/* Comparative Pace Bar */}
                  <View style={styles.splitBarTrack}>
                    <View
                      style={[
                        styles.splitBarFill,
                        {
                          width: `${ratio}%`,
                          backgroundColor: isFaster ? '#34C759' : '#8E8E93',
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.splitPace, { color: theme.text }]}>
                    {formatPace(split.average_pace_sec_per_unit)} /km
                  </Text>
                  <Text style={[styles.splitElevation, { color: theme.textSecondary }]}>
                    {split.elevation_delta_meters > 0
                      ? `+${Math.round(split.elevation_delta_meters)}m`
                      : '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 6,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  deleteButton: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mapContainer: {
    height: 240,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sportBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(252, 82, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  sportBadgeText: {
    color: BrandColors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  activityTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 13,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '500',
  },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  splitsSection: {
    marginHorizontal: 16,
    marginTop: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  splitNumber: {
    fontSize: 14,
    fontWeight: '700',
    width: 28,
  },
  splitBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(150,150,150,0.15)',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  splitBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  splitPace: {
    fontSize: 13,
    fontWeight: '700',
    width: 80,
    textAlign: 'right',
  },
  splitElevation: {
    fontSize: 12,
    width: 50,
    textAlign: 'right',
  },
});
