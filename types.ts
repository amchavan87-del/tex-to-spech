export enum AppView {
  SPLASH = 'SPLASH',
  AUTH = 'AUTH',
  HOME = 'HOME',
  STUDIO = 'STUDIO',
  LIBRARY = 'LIBRARY',
  SETTINGS = 'SETTINGS',
}

export enum VoiceGender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: VoiceGender;
  style: string;
}

export interface TTSConfig {
  text: string;
  language: string;
  voiceId: string;
  speed: number;
  pitch: number;
  emotion: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  textSnippet: string;
  language: string;
  voiceName: string;
  duration: number;
  audioData: string; // Base64
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  favoriteVoices: string[]; // List of Voice IDs
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // In a real app, never store plain text passwords
  apiKey?: string;
  preferences: UserPreferences;
  history: HistoryItem[];
}

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'en', name: 'English', native: 'English' },
];

export const VOICES: VoiceOption[] = [
  { id: 'Kore', name: 'Kore', gender: VoiceGender.FEMALE, style: 'Calm' },
  { id: 'Fenrir', name: 'Fenrir', gender: VoiceGender.MALE, style: 'Deep' },
  { id: 'Puck', name: 'Puck', gender: VoiceGender.MALE, style: 'Energetic' },
  { id: 'Zephyr', name: 'Zephyr', gender: VoiceGender.FEMALE, style: 'Soft' },
  { id: 'Charon', name: 'Charon', gender: VoiceGender.MALE, style: 'Deep' },
];