// gurbetci-app/src/screens/NewsDetailScreen.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { newsService, NewsItem } from '../services/newsService';
import { newsInteractionService, NewsComment, NewsStats } from '../services/newsInteractionService';
import { RootStackParamList } from '../types';
import UserCard from '../components/UserCard';

type NewsDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewsDetail'>;
type NewsDetailScreenRouteProp = RouteProp<RootStackParamList, 'NewsDetail'>;

interface Props {
  navigation: NewsDetailScreenNavigationProp;
  route: NewsDetailScreenRouteProp;
}

export default function NewsDetailScreen({ navigation, route }: Props) {
  const { newsId } = route.params;
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [newsStats, setNewsStats] = useState<NewsStats>({ like_count: 0, comment_count: 0, user_liked: false });
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);
  
  // UserCard için state'ler
  const [userCardVisible, setUserCardVisible] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { height: screenHeight } = Dimensions.get('window');

  // Premium siyah-beyaz renk paleti
  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    surface: isDark ? '#111111' : '#FAFAFA',
    cardBg: isDark ? '#1A1A1A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#CCCCCC' : '#666666',
    textLight: isDark ? '#999999' : '#888888',
    border: isDark ? '#333333' : '#E5E5E5',
    accent: isDark ? '#FFFFFF' : '#000000',
    accentText: isDark ? '#000000' : '#FFFFFF',
    buttonBg: isDark ? '#222222' : '#F5F5F5',
    likedHeart: '#FF4B4B',
    inputBg: isDark ? '#222222' : '#F8F8F8',
  };

  useEffect(() => {
    loadNewsDetail();

    // Klavye event listeners - iOS ve Android için optimize edilmiş
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        
        // Klavye açıldığında yorum input'una scroll - daha akıllı scroll
        setTimeout(() => {
          if (commentInputRef.current) {
            commentInputRef.current.measure((x, y, width, height, pageX, pageY) => {
              const targetY = pageY + height - (screenHeight - e.endCoordinates.height) + 50;
              if (targetY > 0) {
                scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
              }
            });
          }
        }, Platform.OS === 'ios' ? 100 : 300);
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [newsId, screenHeight]);

  useEffect(() => {
    if (news) {
      loadNewsStats();
      loadComments();
    }
  }, [news]);

  const loadNewsDetail = async () => {
    try {
      setLoading(true);
      const newsDetail = await newsService.getNewsById(newsId);
      setNews(newsDetail);
      
      // Haberi okundu olarak işaretle
      if (newsDetail) {
        await newsService.markAsRead(newsDetail.id);
      }
    } catch (error) {
      console.error('Haber detay yükleme hatası:', error);
      Alert.alert('Hata', 'Haber detayı yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadNewsStats = async () => {
    try {
      const stats = await newsInteractionService.getNewsStats(newsId);
      setNewsStats(stats);
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    }
  };

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const commentsData = await newsInteractionService.getComments(newsId);
      setComments(commentsData);
      console.log('Yorumlar yüklendi:', commentsData.length);
    } catch (error) {
      console.error('Yorumlar yükleme hatası:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const shareNews = async () => {
    if (!news) return;
    
    try {
      const shareContent = {
        title: news.news_title,
        message: `${news.news_title}\n\n${news.news_content.substring(0, 200)}${news.news_content.length > 200 ? '...' : ''}\n\nGurbetçi uygulamasından paylaşıldı.`,
      };

      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Haber paylaşıldı:', result.activityType);
        } else {
          console.log('Haber paylaşıldı');
        }
      }
    } catch (error) {
      console.error('Paylaşma hatası:', error);
      Alert.alert('Hata', 'Haber paylaşılırken bir hata oluştu.');
    }
  };

  const handleLike = async () => {
    try {
      const result = await newsInteractionService.toggleLike(newsId);
      
      if (result.success) {
        setNewsStats(prev => ({
          ...prev,
          user_liked: result.liked,
          like_count: result.liked ? prev.like_count + 1 : prev.like_count - 1
        }));
      } else {
        Alert.alert('Hata', result.error || 'Beğeni işleminde hata oluştu');
      }
    } catch (error) {
      console.error('Beğeni hatası:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const result = await newsInteractionService.addComment(newsId, newComment);

      if (result.success) {
        setNewComment('');
        commentInputRef.current?.blur();
        await loadComments();
        await loadNewsStats();
        Alert.alert('Başarılı', 'Yorumunuz eklendi!');
      } else {
        Alert.alert('Hata', result.error || 'Yorum eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentInputFocus = () => {
    // Input'a focus atıldığında klavye için hazırlık
    setIsKeyboardVisible(true);
  };

  const handleUserProfilePress = (userProfile: any) => {
    setSelectedUserProfile(userProfile);
    setUserCardVisible(true);
  };

  const handleCloseUserCard = () => {
    setUserCardVisible(false);
    setSelectedUserProfile(null);
  };

  const renderComment = (comment: NewsComment) => {
    // User display name logic - önce first_name + last_name, sonra username, son olarak Anonim
    const getDisplayName = () => {
      if (comment.user_profile?.first_name && comment.user_profile?.last_name) {
        return `${comment.user_profile.first_name} ${comment.user_profile.last_name}`;
      }
      if (comment.user_profile?.username && comment.user_profile.username !== 'Anonim') {
        return comment.user_profile.username;
      }
      return 'Anonim Kullanıcı';
    };

    const getInitials = () => {
      if (comment.user_profile?.first_name && comment.user_profile?.last_name) {
        return `${comment.user_profile.first_name[0]}${comment.user_profile.last_name[0]}`.toUpperCase();
      }
      if (comment.user_profile?.username && comment.user_profile.username !== 'Anonim') {
        return comment.user_profile.username[0].toUpperCase();
      }
      return 'A';
    };

    return (
      <TouchableOpacity 
        key={comment.id} 
        style={[styles.commentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => handleUserProfilePress(comment.user_profile)}
      >
        <View style={styles.commentHeader}>
          <TouchableOpacity 
            style={[styles.commentAvatar, { backgroundColor: colors.accent }]}
            onPress={() => handleUserProfilePress(comment.user_profile)}
          >
            <Text style={[styles.commentAvatarText, { color: colors.accentText }]}>
              {getInitials()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.commentInfo}
            onPress={() => handleUserProfilePress(comment.user_profile)}
          >
            <Text style={[styles.commentAuthor, { color: colors.text }]}>
              {getDisplayName()}
            </Text>
            <Text style={[styles.commentDate, { color: colors.textLight }]}>
              {formatTimeAgo(comment.created_at)}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.commentText, { color: colors.textSecondary }]}>
          {comment.comment_text}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerSkeleton} />
          <View style={[styles.headerButton, { backgroundColor: colors.buttonBg }]} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Haber yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!news) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.textLight} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Haber bulunamadı
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Bu haber mevcut değil veya kaldırılmış olabilir.
          </Text>
          <TouchableOpacity 
            style={[styles.errorButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.errorButtonText, { color: colors.accentText }]}>
              Geri Dön
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>Haber Detayı</Text>
        
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}
          onPress={shareNews}
        >
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Font Size Controls */}
      <View style={[styles.fontControls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.fontControlLabel, { color: colors.textSecondary }]}>
          Yazı Boyutu
        </Text>
        <View style={styles.fontButtonsContainer}>
          <TouchableOpacity 
            style={[styles.fontButton, { backgroundColor: colors.buttonBg }]}
            onPress={decreaseFontSize}
            disabled={fontSize <= 12}
          >
            <Ionicons name="remove" size={16} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.fontSizeIndicator, { color: colors.text }]}>
            {fontSize}
          </Text>
          
          <TouchableOpacity 
            style={[styles.fontButton, { backgroundColor: colors.buttonBg }]}
            onPress={increaseFontSize}
            disabled={fontSize >= 24}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent, 
            { 
              paddingBottom: isKeyboardVisible ? keyboardHeight + 200 : 200
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {news && (
            <>
              <View style={[styles.articleContainer, { backgroundColor: colors.cardBg }]}>
                {/* Article Header */}
                <View style={styles.articleHeader}>
                  <View style={styles.metaRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.categoryText, { color: colors.accentText }]}>
                        {news.category}
                      </Text>
                    </View>
                    <Text style={[styles.dateText, { color: colors.textLight }]}>
                      {formatDate(news.created_at)}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={[styles.articleTitle, { color: colors.text, fontSize: fontSize + 8 }]}>
                  {news.news_title}
                </Text>

                {/* Meta Info */}
                <View style={styles.metaInfo}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color={colors.textLight} />
                    <Text style={[styles.metaText, { color: colors.textLight }]}>
                      {news.read_time} dakika okuma
                    </Text>
                  </View>
                  
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={16} color={colors.textLight} />
                    <Text style={[styles.metaText, { color: colors.textLight }]}>
                      {news.author}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Content */}
                <Text style={[styles.articleContent, { color: colors.textSecondary, fontSize }]}>
                  {news.news_content}
                </Text>

                {/* Footer */}
                <View style={[styles.articleFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.footerInfo}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.textLight} />
                    <Text style={[styles.footerText, { color: colors.textLight }]}>
                      Bu haber Gurbetçi AI ile özetlenmiştir.
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.likeButton, { backgroundColor: newsStats.user_liked ? colors.likedHeart : colors.accent }]}
                    onPress={handleLike}
                  >
                    <Ionicons 
                      name={newsStats.user_liked ? "heart" : "heart-outline"} 
                      size={18} 
                      color={newsStats.user_liked ? colors.accentText : colors.accentText} 
                    />
                    <Text style={[styles.likeButtonText, { color: colors.accentText }]}>
                      {newsStats.like_count > 0 ? newsStats.like_count : 'Beğen'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Comments Section */}
              <View style={[styles.commentsSection, { backgroundColor: colors.cardBg }]}>
                <View style={styles.commentsSectionHeader}>
                  <Text style={[styles.commentsSectionTitle, { color: colors.text }]}>
                    Yorumlar
                  </Text>
                  <Text style={[styles.commentsCount, { color: colors.textLight }]}>
                    {newsStats.comment_count} yorum
                  </Text>
                </View>

                {/* Add Comment Section - Moved to the top */}
                <View style={[styles.addCommentContainer, { borderColor: colors.border }]}>
                  <TextInput
                    ref={commentInputRef}
                    style={[styles.commentInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                    placeholder="Yorumunuzu yazın..."
                    placeholderTextColor={colors.textLight}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    maxLength={1000}
                    onFocus={handleCommentInputFocus}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={[styles.submitCommentButton, { backgroundColor: colors.accent }]}
                    onPress={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color={colors.accentText} />
                    ) : (
                      <Ionicons name="send" size={18} color={colors.accentText} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Comments List */}
                {commentsLoading ? (
                  <View style={styles.commentsLoading}>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Yorumlar yükleniyor...
                    </Text>
                  </View>
                ) : comments.length === 0 ? (
                  <View style={styles.noComments}>
                    <Ionicons name="chatbubble-outline" size={32} color={colors.textLight} />
                    <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                      Henüz yorum yapılmamış
                    </Text>
                    <Text style={[styles.noCommentsSubtext, { color: colors.textLight }]}>
                      İlk yorumu siz yapın!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.commentsList}>
                    {comments.map((comment, index) => {
                      console.log(`Rendering comment ${index}:`, comment);
                      return renderComment(comment);
                    })}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* UserCard Modal */}
      <UserCard
        visible={userCardVisible}
        userProfile={selectedUserProfile}
        onClose={handleCloseUserCard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  keyboardView: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSkeleton: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    marginHorizontal: 20,
  },
  fontControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  fontControlLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fontButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeIndicator: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  articleContainer: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  articleHeader: {
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  articleTitle: {
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 24,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
    paddingBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginBottom: 24,
    marginTop: 8,
  },
  articleContent: {
    lineHeight: 28,
    marginBottom: 32,
    fontWeight: '400',
    paddingTop: 8,
    textAlign: 'justify',
    flexShrink: 1,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  likeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentsSection: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  commentsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  commentsCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  submitCommentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noCommentsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
    marginLeft: 44,
  },
}); 