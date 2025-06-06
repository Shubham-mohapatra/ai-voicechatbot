import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { RefreshControl } from "react-native";
import {
  conversationService
} from "./src/services/speechService";


const { width } = Dimensions.get("window");

export default function App() {
  const [userPreferences, setUserPreferences] = useState({
    name: "Shubham",
    theme: "dark",
    language: "en",
    speechEnabled: true,
    speechRate: 0.85,
    speechPitch: 1.1,
    notifications: true,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const welcomeMessage = `${getGreeting()} ${
    userPreferences.name
  }! How can I assist you today?`;

  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      text: welcomeMessage,
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideInAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const messageAnimRef = useRef<LottieView>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideInAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const toggleRecording = async () => {
    try {
      setError(null);
      
      if (!isRecording) {
        await conversationService.startConversation();
        setIsThinking(true);
        
        // Add user's message
        addMessage("Hello, can you help me?", true);
        
        // Simulate bot response
        setTimeout(async () => {
          try {
            setIsThinking(false);
            await addMessage("Of course! I'm here to assist you. What would you like help with?", false);
          } catch (error) {
            setError('Failed to process response');
            setIsThinking(false);
          }
        }, 2000);
      } else {
        await conversationService.stopConversation();
      }
      
      setIsRecording(!isRecording);
    } catch (error) {
      console.error("Error toggling recording:", error);
      setError("Failed to toggle recording. Please try again.");
      setIsThinking(false);
      setIsRecording(false);
    }
  };

  const handleMessage = async (text: string, isUser: boolean) => {
    if (!isUser && userPreferences.speechEnabled) {
      try {
        setError(null);
        console.log('Starting speech...');
        await conversationService.speakWithElevenLabs(text, {
          stability: 0.7,
          similarityBoost: 0.7
        });
      } catch (error) {
        console.error('Error speaking message:', error);
        setError(error instanceof Error ? error.message : 'Failed to speak message');
      }
    }
  };

  const addMessage = async (text: string, isUser: boolean) => {
    if (messageAnimRef.current) {
      messageAnimRef.current.reset();
    }

    const newMessage = {
      id: Date.now(),
      text,
      isUser,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);

    if (!isUser && userPreferences.speechEnabled) {
      await handleMessage(text, isUser);
    }
  };

  useEffect(() => {
    return () => {
      conversationService.stopConversation();
    };
  }, []);

  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={styles.container}
    >
      <StatusBar style="light" />

      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateX: slideInAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.profileContainer}>
          <LinearGradient
            colors={["#6e45e2", "#88d3ce"]}
            style={styles.profileCircle}
          >
            <Text style={styles.profileText}>S</Text>
          </LinearGradient>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Hello Shubham!</Text>
            <Text style={styles.headerSubtitle}>How can I help you today?</Text>
          </View>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => {
              setMessages([]);
              addMessage(welcomeMessage, false);
            }}
          >
            <Ionicons name="add-circle" size={32} color="#6e45e2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.speechToggle}
            onPress={() => {
              setUserPreferences((prev) => ({
                ...prev,
                speechEnabled: !prev.speechEnabled,
              }));
            }}
          >
            <Ionicons
              name={
                userPreferences.speechEnabled ? "volume-high" : "volume-mute"
              }
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        ref={(ref) => {
          if (ref) {
            setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
          }
        }}
      >
        {messages.map((msg) => (
          <Animated.View
            key={`message-${msg.id}-${msg.timestamp}`}
            style={[
              styles.messageBubble,
              msg.isUser ? styles.userMessage : styles.assistantMessage,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateX: msg.isUser
                      ? slideInAnim.interpolate({
                          inputRange: [0, width],
                          outputRange: [0, -50],
                        })
                      : slideInAnim.interpolate({
                          inputRange: [0, width],
                          outputRange: [0, 50],
                        }),
                  },
                ],
              },
            ]}
          >
            {!msg.isUser && (
              <View style={styles.assistantAvatar}>
                <LottieView
                  ref={messageAnimRef}
                  source={require("./assets/avatar.json")}
                  autoPlay={false}
                  loop
                  speed={0.8}
                  style={styles.avatarAnimation}
                  onLayout={() => {
                    if (messageAnimRef.current) {
                      setTimeout(() => {
                        if (messageAnimRef.current) {
                          if (messageAnimRef.current) {
                            messageAnimRef.current.play();
                          }
                        }
                      }, 100);
                    }
                  }}
                />
              </View>
            )}
            <Text
              style={[
                styles.messageText,
                msg.isUser
                  ? styles.userMessageText
                  : styles.assistantMessageText,
              ]}
            >
              {msg.text}
            </Text>
            <Text style={styles.timestampText}>{msg.timestamp}</Text>
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
                      outputRange: [0, 50],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.assistantAvatar}>
              <LottieView
                ref={messageAnimRef}
                source={require("./assets/avatar.json")}
                autoPlay={false}
                loop
                speed={0.8}
                style={styles.avatarAnimation}
                onLayout={() => {
                  if (messageAnimRef.current) {
                    setTimeout(() => {
                      messageAnimRef.current?.play();
                    }, 100);
                  }
                }}
              />
            </View>
            <View style={styles.typingIndicator}>
              <LottieView autoPlay loop style={styles.typingAnimation} />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.controlBar}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingActive]}
            onPress={toggleRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <LottieView autoPlay loop style={styles.recordingAnimation} />
            ) : (
              <Ionicons name="mic-outline" size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

type SmartSuggestionsProps = {
  context: any;
  onSelect: (suggestion: string) => void;
};

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  context,
  onSelect,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.suggestionsContainer}
  >
    {generateContextualSuggestions(context).map(
      (suggestion: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={styles.suggestionChip}
          onPress={() => onSelect(suggestion)}
        >
          <Text style={{ color: '#fff', fontSize: 14 }}>{suggestion}</Text>
        </TouchableOpacity>
      )
    )}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  profileText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 3,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  headerContent: {
    flex: 1,
  },
  newChatButton: {
    padding: 8,
    borderRadius: 20,
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
    maxWidth: "80%",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6e45e2",
    borderBottomRightRadius: 5,
    marginLeft: "20%",
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 5,
    marginRight: "20%",
  },
  messageText: {
    fontSize: 16,
    flexShrink: 1,
  },
  userMessageText: {
    color: "#fff",
  },
  assistantMessageText: {
    color: "#fff",
  },
  controlBar: {
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30,30,30,0.5)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#6e45e2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6e45e2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  recordingActive: {
    backgroundColor: "#e74c3c",
    shadowColor: "#e74c3c",
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
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
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
  timestampText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  lodaingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: "#6e45e2",
    width: "20%",
  },

  errorMessage: {
    backgroundColor: "rgba(255,0,0,0.1)",
    borderColor: "#e74c3c",
    borderWidth: 1,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 4,
  },
  speechToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 10,
  },
  suggestionsContainer: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  suggestionChip: {
    backgroundColor: "rgba(110, 69, 226, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#6e45e2",
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  particle: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 50,
  },
  errorContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(231, 76, 60, 0.9)",
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  errorTextStyle: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  },
});
function generateContextualSuggestions(context: any): string[] {
  if (!context || !context.messages || context.messages.length === 0) {
    return [
      "What can you do?",
      "Tell me a joke",
      "What's the weather?",
      "Set a reminder",
    ];
  }

  const lastMsg = context.messages[context.messages.length - 1];
  if (lastMsg.isUser) {
    // If last message is from user, suggest follow-ups
    return [
      "Can you explain more?",
      "Give me an example",
      "Summarize that",
      "Translate to Hindi",
    ];
  } else {
    // If last message is from assistant, suggest user actions
    return ["Thanks!", "Can you repeat?", "Tell me more", "Change topic"];
  }
}
