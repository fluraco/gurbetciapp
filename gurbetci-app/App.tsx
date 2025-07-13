import React, { useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RootStackParamList } from './src/types';
import LiquidBottomBar from './src/components/LiquidBottomBar';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import PasswordInputScreen from './src/screens/PasswordInputScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import PasswordResetOTPScreen from './src/screens/PasswordResetOTPScreen';
import NewPasswordScreen from './src/screens/NewPasswordScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import UserTypeSelectionScreen from './src/screens/UserTypeSelectionScreen';
import IndividualProfileScreen from './src/screens/IndividualProfileScreen';
import CorporateProfileScreen from './src/screens/CorporateProfileScreen';
import NewsScreen from './src/screens/NewsScreen';
import NewsDetailScreen from './src/screens/NewsDetailScreen';
import AdsScreen from './src/screens/AdsScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import MessagesScreen from './src/screens/MessagesScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Deep link configuration
const linking = {
  prefixes: ['gurbetci://'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      Login: 'login',
      OTPVerification: 'auth/verify',
      PasswordReset: 'auth/reset-password',
      PasswordResetOTP: 'auth/reset-password-otp',
      NewPassword: 'auth/new-password',
      UserTypeSelection: 'user-type',
      MainTabs: {
        screens: {
          News: 'news',
          Ads: 'ads',
          Discover: 'discover',
          Messages: 'messages',
        },
      },
      NewsDetail: 'news/:newsId',
    },
  },
};

// Main Tabs Component with Custom Bottom Bar
function MainTabs() {
  const [activeTab, setActiveTab] = useState('news');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
  };

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        const handleTabPress = (tabId: string) => {
          setActiveTab(tabId);
          
          // Tab'lere göre navigation yönlendirmesi
          switch (tabId) {
            case 'news':
              props.navigation.navigate('News');
              break;
            case 'ads':
              props.navigation.navigate('Ads');
              break;
            case 'discover':
              props.navigation.navigate('Discover');
              break;
            case 'messages':
              props.navigation.navigate('Messages');
              break;
            default:
              break;
          }
        };

        // Aktif tab'ı route'a göre belirle
        const routeName = props.state.routes[props.state.index].name.toLowerCase();
        
        return (
          <LiquidBottomBar
            activeTab={routeName}
            onTabPress={handleTabPress}
          />
        );
      }}
    >
      <Tab.Screen name="News" component={NewsScreen} />
      <Tab.Screen name="Ads" component={AdsScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, userProfile, loading, checkAuthStatus } = useAuth();

  useEffect(() => {
    // Uygulama açıldığında kullanıcı durumunu kontrol et
    checkAuthStatus();
  }, []);

  if (loading) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
          }}
          initialRouteName="Splash"
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Kullanıcı giriş yapmış ve profili var ise direkt ana sayfaya yönlendir
  const shouldShowMainApp = user && userProfile;

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
        initialRouteName={shouldShowMainApp ? "MainTabs" : "Splash"}
      >
        {shouldShowMainApp ? (
          // Kullanıcı giriş yapmış - Ana uygulama
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          </>
        ) : (
          // Kullanıcı giriş yapmamış - Auth flow
          <>
            {/* App Flow */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            
            {/* Auth Flow Screens */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="PasswordInput" component={PasswordInputScreen} />
            <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
            <Stack.Screen name="PasswordResetOTP" component={PasswordResetOTPScreen} />
            <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
            <Stack.Screen name="IndividualProfile" component={IndividualProfileScreen} />
            <Stack.Screen name="CorporateProfile" component={CorporateProfileScreen} />
            
            {/* Main App Tabs */}
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
