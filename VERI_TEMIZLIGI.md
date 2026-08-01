# 🧹 Veri Temizliği Paneli

Admin girişi → üst menü → **🧹 Veri Temizliği**

## Kurulum (tek seferlik)

Supabase Dashboard → SQL Editor → `supabase/006_data_cleanup.sql` içeriğini yapıştır → Run.

Bu migration olmadan panel açılır ama **kalıcı silme ve disk boyutu ölçümü çalışmaz**.

Migration şunları yapar:
- `bb_users` tablosuna arşiv kolonları ekler (`durum`, `arsiv_at`, `arsiv_sebep`)
- `bb_cleanup_log` — yapılan her temizliğin kaydı
- `bb_deleted_archive` — silinen öğrencinin tam kopyası (geri yükleme için)
- **Foreign key düzeltmeleri** — mevcut şemada `bb_logs.user_id` CASCADE'siz olduğu için bir kullanıcıyı silmeye çalışınca hata alıyordun. Bu düzeliyor.
- `bb_db_stats()` ve `bb_purge_user()` fonksiyonları

## Nasıl çalışır

Silme **iki aşamalı**. Tek tıkla kalıcı silme yok — bilerek.

```
Aktif öğrenci
   ↓  "Ayrılanlar" sekmesi → Arşive taşı
Arşiv  (giriş yapamaz, listelerde görünmez, verisi durur)
   ↓  30 gün bekleme + "KALICI SIL" yazma + otomatik yedek
Silindi  (yedek kasasından geri yüklenebilir)
```

## Sekmeler

**📊 Durum** — Hangi tablo ne kadar yer kaplıyor, ne temizlenebilir. Sadece rapor, hiçbir şey silmez.

**🎓 Ayrılanlar** — 90/180/365 gündür giriş yapmamış öğrenciler. Bu bir *tahmin* — sistem kimin ayrıldığını bilemez, sadece kimin girmediğini bilir. Sen seçersin, sistem seçmez.

**📦 Arşiv** — Kalıcı silme burada. Silmeden önce:
- "Ne silinecek?" ile satır satır önizleme
- JSON yedek otomatik indirilir
- `KALICI SIL` yazman istenir
- Veritabanına da bir kopya saklanır

**🧹 Hızlı Temizlik** — Öğrenci kaydına dokunmayan işlemler. Genelde en çok yeri bunlar açar:
- Eski işlem kayıtları (`bb_logs` — her giriş buraya yazılıyor, sınırsız büyür)
- Bitmiş görevlerin fotoğrafları (DB + Storage)
- Sahipsiz satırlar (eski silmelerden kalan artıklar)

Her biri önce **"Önce say"** ile kaç satır gideceğini gösterir.

**📒 Defter** — Yapılan tüm temizlikler + yedek kasası (geri yükleme).

## Önerilen sıra

1. **Durum** sekmesinde ne olduğuna bak
2. **Hızlı Temizlik** → log temizliği (en çok yeri bu açar, en düşük riskli)
3. **Hızlı Temizlik** → fotoğraf + sahipsiz satır
4. **Ayrılanlar** → gerçekten ayrılmış olanları arşivle
5. 30 gün sonra → **Arşiv** → kalıcı sil

## ⚠ Önce çözülmesi gereken güvenlik açığı

`src/db.js` içinde Supabase anon key sabit yazılı ve tüm tablolarda RLS politikası
`USING (true) WITH CHECK (true)` — yani **herkese açık**.

Bu şu anlama geliyor: siteyi açan herkes tarayıcı konsolundan tüm öğrenci verisini
okuyabilir ve silebilir. Şifreler de `bb_users.password` içinde düz metin duruyor.

Silme özelliği eklemek bu riski büyütmez (zaten silinebiliyordu) ama artık
ciddiye alınması gerekiyor. Yapılması gerekenler, önem sırasıyla:

1. Supabase Auth'a geçiş — şifreleri kendin saklama
2. RLS politikalarını role göre daralt (öğrenci sadece kendi satırını görsün)
3. Silme işlemlerini `SECURITY DEFINER` fonksiyona taşı, sadece admin çağırabilsin
