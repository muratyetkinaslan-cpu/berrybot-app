-- ═══════════════════════════════════════
-- BerryBot LMS — Supabase Schema
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ═══════════════════════════════════════

-- 1. USERS (admin, instructor, student)
CREATE TABLE IF NOT EXISTS bb_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','instructor','student')),
  instructor_id TEXT REFERENCES bb_users(id),
  class_id TEXT,
  grup TEXT DEFAULT 'Büyük',
  telefon TEXT,
  durum TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TASK PROGRESS (per student per task)
CREATE TABLE IF NOT EXISTS bb_progress (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES bb_users(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','active','in_progress','pending_review','approved','rejected')),
  started_at BIGINT,
  completed_at BIGINT,
  approved_at BIGINT,
  photo TEXT,            -- base64 photo from student
  instructor_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, task_id)
);

-- 3. AUDIT LOGS
CREATE TABLE IF NOT EXISTS bb_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  user_id TEXT REFERENCES bb_users(id),
  target_user TEXT REFERENCES bb_users(id),
  task_id INTEGER,
  detail TEXT,
  ts BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENT META (online status, help requests)
CREATE TABLE IF NOT EXISTS bb_student_meta (
  student_id TEXT PRIMARY KEY REFERENCES bb_users(id) ON DELETE CASCADE,
  online BOOLEAN DEFAULT FALSE,
  last_seen BIGINT,
  help_request BIGINT  -- timestamp when help was requested, null = no request
);

-- 5. CLASS LAYOUTS (stored as JSON per class)
CREATE TABLE IF NOT EXISTS bb_class_layouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  instructor_id TEXT REFERENCES bb_users(id),
  canvas_h INTEGER DEFAULT 700,
  layout_json JSONB NOT NULL DEFAULT '{"tables":[],"objects":[]}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_progress_student ON bb_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON bb_progress(status);
CREATE INDEX IF NOT EXISTS idx_logs_ts ON bb_logs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user ON bb_logs(user_id);

-- ═══ RLS (Row Level Security) — disable for simplicity, enable later ═══
ALTER TABLE bb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_student_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_class_layouts ENABLE ROW LEVEL SECURITY;

-- Allow all for now (you can restrict later)
CREATE POLICY "Allow all on bb_users" ON bb_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bb_progress" ON bb_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bb_logs" ON bb_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bb_student_meta" ON bb_student_meta FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bb_class_layouts" ON bb_class_layouts FOR ALL USING (true) WITH CHECK (true);
