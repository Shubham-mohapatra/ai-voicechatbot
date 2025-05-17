import React from 'react';
import { View, Text, TouchableOpacity, Animated , } from 'react-native';
import { Ionicons } from '@expo/vector-icons';



type MessageReactionsProps = {
  onReact: (reaction: string) => void;
};

import { StyleSheet } from 'react-native';

export const MessageReactions: React.FC<MessageReactionsProps> = ({ onReact }) => (
  <Animated.View style={styles.reactionContainer}>
    {[
      { key: 'heart', icon: 'heart-outline' },
      { key: 'happy', icon: 'happy-outline' },
      { key: 'thumbs-up', icon: 'thumbs-up-outline' },
      { key: 'star', icon: 'star-outline' }
    ].map(reaction => (
      <TouchableOpacity 
        key={reaction.key} 
        onPress={() => onReact(reaction.key)}
        style={styles.reactionButton}
      >
        <Ionicons name={reaction.icon as any} size={16} color="#fff" />
      </TouchableOpacity>
    ))}
  </Animated.View>
);

const styles = StyleSheet.create({
  reactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#222',
    borderRadius: 16,
  },
  reactionButton: {
    marginHorizontal: 6,
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#444',
  },
});