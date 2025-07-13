import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  BackHandler,
  Alert,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, FONTS } from '../constants';
import { t } from '../i18n';
import { News, Service, RootStackParamList } from '../types';
import { newsService, serviceService } from '../services/supabase';

import AppHeader from '../components/AppHeader';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const { userProfile } = useAuth();
  const [latestNews, setLatestNews] = useState<News[]>([]);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#1A1A1A' : COLORS.background,
    surface: isDark ? '#2C2C2C' : COLORS.surface,
    text: isDark ? '#FFFFFF' : COLORS.text,
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : COLORS.textSecondary,
  };

  useEffect(() => {
    loadHomeData();
    
    // Android geri tuşu kontrolü
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    // Ana sayfadayken geri tuşuna basılırsa uygulamadan çıkış onayı göster
    Alert.alert(
      'Uygulamadan Çık',
      'Uygulamadan çıkmak istediğinize emin misiniz?',
      [
        {
          text: 'Hayır',
          onPress: () => null,
          style: 'cancel',
        },
        {
          text: 'Evet',
          onPress: () => BackHandler.exitApp(),
        },
      ],
      { cancelable: false }
    );
    return true; // Geri tuşu event'ini yakala
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Son haberleri ve popüler hizmetleri paralel olarak yükle
      const [newsResult, servicesResult] = await Promise.all([
        newsService.getNews(1, 5),
        serviceService.getPopularServices(),
      ]);

      setLatestNews(newsResult.data);
      setPopularServices(servicesResult || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };



  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays === 0) {
      if (diffInHours === 0) {
        return t('today');
      }
      return `${diffInHours} ${t('hoursAgo')}`;
    } else if (diffInDays === 1) {
      return t('yesterday');
    } else {
      return `${diffInDays} ${t('daysAgo')}`;
    }
  };

  const renderQuickActions = () => (
    <View style={[styles.quickActions, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Hızlı Erişim</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📰</Text>
          <Text style={[styles.quickActionText, { color: colors.text }]}>{t('news')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>🏢</Text>
          <Text style={[styles.quickActionText, { color: colors.text }]}>{t('services')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>👥</Text>
          <Text style={[styles.quickActionText, { color: colors.text }]}>{t('community')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Belgeler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLatestNews = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('latestNews')}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
        </TouchableOpacity>
      </View>
      
      {latestNews.map((news) => (
        <TouchableOpacity key={news.id} style={[styles.newsCard, { backgroundColor: colors.background }]}>
          <View style={styles.newsContent}>
            <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={2}>
              {news.title}
            </Text>
            <Text style={[styles.newsSummary, { color: colors.textSecondary }]} numberOfLines={2}>
              {news.summary}
            </Text>
            <View style={styles.newsFooter}>
              <Text style={[styles.newsDate, { color: colors.textSecondary }]}>{formatDate(news.publishedAt)}</Text>
              <Text style={[styles.newsAuthor, { color: colors.textSecondary }]}>{news.author}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPopularServices = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('popularServices')}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.servicesGrid}>
        {popularServices.map((service) => (
          <TouchableOpacity key={service.id} style={[styles.serviceCard, { backgroundColor: colors.background }]}>
            <Text style={styles.serviceIcon}>🏢</Text>
            <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={2}>
              {service.name}
            </Text>
            {service.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <AppHeader title="Ana Sayfa" />
        {renderQuickActions()}
        {renderLatestNews()}
        {renderPopularServices()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTS.medium,
    color: COLORS.textSecondary,
  },
  quickActions: {
    padding: SIZES.padding,
    marginTop: SIZES.base,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.medium,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: SIZES.small,
  },
  quickActionText: {
    fontSize: FONTS.small,
    textAlign: 'center',
  },
  section: {
    padding: SIZES.padding,
    marginTop: SIZES.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: FONTS.medium,
    color: COLORS.primary,
  },
  newsCard: {
    borderRadius: SIZES.radius,
    padding: SIZES.medium,
    marginBottom: SIZES.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    marginBottom: SIZES.small,
  },
  newsSummary: {
    fontSize: FONTS.small,
    marginBottom: SIZES.small,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsDate: {
    fontSize: FONTS.small,
  },
  newsAuthor: {
    fontSize: FONTS.small,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    borderRadius: SIZES.radius,
    padding: SIZES.medium,
    marginBottom: SIZES.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    position: 'relative',
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: SIZES.small,
  },
  serviceName: {
    fontSize: FONTS.small,
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: 'bold',
  },
}); 