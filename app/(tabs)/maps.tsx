import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Bicycle, Footprints, NavigationArrow } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../../services/ApiClient';
import { useRecordingStore, SportType } from '../../store/useRecordingStore';
import { useColorScheme } from '../../components/useColorScheme';
import theme, { radii, spacing, typography, borders, shadows } from '../../constants/theme';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SegmentedControl } from '../../components/ui/SegmentedControl';

export interface RouteItem {
  id: string;
  name: string;
  sportType: SportType;
  distanceKm: number;
  elevationGainM: number;
  estTime: string;
  surface: string;
  coordinates: { latitude: number; longitude: number }[];
}

const FALLBACK_ROUTES: RouteItem[] = [
  {
    id: 'r_1',
    name: 'Presidio Coastal Bluffs Trail',
    sportType: 'Run',
    distanceKm: 7.4,
    elevationGainM: 145,
    estTime: '42 min',
    surface: 'Dirt & Paved',
    coordinates: [
      { latitude: 37.798, longitude: -122.466 },
      { latitude: 37.801, longitude: -122.471 },
      { latitude: 37.804, longitude: -122.475 },
      { latitude: 37.802, longitude: -122.479 },
      { latitude: 37.796, longitude: -122.474 },
      { latitude: 37.798, longitude: -122.466 },
    ],
  },
  {
    id: 'r_2',
    name: 'Twin Peaks Summit Climb',
    sportType: 'Ride',
    distanceKm: 14.8,
    elevationGainM: 380,
    estTime: '55 min',
    surface: 'Paved Road',
    coordinates: [
      { latitude: 37.760, longitude: -122.435 },
      { latitude: 37.755, longitude: -122.442 },
      { latitude: 37.752, longitude: -122.447 },
      { latitude: 37.754, longitude: -122.450 },
      { latitude: 37.760, longitude: -122.435 },
    ],
  },
  {
    id: 'r_3',
    name: 'Lands End Coastal Path',
    sportType: 'Hike',
    distanceKm: 5.2,
    elevationGainM: 95,
    estTime: '1 hr 15 min',
    surface: 'Gravel & Stairs',
    coordinates: [
      { latitude: 37.779, longitude: -122.508 },
      { latitude: 37.784, longitude: -122.505 },
      { latitude: 37.787, longitude: -122.501 },
      { latitude: 37.783, longitude: -122.504 },
      { latitude: 37.779, longitude: -122.508 },
    ],
  },
];

const FILTER_SPORTS = ['All', 'Run', 'Ride', 'Hike'] as const;
type FilterSportType = typeof FILTER_SPORTS[number];

export default function MapsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];
  const mapRef = useRef<MapView | null>(null);

  const { setSelectedRoute: setGlobalSelectedRoute } = useRecordingStore();

  const [routes, setRoutes] = useState<RouteItem[]>(FALLBACK_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem>(FALLBACK_ROUTES[0]);
  const [filterSport, setFilterSport] = useState<FilterSportType>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch routes and nearby segments from PostGIS backend
  const fetchNearbySegments = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const sportParam = filterSport !== 'All' ? filterSport : undefined;
      const [segmentsRes, routesRes] = await Promise.allSettled([
        ApiClient.getNearbySegments(lat, lng, 20000, sportParam),
        ApiClient.getRoutes(sportParam),
      ]);

      const combinedRoutes: RouteItem[] = [];

      // 1. Add cloud routes
      if (routesRes.status === 'fulfilled' && routesRes.value?.routes && routesRes.value.routes.length > 0) {
        routesRes.value.routes.forEach((r: any) => {
          combinedRoutes.push({
            id: r.id,
            name: r.name,
            sportType: (r.sportType as SportType) || 'Run',
            distanceKm: r.distanceKm || 5.0,
            elevationGainM: r.elevationGainM || 120,
            estTime: r.estTime || '35 min',
            surface: r.surface || 'Paved Road',
            coordinates: FALLBACK_ROUTES[0].coordinates,
          });
        });
      }

      // 2. Add PostGIS segments
      if (segmentsRes.status === 'fulfilled' && segmentsRes.value?.segments && segmentsRes.value.segments.length > 0) {
        segmentsRes.value.segments.forEach((s: any) => {
          const coords = [
            { latitude: s.startLatitude, longitude: s.startLongitude },
            {
              latitude: (s.startLatitude + s.endLatitude) / 2 + 0.002,
              longitude: (s.startLongitude + s.endLongitude) / 2 + 0.001,
            },
            { latitude: s.endLatitude, longitude: s.endLongitude },
          ];

          const distKm = s.distanceMeters ? +(s.distanceMeters / 1000).toFixed(1) : 3.5;
          const avgPaceMin = s.sportType === 'Ride' ? 2.5 : 5.5;
          const estMin = Math.round(distKm * avgPaceMin);

          combinedRoutes.push({
            id: s.id,
            name: s.name,
            sportType: (s.sportType as SportType) || 'Run',
            distanceKm: distKm,
            elevationGainM: s.elevationGainMeters || 45,
            estTime: `${estMin} min`,
            surface: 'Paved & Trail',
            coordinates: coords,
          });
        });
      }

      if (combinedRoutes.length > 0) {
        setRoutes(combinedRoutes);
        setSelectedRoute(combinedRoutes[0]);
      }
    } catch {
      // Use fallback routes if offline
    } finally {
      setIsLoading(false);
    }
  }, [filterSport]);

  useEffect(() => {
    fetchNearbySegments(37.78, -122.44);
  }, [fetchNearbySegments]);

  const handleSelectRoute = (route: RouteItem) => {
    setSelectedRoute(route);
    try {
      Haptics.selectionAsync();
    } catch {}

    if (mapRef.current && route.coordinates.length > 0) {
      mapRef.current.animateToRegion({
        latitude: route.coordinates[0].latitude,
        longitude: route.coordinates[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleStartWithRoute = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setGlobalSelectedRoute({
      id: selectedRoute.id,
      name: selectedRoute.name,
      sportType: selectedRoute.sportType,
      coordinates: selectedRoute.coordinates,
    });

    router.push('/(tabs)/record');
  };

  const filteredRoutes =
    filterSport === 'All'
      ? routes
      : routes.filter((r) => r.sportType === filterSport);

  return (
    <ScreenContainer safeBottom={false}>
      {/* Top Filter Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.segmentWrapper}>
          <SegmentedControl
            options={FILTER_SPORTS as unknown as string[]}
            selectedOption={filterSport}
            onSelect={(sport) => setFilterSport(sport as FilterSportType)}
          />
        </View>
        {isLoading && (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: spacing.sm }} />
        )}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          userInterfaceStyle="dark"
          initialRegion={{
            latitude: 37.78,
            longitude: -122.45,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {/* Active selected route polyline */}
          {selectedRoute && (
            <Polyline
              coordinates={selectedRoute.coordinates}
              strokeColor={colors.accent}
              strokeWidth={5}
            />
          )}

          {/* Markers for routes */}
          {filteredRoutes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            return (
              <Marker
                key={route.id}
                coordinate={route.coordinates[0]}
                onPress={() => handleSelectRoute(route)}
              >
                <View
                  style={[
                    styles.routePin,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.surface : colors.border,
                    },
                    shadows.none,
                  ]}
                >
                  {route.sportType === 'Ride' ? (
                    <Bicycle
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textPrimary}
                      weight="bold"
                    />
                  ) : (
                    <Footprints
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textPrimary}
                      weight="bold"
                    />
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>
      </View>

      {/* Bottom Route Tray */}
      <View style={[styles.bottomTray, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        >
          {filteredRoutes.map((route) => {
            const isSelected = selectedRoute?.id === route.id;
            return (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: isSelected ? colors.accent : colors.border,
                    borderWidth: isSelected ? 2 : borders.thin,
                  },
                  shadows.none,
                ]}
                onPress={() => handleSelectRoute(route)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeaderRow}>
                  <Badge label={route.sportType} variant={isSelected ? 'brand' : 'neutral'} />
                  <Text style={[styles.surfaceText, { color: colors.textSecondary }]}>
                    {route.surface}
                  </Text>
                </View>

                <Text style={[styles.routeName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {route.name}
                </Text>

                <View style={styles.routeStatsRow}>
                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.textPrimary }]}>
                      {route.distanceKm} km
                    </Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>Distance</Text>
                  </View>

                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.textPrimary }]}>
                      +{route.elevationGainM} m
                    </Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>Climb</Text>
                  </View>

                  <View style={styles.statCol}>
                    <Text style={[styles.statVal, { color: colors.textPrimary }]}>{route.estTime}</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>Est. Time</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Primary CTA: Record With Route */}
        {selectedRoute && (
          <View style={styles.ctaWrapper}>
            <Button
              title={`Record with ${selectedRoute.name}`}
              size="lg"
              variant="primary"
              onPress={handleStartWithRoute}
              icon={<NavigationArrow size={18} color="#FFFFFF" weight="fill" />}
            />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderBottomWidth: borders.thin,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  segmentWrapper: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  routePin: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTray: {
    borderTopWidth: borders.thin,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    ...shadows.none,
  },
  cardsScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  routeCard: {
    width: 240,
    borderRadius: radii.md,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  surfaceText: {
    ...typography.caption,
  },
  routeName: {
    ...typography.heading3,
    marginBottom: spacing.sm,
  },
  routeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: borders.thin,
    borderColor: 'rgba(150,150,150,0.15)',
    paddingTop: spacing.xs,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    ...typography.caption,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statSub: {
    ...typography.caption,
    fontSize: 9,
    marginTop: 1,
  },
  ctaWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
});
