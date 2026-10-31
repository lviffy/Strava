import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Colors, { BrandColors } from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';

interface RouteItem {
  id: string;
  name: string;
  sportType: 'Run' | 'Ride' | 'Hike';
  distanceKm: number;
  elevationGainM: number;
  estTime: string;
  surface: string;
  coordinates: { latitude: number; longitude: number }[];
}

const SAMPLE_ROUTES: RouteItem[] = [
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [selectedRoute, setSelectedRoute] = useState<RouteItem>(SAMPLE_ROUTES[0]);
  const [filterSport, setFilterSport] = useState<string>('All');

  const filteredRoutes =
    filterSport === 'All'
      ? SAMPLE_ROUTES
      : SAMPLE_ROUTES.filter((r) => r.sportType === filterSport);

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
              filterSport === type && { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary },
            ]}
            onPress={() => setFilterSport(type)}>
            <Text
              style={[
                styles.filterChipText,
                { color: theme.text },
                filterSport === type && { color: '#FFFFFF', fontWeight: '700' },
              ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 37.78,
            longitude: -122.46,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}>
          {/* Active selected route polyline */}
          <Polyline
            coordinates={selectedRoute.coordinates}
            strokeColor={BrandColors.primary}
            strokeWidth={5}
          />

          {/* Markers for all routes */}
          {filteredRoutes.map((route) => (
            <Marker
              key={route.id}
              coordinate={route.coordinates[0]}
              onPress={() => setSelectedRoute(route)}>
              <View
                style={[
                  styles.routePin,
                  selectedRoute.id === route.id && { backgroundColor: BrandColors.primary, transform: [{ scale: 1.15 }] },
                ]}>
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

      {/* Bottom Route Cards Carousel */}
      <View style={[styles.bottomTray, { backgroundColor: theme.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
          {filteredRoutes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[
                styles.routeCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                selectedRoute.id === route.id && { borderColor: BrandColors.primary, borderWidth: 2 },
              ]}
              onPress={() => setSelectedRoute(route)}
              activeOpacity={0.8}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.sportBadge}>
                  <Text style={styles.sportBadgeText}>{route.sportType.toUpperCase()}</Text>
                </View>
                <Text style={[styles.surfaceText, { color: theme.textSecondary }]}>{route.surface}</Text>
              </View>

              <Text style={[styles.routeName, { color: theme.text }]} numberOfLines={1}>
                {route.name}
              </Text>

              <View style={styles.routeStatsRow}>
                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: theme.text }]}>{route.distanceKm} km</Text>
                  <Text style={[styles.statSub, { color: theme.textSecondary }]}>Distance</Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: theme.text }]}>{route.elevationGainM} m</Text>
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
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  routePin: {
    backgroundColor: '#333333',
    padding: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  bottomTray: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 14,
  },
  cardsScroll: {
    paddingHorizontal: 16,
  },
  routeCard: {
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  routeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {},
  statVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  statSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
