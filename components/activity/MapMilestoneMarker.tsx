import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Trophy } from 'phosphor-react-native';
import { radii, typography, borders } from '../../constants/theme';

interface MapMilestoneMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  label: string;
  rank?: number;
}

export function MapMilestoneMarker({
  coordinate,
  label,
  rank = 1,
}: MapMilestoneMarkerProps) {
  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1 }}>
      <View style={styles.markerContainer}>
        {/* Callout Label Bubble */}
        <View style={styles.calloutBubble}>
          <View style={styles.trophyIconBox}>
            <Trophy size={10} color="#F59E0B" weight="fill" />
          </View>
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
        </View>

        {/* Pin Anchor Arrow */}
        <View style={styles.pinArrow} />

        {/* Track Dot Anchor */}
        <View style={styles.anchorDot} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  calloutBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.xs,
    borderWidth: borders.thin,
    borderColor: '#F59E0B',
  },
  trophyIconBox: {
    marginRight: 4,
  },
  labelText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pinArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F59E0B',
  },
  anchorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginTop: 1,
  },
});
