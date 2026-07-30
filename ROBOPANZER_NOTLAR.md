# 🪖 RoboPanzer LMS — Kurulum ve Entegrasyon Notları

RoboArm v3 kurulumuyla birebir aynı kalıp: **1 SQL dosyası + cevap anahtarı
klasörü + 1 yeni 3D bileşen + App.jsx'e KITS kaydı.** Görsel yüklemek
GEREKMEZ — tüm görevler zengin emoji + net metinle tasarlandı (TaskImage
emoji fallback'i devrede).

## 🎖️ Konsept: Savaş Temalı, Rütbeli Müfredat (60 görev)

Öğrenci **ER** rütbesiyle başlar, her bölümü bitirdikçe rütbe atlar,
60. görevde **MAREŞAL** olarak mezun olur. Rütbe, LMS'in mevcut `category`
alanına gömülüdür — hiçbir kod değişikliği gerekmeden bölüm başlıklarında
rütbe olarak görünür:

| Rütbe (kategori) | Görevler | İçerik | XP |
|---|---|---|---|
| 🪖 ER · Acemi Ocağı | 1–6 | ileri/geri, palet dönüşü, tekrar, hız değişkeni, kare devriye | 10–15 |
| 🥾 ONBAŞI · Sürüş Okulu | 7–12 | fonksiyon, slalom, hız rampası, korna, geri vites, **ilk parkur turu** | 10–20 |
| 📡 ÇAVUŞ · Keşif ve Radar | 13–18 | ultrasonik, engelde dur/kaç, **Engel Alanı**, konvoy, **DUR-KALK** | 15–20 |
| 🛤️ ASTSUBAY · Çizgi Takip Timi | 19–24 | sensör tanıma, tek/çift sensör takip, kavşak sayacı, **hat devriyesi** | 15–30 |
| 🌙 TEĞMEN · Gece Operasyonları | 25–28 | LDR, otomatik far, gece devriyesi, ışığa yönelme | 15–20 |
| 📻 ÜSTEĞMEN · Sinyal ve İletişim | 29–33 | marşlar, durum ışıkları, Mors SOS, sinyaller, buton parolası | 15–25 |
| 🖥️ YÜZBAŞI · Komuta Ekranı | 34–38 | I2C ekran, canlı radar paneli, hız göstergesi, görev sayacı, tank yüzü | 15–25 |
| 🔥 BİNBAŞI · Matrix ve Termal | 39–43 | 8×8 matrix adresleme, nişangâh, ok animasyonu, DHT11, ısınma alarmı | 20–30 |
| 🗺️ YARBAY · Parkur Harekâtı | 44–51 | **Park Alanı, park sensörü, Teslimat, Renk Algılama, Küp Alanı**, kronometre, konvoy, kontrol noktası | 25–35 |
| ⚔️ ALBAY · Otonom Muharebe | 52–56 | sumo, kale savunması, gece baskını, ışık parolası (IFF), görev zinciri | 35–40 |
| 🎖️ GENERAL · İleri Teknoloji | 57–59 | **ESP32-CAM keşif**, **Nerf topçusu**, otonom nişancı | 45–50 |
| ⭐ MAREŞAL · Büyük Harekât | 60 | mezuniyet finali: tüm parkur + sunum | 60 |

Pedagojik kalıp BerryBot/RoboArm ile aynı: **yap → tekrarla → parametrele →
birleştir.** Parkur (parkur.webp) 12 görevde aktif kullanılıyor: Başlangıç,
Dur-Kalk, Engel Alanı, çizgi hattı, Park, Teslimat, Renk Algılama, Küp
Alanı, Bitiş. ESP32-CAM ve Nerf eklentileri istenildiği gibi **GENERAL**
rütbesine (ileri görevler, 57–59) konumlandı.

## 🔌 RoboPanzer Pin Haritası (Pico)

| Bağlantı | Modül | Bağlantı | Modül |
|---|---|---|---|
| DC Motor 1 | Sol palet | GP6 | RGB farlar (4× WS2812) |
| DC Motor 2 | Sağ palet | GP7 | 8×8 Matrix (64× WS2812) |
| GP3 / GP2 | Ultrasonik trig/echo | GP20 | Buzzer |
| GP14 | Çizgi sensörü SOL | GP4 / GP5 | İ2C ekran SDA/SCL (0x3C) |
| GP15 | Çizgi sensörü SAĞ | GP11 | DHT11 sıcaklık |
| GP27 (ADC1) | LDR | GP12 | Röle (ESP32-CAM gücü) |
| GP13 | Buton | GP16 | Nerf tetik / kargo servosu |

Cevap anahtarları bu haritaya göre yazıldı. Donanımınız farklıysa tek
yapılacak şey bloklardaki pin numarasını değiştirmek. Matrix, RoboExx'in
mevcut **RGB (WS2812)** bloklarıyla sürülüyor (`başlat pin 7 · 64 LED`,
LED no = satır×8 + sütun) — yeni blok gerekmez. İ2C ekran görevleri
RoboExx'in **OLED** bloklarını kullanır. RoboExx'e ileride özel LCD/matrix
blokları eklerseniz görevler Admin → Görev Editörü'nden güncellenebilir.

## 📁 Paket İçeriği

```
supabase/006_robopanzer_tasks.sql        → 60 görev (rütbeli müfredat)
public/cevap_anahtari_robopanzer/        → 60 RoboExx projesi + 00_INDEX.json
src/RoboPanzer3D.jsx                     → animasyonlu 3D tank (kule tarar,
                                           farlar yanar, namlu nefes alır)
ROBOPANZER_NOTLAR.md                     → bu dosya
```

## 🛠️ Kurulum Sırası (ÖNEMLİ)

1. **SQL:** Supabase Dashboard → SQL Editor → `006_robopanzer_tasks.sql`
   içeriğini yapıştır, çalıştır.
   Kontrol: `SELECT count(*) FROM bb_tasks WHERE kit='robopanzer';` → **60**
2. **Dosyaları kopyala:**
   - `src/RoboPanzer3D.jsx` → projenin `src/` klasörüne
   - `public/cevap_anahtari_robopanzer/` → projenin `public/` klasörüne
3. **App.jsx'e kiti ekle (2 küçük dokunuş):**

   a) İmport satırlarına (RoboArm3D'nin altına):
   ```jsx
   import RoboPanzer3D from "./RoboPanzer3D";
   ```

   b) `KITS` objesine, `roboarm`'ın hemen ardından:
   ```jsx
   robopanzer: {
     id: "robopanzer",
     name: "RoboPanzer",
     tagline: "Paletli Muharebe Tankı",
     desc: "Radar, çizgi takibi, gece görüşü, komuta ekranı ve Nerf topçusuyla tam donanımlı eğitim tankı. Er'den Mareşal'e rütbeli görev sistemi.",
     icon: "🪖",
     primaryColor: "#5A7248",
     accentColor: "#C8A24A",
     bgGradient: "linear-gradient(135deg,#0e1408,#22301a,#131c0c)",
     Component3D: RoboPanzer3D,
     theme: {
       // Marka renkleri (haki-altın)
       orange: "#C8A24A", od: "#9c7c30", ol: "#e2c06a",
       purple: "#5A7248", pl: "#87a06e", pd: "#3c5030",
       // Temel arayüz paleti (koyu kamuflaj tonları)
       bg: "#141a0e", card: "#1e2815", input: "#0e1409", dark: "#090d05",
       border: "#37452a", tp: "#eef4e4", ts: "#a8b894", tm: "#697a56",
     },
   },
   ```
   Öğrenci ekleme/düzenleme dropdown'ları `Object.values(KITS)` üzerinden
   dolduğu için başka değişiklik gerekmez.
4. **(İsteğe bağlı) logo:** `public/logos/robopanzer.png` eklerseniz login
   başlığı otomatik kullanır; yoksa 🪖 emoji fallback devrede.
5. **Deploy:** `npm install && npm run build` (dev için `npm run dev`).
6. **SQL'den SONRA** RoboPanzer öğrencisi ekleyin — öğrenci oluşturulurken
   sistem `bb_tasks`'tan kitin görevlerini çekip ilkini "Aktif" açar.
   Mevcut öğrenciyi geçirmek için admin panelindeki kit dropdown'ını
   kullanın; ilerleme kit bazında ayrı tutulur.

## 🗝️ Cevap Anahtarları (RoboExx)

- `public/cevap_anahtari_robopanzer/` altında 60 adet `.json` — RoboExx'te
  **Projeler → İçe Aktar** ile açılır.
- `00_INDEX.json` görev↔dosya eşlemesini ve pin haritasını içerir.
- RoboArm v3'te düzeltilen iki seri hataya burada da dikkat edildi:
  "Sürekli tekrarla" her zaman "Başlangıçta"nın İÇİNDEKİ zincirin son
  bloğu; fonksiyon tanımları bağımsız üst blok olarak ayrı kaydedildi.
- Sahaya bağlı görevlerde (12, 24, 44, 47, 49…) anahtardaki süre/eşik
  değerleri başlangıç noktasıdır; parkurda kalibre edilmesi görevin
  kendisidir ve açıklamada öğrenciye söylenir.
- Görev 60 serbest final projesidir; anahtar örnek bir çözüm şablonudur.

## 🧨 İleri Görev Donanım Notları (GENERAL rütbesi)

- **57 · ESP32-CAM:** kamera GP12 rölesi üzerinden güç alır; WiFi yayını
  kendi arayüzünden izlenir. Program, güç + ekran + yavaş keşif devriyesini
  yönetir.
- **58–59 · Nerf:** tetik GP16 servosuna bağlanır (60°=emniyet, 120°=ateş).
  Görev metinlerine güvenlik protokolü gömülüdür (geri sayım, "namluyu
  insana doğrultma" kuralı). Atölyede hedef tahtası kullanın.

## ⚠️ Not

`npm run build` bu ortamda test edilemedi (paket deposu erişimi kapalı);
`RoboPanzer3D.jsx` mevcut `RoboArm3D.jsx` kalıbına birebir uyularak yazıldı
(aynı props arayüzü: height / autoRotate / interactive / background).
İlk deploy'da bir hata çıkarsa mesajı paylaşın.
