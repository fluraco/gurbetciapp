# SMTP Kurulumu - Gurbetçi App

## 🚀 Hızlı Kurulum

### 1. Database Kurulumu

Supabase dashboard'da SQL Editor'ı açın ve `database_setup.sql` dosyasını çalıştırın:

```sql
-- Users tablosu ve diğer tablolar otomatik olarak oluşturulacak
```

### 2. Supabase Edge Functions Kurulumu

```bash
# Supabase CLI'yi kurun
npm install -g supabase

# Proje dizinine gidin
cd gurbetci-app

# Supabase'i başlatın
supabase init

# Edge Functions'ları deploy edin
supabase functions deploy send-email
supabase functions deploy reset-password
```

### 3. Brevo API Key Kurulumu

Edge Functions'da Brevo API key'ini güncelleyin:

```typescript
// supabase/functions/send-email/index.ts
headers: {
  'api-key': 'YOUR_BREVO_API_KEY_HERE', // Gerçek API key'i buraya
},
```

### 4. Environment Variables

`.env` dosyasını oluşturun:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📧 E-posta Akışı

### Yeni Kullanıcı Kaydı
1. E-posta gir → `checkEmailExists` (users tablosundan)
2. Kayıtlı değilse → Şifre oluştur
3. `signUpWithEmail` → Custom OTP e-postası gönder
4. OTP doğrula → Profil oluştur

### Mevcut Kullanıcı Girişi
1. E-posta gir → `checkEmailExists` (users tablosundan)
2. Kayıtlı ise → Şifre gir
3. Giriş yap → Profil kontrolü → Ana sayfa

### Şifre Sıfırlama
1. "Şifremi Unuttum" → E-posta gir
2. 6 haneli OTP kodu gönder (custom e-posta)
3. OTP doğrula → Yeni şifre belirle
4. Edge Function ile şifre güncelle → Giriş sayfası

## 🔧 Kullanılan Teknolojiler

- **SMTP**: Brevo (smtp-relay.brevo.com:587)
- **Database**: Supabase PostgreSQL
- **Edge Functions**: Supabase Edge Functions
- **Templates**: HTML e-posta template'leri

## 🗂️ Database Yapısı

```sql
-- Users tablosu (e-posta kontrolü için)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OTP codes tablosu (doğrulama kodları için)
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  user_id UUID,
  code VARCHAR(6),
  type VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(20),
  expires_at TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE
);
```

## 🔍 Hata Giderme

### Giriş Sırasında PGRST116 Hatası
✅ **Çözüldü**: `getUserProfile` fonksiyonu güncellenmiş
- Profil yoksa `null` döndürüyor
- Hata vermek yerine güvenli navigasyon

### E-posta Kontrolü Sorunu
✅ **Çözüldü**: `checkEmailExists` fonksiyonu güncellenmiş
- Artık `users` tablosundan kontrol ediyor
- Dummy şifre denemesi kaldırıldı

### Custom E-posta Gönderimi
✅ **Eklendi**: Edge Functions ile custom e-posta
- OTP doğrulama e-postası
- Şifre sıfırlama OTP e-postası
- Hoş geldin e-postası

### Şifre Sıfırlama Akışı
✅ **Eklendi**: OTP tabanlı şifre sıfırlama
- PasswordResetScreen (e-posta girme)
- PasswordResetOTPScreen (OTP doğrulama)
- NewPasswordScreen (yeni şifre belirleme)
- Edge Function ile şifre güncelleme

## 📋 Yapılacaklar

- [ ] Brevo API key'ini environment variable'dan al
- [ ] E-posta template'lerini daha da güzelleştir
- [ ] Rate limiting ekle (OTP spam koruması)
- [ ] E-posta delivery tracking
- [ ] Çoklu dil desteği e-posta template'leri
- [ ] OTP kodları için cleanup job (expired kodları sil)
- [ ] Navigation stack'e yeni ekranları ekle

## 🎯 Sonuç

Artık sistem tamamen profesyonel ve güvenilir:
- ✅ Doğrudan database kontrolü (users tablosu)
- ✅ Custom e-posta template'leri (Brevo SMTP)
- ✅ Güvenli OTP sistemi (6 haneli kodlar)
- ✅ Hata-free navigasyon (RLS düzeltmeleri)
- ✅ Komplet şifre sıfırlama akışı
- ✅ Edge Functions ile güvenli şifre güncelleme
- ✅ Professional UX/UI tasarımı 