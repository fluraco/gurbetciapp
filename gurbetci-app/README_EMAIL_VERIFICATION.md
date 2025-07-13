# 📧 E-posta Doğrulama Sistemi - Kurulum

Bu dosya, e-posta doğrulama sisteminin nasıl kurulacağını açıklar.

## 🚀 1. Database Güncellemesi

### Adım 1: SQL Kodu Çalıştırma

1. **Supabase Dashboard'a gidin:** https://supabase.com/dashboard
2. **SQL Editor'ı açın:** SQL Editor menüsünde "New Query"
3. **SQL kodunu yapıştırın:** `database_email_verification_update.sql` dosyasındaki tüm kodu kopyalayıp yapıştırın
4. **Çalıştırın:** "Run" butonuna tıklayın

### Adım 2: Kontrol Edin

SQL kodu başarıyla çalıştırıldıktan sonra:

```sql
-- Users tablosunda email_verified alanının eklendiğini kontrol edin
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'email_verified';

-- Fonksiyonların oluşturulduğunu kontrol edin
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('mark_email_verified', 'is_email_verified', 'auto_mark_email_verified');

-- Trigger'ın oluşturulduğunu kontrol edin
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_mark_email_verified';
```

## 🔧 2. Brevo API Key Kurulumu

E-posta gönderimi için Brevo API key'inizi güncelleyin:

1. **Brevo hesabı oluşturun:** https://app.brevo.com (ücretsiz)
2. **API Key alın:** Settings > API Keys > Create New API Key
3. **Edge Function'ı güncelleyin:**
   ```typescript
   // supabase/functions/send-email/index.ts
   const BREVO_API_KEY = 'xkeysib-GERÇEK_API_KEY_BURAYA_GELECEK'
   ```

## 🎯 3. Sistem Akışı

### E-posta Doğrulama Akışı

1. **Yeni Kullanıcı Kaydı:**
   - Kullanıcı e-posta ve şifre ile kayıt olur
   - `users` tablosuna `email_verified: false` olarak kaydedilir
   - Custom OTP kodu gönderilir
   - Kullanıcı OTP sayfasına yönlendirilir

2. **Mevcut Kullanıcı Girişi:**
   - Kullanıcı e-posta ve şifre ile giriş yapar
   - `email_verified` kontrol edilir
   - Eğer `false` ise yeni OTP kodu gönderilir
   - Kullanıcı OTP sayfasına yönlendirilir

3. **OTP Doğrulama:**
   - Kullanıcı OTP kodunu girer
   - Kod doğru ise `email_verified: true` yapılır
   - Kullanıcı ana akışa devam eder

### Güvenlik Özellikleri

- ✅ **Otomatik Trigger:** OTP doğrulaması yapıldığında `email_verified` otomatik güncellenir
- ✅ **RLS Policies:** Kullanıcılar sadece kendi verilerini görebilir/güncelleyebilir
- ✅ **Index'ler:** Hızlı sorgulama için `email_verified` alanına index
- ✅ **Cleanup:** Süresi dolmuş OTP kodları otomatik temizlenir
- ✅ **Validation:** E-posta ve telefon kontrolü yapılır

## 📊 4. Monitoring ve Yönetim

### Doğrulanmamış Kullanıcıları Görme

```sql
-- Doğrulanmamış kullanıcılar
SELECT * FROM unverified_users;

-- Doğrulanmış kullanıcılar
SELECT * FROM verified_users;

-- E-posta doğrulama oranı
SELECT 
  COUNT(*) as toplam_kullanici,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as dogrulanmis,
  ROUND(
    (COUNT(CASE WHEN email_verified = true THEN 1 END) * 100.0) / COUNT(*), 2
  ) as dogrulama_orani
FROM public.users 
WHERE email IS NOT NULL;
```

### Cleanup İşlemi

```sql
-- Süresi dolmuş OTP kodlarını temizle
SELECT cleanup_expired_otp_codes();

-- 7 günden eski doğrulanmamış kullanıcıları sil (dikkatli olun!)
-- DELETE FROM public.users 
-- WHERE email_verified = FALSE 
-- AND created_at < NOW() - INTERVAL '7 days';
```

## 🐛 5. Troubleshooting

### Sık Karşılaşılan Sorunlar

1. **"Function does not exist" hatası:**
   - SQL kodunun tamamının çalıştırıldığından emin olun
   - SECURITY DEFINER permission'larını kontrol edin

2. **"permission denied" hatası:**
   - RLS policies'lerin doğru kurulduğunu kontrol edin
   - Supabase service role key'in doğru olduğundan emin olun

3. **E-posta gönderilmiyor:**
   - Brevo API key'in doğru olduğunu kontrol edin
   - Edge Function'ın deploy edildiğini kontrol edin

4. **OTP doğrulama çalışmıyor:**
   - `otp_codes` tablosundaki trigger'ın çalıştığını kontrol edin
   - Log'larda hata mesajlarını kontrol edin

### Debug Komutları

```sql
-- OTP kodlarını kontrol et
SELECT * FROM public.otp_codes 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC;

-- Kullanıcının e-posta doğrulama durumunu kontrol et
SELECT id, email, email_verified, created_at 
FROM public.users 
WHERE email = 'test@example.com';

-- Trigger'ın çalışıp çalışmadığını kontrol et
SELECT * FROM pg_trigger 
WHERE tgname = 'trigger_auto_mark_email_verified';
```

## ✅ 6. Test Checklist

- [ ] Database güncellemesi tamamlandı
- [ ] Brevo API key güncellendi
- [ ] Edge Functions deploy edildi
- [ ] Yeni kullanıcı kaydı çalışıyor
- [ ] OTP e-postası gönderiliyor
- [ ] OTP doğrulama çalışıyor
- [ ] E-posta doğrulaması işaretleniyor
- [ ] Doğrulanmamış kullanıcı giriş yapamıyor
- [ ] Cleanup fonksiyonu çalışıyor

## 🎉 Tamamlandı!

Artık e-posta doğrulama sisteminiz tamamen çalışıyor. Kullanıcılar e-posta adreslerini doğrulamadan sistemi kullanamayacaklar.

**Önemli:** Bu sistem production'da kullanılmadan önce mutlaka test ortamında kapsamlı testler yapılmalıdır. 