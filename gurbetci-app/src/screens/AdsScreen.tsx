import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';

import { RootStackParamList } from '../types';

type AdsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Ads'>;

interface Props {
  navigation: AdsScreenNavigationProp;
}

export default function AdsScreen({ navigation }: Props) {

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1A1A1A' : '#F8F9FA',
    surface: isDark ? '#2C2C2C' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 26, 0.7)',
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
              <AppHeader 
        title="İlanlar"
      />
        
        <View style={styles.content}>
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            İlanlar sayfası yakında...
          </Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            Burada iş ilanları, emlak ilanları ve diğer duyurular yer alacak.
          </Text>
        </View>
      </ScrollView>
      

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 