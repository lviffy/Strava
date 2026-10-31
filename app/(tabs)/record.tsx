import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useRecordingStore, SportType } from '../../store/useRecordingStore';
import { GpsEngine } from '../../features/recording/GpsEngine';
import {
  formatDuration,
  formatDistance,
  formatPace,
  formatSpeedKmh,
} from '../../features/recording/Calculations';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

const { width } = Dimensions.get('window');

const SPORTS: SportType[] = ['Run', 'Ride', 'Walk', 'Hike'];

export default function RecordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const mapRef = useRef<MapView | null>(null);

  const {
    status,
    activityId,
    sportType,
    elapsedTime,
    movingTime,
    distanceMeters,
    elevationGainMeters,
    currentPaceSecKm,
    averagePaceSecKm,
    currentSpeedMps,
    satelliteAccuracy,
    currentLocation,
    coordinates,
    selectedRoute,
    setSelectedRoute,
    setSportType,
  } = useRecordingStore();

  // Auto center map on current location fix
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  const handleStart = async () => {
    try {
      const newId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await GpsEngine.startRecording(newId);
    } catch (err: any) {
      Alert.alert(
        'Location Permission Required',
        err.message || 'Please enable GPS location to record workouts.'
      );
    }
  };

  const handlePause = async () => {
    await GpsEngine.pauseRecording();
  };

  const handleResume = async () => {
    await GpsEngine.resumeRecording();
  };

  const handleLap = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const km = formatDistance(distanceMeters);
      const pace = formatPace(currentPaceSecKm);
      Speech.speak(`Manual lap at ${km} kilometers. Pace ${pace}.`, {
        language: 'en-US',
        rate: 1.0,
      });
    } catch {}
  };

  const handleFinish = async () => {
    if (distanceMeters < 20) {
      Alert.alert(
        'Discard Short Workout?',
        'This workout is under 20 meters. Would you like to discard it or save?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              if (activityId) await GpsEngine.discardRecording(activityId);
            },
          },
          {
            text: 'Save',
            onPress: async () => {
              await GpsEngine.stopRecording();
              router.push('/activity/save');
            },
          },
        ]
      );
      return;
    }

    await GpsEngine.stopRecording();
    router.push('/activity/save');
  };

  // Satellite Accuracy Indicator
  const renderGpsStatus = () => {
    let color = BrandColors.gpsGreen;
    let label = 'GPS Strong';

    if (satelliteAccuracy === null || satelliteAccuracy > 25) {
      color = BrandColors.gpsRed;
      label = 'GPS Searching';
    } else if (satelliteAccuracy > 12) {
      color = BrandColors.gpsYellow;
      label = 'GPS Fair';
    }

    return (
      <View style={[styles.gpsBadge, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
        <View style={[styles.gpsDot, { backgroundColor: color }]} />
        <Text style={styles.gpsText}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Top Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          showsUserLocation={true}
          followsUserLocation={true}
          showsCompass={true}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: currentLocation?.latitude || 37.7749,
            longitude: currentLocation?.longitude || -122.4194,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
        >
          {/* Selected Guide Route Polyline (Overlaid underneath live recording) */}
          {selectedRoute && selectedRoute.coordinates.length > 1 && (
            <Polyline
              coordinates={selectedRoute.coordinates}
              strokeColor="#007AFF"
              strokeWidth={5}
              lineDashPattern={[8, 5]}
            />
          )}

          {/* Active GPS Recorded Polyline */}
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates}
              strokeColor={BrandColors.primary}
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Start Point Marker */}
          {coordinates.length > 0 && (
            <Marker coordinate={coordinates[0]} title="Start">
              <View style={styles.startMarker}>
                <Ionicons name="flag" size={14} color="#FFFFFF" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Selected Route Info Pill Banner */}
        {selectedRoute && (
          <View style={styles.routeBanner}>
            <Ionicons name="navigate" size={14} color="#007AFF" style={{ marginRight: 6 }} />
            <Text style={styles.routeBannerText} numberOfLines={1}>
              Guide: {selectedRoute.name}
            </Text>
            <TouchableOpacity onPress={() => setSelectedRoute(null)} style={styles.routeBannerClose}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Top Controls */}
        <View style={styles.topFloatingBar}>
          {renderGpsStatus()}

          {/* Sport Selector Pills (enabled only when IDLE) */}
          {status === 'IDLE' && (
            <View style={styles.sportPills}>
              {SPORTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sportButton,
                    sportType === s && { backgroundColor: BrandColors.primary },
                  ]}
                  onPress={() => setSportType(s)}
                >
                  <Text
                    style={[
                      styles.sportButtonText,
                      sportType === s && { color: '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Status Badge when not IDLE */}
          {status !== 'IDLE' && (
            <View
              style={[
                styles.statusBadge,
                status === 'RECORDING' && { backgroundColor: BrandColors.gpsGreen },
                (status === 'PAUSED' || status === 'AUTOPAUSED') && {
                  backgroundColor: BrandColors.gpsYellow,
                },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {status === 'AUTOPAUSED' ? 'AUTO-PAUSED' : status}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom HUD Metrics Panel */}
      <View style={[styles.hudPanel, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {/* Big Primary Metric: Pace (for Run/Walk) or Speed (for Ride) */}
        <View style={styles.primaryMetricContainer}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            {sportType === 'Ride' ? 'CURRENT SPEED' : 'CURRENT PACE'}
          </Text>
          <Text style={[styles.primaryMetricValue, { color: theme.text }]}>
            {sportType === 'Ride' ? formatSpeedKmh(currentSpeedMps) : formatPace(currentPaceSecKm)}
          </Text>
          <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>
            {sportType === 'Ride' ? 'km/h' : '/km'}
          </Text>
        </View>

        {/* 3-Column Secondary Metric Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>DISTANCE</Text>
            <Text style={[styles.secondaryMetricValue, { color: theme.text }]}>
              {formatDistance(distanceMeters)}
            </Text>
            <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>km</Text>
          </View>

          <View style={[styles.metricColumn, styles.metricDivider, { borderColor: theme.cardBorder }]}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>TIME</Text>
            <Text style={[styles.secondaryMetricValue, { color: theme.text }]}>
              {formatDuration(movingTime)}
            </Text>
            <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>moving</Text>
          </View>

          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>ELEVATION</Text>
            <Text style={[styles.secondaryMetricValue, { color: theme.text }]}>
              {Math.round(elevationGainMeters)}
            </Text>
            <Text style={[styles.metricUnit, { color: theme.textSecondary }]}>m</Text>
          </View>
        </View>

        {/* Additional Info / Avg Pace */}
        <View style={styles.subMetricRow}>
          <Text style={[styles.subMetricText, { color: theme.textSecondary }]}>
            Avg Pace: <Text style={{ color: theme.text, fontWeight: '700' }}>{formatPace(averagePaceSecKm)} /km</Text>
          </Text>
          <Text style={[styles.subMetricText, { color: theme.textSecondary }]}>
            Elapsed: <Text style={{ color: theme.text, fontWeight: '700' }}>{formatDuration(elapsedTime)}</Text>
          </Text>
        </View>

        {/* Control Action Buttons */}
        <View style={styles.actionButtonContainer}>
          {status === 'IDLE' && (
            <TouchableOpacity style={styles.bigStartButton} onPress={handleStart} activeOpacity={0.8}>
              <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>
          )}

          {status === 'RECORDING' && (
            <View style={styles.recordingControlsRow}>
              <TouchableOpacity style={styles.lapButton} onPress={handleLap} activeOpacity={0.8}>
                <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
                <Text style={styles.lapButtonText}>LAP</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pauseButton} onPress={handlePause} activeOpacity={0.8}>
                <Ionicons name="pause" size={26} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>PAUSE</Text>
              </TouchableOpacity>
            </View>
          )}

          {(status === 'PAUSED' || status === 'AUTOPAUSED') && (
            <View style={styles.pausedControlsRow}>
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume} activeOpacity={0.8}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>RESUME</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.finishButton} onPress={handleFinish} activeOpacity={0.8}>
                <Ionicons name="stop" size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>FINISH</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  routeBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  routeBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  routeBannerClose: {
    padding: 4,
  },
  topFloatingBar: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  gpsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sportPills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 20,
    padding: 4,
  },
  sportButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  sportButtonText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  startMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  hudPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  primaryMetricContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  primaryMetricValue: {
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 60,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(150,150,150,0.15)',
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  secondaryMetricValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  subMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 14,
  },
  subMetricText: {
    fontSize: 12,
  },
  actionButtonContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  bigStartButton: {
    width: width - 40,
    height: 60,
    borderRadius: 30,
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 8,
  },
  recordingControlsRow: {
    flexDirection: 'row',
    width: width - 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lapButton: {
    width: '32%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3A3A3C',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lapButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  pauseButton: {
    width: '64%',
    height: 54,
    borderRadius: 27,
    backgroundColor: BrandColors.gpsYellow,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedControlsRow: {
    flexDirection: 'row',
    width: width - 40,
    justifyContent: 'space-between',
  },
  resumeButton: {
    width: '48%',
    height: 54,
    borderRadius: 27,
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButton: {
    width: '48%',
    height: 54,
    borderRadius: 27,
    backgroundColor: BrandColors.gpsRed,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 6,
  },
});
