import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you today?", isUser: false }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideInAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const messageAnimRef = useRef(null);

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(slideInAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(prev => {
      if (!prev) {
        // Simulate recording and response
        setTimeout(() => {
          setIsRecording(false);
          setIsThinking(true);
          setTimeout(() => {
            addMessage("I'm your AI assistant. What would you like to know?", false);
            setIsThinking(false);
          }, 2000);
        }, 3000);
        addMessage("This is a test voice message", true);
      }
      return !prev;
    });
  };

  const addMessage = (text: string, isUser: boolean) => {
    // Reset animation ref if it exists
    if (messageAnimRef.current) {
      messageAnimRef.current.reset();
    }
    
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        text,
        isUser,
        animated: false // Add this flag
      }
    ]);
  };

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <StatusBar style="light" />

      <Animated.View 
        style={[
          styles.header,
          { 
            transform: [{ translateX: slideInAnim }],
            opacity: fadeAnim
          }
        ]}
      >
        <View style={styles.profileContainer}>
          <LinearGradient
            colors={['#6e45e2', '#88d3ce']}
            style={styles.profileCircle}
          >
            <Text style={styles.profileText}>S</Text>
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Hello Shubham!</Text>
            <Text style={styles.headerSubtitle}>How can I help you today?</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        ref={ref => {
          if (ref) {
            setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
          }
        }}
      >
        {messages.map((msg, index) => (
          <Animated.View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.isUser ? styles.userMessage : styles.assistantMessage,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    translateX: msg.isUser ? 
                      slideInAnim.interpolate({
                        inputRange: [0, width],
                        outputRange: [0, -50]
                      }) : 
                      slideInAnim.interpolate({
                        inputRange: [0, width],
                        outputRange: [0, 50]
                      })
                  }
                ]
              }
            ]}
          >
            {!msg.isUser && (
              <View style={styles.assistantAvatar}>
                <LottieView
                  ref={messageAnimRef}
                  source={require('./assets/avatar.json')}
                  autoPlay={false}
                  loop
                  speed={0.8}
                  style={styles.avatarAnimation}
                  onLayout={() => {
                    if (messageAnimRef.current) {
                      setTimeout(() => {
                        messageAnimRef.current.play();
                      }, 100);
                    }
                  }}
                />
              </View>
            )}
            <Text style={[
              styles.messageText,
              msg.isUser ? styles.userMessageText : styles.assistantMessageText
            ]}>
              {msg.text}
            </Text>
            {msg.isUser && (
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>You</Text>
              </View>
            )}
          </Animated.View>
        ))}

        {isThinking && (
          <Animated.View 
            style={[
              styles.messageBubble,
              styles.assistantMessage,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    translateX: slideInAnim.interpolate({
                      inputRange: [0, width],
                      outputRange: [0, 50]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.assistantAvatar}>
              <LottieView
                ref={messageAnimRef}
                source={require('./assets/avatar.json')}
                autoPlay={false}
                loop
                speed={0.8}
                style={styles.avatarAnimation}
                onLayout={() => {
                  if (messageAnimRef.current) {
                    setTimeout(() => {
                      messageAnimRef.current.play();
                    }, 100);
                  }
                }}
              />
            </View>
            <View style={styles.typingIndicator}>
              <LottieView
                autoPlay
                loop
                style={styles.typingAnimation}
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.controlBar}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingActive]}
            onPress={toggleRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <LottieView
               autoPlay
                loop
                style={styles.recordingAnimation}
              />
            ) : (
              <Ionicons 
                name="mic-outline" 
                size={28} 
                color="#fff" 
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  profileText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 3,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginVertical: 6,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6e45e2',
    borderBottomRightRadius: 5,
    marginLeft: '20%',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 5,
    marginRight: '20%',
  },
  messageText: {
    fontSize: 16,
    flexShrink: 1,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#fff',
  },
  controlBar: {
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,30,30,0.5)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6e45e2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6e45e2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  recordingActive: {
    backgroundColor: '#e74c3c',
    shadowColor: '#e74c3c',
  },
  recordingAnimation: {
    width: 80,
    height: 80,
  },
  assistantAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAnimation: {
    width: 45,
    height: 45,
    marginLeft: -5,
    marginTop: -5,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  typingIndicator: {
    width: 60,
    height: 30,
    marginLeft: 10,
  },
  typingAnimation: {
    width: 60,
    height: 30,
  },
});