import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const { width, height } = Dimensions.get('window');

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
      Alert.alert('Location Permission Required', err.message || 'Please enable GPS location to record workouts.');
    }
  };

  const handlePause = async () => {
    await GpsEngine.pauseRecording();
  };

  const handleResume = async () => {
    await GpsEngine.resumeRecording();
  };

  const handleFinish = async () => {
    if (distanceMeters < 20) {
      Alert.alert(
        'Discard Short Workout?',
        'This workout is under 20 meters. Would you like to discard it or save?',
        [
          { text: 'Discard', style: 'destructive', onPress: async () => {
            if (activityId) await GpsEngine.discardRecording(activityId);
          }},
          { text: 'Save', onPress: async () => {
            await GpsEngine.stopRecording();
            router.push('/activity/save');
          }},
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
      <View style={[styles.gpsBadge, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.gpsDot, { backgroundColor: color }]} />
        <Text style={styles.gpsText}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

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
          }}>
          {/* Active GPS Polyline */}
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates}
              strokeColor={BrandColors.primary}
              strokeWidth={5}
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
                  onPress={() => setSportType(s)}>
                  <Text
                    style={[
                      styles.sportButtonText,
                      sportType === s && { color: '#FFFFFF', fontWeight: '700' },
                    ]}>
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
              ]}>
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
            <TouchableOpacity style={styles.pauseButton} onPress={handlePause} activeOpacity={0.8}>
              <Ionicons name="pause" size={28} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>PAUSE</Text>
            </TouchableOpacity>
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
  topFloatingBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    fontSize: 12,
    fontWeight: '600',
  },
  sportPills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    padding: 3,
  },
  sportButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  sportButtonText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  startMarker: {
    backgroundColor: '#00D084',
    padding: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  hudPanel: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  primaryMetricContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  primaryMetricValue: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
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
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 2,
  },
  subMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  subMetricText: {
    fontSize: 13,
  },
  actionButtonContainer: {
    marginTop: 6,
    alignItems: 'center',
  },
  bigStartButton: {
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 48,
    height: 58,
    borderRadius: 29,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 6,
  },
  pauseButton: {
    backgroundColor: BrandColors.gpsYellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 48,
    height: 58,
    borderRadius: 29,
  },
  pausedControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width - 48,
  },
  resumeButton: {
    backgroundColor: BrandColors.gpsGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 56,
    borderRadius: 28,
    marginRight: 10,
  },
  finishButton: {
    backgroundColor: BrandColors.gpsRed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 56,
    borderRadius: 28,
    marginLeft: 10,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
});
