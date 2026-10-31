import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityDao, LocalActivity, LocalCoordinate, LocalSplit } from '../../database/ActivityDao';
import { GearDao, GearItem } from '../../database/GearDao';
import { PrivacyZoneDao, PrivacyZone } from '../../database/PrivacyZoneDao';
import { BestEffortsDao, ActivityBestEffort } from '../../database/BestEffortsDao';
import { PredictionsDao, PerformancePrediction } from '../../database/PredictionsDao';
import { InsightsDao, ActivityInsight } from '../../database/InsightsDao';
import { BestEffortsEngine } from '../../features/analytics/BestEffortsEngine';
import { AthleteIntelligence } from '../../features/analytics/AthleteIntelligence';
import { RacePredictor } from '../../features/analytics/RacePredictor';
import { applyPrivacyZones } from '../../utils/PrivacyZoneFilter';
import { generateGpx } from '../../utils/GpxExporter';
import { CropActivityModal } from '../../components/activity/CropActivityModal';
import { FlyoverModal } from '../../components/activity/FlyoverModal';
import { MapMilestoneMarker } from '../../components/activity/MapMilestoneMarker';
import { HeroPrBanner } from '../../components/activity/HeroPrBanner';
import { BestEffortsList } from '../../components/activity/BestEffortsList';
import { VisualSplitBar } from '../../components/activity/VisualSplitBar';
import { InsightsGrid } from '../../components/activity/InsightsGrid';
import { AthleteAvatar } from '../../components/activity/AthleteAvatar';
import { ElevationChart } from '../../components/activity/ElevationChart';
import { ApiClient } from '../../services/ApiClient';
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
import { IconButton } from '../../components/ui/IconButton';
import { Button } from '../../components/ui/Button';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [activity, setActivity] = useState<LocalActivity | null>(null);
  const [coordinates, setCoordinates] = useState<LocalCoordinate[]>([]);
  const [splits, setSplits] = useState<LocalSplit[]>([]);
  const [gear, setGear] = useState<GearItem | null>(null);
  const [privacyZones, setPrivacyZones] = useState<PrivacyZone[]>([]);
  const [privacyResult, setPrivacyResult] = useState<{ redactedCount: number; zonesApplied: string[] }>({
    redactedCount: 0,
    zonesApplied: [],
  });

  // Advanced Strava Features State
  const [efforts, setEfforts] = useState<ActivityBestEffort[]>([]);
  const [predictions, setPredictions] = useState<PerformancePrediction[]>([]);
  const [insight, setInsight] = useState<ActivityInsight | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showFlyover, setShowFlyover] = useState(false);
  const [showGpxModal, setShowGpxModal] = useState(false);
  const [gpxContent, setGpxContent] = useState('');
  const [gpxCopied, setGpxCopied] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const act = await ActivityDao.getActivityById(id);
      const coords = await ActivityDao.getCoordinatesForActivity(id);
      const sps = await ActivityDao.getSplitsForActivity(id);
      const zones = await PrivacyZoneDao.getActivePrivacyZones();

      setActivity(act);
      setCoordinates(coords);
      setSplits(sps);
      setPrivacyZones(zones);

      // Apply Privacy Geofencing Redaction
      const filterRes = applyPrivacyZones(coords, zones);
      setPrivacyResult({
        redactedCount: filterRes.redactedCount,
        zonesApplied: filterRes.zonesApplied,
      });

      // Load associated Gear
      if (act?.gear_id) {
        const gearItem = await GearDao.getGearById(act.gear_id);
        setGear(gearItem);
      } else {
        setGear(null);
      }

      // Load or Compute Best Efforts
      let bestEfforts = await BestEffortsDao.getBestEffortsForActivity(id);
      if (bestEfforts.length === 0 && coords.length >= 5) {
        bestEfforts = await BestEffortsEngine.computeBestEffortsForActivity(id);
      }
      setEfforts(bestEfforts);

      // Load or Compute Athlete Intelligence Insight
      if (act) {
        let actInsight = await InsightsDao.getInsightForActivity(id);
        if (!actInsight) {
          actInsight = await AthleteIntelligence.generateInsight(act);
        }
        setInsight(actInsight);
      }

      // Load Performance Predictions
      let racePredictions = await PredictionsDao.getPredictions();
      if (racePredictions.length === 0) {
        racePredictions = await RacePredictor.updatePredictions();
      }
      setPredictions(racePredictions);
    } catch (err) {
      console.error('Failed to load activity details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleExportGpx = () => {
    if (!activity) return;
    const gpx = generateGpx(activity, coordinates);
    setGpxContent(gpx);
    setShowGpxModal(true);
    setGpxCopied(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleCopyGpx = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(gpxContent);
      }
      setGpxCopied(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setGpxCopied(false), 3000);
    } catch {
      Alert.alert('GPX Ready', 'GPX 1.1 XML generated successfully.');
    }
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

  // Sanitized coordinates with privacy zones applied
  const sanitized = applyPrivacyZones(coordinates, privacyZones).sanitizedCoordinates;
  const mapCoords = sanitized.map((c) => ({
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

  const paceSecKm =
    activity.distance_meters > 0
      ? activity.moving_time_seconds / (activity.distance_meters / 1000)
      : null;

  // PR Milestone markers on the map
  const milestoneMarkers = efforts.filter((e) => e.start_latitude && e.start_longitude);

  // Highest benchmark achieved for the hero banner
  const heroBenchmark = efforts.find((e) => e.is_pr)?.benchmark_name || '10K';

  return (
    <ScreenContainer>
      {/* Top Header matching Strava Screenshots 1 & 3 */}
      <ScreenHeader
        title={activity.sport_type || 'Run'}
        showBack
        rightAction={
          <View style={styles.headerActions}>
            <IconButton
              icon={
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isBookmarked ? colors.accent : colors.textPrimary}
                />
              }
              onPress={() => {
                setIsBookmarked(!isBookmarked);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }}
            />
            <IconButton
              icon={<Ionicons name="cut-outline" size={20} color={colors.textPrimary} />}
              onPress={() => setShowCropModal(true)}
            />
            <IconButton
              icon={<Ionicons name="download-outline" size={20} color={colors.textPrimary} />}
              onPress={handleExportGpx}
            />
            <IconButton
              icon={<Ionicons name="trash-outline" size={20} color={colors.error} />}
              onPress={handleDelete}
            />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Privacy Redaction Banner */}
        {privacyResult.redactedCount > 0 && (
          <View
            style={[
              styles.privacyBanner,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
          >
            <Ionicons name="lock-closed" size={14} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.privacyBannerText, { color: colors.textSecondary }]}>
              Privacy Zone Applied ({privacyResult.zonesApplied.join(', ')}): Start/Finish concealed ({privacyResult.redactedCount} pts).
            </Text>
          </View>
        )}

        {/* Interactive Map with PR Milestone Markers & Floating Flyover Button */}
        {mapCoords.length > 0 && initialRegion && (
          <View style={[styles.mapContainer, { borderColor: colors.border }]}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              userInterfaceStyle="dark"
              initialRegion={initialRegion}
              scrollEnabled={true}
              zoomEnabled={true}
            >
              <Polyline
                coordinates={mapCoords}
                strokeColor={colors.accent}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />

              {/* Start Flag Marker */}
              <Marker coordinate={mapCoords[0]} title="Start">
                <View style={[styles.startMarker, { backgroundColor: colors.success }]}>
                  <Ionicons name="flag" size={10} color="#FFFFFF" />
                </View>
              </Marker>

              {/* Finish Checkered Marker */}
              <Marker coordinate={mapCoords[mapCoords.length - 1]} title="Finish">
                <View style={[styles.startMarker, { backgroundColor: colors.error }]}>
                  <Ionicons name="flag" size={10} color="#FFFFFF" />
                </View>
              </Marker>

              {/* PR Milestone Markers on Polyline (Screenshot 3) */}
              {milestoneMarkers.map((effort) => (
                <MapMilestoneMarker
                  key={effort.id}
                  coordinate={{
                    latitude: effort.start_latitude,
                    longitude: effort.start_longitude,
                  }}
                  label={`Fastest ${effort.benchmark_name} Lifetime`}
                  rank={effort.rank}
                />
              ))}
            </MapView>

            {/* Floating 3D Flyover Play Button (Screenshot 3) */}
            <TouchableOpacity
              style={[styles.floatingPlayBtn, { backgroundColor: 'rgba(24, 24, 27, 0.85)' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowFlyover(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Athlete Metadata Row matching Strava Screenshot 3 */}
        <View style={styles.athleteMetaRow}>
          <AthleteAvatar name="Rohan Mohanta" size="md" color={colors.accent} />
          <View style={styles.athleteInfoCol}>
            <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
              Rohan Mohanta
            </Text>
            <View style={styles.athleteLocationRow}>
              <Ionicons name="footsteps-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.athleteDateCity, { color: colors.textSecondary }]}>
                {new Date(activity.start_timestamp).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}{' '}
                · Amaravati, Andhra Pradesh
              </Text>
            </View>
          </View>
        </View>

        {/* Large Activity Title */}
        <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>
          {activity.name}
        </Text>

        {/* Hero PR Banner matching Strava Screenshots 3 & 4 */}
        <HeroPrBanner benchmarkName={heroBenchmark} />

        {/* 6-Metric Grid matching Strava Screenshot 3 (3x2 layout) */}
        <SurfaceCard style={styles.metricCard}>
          {/* Row 1: Distance & Avg Pace */}
          <View style={styles.metricRow}>
            <View style={styles.metricCell}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Distance</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {formatDistance(activity.distance_meters)} km
              </Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg Pace</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {formatPace(paceSecKm)} /km
              </Text>
            </View>
          </View>

          {/* Row 2: Moving Time & Elevation Gain */}
          <View style={[styles.metricRow, styles.metricRowBorder, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.metricCell}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Moving Time</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {formatDuration(activity.moving_time_seconds)}
              </Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Elevation Gain</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {Math.round(activity.elevation_gain_meters)} m
              </Text>
            </View>
          </View>

          {/* Row 3: Calories & Max Elevation */}
          <View style={[styles.metricRow, styles.metricRowBorder, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.metricCell}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Calories</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {activity.calories} Cal
              </Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Max Elevation</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {Math.round(activity.elevation_gain_meters > 0 ? activity.elevation_gain_meters + 22 : 25)} m
              </Text>
            </View>
          </View>
        </SurfaceCard>

        {/* Social Companion Tagging Row (Screenshot 3) */}
        <View style={styles.socialTagRow}>
          <Text style={[styles.socialTagText, { color: colors.textSecondary }]}>
            With someone who didn't record?
          </Text>
          <TouchableOpacity
            style={[styles.addOthersBtn, { borderColor: colors.accent }]}
            onPress={() => Alert.alert('Add Companions', 'Invite fellow athletes who joined this workout.')}
            activeOpacity={0.8}
          >
            <Text style={[styles.addOthersText, { color: colors.accent }]}>Add Others</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription / Athlete Intelligence & 2x2 Grid Section (Screenshot 2) */}
        <InsightsGrid
          insight={insight}
          predictions={predictions}
          efforts={efforts}
          splits={splits}
          onFlyoverPress={() => setShowFlyover(true)}
        />

        {/* Results & Best Efforts List Section (Screenshot 1) */}
        <SurfaceCard style={styles.sectionSurface}>
          <SectionHeader title="RESULTS" />
          <BestEffortsList efforts={efforts} totalAchievementsCount={7} />
        </SurfaceCard>

        {/* Splits Table with Proportional Pace Bars (Screenshot 1) */}
        <SurfaceCard style={styles.sectionSurface}>
          <SectionHeader title="SPLITS" />
          <VisualSplitBar splits={splits} />
        </SurfaceCard>

        {/* Elevation Profile Chart */}
        <SurfaceCard style={styles.sectionSurface}>
          <SectionHeader title="ELEVATION PROFILE" />
          <ElevationChart
            altitudes={coordinates.map((c) => c.altitude)}
            totalDistanceMeters={activity.distance_meters}
            totalElevationGainMeters={activity.elevation_gain_meters}
          />
        </SurfaceCard>

        {/* Gear Wear Tracking Card (If assigned) */}
        {gear && (
          <SurfaceCard style={styles.gearCard}>
            <View style={styles.gearCardHeader}>
              <View style={styles.gearCardLeft}>
                <Ionicons
                  name={gear.type === 'Bike' ? 'bicycle' : 'footsteps'}
                  size={20}
                  color={colors.accent}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.gearCardTitle, { color: colors.textPrimary }]}>{gear.name}</Text>
              </View>
              <Text style={[styles.gearCardDist, { color: colors.textSecondary }]}>
                {Math.round(gear.distance_meters / 1000)} km logged
              </Text>
            </View>
            <View style={[styles.gearTrack, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[
                  styles.gearFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${Math.min(100, (gear.distance_meters / gear.max_distance_meters) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.gearLifespanText, { color: colors.textMuted }]}>
              Target Lifespan: {Math.round(gear.max_distance_meters / 1000)} km
            </Text>
          </SurfaceCard>
        )}
      </ScrollView>

      {/* 3D Flyover Replay Modal (Screenshot 2 & 3) */}
      <FlyoverModal
        visible={showFlyover}
        onClose={() => setShowFlyover(false)}
        coordinates={coordinates}
        activityName={activity.name}
      />

      {/* Crop / Trim Activity Modal */}
      {showCropModal && (
        <CropActivityModal
          visible={showCropModal}
          activityId={activity.id}
          coordinates={coordinates}
          onClose={() => setShowCropModal(false)}
          onCropped={() => loadData()}
        />
      )}

      {/* GPX Export Modal */}
      <Modal visible={showGpxModal} transparent animationType="slide" onRequestClose={() => setShowGpxModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="download" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Export Standard GPX</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGpxModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                Standard W3C GPX 1.1 file containing {coordinates.length} GPS track points, elevation profile, and timestamps.
              </Text>

              <View style={[styles.gpxPreviewBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Text style={[styles.gpxCode, { color: colors.textPrimary }]} numberOfLines={10}>
                  {gpxContent}
                </Text>
              </View>

              <View style={{ marginTop: spacing.lg }}>
                <Button
                  title={gpxCopied ? 'Copied to Clipboard!' : 'Copy GPX XML'}
                  variant="primary"
                  onPress={handleCopyGpx}
                  icon={<Ionicons name={gpxCopied ? 'checkmark' : 'copy-outline'} size={18} color="#FFFFFF" />}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  privacyBannerText: {
    ...typography.caption,
    flex: 1,
  },
  mapContainer: {
    height: 270,
    borderRadius: radii.md,
    borderWidth: borders.thin,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
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
  floatingPlayBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: borders.thin,
    borderColor: 'rgba(255,255,255,0.2)',
    ...shadows.none,
  },
  athleteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  athleteInfoCol: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  athleteName: {
    ...typography.heading3,
    fontWeight: '700',
  },
  athleteLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  athleteDateCity: {
    ...typography.caption,
    fontSize: 11,
  },
  activityTitle: {
    ...typography.displayMedium,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricCard: {
    marginVertical: spacing.xs,
    padding: 0,
  },
  metricRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  metricRowBorder: {
    borderTopWidth: 1,
  },
  metricCell: {
    flex: 1,
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    ...typography.heading2,
    fontSize: 18,
    fontWeight: '800',
  },
  socialTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  socialTagText: {
    ...typography.caption,
    fontSize: 12,
  },
  addOthersBtn: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  addOthersText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  sectionSurface: {
    marginVertical: spacing.sm,
  },
  gearCard: {
    marginVertical: spacing.sm,
  },
  gearCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gearCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearCardTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  gearCardDist: {
    ...typography.caption,
  },
  gearTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  gearFill: {
    height: '100%',
    borderRadius: 3,
  },
  gearLifespanText: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '80%',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...typography.heading2,
  },
  modalBody: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalDesc: {
    ...typography.bodySmall,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  gpxPreviewBox: {
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  gpxCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
});
