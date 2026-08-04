-- ============================================================
-- 011_kit_takip.sql — 🔧 KİT TAKİP SİSTEMİ
--
--   bb_kit_units  : her öğrencinin her kiti için 1 kayıt
--                   (QR kodu, durum, seri no)
--   bb_kit_events : olay geçmişi (kontrol / arıza / tamir /
--                   parça değişimi / not) + tarih + maliyet
--
-- Backfill: mevcut tüm öğrencilerin kayıtlı kitleri için
-- otomatik ünite + benzersiz QR kodu (KT-XXXXXX) üretilir.
-- Tekrar çalıştırmaya dayanıklıdır.
-- ============================================================

CREATE TABLE IF NOT EXISTS bb_kit_units (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,                 -- QR içeriği: KT-XXXXXX
  student_id TEXT NOT NULL REFERENCES bb_users(id) ON DELETE CASCADE,
  kit TEXT NOT NULL,                         -- berrybot | roboarm | tank | ...
  status TEXT NOT NULL DEFAULT 'saglam',     -- saglam | tamir_gerekli | tamirde | hurda
  serial_no TEXT,                            -- kutunun/kartın fiziksel seri no'su (ops.)
  note TEXT,
  created_at BIGINT,
  updated_at BIGINT,
  UNIQUE(student_id, kit)
);

CREATE TABLE IF NOT EXISTS bb_kit_events (
  id SERIAL PRIMARY KEY,
  unit_id INTEGER NOT NULL REFERENCES bb_kit_units(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                        -- kontrol | ariza | tamir | parca | teslim | not
  description TEXT,
  cost NUMERIC DEFAULT 0,                    -- tamir/parça maliyeti (TL)
  event_date BIGINT,                         -- olayın tarihi (epoch ms)
  created_by TEXT,                           -- işlemi giren kullanıcı adı
  created_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_kit_units_student ON bb_kit_units(student_id);
CREATE INDEX IF NOT EXISTS idx_kit_units_code ON bb_kit_units(code);
CREATE INDEX IF NOT EXISTS idx_kit_events_unit ON bb_kit_events(unit_id);

-- RLS: projedeki diğer tablolarla aynı düzen (herkese açık politika)
ALTER TABLE bb_kit_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_kit_events ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bb_kit_units') THEN
    CREATE POLICY "Allow all on bb_kit_units" ON bb_kit_units FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bb_kit_events') THEN
    CREATE POLICY "Allow all on bb_kit_events" ON bb_kit_events FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── BACKFILL: her öğrencinin her kayıtlı kiti için ünite oluştur ──
DO $$
DECLARE
  s RECORD;
  k TEXT;
  yeni_kod TEXT;
  ms BIGINT := (extract(epoch from now())*1000)::BIGINT;
BEGIN
  FOR s IN SELECT id, kit, kits FROM bb_users WHERE role = 'student' LOOP
    FOR k IN
      SELECT DISTINCT x FROM (
        SELECT jsonb_array_elements_text(COALESCE(to_jsonb(s.kits), '[]'::jsonb)) AS x
        UNION SELECT s.kit
      ) t WHERE x IS NOT NULL AND x <> ''
    LOOP
      IF NOT EXISTS (SELECT 1 FROM bb_kit_units WHERE student_id = s.id AND kit = k) THEN
        -- benzersiz kod üret (çakışırsa yeniden dene)
        LOOP
          yeni_kod := 'KT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
          EXIT WHEN NOT EXISTS (SELECT 1 FROM bb_kit_units WHERE code = yeni_kod);
        END LOOP;
        INSERT INTO bb_kit_units (code, student_id, kit, status, created_at, updated_at)
        VALUES (yeni_kod, s.id, k, 'saglam', ms, ms);
        -- açılış olayı: kayıt
        INSERT INTO bb_kit_events (unit_id, type, description, cost, event_date, created_by, created_at)
        VALUES (currval('bb_kit_units_id_seq'), 'teslim', 'Kit takibe alındı (otomatik kayıt)', 0, ms, 'sistem', ms);
        RAISE NOTICE 'Kit kaydı: % / % → %', s.id, k, yeni_kod;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Kontrol
SELECT u.kit, u.status, count(*) FROM bb_kit_units u GROUP BY u.kit, u.status ORDER BY u.kit;
