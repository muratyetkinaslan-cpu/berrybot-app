-- ============================================================
-- 009_progress_multikit.sql — ÇOK KİTLİ PROGRESS DÜZELTMESİ
--
-- SORUN: bb_progress'te UNIQUE(student_id, task_id) vardı — kit YOK.
--   BerryBot'ta görev 1-36 kaydı olan öğrenciye tank eklenince,
--   tank'ın 1-36 satırları "duplicate" sayılıp SESSİZCE düşüyordu
--   → "görev eklenmemiş gözüküyor" hatası.
--
-- BU DOSYA:
--   1. bb_progress'e kit kolonu ekler (yoksa), NULL'ları 'berrybot' yapar
--   2. Eski UNIQUE(student_id, task_id) kısıtını kaldırır
--   3. Yeni UNIQUE(student_id, kit, task_id) kısıtını ekler
--   4. BACKFILL: kayıtlı olduğu kit'te hiç progress satırı olmayan
--      öğrencilere görevleri seed eder (bozuk öğrenciler onarılır)
--
-- SIRA: Önce 008_tank_tasks.sql, sonra BU dosya, sonra yeni kodu deploy et.
-- ============================================================

-- ── 1. kit kolonu ──
ALTER TABLE bb_progress ADD COLUMN IF NOT EXISTS kit TEXT;
UPDATE bb_progress SET kit = 'berrybot' WHERE kit IS NULL;
ALTER TABLE bb_progress ALTER COLUMN kit SET DEFAULT 'berrybot';
ALTER TABLE bb_progress ALTER COLUMN kit SET NOT NULL;

-- bb_users.kits kolonu garanti (çoklu kit listesi — kod kullanıyor)
ALTER TABLE bb_users ADD COLUMN IF NOT EXISTS kits JSONB DEFAULT '[]'::jsonb;

-- ── 2. Eski UNIQUE(student_id, task_id) kısıtını kaldır (adı ne olursa olsun) ──
DO $$
DECLARE con RECORD;
BEGIN
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'bb_progress'
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname)
        FROM unnest(c.conkey) ck
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ck
      ) = ARRAY['student_id','task_id']
  LOOP
    EXECUTE format('ALTER TABLE bb_progress DROP CONSTRAINT %I', con.conname);
    RAISE NOTICE 'Eski kısıt kaldırıldı: %', con.conname;
  END LOOP;
END $$;

-- ── 3. Yeni UNIQUE(student_id, kit, task_id) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bb_progress_student_kit_task_key'
  ) THEN
    ALTER TABLE bb_progress
      ADD CONSTRAINT bb_progress_student_kit_task_key UNIQUE (student_id, kit, task_id);
    RAISE NOTICE 'Yeni kısıt eklendi: bb_progress_student_kit_task_key';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_progress_student_kit ON bb_progress(student_id, kit);

-- ── 4. BACKFILL: eksik kit seed'lerini tamamla ──
-- Her öğrenci için: (ana kit + kits listesindeki her kit) taranır.
-- O kit'te HİÇ progress satırı yoksa ve bb_tasks'ta görev varsa
-- (berrybot için 1-36 her zaman) → locked satırlar + ilk görev active.
DO $$
DECLARE
  s RECORD;
  k TEXT;
  n INT;
BEGIN
  FOR s IN SELECT id, kit, kits FROM bb_users WHERE role = 'student' LOOP
    FOR k IN
      SELECT DISTINCT x FROM (
        SELECT jsonb_array_elements_text(COALESCE(to_jsonb(s.kits), '[]'::jsonb)) AS x
        UNION
        SELECT s.kit
      ) t
      WHERE x IS NOT NULL AND x <> ''
    LOOP
      IF NOT EXISTS (SELECT 1 FROM bb_progress WHERE student_id = s.id AND kit = k) THEN
        WITH ids AS (
          SELECT task_id FROM bb_tasks WHERE kit = k AND active = true
          UNION
          SELECT gs FROM generate_series(1, 36) gs WHERE k = 'berrybot'
        ),
        ord AS (
          SELECT task_id, row_number() OVER (ORDER BY task_id) AS rn FROM ids
        )
        INSERT INTO bb_progress (student_id, task_id, status, kit)
        SELECT s.id, task_id,
               CASE WHEN rn = 1 THEN 'active' ELSE 'locked' END,
               k
        FROM ord
        ON CONFLICT (student_id, kit, task_id) DO NOTHING;

        GET DIAGNOSTICS n = ROW_COUNT;
        IF n > 0 THEN
          RAISE NOTICE 'Seed: öğrenci % / kit % → % görev', s.id, k, n;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ── Kontrol: kit başına satır sayıları ──
SELECT kit, count(*) AS satir, count(DISTINCT student_id) AS ogrenci
FROM bb_progress GROUP BY kit ORDER BY kit;
