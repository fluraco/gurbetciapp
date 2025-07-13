import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';

import { COLORS, SIZES, FONTS } from '../constants';
import { t } from '../i18n';
import { RootStackParamList } from '../types';
import { newsService, NewsItem } from '../services/newsService';

type NewsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'News'>;

interface Props {
  navigation: NewsScreenNavigationProp;
}

export default function NewsScreen({ navigation }: Props) {
  const [news, setNews] = useState<(NewsItem & { isRead?: boolean })[]>([]);
  const [filteredNews, setFilteredNews] = useState<(NewsItem & { isRead?: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [categories, setCategories] = useState<string[]>(['Tümü']);
  const [isProcessingNews, setIsProcessingNews] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(NewsItem & { isRead?: boolean })[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Debug mode kontrolü
  const isDebugMode = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

  // Premium siyah-beyaz renk paleti
  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    surface: isDark ? '#1A1A1A' : '#FAFAFA',
    cardBg: isDark ? '#111111' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#CCCCCC' : '#666666',
    textLight: isDark ? '#999999' : '#888888',
    border: isDark ? '#333333' : '#E5E5E5',
    accent: '#000000',
    categoryActive: isDark ? '#FFFFFF' : '#000000',
    categoryText: isDark ? '#000000' : '#FFFFFF',
    categoryInactive: isDark ? '#333333' : '#F0F0F0',
    overlay: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
    inputBg: isDark ? '#222222' : '#F8F8F8',
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Kategori değiştiğinde filtreleme yap
    applyFilters();
  }, [selectedCategory, news]);

  useEffect(() => {
    // Search query değiştiğinde arama yap
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      loadNews(),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadNews = async () => {
    try {
      const newsData = await newsService.getNewsWithReadStatus(20, 0);
      setNews(newsData);
    } catch (error) {
      console.error('Haber yükleme hatası:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await newsService.getCategories();
      setCategories(['Tümü', ...categoriesData]);
    } catch (error) {
      console.error('Kategori yükleme hatası:', error);
    }
  };

  const applyFilters = () => {
    const filtered = selectedCategory === 'Tümü' 
      ? news 
      : news.filter(item => item.category === selectedCategory);
    
    setFilteredNews(filtered);
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      
      // Basit client-side arama
      // Gelecekte server-side full-text search eklenebilir
      const query = searchQuery.toLowerCase();
      const results = news.filter(item => 
        item.news_title.toLowerCase().includes(query) ||
        item.news_content.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );

      setSearchResults(results);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMins} dakika önce`;
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} gün önce`;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const openSearch = () => {
    setSearchVisible(true);
  };

  const closeSearch = () => {
    setSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  // Debug: Haberleri manuel olarak işle ve ekle
  const handleAddNews = async () => {
    if (isProcessingNews) return;

    Alert.alert(
      'Haber Ekleme',
      'AP News Poland\'dan haberleri çekip çevirilip veritabanına eklensin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'API Test', 
          onPress: testGeminiAPI,
          style: 'default'
        },
        { 
          text: 'Haberleri Ekle', 
          onPress: processNews,
          style: 'default'
        }
      ]
    );
  };

  // Gemini API test fonksiyonu
  const testGeminiAPI = async () => {
    setIsProcessingNews(true);
    try {
      const { geminiService } = await import('../services/geminiService');
      
      console.log('API key kontrolü başlatılıyor...');
      const validation = await geminiService.validateApiKey();
      
      if (!validation.valid) {
        Alert.alert(
          'API Key Hatası',
          `Gemini API key'i geçersiz: ${validation.error}\n\nLütfen .env dosyasındaki EXPO_PUBLIC_GEMINI_API_KEY değerini kontrol edin.`
        );
        return;
      }

      console.log('API bağlantı testi başlatılıyor...');
      const connectionTest = await geminiService.testConnection();
      
      if (connectionTest) {
        Alert.alert(
          '✅ Test Başarılı!',
          'Gemini API bağlantısı çalışıyor. Artık haberleri çevirebiliriz.'
        );
      } else {
        Alert.alert(
          '❌ Test Başarısız',
          'Gemini API bağlantısında sorun var. Lütfen internet bağlantınızı ve API key\'inizi kontrol edin.'
        );
      }
    } catch (error) {
      console.error('API test hatası:', error);
      Alert.alert(
        'Test Hatası',
        `API test sırasında hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      );
    } finally {
      setIsProcessingNews(false);
    }
  };

  // Haberleri işleme fonksiyonu
  const processNews = async () => {
    setIsProcessingNews(true);
    try {
      console.log('Haber işleme süreci başlatılıyor...');
      const result = await newsService.processAndSaveNews();
      
      if (result.success) {
        Alert.alert(
          'Başarılı! 🎉',
          `${result.processed} haber başarıyla eklendi.\n${result.failed > 0 ? `${result.failed} haber başarısız oldu.` : ''}`,
          [{ text: 'Tamam', onPress: () => onRefresh() }]
        );
      } else {
        Alert.alert(
          'Hata ❌',
          `Haber ekleme başarısız:\n${result.errors.slice(0, 3).join('\n')}\n${result.errors.length > 3 ? `\n+${result.errors.length - 3} daha fazla hata...` : ''}`
        );
      }
    } catch (error) {
      console.error('Haber ekleme hatası:', error);
      Alert.alert(
        'Beklenmeyen Hata',
        `Haber ekleme sırasında beklenmeyen bir hata oluştu:\n${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      );
    } finally {
      setIsProcessingNews(false);
    }
  };



  const renderCategoryItem = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        {
          backgroundColor: selectedCategory === category 
            ? colors.categoryActive 
            : colors.categoryInactive,
          borderColor: colors.border,
        }
      ]}
      onPress={() => setSelectedCategory(category)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.categoryText,
          {
            color: selectedCategory === category 
              ? colors.categoryText
              : colors.textSecondary,
          }
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  const handleNewsPress = async (item: NewsItem & { isRead?: boolean }) => {
    if (searchVisible) {
      closeSearch();
    }
    
    // Haberi okundu olarak işaretle
    if (!item.isRead) {
      await newsService.markAsRead(item.id);
      // State'i güncelle
      setNews(prevNews => 
        prevNews.map(newsItem => 
          newsItem.id === item.id ? { ...newsItem, isRead: true } : newsItem
        )
      );
    }
    
    navigation.navigate('NewsDetail', { newsId: item.id });
  };

  const renderNewsItem = (item: NewsItem & { isRead?: boolean }, index: number, isSearchResult: boolean = false) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.newsCard, 
        { 
          backgroundColor: colors.cardBg, 
          borderColor: colors.border,
          marginBottom: !isSearchResult && index === filteredNews.length - 1 ? 100 : 16,
          opacity: item.isRead ? 0.6 : 1.0,
        }
      ]}
      activeOpacity={0.7}
      onPress={() => handleNewsPress(item)}
    >
      <View style={styles.newsContent}>
        <View style={styles.newsHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.categoryBadgeText, { color: colors.categoryText }]}>
              {item.category}
            </Text>
          </View>
          <Text style={[styles.newsDate, { color: colors.textLight }]}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        
        <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={3}>
          {item.news_title}
        </Text>
        
        <Text style={[styles.newsSummary, { color: colors.textSecondary }]} numberOfLines={3}>
          {item.news_content.length > 150 
            ? item.news_content.substring(0, 150) + '...'
            : item.news_content
          }
        </Text>
        
        <View style={styles.newsFooter}>
          <View style={styles.newsFooterLeft}>
            <Text style={[styles.readTime, { color: colors.textLight }]}>
              {item.read_time} dakika okuma
            </Text>
            {item.isRead && (
              <View style={[styles.readBadge, { backgroundColor: colors.textLight }]}>
                <Text style={[styles.readBadgeText, { color: colors.background }]}>
                  Okundu
                </Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchModal = () => (
    <Modal
      visible={searchVisible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={closeSearch}
    >
      <SafeAreaView style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        {/* Search Header */}
        <View style={[styles.searchHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.searchCloseButton, { backgroundColor: colors.surface }]}
            onPress={closeSearch}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.textLight} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Haber ara..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        <ScrollView 
          style={styles.searchScrollView}
          contentContainerStyle={styles.searchScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {searchLoading ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Aranıyor...
              </Text>
            </View>
          ) : searchQuery.length === 0 ? (
            <View style={styles.searchEmptyContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textLight} />
              <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>
                Haber Ara
              </Text>
              <Text style={[styles.searchEmptyText, { color: colors.textSecondary }]}>
                Başlık, içerik veya kategoriye göre haberleri arayabilirsiniz
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.searchEmptyContainer}>
              <Ionicons name="document-outline" size={48} color={colors.textLight} />
              <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>
                Sonuç bulunamadı
              </Text>
              <Text style={[styles.searchEmptyText, { color: colors.textSecondary }]}>
                "{searchQuery}" ile eşleşen haber bulunamadı
              </Text>
            </View>
          ) : (
            <View style={styles.searchResultsContainer}>
              <Text style={[styles.searchResultsTitle, { color: colors.text }]}>
                {searchResults.length} sonuç bulundu
              </Text>
              {searchResults.map((item, index) => renderNewsItem(item, index, true))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppHeader title="Haberler" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Haberler yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <AppHeader 
        title="Haberler"
        rightComponent={
          <View style={styles.headerButtons}>
            {isDebugMode && (
              <TouchableOpacity 
                style={[styles.debugButton, { backgroundColor: colors.accent }]}
                onPress={handleAddNews}
                disabled={isProcessingNews}
              >
                {isProcessingNews ? (
                  <ActivityIndicator size="small" color={colors.categoryText} />
                ) : (
                  <Ionicons name="add" size={20} color={colors.categoryText} />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.searchButton, { backgroundColor: colors.surface }]}
              onPress={openSearch}
            >
              <Ionicons 
                name="search-outline" 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(renderCategoryItem)}
          </ScrollView>
        </View>
        
                            {/* News Section */}
          <View style={styles.section}>
            {/* Simple Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {selectedCategory === 'Tümü' ? 'Tüm Haberler' : `${selectedCategory} Haberleri`}
              </Text>
              <Text style={[styles.newsCount, { color: colors.textLight }]}>
                {filteredNews.length} haber
              </Text>
            </View>
            
            {/* News Content */}
            <View>
              {filteredNews.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
                    <Ionicons name="newspaper-outline" size={32} color={colors.textLight} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Henüz haber yok
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {selectedCategory === 'Tümü' 
                      ? 'Henüz hiç haber eklenmemiş'
                      : `${selectedCategory} kategorisinde haber bulunmuyor`
                    }
                  </Text>
                </View>
              ) : (
                filteredNews.map((item, index) => renderNewsItem(item, index))
              )}
            </View>
          </View>
      </ScrollView>

      {/* Search Modal */}
      {renderSearchModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesSection: {
    paddingVertical: 24,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  newsCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  newsCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  newsContent: {
    padding: 20,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  newsDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  newsSummary: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  readTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  readBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  readBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Search Modal Styles
  searchContainer: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  searchScrollView: {
    flex: 1,
  },
  searchScrollContent: {
    padding: 20,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  searchEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 16,
  },
  searchEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchEmptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  searchResultsContainer: {
    gap: 16,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
}); 