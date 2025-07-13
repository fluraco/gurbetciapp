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

interface NewPasswordScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
    };
  };
}

export default function NewPasswordScreen({ navigation, route }: NewPasswordScreenProps) {
  const { email } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Hata', 'Lütfen yeni şifrenizi girin.');
      return;
    }

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
      
      console.log('Setting new password for:', email);
      
      await authService.updatePasswordWithOTP(email, password);
      
      Alert.alert(
        'Başarılı!',
        'Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.',
        [
          {
            text: 'Giriş Yap',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      
    } catch (error: any) {
      console.error('Set password error:', error);
      Alert.alert('Hata', error.message || 'Şifre güncellenirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
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
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="key-outline" size={80} color={COLORS.primary} />
            </View>

            {/* Header Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Yeni Şifre Belirleyin</Text>
              <Text style={styles.welcomeSubtitle}>
                <Text style={styles.email}>{email}</Text> hesabınız için güvenli bir şifre oluşturun.
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
                  placeholder="Yeni şifrenizi girin"
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

              {/* Password Validation */}
              {password.length > 0 && (
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

              {/* Confirm Password Input */}
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

              {/* Set Password Button */}
              <TouchableOpacity
                style={[styles.setPasswordButton, loading && styles.setPasswordButtonDisabled]}
                onPress={handleSetPassword}
                disabled={loading || !password.trim() || !passwordValidation.isValid || password !== confirmPassword}
              >
                <Text style={styles.setPasswordButtonText}>
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  email: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  formSection: {
    width: '100%',
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
  setPasswordButton: {
    backgroundColor: '#DC2626',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  setPasswordButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  setPasswordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 