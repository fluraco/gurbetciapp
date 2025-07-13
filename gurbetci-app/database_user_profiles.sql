-- Kullanıcı profilleri tablosu
-- auth.users tablosuna ek bilgiler için

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username varchar(50),
    first_name varchar(100),
    last_name varchar(100),
    avatar_url text,
    bio text,
    phone varchar(20),
    country varchar(100),
    city varchar(100),
    company_name varchar(200),
    company_field varchar(100),
    user_type varchar(20) DEFAULT 'individual' CHECK (user_type IN ('individual', 'corporate')),
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);

-- RLS etkinleştir
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Herkes profilleri görebilir" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendi profillerini yönetebilir" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Service role için tam erişim
CREATE POLICY "Service role can manage profiles" ON public.user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Kullanıcı kaydı sırasında otomatik profil oluşturma trigger'ı
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, username, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Yeni kullanıcı kaydında otomatik profil oluştur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Comments
COMMENT ON TABLE public.user_profiles IS 'Kullanıcı profil bilgileri';
COMMENT ON COLUMN public.user_profiles.user_type IS 'Kullanıcı tipi: individual (bireysel) veya corporate (kurumsal)';
COMMENT ON COLUMN public.user_profiles.is_verified IS 'Hesap doğrulanmış mı?'; 