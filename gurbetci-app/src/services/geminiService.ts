// gurbetci-app/src/services/geminiService.ts

interface GeminiResponse {
  title: string;
  content: string;
}

interface TranslationResult {
  success: boolean;
  data?: GeminiResponse;
  error?: string;
}

export class GeminiService {
  private apiKey: string;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key bulunamadı. .env dosyasını kontrol edin.');
    }
    this.apiKey = apiKey;
  }

  /**
   * Haberi Türkçe'ye çevirir ve başlık oluşturur
   */
  async translateNews(title: string, content: string): Promise<TranslationResult> {
    try {
      const prompt = `Bu haberi Türkçe'ye çevir, yanına farklı hiçbir şey ekleme. Sadece haberi türkçe'ye çevirerek bana yaz. Ve türkçe olarak bu habere bir başlık yaz. Cevabı şu şablonda gönder:

Başlık: [Türkçe başlık buraya]
Haber: [Türkçe haber içeriği buraya]

ÇEVRİLECEK HABER:
Başlık: ${title}
İçerik: ${content}`;

      console.log('Gemini API isteği gönderiliyor...');

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
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      console.log('Gemini API yanıt durumu:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API hata detayı:', errorText);
        throw new Error(`Gemini API hatası: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API yanıtı alındı');
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Gemini API yanıt yapısı:', JSON.stringify(data, null, 2));
        throw new Error('Gemini API\'den geçersiz yanıt yapısı');
      }

      const translatedText = data.candidates[0].content.parts[0].text;
      console.log('Çeviri metni alındı, parse ediliyor...');
      
      // Yanıtı parse et
      const titleMatch = translatedText.match(/Başlık:\s*(.*?)(?=\nHaber:|$)/s);
      const contentMatch = translatedText.match(/Haber:\s*(.*?)$/s);

      if (!titleMatch || !contentMatch) {
        console.error('Parse edilemeyen çeviri:', translatedText);
        throw new Error('Çeviri yanıtı parse edilemedi');
      }

      console.log('Çeviri başarıyla tamamlandı');

      return {
        success: true,
        data: {
          title: titleMatch[1].trim(),
          content: contentMatch[1].trim()
        }
      };

    } catch (error) {
      console.error('Gemini çeviri hatası:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  /**
   * API bağlantısını test eder
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Gemini API bağlantısı test ediliyor...');
      
      const testResponse = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Merhaba, bu bir test mesajıdır."
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 100,
          }
        })
      });

      console.log('Test yanıt durumu:', testResponse.status);
      
      if (testResponse.ok) {
        console.log('✅ Gemini API bağlantısı başarılı');
        return true;
      } else {
        const errorText = await testResponse.text();
        console.error('❌ Gemini API test hatası:', testResponse.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Gemini bağlantı testi hatası:', error);
      return false;
    }
  }

  /**
   * API key'in geçerli olup olmadığını kontrol eder
   */
  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Test"
            }]
          }]
        })
      });

      if (response.status === 400) {
        const data = await response.json();
        if (data.error && data.error.code === 400) {
          return { valid: true }; // 400 API key geçerli ama request eksik demek
        }
      }

      if (response.status === 403) {
        return { valid: false, error: 'API key geçersiz veya izinler yetersiz' };
      }

      if (response.status === 404) {
        return { valid: false, error: 'API endpoint bulunamadı - API key veya model adı hatalı olabilir' };
      }

      return { valid: response.ok };

    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Bağlantı hatası' 
      };
    }
  }
}

export const geminiService = new GeminiService(); 