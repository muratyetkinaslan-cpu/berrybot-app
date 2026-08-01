-- ═══════════════════════════════════════════════════════════════
-- BerryBot LMS — 006: Veri Temizliği Altyapısı
-- Supabase Dashboard > SQL Editor'da BİR KEZ çalıştır.
-- Bu dosya idempotent'tir: tekrar çalıştırmak zarar vermez.
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. ARŞİV KOLONLARI (yumuşak silme)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE bb_users ADD COLUMN IF NOT EXISTS durum TEXT DEFAULT 'Aktif';
ALTER TABLE bb_users ADD COLUMN IF NOT EXISTS arsiv_at BIGINT;
ALTER TABLE bb_users ADD COLUMN IF NOT EXISTS arsiv_sebep TEXT;
ALTER TABLE bb_users ADD COLUMN IF NOT EXISTS arsivleyen TEXT;

UPDATE bb_users SET durum = 'Aktif' WHERE durum IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_durum ON bb_users(durum);

-- ───────────────────────────────────────────────────────────────
-- 2. TEMİZLİK KAYIT DEFTERİ
--    Silinen her şeyin kim tarafından, ne zaman silindiğini tutar.
--    Bu tablo ASLA otomatik temizlenmez.
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bb_cleanup_log (
  id          BIGSERIAL PRIMARY KEY,
  islem       TEXT NOT NULL,          -- 'arsivle' | 'geri_al' | 'kalici_sil' | 'log_temizle' | ...
  hedef_tip   TEXT,                   -- 'user' | 'log' | 'progress' | 'storage' ...
  hedef_id    TEXT,
  hedef_ad    TEXT,                   -- silinen kişinin adı (FK yok, kalıcı kayıt)
  satir_sayisi INTEGER DEFAULT 0,
  detay       JSONB,                  -- tablo bazlı silinen satır dökümü
  yapan_id    TEXT,
  yapan_ad    TEXT,
  ts          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cleanup_log_ts ON bb_cleanup_log(ts DESC);

-- ───────────────────────────────────────────────────────────────
-- 3. YEDEK KASASI
--    Kalıcı silmeden önce öğrencinin tüm verisi buraya JSON olarak
--    kopyalanır. Kaza durumunda buradan geri dönülebilir.
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bb_deleted_archive (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  user_ad     TEXT,
  user_email  TEXT,
  snapshot    JSONB NOT NULL,
  silen_id    TEXT,
  silen_ad    TEXT,
  ts          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_deleted_archive_user ON bb_deleted_archive(user_id);

-- ───────────────────────────────────────────────────────────────
-- 4. FOREIGN KEY DÜZELTMELERİ  ★ KRİTİK
--    Mevcut şemada bb_logs.user_id → bb_users(id) CASCADE'siz.
--    Bu yüzden bir kullanıcıyı silmeye çalışınca FK hatası alırsın.
--    Aşağısı silmeyi mümkün kılar ve log'ları anonimleştirir.
-- ───────────────────────────────────────────────────────────────
DO $$
DECLARE
  fk RECORD;
BEGIN
  -- bb_logs.user_id / target_user → SET NULL (log satırı kalır, kimlik düşer)
  FOR fk IN
    SELECT con.conname, cl.relname AS tbl, att.attname AS col
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND cl.relname = 'bb_logs'
      AND att.attname IN ('user_id', 'target_user')
  LOOP
    EXECUTE format('ALTER TABLE bb_logs DROP CONSTRAINT %I', fk.conname);
    EXECUTE format(
      'ALTER TABLE bb_logs ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES bb_users(id) ON DELETE SET NULL',
      fk.conname, fk.col
    );
  END LOOP;

  -- bb_class_layouts.instructor_id → SET NULL (sınıf düzeni korunur)
  FOR fk IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f' AND cl.relname = 'bb_class_layouts' AND att.attname = 'instructor_id'
  LOOP
    EXECUTE format('ALTER TABLE bb_class_layouts DROP CONSTRAINT %I', fk.conname);
    EXECUTE format(
      'ALTER TABLE bb_class_layouts ADD CONSTRAINT %I FOREIGN KEY (instructor_id) REFERENCES bb_users(id) ON DELETE SET NULL',
      fk.conname
    );
  END LOOP;

  -- bb_users.instructor_id (self-ref) → SET NULL
  FOR fk IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f' AND cl.relname = 'bb_users' AND att.attname = 'instructor_id'
  LOOP
    EXECUTE format('ALTER TABLE bb_users DROP CONSTRAINT %I', fk.conname);
    EXECUTE format(
      'ALTER TABLE bb_users ADD CONSTRAINT %I FOREIGN KEY (instructor_id) REFERENCES bb_users(id) ON DELETE SET NULL',
      fk.conname
    );
  END LOOP;
END $$;

-- Öğrenciye bağlı veri tabloları → CASCADE (öğrenci gidince verisi de gider)
DO $$
DECLARE
  t TEXT;
  c TEXT;
  fk RECORD;
  pairs TEXT[][] := ARRAY[
    ARRAY['bb_progress','student_id'],
    ARRAY['bb_student_meta','student_id'],
    ARRAY['bb_practice_progress','student_id'],
    ARRAY['bb_answer_unlock','student_id'],
    ARRAY['bb_homework_submission','student_id'],
    ARRAY['bb_homework_assignment','student_id']
  ];
  i INT;
BEGIN
  FOR i IN 1..array_length(pairs, 1) LOOP
    t := pairs[i][1];
    c := pairs[i][2];

    -- tablo veya kolon yoksa atla
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = c
    ) THEN
      CONTINUE;
    END IF;

    FOR fk IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
      WHERE con.contype = 'f' AND cl.relname = t AND att.attname = c
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', t, fk.conname);
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES bb_users(id) ON DELETE CASCADE',
        t, fk.conname, c
      );
    END LOOP;
  END LOOP;
END $$;

-- ───────────────────────────────────────────────────────────────
-- 5. İSTATİSTİK FONKSİYONU — hangi tablo ne kadar yer kaplıyor
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION bb_db_stats()
RETURNS TABLE (tablo TEXT, satir BIGINT, boyut TEXT, boyut_bytes BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  n BIGINT;
BEGIN
  FOR r IN
    SELECT c.relname AS t
    FROM pg_class c
    JOIN pg_namespace ns ON ns.oid = c.relnamespace
    WHERE ns.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'bb_%'
    ORDER BY pg_total_relation_size(c.oid) DESC
  LOOP
    EXECUTE format('SELECT count(*) FROM %I', r.t) INTO n;
    tablo := r.t;
    satir := n;
    boyut := pg_size_pretty(pg_total_relation_size(format('public.%I', r.t)::regclass));
    boyut_bytes := pg_total_relation_size(format('public.%I', r.t)::regclass);
    RETURN NEXT;
  END LOOP;
END $$;

-- ───────────────────────────────────────────────────────────────
-- 6. TEK ÖĞRENCİYİ KALICI SİLME — atomik (ya hepsi ya hiçbiri)
--    Not: SECURITY DEFINER DEĞİL. Mevcut RLS politikalarına uyar.
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION bb_purge_user(p_user_id TEXT, p_yapan_id TEXT DEFAULT NULL, p_yapan_ad TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_user      RECORD;
  v_detay     JSONB := '{}'::jsonb;
  v_toplam    INT := 0;
  v_n         INT;
  v_snapshot  JSONB;
  t           TEXT;
  tables      TEXT[] := ARRAY[
    'bb_progress','bb_student_meta','bb_practice_progress',
    'bb_answer_unlock','bb_homework_submission','bb_homework_assignment'
  ];
BEGIN
  SELECT * INTO v_user FROM bb_users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'hata', 'Kullanıcı bulunamadı: ' || p_user_id);
  END IF;

  -- ── Güvenlik: son admin silinemez ──
  IF v_user.role = 'admin' AND (SELECT count(*) FROM bb_users WHERE role = 'admin') <= 1 THEN
    RETURN jsonb_build_object('ok', false, 'hata', 'Sistemdeki tek admin silinemez.');
  END IF;

  -- ── Güvenlik: sadece arşivlenmiş kullanıcı kalıcı silinebilir ──
  IF COALESCE(v_user.durum, 'Aktif') <> 'Arşiv' THEN
    RETURN jsonb_build_object('ok', false, 'hata', 'Önce arşivle. Sadece arşivdeki kayıt kalıcı silinebilir.');
  END IF;

  -- ── Silmeden önce tam yedek al ──
  v_snapshot := jsonb_build_object('user', to_jsonb(v_user));
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name=t AND column_name='student_id') THEN
      EXECUTE format(
        'SELECT jsonb_build_object(%L, COALESCE(jsonb_agg(to_jsonb(x)), ''[]''::jsonb)) FROM %I x WHERE x.student_id = $1',
        t, t
      ) INTO v_detay USING p_user_id;
      v_snapshot := v_snapshot || v_detay;
    END IF;
  END LOOP;

  INSERT INTO bb_deleted_archive (user_id, user_ad, user_email, snapshot, silen_id, silen_ad)
  VALUES (p_user_id, v_user.name, v_user.email, v_snapshot, p_yapan_id, p_yapan_ad);

  -- ── Sil ──
  v_detay := '{}'::jsonb;
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name=t AND column_name='student_id') THEN
      EXECUTE format('DELETE FROM %I WHERE student_id = $1', t) USING p_user_id;
      GET DIAGNOSTICS v_n = ROW_COUNT;
      v_detay := v_detay || jsonb_build_object(t, v_n);
      v_toplam := v_toplam + v_n;
    END IF;
  END LOOP;

  -- kendi log satırları
  DELETE FROM bb_logs WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_detay := v_detay || jsonb_build_object('bb_logs', v_n);
  v_toplam := v_toplam + v_n;

  -- veli bağlantısını kopar
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='bb_users' AND column_name='child_id') THEN
    UPDATE bb_users SET child_id = NULL WHERE child_id = p_user_id;
  END IF;

  DELETE FROM bb_users WHERE id = p_user_id;
  v_toplam := v_toplam + 1;

  INSERT INTO bb_cleanup_log (islem, hedef_tip, hedef_id, hedef_ad, satir_sayisi, detay, yapan_id, yapan_ad)
  VALUES ('kalici_sil', 'user', p_user_id, v_user.name, v_toplam, v_detay, p_yapan_id, p_yapan_ad);

  RETURN jsonb_build_object('ok', true, 'toplam', v_toplam, 'detay', v_detay, 'ad', v_user.name);
END $$;

-- ───────────────────────────────────────────────────────────────
-- 7. YEDEKTEN GERİ YÜKLEME — kaza kurtarma
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION bb_restore_from_archive(p_archive_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_row   RECORD;
  v_snap  JSONB;
  t       TEXT;
  tables  TEXT[] := ARRAY[
    'bb_progress','bb_student_meta','bb_practice_progress',
    'bb_answer_unlock','bb_homework_submission','bb_homework_assignment'
  ];
BEGIN
  SELECT * INTO v_row FROM bb_deleted_archive WHERE id = p_archive_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'hata', 'Yedek bulunamadı.');
  END IF;

  v_snap := v_row.snapshot;

  IF EXISTS (SELECT 1 FROM bb_users WHERE id = v_row.user_id) THEN
    RETURN jsonb_build_object('ok', false, 'hata', 'Bu ID zaten kayıtlı, geri yüklenemez.');
  END IF;

  INSERT INTO bb_users SELECT * FROM jsonb_populate_record(NULL::bb_users, v_snap->'user');

  FOREACH t IN ARRAY tables LOOP
    IF v_snap ? t THEN
      EXECUTE format(
        'INSERT INTO %I SELECT * FROM jsonb_populate_recordset(NULL::%I, $1) ON CONFLICT DO NOTHING',
        t, t
      ) USING v_snap->t;
    END IF;
  END LOOP;

  INSERT INTO bb_cleanup_log (islem, hedef_tip, hedef_id, hedef_ad, detay)
  VALUES ('geri_yukle', 'user', v_row.user_id, v_row.user_ad, jsonb_build_object('archive_id', p_archive_id));

  RETURN jsonb_build_object('ok', true, 'ad', v_row.user_ad);
END $$;

-- ───────────────────────────────────────────────────────────────
-- 8. RLS — yeni tablolar
-- ───────────────────────────────────────────────────────────────
ALTER TABLE bb_cleanup_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_deleted_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on bb_cleanup_log" ON bb_cleanup_log;
CREATE POLICY "Allow all on bb_cleanup_log" ON bb_cleanup_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on bb_deleted_archive" ON bb_deleted_archive;
CREATE POLICY "Allow all on bb_deleted_archive" ON bb_deleted_archive FOR ALL USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- 9. PERFORMANS — temizlik sorguları için indeksler
-- ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_progress_photo_notnull
  ON bb_progress(student_id) WHERE photo IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- BİTTİ. Kontrol için:  SELECT * FROM bb_db_stats();
-- ═══════════════════════════════════════════════════════════════
