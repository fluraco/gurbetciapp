import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Web browser'ı mayComplete olarak ayarla
WebBrowser.maybeCompleteAuthSession();

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

class SupabaseGoogleAuthService {
  async signInWithGoogle(): Promise<{ user: any; session: any } | null> {
    try {
      console.log('Starting Google Sign-In...');
      
      // Expo Go'da OAuth test etmek için web'de test etmeyi öner
      const isExpoGo = process.env.EXPO_PUBLIC_APP_ENV === 'development';
      
      if (isExpoGo) {
        console.log('🚀 Expo Go\'da Google OAuth test modu');
        console.log('Web browser\'da Supabase dashboard\'u açılacak');
        console.log('Oradan Google OAuth\'u test edebilirsiniz');
        
        // Supabase dashboard'u aç
        const dashboardUrl = 'https://supabase.com/dashboard/project/your-project-id/auth/users';
        await WebBrowser.openBrowserAsync(dashboardUrl);
        
        // Demo kullanıcı oluştur (test amaçlı)
        console.log('Demo Google kullanıcısı oluşturuluyor...');
        
        // UUID generator function
        const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        
        // Mock Google user data
        const mockUser = {
          id: generateUUID(),
          email: 'demo@gmail.com',
          user_metadata: {
            full_name: 'Demo Kullanıcı',
            name: 'Demo Kullanıcı',
            avatar_url: 'https://via.placeholder.com/150',
            picture: 'https://via.placeholder.com/150',
          },
          app_metadata: {
            provider: 'google',
          },
        };
        
        console.log('Mock Google user created:', mockUser.email);
        
        // Mock session
        const mockSession = {
          user: mockUser,
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
        };
        
        return { user: mockUser, session: mockSession };
      } else {
        // Production/standalone build için gerçek OAuth
        console.log('Production Google OAuth starting...');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'gurbetci://auth/callback',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          console.error('Supabase Google Sign-In error:', error);
          throw error;
        }

        console.log('Google OAuth initiated, waiting for callback...');
        
        // Auth state change'i dinle
        return new Promise((resolve, reject) => {
          let timeoutId: NodeJS.Timeout;
          
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('Auth state changed:', event, session?.user?.email || 'no email');
              
              if (event === 'SIGNED_IN' && session?.user) {
                clearTimeout(timeoutId);
                authListener.subscription.unsubscribe();
                
                console.log('✅ Google Sign-In successful:', session.user.email);
                resolve({ user: session.user, session });
              }
            }
          );

          // 30 saniye timeout
          timeoutId = setTimeout(() => {
            authListener.subscription.unsubscribe();
            reject(new Error('OAuth timeout'));
          }, 30000);
        });
      }

    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      console.log('Google sign-out successful');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}

export const googleAuthService = new SupabaseGoogleAuthService(); 