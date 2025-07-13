-- =============================================================================
-- GURBETCI APP DATABASE SCHEMA
-- =============================================================================

-- Users Table (for email existence check)
-- Supabase Auth ile senkronize edilir
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supported Countries Table
-- Bu tablo desteklenen ülke kodlarını yönetir
CREATE TABLE public.supported_countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(2) NOT NULL UNIQUE, -- 'PL', 'TR', 'DE' gibi
    name VARCHAR(100) NOT NULL,
    name_tr VARCHAR(100) NOT NULL, -- Türkçe isim
    flag_emoji VARCHAR(10) NOT NULL,
    dial_code VARCHAR(10) NOT NULL, -- '+48', '+90', '+49' gibi
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0, -- Sıralama için
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial supported countries data
INSERT INTO public.supported_countries (code, name, name_tr, flag_emoji, dial_code, is_active, display_order) VALUES
('PL', 'Poland', 'Polonya', '🇵🇱', '+48', true, 1),
('TR', 'Turkey', 'Türkiye', '🇹🇷', '+90', true, 2),
('DE', 'Germany', 'Almanya', '🇩🇪', '+49', true, 3),
-- İsteğe bağlı eklenebilir ülkeler (başlangıçta pasif)
('FR', 'France', 'Fransa', '🇫🇷', '+33', false, 4),
('NL', 'Netherlands', 'Hollanda', '🇳🇱', '+31', false, 5),
('BE', 'Belgium', 'Belçika', '🇧🇪', '+32', false, 6),
('AT', 'Austria', 'Avusturya', '🇦🇹', '+43', false, 7),
('CH', 'Switzerland', 'İsviçre', '🇨🇭', '+41', false, 8),
('GB', 'United Kingdom', 'İngiltere', '🇬🇧', '+44', false, 9),
('US', 'United States', 'Amerika', '🇺🇸', '+1', false, 10),
('CA', 'Canada', 'Kanada', '🇨🇦', '+1', false, 11),
('IT', 'Italy', 'İtalya', '🇮🇹', '+39', false, 12),
('ES', 'Spain', 'İspanya', '🇪🇸', '+34', false, 13),
('SE', 'Sweden', 'İsveç', '🇸🇪', '+46', false, 14),
('NO', 'Norway', 'Norveç', '🇳🇴', '+47', false, 15),
('DK', 'Denmark', 'Danimarka', '🇩🇰', '+45', false, 16);

-- User Profiles Table
-- Supabase auth.users ile ilişkili profil bilgileri
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_type VARCHAR(20) CHECK (user_type IN ('individual', 'corporate')) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    country_code VARCHAR(2) REFERENCES supported_countries(code),
    city VARCHAR(100),
    phone VARCHAR(20),
    language VARCHAR(5) DEFAULT 'tr',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Individual user fields
    bio TEXT,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    interests TEXT[], -- Array of interests
    
    -- Corporate user fields
    company_name VARCHAR(100),
    brand_name VARCHAR(100),
    company_logo_url TEXT,
    tax_number VARCHAR(50),
    website VARCHAR(255),
    description TEXT,
    category VARCHAR(50),
    employee_count INTEGER,
    
    -- Social media links
    social_media JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cities Table
CREATE TABLE public.cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_tr VARCHAR(100) NOT NULL, -- Türkçe isim
    country_code VARCHAR(2) REFERENCES supported_countries(code),
    is_active BOOLEAN DEFAULT true,
    population INTEGER,
    coordinates JSONB, -- {lat: number, lng: number}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Popular cities data
INSERT INTO public.cities (name, name_tr, country_code, is_active, population) VALUES
-- Polonya şehirleri
('Warsaw', 'Varşova', 'PL', true, 1800000),
('Krakow', 'Krakov', 'PL', true, 770000),
('Gdansk', 'Gdansk', 'PL', true, 470000),
('Wroclaw', 'Wrocław', 'PL', true, 640000),
('Poznan', 'Poznan', 'PL', true, 540000),
('Lodz', 'Lodz', 'PL', true, 690000),
('Szczecin', 'Szczecin', 'PL', true, 400000),
('Lublin', 'Lublin', 'PL', true, 340000),

-- Türkiye şehirleri
('Istanbul', 'İstanbul', 'TR', true, 15500000),
('Ankara', 'Ankara', 'TR', true, 5600000),
('Izmir', 'İzmir', 'TR', true, 4400000),
('Bursa', 'Bursa', 'TR', true, 3100000),
('Antalya', 'Antalya', 'TR', true, 2500000),
('Adana', 'Adana', 'TR', true, 2200000),
('Konya', 'Konya', 'TR', true, 2200000),
('Gaziantep', 'Gaziantep', 'TR', true, 2100000),

-- Almanya şehirleri
('Berlin', 'Berlin', 'DE', true, 3700000),
('Munich', 'Münih', 'DE', true, 1500000),
('Hamburg', 'Hamburg', 'DE', true, 1900000),
('Cologne', 'Köln', 'DE', true, 1100000),
('Frankfurt', 'Frankfurt', 'DE', true, 750000),
('Stuttgart', 'Stuttgart', 'DE', true, 630000),
('Dusseldorf', 'Düsseldorf', 'DE', true, 620000),
('Dortmund', 'Dortmund', 'DE', true, 590000),
('Essen', 'Essen', 'DE', true, 580000),
('Leipzig', 'Leipzig', 'DE', true, 590000);

-- OTP Codes Table (for email verification)
CREATE TABLE public.otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('email_verification', 'password_reset', 'phone_verification')) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Performance indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_supported_countries_active ON public.supported_countries(is_active);
CREATE INDEX idx_supported_countries_display_order ON public.supported_countries(display_order);
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_country ON public.user_profiles(country_code);
CREATE INDEX idx_user_profiles_type ON public.user_profiles(user_type);
CREATE INDEX idx_cities_country ON public.cities(country_code);
CREATE INDEX idx_cities_active ON public.cities(is_active);
CREATE INDEX idx_otp_codes_user_id ON public.otp_codes(user_id);
CREATE INDEX idx_otp_codes_code ON public.otp_codes(code);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supported_countries_updated_at BEFORE UPDATE ON public.supported_countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users: herkes e-posta kontrolü yapabilir, sadece kendi kaydını ekleyebilir
CREATE POLICY "Anyone can read users for email check" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own record" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Supported countries: herkes okuyabilir, sadece admin yazabilir
CREATE POLICY "Anyone can read supported countries" ON public.supported_countries FOR SELECT USING (true);
CREATE POLICY "Only admins can modify supported countries" ON public.supported_countries FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- User profiles: kullanıcılar sadece kendi profillerini görebilir/düzenleyebilir
CREATE POLICY "Users can read their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Cities: herkes okuyabilir
CREATE POLICY "Anyone can read cities" ON public.cities FOR SELECT USING (true);

-- OTP codes: herkes kendi kodlarını okuyabilir, sistem OTP kodları ekleyebilir
CREATE POLICY "Users can read their own OTP codes" ON public.otp_codes FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "System can insert OTP codes" ON public.otp_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own OTP codes" ON public.otp_codes FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "System can update OTP codes" ON public.otp_codes FOR UPDATE WITH CHECK (true);

-- =============================================================================
-- SAMPLE DATA CLEANUP
-- =============================================================================

-- Clean up expired OTP codes (should be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active supported countries view
CREATE VIEW active_supported_countries AS
SELECT * FROM public.supported_countries 
WHERE is_active = true 
ORDER BY display_order;

-- Active cities view
CREATE VIEW active_cities AS
SELECT c.*, sc.name as country_name, sc.name_tr as country_name_tr
FROM public.cities c
JOIN public.supported_countries sc ON c.country_code = sc.code
WHERE c.is_active = true AND sc.is_active = true
ORDER BY sc.display_order, c.name; 