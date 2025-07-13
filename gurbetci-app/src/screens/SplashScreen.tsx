import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../constants';
import { t } from '../i18n';

interface SplashScreenProps {
  navigation: any;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animasyonu başlat
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Onboarding kontrolü ve yönlendirme
    const checkOnboardingAndNavigate = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        // 2.5 saniye animasyon sonrası yönlendir
        setTimeout(() => {
          if (hasSeenOnboarding === 'true') {
            navigation.replace('Login');
          } else {
            navigation.replace('Onboarding');
          }
        }, 2500);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Hata durumunda onboarding'e yönlendir
        setTimeout(() => {
          navigation.replace('Onboarding');
        }, 2500);
      }
    };

    checkOnboardingAndNavigate();
  }, [scaleAnim, opacityAnim, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={COLORS.primaryGradient}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={styles.flag}>🇹🇷</Text>
            <Text style={styles.appTitle}>{t('appTitle')}</Text>
            <Text style={styles.appSubtitle}>{t('appSubtitle')}</Text>
          </Animated.View>
          
          <Animated.View
            style={[
              styles.loadingContainer,
              {
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.extraLarge * 2,
  },
  flag: {
    fontSize: 80,
    marginBottom: SIZES.extraLarge,
  },
  appTitle: {
    fontSize: FONTS.largeTitle + 8,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: SIZES.medium,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: FONTS.large,
    color: COLORS.surface,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: SIZES.padding,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: SIZES.extraLarge * 2,
    alignSelf: 'center',
  },
  loadingText: {
    fontSize: FONTS.medium,
    color: COLORS.surface,
    opacity: 0.8,
  },
}); 