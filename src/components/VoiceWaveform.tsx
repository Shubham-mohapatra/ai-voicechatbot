import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface VoiceWaveformProps {
  amplitude: Animated.AnimatedInterpolation<number>;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ amplitude }) => (
  <View style={styles.waveformContainer}>
    {[...Array(10)].map((_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.bar,
          {
            height: amplitude.interpolate({
              inputRange: [0, 1],
              outputRange: [3, 20]
            })
          }
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  bar: {
    width: 4,
    marginHorizontal: 2,
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
});