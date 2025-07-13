# Gemini API Kurulumu

## 🚀 Hızlı Kurulum

### 1. .env Dosyasına Eklenecek Değişkenler

.env dosyanızın sonuna aşağıdaki satırları ekleyin:

```bash
# Gemini AI API Key for news translation
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Gemini API Key Nasıl Alınır?

1. **Google AI Studio'ya gidin**: https://makersuite.google.com/app/apikey
2. **Google hesabınızla giriş yapın**
3. **"Create API Key"** butonuna tıklayın
4. **Projenizi seçin** (veya yeni proje oluşturun)
5. **API Key'i kopyalayın**
6. **.env dosyasındaki** `your_gemini_api_key_here` **yerine yapıştırın**

### 3. Test Etme

1. Uygulamayı başlatın: `npm start`
2. Haberler sayfasına gidin
3. Sağ üstteki **+** butonuna tıklayın
4. **"API Test"** seçeneğini seçin
5. Eğer "✅ Test Başarılı!" mesajı alırsanız, kurulum tamamdır!

## 🔧 Sorun Giderme

### Yaygın Hatalar ve Çözümleri

#### 1. **404 Hatası**
```
Error: Gemini API hatası: 404
```
**Çözüm**: API endpoint güncellenmiş. Bu dokümandaki adımları takip edin.

#### 2. **403 Hatası (Forbidden)**
```
Error: API key geçersiz veya izinler yetersiz
```
**Çözümler**:
- API key'i doğru kopyaladığınızdan emin olun
- API key'de boşluk veya özel karakter olmadığını kontrol edin
- Google AI Studio'da API key'in aktif olduğunu kontrol edin

#### 3. **API Key Bulunamadı**
```
Error: Gemini API key bulunamadı
```
**Çözümler**:
- .env dosyasının proje root'unda olduğunu kontrol edin
- .env dosyasında satır başlarında boşluk olmadığından emin olun
- Uygulamayı yeniden başlatın: `expo start --clear`

#### 4. **Network Hatası**
```
Error: Network request failed
```
**Çözümler**:
- İnternet bağlantınızı kontrol edin
- VPN kullanıyorsanız kapatmayı deneyin
- Firewall/antivirus engellemesi olup olmadığını kontrol edin

## 📋 Örnek .env Dosyası

```bash
# Existing environment variables
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase config
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# ... diğer Firebase ayarları

# App config
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_DEBUG_MODE=true

# Gemini AI API Key for news translation
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ⚠️ Güvenlik Notları

- **API Key'i asla public repository'ye commit etmeyin**
- **.env dosyası .gitignore'da olmalıdır**
- **Production'da environment variables kullanın**
- **API key'i sadece güvenilir kişilerle paylaşın**

## 📊 Kullanım Limitleri

- **Ücretsiz Plan**: Günde 1000 istek
- **Rate Limit**: Dakikada 60 istek
- **Token Limit**: İstek başına 32K token

## 🧪 Test Komutları

### Manuel API Test:
```javascript
// Console'da test
import { geminiService } from './src/services/geminiService';
await geminiService.testConnection();
```

### API Key Doğrulama:
```javascript
// Console'da doğrulama
import { geminiService } from './src/services/geminiService';
await geminiService.validateApiKey();
```

## 💡 İpuçları

1. **API Key Format**: `AIzaSyB` ile başlamalıdır
2. **Uzunluk**: Yaklaşık 39 karakter olmalıdır
3. **Test Modu**: Önce "API Test" ile test edin, sonra haberleri ekleyin
4. **Debug Modu**: `EXPO_PUBLIC_DEBUG_MODE=true` ile + butonu görünür

## 📞 Destek

Sorun yaşıyorsanız:
1. Console loglarını kontrol edin
2. API key'i yeniden oluşturmayı deneyin
3. [Google AI Studio](https://makersuite.google.com/) dökümanlarını inceleyin

---

**Not**: Bu API key haber çeviri sistemi için kullanılacaktır. AP News Poland'dan alınan haberler Gemini AI ile Türkçe'ye çevrilecektir. 