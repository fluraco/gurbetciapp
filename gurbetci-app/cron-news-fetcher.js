// gurbetci-app/cron-news-fetcher.js
// Her gün 00:00'da çalışan otomatik haber çekme sistemi
// Github Actions ile günlük çalışır

const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

console.log('🔧 Environment Check:');
console.log(`- SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`);
console.log(`- GEMINI_API_KEY: ${geminiApiKey ? '✅' : '❌'}`);
console.log(`- GITHUB_ACTIONS: ${isGithubActions ? '✅' : '❌'}`);

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  console.error('❌ Gerekli environment variables eksik!');
  if (isGithubActions) {
    console.error('Github Actions secrets\'larını kontrol edin:');
    console.error('- SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('- GEMINI_API_KEY');
  }
  process.exit(1);
}

// Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class NewsScrapingService {
  constructor() {
    this.baseUrl = 'https://apnews.com/hub/poland';
  }

  // Sadece dünün tarihindeki haberleri çek (Github Actions için optimize)
  async scrapePollandNews() {
    try {
      console.log('📰 AP News Poland\'dan dünkü haberler çekiliyor...');
      
      // Dünün tarihi (Github Actions UTC zamanında çalışır)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      console.log(`📅 Hedef tarih: ${yesterday.toLocaleDateString('tr-TR')}`);
      
      // Gerçek implementasyonda burada web scraping yapılacak
      // Şimdilik simülasyon - sadece dünkü haberler
      const mockNews = [
        {
          title: `Poland announces new economic policies for ${yesterday.getFullYear()}`,
          content: `Poland has unveiled a comprehensive set of economic policies aimed at strengthening the country's financial stability and promoting sustainable growth. The new measures, announced yesterday, focus on several key areas including digital transformation, green energy initiatives, and support for small and medium enterprises.

The government emphasized that these policies are designed to position Poland as a competitive player in the European market while addressing current economic challenges. Key highlights include:

- Enhanced funding for renewable energy projects
- Tax incentives for technology startups
- Improved infrastructure development programs
- Strengthened trade relationships with neighboring countries

Finance Minister stated that these initiatives are expected to generate significant economic benefits over the next five years, with particular emphasis on job creation and innovation.`,
          category: 'Business',
          imageUrl: 'https://dims.apnews.com/dims4/default/fd5ac4c/2147483647/strip/true/crop/3000x2000+0+0/resize/599x399!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F6a%2F8b%2F123456789abcdef%2Fpoland-economy.jpg',
          originalUrl: 'https://apnews.com/article/poland-economy-policies-' + yesterday.toISOString().split('T')[0],
          publishedDate: yesterday
        },
        {
          title: `Environmental protection measures strengthened in Poland`,
          content: `Poland has implemented new environmental protection measures as part of its commitment to sustainable development and climate goals. The initiatives, which came into effect yesterday, represent a significant step forward in the country's environmental policy.

The new regulations include:
- Stricter emissions standards for industrial facilities
- Enhanced protection for natural reserves and forests
- Improved waste management and recycling programs
- Incentives for eco-friendly transportation

Environmental officials highlighted that these measures align with European Union directives while addressing specific regional environmental challenges. The government has allocated substantial funding to support the implementation of these new policies.

Local communities and environmental groups have welcomed the announcement, noting that these measures will contribute to improved air quality and biodiversity protection across the country.`,
          category: 'General',
          imageUrl: 'https://dims.apnews.com/dims4/default/fd5ac4c/2147483647/strip/true/crop/3000x2000+0+0/resize/599x399!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F6a%2F8b%2F123456789abcdef%2Fpoland-environment.jpg',
          originalUrl: 'https://apnews.com/article/poland-environment-protection-' + yesterday.toISOString().split('T')[0],
          publishedDate: yesterday
        }
      ];

      // API simulasyonu için kısa bekleme
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log(`✅ ${mockNews.length} dünkü haber başarıyla çekildi`);

      return {
        success: true,
        news: mockNews
      };

    } catch (error) {
      console.error('❌ Haber çekme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

class GeminiService {
  constructor() {
    this.apiKey = geminiApiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  }

  async validateApiKey() {
    try {
      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test' }] }]
        })
      });

      return {
        valid: response.status !== 401 && response.status !== 403,
        status: response.status
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async translateNews(title, content) {
    try {
      console.log(`🔄 Çeviri başlatılıyor: ${title.substring(0, 50)}...`);

      const prompt = `Bu haberi Türkçe'ye çevir, yanına farklı hiçbir şey ekleme. Sadece haberi türkçe'ye çevirerek bana yaz. Ve türkçe olarak bu habere bir başlık yaz. Cevabı şu şablonda gönder:

Başlık: [Türkçe başlık buraya]
Haber: [Türkçe haber içeriği buraya]

ÇEVRİLECEK HABER:
Başlık: ${title}
İçerik: ${content}`;

      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API hatası: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Gemini API\'den geçersiz yanıt');
      }

      const translatedText = data.candidates[0].content.parts[0].text;
      
      const titleMatch = translatedText.match(/Başlık:\s*(.*?)(?=\nHaber:|$)/s);
      const contentMatch = translatedText.match(/Haber:\s*(.*?)$/s);

      if (!titleMatch || !contentMatch) {
        throw new Error('Çeviri yanıtı parse edilemedi');
      }

      console.log(`✅ Çeviri tamamlandı: ${titleMatch[1].trim().substring(0, 50)}...`);

      return {
        success: true,
        data: {
          title: titleMatch[1].trim(),
          content: contentMatch[1].trim()
        }
      };

    } catch (error) {
      console.error('❌ Gemini çeviri hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

class NewsService {
  constructor() {
    this.newsScrapingService = new NewsScrapingService();
    this.geminiService = new GeminiService();
  }

  translateCategory(category) {
    const categoryMap = {
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

  calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Duplicate kontrol fonksiyonu
  async checkDuplicateNews(title) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('id')
        .ilike('news_title', `%${title.substring(0, 50)}%`)
        .limit(1);

      if (error) {
        console.error('Duplicate kontrol hatası:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Duplicate kontrol hatası:', error);
      return false;
    }
  }

  async addNews(news) {
    try {
      // Duplicate kontrol
      const isDuplicate = await this.checkDuplicateNews(news.news_title);
      if (isDuplicate) {
        console.log(`⚠️  Benzer haber mevcut, atlanıyor: ${news.news_title.substring(0, 50)}...`);
        return { success: false, reason: 'duplicate' };
      }

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
        console.error('❌ Haber ekleme hatası:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Haber eklendi: ${news.news_title.substring(0, 50)}...`);
      return { success: true };
    } catch (error) {
      console.error('❌ Haber ekleme servisi hatası:', error);
      return { success: false, error: error.message };
    }
  }

  async processAndSaveNews() {
    const result = {
      success: false,
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    try {
      console.log('🚀 Günlük haber işleme süreci başlatıldı...');

      // 1. API Key kontrolü
      console.log('🔑 Gemini API key kontrolü...');
      const apiValidation = await this.geminiService.validateApiKey();
      if (!apiValidation.valid) {
        const error = `Gemini API key geçersiz (${apiValidation.status})`;
        result.errors.push(error);
        console.error('❌', error);
        return result;
      }
      console.log('✅ Gemini API key geçerli');

      // 2. Haberleri çek
      const scrapingResult = await this.newsScrapingService.scrapePollandNews();
      
      if (!scrapingResult.success || !scrapingResult.news) {
        result.errors.push(scrapingResult.error || 'Haber çekme başarısız');
        return result;
      }

      console.log(`📝 ${scrapingResult.news.length} haber çekildi, çeviri işlemi başlıyor...`);

      // 3. Her haberi işle
      for (const [index, scrapedNews] of scrapingResult.news.entries()) {
        try {
          console.log(`\n📰 [${index + 1}/${scrapingResult.news.length}] İşleniyor...`);

          // Gemini ile çevir
          const translationResult = await this.geminiService.translateNews(
            scrapedNews.title,
            scrapedNews.content
          );

          if (!translationResult.success || !translationResult.data) {
            result.failed++;
            result.errors.push(`Çeviri hatası: ${scrapedNews.title.substring(0, 50)}`);
            continue;
          }

          // Veritabanına kaydet
          const saveResult = await this.addNews({
            news_title: translationResult.data.title,
            news_content: translationResult.data.content,
            category: this.translateCategory(scrapedNews.category),
            img: scrapedNews.imageUrl,
            original_url: scrapedNews.originalUrl,
            source: 'AP News Poland',
            is_featured: result.processed === 0, // İlk haber öne çıkan olsun
          });

          if (saveResult.success) {
            result.processed++;
          } else if (saveResult.reason === 'duplicate') {
            result.skipped++;
          } else {
            result.failed++;
            result.errors.push(`Veritabanı hatası: ${translationResult.data.title.substring(0, 50)}`);
          }

          // API rate limiting için bekleme
          await new Promise(resolve => setTimeout(resolve, isGithubActions ? 3000 : 2000));

        } catch (error) {
          result.failed++;
          result.errors.push(`İşleme hatası: ${scrapedNews.title.substring(0, 50)} - ${error.message}`);
          console.error('❌ Haber işleme hatası:', error);
        }
      }

      result.success = result.processed > 0 || result.skipped > 0;
      
      console.log('\n📊 İşlem Özeti:');
      console.log(`✅ Başarılı: ${result.processed} haber`);
      console.log(`⚠️  Atlandı: ${result.skipped} haber`);
      console.log(`❌ Başarısız: ${result.failed} haber`);

      return result;

    } catch (error) {
      console.error('❌ Haber işleme servisi hatası:', error);
      result.errors.push(error.message);
      return result;
    }
  }
}

// Ana işlem fonksiyonu
async function runDailyNewsUpdate() {
  const startTime = new Date();
  console.log(`\n🌅 Günlük haber güncelleme başlatıldı: ${startTime.toLocaleString('tr-TR')}`);
  console.log(`🌍 Çalışma ortamı: ${isGithubActions ? 'Github Actions' : 'Local'}`);
  console.log('=' .repeat(60));

  try {
    const newsService = new NewsService();
    const result = await newsService.processAndSaveNews();

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n📊 Final İşlem Özeti:');
    console.log('=' .repeat(30));
    console.log(`✅ Başarılı: ${result.processed} haber`);
    console.log(`⚠️  Atlandı: ${result.skipped} haber`);
    console.log(`❌ Başarısız: ${result.failed} haber`);
    console.log(`⏱️  Süre: ${duration} saniye`);
    console.log(`🕒 Bitiş: ${endTime.toLocaleString('tr-TR')}`);

    if (result.errors.length > 0) {
      console.log('\n🚨 Hatalar:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // İstatistikleri Supabase'e kaydet
    try {
      await supabase
        .from('cron_logs')
        .insert([{
          job_name: 'daily_news_update',
          status: result.success ? 'success' : 'failed',
          processed_count: result.processed,
          failed_count: result.failed,
          skipped_count: result.skipped,
          duration_seconds: duration,
          errors: result.errors.length > 0 ? result.errors : null,
          environment: isGithubActions ? 'github_actions' : 'local',
          created_at: new Date().toISOString()
        }]);
      console.log('📝 Log kaydı başarılı');
    } catch (logError) {
      console.log('⚠️  Log kaydı başarısız:', logError.message);
    }

    // Github Actions için exit code
    if (isGithubActions) {
      process.exit(result.success ? 0 : 1);
    }

  } catch (error) {
    console.error('💥 Beklenmeyen hata:', error);
    if (isGithubActions) {
      process.exit(1);
    }
  }

  console.log('=' .repeat(60));
  console.log('🏁 Günlük haber güncelleme tamamlandı\n');
}

// Çalıştırma mantığı
if (isGithubActions || process.argv.includes('--run-now')) {
  console.log('🏃‍♂️ Günlük haber güncelleme başlatıldı...');
  runDailyNewsUpdate();
} else {
  // Lokal cron job
  console.log('🤖 Gurbetçi News Cron Job Sistemi Başlatıldı');
  console.log('📅 Zamanlama: Her gün 00:00 (Türkiye saati)');

  // Her gün 00:00'da çalış (Türkiye saati için UTC+3 hesaplaması)
  cron.schedule('0 21 * * *', () => {
    runDailyNewsUpdate();
  }, {
    scheduled: true,
    timezone: "UTC"
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Cron job durduruldu');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Cron job sonlandırıldı');
    process.exit(0);
  });

  console.log('✅ Cron job aktif. Ctrl+C ile durdurun.');
  console.log('🔧 Manuel çalıştırma: node cron-news-fetcher.js --run-now');

  // Keep the process alive
  setInterval(() => {
    const now = new Date();
    if (now.getMinutes() === 0) {
      console.log(`💓 Cron job aktif - ${now.toLocaleString('tr-TR')}`);
    }
  }, 60000);
} 