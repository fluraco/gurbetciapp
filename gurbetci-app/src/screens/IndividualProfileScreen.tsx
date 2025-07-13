import React, { useState, useEffect } from 'react';
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
  BackHandler,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authService, countryService, generateUsername, createInitialsAvatar } from '../services/supabase';
import { City, AuthMethod } from '../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface IndividualProfileScreenProps {
  navigation: any;
  route: {
    params: {
      contact: string;
      method: AuthMethod;
    };
  };
}

export default function IndividualProfileScreen({
  navigation,
  route,
}: IndividualProfileScreenProps) {
  const { contact, method } = route.params;
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [showCitySelect, setShowCitySelect] = useState(false);
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    city: '',
    avatar: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    username: '',
    city: '',
  });

  useEffect(() => {
    loadCities();
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    Alert.alert(
      'Profil Oluşturma Gerekli',
      'Bireysel profil bilgilerinizi girmeyi tamamlamanız gerekmektedir.',
      [{ text: 'Tamam' }]
    );
    return true;
  };

  const loadCities = async () => {
    try {
      console.log('countryService:', countryService);
      console.log('typeof countryService:', typeof countryService);
      console.log('countryService.getPolandCities:', countryService?.getPolandCities);
      
      const polandCities = await countryService.getPolandCities();
      console.log('Cities loaded:', polandCities);
      setCities(polandCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'firstName' || field === 'lastName') {
      const firstName = field === 'firstName' ? value : form.firstName;
      const lastName = field === 'lastName' ? value : form.lastName;
      
      if (firstName && lastName) {
        const autoUsername = generateUsername(firstName, lastName);
        setForm(prev => ({ ...prev, username: autoUsername }));
        
        const initials = createInitialsAvatar(firstName, lastName);
        setForm(prev => ({ ...prev, avatar: initials }));
      }
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleanUsername = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setForm(prev => ({ ...prev, username: cleanUsername }));
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      username: '',
      city: '',
    };

    if (!form.firstName.trim()) {
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (!form.username.trim()) {
      newErrors.username = 'Kullanıcı adı gereklidir';
    } else if (form.username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    }

    if (!form.city.trim()) {
      newErrors.city = 'Şehir seçimi gereklidir';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const { available } = await authService.checkUsernameAvailability(form.username);
      if (!available) {
        setErrors(prev => ({ ...prev, username: 'Bu kullanıcı adı zaten alınmış' }));
        return;
      }

      const { data: currentUser, error: userError } = await authService.getCurrentUser();
      if (userError || !currentUser?.user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      await authService.createUserProfile({
        id: currentUser.user.id,
        phone: method === 'phone' ? contact : undefined,
        user_type: 'individual',
        first_name: form.firstName,
        last_name: form.lastName,
        username: form.username,
        avatar_url: form.avatar,
        country_code: 'PL',
        city: form.city,
      });

      Alert.alert('Başarılı', 'Profiliniz oluşturuldu! Gurbetçi\'ye hoş geldiniz.', [
        { 
          text: 'Tamam', 
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }
        }
      ]);

    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Profil oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Bireysel Profil</Text>
          <Text style={styles.headerSubtitle}>
            Hesabınızı tamamlamak için bilgilerinizi girin
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {form.avatar || '👤'}
                  </Text>
                </View>
              </View>
              <Text style={styles.avatarLabel}>Profil Fotoğrafı</Text>
              <Text style={styles.avatarSubLabel}>
                {form.avatar ? 'Otomatik oluşturuldu' : 'Ad ve soyad girdiğinizde otomatik oluşacak'}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ad</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.firstName && styles.inputError]}
                    value={form.firstName}
                    onChangeText={(value) => handleNameChange('firstName', value)}
                    placeholder="Adınızı girin"
                    placeholderTextColor="#666666"
                    autoCapitalize="words"
                  />
                </View>
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Soyad</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.lastName && styles.inputError]}
                    value={form.lastName}
                    onChangeText={(value) => handleNameChange('lastName', value)}
                    placeholder="Soyadınızı girin"
                    placeholderTextColor="#666666"
                    autoCapitalize="words"
                  />
                </View>
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.username && styles.inputError]}
                    value={form.username}
                    onChangeText={handleUsernameChange}
                    placeholder="Kullanıcı adınızı girin"
                    placeholderTextColor="#666666"
                    autoCapitalize="none"
                  />
                </View>
                {errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ülke</Text>
                <View style={styles.inputContainer}>
                  <TouchableOpacity style={styles.selectInput} disabled>
                    <Text style={styles.selectText}>🇵🇱 Polonya</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şehir</Text>
                <View style={styles.inputContainer}>
                  <TouchableOpacity
                    style={[styles.selectInput, errors.city && styles.inputError]}
                    onPress={() => setShowCitySelect(true)}
                  >
                    <Text style={[
                      styles.selectText,
                      !form.city && styles.selectPlaceholder
                    ]}>
                      {form.city || 'Şehir seçin'}
                    </Text>
                    <Text style={styles.selectArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
                {errors.city && (
                  <Text style={styles.errorText}>{errors.city}</Text>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#333333', '#444444'] : ['#ffffff', '#f8f9fa']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={[
                    styles.submitButtonText,
                    loading && styles.submitButtonTextDisabled
                  ]}>
                    {loading ? 'Oluşturuluyor...' : 'Profili Oluştur'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City Selection Modal */}
      {showCitySelect && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şehir Seçin</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCitySelect(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.cityList} showsVerticalScrollIndicator={false}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={[
                    styles.cityItem,
                    form.city === city.name && styles.cityItemSelected
                  ]}
                  onPress={() => {
                    setForm(prev => ({ ...prev, city: city.name }));
                    setShowCitySelect(false);
                    if (errors.city) {
                      setErrors(prev => ({ ...prev, city: '' }));
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.cityItemText,
                    form.city === city.name && styles.cityItemTextSelected
                  ]}>
                    {city.name}
                  </Text>
                  {form.city === city.name && (
                    <Text style={styles.cityItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  avatarSubLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  selectInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    color: '#ffffff',
  },
  selectPlaceholder: {
    color: '#666666',
  },
  selectArrow: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 8,
  },
  buttonSection: {
    paddingBottom: Platform.OS === 'android' ? 24 : 32,
  },
  submitButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    shadowColor: '#333333',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  submitButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    width: width - 48,
    maxHeight: height * 0.7,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  cityList: {
    maxHeight: 400,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  cityItemSelected: {
    backgroundColor: '#333333',
  },
  cityItemText: {
    fontSize: 16,
    color: '#ffffff',
  },
  cityItemTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  cityItemCheck: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
}); 