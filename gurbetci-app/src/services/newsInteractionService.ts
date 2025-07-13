// gurbetci-app/src/services/newsInteractionService.ts

import { supabase } from './supabase';

export interface NewsLike {
  id: string;
  news_id: string;
  user_id: string;
  created_at: string;
}

export interface NewsComment {
  id: string;
  news_id: string;
  user_id: string;
  comment_text: string;
  is_approved: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    phone?: string;
    email?: string;
    created_at: string; // users tablosundan katılma tarihi
  };
}

export interface NewsStats {
  like_count: number;
  comment_count: number;
  user_liked: boolean;
}

export class NewsInteractionService {
  
  /**
   * Haberi beğen/beğenmeme işlemi
   */
  async toggleLike(newsId: string): Promise<{ success: boolean; liked: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, liked: false, error: 'Beğenmek için giriş yapmalısınız' };
      }

      // Mevcut beğeniyi kontrol et
      const { data: existingLike } = await supabase
        .from('news_likes')
        .select('id')
        .eq('news_id', newsId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Beğeniyi kaldır
        const { error } = await supabase
          .from('news_likes')
          .delete()
          .eq('news_id', newsId)
          .eq('user_id', user.id);

        if (error) {
          return { success: false, liked: false, error: 'Beğeni kaldırılırken hata oluştu' };
        }

        return { success: true, liked: false };
      } else {
        // Beğeni ekle
        const { error } = await supabase
          .from('news_likes')
          .insert([{
            news_id: newsId,
            user_id: user.id
          }]);

        if (error) {
          return { success: false, liked: false, error: 'Beğeni eklenirken hata oluştu' };
        }

        return { success: true, liked: true };
      }
    } catch (error) {
      console.error('Beğeni toggle hatası:', error);
      return { success: false, liked: false, error: 'Beklenmeyen hata oluştu' };
    }
  }

  /**
   * Haber istatistiklerini getir (beğeni sayısı, yorum sayısı, kullanıcı beğenmiş mi)
   */
  async getNewsStats(newsId: string): Promise<NewsStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Beğeni sayısını getir
      const { count: likeCount } = await supabase
        .from('news_likes')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId);

      // Yorum sayısını getir
      const { count: commentCount } = await supabase
        .from('news_comments')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId)
        .eq('is_approved', true)
        .eq('is_deleted', false);

      // Kullanıcının beğenip beğenmediğini kontrol et
      let userLiked = false;
      if (user) {
        const { data: userLike } = await supabase
          .from('news_likes')
          .select('id')
          .eq('news_id', newsId)
          .eq('user_id', user.id)
          .single();

        userLiked = !!userLike;
      }

      return {
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
        user_liked: userLiked
      };
    } catch (error) {
      console.error('İstatistik getirme hatası:', error);
      return {
        like_count: 0,
        comment_count: 0,
        user_liked: false
      };
    }
  }

  /**
   * Yorum ekle
   */
  async addComment(newsId: string, commentText: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Yorum yapmak için giriş yapmalısınız' };
      }

      if (!commentText.trim() || commentText.length > 1000) {
        return { success: false, error: 'Yorum 1-1000 karakter arasında olmalıdır' };
      }

      // Kullanıcının user_profiles tablosunda profil bilgisi var mı kontrol et
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, first_name, last_name, is_active')
        .eq('id', user.id) // user_id değil id kullanıyoruz
        .single();

      console.log('Profile check for user:', user.id);
      console.log('Found profile:', userProfile);

      if (profileError) {
        console.error('Profile error:', profileError);
        return { 
          success: false, 
          error: 'Yorum yapmak için önce profil bilgilerinizi tamamlamanız gerekiyor' 
        };
      }

      if (!userProfile) {
        return { 
          success: false, 
          error: 'Profil bulunamadı. Lütfen profil bilgilerinizi tamamlayın' 
        };
      }

      if (!userProfile.is_active) {
        return { 
          success: false, 
          error: 'Hesabınız aktif değil. Lütfen profil ayarlarınızı kontrol edin' 
        };
      }

      // Yorumu ekle
      const { error } = await supabase
        .from('news_comments')
        .insert([{
          news_id: newsId,
          user_id: user.id,
          comment_text: commentText.trim()
        }]);

      if (error) {
        console.error('Yorum ekleme hatası:', error);
        return { success: false, error: 'Yorum eklenirken hata oluştu' };
      }

      return { success: true };
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      return { success: false, error: 'Beklenmeyen hata oluştu' };
    }
  }

  /**
   * Haberin yorumlarını getir
   */
  async getComments(newsId: string, limit: number = 20, offset: number = 0): Promise<NewsComment[]> {
    try {
      // Önce yorumları al
      const { data: comments, error: commentsError } = await supabase
        .from('news_comments')
        .select('*')
        .eq('news_id', newsId)
        .eq('is_approved', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (commentsError) {
        console.error('Yorum çekme hatası:', commentsError);
        return [];
      }

      if (!comments || comments.length === 0) {
        return [];
      }

      // Kullanıcı bilgilerini user_profiles tablosundan al - id field'ı ile
      const userIds = comments.map(comment => comment.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, first_name, last_name, avatar_url, phone, email')
        .in('id', userIds); // user_id değil id kullanıyoruz

      if (profilesError) {
        console.error('Profil çekme hatası:', profilesError);
      }

      // Users tablosundan created_at bilgisini al
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, phone, created_at')
        .in('id', userIds);

      if (usersError) {
        console.error('Users tablosu çekme hatası:', usersError);
      }

      console.log('Fetched profiles:', profiles);
      console.log('Fetched users:', users);

      // Yorumları profil bilgileri ile birleştir
      const commentsWithProfiles = comments.map(comment => {
        const profile = profiles?.find(p => p.id === comment.user_id); // id ile match
        const user = users?.find(u => u.id === comment.user_id);
        
        console.log(`Comment ${comment.id} - User ID: ${comment.user_id}`);
        console.log('Found profile:', profile);
        console.log('Found user:', user);
        
        // Akıllı username belirleme
        let finalUsername = 'Kullanıcı';
        let finalFirstName = '';
        let finalLastName = '';
        
        if (profile) {
          finalFirstName = profile.first_name || '';
          finalLastName = profile.last_name || '';
          
          // Username belirleme logic
          if (profile.username && profile.username !== 'Kullanıcı' && profile.username.trim() !== '') {
            finalUsername = profile.username;
          } else if (user?.email) {
            // Email'den username türet
            const emailUsername = user.email.split('@')[0];
            finalUsername = emailUsername;
          } else {
            finalUsername = 'Kullanıcı';
          }
        } else if (user?.email) {
          // Profil yoksa email'den username türet
          const emailUsername = user.email.split('@')[0];
          finalUsername = emailUsername;
        }
        
        // user_profiles tablosundan gelen veriler + users'tan created_at
        const userProfile = {
          user_id: comment.user_id,
          username: finalUsername,
          first_name: finalFirstName,
          last_name: finalLastName,
          avatar_url: profile?.avatar_url || null,
          phone: profile?.phone || '',
          email: profile?.email || user?.email || '',
          created_at: user?.created_at || '', // users tablosundan katılma tarihi
        };

        console.log('Final user profile:', userProfile);

        return {
          ...comment,
          user_profile: userProfile
        };
      });

      console.log('Final comments with profiles:', commentsWithProfiles.map(c => ({
        id: c.id,
        user_profile: {
          username: c.user_profile.username,
          first_name: c.user_profile.first_name,
          last_name: c.user_profile.last_name,
          created_at: c.user_profile.created_at
        }
      })));

      return commentsWithProfiles;
    } catch (error) {
      console.error('Yorum servisi hatası:', error);
      return [];
    }
  }

  /**
   * Kullanıcının yorumunu sil (soft delete)
   */
  async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Yetkisiz işlem' };
      }

      const { error } = await supabase
        .from('news_comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Yorum silme hatası:', error);
        return { success: false, error: 'Yorum silinirken hata oluştu' };
      }

      return { success: true };
    } catch (error) {
      console.error('Yorum silme hatası:', error);
      return { success: false, error: 'Beklenmeyen hata oluştu' };
    }
  }

  /**
   * Kullanıcının yorumunu güncelle
   */
  async updateComment(commentId: string, newText: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Yetkisiz işlem' };
      }

      if (!newText.trim() || newText.length > 1000) {
        return { success: false, error: 'Yorum 1-1000 karakter arasında olmalıdır' };
      }

      const { error } = await supabase
        .from('news_comments')
        .update({ comment_text: newText.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Yorum güncelleme hatası:', error);
        return { success: false, error: 'Yorum güncellenirken hata oluştu' };
      }

      return { success: true };
    } catch (error) {
      console.error('Yorum güncelleme hatası:', error);
      return { success: false, error: 'Beklenmeyen hata oluştu' };
    }
  }
}

export const newsInteractionService = new NewsInteractionService(); 