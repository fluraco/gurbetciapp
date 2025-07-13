-- Okunan haberleri takip etmek için tablo
-- Kullanıcıların hangi haberleri okuduğunu kaydeder

CREATE TABLE IF NOT EXISTS public.news_read_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
    read_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- İndeksler - performans için önemli
CREATE INDEX IF NOT EXISTS idx_news_read_history_user_id ON public.news_read_history(user_id);
CREATE INDEX IF NOT EXISTS idx_news_read_history_news_id ON public.news_read_history(news_id);
CREATE INDEX IF NOT EXISTS idx_news_read_history_user_news ON public.news_read_history(user_id, news_id);
CREATE INDEX IF NOT EXISTS idx_news_read_history_read_at ON public.news_read_history(read_at);

-- Unique constraint - bir kullanıcı aynı haberi birden fazla kez okudu olarak işaretleyemez
ALTER TABLE public.news_read_history 
ADD CONSTRAINT unique_user_news 
UNIQUE (user_id, news_id);

-- RLS (Row Level Security) etkinleştir
ALTER TABLE public.news_read_history ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi okuma kayıtlarını görebilir ve değiştirebilir
CREATE POLICY "Users can manage their own read history" ON public.news_read_history
    FOR ALL USING (auth.uid() = user_id);

-- Service role için tam erişim
CREATE POLICY "Service role can manage all read history" ON public.news_read_history
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger: read_at otomatik güncelleme (isteğe bağlı)
CREATE OR REPLACE FUNCTION update_read_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.read_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sadece read_at güncellendiğinde çalışsın
-- CREATE TRIGGER trigger_update_read_at
--     BEFORE UPDATE ON public.news_read_history
--     FOR EACH ROW
--     EXECUTE FUNCTION update_read_at();

-- Yararlı view: kullanıcıların okuma istatistikleri
CREATE OR REPLACE VIEW public.user_reading_stats AS
SELECT 
    user_id,
    COUNT(*) as total_read_news,
    COUNT(CASE WHEN read_at >= now() - interval '7 days' THEN 1 END) as read_this_week,
    COUNT(CASE WHEN read_at >= now() - interval '30 days' THEN 1 END) as read_this_month,
    MAX(read_at) as last_read_at,
    MIN(read_at) as first_read_at
FROM public.news_read_history 
GROUP BY user_id;

-- View için RLS
ALTER VIEW public.user_reading_stats SET (security_invoker = true);

-- Comment'lar
COMMENT ON TABLE public.news_read_history IS 'Kullanıcıların okuduğu haberleri takip eder';
COMMENT ON COLUMN public.news_read_history.user_id IS 'Haberi okuyan kullanıcının ID''si';
COMMENT ON COLUMN public.news_read_history.news_id IS 'Okunan haberin ID''si';
COMMENT ON COLUMN public.news_read_history.read_at IS 'Haberin okunma tarihi ve saati';

-- Örnek analiz sorguları (comment olarak)
/*
-- En çok okunan haberler
SELECT n.news_title, COUNT(nrh.id) as read_count
FROM public.news n
LEFT JOIN public.news_read_history nrh ON n.id = nrh.news_id
GROUP BY n.id, n.news_title
ORDER BY read_count DESC
LIMIT 10;

-- Kullanıcının okuma geçmişi
SELECT n.news_title, n.category, nrh.read_at
FROM public.news_read_history nrh
JOIN public.news n ON nrh.news_id = n.id
WHERE nrh.user_id = auth.uid()
ORDER BY nrh.read_at DESC;

-- Günlük okuma istatistikleri
SELECT 
    DATE(read_at) as read_date,
    COUNT(*) as total_reads,
    COUNT(DISTINCT user_id) as unique_readers
FROM public.news_read_history
WHERE read_at >= now() - interval '30 days'
GROUP BY DATE(read_at)
ORDER BY read_date DESC;
*/ 