-- ═══════════════════════════════════════════════════════════════
-- BerryBot LMS — 007: Görev Süresi Kontrolü
-- Eğitmen bir öğrencinin görev sayacını duraklatabilir,
-- devam ettirebilir veya istediği süreden başlatabilir.
-- Supabase Dashboard > SQL Editor'da BİR KEZ çalıştır.
-- ═══════════════════════════════════════════════════════════════

-- paused_at : sayaç duraklatıldığı an (NULL = çalışıyor)
-- paused_ms : bugüne kadar duraklamada geçen toplam süre (sayaçtan düşülür)
ALTER TABLE bb_progress ADD COLUMN IF NOT EXISTS paused_at BIGINT;
ALTER TABLE bb_progress ADD COLUMN IF NOT EXISTS paused_ms BIGINT DEFAULT 0;

-- Kim, ne zaman süreye müdahale etti (şeffaflık için)
ALTER TABLE bb_progress ADD COLUMN IF NOT EXISTS time_adjusted_by TEXT;
ALTER TABLE bb_progress ADD COLUMN IF NOT EXISTS time_adjusted_at BIGINT;

UPDATE bb_progress SET paused_ms = 0 WHERE paused_ms IS NULL;

-- Duraklatılmış görevleri hızlı bulmak için
CREATE INDEX IF NOT EXISTS idx_progress_paused
  ON bb_progress(student_id) WHERE paused_at IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- Geçen süre formülü (uygulamada da aynısı kullanılıyor):
--
--   çalışıyorsa : now        - started_at - paused_ms
--   duraklıysa  : paused_at  - started_at - paused_ms
--   bittiyse    : completed_at - started_at - paused_ms
--
-- Yani duraklamada geçen süre hiçbir zaman öğrencinin
-- performans puanına yansımaz.
-- ═══════════════════════════════════════════════════════════════
