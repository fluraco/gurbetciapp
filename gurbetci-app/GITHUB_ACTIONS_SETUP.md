# 🤖 Github Actions - Günlük Haber Sistemi Kurulumu

Bu rehber, Gurbetçi uygulaması için otomatik haber çekme sistemini Github Actions ile nasıl kurulacağını açıklar.

## 📋 Gereksinimler

- Github repository
- Supabase proje erişimi
- Gemini API key
- Service role key'i

## 🔧 Github Secrets Kurulumu

Repository'nizde şu secrets'ları ekleyin:

### 1. Repository Settings'e gidin
```
https://github.com/[USERNAME]/[REPO-NAME]/settings/secrets/actions
```

### 2. Şu secrets'ları ekleyin:

| Secret Adı | Açıklama | Örnek |
|------------|----------|--------|
| `SUPABASE_URL` | Supabase proje URL'i | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyC...` |

## 📁 Dosya Yapısı

```
gurbetci/
├── .github/
│   └── workflows/
│       └── daily-news-update.yml    # Github Actions workflow
├── gurbetci-app/
│   ├── cron-news-fetcher.js         # Ana cron script
│   ├── cron-package.json            # Dependencies
│   └── database_cron_logs.sql       # Log tablosu SQL
```

## ⏰ Çalışma Zamanlaması

- **Günlük çalışma**: Her gün Türkiye saati 00:00'da (UTC 21:00)
- **Manuel çalıştırma**: Github Actions sekmesinden manuel tetiklenebilir
- **Timeout**: 10 dakika (Github Actions limiti)

## 🚀 Kurulum Adımları

### 1. Database Kurulumu
```sql
-- Supabase SQL Editor'da çalıştırın
-- database_cron_logs.sql dosyasının içeriğini kopyalayın
```

### 2. Github Actions Aktifleştirme
- Workflow dosyası `.github/workflows/daily-news-update.yml` otomatik aktif olur
- Manuel test için: Actions sekmesi → "Daily News Update" → "Run workflow"

### 3. Log Takibi
```sql
-- Çalışma loglarını görüntüleme
SELECT * FROM cron_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Başarı oranı analizi
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_runs,
    SUM(processed_count) as total_processed,
    SUM(failed_count) as total_failed,
    AVG(duration_seconds) as avg_duration
FROM cron_logs 
WHERE job_name = 'daily_news_update'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🔍 Troubleshooting

### ❌ Hata: API Key Geçersiz
```bash
# Log çıktısı:
❌ Gemini API key geçersiz (401)

# Çözüm:
1. GEMINI_API_KEY secret'ını kontrol edin
2. API key'in aktif olduğundan emin olun
3. Quota limitlerini kontrol edin
```

### ❌ Hata: Supabase Bağlantısı
```bash
# Log çıktısı:
❌ Haber ekleme hatası: Invalid API key

# Çözüm:
1. SUPABASE_URL doğru mu?
2. SUPABASE_SERVICE_ROLE_KEY geçerli mi?
3. RLS politikaları kontrol edin
```

### ❌ Hata: Timeout
```bash
# Github Actions 10 dakika sonra timeout
# Çözüm:
1. API rate limiting süresini artırın
2. Haber sayısını sınırlandırın
3. Paralel işlem sayısını azaltın
```

## 📊 Performans Optimizasyonu

### Rate Limiting
- Gemini API: 3 saniye bekleme (Github Actions)
- Local: 2 saniye bekleme
- Günlük quota: ~30 istek

### Duplicate Kontrolü
- Benzer başlıklarda %50 eşleşme kontrolü
- Önceki 24 saat içindeki haberler kontrol edilir
- Duplicate haberler atlanır (log'da görünür)

### Memory Yönetimi
- Node.js heap size: Default (1.7GB)
- Process timeout: 10 dakika
- Graceful shutdown desteklenir

## 🎯 Beklenen Sonuçlar

### Günlük İşlem
- **Çekilen haber**: 2-5 adet
- **İşlem süresi**: 30-60 saniye
- **Başarı oranı**: %90+
- **API kullanımı**: ~10 Gemini request

### Log Örneği
```
🌅 Günlük haber güncelleme başlatıldı: 13.12.2024 00:00:15
🌍 Çalışma ortamı: Github Actions
📰 AP News Poland'dan dünkü haberler çekiliyor...
📅 Hedef tarih: 12.12.2024
✅ 2 dünkü haber başarıyla çekildi
🔑 Gemini API key kontrolü...
✅ Gemini API key geçerli
📝 2 haber çekildi, çeviri işlemi başlıyor...

📰 [1/2] İşleniyor...
🔄 Çeviri başlatılıyor: Poland announces new economic policies...
✅ Çeviri tamamlandı: Polonya 2024 için yeni ekonomik politika...
✅ Haber eklendi: Polonya 2024 için yeni ekonomik politika...

📰 [2/2] İşleniyor...
🔄 Çeviri başlatılıyor: Environmental protection measures...
✅ Çeviri tamamlandı: Polonya'da çevre koruma önlemleri...
✅ Haber eklendi: Polonya'da çevre koruma önlemleri...

📊 Final İşlem Özeti:
✅ Başarılı: 2 haber
⚠️  Atlandı: 0 haber
❌ Başarısız: 0 haber
⏱️  Süre: 45 saniye
📝 Log kaydı başarılı
🏁 Günlük haber güncelleme tamamlandı
```

## 🛠️ Manuel Test

### Local Test
```bash
cd gurbetci-app
npm install
node cron-news-fetcher.js --run-now
```

### Github Actions Test
1. Repository → Actions sekmesi
2. "Daily News Update" workflow'u seç
3. "Run workflow" butonuna tıkla
4. Sonuçları logs'ta takip et

## 🔐 Güvenlik

### Secrets Yönetimi
- API key'ler asla kod'a yazılmaz
- Github Secrets ile güvenli depolama
- Service role key'i minimum yetki ile

### Database Güvenliği
- RLS (Row Level Security) aktif
- Service role sadece gerekli tabloları erişir
- Logs'ta hassas veri depolanmaz

## 📈 Monitoring

### Github Actions Dashboard
- Workflow çalışma geçmişi
- Hata logları ve stack trace
- Execution time tracking

### Supabase Dashboard
- cron_logs tablosu analizi
- Database performance metrics
- API usage statistics

---

## 🚨 Önemli Notlar

1. **Timezone**: Github Actions UTC'de çalışır, script Türkiye saatine göre ayarlanmıştır
2. **Quota**: Gemini API free tier quota'sını aşmamaya dikkat edin
3. **Dependencies**: cron-package.json güncel tutulmalı
4. **Backup**: Manual olarak haber eklemek için debug mode kullanın

Bu sistem ile her gün otomatik olarak Poland haberlerini çekip Türkçe'ye çevirerek veritabanına ekleyecektir. 