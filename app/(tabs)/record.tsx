import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  Flag,
  NavigationArrow,
  X,
  ShieldCheck,
  SpeakerHigh,
  SpeakerSlash,
  Play,
  Pause,
  Stop,
} from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useRecordingStore, SportType } from '../../store/useRecordingStore';
import { GpsEngine } from '../../features/recording/GpsEngine';
import { AudioCues } from '../../features/recording/AudioCues';
import { BeaconService } from '../../features/beacon/BeaconService';
import { BeaconModal } from '../../components/beacon/BeaconModal';
import {
  formatDuration,
  formatDistance,
  formatPace,
  formatSpeedKmh,
} from '../../features/recording/Calculations';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MetricGrid } from '../../components/activity/MetricGrid';
import { MetricItem } from '../../components/activity/MetricItem';

const { width } = Dimensions.get('window');
const SPORTS: SportType[] = ['Run', 'Ride', 'Walk', 'Hike'];

export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const mapRef = useRef<MapView | null>(null);

  // Dynamic safe top offset to clear device camera punch-hole and status bar
  const topFloatingOffset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0,
    44
  ) + spacing.md;

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

  const [showBeaconModal, setShowBeaconModal] = useState(false);
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(AudioCues.getConfig().enabled);

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
    let dotColor = colors.gpsLocked;
    let label = 'GPS Strong';

    if (satelliteAccuracy === null || satelliteAccuracy > 25) {
      dotColor = colors.gpsLost;
      label = 'GPS Searching';
    } else if (satelliteAccuracy > 12) {
      dotColor = colors.gpsSearching;
      label = 'GPS Fair';
    }

    return (
      <View style={[styles.gpsBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.gpsDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.gpsText, { color: colors.textPrimary }]}>{label}</Text>
      </View>
    );
  };

  return (
    <ScreenContainer safeBottom={false}>
      {/* Top Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          userInterfaceStyle="dark"
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
          {/* Selected Guide Route Polyline */}
          {selectedRoute && selectedRoute.coordinates.length > 1 && (
            <Polyline
              coordinates={selectedRoute.coordinates}
              strokeColor={colors.routeColor}
              strokeWidth={4}
              lineDashPattern={[8, 5]}
            />
          )}

          {/* Active GPS Recorded Polyline */}
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates}
              strokeColor={colors.accent}
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Start Point Marker */}
          {coordinates.length > 0 && (
            <Marker coordinate={coordinates[0]} title="Start">
              <View style={[styles.startMarker, { backgroundColor: colors.success, borderColor: '#FFFFFF' }]}>
                <Flag size={12} color="#FFFFFF" weight="fill" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Selected Route Info Banner */}
        {selectedRoute && (
          <View
            style={[
              styles.routeBanner,
              {
                top: topFloatingOffset + 46,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <NavigationArrow size={16} color={colors.routeColor} weight="fill" style={{ marginRight: 6 }} />
            <Text style={[styles.routeBannerText, { color: colors.textPrimary }]} numberOfLines={1}>
              Guide: {selectedRoute.name}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedRoute(null)}
              style={styles.routeBannerClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} weight="bold" />
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Top Controls */}
        <View style={[styles.topFloatingBar, { top: topFloatingOffset }]}>
          {renderGpsStatus()}

          {/* Sport Selector Chips (enabled only when IDLE) */}
          {status === 'IDLE' && (
            <View style={[styles.sportChips, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {SPORTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sportChip,
                    sportType === s && { backgroundColor: colors.accent },
                  ]}
                  onPress={() => setSportType(s)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sportChipText,
                      { color: sportType === s ? '#FFFFFF' : colors.textSecondary },
                      sportType === s && { fontWeight: '700' },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Top Actions: Beacon Safety & Audio Voice Cues */}
          <View style={styles.topActionGroup}>
            <TouchableOpacity
              style={[
                styles.beaconButton,
                {
                  backgroundColor: status === 'RECORDING' ? colors.success : colors.surface,
                  borderColor: status === 'RECORDING' ? colors.success : colors.border,
                },
              ]}
              onPress={() => setShowBeaconModal(true)}
              activeOpacity={0.8}
            >
              <ShieldCheck
                size={14}
                color={status === 'RECORDING' ? '#FFFFFF' : colors.accent}
                weight="fill"
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.beaconButtonText,
                  { color: status === 'RECORDING' ? '#FFFFFF' : colors.textPrimary },
                ]}
              >
                {status === 'RECORDING' ? 'BEACON' : 'BEACON'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.audioCueButton,
                {
                  backgroundColor: audioCuesEnabled ? colors.accent : colors.surface,
                  borderColor: audioCuesEnabled ? colors.accent : colors.border,
                },
              ]}
              onPress={async () => {
                const next = !audioCuesEnabled;
                AudioCues.setConfig({ enabled: next });
                setAudioCuesEnabled(next);
                if (next) {
                  await AudioCues.testSpeech();
                } else {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }
              }}
              activeOpacity={0.8}
            >
              {audioCuesEnabled ? (
                <SpeakerHigh size={14} color="#FFFFFF" weight="bold" />
              ) : (
                <SpeakerSlash size={14} color={colors.textSecondary} weight="bold" />
              )}
            </TouchableOpacity>
          </View>

          {/* Status Badge when active */}
          {status !== 'IDLE' && (
            <Badge
              label={status === 'AUTOPAUSED' ? 'AUTO-PAUSED' : status}
              variant={status === 'RECORDING' ? 'success' : 'warning'}
            />
          )}
        </View>
      </View>

      {/* Bottom Telemetry HUD Panel */}
      <View
        style={[
          styles.hudPanel,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        {/* Primary Hero Metric */}
        <View style={styles.primaryMetricContainer}>
          <MetricItem
            label={sportType === 'Ride' ? 'CURRENT SPEED' : 'CURRENT PACE'}
            value={sportType === 'Ride' ? formatSpeedKmh(currentSpeedMps) : formatPace(currentPaceSecKm)}
            unit={sportType === 'Ride' ? 'km/h' : '/km'}
            size="hero"
            align="center"
          />
        </View>

        {/* 3-Column Secondary Metrics Grid */}
        <MetricGrid bordered style={{ marginVertical: spacing.xs }}>
          <MetricItem
            label="Distance"
            value={formatDistance(distanceMeters)}
            unit="km"
            size="medium"
            align="center"
          />
          <MetricItem
            label="Moving Time"
            value={formatDuration(movingTime)}
            size="medium"
            align="center"
          />
          <MetricItem
            label="Elevation"
            value={`+${Math.round(elevationGainMeters)}`}
            unit="m"
            size="medium"
            align="center"
          />
        </MetricGrid>

        {/* Auxiliary Stats Row */}
        <View style={styles.auxRow}>
          <Text style={[styles.auxText, { color: colors.textSecondary }]}>
            Avg Pace: <Text style={{ color: colors.textPrimary, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{formatPace(averagePaceSecKm)} /km</Text>
          </Text>
          <Text style={[styles.auxText, { color: colors.textSecondary }]}>
            Elapsed: <Text style={{ color: colors.textPrimary, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{formatDuration(elapsedTime)}</Text>
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actionControls}>
          {status === 'IDLE' && (
            <Button
              title="START WORKOUT"
              size="lg"
              variant="primary"
              onPress={handleStart}
              icon={<Play size={20} color="#FFFFFF" weight="fill" />}
              style={styles.fullWidthButton}
            />
          )}

          {status === 'RECORDING' && (
            <View style={styles.buttonGroup}>
              <Button
                title="LAP"
                variant="secondary"
                size="lg"
                onPress={handleLap}
                icon={<Flag size={18} color={colors.textPrimary} weight="bold" />}
                style={styles.halfButton}
              />
              <Button
                title="PAUSE"
                variant="primary"
                size="lg"
                onPress={handlePause}
                icon={<Pause size={20} color="#FFFFFF" weight="fill" />}
                style={styles.halfButton}
              />
            </View>
          )}

          {(status === 'PAUSED' || status === 'AUTOPAUSED') && (
            <View style={styles.buttonGroup}>
              <Button
                title="RESUME"
                variant="primary"
                size="lg"
                onPress={handleResume}
                icon={<Play size={20} color="#FFFFFF" weight="fill" />}
                style={styles.halfButton}
              />
              <Button
                title="FINISH"
                variant="destructive"
                size="lg"
                onPress={handleFinish}
                icon={<Stop size={20} color="#FFFFFF" weight="fill" />}
                style={styles.halfButton}
              />
            </View>
          )}
        </View>
      </View>

      {/* Beacon Live Safety Modal */}
      <BeaconModal
        visible={showBeaconModal}
        onClose={() => setShowBeaconModal(false)}
        sportType={sportType}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  routeBanner: {
    position: 'absolute',
    top: 54,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
    ...shadows.none,
  },
  routeBannerText: {
    flex: 1,
    ...typography.caption,
    fontWeight: '700',
  },
  routeBannerClose: {
    padding: spacing.xs,
  },
  topFloatingBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    ...shadows.none,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  gpsText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  sportChips: {
    flexDirection: 'row',
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    padding: 2,
    ...shadows.none,
  },
  sportChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm - 2,
  },
  sportChipText: {
    ...typography.caption,
    fontSize: 11,
  },
  startMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  hudPanel: {
    borderTopWidth: borders.thin,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    ...shadows.none,
  },
  primaryMetricContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  auxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  auxText: {
    ...typography.caption,
  },
  actionControls: {
    marginTop: spacing.sm,
  },
  fullWidthButton: {
    width: '100%',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfButton: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
  },
  topActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  beaconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    marginRight: spacing.xs,
  },
  beaconButtonText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  audioCueButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
