-- E-posta Doğrulama Sistemi için Database Güncellemesi
-- Gurbetçi App

-- =============================================================================
-- 1. USERS TABLOSUNA EMAIL_VERIFIED ALANI EKLEME
-- =============================================================================

-- Users tablosuna email_verified boolean alanı ekle
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Mevcut kullanıcılar için email_verified durumunu güncelle
-- Auth tablosunda email_confirmed_at varsa verified olarak işaretle
UPDATE public.users 
SET email_verified = TRUE 
WHERE id IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email_confirmed_at IS NOT NULL 
    AND au.id = users.id
);

-- =============================================================================
-- 2. E-POSTA DOĞRULAMA FONKSIYONLARI
-- =============================================================================

-- E-posta doğrulaması işaretleme fonksiyonu
CREATE OR REPLACE FUNCTION mark_email_verified(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET email_verified = TRUE, updated_at = NOW()
    WHERE id = user_id;
    
    -- Auth tablosundaki email_confirmed_at'i de güncelle
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = user_id AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E-posta doğrulaması durumunu kontrol etme fonksiyonu
CREATE OR REPLACE FUNCTION is_email_verified(user_id UUID)
RETURNS boolean AS $$
DECLARE
    verified boolean;
BEGIN
    SELECT email_verified INTO verified
    FROM public.users 
    WHERE id = user_id;
    
    RETURN COALESCE(verified, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. TRIGGER: OTP DOĞRULAMASI SONRASI OTOMATIK GÜNCELLEME
-- =============================================================================

-- OTP doğrulaması yapıldığında email_verified'ı otomatik güncelle
CREATE OR REPLACE FUNCTION auto_mark_email_verified()
RETURNS TRIGGER AS $$
BEGIN
    -- Email verification OTP'si kullanıldığında
    IF NEW.is_used = TRUE AND OLD.is_used = FALSE AND NEW.type = 'email_verification' THEN
        -- User ID varsa direkt güncelle
        IF NEW.user_id IS NOT NULL THEN
            PERFORM mark_email_verified(NEW.user_id);
        -- User ID yoksa email ile bul
        ELSIF NEW.email IS NOT NULL THEN
            UPDATE public.users 
            SET email_verified = TRUE, updated_at = NOW()
            WHERE email = NEW.email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_auto_mark_email_verified ON public.otp_codes;
CREATE TRIGGER trigger_auto_mark_email_verified
    AFTER UPDATE ON public.otp_codes
    FOR EACH ROW
    EXECUTE FUNCTION auto_mark_email_verified();

-- =============================================================================
-- 4. RLS POLİCIES GÜNCELLEMESİ
-- =============================================================================

-- Users tablosu için güncellenmiş policies
DROP POLICY IF EXISTS "Users can read their own record" ON public.users;
CREATE POLICY "Users can read their own record" ON public.users 
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own email verification" ON public.users;
CREATE POLICY "Users can update their own email verification" ON public.users 
    FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- 5. INDEX EKLEME
-- =============================================================================

-- E-posta doğrulaması için index
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- =============================================================================
-- 6. VIEWS
-- =============================================================================

-- Doğrulanmış kullanıcılar view'i
CREATE OR REPLACE VIEW verified_users AS
SELECT u.*, up.user_type, up.first_name, up.last_name
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email_verified = TRUE;

-- Doğrulanmamış kullanıcılar view'i  
CREATE OR REPLACE VIEW unverified_users AS
SELECT u.*, up.user_type, up.first_name, up.last_name
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email_verified = FALSE OR u.email_verified IS NULL;

-- =============================================================================
-- 7. CLEANUP FONKSİYONU GÜNCELLEMESİ
-- =============================================================================

-- Cleanup fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    -- Süresi dolmuş kodları sil
    DELETE FROM public.otp_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    -- Kullanılmamış email verification kodları 24 saat sonra sil
    DELETE FROM public.otp_codes 
    WHERE type = 'email_verification' 
    AND is_used = FALSE 
    AND created_at < NOW() - INTERVAL '24 hours';
    
    -- Kullanılmamış password reset kodları 1 saat sonra sil
    DELETE FROM public.otp_codes 
    WHERE type = 'password_reset' 
    AND is_used = FALSE 
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. TEST VERİLERİ TEMİZLEME
-- =============================================================================

-- Test için oluşturulmuş doğrulanmamış kullanıcıları temizle
-- DELETE FROM public.users WHERE email_verified = FALSE AND created_at < NOW() - INTERVAL '7 days';

COMMIT; 