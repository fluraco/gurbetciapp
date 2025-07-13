import { Dimensions } from 'react-native';

// Ekran boyutları
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// Renkler
export const COLORS = {
  // Ana renkler
  primary: '#DC2626', // Türk bayrağı kırmızısı
  primaryLight: '#F87171',
  primaryDark: '#B91C1C',
  
  // Gradient renkler
  primaryGradient: ['#DC2626', '#EF4444'],
  
  // Arkaplan renkleri
  background: '#F8FAFC',
  surface: '#FFFFFF',
  
  // Metin renkleri
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  
  // Sistem renkleri
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Sınır ve ayırıcı renkleri
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  // Şeffaf renkler
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
};

// Boyutlar
export const SIZES = {
  // Padding ve margin
  small: 4,
  medium: 8,
  large: 16,
  extraLarge: 24,
  
  // Genel padding
  padding: 16,
  
  // Radius değerleri
  radius: 8,
  cardRadius: 12,
  buttonRadius: 8,
  
  // Ekran boyutları
  screenWidth: 375,
  screenHeight: 812,
  
  // Icon boyutları
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  iconExtraLarge: 48,
  
  // Button boyutları
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,
  
  // Input boyutları
  inputHeight: 48,
  inputHeightSmall: 36,
  inputHeightLarge: 56,
  
  // Header boyutları
  headerHeight: 60,
  tabBarHeight: 80,
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
};

// Font boyutları
export const FONTS = {
  // Boyutlar
  small: 12,
  medium: 14,
  large: 16,
  extraLarge: 18,
  
  // Başlık boyutları
  title: 20,
  headerTitle: 24,
  largeTitle: 32,
  
  // Özel boyutlar
  caption: 11,
  footnote: 13,
  subheadline: 15,
  headline: 17,
  body: 17,
  callout: 16,
  
  // Font ağırlıkları
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
};

// Animasyon süreleri
export const DURATIONS = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
};

// Z-index değerleri
export const ZINDEX = {
  dropdown: 1000,
  modal: 1100,
  overlay: 1200,
  tooltip: 1300,
  toast: 1400,
};

// API endpoints (Supabase için)
export const API_CONFIG = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

// SMTP Configuration (Brevo)
export const SMTP_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  user: '91edc1001@smtp-brevo.com',
  pass: 'BdzhH2kGbt9qcA15',
  fromEmail: 'noreply@gurbetci.com',
  fromName: 'Gurbetçi',
};

// App Configuration
export const APP_CONFIG = {
  name: 'Gurbetçi',
  url: 'https://gurbetci.com',
  supportEmail: 'destek@gurbetci.com',
  version: '1.0.0',
};

// Firebase config
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Navigasyon
export const NAVIGATION_ROUTES = {
  HOME: 'Home',
  NEWS: 'News',
  SERVICES: 'Services',
  COMMUNITY: 'Community',
  PROFILE: 'Profile',
  ONBOARDING: 'Onboarding',
  AUTH: 'Auth',
  LOGIN: 'Login',
  REGISTER: 'Register',
} as const;

// Türkiye'den yurtdışına göç edilen popüler ülkeler
export const COUNTRIES = [
  { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
  { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
  { code: 'NL', name: 'Hollanda', flag: '🇳🇱' },
  { code: 'BE', name: 'Belçika', flag: '🇧🇪' },
  { code: 'AT', name: 'Avusturya', flag: '🇦🇹' },
  { code: 'CH', name: 'İsviçre', flag: '🇨🇭' },
  { code: 'US', name: 'ABD', flag: '🇺🇸' },
  { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
  { code: 'AU', name: 'Avustralya', flag: '🇦🇺' },
  { code: 'GB', name: 'İngiltere', flag: '🇬🇧' },
  { code: 'SE', name: 'İsveç', flag: '🇸🇪' },
  { code: 'NO', name: 'Norveç', flag: '🇳🇴' },
  { code: 'DK', name: 'Danimarka', flag: '🇩🇰' },
  { code: 'IT', name: 'İtalya', flag: '🇮🇹' },
  { code: 'ES', name: 'İspanya', flag: '🇪🇸' },
]; 