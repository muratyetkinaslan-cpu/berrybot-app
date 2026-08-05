-- ============================================================
-- 012_qr_giris.sql — 🎓 QR İLE GİRİŞ + 👨‍👩‍👦 VELİ QR RAPORU
--
--   login_token  : öğrencinin giriş QR'ı (?qrlogin=LG-XXXXXXXXXX)
--                  Login ekranında PC kamerasına okutulur → direkt giriş
--   parent_token : veli takip QR'ı (?veliqr=VL-XXXXXXXXXX)
--                  Login'siz tam rapor: kit takibi, görevler, süreler,
--                  ödevler, son 100 audit log
--
-- Backfill: tüm öğrencilere iki token da otomatik üretilir.
-- Tekrar çalıştırmaya dayanıklıdır.
-- ============================================================

ALTER TABLE bb_users ADD COLUMN IF NOT EXISTS login_token TEXT;
ALTER TABLE bb_users ADD COLUMN IF NOT EXISTS parent_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_token ON bb_users(login_token) WHERE login_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_parent_token ON bb_users(parent_token) WHERE parent_token IS NOT NULL;

-- ── BACKFILL: token'sız öğrencilere üret ──
DO $$
DECLARE
  s RECORD;
  t TEXT;
BEGIN
  FOR s IN SELECT id FROM bb_users WHERE role = 'student' AND login_token IS NULL LOOP
    LOOP
      t := 'LG-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM bb_users WHERE login_token = t);
    END LOOP;
    UPDATE bb_users SET login_token = t WHERE id = s.id;
  END LOOP;

  FOR s IN SELECT id FROM bb_users WHERE role = 'student' AND parent_token IS NULL LOOP
    LOOP
      t := 'VL-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM bb_users WHERE parent_token = t);
    END LOOP;
    UPDATE bb_users SET parent_token = t WHERE id = s.id;
  END LOOP;
END $$;

-- Kontrol
SELECT count(*) FILTER (WHERE login_token IS NOT NULL) AS giris_token,
       count(*) FILTER (WHERE parent_token IS NOT NULL) AS veli_token,
       count(*) AS ogrenci
FROM bb_users WHERE role = 'student';
