import React, { useState } from 'react';
import { StyleSheet, View, Text, PanResponder } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { BrandColors } from '../../constants/Colors';

interface ElevationChartProps {
  altitudes: (number | null)[];
  totalDistanceMeters: number;
  totalElevationGainMeters: number;
}

export function ElevationChart({
  altitudes,
  totalDistanceMeters,
  totalElevationGainMeters,
}: ElevationChartProps) {
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  // Filter and smooth valid altitude points
  const validAltitudes: number[] = altitudes
    .filter((a): a is number => a !== null && isFinite(a))
    .slice(0, 150); // Downsample for crisp rendering

  if (validAltitudes.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No elevation data recorded for this activity.</Text>
      </View>
    );
  }

  const minAlt = Math.floor(Math.min(...validAltitudes));
  const maxAlt = Math.ceil(Math.max(...validAltitudes));
  const range = Math.max(10, maxAlt - minAlt);

  const chartWidth = 320;
  const chartHeight = 120;
  const paddingBottom = 20;
  const paddingTop = 10;
  const usableHeight = chartHeight - paddingBottom - paddingTop;

  // Build SVG Path points
  const points = validAltitudes.map((alt, idx) => {
    const x = (idx / (validAltitudes.length - 1)) * chartWidth;
    const y = paddingTop + usableHeight - ((alt - minAlt) / range) * usableHeight;
    return { x, y, alt };
  });

  const linePath = points.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const areaPath = `${linePath} L ${chartWidth} ${chartHeight - paddingBottom} L 0 ${
    chartHeight - paddingBottom
  } Z`;

  // Pan Responder for interactive touch scrubbing
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const touchX = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, touchX / chartWidth));
      setScrubIndex(Math.round(ratio * (validAltitudes.length - 1)));
    },
    onPanResponderMove: (evt) => {
      const touchX = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, touchX / chartWidth));
      setScrubIndex(Math.round(ratio * (validAltitudes.length - 1)));
    },
    onPanResponderRelease: () => {
      setScrubIndex(null);
    },
  });

  const activePoint = scrubIndex !== null ? points[scrubIndex] : null;
  const activeDistanceKm =
    scrubIndex !== null
      ? ((scrubIndex / (validAltitudes.length - 1)) * (totalDistanceMeters / 1000)).toFixed(2)
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Elevation Profile</Text>
          <Text style={styles.gainText}>
            Gain: +{Math.round(totalElevationGainMeters)} m
          </Text>
        </View>

        {activePoint && (
          <View style={styles.scrubTooltip}>
            <Text style={styles.scrubAlt}>{Math.round(activePoint.alt)} m</Text>
            <Text style={styles.scrubDist}>at {activeDistanceKm} km</Text>
          </View>
        )}
      </View>

      <View style={styles.chartWrapper} {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#FF9500" stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Background area fill */}
          <Path d={areaPath} fill="url(#elevationGrad)" />

          {/* Elevation profile line */}
          <Path d={linePath} fill="none" stroke="#FF9500" strokeWidth="2.5" />

          {/* Active scrub cursor line */}
          {activePoint && (
            <Line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={chartHeight - paddingBottom}
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeDasharray="4, 3"
            />
          )}
        </Svg>

        {/* Min / Max Labels */}
        <View style={styles.yLabels}>
          <Text style={styles.labelText}>{maxAlt} m</Text>
          <Text style={styles.labelText}>{minAlt} m</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gainText: {
    fontSize: 12,
    color: '#98989F',
    marginTop: 2,
  },
  scrubTooltip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  scrubAlt: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '800',
  },
  scrubDist: {
    color: '#98989F',
    fontSize: 10,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  yLabels: {
    position: 'absolute',
    right: 8,
    top: 6,
    bottom: 24,
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 10,
    color: '#636366',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#636366',
    fontSize: 13,
  },
});
