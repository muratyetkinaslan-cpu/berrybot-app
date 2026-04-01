# BerryBot LMS — Ücretsiz Deploy Rehberi

## 1. Supabase Kurulumu (Ücretsiz)
1. supabase.com → Sign Up → New Project
2. SQL Editor → 001_schema.sql yapıştır → Run
3. SQL Editor → 002_seed.sql yapıştır → Run (68 öğrenci + admin + eğitmenler)
4. Settings → API → Project URL ve anon key kopyala
5. Database → Replication → supabase_realtime → bb_progress, bb_student_meta, bb_logs ekle

## 2. Vercel Deploy (Ücretsiz)
1. GitHub'a push et
2. vercel.com → Import Project → Environment Variables:
   - VITE_SUPABASE_URL = Supabase Project URL
   - VITE_SUPABASE_ANON_KEY = Supabase anon key
3. Deploy!

## 3. Görseller: public/tasks/gorev_X/gorsel.jpg + cevap.jpg

## Lokal: npm install && npm run dev (.env dosyasını oluştur)
