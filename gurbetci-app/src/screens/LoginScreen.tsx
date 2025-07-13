import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, SIZES, FONTS } from '../constants';
import { COUNTRIES, DEFAULT_COUNTRY } from '../constants/countries';
import { CountryData } from '../types';
import { authService, validateEmail, validatePhone, formatPhoneNumber } from '../services/supabase';
import { googleAuthService } from '../services/googleAuth';
import CountrySelectScreen from './CountrySelectScreen';

interface LoginScreenProps {
  navigation: any;
}

type LoginMethod = 'phone' | 'email';

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(DEFAULT_COUNTRY);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  
  const insets = useSafeAreaInsets();

  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country);
    setShowCountrySelect(false);
  };

  const handleContinue = async () => {
    if (loginMethod === 'phone') {
      await handlePhoneContinue();
    } else {
      await handleEmailContinue();
    }
  };

  const handlePhoneContinue = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı girin.');
      return;
    }

    const cleanNumber = phoneNumber.replace(/\s/g, '');
    if (cleanNumber.length < 7) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası girin.');
      return;
    }

    try {
      setLoading(true);
      const fullPhoneNumber = `${selectedCountry.dialCode}${cleanNumber}`;
      
      if (!validatePhone(fullPhoneNumber)) {
        Alert.alert('Hata', 'Geçerli bir telefon numarası girin.');
        return;
      }

      // Telefon numarasının desteklenip desteklenmediğini kontrol et
      const isSupported = await authService.checkPhoneSupport(fullPhoneNumber);
      if (!isSupported) {
        Alert.alert('Hata', 'Bu ülke kodu henüz desteklenmiyor.');
        return;
      }

      // Kullanıcı var mı kontrol et
      const { data: existingUser } = await authService.getUserByPhone(fullPhoneNumber);
      
      // SMS gönder
      await authService.signInWithPhone(fullPhoneNumber);
      
      navigation.navigate('OTPVerification', {
        method: 'phone',
        contact: fullPhoneNumber,
        countryCode: selectedCountry.dialCode,
        isExistingUser: !!existingUser,
      });
      
    } catch (error: any) {
      console.error('Phone login error:', error);
      Alert.alert('Hata', error.message || 'SMS gönderilemedi. Lütfen telefon numaranızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailContinue = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
      return;
    }

    try {
      setLoading(true);
      console.log('Checking email existence for:', email);

      // E-posta varlığını kontrol et
      const emailExists = await authService.checkEmailExists(email);
      console.log('Email exists result:', emailExists);
      
      if (emailExists) {
        // Mevcut kullanıcı - şifre girme sayfasına git
        console.log('Email exists - navigating to password input for login');
        navigation.navigate('PasswordInput', {
          email,
          isNewUser: false,
        });
      } else {
        // Yeni kullanıcı - şifre oluşturma sayfasına git
        console.log('Email does not exist - navigating to password input for signup');
        navigation.navigate('PasswordInput', {
          email,
          isNewUser: true,
        });
      }
      
    } catch (error: any) {
      console.error('Email check error:', error);
      Alert.alert('Hata', error.message || 'E-posta kontrolü yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleContinue = async () => {
    try {
      setLoading(true);
      console.log('Starting Google Sign-In flow...');
      
      // Expo Go'da OAuth test etmek zor olduğu için bilgi mesajı göster
      const isExpoGo = process.env.EXPO_PUBLIC_APP_ENV === 'development';
      
      if (isExpoGo) {
        Alert.alert(
          'Google OAuth Test',
          'Expo Go\'da Google OAuth test etmek için:\n\n1. Web tarayıcısı açılacak\n2. Supabase dashboard\'unda Google OAuth\'u test edebilirsiniz\n3. Gerçek OAuth testi için standalone build kullanın\n\nŞimdi demo kullanıcı ile devam etmek ister misiniz?',
          [
            { text: 'İptal', style: 'cancel' },
            { 
              text: 'Demo ile Devam Et', 
              onPress: async () => {
                // Demo kullanıcı oluştur
                const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0;
                  const v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
                
                const mockUser = {
                  id: generateUUID(),
                  email: 'demo@gmail.com',
                  user_metadata: {
                    full_name: 'Demo Google Kullanıcısı',
                    name: 'Demo Google Kullanıcısı',
                    avatar_url: 'https://via.placeholder.com/150',
                    picture: 'https://via.placeholder.com/150',
                  },
                  app_metadata: {
                    provider: 'google',
                  },
                };
                
                console.log('Creating demo Google user...');
                
                // Demo kullanıcı kaydını işle
                const handleResult = await authService.handleGoogleSignIn(mockUser);
                
                if (!handleResult.success) {
                  throw new Error(handleResult.error);
                }
                
                console.log('Demo Google auth successful, checking user profile');
                
                // Kullanıcı profili kontrolü
                const { data: profile } = await authService.getUserProfile(mockUser.id);
                
                if (profile) {
                  // Profil mevcut - ana sayfaya git
                              console.log('User profile found, navigating to MainTabs');
            navigation.navigate('MainTabs');
                } else {
                  // Profil yok - profil oluşturma sayfasına git
                  console.log('No user profile found, navigating to UserTypeSelection');
                  navigation.navigate('UserTypeSelection');
                }
              }
            },
            { 
              text: 'Supabase Dashboard Aç', 
              onPress: async () => {
                const dashboardUrl = 'https://supabase.com/dashboard/projects';
                await WebBrowser.openBrowserAsync(dashboardUrl);
              }
            }
          ]
        );
      } else {
        // Production/standalone build için gerçek OAuth
        const result = await googleAuthService.signInWithGoogle();
        
        if (result) {
          const { user, session } = result;
          console.log('Supabase Google Sign-In successful:', user.email);
          
          // Supabase'de Google kullanıcı kaydını işle
          const handleResult = await authService.handleGoogleSignIn(user);
          
          if (!handleResult.success) {
            throw new Error(handleResult.error);
          }
          
          console.log('Google auth successful, checking user profile');
          
          // Kullanıcı profili kontrolü
          const { data: profile } = await authService.getUserProfile(user.id);
          
          if (profile) {
            // Profil mevcut - ana sayfaya git
            console.log('User profile found, navigating to MainTabs');
            navigation.navigate('MainTabs');
          } else {
            // Profil yok - profil oluşturma sayfasına git
            console.log('No user profile found, navigating to UserTypeSelection');
            navigation.navigate('UserTypeSelection');
          }
          
        } else {
          console.log('Google Sign-In cancelled or failed');
        }
      }
      
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Hata', error.message || 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleContinue = () => {
    Alert.alert('Bilgi', 'Apple ile giriş yakında gelecek!');
  };

  const handleForgotPhone = () => {
    Alert.alert('Yardım', 'Telefon numaranıza erişiminizi mi kaybettiniz? Müşteri hizmetlerimizle iletişime geçin veya diğer yöntemlerle devam edin.');
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text, selectedCountry.dialCode);
    setPhoneNumber(formatted);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setShowEmailSuggestions(false);
    
    // @ işareti yazıldığında önerileri göster
    if (text.includes('@') && !text.includes(' ')) {
      const suggestions = authService.getEmailSuggestions(text);
      if (suggestions.length > 0) {
        setEmailSuggestions(suggestions);
        setShowEmailSuggestions(true);
      }
    }
  };

  const handleEmailSuggestionPress = (suggestion: string) => {
    setEmail(suggestion);
    setShowEmailSuggestions(false);
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone');
    setEmail('');
    setPhoneNumber('');
    setShowEmailSuggestions(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Hoş Geldiniz</Text>
              <Text style={styles.welcomeSubtitle}>
                Gurbetçi'ye giriş yapın veya yeni bir hesap oluşturun.
              </Text>
            </View>

            {/* Login Method Toggle */}
            <View style={styles.methodToggle}>
              <TouchableOpacity
                style={[styles.methodButton, loginMethod === 'phone' && styles.methodButtonActive]}
                onPress={() => setLoginMethod('phone')}
              >
                <Ionicons 
                  name="call-outline" 
                  size={20} 
                  color={loginMethod === 'phone' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[styles.methodText, loginMethod === 'phone' && styles.methodTextActive]}>
                  Telefon
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, loginMethod === 'email' && styles.methodButtonActive]}
                onPress={() => setLoginMethod('email')}
              >
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={loginMethod === 'email' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[styles.methodText, loginMethod === 'email' && styles.methodTextActive]}>
                  E-posta
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Section */}
            <View style={styles.formSection}>
              {loginMethod === 'phone' ? (
                <>
                  <View style={styles.inputContainer}>
                    <TouchableOpacity
                      style={styles.countrySelector}
                      onPress={() => setShowCountrySelect(true)}
                    >
                      <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                      <Text style={styles.countryCode}>{selectedCountry.dialCode}</Text>
                    </TouchableOpacity>
                    
                    <TextInput
                      style={styles.input}
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      placeholder="Telefon Numaranız"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="phone-pad"
                      maxLength={20}
                    />
                  </View>

                  <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPhone}>
                    <Text style={styles.forgotText}>Numaranıza erişiminizi mi kaybettiniz?</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.emailInput}
                      value={email}
                      onChangeText={handleEmailChange}
                      placeholder="E-posta Adresiniz"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>

                  {/* Email Suggestions */}
                  {showEmailSuggestions && emailSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {emailSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionItem}
                          onPress={() => handleEmailSuggestionPress(suggestion)}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.continueButton, loading && styles.continueButtonDisabled]}
                onPress={handleContinue}
                disabled={loading || (loginMethod === 'phone' ? !phoneNumber.trim() : !email.trim())}
              >
                <Text style={styles.continueButtonText}>
                  {loading ? 'Yükleniyor...' : 'Devam Et'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Alternative Login Options */}
            <View style={styles.alternativeSection}>
              <View style={styles.orSection}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>veya</Text>
                <View style={styles.orLine} />
              </View>

              {/* Google Option */}
              <TouchableOpacity style={styles.alternativeButton} onPress={handleGoogleContinue}>
                <Ionicons name="logo-google" size={20} color={COLORS.text} style={styles.alternativeIcon} />
                <Text style={styles.alternativeText}>Google ile devam et</Text>
              </TouchableOpacity>

              {/* Apple Option */}
              <TouchableOpacity style={styles.alternativeButton} onPress={handleAppleContinue}>
                <Ionicons name="logo-apple" size={20} color={COLORS.text} style={styles.alternativeIcon} />
                <Text style={styles.alternativeText}>Apple ile devam et</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountrySelectScreen
        visible={showCountrySelect}
        onClose={() => setShowCountrySelect(false)}
        onSelect={handleCountrySelect}
        selectedCountry={selectedCountry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingTop: 10,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  methodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
    minHeight: 56,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
    alignSelf: 'center',
  },
  emailInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    maxHeight: 120,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  forgotLink: {
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alternativeSection: {
    flex: 1,
  },
  orSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 16,
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 56,
  },
  alternativeIcon: {
    marginRight: 12,
  },
  alternativeText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
}); 