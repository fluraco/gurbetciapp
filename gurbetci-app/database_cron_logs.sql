-- Cron job logları için tablo oluşturma
-- Günlük haber güncelleme işlemlerinin loglarını tutar

CREATE TABLE IF NOT EXISTS public.cron_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name varchar(100) NOT NULL,
    status varchar(20) NOT NULL CHECK (status IN ('success', 'failed', 'partial_success')),
    processed_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    skipped_count integer DEFAULT 0,
    duration_seconds integer,
    errors jsonb,
    environment varchar(50) DEFAULT 'local',
    created_at timestamp with time zone DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON public.cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON public.cron_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON public.cron_logs(status);

-- RLS (Row Level Security) etkinleştir
ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;

-- Service role için tam erişim
CREATE POLICY "Service role can manage cron_logs" ON public.cron_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated kullanıcılar sadece okuyabilir
CREATE POLICY "Authenticated users can read cron_logs" ON public.cron_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Eski logları temizleme için function (opsiyonel)
CREATE OR REPLACE FUNCTION cleanup_old_cron_logs()
RETURNS void AS $$
BEGIN
    -- 30 günden eski logları sil
    DELETE FROM public.cron_logs 
    WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Örnek kullanım için comment
COMMENT ON TABLE public.cron_logs IS 'Cron job çalışma logları - günlük haber güncelleme işlemlerini takip eder';
COMMENT ON COLUMN public.cron_logs.job_name IS 'Çalışan job''un adı (örn: daily_news_update)';
COMMENT ON COLUMN public.cron_logs.status IS 'Job durumu: success, failed, partial_success';
COMMENT ON COLUMN public.cron_logs.processed_count IS 'Başarıyla işlenen haber sayısı';
COMMENT ON COLUMN public.cron_logs.failed_count IS 'Başarısız olan haber sayısı';
COMMENT ON COLUMN public.cron_logs.skipped_count IS 'Duplicate olduğu için atlanan haber sayısı';
COMMENT ON COLUMN public.cron_logs.duration_seconds IS 'İşlem süresi (saniye)';
COMMENT ON COLUMN public.cron_logs.errors IS 'Hata mesajları (JSON array)';
COMMENT ON COLUMN public.cron_logs.environment IS 'Çalışma ortamı: github_actions, local, production vb.'; 