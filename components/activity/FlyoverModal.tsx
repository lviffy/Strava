import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { X, AirplaneTilt, Play, Pause, ArrowCounterClockwise } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { LocalCoordinate } from '../../database/ActivityDao';
import { formatDuration, formatDistance, formatSpeedKmh } from '../../features/recording/Calculations';
import { useColorScheme } from '../useColorScheme';
import theme, { spacing, typography, radii, borders, shadows } from '../../constants/theme';

interface FlyoverModalProps {
  visible: boolean;
  onClose: () => void;
  coordinates: LocalCoordinate[];
  activityName: string;
}

const { width } = Dimensions.get('window');

export function FlyoverModal({
  visible,
  onClose,
  coordinates,
  activityName,
}: FlyoverModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const mapRef = useRef<MapView | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2); // 1x, 2x, 5x
  const [currentIndex, setCurrentIndex] = useState(0);

  // Playback timer loop
  useEffect(() => {
    let interval: any = null;
    if (visible && isPlaying && coordinates.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + playbackSpeed;
          if (next >= coordinates.length - 1) {
            setIsPlaying(false);
            return coordinates.length - 1;
          }

          // Center map on moving dot
          if (mapRef.current && coordinates[next]) {
            mapRef.current.animateCamera(
              {
                center: {
                  latitude: coordinates[next].latitude,
                  longitude: coordinates[next].longitude,
                },
                pitch: 45, // 3D tilt for flyover feel
                zoom: 16,
              },
              { duration: 300 }
            );
          }

          return next;
        });
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, isPlaying, playbackSpeed, coordinates]);

  if (!visible || !coordinates || coordinates.length < 2) return null;

  const currentCoord = coordinates[currentIndex] || coordinates[0];
  const progressPct = Math.round((currentIndex / (coordinates.length - 1)) * 100);

  const togglePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (currentIndex >= coordinates.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const cycleSpeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (playbackSpeed === 1) setPlaybackSpeed(2);
    else if (playbackSpeed === 2) setPlaybackSpeed(5);
    else setPlaybackSpeed(1);
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Fullscreen 3D Map */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          mapType="hybrid"
          initialCamera={{
            center: {
              latitude: coordinates[0].latitude,
              longitude: coordinates[0].longitude,
            },
            pitch: 45,
            heading: 0,
            altitude: 1000,
            zoom: 16,
          }}
        >
          {/* Full Track Polyline */}
          <Polyline
            coordinates={coordinates.map((c) => ({
              latitude: c.latitude,
              longitude: c.longitude,
            }))}
            strokeColor={colors.accent}
            strokeWidth={4}
          />

          {/* Current Moving Athlete Dot */}
          <Marker
            coordinate={{
              latitude: currentCoord.latitude,
              longitude: currentCoord.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.athleteDot, { backgroundColor: colors.routeColor, borderColor: '#FFFFFF' }]} />
          </Marker>
        </MapView>

        {/* Top Floating Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <X size={22} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>
          <View style={[styles.titleBadge, { backgroundColor: colors.surface }]}>
            <AirplaneTilt size={14} color={colors.accent} weight="fill" style={{ marginRight: 6 }} />
            <Text style={[styles.titleText, { color: colors.textPrimary }]} numberOfLines={1}>
              Flyover: {activityName}
            </Text>
          </View>
        </View>

        {/* Bottom Playback HUD */}
        <View style={[styles.bottomHud, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: colors.accent }]} />
          </View>

          {/* Telemetry Stats Row */}
          <View style={styles.telemetryRow}>
            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>SPEED</Text>
              <Text style={[styles.telemetryValue, { color: colors.textPrimary }]}>
                {formatSpeedKmh(currentCoord.speed ?? 0)} km/h
              </Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>PROGRESS</Text>
              <Text style={[styles.telemetryValue, { color: colors.textPrimary }]}>
                {progressPct}%
              </Text>
            </View>
          </View>

          {/* Controls Row */}
          <View style={styles.controlsRow}>
            {/* Speed Multiplier Button */}
            <TouchableOpacity
              style={[styles.speedBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={cycleSpeed}
            >
              <Text style={[styles.speedBtnText, { color: colors.textPrimary }]}>{playbackSpeed}x</Text>
            </TouchableOpacity>

            {/* Main Play/Pause Button */}
            <TouchableOpacity
              style={[styles.mainPlayBtn, { backgroundColor: colors.accent }]}
              onPress={togglePlay}
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause size={24} color="#FFFFFF" weight="fill" />
              ) : (
                <Play size={24} color="#FFFFFF" weight="fill" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            {/* Restart Button */}
            <TouchableOpacity
              style={[styles.speedBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={() => {
                setCurrentIndex(0);
                setIsPlaying(true);
              }}
            >
              <ArrowCounterClockwise size={16} color={colors.textPrimary} weight="bold" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  athleteDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    ...shadows.none,
  },
  titleBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    ...shadows.none,
  },
  titleText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  bottomHud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: borders.thin,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    ...shadows.none,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  telemetryItem: {
    alignItems: 'center',
  },
  telemetryLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  telemetryValue: {
    ...typography.heading2,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: borders.thin,
    marginHorizontal: spacing.lg,
  },
  speedBtnText: {
    ...typography.caption,
    fontWeight: '700',
  },
  mainPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.none,
  },
});
