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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants';
import { authService } from '../services/supabase';

interface PasswordInputScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
      isNewUser: boolean;
    };
  };
}

export default function PasswordInputScreen({ navigation, route }: PasswordInputScreenProps) {
  const { email, isNewUser } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!password.trim()) {
      Alert.alert('Hata', 'Lütfen şifrenizi girin.');
      return;
    }

    if (isNewUser) {
      // Yeni kullanıcı - şifre belirleme ve kayıt
      if (password.length < 6) {
        Alert.alert('Hata', 'Şifreniz en az 6 karakter olmalıdır.');
        return;
      }

      if (!passwordValidation.isValid) {
        Alert.alert('Hata', 'Şifreniz tüm gereksinimleri karşılamalıdır.');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Hata', 'Şifreler eşleşmiyor.');
        return;
      }

      try {
        setLoading(true);
        
        console.log('Creating new user account:', email);
        
        // Yeni kullanıcı kaydı yap
        const { data, error } = await authService.signUpWithEmail(email, password);
        
        if (error) {
          throw error;
        }
        
        console.log('User registered successfully, navigating to OTP verification');
        
        // Kayıt başarılı - E-posta doğrulama sayfasına git
        navigation.navigate('OTPVerification', {
          method: 'email',
          contact: email,
          isExistingUser: false, // Yeni kullanıcı
        });
        
      } catch (error: any) {
        console.error('Sign up error:', error);
        Alert.alert('Hata', error.message || 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    } else {
      // Mevcut kullanıcı - şifre ile giriş
      try {
        setLoading(true);
        
        const { data, error } = await authService.signInWithPassword(email, password);
        
        if (error) {
          throw error;
        }
        
        console.log('Sign in successful, checking user profile');
        
        // Kullanıcı profili kontrolü
        if (data.user?.id) {
          const { data: profile } = await authService.getUserProfile(data.user.id);
          
          if (profile) {
            // Profil var - navigation stack'i temizleyerek ana sayfaya git
            console.log('User profile found - navigating to Home');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } else {
            // Profil yok - profil oluşturma sayfasına git
            console.log('No user profile - navigating to UserTypeSelection');
            navigation.navigate('UserTypeSelection', { contact: email, method: 'email' });
          }
        } else {
          // Kullanıcı bilgisi alınamadı - profil oluşturma sayfasına git
          console.log('No user info - navigating to UserTypeSelection');
          navigation.navigate('UserTypeSelection', { contact: email, method: 'email' });
        }
        
      } catch (error: any) {
        console.error('Sign in error:', error);
        
        // E-posta doğrulaması gerekiyor hatası
        if (error.code === 'EMAIL_NOT_VERIFIED') {
          Alert.alert(
            'E-posta Doğrulaması Gerekli',
            'E-posta adresiniz doğrulanmamış. Doğrulama kodu gönderildi.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  navigation.navigate('OTPVerification', {
                    method: 'email',
                    contact: error.email || email,
                    isExistingUser: true,
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert('Hata', error.message || 'Giriş başarısız. Şifrenizi kontrol edin.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('PasswordReset');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const validatePassword = (text: string) => {
    const hasMinLength = text.length >= 6;
    const hasUpperCase = /[A-Z]/.test(text);
    const hasLowerCase = /[a-z]/.test(text);
    const hasNumber = /\d/.test(text);
    
    return {
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber,
    };
  };

  const passwordValidation = validatePassword(password);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                {isNewUser ? 'Şifre Oluşturun' : 'Şifrenizi Girin'}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {isNewUser 
                  ? `${email} adresine kayıt olmak için güvenli bir şifre oluşturun.`
                  : `${email} hesabına giriş yapmak için şifrenizi girin.`
                }
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isNewUser ? 'Yeni şifre oluşturun' : 'Şifrenizi girin'}
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Validation for New Users */}
              {isNewUser && password.length > 0 && (
                <View style={styles.validationContainer}>
                  <Text style={styles.validationTitle}>Şifre Gereksinimleri:</Text>
                  <View style={styles.validationItem}>
                    <Ionicons
                      name={passwordValidation.hasMinLength ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={passwordValidation.hasMinLength ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.validationText, passwordValidation.hasMinLength && styles.validationTextSuccess]}>
                      En az 6 karakter
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons
                      name={passwordValidation.hasUpperCase ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={passwordValidation.hasUpperCase ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.validationText, passwordValidation.hasUpperCase && styles.validationTextSuccess]}>
                      En az bir büyük harf
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons
                      name={passwordValidation.hasLowerCase ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={passwordValidation.hasLowerCase ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.validationText, passwordValidation.hasLowerCase && styles.validationTextSuccess]}>
                      En az bir küçük harf
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons
                      name={passwordValidation.hasNumber ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={passwordValidation.hasNumber ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.validationText, passwordValidation.hasNumber && styles.validationTextSuccess]}>
                      En az bir rakam
                    </Text>
                  </View>
                </View>
              )}

              {/* Confirm Password for New Users */}
              {isNewUser && (
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Şifrenizi tekrar girin"
                    placeholderTextColor={COLORS.textLight}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Forgot Password Link for Existing Users */}
              {!isNewUser && (
                <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Şifremi Unuttum</Text>
                </TouchableOpacity>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.continueButton, loading && styles.continueButtonDisabled]}
                onPress={handleContinue}
                disabled={loading || !password.trim() || (isNewUser && !passwordValidation.isValid)}
              >
                <Text style={styles.continueButtonText}>
                  {loading ? 'Yükleniyor...' : (isNewUser ? 'Hesap Oluştur' : 'Giriş Yap')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  welcomeSection: {
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  validationTextSuccess: {
    color: '#10B981',
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
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
}); 