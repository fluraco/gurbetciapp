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
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
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
        .select('user_id, username, first_name, last_name, is_active')
        .eq('user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        return { 
          success: false, 
          error: 'Yorum yapmak için önce profil bilgilerinizi tamamlamanız gerekiyor' 
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

      // Kullanıcı bilgilerini sadece user_profiles tablosundan al
      const userIds = comments.map(comment => comment.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Profil çekme hatası:', profilesError);
      }

      // Yorumları profil bilgileri ile birleştir
      const commentsWithProfiles = comments.map(comment => {
        const profile = profiles?.find(p => p.user_id === comment.user_id);
        
        // user_profiles tablosundan gelen veriler
        const userProfile = {
          username: profile?.username || 'Kullanıcı',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url || null
        };

        return {
          ...comment,
          user_profile: userProfile
        };
      });

      console.log('Comments with user_profiles data:', commentsWithProfiles.map(c => ({
        id: c.id,
        user_profile: c.user_profile
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