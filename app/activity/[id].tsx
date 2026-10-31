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
            await ActivityDao.discardActivity(id);
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
              initialRegion={initialRegion}>
              <Polyline
                coordinates={mapCoords}
                strokeColor={BrandColors.primary}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
              <Marker coordinate={mapCoords[0]} title="Start" pinColor="#00D084" />
              <Marker coordinate={mapCoords[mapCoords.length - 1]} title="Finish" pinColor="#FF3B30" />
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
        <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
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

        {/* Splits Section if available */}
        {splits.length > 0 && (
          <View style={styles.splitsSection}>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>Splits (Kilometers)</Text>
            {splits.map((split) => (
              <View
                key={split.split_number}
                style={[styles.splitRow, { borderBottomColor: theme.cardBorder }]}>
                <Text style={[styles.splitNumber, { color: theme.text }]}>{split.split_number}</Text>
                <Text style={[styles.splitPace, { color: theme.text }]}>
                  {formatPace(split.average_pace_sec_per_unit)} /km
                </Text>
                <Text style={[styles.splitElevation, { color: theme.textSecondary }]}>
                  {split.elevation_delta_meters > 0 ? `+${Math.round(split.elevation_delta_meters)}m` : '-'}
                </Text>
              </View>
            ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mapContainer: {
    height: 260,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  titleSection: {
    padding: 20,
    paddingBottom: 12,
  },
  sportBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  sportBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activityTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
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
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '500',
  },
  splitsSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  splitNumber: {
    fontSize: 16,
    fontWeight: '700',
    width: 40,
  },
  splitPace: {
    fontSize: 16,
    fontWeight: '600',
  },
  splitElevation: {
    fontSize: 14,
  },
});
