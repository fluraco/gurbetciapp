import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  BackHandler,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { UserType, AuthMethod } from '../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface UserTypeSelectionScreenProps {
  navigation: any;
  route: {
    params: {
      contact: string;
      method: AuthMethod;
    };
  };
}

export default function UserTypeSelectionScreen({
  navigation,
  route,
}: UserTypeSelectionScreenProps) {
  const { contact, method } = route.params || { contact: '', method: 'email' as AuthMethod };
  const [selectedType, setSelectedType] = useState<UserType | null>(null);

  useEffect(() => {
    if (!contact) {
      console.log('No contact info, redirecting to login');
      navigation.navigate('Login');
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [contact, navigation]);

  const handleBackPress = () => {
    Alert.alert(
      'Profil Oluşturma Gerekli',
      'Hesap türünüzü seçerek profil oluşturma işlemini tamamlamanız gerekmektedir.',
      [{ text: 'Tamam' }]
    );
    return true;
  };

  const handleContinue = () => {
    if (!selectedType) return;

    if (selectedType === 'individual') {
      navigation.navigate('IndividualProfile', { contact, method });
    } else {
      navigation.navigate('CorporateProfile', { contact, method });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />
      
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>G</Text>
            </View>
          </View>
          <Text style={styles.title}>Hesap Türü Seçin</Text>
          <Text style={styles.subtitle}>
            Size en uygun hesap türünü seçerek devam edin
          </Text>
        </View>

        {/* Options Section */}
        <View style={styles.optionsSection}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'individual' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedType('individual')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedType === 'individual' ? ['#ffffff', '#f8f9fa'] : ['#1a1a1a', '#2a2a2a']}
              style={styles.optionGradient}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionIconContainer,
                  selectedType === 'individual' && styles.optionIconContainerSelected
                ]}>
                  <Text style={[
                    styles.optionIcon,
                    selectedType === 'individual' && styles.optionIconSelected
                  ]}>👤</Text>
                </View>
                <Text style={[
                  styles.optionTitle,
                  selectedType === 'individual' && styles.optionTitleSelected
                ]}>
                  Bireysel Hesap
                </Text>
                <Text style={[
                  styles.optionDescription,
                  selectedType === 'individual' && styles.optionDescriptionSelected
                ]}>
                  Uygulamadaki tüm özelliklerden faydalanabilirsin. Haberleri oku, sohbet et, ilan ver.
                </Text>
                <View style={[
                  styles.radioButton,
                  selectedType === 'individual' && styles.radioButtonSelected,
                ]}>
                  {selectedType === 'individual' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'corporate' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedType('corporate')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedType === 'corporate' ? ['#ffffff', '#f8f9fa'] : ['#1a1a1a', '#2a2a2a']}
              style={styles.optionGradient}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionIconContainer,
                  selectedType === 'corporate' && styles.optionIconContainerSelected
                ]}>
                  <Text style={[
                    styles.optionIcon,
                    selectedType === 'corporate' && styles.optionIconSelected
                  ]}>🏢</Text>
                </View>
                <Text style={[
                  styles.optionTitle,
                  selectedType === 'corporate' && styles.optionTitleSelected
                ]}>
                  Kurumsal Hesap
                </Text>
                <Text style={[
                  styles.optionDescription,
                  selectedType === 'corporate' && styles.optionDescriptionSelected
                ]}>
                  Bulunduğun ülkede resmi bir şirkete sahipsen, şirket olarak uygulamaya kaydol, ilan ver ve gruplara kurumsal kimliğinle katıl.
                </Text>
                <View style={[
                  styles.radioButton,
                  selectedType === 'corporate' && styles.radioButtonSelected,
                ]}>
                  {selectedType === 'corporate' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedType && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedType}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedType ? ['#ffffff', '#f8f9fa'] : ['#333333', '#444444']}
              style={styles.continueButtonGradient}
            >
              <Text style={[
                styles.continueButtonText,
                !selectedType && styles.continueButtonTextDisabled
              ]}>
                Devam Et
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  optionsSection: {
    flex: 1,
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  optionCardSelected: {
    shadowColor: '#ffffff',
    shadowOpacity: 0.3,
    elevation: 12,
  },
  optionGradient: {
    borderRadius: 24,
    padding: 2,
  },
  optionContent: {
    backgroundColor: 'transparent',
    borderRadius: 22,
    padding: 24,
    minHeight: 160,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionIconContainerSelected: {
    backgroundColor: '#f0f0f0',
  },
  optionIcon: {
    fontSize: 28,
  },
  optionIconSelected: {
    fontSize: 28,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  optionTitleSelected: {
    color: '#000000',
  },
  optionDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
    flex: 1,
  },
  optionDescriptionSelected: {
    color: '#666666',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  radioButtonSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  buttonSection: {
    paddingBottom: Platform.OS === 'android' ? 24 : 32,
  },
  continueButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonDisabled: {
    shadowColor: '#333333',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  continueButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
  },
  continueButtonTextDisabled: {
    color: '#999999',
  },
}); 