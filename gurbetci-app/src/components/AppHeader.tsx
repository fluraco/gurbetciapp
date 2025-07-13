import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export default function AppHeader({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
}: AppHeaderProps) {
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Saate göre selamlama
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Günaydın';
    if (hour >= 12 && hour < 17) return 'İyi Günler';
    if (hour >= 17 && hour < 22) return 'İyi Akşamlar';
    return 'İyi Geceler';
  };

  const colors = {
    titleText: isDark ? '#FFFFFF' : '#1A1A1A',
    greetingText: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 26, 26, 0.7)',
    nameText: isDark ? '#FFFFFF' : '#1A1A1A',
    iconColor: isDark ? '#FFFFFF' : '#1A1A1A',
    buttonBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  };

  const firstName = userProfile?.first_name || 'Kullanıcı';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.buttonBg }]}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={colors.iconColor} 
              />
            </TouchableOpacity>
          )}
          
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.titleText }]}>
              {title}
            </Text>
            <Text style={[styles.greeting, { color: colors.greetingText }]}>
              {getGreeting()}{' '}
              <Text style={[styles.name, { color: colors.nameText }]}>
                {firstName}
              </Text>
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          {rightComponent || (
            <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.buttonBg }]}>
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={colors.iconColor} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  name: {
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 