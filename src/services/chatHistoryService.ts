import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types/message';
import { speakText } from './speechService';

const CHAT_HISTORY_KEY = 'chatHistory';

export interface ChatHistory {
  messages: Message[];
  timestamp: string;
}

export const saveChatHistory = async (messages: Message[]): Promise<void> => {
  try {
    const chatHistory: ChatHistory = {
      messages,
      timestamp: new Date().toISOString(),
    };

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.isUser) {
      await speakText(lastMessage.text, {
        stability: 0.7,
        similarityBoost: 0.7
      });
    }
    
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};

export const loadChatHistory = async (): Promise<Message[]> => {
  try {
    const history = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    if (history) {
      const { messages } = JSON.parse(history) as ChatHistory;
      return messages;
    }
    return [];
  } catch (error) {
    console.error('Error loading chat history:', error);
    throw error;
  }
};

export const clearChatHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
};