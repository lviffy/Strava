import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MagnifyingGlass, XCircle, Users } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { ApiClient } from '../services/ApiClient';
import { useColorScheme } from '../components/useColorScheme';
import theme, { radii, spacing, typography, borders } from '../constants/theme';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { AthleteAvatar } from '../components/activity/AthleteAvatar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

interface AthleteResult {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  city?: string | null;
  bio?: string | null;
  isFollowing?: boolean;
  _count?: {
    followers: number;
    activities: number;
  };
}

const RECENT_CHIPS = ['Alex', 'Sarah', 'San Francisco', 'Palo Alto', 'Trail'];

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = theme.theme[colorScheme];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AthleteResult[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const searchAthletes = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const res = await ApiClient.searchAthletes(q);
      if (res && res.athletes) {
        setResults(res.athletes);
      }
    } catch (err) {
      console.error('Error searching athletes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchAthletes(query);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, searchAthletes]);

  const handleToggleFollow = async (athlete: AthleteResult) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await ApiClient.toggleFollow(athlete.id);
      setFollowingMap((prev) => ({
        ...prev,
        [athlete.id]: res.following,
      }));
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Find Athletes"
        showBack
        onBack={() => router.back()}
      />

      {/* Search Input Bar */}
      <View style={[styles.searchBarWrapper, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <MagnifyingGlass size={18} color={colors.textMuted} weight="bold" style={{ marginRight: spacing.sm }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by athlete name or city..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <XCircle size={18} color={colors.textMuted} weight="fill" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Suggestion Chips */}
        <View style={styles.chipsRow}>
          <Text style={[styles.chipsLabel, { color: colors.textMuted }]}>Suggestions:</Text>
          {RECENT_CHIPS.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.chip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={() => setQuery(chip)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={results.length === 0 ? styles.emptyContainer : styles.listContainer}
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={32} color={colors.textSecondary} weight="regular" />}
              title="No Athletes Found"
              description={query.length > 0 ? `No athletes matching "${query}". Try searching for another name or location.` : 'Start typing to search athletes across the community.'}
            />
          }
          renderItem={({ item }) => {
            const isFollowing = followingMap[item.id] ?? false;
            return (
              <SurfaceCard style={styles.athleteCard}>
                <TouchableOpacity
                  style={styles.athleteInfoSection}
                  onPress={() => router.push(`/profile/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <AthleteAvatar
                    name={`${item.firstName} ${item.lastName}`}
                    size="md"
                    color={colors.accent}
                  />
                  <View style={styles.athleteDetails}>
                    <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={[styles.athleteLocation, { color: colors.textMuted }]}>
                      {item.city || 'Athlete'} • {item._count?.activities || 0} activities
                    </Text>
                  </View>
                </TouchableOpacity>

                <Button
                  title={isFollowing ? 'Following' : 'Follow'}
                  variant={isFollowing ? 'secondary' : 'primary'}
                  size="sm"
                  onPress={() => handleToggleFollow(item)}
                />
              </SurfaceCard>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrapper: {
    padding: spacing.md,
    borderBottomWidth: borders.thin,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radii.md,
    borderWidth: borders.thin,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chipsLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: borders.thin,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  listContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  athleteInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  athleteDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  athleteName: {
    fontSize: 15,
    fontWeight: '700',
  },
  athleteLocation: {
    fontSize: 12,
    marginTop: 2,
  },
});
