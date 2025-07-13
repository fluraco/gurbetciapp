// gurbetci-app/src/services/newsService.ts

import { supabase } from './supabase';
import { geminiService } from './geminiService';
import { newsScrapingService, ScrapedNews } from './newsScrapingService';

export interface NewsItem {
  id: string;
  news_title: string;
  news_content: string;
  category: string;
  img?: string;
  original_url?: string;
  source: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  read_time: number;
  author: string;
  status: string;
}

export interface ProcessNewsResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

export class NewsService {
  
  /**
   * Veritabanından haberleri çeker
   */
  async getNews(limit: number = 20, offset: number = 0): Promise<NewsItem[]> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Haber çekme hatası:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Haber servisi hatası:', error);
      return [];
    }
  }

  /**
   * Kategoriye göre haberleri çeker
   */
  async getNewsByCategory(category: string, limit: number = 20): Promise<NewsItem[]> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('category', category)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Kategori haber çekme hatası:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Kategori haber servisi hatası:', error);
      return [];
    }
  }

  /**
   * Öne çıkan haberleri çeker
   */
  async getFeaturedNews(): Promise<NewsItem[]> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Öne çıkan haber çekme hatası:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Öne çıkan haber servisi hatası:', error);
      return [];
    }
  }

  /**
   * Mevcut kategorileri çeker
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('category')
        .eq('status', 'published');

      if (error) {
        console.error('Kategori çekme hatası:', error);
        return [];
      }

      // Unique kategoriler
      const categories = [...new Set(data?.map(item => item.category) || [])];
      return categories;
    } catch (error) {
      console.error('Kategori servisi hatası:', error);
      return [];
    }
  }

  /**
   * Tek bir haberi ID ile çeker
   */
  async getNewsById(id: string): Promise<NewsItem | null> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Haber detay çekme hatası:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Haber detay servisi hatası:', error);
      return null;
    }
  }

  /**
   * Yeni haber ekler
   */
  async addNews(news: Partial<NewsItem>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('news')
        .insert([{
          news_title: news.news_title,
          news_content: news.news_content,
          category: news.category,
          img: news.img,
          original_url: news.original_url,
          source: news.source || 'AP News Poland',
          is_featured: news.is_featured || false,
          read_time: news.read_time || this.calculateReadTime(news.news_content || ''),
          author: news.author || 'Gurbetçi News',
          status: 'published'
        }]);

      if (error) {
        console.error('Haber ekleme hatası:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Haber ekleme servisi hatası:', error);
      return false;
    }
  }

  /**
   * Okuma süresini hesaplar (dakika)
   */
  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200; // Ortalama okuma hızı
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * AP News'den haberleri çekip işler ve veritabanına kaydeder
   */
  async processAndSaveNews(): Promise<ProcessNewsResult> {
    const result: ProcessNewsResult = {
      success: false,
      processed: 0,
      failed: 0,
      errors: []
    };

    try {
      console.log('Haber işleme süreci başlatıldı...');

      // 1. Haberleri çek
      const scrapingResult = await newsScrapingService.scrapePollandNews();
      
      if (!scrapingResult.success || !scrapingResult.news) {
        result.errors.push(scrapingResult.error || 'Haber çekme başarısız');
        return result;
      }

      console.log(`${scrapingResult.news.length} haber çekildi, çeviri işlemi başlıyor...`);

      // 2. Her haberi işle
      for (const scrapedNews of scrapingResult.news) {
        try {
          // Gemini ile çevir
          const translationResult = await geminiService.translateNews(
            scrapedNews.title,
            scrapedNews.content
          );

          if (!translationResult.success || !translationResult.data) {
            result.failed++;
            result.errors.push(`Çeviri hatası: ${scrapedNews.title}`);
            continue;
          }

          // Veritabanına kaydet
          const saveSuccess = await this.addNews({
            news_title: translationResult.data.title,
            news_content: translationResult.data.content,
            category: this.translateCategory(scrapedNews.category),
            img: scrapedNews.imageUrl,
            original_url: scrapedNews.originalUrl,
            source: 'AP News Poland',
            is_featured: result.processed === 0, // İlk haber öne çıkan olsun
          });

          if (saveSuccess) {
            result.processed++;
            console.log(`✅ İşlendi: ${translationResult.data.title}`);
          } else {
            result.failed++;
            result.errors.push(`Veritabanı hatası: ${translationResult.data.title}`);
          }

          // API rate limiting için kısa bekleme
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          result.failed++;
          result.errors.push(`İşleme hatası: ${scrapedNews.title} - ${error}`);
          console.error('Haber işleme hatası:', error);
        }
      }

      result.success = result.processed > 0;
      console.log(`Haber işleme tamamlandı: ${result.processed} başarılı, ${result.failed} başarısız`);

      return result;

    } catch (error) {
      console.error('Haber işleme servisi hatası:', error);
      result.errors.push(error instanceof Error ? error.message : 'Bilinmeyen hata');
      return result;
    }
  }

  /**
   * Kategori isimlerini Türkçe'ye çevirir
   */
  private translateCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'Politics': 'Politika',
      'Health': 'Sağlık',
      'Technology': 'Teknoloji',
      'Business': 'İş',
      'Sports': 'Spor',
      'World': 'Dünya',
      'General': 'Genel',
      'Education': 'Eğitim',
      'Entertainment': 'Eğlence',
      'Travel': 'Seyahat',
      'Lifestyle': 'Yaşam'
    };

    return categoryMap[category] || category;
  }

  /**
   * Test fonksiyonu - API'lerin çalışıp çalışmadığını kontrol eder
   */
  async testServices(): Promise<boolean> {
    try {
      console.log('Servis testleri başlatıldı...');
      
      // Gemini test
      const geminiTest = await geminiService.testConnection();
      console.log('Gemini API:', geminiTest ? '✅' : '❌');
      
      // Supabase test
      const { data, error } = await supabase.from('news').select('count', { count: 'exact' });
      const supabaseTest = !error;
      console.log('Supabase:', supabaseTest ? '✅' : '❌');
      
      return geminiTest && supabaseTest;
    } catch (error) {
      console.error('Servis test hatası:', error);
      return false;
    }
  }

  // Haberi okundu olarak işaretle
  async markAsRead(newsId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Kullanıcı girişi gerekli' };
      }

      // Önce kontrol et, daha önce okunmuş mu
      const { data: existing } = await supabase
        .from('news_read_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('news_id', newsId)
        .single();

      if (existing) {
        return { success: true }; // Zaten okunmuş
      }

      // Yeni okuma kaydı ekle
      const { error } = await supabase
        .from('news_read_history')
        .insert([{
          user_id: user.id,
          news_id: newsId,
          read_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Okuma kaydı ekleme hatası:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Okuma işaretleme hatası:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
      };
    }
  }

  // Kullanıcının okuduğu haberleri getir
  async getReadNewsIds(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('news_read_history')
        .select('news_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Okunan haberler getirme hatası:', error);
        return [];
      }

      return data.map(item => item.news_id);
    } catch (error) {
      console.error('Okunan haberler getirme hatası:', error);
      return [];
    }
  }

  // Haber listesi ile birlikte okunma durumunu getir
  async getNewsWithReadStatus(limit: number = 20, offset: number = 0): Promise<(NewsItem & { isRead?: boolean })[]> {
    try {
      const [newsData, readNewsIds] = await Promise.all([
        this.getNews(limit, offset),
        this.getReadNewsIds()
      ]);

      return newsData.map(news => ({
        ...news,
        isRead: readNewsIds.includes(news.id)
      }));
    } catch (error) {
      console.error('Haber listesi okuma durumu hatası:', error);
      return [];
    }
  }

  // Belirli bir haberin okunma durumunu kontrol et
  async isNewsRead(newsId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('news_read_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('news_id', newsId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }
}

export const newsService = new NewsService(); 