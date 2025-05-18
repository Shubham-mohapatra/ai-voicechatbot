import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { ELEVEN_LABS_API_KEY } from '@env';

const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = 'YOUR_DEFAULT_VOICE_ID'; 

export interface SpeechOptions {
  stability?: number;
  similarityBoost?: number;
  voiceId?: string;
}

export const speakText = async (text: string, options: SpeechOptions = {}) => {
  return conversationService.speakWithElevenLabs(text, options);
};

class ConversationService {
  private currentSound: Audio.Sound | null = null;
  private isInitialized: boolean = false;

  async startConversation() {
    try {
      if (!this.isInitialized) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  async speakWithElevenLabs(text: string, options: SpeechOptions = {}) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Stop any currently playing audio
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }

      console.log('Making request to ElevenLabs...');
      const response = await fetch(`${API_URL}/${DEFAULT_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVEN_LABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }


      const audioBlob = await response.blob();

      const tempFilePath = `${FileSystem.cacheDirectory}/temp_audio_${Date.now()}.mp3`;
      
      const reader = new FileReader();
      const base64Data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(audioBlob);
      });
      const base64Audio = String(base64Data).split(',')[1];
      
      await FileSystem.writeAsStringAsync(tempFilePath, base64Audio, {
        encoding: FileSystem.EncodingType.Base64
      });

      console.log('Loading audio...');
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: tempFilePath });
      this.currentSound = sound;

      console.log('Playing audio...');
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await FileSystem.deleteAsync(tempFilePath).catch(console.error);
          await sound.unloadAsync();
          this.currentSound = null;
        }
      });

    } catch (error) {
      console.error('Speech error:', error);
      throw error;
    }
  }

  async stopConversation() {
    try {
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to stop conversation:', error);
      throw error;
    }
  }
}

export const conversationService = new ConversationService();