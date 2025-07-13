// gurbetci-app/src/components/UserCard.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Modal,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

interface UserProfile {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  company_name?: string;
  company_field?: string;
  user_type?: 'individual' | 'corporate';
  profile_picture?: string;
  bio?: string;
  created_at: string;
}

interface UserCardProps {
  visible: boolean;
  userProfile: UserProfile | null;
  onClose: () => void;
}

export default function UserCard({ visible, userProfile, onClose }: UserCardProps) {
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    overlay: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDisplayName = () => {
    if (!userProfile) return 'Kullanıcı';
    
    if (userProfile.user_type === 'corporate' && userProfile.company_name) {
      return userProfile.company_name;
    }
    
    if (userProfile.first_name && userProfile.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    
    if (userProfile.username) {
      return userProfile.username;
    }
    
    return 'Anonim Kullanıcı';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getUserTypeLabel = () => {
    if (!userProfile?.user_type) return '';
    return userProfile.user_type === 'corporate' ? 'Kurumsal' : 'Bireysel';
  };

  const getLocationText = () => {
    if (!userProfile) return '';
    
    const parts = [];
    if (userProfile.city) parts.push(userProfile.city);
    if (userProfile.country) parts.push(userProfile.country);
    
    return parts.join(', ');
  };

  const handleClose = () => {
    onClose();
  };

  const handleSendMessage = () => {
    // Mesaj gönderme özelliği
    Alert.alert(
      'Mesaj Gönder',
      `${getDisplayName()} kullanıcısına mesaj göndermek ister misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Mesaj Gönder', 
          onPress: () => {
            // Burada mesaj gönderme sayfasına yönlendirme yapılacak
            console.log('Mesaj gönderiliyor:', userProfile?.id);
            handleClose();
          }
        }
      ]
    );
  };

  const handleBlock = () => {
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${getDisplayName()} kullanıcısını engellemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Engelle', 
          style: 'destructive',
          onPress: () => {
            // Burada engelleme işlemi yapılacak
            console.log('Kullanıcı engelleniyor:', userProfile?.id);
            handleClose();
          }
        }
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Kullanıcıyı Şikayet Et',
      `${getDisplayName()} kullanıcısını şikayet etmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Şikayet Et', 
          style: 'destructive',
          onPress: () => {
            // Burada şikayet işlemi yapılacak
            console.log('Kullanıcı şikayet ediliyor:', userProfile?.id);
            handleClose();
          }
        }
      ]
    );
  };

  if (!userProfile) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}
            onPress={handleClose}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Kullanıcı Profili
          </Text>
          
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.buttonBg }]}
            onPress={handleReport}
          >
            <Ionicons name="flag-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={[styles.avatarText, { color: colors.accentText }]}>
                  {getInitials()}
                </Text>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.displayName, { color: colors.text }]}>
                  {getDisplayName()}
                </Text>
                
                {userProfile.username && (
                  <Text style={[styles.username, { color: colors.textSecondary }]}>
                    @{userProfile.username}
                  </Text>
                )}
                
                <View style={styles.typeContainer}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons 
                      name={userProfile.user_type === 'corporate' ? 'business-outline' : 'person-outline'} 
                      size={14} 
                      color={colors.textLight} 
                    />
                    <Text style={[styles.typeText, { color: colors.textLight }]}>
                      {getUserTypeLabel()} Üye
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bio Section */}
            {userProfile.bio && (
              <View style={styles.bioSection}>
                <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                  {userProfile.bio}
                </Text>
              </View>
            )}

            {/* Details Section */}
            <View style={styles.detailsSection}>
              {/* Location */}
              {getLocationText() && (
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={18} color={colors.textLight} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {getLocationText()}
                  </Text>
                </View>
              )}

              {/* Company Field (Corporate users) */}
              {userProfile.user_type === 'corporate' && userProfile.company_field && (
                <View style={styles.detailItem}>
                  <Ionicons name="briefcase-outline" size={18} color={colors.textLight} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {userProfile.company_field}
                  </Text>
                </View>
              )}

              {/* Join Date */}
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={colors.textLight} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {formatDate(userProfile.created_at)} tarihinde katıldı
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryAction, { backgroundColor: colors.accent }]}
              onPress={handleSendMessage}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.accentText} />
              <Text style={[styles.actionButtonText, { color: colors.accentText }]}>
                Mesaj Gönder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleBlock}
            >
              <Ionicons name="ban-outline" size={20} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Engelle
              </Text>
            </TouchableOpacity>
          </View>

          {/* Safety Notice */}
          <View style={[styles.safetyNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textLight} />
            <Text style={[styles.safetyText, { color: colors.textLight }]}>
              Güvenliğiniz için kişisel bilgilerinizi paylaşmayın ve şüpheli davranışları bildirin.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bioSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  detailsSection: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  primaryAction: {
    // Primary button styles
  },
  secondaryAction: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  safetyText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
}); 