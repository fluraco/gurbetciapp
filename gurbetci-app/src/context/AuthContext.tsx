import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { authService, supabase } from '../services/supabase';
import { UserProfile } from '../types';
import * as Linking from 'expo-linking';

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  checkAuthStatus: () => Promise<void>;
  signOut: () => Promise<void>;
  isEmailVerified: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'null');
        
        if (session?.user) {
          setUser(session.user);
          
          // Google OAuth ile giriş yapıldıysa kullanıcı kaydını işle
          if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google') {
            console.log('Processing Google OAuth sign-in');
            const handleResult = await authService.handleGoogleSignIn(session.user);
            if (!handleResult.success) {
              console.error('Failed to handle Google sign-in:', handleResult.error);
            }
          }
          
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Deep link handling for OAuth callbacks
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      
      // Google OAuth callback'i handle et
      if (url.includes('auth/callback')) {
        console.log('OAuth callback detected, handling...');
        // Supabase otomatik olarak session'ı handle edecek
      }
    };

    // Initial URL'i kontrol et
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // URL change listener
    const urlListener = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.unsubscribe();
      urlListener.remove();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: user, error } = await authService.getCurrentUser();
      if (error) {
        console.error('Error getting current user:', error);
        setUser(null);
        setUserProfile(null);
        return;
      }
      
      if (user?.user) {
        setUser(user.user);
        await loadUserProfile(user.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Kullanıcı bulunamazsa veya aktif değilse null olarak ayarla
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      if (!userId) {
        console.error('User ID is undefined');
        setUserProfile(null);
        return;
      }
      
      const { data: profile } = await authService.getUserProfile(userId);
      
      if (!profile) {
        console.log('No user profile found for user:', userId);
        setUserProfile(null);
        return;
      }
      
      // Kullanıcı aktif değilse profili null olarak ayarla
      if (!profile.is_active) {
        console.log('User profile is inactive:', userId);
        setUserProfile(null);
        return;
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isEmailVerified = async (): Promise<boolean> => {
    // E-posta doğrulaması yapıp yapmadığını kontrol et
    if (!user || !user.email) return true; // E-posta yoksa doğrulanmış sayılır
    
    try {
      // Users tablosundan email_verified durumunu kontrol et
      const verified = await authService.isEmailVerified(user.email);
      console.log('Email verification status for', user.email, ':', verified);
      return verified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    checkAuthStatus,
    signOut,
    isEmailVerified,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 