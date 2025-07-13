// Kullanıcı türleri
export type UserType = 'individual' | 'corporate';

// Users tablosu (basit kullanıcı bilgileri)
export interface SimpleUser {
  id: string;
  email?: string;
  phone?: string;
  email_verified: boolean;
  created_at: string;
  updated_at?: string;
}

// Supported Country interface
export interface SupportedCountry {
  id: string;
  code: string;
  name: string;
  name_tr: string;
  flag_emoji: string;
  dial_code: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// User Profile interface (user_profiles tablosu)
export interface UserProfile {
  id: string; // auth.users.id ile eşleşir
  email?: string;
  phone?: string;
  email_verified?: boolean; // E-posta doğrulaması durumu
  user_type: UserType;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  country_code?: string;
  city?: string;
  language: string;
  is_active: boolean;
  is_verified: boolean;
  
  // Individual user fields
  bio?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  interests?: string[];
  
  // Corporate user fields
  company_name?: string;
  brand_name?: string;
  company_logo_url?: string;
  tax_number?: string;
  website?: string;
  description?: string;
  category?: string;
  employee_count?: number;
  
  // Social media links
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  
  created_at: string;
  updated_at: string;
}

// City interface
export interface City {
  id: string;
  name: string;
  name_tr: string;
  country_code: string;
  is_active: boolean;
  population?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  created_at: string;
  updated_at: string;
}

// OTP Code interface
export interface OTPCode {
  id: string;
  user_id: string;
  code: string;
  type: 'email_verification' | 'password_reset' | 'phone_verification';
  email?: string;
  phone?: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
}

// Profil oluşturma formları
export interface ProfileSetupForm {
  user_type: UserType;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string;
  country_code: string;
  city: string;
  phone?: string;
  
  // Individual fields
  bio?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  interests?: string[];
  
  // Corporate fields
  company_name?: string;
  brand_name?: string;
  company_logo_url?: string;
  tax_number?: string;
  website?: string;
  description?: string;
  category?: string;
  employee_count?: number;
}

// Auth Form interfaces
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface EmailLoginForm {
  email: string;
  password?: string;
}

export interface PhoneLoginForm {
  phone: string;
  country_code: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetForm {
  email: string;
}

// Navigation types
export type AuthMethod = 'phone' | 'email';

export type RootStackParamList = {
  // App flow
  Splash: undefined;
  Onboarding: undefined;
  
  // Auth screens
  Login: undefined;
  OTPVerification: {
    method: 'phone' | 'email';
    contact: string;
    countryCode?: string;
    isExistingUser?: boolean | null;
  };
  PasswordInput: {
    email: string;
    isNewUser: boolean;
  };
  PasswordReset: undefined;
  PasswordResetOTP: {
    email: string;
  };
  NewPassword: {
    email: string;
  };
  
  // Profile setup
  UserTypeSelection: {
    contact: string;
    method: AuthMethod;
  };
  IndividualProfile: {
    contact: string;
    method: AuthMethod;
  };
  CorporateProfile: {
    contact: string;
    method: AuthMethod;
  };
  
  // Main app
  MainTabs: undefined;
  News: undefined;
  Ads: undefined;
  Discover: undefined;
  Messages: undefined;
  Profile: undefined;
  Settings: undefined;
  
  // Other screens
  NewsDetail: { newsId: string };
  ServiceDetail: { serviceId: string };
  CommunityDetail: { communityId: string };
};

export type MainTabParamList = {
  Home: undefined;
  News: undefined;
  Services: undefined;
  Community: undefined;
  Profile: undefined;
};

// Country data for constants
export interface CountryData {
  code: string;
  name: string;
  name_tr: string;
  flag: string;
  dialCode: string;
  isActive: boolean;
  displayOrder: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Database schema for Supabase
export interface Database {
  public: {
    Tables: {
      supported_countries: {
        Row: SupportedCountry;
        Insert: Omit<SupportedCountry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SupportedCountry, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      cities: {
        Row: City;
        Insert: Omit<City, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<City, 'id' | 'created_at' | 'updated_at'>>;
      };
      otp_codes: {
        Row: OTPCode;
        Insert: Omit<OTPCode, 'id' | 'created_at'>;
        Update: Partial<Omit<OTPCode, 'id' | 'created_at'>>;
      };
    };
  };
}

// Utility types
export type AsyncDataState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type CountryCode = 'PL' | 'TR' | 'DE' | 'FR' | 'NL' | 'BE' | 'AT' | 'CH' | 'GB' | 'US' | 'CA' | 'IT' | 'ES' | 'SE' | 'NO' | 'DK';

// Email suggestions type
export interface EmailSuggestion {
  email: string;
  domain: string;
} 