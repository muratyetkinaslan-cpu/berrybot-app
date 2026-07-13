# RoboArm Müfredatı v3 — Arduino Uno + Sensor Shield (71 Görev)

## v2'de cevap anahtarları neden boş açılıyordu?
İki yapısal seri hatası vardı; ikisi de düzeltildi:
1. **"Sürekli tekrarla"** bloğu "Başlangıçta" bloğunun ALTINA (next) bağlanmıştı;
   oysa "Başlangıçta"nın alt bağlantısı yoktur. Doğrusu: sürekli-tekrarla,
   "Başlangıçta"nın İÇİNDEKİ zincirin son bloğu olmalı. ✔ Düzeltildi.
2. **Fonksiyon tanımları** zincirin içine bağlanmıştı; oysa fonksiyon tanımı
   bağımsız bir üst bloktur. ✔ Artık ayrı üst blok olarak, ana bloktan önce
   kaydediliyor. Görev 8 ilk fonksiyonlu görev olduğu için "8'den sonrası boş"
   görülüyordu.

## v3 donanım değişiklikleri (PCA9685 KALDIRILDI)
Servolar artık **doğrudan pinlere** bağlı ("servo açısı" bloğu):

| Pin | Modül | Pin | Modül |
|-----|-------|-----|-------|
| D2  | Buton | D8  | Buzzer |
| D3  | Röle  | D9/D10/D11 | RGB modülü (R/G/B — dijital) |
| D4  | Taban servo | D12 | HC-SR04 Trig |
| D5  | Omuz servo  | D13 | HC-SR04 Echo |
| D6  | Dirsek servo| A0 ('26') | Potansiyometre |
| D7  | Tutucu servo| A1 ('27') | LDR |
|     |             | A2 ('28') | 2. pot / 2. LDR / LM35 |

Arduino tarafında desteklenmediği için müfredattan çıkarılan/degiştirilen bloklar:
- **OLED → Seri Monitör** (Bölüm 10 ve sonrası "yazdır" kullanır)
- **WS2812 RGB → 3 pinli dijital RGB modülü** (renk fonksiyonları: 3× dijital yaz)
- **DHT11 / dahili sıcaklık → LM35 (A2)**: `sicaklik = analog(A2) × 500 / 1024`
- Gamepad blokları Arduino'da ÇALIŞIR (USB seri canlı bağlantı, RoboExx sekmesi
  açık kalmalı).

## Güvenli açı kuralları (kol bozulmasın!)
- Taban/omuz/dirsek: **30–150°** · Tutucu: **40–140°** (40 kapalı, 140 açık)
- Tüm cevap anahtarlarında sabit açılar bu aralıkta; değişken açılar otomatik
  **"sınırla"** bloğuna sarılıdır. Servo bloğu ayrıca 0-180 kırpması yapar.
- RGB pinleri (9/10/11) yalnızca DİJİTAL kullanılır; Servo kütüphanesi D9/D10
  PWM'ini, ton bloğu D3/D11 PWM'ini devre dışı bıraktığı için PWM renk
  karışımı bu kurulumda mümkün değildir (8 saf renk yeterlidir).

## ZORUNLU: RoboExx yaması (analog bloklar)
RoboExx'in Arduino üreticisi pot/LDR/analog için `analogRead(A26)` üretir —
bu Uno'da **derlenmez**. `roboexx-yama/arduino-generator.ts` dosyasını
RoboExx projesinde `src/blockly/arduino-generator.ts` ile değiştirin ve
RoboExx'i yeniden derleyin. Yama ayrıca pot/LDR'yi Pico ile aynı **0-100**
ölçeğine getirir; cevap anahtarları bu ölçeğe göre yazılmıştır.
Ayrıntı: `roboexx-yama/YAMA_NOTU.md`.

## Kurulum sırası
1. Supabase Dashboard → SQL Editor → `supabase/005_roboarm_tasks_v3.sql`
   dosyasını çalıştır (eski roboarm kayıtlarını silip 71 görevi yükler).
2. Doğrula: `SELECT count(*) FROM bb_tasks WHERE kit='roboarm';` → **71**
3. RoboExx yamasını uygula (yukarıda).
4. LMS: `npm install && npm run build` (veya dev için `npm run dev`).
5. Öğrencileri SQL'den SONRA ekleyin.

## Cevap anahtarları
`public/cevap_anahtari/` altında 71 adet `.json` — RoboExx'te
**Projeler → İçe Aktar** ile açılır. `00_INDEX.json` görev↔dosya eşlemesi ve
pin haritasını içerir. Görev 67 serbest projedir; anahtar, örnek bir çözümdür.

## Müfredat akışı (71 görev)
1-7 Servo Temelleri · 8-11 Buzzer · 12-14 RGB LED · 15-20 Döngü ve Değişken ·
21-23 Buton · 24-27 Potansiyometre · 28-32 Mesafe Sensörü · 33-38 Gamepad ·
39-41 Işık Sensörü · 42-45 Seri Monitör · 46-49 Sıcaklık ve Röle ·
50-56 Parkur (pick&place, silindir, kule, ayrıştırma, X-O-X) ·
57-63 Otomasyon (üretim bandı, fener kodu, bekçi, teach&repeat, easing) ·
64-71 Final Projeleri.
Not: "Sınırları Keşfet" görevi kaldırıldı; buzzer+RGB öne alındı; gamepad
33-38'e ertelendi.
