import React, { useState, useRef, useEffect } from 'react';
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
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/supabase';

interface OTPVerificationScreenProps {
  navigation: any;
  route: {
    params: {
      method: 'phone' | 'email';
      contact: string;
      countryCode?: string;
      isExistingUser?: boolean | null;
    };
  };
}

const COLORS = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  text: '#1F2937',
  textLight: '#6B7280',
  background: '#FFFFFF',
  backgroundLight: '#F9FAFB',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
};

export default function OTPVerificationScreen({ navigation, route }: OTPVerificationScreenProps) {
  const { method, contact, countryCode, isExistingUser } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Timer başlat
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Android geri tuşu kontrolü
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      clearInterval(interval);
      backHandler.remove();
    };
  }, [method]);

  const handleBackPress = () => {
    // E-posta doğrulaması sırasında geri tuşunu engelle
    if (method === 'email') {
      Alert.alert(
        'E-posta Doğrulaması Gerekli',
        'E-posta adresinizi doğrulamadan sistemi kullanamazsınız.',
        [{ text: 'Tamam' }]
      );
      return true; // Geri tuşu event'ini yakala
    }
    
    // Telefon doğrulaması için normal geri tuşu davranışı
    return false;
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Sadece tek karakter kabul et
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Otomatik bir sonraki input'a geç
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Verifying OTP:', otpCode, 'for', method, ':', contact);
      
      if (method === 'email') {
        // E-posta için custom OTP doğrulaması (yeni kullanıcı kaydı için)
        try {
          // Önce custom OTP sistemi ile dene
          await authService.verifyOTPCode(
            otpCode, 
            'email_verification', 
            contact
          );
          
          console.log('Custom OTP verified successfully');
          
          // Custom OTP başarılı - kullanıcı profili kontrolü
          const { data: existingUser } = await authService.getUserByEmail(contact);
          
          if (existingUser) {
            // Kullanıcı var - profil kontrolü
            const { data: profile } = await authService.getUserProfile(existingUser.id);
            
            if (profile) {
              // Profil var - navigation stack'i temizleyerek ana sayfaya yönlendir
              console.log('User profile found - navigating to MainTabs');
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            } else {
              // Profil yok - başarı mesajı göster ve profil oluşturma sayfasına yönlendir
              console.log('No user profile - navigating to UserTypeSelection');
              Alert.alert(
                'Doğrulama Başarılı!',
                'E-posta adresiniz başarıyla doğrulandı. Şimdi profil bilgilerinizi tamamlayın.',
                [
                  {
                    text: 'Devam Et',
                    onPress: () => navigation.navigate('UserTypeSelection', { contact, method }),
                  },
                ]
              );
            }
          } else {
            // Kullanıcı bulunamadı - başarı mesajı göster ve profil oluşturma sayfasına yönlendir
            console.log('No user found - navigating to UserTypeSelection');
            Alert.alert(
              'Doğrulama Başarılı!',
              'E-posta adresiniz başarıyla doğrulandı. Şimdi profil bilgilerinizi tamamlayın.',
              [
                {
                  text: 'Devam Et',
                  onPress: () => navigation.navigate('UserTypeSelection', { contact, method }),
                },
              ]
            );
          }
          
        } catch (customError: any) {
          console.log('Custom OTP failed, trying Supabase Auth OTP:', customError.message);
          
          // Custom OTP başarısız - Supabase Auth OTP sistemi ile dene
          const { user } = await authService.verifyOtp(
            contact,
            otpCode,
            'email'
          );
          
          console.log('Supabase OTP verified successfully, user:', user?.id);
          
          // Kullanıcı profili kontrolü
          if (user?.id) {
            const { data: profile } = await authService.getUserProfile(user.id);
            
            if (profile) {
              // Profil var - navigation stack'i temizleyerek ana sayfaya yönlendir
              console.log('User profile found - navigating to MainTabs');
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            } else {
              // Profil yok - başarı mesajı göster ve profil oluşturma sayfasına yönlendir
              console.log('No user profile - navigating to UserTypeSelection');
              Alert.alert(
                'Doğrulama Başarılı!',
                'E-posta adresiniz başarıyla doğrulandı. Şimdi profil bilgilerinizi tamamlayın.',
                [
                  {
                    text: 'Devam Et',
                    onPress: () => navigation.navigate('UserTypeSelection', { contact, method }),
                  },
                ]
              );
            }
          } else {
            // Kullanıcı bilgisi alınamadı - başarı mesajı göster ve profil oluşturma sayfasına yönlendir
            console.log('No user info - navigating to UserTypeSelection');
            Alert.alert(
              'Doğrulama Başarılı!',
              'E-posta adresiniz başarıyla doğrulandı. Şimdi profil bilgilerinizi tamamlayın.',
              [
                {
                  text: 'Devam Et',
                  onPress: () => navigation.navigate('UserTypeSelection', { contact, method }),
                },
              ]
            );
          }
        }
      } else {
        // Telefon için Supabase Auth OTP doğrulaması
        const { user } = await authService.verifyOtp(
          contact,
          otpCode,
          'sms'
        );
        
        console.log('Phone OTP verified successfully, user:', user?.id);
        
        // Kullanıcı profili kontrolü - E-posta ile aynı mantık
        if (user?.id) {
          const { data: profile } = await authService.getUserProfile(user.id);
          
          if (profile) {
            // Profil var - navigation stack'i temizleyerek ana sayfaya yönlendir
            console.log('User profile found - navigating to MainTabs');
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          } else {
            // Profil yok - başarı mesajı göster ve profil oluşturma sayfasına yönlendir
            console.log('No user profile - navigating to UserTypeSelection');
            Alert.alert(
              'Doğrulama Başarılı!',
              'Telefon numaranız başarıyla doğrulandı. Şimdi profil bilgilerinizi tamamlayın.',
              [
                {
                  text: 'Devam Et',
                  onPress: () => navigation.navigate('UserTypeSelection', { contact, method }),
                },
              ]
            );
          }
        } else {
          // Kullanıcı bilgisi alınamadı - başarı mesajı göster ve profil oluşturma sayfasına yönlendir
          console.log('No user info - navigating to UserTypeSelection');
          Alert.alert(
            'Doğrulama Başarılı!',
            'Telefon numaranız başarıyla doğrulandı. Şimdi profil bilgilerinizi tamamlayın.',
            [
              {
                text: 'Devam Et',
                onPress: () => navigation.navigate('UserTypeSelection', { contact, method }),
              },
            ]
          );
        }
      }
      
    } catch (error: any) {
      console.error('OTP verification error:', error);
      Alert.alert('Hata', error.message || 'Doğrulama işlemi başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      
      console.log('Resending OTP to:', contact, 'via', method);
      
      // Method'a göre OTP gönder
      if (method === 'phone') {
        await authService.signInWithPhone(contact);
      } else {
        // E-posta için custom OTP kodu gönder (yeni kayıt için)
        try {
          // Önce kullanıcının var olup olmadığını kontrol et
          const { data: existingUser } = await authService.getUserByEmail(contact);
          
          if (existingUser) {
            // Kullanıcı var - yeni custom OTP kodu gönder
            const newOtpCode = authService.generateOTPCode();
            await authService.saveOTPCode(existingUser.id, newOtpCode, 'email_verification', contact);
            await authService.sendCustomEmail(contact, 'otp', { code: newOtpCode });
            console.log('Custom OTP resent successfully');
          } else {
            // Kullanıcı yok - Supabase Auth OTP gönder
            await authService.signInWithEmail(contact);
            console.log('Supabase Auth OTP resent successfully');
          }
        } catch (customError: any) {
          console.log('Custom OTP resend failed, trying Supabase Auth:', customError.message);
          // Custom başarısız - Supabase Auth OTP gönder
          await authService.signInWithEmail(contact);
        }
      }
      
      Alert.alert('Başarılı', 'Yeni doğrulama kodu gönderildi.');
      
      // Timer'ı sıfırla
      setTimer(60);
      setCanResend(false);
      
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Hata', error.message || 'Kod gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        {/* Geri butonunu sadece telefon doğrulaması için göster */}
        {method === 'phone' ? (
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={method === 'phone' ? 'call-outline' : 'mail-outline'} 
              size={80} 
              color={COLORS.primary} 
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {method === 'phone' ? 'Telefon Doğrulama' : 'E-posta Doğrulama'}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            <Text style={styles.email}>{contact}</Text> 
            {method === 'phone' ? ' numarasına gönderilen' : ' adresine gönderilen'} 6 haneli doğrulama kodunu girin.
          </Text>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={loading || otp.join('').length !== 6}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </Text>
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendText}>
              Kod gelmedi mi?{' '}
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                  <Text style={styles.resendLink}>
                    {resendLoading ? 'Gönderiliyor...' : 'Tekrar Gönder'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  {timer} saniye sonra tekrar gönderebilirsiniz
                </Text>
              )}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  email: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 4,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  resendSection: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  timerText: {
    color: COLORS.textLight,
  },
}); 