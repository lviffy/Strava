import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../../services/ApiClient';
import { useRecordingStore, SportType } from '../../store/useRecordingStore';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

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

export default function MapsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const mapRef = useRef<MapView | null>(null);

  const { setSelectedRoute: setGlobalSelectedRoute } = useRecordingStore();

  const [routes, setRoutes] = useState<RouteItem[]>(FALLBACK_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem>(FALLBACK_ROUTES[0]);
  const [filterSport, setFilterSport] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch nearby segments from PostGIS backend
  const fetchNearbySegments = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const sportParam = filterSport !== 'All' ? filterSport : undefined;
      const res = await ApiClient.getNearbySegments(lat, lng, 20000, sportParam);

      if (res && res.segments && res.segments.length > 0) {
        const mappedRoutes: RouteItem[] = res.segments.map((s: any) => {
          // Parse start and end coordinates into a segment path
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

          return {
            id: s.id,
            name: s.name,
            sportType: (s.sportType as SportType) || 'Run',
            distanceKm: distKm,
            elevationGainM: s.elevationGainMeters || 45,
            estTime: `${estMin} min`,
            surface: 'Paved & Trail',
            coordinates: coords,
          };
        });

        setRoutes(mappedRoutes);
        setSelectedRoute(mappedRoutes[0]);
      }
    } catch {
      // Use fallback routes if offline
    } finally {
      setIsLoading(false);
    }
  }, [filterSport]);

  useEffect(() => {
    // Default to San Francisco center
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Filter Chips */}
      <View style={styles.filterRow}>
        {['All', 'Run', 'Ride', 'Hike'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              filterSport === type && {
                backgroundColor: BrandColors.primary,
                borderColor: BrandColors.primary,
              },
            ]}
            onPress={() => setFilterSport(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: theme.text },
                filterSport === type && { color: '#FFFFFF', fontWeight: '700' },
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}

        {isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={BrandColors.primary} />
          </View>
        )}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 37.78,
            longitude: -122.45,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          onRegionChangeComplete={(region: Region) => {
            // Can optionally re-fetch on large pans
          }}
        >
          {/* Active selected route polyline */}
          {selectedRoute && (
            <Polyline
              coordinates={selectedRoute.coordinates}
              strokeColor={BrandColors.primary}
              strokeWidth={5}
            />
          )}

          {/* Markers for all routes */}
          {filteredRoutes.map((route) => (
            <Marker
              key={route.id}
              coordinate={route.coordinates[0]}
              onPress={() => handleSelectRoute(route)}
            >
              <View
                style={[
                  styles.routePin,
                  selectedRoute?.id === route.id && {
                    backgroundColor: BrandColors.primary,
                    transform: [{ scale: 1.15 }],
                  },
                ]}
              >
                <Ionicons
                  name={route.sportType === 'Ride' ? 'bicycle' : 'walk'}
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Bottom Route Tray with Action CTA */}
      <View style={[styles.bottomTray, { backgroundColor: theme.background }]}>
        {/* Route Cards Horizontal Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        >
          {filteredRoutes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[
                styles.routeCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                selectedRoute?.id === route.id && {
                  borderColor: BrandColors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => handleSelectRoute(route)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.sportBadge}>
                  <Text style={styles.sportBadgeText}>{route.sportType.toUpperCase()}</Text>
                </View>
                <Text style={[styles.surfaceText, { color: theme.textSecondary }]}>
                  {route.surface}
                </Text>
              </View>

              <Text style={[styles.routeName, { color: theme.text }]} numberOfLines={1}>
                {route.name}
              </Text>

              <View style={styles.routeStatsRow}>
                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: theme.text }]}>
                    {route.distanceKm} km
                  </Text>
                  <Text style={[styles.statSub, { color: theme.textSecondary }]}>Distance</Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: theme.text }]}>
                    {route.elevationGainM} m
                  </Text>
                  <Text style={[styles.statSub, { color: theme.textSecondary }]}>Climb</Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: theme.text }]}>{route.estTime}</Text>
                  <Text style={[styles.statSub, { color: theme.textSecondary }]}>Est. Time</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Primary CTA: Record With Route */}
        {selectedRoute && (
          <TouchableOpacity
            style={styles.startRouteButton}
            onPress={handleStartWithRoute}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.startRouteButtonText}>
              Record with {selectedRoute.name}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
  },
  loadingIndicator: {
    marginLeft: 6,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  routePin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  bottomTray: {
    paddingBottom: 16,
    paddingTop: 8,
  },
  cardsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  routeCard: {
    width: 250,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginRight: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sportBadge: {
    backgroundColor: 'rgba(252, 82, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sportBadgeText: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  surfaceText: {
    fontSize: 11,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  routeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 10,
    marginTop: 2,
  },
  startRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 12,
    height: 48,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  startRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
