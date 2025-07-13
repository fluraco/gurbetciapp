-- Haber Sistemi için Database Tablosu
-- gurbetci-app/database_news_system.sql

-- News table for storing translated articles
CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_title TEXT NOT NULL,
  news_content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  img TEXT, -- Haber görseli URL'i
  original_url TEXT, -- Orijinal haber URL'i (referans için)
  source VARCHAR(100) DEFAULT 'AP News Poland', -- Kaynak
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE, -- Öne çıkan haber
  read_time INTEGER DEFAULT 5, -- Tahmini okuma süresi (dakika)
  author VARCHAR(255) DEFAULT 'Gurbetçi News', -- Çeviren/editör
  status VARCHAR(50) DEFAULT 'published' -- published, draft, archived
);

-- Index for better performance
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_created_at ON news(created_at DESC);
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_featured ON news(is_featured);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_updated_at 
    BEFORE UPDATE ON news 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample categories for reference
-- Politics, World, Business, Technology, Sports, Health, Science, Entertainment, Travel, Lifestyle

-- Add some example data (optional)
INSERT INTO news (news_title, news_content, category, img, is_featured) VALUES 
(
  'Polonya\'da Yeni Çalışma Yasası Kabul Edildi',
  'Polonya parlamentosu, yabancı işçiler için yeni düzenlemeler getiren çalışma yasasını kabul etti. Yasa kapsamında çalışma izni başvuru süreçleri kolaylaştırılacak ve bürokratik engeller azaltılacak.',
  'Politics',
  'https://via.placeholder.com/400x200/FF6B6B/FFFFFF?text=Haber+Görseli',
  true
); 