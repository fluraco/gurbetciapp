# 📰 Gurbetçi Haberler Sistemi - Kapsamlı Kurulum Rehberi

## 🚀 Sistem Özellikleri

✅ **Beğeni Sistemi** - Kullanıcılar haberleri beğenebilir  
✅ **Yorumlar Sistemi** - Kullanıcılar yorum yapabilir  
✅ **Arama Fonksiyonu** - Haber başlığı/içeriği ile arama  
✅ **Otomatik Çeviri** - Gemini AI ile İngilizce → Türkçe  
✅ **Cron Job** - Her gün 00:00'da otomatik haber çekme  
✅ **Premium Tasarım** - Siyah-beyaz modern UI  

---

## 📋 Kurulum Süreci

### 1. **Veritabanı Kurulumu**

Supabase dashboard'unuzda şu SQL kodlarını çalıştırın:

```sql
-- Ana haber tablosu (zaten var)
-- database_news_system.sql dosyasındaki kodları çalıştırın

-- Beğeniler ve yorumlar için yeni tablolar
-- database_news_likes_comments.sql dosyasındaki kodları çalıştırın
```

### 2. **Gemini API Kurulumu**

1. [Google AI Studio](https://makersuite.google.com/app/apikey)'ya gidin
2. "Create API Key" ile yeni key oluşturun
3. `.env` dosyanıza ekleyin:

```bash
# Gemini AI API Key
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Mevcut Supabase değişkenleriniz
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Uygulamayı Yeniden Başlatın**

```bash
cd gurbetci-app
expo start --clear
```

### 4. **Cron Job Sistemi Kurulumu**

#### A. Node.js Ortamı Hazırlayın
```bash
# Proje root'unda
npm init -y
npm install @supabase/supabase-js node-cron node-fetch dotenv
npm install -g pm2  # Production için
```

#### B. Package.json'u Güncelleyin
`cron-package.json` dosyasındaki içeriği `package.json`'a kopyalayın.

#### C. Environment Variables
```bash
# .env dosyası (proje root'unda)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### D. Cron Job'u Başlatın

**Development:**
```bash
npm run test    # Manuel test
npm run dev     # Geliştirme modu
```

**Production:**
```bash
npm run pm2:start  # PM2 ile başlat
npm run pm2:logs   # Log'ları izle
```

---

## 🧪 Test Süreci

### 1. **API Test**
```bash
# Uygulamada
1. Haberler sayfasına gidin
2. Sağ üstteki + butonuna tıklayın
3. "API Test" seçin
4. "✅ Test Başarılı!" mesajını bekleyin
```

### 2. **Manuel Haber Ekleme**
```bash
# Uygulamada
1. + butonuna tıklayın
2. "Haberleri Ekle" seçin
3. İşlem tamamlanmasını bekleyin
```

### 3. **Cron Job Test**
```bash
# Terminal'de
node cron-news-fetcher.js --run-now
```

---

## 🎯 Özellik Testleri

### **Beğeni Sistemi**
1. Haber detayına gidin
2. Sağ alttaki ❤️ "Beğen" butonuna tıklayın
3. Kalp dolar ve sayı artar
4. Tekrar tıklayınca beğeni kalkar

### **Yorumlar Sistemi**
1. Haber detayında aşağı kaydırın
2. "Yorumunuzu yazın..." alanına yorum girin
3. ➤ butonuna tıklayın
4. Yorumunuz listeye eklenir

### **Arama Sistemi**
1. Haberler sayfasında 🔍 arama butonuna tıklayın
2. Modal açılır
3. Haber başlığı veya içerik yazın
4. Sonuçlar otomatik güncellenir

---

## 🔧 Sorun Giderme

### **Gemini API Hataları**

**Problem:** `404 Hatası`
```bash
✅ Çözüm: API endpoint güncellenmiş
- Kod zaten güncel, API key'i kontrol edin
```

**Problem:** `403 Forbidden`
```bash
✅ Çözüm: API key geçersiz
- Google AI Studio'da yeni key oluşturun
- .env dosyasını güncelleyin
- Uygulamayı yeniden başlatın
```

### **Veritabanı Hataları**

**Problem:** `news_likes tablosu bulunamadı`
```bash
✅ Çözüm: 
- database_news_likes_comments.sql'i Supabase'de çalıştırın
- RLS policies'lerin aktif olduğunu kontrol edin
```

**Problem:** `user_profiles JOIN hatası`
```bash
✅ Çözüm:
- Kullanıcı profili oluşturun
- Auth flow'u tamamlayın
```

### **Cron Job Hataları**

**Problem:** `Environment variables eksik`
```bash
✅ Çözüm:
- .env dosyasının doğru yerde olduğunu kontrol edin
- SUPABASE_SERVICE_ROLE_KEY kullanın (ANON_KEY değil)
```

**Problem:** `PM2 çalışmıyor`
```bash
✅ Çözüm:
npm install -g pm2
pm2 startup
pm2 save
```

---

## 📊 Performans İpuçları

### **Client-Side Optimizasyonları**
- Haberleri sayfalama ile yükleyin (20'şer)
- Search sonuçlarını debounce edin (300ms)
- Comments'i lazy loading ile yükleyin

### **Server-Side Optimizasyonları**
- Cron job'u UTC timezone'da çalıştırın
- Rate limiting için API istekler arası 2s bekleyin
- Supabase RLS policies optimize edin

### **Database İndeksleri**
```sql
-- Zaten var, ama kontrol edin:
CREATE INDEX idx_news_likes_news_id ON news_likes(news_id);
CREATE INDEX idx_news_comments_news_id ON news_comments(news_id);
```

---

## 🚀 Production Deployment

### **1. Server Kurulumu**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2
```

### **2. Cron Job Deployment**
```bash
# Server'da
git clone your-repo
cd gurbetci-app
npm install
cp .env.example .env  # Değişkenleri doldurun

# PM2 ile başlat
pm2 start cron-news-fetcher.js --name gurbetci-news-cron
pm2 startup
pm2 save
```

### **3. Monitoring**
```bash
# Logları izle
pm2 logs gurbetci-news-cron

# Status kontrol
pm2 status

# Restart
pm2 restart gurbetci-news-cron
```

---

## 📈 İstatistikler & Monitoring

### **Supabase Dashboard**
- `news` tablosu: Toplam haber sayısı
- `news_likes` tablosu: Toplam beğeni sayısı  
- `news_comments` tablosu: Toplam yorum sayısı
- `cron_logs` tablosu: Cron job geçmişi

### **Cron Logs Tablosu (Opsiyonel)**
```sql
CREATE TABLE cron_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  processed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  errors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📞 Destek

Sorun yaşıyorsanız:

1. **Console Log'larını kontrol edin**
2. **Supabase logs'a bakın**
3. **PM2 logs'ları inceleyin**
4. **API key'leri doğrulayın**

**Başarı kriterleri:**
- ✅ Haberler yükleniyor
- ✅ Beğeni/yorum çalışıyor  
- ✅ Arama sonuç veriyor
- ✅ Cron job çalışıyor
- ✅ Çeviri işlemi başarılı

---

## 🎉 Özet

Bu sistem sayesinde:

📱 **Kullanıcılar:**
- Premium haber deneyimi yaşar
- Haberleri beğenip yorum yapabilir
- Hızlı arama yapabilir
- Yazı boyutunu ayarlayabilir

🤖 **Otomatik Sistem:**
- Her gün yeni haberler eklenir
- İngilizce haberler Türkçe'ye çevrilir
- Kategoriler otomatik atanır
- Sistem kendini sürdürür

**Sonuç:** Tam otomatik, kullanıcı dostu haber sistemi! 🚀 