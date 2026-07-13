# RoboArm v2 — Müfredat Güncellemesi + Cevap Anahtarı

## Ne değişti?

| İstek | Yapılan |
|---|---|
| "Sınırları Keşfet" çıkar | Eski görev 5 **silindi**. (Öğrenciye "servoyu vızıldayana kadar zorla" dedirtiyordu — kol bozulma riski.) Servo sınırları artık **her göreve gömülü**: tüm açılar 30–150°, gripper 40/140. |
| Gamepad'i ileri tarihlere at | Gamepad **15–20 → 33–38**'e taşındı. Öğrenci önce kodlamayı (döngü, değişken, fonksiyon, sensör) öğreniyor, sonra kumandayı alıyor. |
| Buzzer + RGB LED'i öne al | Buzzer **33–36 → 8–11**, RGB LED **37–39 → 12–14**. Servo temellerinden hemen sonra: çocuk 2. haftada ses + ışık alıyor, motivasyon yüksek. |
| Toplam | 72 → **71 görev** |

## Robot kol güvenliği (cevap anahtarlarında zorunlu)
- **Hiçbir görevde 0° veya 180° yok.** Tüm sabit açılar 30–150 arası (304 servo yazımı tek tek doğrulandı).
- Değişkenle sürülen her servo `sınırla(deger, 30, 150)` bloğundan geçiyor → gamepad/pot/sensör bir uç değer üretse bile kol zorlanmaz.
- Gripper: **40 = kapalı**, **140 = açık**. Küp kavrama açısı **80°** (3 cm küp için ideal).
- Her program `PCA9685 başlat` ile açılıyor; çoğu ev pozisyonuyla (hepsi 90°) bitiyor.

## Cevap anahtarı — `public/cevap_anahtari/`
71 adet `.json`, **RoboExx'in kendi proje formatında**. Öğretmen RoboExx'te *Projeler → klasör seç* yapıp bu klasörü gösterir; tüm cevaplar bloklar hâlinde açılır.

- Format: `{ id, name, filename, mode: "blocks", blocksState, code, createdAt, updatedAt }`
- `blocksState` = `Blockly.serialization.workspaces.save()` çıktısı → RoboExx birebir yükler.
- Kullanılan bloklar **sadece** RoboExx toolbox'ında bulunanlar (doğrulandı, bilinmeyen blok yok):
  `rx_pca9685_init`, `rx_servo_v3`, `rx_buzzer_tone/note`, `rx_rgb_*`, `rx_ultrasonic_distance`,
  `rx_ldr_read`, `rx_potentiometer`, `rx_button_pressed`, `rx_gamepad_pressed/just_pressed`,
  `rx_oled_*`, `rx_relay`, `rx_internal_temp`, `rx_map`, `rx_abs`, `rx_millis`, `rx_print`
  \+ yerleşik: döngü / eğer / matematik / metin / değişken / fonksiyon.
- `00_INDEX.json` — görev listesi + pin haritası + hangi dosya hangi göreve ait.

### Pin haritası
PCA9685 SDA=4 SCL=5 · kanal **0**=taban **1**=omuz **2**=dirsek **3**=tutucu
Buzzer 20 · RGB 6 · Buton 10 · Trig 3 / Echo 2 · Röle 12 · Pot ADC0(26) · LDR ADC1(27) · OLED SDA4/SCL5

## Kurulum
1. Supabase → SQL Editor → `supabase/004_roboarm_tasks_v2.sql` çalıştır.
2. Kontrol: `SELECT count(*) FROM bb_tasks WHERE kit='roboarm';` → **71**.
3. `npm install && npm run build` → deploy.
4. SQL'DEN SONRA roboarm öğrencisi ekle (öğrenci oluşturulurken görevler `bb_tasks`'tan çekiliyor).

> Not: v1 (`003_roboarm_tasks.sql`) dosyası arşiv olarak duruyor ama artık çalıştırma.
> v2 zaten en başta `DELETE FROM bb_tasks WHERE kit='roboarm'` yapıyor, üzerine güvenle koşabilirsin.

## Görev sırası (71)
1–7 Servo Temelleri · 8–11 Buzzer · 12–14 RGB LED · 15–20 Döngü & Değişken ·
21–23 Buton · 24–27 Potansiyometre · 28–32 Mesafe Sensörü · **33–38 Gamepad** ·
39–41 LDR · 42–45 OLED · 46–49 Sıcaklık & Röle · 50–56 Parkur (X-O-X dahil) ·
57–63 Otomasyon (teach&repeat, easing) · 64–71 Final Projeleri
