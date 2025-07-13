-- Beğeniler ve Yorumlar Sistemi için Database Tabloları
-- gurbetci-app/database_news_likes_comments.sql

-- News Likes Table - Haberlere beğeni sistemi
CREATE TABLE news_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Aynı kullanıcı aynı haberi birden fazla beğenemesin
  UNIQUE(news_id, user_id)
);

-- News Comments Table - Haberlere yorum sistemi
CREATE TABLE news_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (char_length(comment_text) > 0 AND char_length(comment_text) <= 1000),
  is_approved BOOLEAN DEFAULT TRUE, -- Moderasyon için
  is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler for better performance
CREATE INDEX idx_news_likes_news_id ON news_likes(news_id);
CREATE INDEX idx_news_likes_user_id ON news_likes(user_id);
CREATE INDEX idx_news_likes_created_at ON news_likes(created_at DESC);

CREATE INDEX idx_news_comments_news_id ON news_comments(news_id);
CREATE INDEX idx_news_comments_user_id ON news_comments(user_id);
CREATE INDEX idx_news_comments_created_at ON news_comments(created_at DESC);
CREATE INDEX idx_news_comments_approved ON news_comments(is_approved);

-- Updated_at trigger for news_likes
CREATE TRIGGER update_news_likes_updated_at 
    BEFORE UPDATE ON news_likes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for news_comments
CREATE TRIGGER update_news_comments_updated_at 
    BEFORE UPDATE ON news_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- View: News with like and comment counts
CREATE VIEW news_with_stats AS
SELECT 
    n.*,
    COALESCE(l.like_count, 0) as like_count,
    COALESCE(c.comment_count, 0) as comment_count
FROM news n
LEFT JOIN (
    SELECT 
        news_id, 
        COUNT(*) as like_count
    FROM news_likes 
    GROUP BY news_id
) l ON n.id = l.news_id
LEFT JOIN (
    SELECT 
        news_id, 
        COUNT(*) as comment_count
    FROM news_comments 
    WHERE is_approved = TRUE AND is_deleted = FALSE
    GROUP BY news_id
) c ON n.id = c.news_id;

-- RLS (Row Level Security) Policies
ALTER TABLE news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;

-- Policies for news_likes
CREATE POLICY "Herkes beğenileri görebilir" ON news_likes
    FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendi beğenilerini yönetebilir" ON news_likes
    FOR ALL USING (auth.uid() = user_id);

-- Policies for news_comments
CREATE POLICY "Herkes onaylanmış yorumları görebilir" ON news_comments
    FOR SELECT USING (is_approved = true AND is_deleted = false);

CREATE POLICY "Kullanıcılar yorum ekleyebilir" ON news_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi yorumlarını güncelleyebilir" ON news_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Örnek sorgu fonksiyonları
-- Bir haberin beğeni sayısını getir
CREATE OR REPLACE FUNCTION get_news_like_count(news_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM news_likes 
        WHERE news_id = news_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Kullanıcının bir haberi beğenip beğenmediğini kontrol et
CREATE OR REPLACE FUNCTION check_user_liked_news(news_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM news_likes 
        WHERE news_id = news_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Bir haberin yorum sayısını getir
CREATE OR REPLACE FUNCTION get_news_comment_count(news_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM news_comments 
        WHERE news_id = news_uuid 
        AND is_approved = true 
        AND is_deleted = false
    );
END;
$$ LANGUAGE plpgsql; 