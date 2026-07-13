# RoboArm Entegrasyonu — Değişiklik Notları

## Ne değişti?

### 1. Kit seçimi: Tank ve PicoBricks çıkarıldı, RoboArm eklendi
- `src/App.jsx` → `KITS` objesi artık sadece **berrybot** ve **roboarm** içeriyor.
- RoboArm teması: ahşap-turuncu (marka renginiz #E8611A), koyu ahşap UI paleti.
- Tüm kit dropdown'ları (öğrenci ekleme, düzenleme, filtre) güncellendi: 🦾 RoboArm.
- Login footer'daki PicoBricks logosu kaldırıldı; `TankRobot3D.jsx` ve `PicoBricks3D.jsx` silindi.
- `public/logos/roboarm.png` eklendi (RoboGPT ROBOARM logosu) — login başlığı otomatik kullanır.

### 2. Yeni 3D bileşen: `src/RoboArm3D.jsx`
BerryBot3D ile birebir aynı arayüz (height, autoRotate, interactive...).
Ahşap 4 eksenli kol: dönen taban, omuz kulesi + siyah MG996R, dirsek, bilek,
açılıp kapanan gripper ve kavradığı turuncu küp — hepsi animasyonlu.
Kit seçme ekranında ve öğrenci panelinde otomatik görünür.

### 3. 72 görevlik RoboArm müfredatı: `supabase/003_roboarm_tasks.sql`
- **Resim GEREKMEZ**: sistemdeki `TaskImage` bileşeni görsel yoksa emojiye düşer;
  RoboArm görevlerinin tamamı zengin emoji + net metin (görev / örnek çözüm / kazanımlar) ile tasarlandı.
  `image_url` alanları boş — hiçbir görsel yüklemeniz gerekmiyor.
- Dosya `bb_tasks` tablosunu da oluşturur (yoksa) — kod bu tabloyu kullanıyor ama
  eski şema dosyasında tanımı yoktu.
- Tekrar çalıştırılabilir: başta `DELETE FROM bb_tasks WHERE kit='roboarm'` var.

## Müfredat yapısı (2 aylık program, 14 bölüm / 72 görev)

| Hafta | Bölüm | Görevler | İçerik |
|---|---|---|---|
| 1 | Servo Temelleri | 1–8 | 30°→100° hareket, repeat, hız değişkeni, 4 eksen, sınırlar, ilk kavrama |
| 2 | Döngü & Değişken | 9–14 | süpürme, ivme, iç içe döngü, fonksiyon, random, pozisyon dizileri |
| 2–3 | Gamepad | 15–20 | tek eksen → 4 eksen, turbo, ev tuşu, taşıma yarışı, makro |
| 3 | Buton | 21–23 | dijital giriş, sayaç, debounce, uzun/kısa basış |
| 3–4 | Potansiyometre | 24–27 | analog okuma, map, kukla modu, canlı hız, deadzone |
| 4 | Mesafe Sensörü | 28–32 | okuma, refleks, temassız kontrol, otonom kavrama, radar |
| 4–5 | Buzzer | 33–36 | hareket sesi, geri vites, park sensörü, melodi |
| 5 | RGB LED | 37–39 | durum ışığı, açıya göre renk, kavrama ışığı |
| 5–6 | LDR | 40–42 | ışık okuma, ayçiçeği takibi, karanlık modu |
| 6 | OLED Ekran | 43–46 | I2C, canlı açı paneli, bar grafik, skor ekranı |
| 6–7 | Sıcaklık & Röle | 47–50 | termometre, röle, akıllı fan, güvenlik kolu |
| 7 | Parkur | 51–57 | pick&place, silindir, kule, ayrıştırma, **X-O-X (3 görev)** |
| 8 | Otomasyon | 58–64 | üretim bandı, fener kodu, gece bekçisi, **teach&repeat**, easing |
| 8 | Final Projesi | 65–72 | şema, 3 final seçeneği, kod temizliği, demo günü, mezuniyet |

Pedagojik kalıp her donanımda aynı: **yap → tekrarla → parametrele → birleştir**
(sizin 1-2-3 örneğiniz görev 1-2-3 olarak birebir müfredatta).
XP: kolay 10 → final 50. Zorluk 1–5. Süre 10–60 dk.

## Kurulum sırası (ÖNEMLİ)

1. Supabase Dashboard → SQL Editor → `003_roboarm_tasks.sql` içeriğini yapıştır, çalıştır.
2. Kontrol: `SELECT count(*) FROM bb_tasks WHERE kit='roboarm';` → **72** dönmeli.
3. Uygulamayı deploy et (`npm install && npm run build` — kod değişiklikleri src'de).
4. **SQL'den SONRA** RoboArm öğrencisi ekle: öğrenci oluşturulurken sistem
   `bb_tasks`'tan kitin görevlerini çekip ilk görevi "Aktif" olarak açar
   (db.js'teki mevcut mantık). SQL'den önce eklenen roboarm öğrencisi görev göremez.
5. Mevcut bir öğrenciyi RoboArm'a geçirmek için admin panelindeki kit dropdown'ını
   kullan — ilerleme kit bazında ayrı tutuluyor.

## Görevleri düzenlemek
Admin → Görev Editörü zaten `bb_tasks` üzerinde çalışıyor; RoboArm görevlerini
oradan tek tek düzenleyebilir, 73+ id ile yeni görev ekleyebilirsiniz.
İsterseniz sonradan herhangi bir göreve görsel de ekleyebilirsiniz (image_url) —
ama gerekmez, emoji fallback her yerde devrede.

## Not
- `npm run build` bu ortamda test edilemedi (kayıt deposu erişimi kapalıydı);
  değişiklikler mevcut kalıplara birebir uyularak yapıldı ve parantez/yapı
  dengeleri doğrulandı. İlk deploy'da build hatası çıkarsa mesajı paylaşın.
