-- ═══════════════════════════════════════════════════════════════
-- RoboPanzer Görev Müfredatı — 60 görev · SAVAŞ TEMALI · RÜTBELİ
-- Supabase Dashboard > SQL Editor'da çalıştır.
-- DONANIM (Pico): M1 sol palet · M2 sağ palet · US trig GP3/echo GP2 ·
--   çizgi sol GP14/sağ GP15 · LDR GP27 · buton GP13 · RGB far GP6(4) ·
--   Matrix GP7(64) · buzzer GP20 · OLED SDA4/SCL5 · DHT11 GP11 ·
--   röle(ESP32-CAM) GP12 · Nerf/kargo servo GP16
-- RÜTBELER: ER→ONBAŞI→ÇAVUŞ→ASTSUBAY→TEĞMEN→ÜSTEĞMEN→YÜZBAŞI→
--   BİNBAŞI→YARBAY→ALBAY→GENERAL→MAREŞAL
-- Bu dosya 'robopanzer' kitine ait ESKİ kayıtları siler, 60 görevi yükler.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bb_tasks (
  id SERIAL PRIMARY KEY,
  kit TEXT NOT NULL DEFAULT 'berrybot',
  task_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  expected_min INTEGER NOT NULL DEFAULT 15,
  xp INTEGER NOT NULL DEFAULT 10,
  emoji TEXT DEFAULT '📋',
  description TEXT DEFAULT '',
  answer TEXT DEFAULT '',
  learnings JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  video_url TEXT,
  answer_image_url TEXT,
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at BIGINT,
  updated_at BIGINT,
  UNIQUE(kit, task_id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_kit ON bb_tasks(kit, task_id);
ALTER TABLE bb_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on bb_tasks" ON bb_tasks;
CREATE POLICY "Allow all on bb_tasks" ON bb_tasks FOR ALL USING (true) WITH CHECK (true);

DELETE FROM bb_tasks WHERE kit = 'robopanzer';

INSERT INTO bb_tasks
(kit, task_id, title, category, difficulty, expected_min, xp, emoji,
 description, answer, learnings, position, active, created_at, updated_at)
VALUES
('robopanzer', 1, 'İleri Marş!', '🪖 ER · Acemi Ocağı', 1, 10, 10, '🎖️',
 'Asker, ilk emrin: tankı 2 saniye ileri sür ve dur! Sol palet Motor 1, sağ palet Motor 2. İkisini de %50 hızda İLERİ yönde çalıştır, 2 saniye bekle, sonra ''Tüm motorları durdur'' de. Kod ''Başlangıçta'' bloğunda 1 kez çalışsın.',
 'Başlangıçta{ motor1 ileri 50; motor2 ileri 50; bekle 2sn; hepsini durdur }',
 '["DC motor kavramı", "Palet = 2 motor mantığı", "Sıralı komutlar", "Motor durdurma"]'::jsonb, 1, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 2, 'Geri Çekil!', '🪖 ER · Acemi Ocağı', 1, 10, 10, '↩️',
 'Düşman hattına fazla yaklaştın — geri çekilme emri! Her iki paleti %50 hızda GERİ yönde 2 saniye çalıştır ve dur. İleri ile geri arasındaki tek fark yön menüsü.',
 'Başlangıçta{ motor1 geri 50; motor2 geri 50; bekle 2sn; dur }',
 '["Yön (ileri/geri) parametresi", "Geri manevra", "Komut sırası"]'::jsonb, 2, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 3, 'Tam Yerinde Dönüş', '🪖 ER · Acemi Ocağı', 1, 12, 10, '🔄',
 'Tanklar direksiyonla dönmez: SOL palet İLERİ, SAĞ palet GERİ dönerse tank olduğu yerde sağa döner! %60 hızla 1 saniye döndür, dur. Sonra ters kombinasyonla (sol geri, sağ ileri) sola döndür. Tankın 360° tur atması kaç saniye sürüyor, not al — bu sayı sonraki görevlerde lazım olacak!',
 'sağa dön{ m1 ileri 60; m2 geri 60 }; 1sn; dur; sola dön{ m1 geri 60; m2 ileri 60 }; 1sn; dur',
 '["Diferansiyel (palet) dönüşü", "Nokta dönüşü kavramı", "Dönüş süresi kalibrasyonu"]'::jsonb, 3, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 4, 'Devriye: 3 Tur Git-Gel', '🪖 ER · Acemi Ocağı', 1, 12, 10, '🔁',
 'Nöbet vakti! Tank 1 saniye ileri, dur, 1 saniye geri, dur — bu devriyeyi ''tekrarla 3 kez'' bloğunun İÇİNE koyarak 3 kez yaptır. Aynı blokları kopyalamak yasak, döngü kullan!',
 'tekrarla 3{ ileri 50 1sn; dur; geri 50 1sn; dur }',
 '["Tekrar (repeat) bloğu", "Döngü kavramı", "Kod tekrarından kaçınma"]'::jsonb, 4, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 5, 'Vites Sistemi: Hız Değişkeni', '🪖 ER · Acemi Ocağı', 2, 15, 15, '🎚️',
 '''hiz'' adında değişken yap ve 30 yaz. Tankı ''hiz'' hızında 1 sn sür. Sonra hiz=60 yap, 1 sn sür. En son hiz=90 (tam gaz!) 1 sn sür ve dur. Motor bloklarına sayı değil, ''hiz'' değişkenini tak — tek yerden tüm hızı yönetiyorsun!',
 'hiz=30; ileri(hiz) 1sn; hiz=60; ileri(hiz) 1sn; hiz=90; ileri(hiz) 1sn; dur',
 '["Değişken tanımlama", "Değişkeni blok girişine takma", "Kademeli hızlanma"]'::jsonb, 5, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 6, 'Kare Devriye', '🪖 ER · Acemi Ocağı', 2, 15, 15, '⬜',
 'Üssün etrafında kare devriye at! Tekrarla 4 kez: 1 sn ileri git, dur, sonra sağa 90° dön (3. görevde bulduğun dönüş süresinin dörtte biri — genelde ~0.5 sn), dur. Döngü bitince tank başladığı yere dönmüş olmalı!',
 'tekrarla 4{ ileri 60 1sn; dur; sağa dön 0.5sn; dur }',
 '["Döngüyle geometri", "90° dönüş kalibrasyonu", "Milisaniye hassasiyeti"]'::jsonb, 6, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 7, 'Fonksiyon: ilerle() Komutu', '🥾 ONBAŞI · Sürüş Okulu', 2, 15, 15, '🧩',
 'Komutanlar emirleri kısaltır! ''ilerle'' adında FONKSİYON tanımla: içinde 1 sn %60 ileri + dur olsun. Sonra ana programda ''ilerle'' fonksiyonunu 3 kez çağır (aralarda yarım sn bekle). Fonksiyon tanımı ayrı bir üst bloktur, zincirin içine bağlanmaz!',
 'fonksiyon ilerle(){ ileri 60 1sn; dur }; Başlangıçta{ ilerle; ilerle; ilerle }',
 '["Fonksiyon tanımlama", "Fonksiyon çağırma", "Kodun modülerleşmesi"]'::jsonb, 7, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 8, 'Slalom Sürüşü', '🥾 ONBAŞI · Sürüş Okulu', 2, 15, 15, '〰️',
 'Paletlere FARKLI hız verirsen tank kavisli gider! Tekrarla 3 kez: sol palet %30 + sağ palet %70 ile 1 sn (sola kavis), sonra sol %70 + sağ %30 ile 1 sn (sağa kavis). Bitince dur. Tank yılan gibi slalom yapmalı.',
 'tekrarla 3{ m1:30 m2:70 1sn; m1:70 m2:30 1sn }; dur',
 '["Diferansiyel hız = kavis", "Yumuşak dönüş vs nokta dönüş", "Hız oranı sezgisi"]'::jsonb, 8, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 9, 'Hız Rampası', '🥾 ONBAŞI · Sürüş Okulu', 2, 15, 15, '📈',
 'Tank rampada gibi yavaştan tam gaza kalksın! ''hiz'' için sayaçlı döngü kur: 20''den 90''a 10''ar 10''ar artsın; her adımda iki motoru ''hiz'' ile sür ve 300 ms bekle. Döngü bitince dur. Ani kalkış yok — profesyonel sürücü ivmeli kalkar!',
 'hiz 20→90 adım 10{ ileri(hiz); 300ms }; dur',
 '["Sayaçlı (for) döngü", "İvmelenme kavramı", "Döngü değişkenini motora bağlama"]'::jsonb, 9, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 10, 'Korna Çal ve Hareket Et', '🥾 ONBAŞI · Sürüş Okulu', 1, 10, 10, '📯',
 'Kalkıştan önce çevreyi uyar! Buzzer GP20''de. 800 Hz''lik 300 ms korna 2 kez çal (arada 200 ms), sonra 2 sn ileri git ve dur.',
 '2×{ ton(800Hz,300ms); 200ms }; ileri 60 2sn; dur',
 '["Buzzer ton bloğu", "Frekans (Hz) kavramı", "Ses + hareket sıralama"]'::jsonb, 10, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 11, 'Geri Vites İkazı', '🥾 ONBAŞI · Sürüş Okulu', 2, 12, 15, '🚨',
 'Kamyonlar gibi: tank geri giderken bip-bip-bip! Tekrarla 5 kez: motorlar geri %40 çalışırken 1000 Hz 150 ms bip + 350 ms sessizlik. Döngü bitince dur. Motorlar döngü boyunca hep geri çalışıyor, bip sesi araya giriyor.',
 'tekrarla 5{ geri 40; ton(1000,150); 350ms }; dur',
 '["Eşzamanlı ses+hareket", "İkaz sinyali standardı", "Zamanlama ritmi"]'::jsonb, 11, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 12, 'İlk Parkur Turu: Başlangıç→Bitiş', '🥾 ONBAŞI · Sürüş Okulu', 3, 25, 20, '🏁',
 'İlk saha görevi! Tankı parkurun BAŞLANGIÇ alanına koy. ''ilerle'' ve ''don_sag'' fonksiyonlarını tanımla; bunları arka arkaya çağırarak siyah yolu SENSÖRSÜZ, sadece zamanlamayla takip edip BİTİŞ damalı alanına ulaşmaya çalış. Süreleri parkurda dene-yanıl ile ayarla. Bitişte zafer kornası çal!',
 'fonksiyonlar: ilerle(1sn), don_sag(0.5sn), don_sol(0.5sn) → sırayla çağır → bitişte 3 bip',
 '["Ölü hesap (dead reckoning) sürüş", "Fonksiyonları birleştirme", "Parkur kalibrasyonu", "Deneme-yanılma mühendisliği"]'::jsonb, 12, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 13, 'Radar Aktif: Mesafeyi Bildir', '📡 ÇAVUŞ · Keşif ve Radar', 1, 12, 15, '📏',
 'Ultrasonik radar GP3 (trig) ve GP2 (echo) pinlerinde. ''Sürekli tekrarla'' içinde mesafeyi oku, ''Yazdır'' ile konsola gönder, 500 ms bekle. Eline hedef tut, yaklaştır-uzaklaştır: sayılar cm cinsinden değişiyor mu?',
 'sürekli{ yazdır(ultrasonik(3,2)); 500ms }',
 '["HC-SR04 çalışma prensibi", "Seri konsola yazdırma", "Sonsuz döngü", "cm ölçümü"]'::jsonb, 13, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 14, 'Engel Görünce Dur!', '📡 ÇAVUŞ · Keşif ve Radar', 2, 15, 15, '🛑',
 'Otonom fren sistemi! Sürekli döngüde mesafeyi oku: 15 cm''den KÜÇÜKSE tüm motorları durdur, DEĞİLSE %50 ileri git. ''eğer/değilse'' bloğu kullan. Tankın önüne elini koy — çarpma yok!',
 'sürekli{ eğer mesafe<15 → dur; değilse → ileri 50 }',
 '["Karşılaştırma (<)", "Eğer/değilse dallanma", "Otonom fren mantığı"]'::jsonb, 14, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 15, 'Kaçış Manevrası', '📡 ÇAVUŞ · Keşif ve Radar', 2, 15, 20, '💨',
 'Durmak yetmez, manevra yap! Mesafe 12 cm''in altına düşerse: dur → 0.5 sn geri → sağa 0.6 sn dön → devam. Değilse %50 ileri. Tank artık engellerden kendi kendine kurtuluyor!',
 'sürekli{ eğer mesafe<12 → dur; geri 0.5sn; sağa dön 0.6sn; değilse → ileri 50 }',
 '["Çok adımlı tepki", "Kaçış algoritması", "Manevra sıralaması"]'::jsonb, 15, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 16, 'Mayın Tarlası: Engel Alanı', '📡 ÇAVUŞ · Keşif ve Radar', 3, 25, 20, '💣',
 'Parkurdaki ENGEL ALANI''na git: kayalar ve kütükler mayın! 15. görevdeki kaçış manevranı kullanarak tankı alanın bir ucundan sokup hiçbir engele çarpmadan diğer ucundan çıkar. Kaçış yönünü (sağ/sol) alanına göre kendin seç, süreleri sahada ayarla.',
 'sürekli{ mesafe<12 → geri+dön (kaçış); değilse ileri 45 } — Engel Alanı''nda canlı test',
 '["Gerçek saha testi", "Algoritma parametre ayarı", "Engelden kaçınma (obstacle avoidance)"]'::jsonb, 16, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 17, 'Konvoy Sürüşü: Mesafeyi Koru', '📡 ÇAVUŞ · Keşif ve Radar', 3, 20, 20, '🚛',
 'Öndeki araçla aran hep ~10 cm olsun! Sürekli döngüde: mesafe<8 → geri %40 (fazla yaklaştın); mesafe>12 → ileri %40 (açıldın); ikisi de değilse dur (tam mesafedesin). Elini tank önünde ileri-geri oynat: tank eline yapışık gibi seni takip etmeli!',
 'sürekli{ m<8→geri 40; m>12→ileri 40; değilse dur }',
 '["Çoklu eğer-değilse (else-if)", "Hedef bandı (deadband)", "Takip kontrolü"]'::jsonb, 17, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 18, 'DUR-KALK Kontrol Noktası', '📡 ÇAVUŞ · Keşif ve Radar', 3, 20, 20, '🛂',
 'Parkurdaki DUR-KALK alanında STOP tabelası var! Tank ileri gitsin; tabelaya (mesafe<20) gelince: dur, 2 kısa bip, 3 saniye bekle (kontrol), sonra tekrar yola devam edip 2 sn ileri gitsin ve görevi bitirsin. Bu görev ''sürekli'' değil, bir kez çalışan senaryo: ''olana kadar tekrarla'' (while) bloğuyla tabelayı bekle.',
 'tabela>20 olduğu sürece ileri → dur → 2 bip → 3sn bekle → ileri 2sn → dur',
 '["While (olana kadar) döngüsü", "Senaryo tabanlı görev", "Dur-kalk protokolü"]'::jsonb, 18, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 19, 'Çizgi Sensörlerini Tanı', '🛤️ ASTSUBAY · Çizgi Takip Timi', 1, 12, 15, '👀',
 'Tankın altında 2 çizgi sensörü var: SOL GP14, SAĞ GP15. Siyah zemin=Doğru(1), beyaz=Yanlış(0). Sürekli döngüde iki sensörü de oku ve ''SOL:'' ve ''SAG:'' etiketiyle yazdır, 300 ms bekle. Tankı elinle çizginin üstünde gezdir, değerleri izle.',
 'sürekli{ yazdır(''SOL:''+GP14); yazdır(''SAG:''+GP15); 300ms }',
 '["TCRT5000 kızılötesi sensör", "Dijital okuma (1/0)", "Metin birleştirme"]'::jsonb, 19, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 20, 'Sınırda Dur: Çizgi Freni', '🛤️ ASTSUBAY · Çizgi Takip Timi', 2, 15, 15, '🚧',
 'Beyaz zeminde ileri git; SOL sensör siyah çizgi görürse (Doğru olursa) hemen dur ve 1 uzun bip çal. ''Olana kadar tekrarla'' kullan: sensör çizgi görene KADAR ilerle. Tank sınır çizgisini asla geçmeyen bir nöbetçi oldu!',
 'çizgi görünmediği sürece ileri 45 → dur → ton(400,600)',
 '["Koşullu durdurma", "Sınır algılama", "Sumo kenar mantığının temeli"]'::jsonb, 20, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 21, 'Tek Sensörle Takip: Zikzak', '🛤️ ASTSUBAY · Çizgi Takip Timi', 3, 20, 20, '🐍',
 'Klasik yöntem: SOL sensör çizginin KENARINI takip eder. Sürekli döngüde: sensör siyah görüyorsa hafif sağa kavis (sol %55, sağ %25), görmüyorsa hafif sola kavis (sol %25, sağ %55). Tank çizgi kenarında zikzak yaparak ilerler. Parkurun düz bölümünde dene!',
 'sürekli{ GP14 siyah → kavis sağ(55,25); değilse → kavis sol(25,55) }',
 '["Kenar takibi (edge following)", "Bang-bang kontrol", "Zikzak davranışı"]'::jsonb, 21, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 22, 'Çift Sensörle Usta Takip', '🛤️ ASTSUBAY · Çizgi Takip Timi', 3, 25, 25, '🛤️',
 'Profesyonel takip! İki sensör çizginin İKİ YANINDA gider. Sürekli: ikisi de beyaz → dümdüz %50; sadece SOL siyah → sola dön (çizgi sola kaçtı: sol %20, sağ %60); sadece SAĞ siyah → sağa dön (%60, %20); İKİSİ DE siyah → kavşak, dur! Parkurda test et — 21. görevden çok daha akıcı gitmeli.',
 'sürekli{ ikisi beyaz→düz; sol siyah→sola; sağ siyah→sağa; ikisi siyah→dur }',
 '["Çift sensör mantık tablosu", "VE (AND) operatörü", "Orantılı düzeltme fikri"]'::jsonb, 22, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 23, 'Kavşak Sayacı', '🛤️ ASTSUBAY · Çizgi Takip Timi', 3, 25, 25, '🔢',
 'Parkurda çizgiyi takip ederken kavşakları say! ''sayac'' değişkeni 0''dan başlasın. İki sensör birden siyah görünce sayac 1 artsın, ''Kavşak: X'' yazdır, kısa bip çal ve kavşağı geçmek için 0.4 sn düz ilerle. sayac 3 olunca dur ve zafer melodisi! Diğer durumlarda 22. görevdeki takip mantığı çalışsın.',
 'takip + ikisi siyah→ sayac+1, bip, 0.4sn düz; sayac=3 → dur+melodi',
 '["Sayaç değişkeni", "Olay sayma", "Koşullu görev bitirme"]'::jsonb, 23, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 24, 'Hat Devriyesi: Başlangıç→Bitiş', '🛤️ ASTSUBAY · Çizgi Takip Timi', 4, 30, 30, '🎗️',
 'Büyük sınav! Tankı BAŞLANGIÇ''a koy, çift sensörlü takiple siyah hattı izleyerek BİTİŞ''e kadar götür. Kavşaklarda durma — düz geç (0.3 sn ileri). BİTİŞ''te (senin belirlediğin kavşak sayısında) dur ve Zafer Marşı çal. İpucu: 23. görevin sayacını parkurdaki gerçek kavşak sayısına ayarla.',
 'çift sensör takip + kavşak geç; hedef kavşakta dur + Star Wars marşı',
 '["Uçtan uca otonom görev", "Parkur haritası okuma", "Parametre sahada ayarlama"]'::jsonb, 24, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 25, 'Gece Görüş: Işık Keşfi', '🌙 TEĞMEN · Gece Operasyonları', 1, 10, 15, '🔦',
 'LDR ışık sensörü GP27''de, 0 (zifiri karanlık) – 100 (çok parlak) değer verir. Sürekli döngüde ışık değerini ''Isik: X'' olarak yazdır, 300 ms bekle. Elinle sensörü kapat, fener tut — değerler nasıl değişiyor?',
 'sürekli{ yazdır(''Isik:''+LDR); 300ms }',
 '["LDR (foto direnç)", "Analog değer 0-100 ölçeği", "Sensör kalibrasyon gözlemi"]'::jsonb, 25, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 26, 'Otomatik Farlar', '🌙 TEĞMEN · Gece Operasyonları', 2, 15, 15, '💡',
 'RGB farlar GP6''da (4 LED). Önce RGB''yi başlat. Sürekli döngüde: ışık<30 (karanlık) → tüm LED''leri BEYAZ yak; değilse → söndür. Odanın ışığını kapat: farlar kendiliğinden yansın!',
 'RGB başlat(6,4); sürekli{ LDR<30 → beyaz; değilse → söndür; 200ms }',
 '["WS2812 RGB LED", "Eşik değeri (threshold)", "Otomatik aydınlatma sistemi"]'::jsonb, 26, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 27, 'Gece Devriyesi', '🌙 TEĞMEN · Gece Operasyonları', 3, 20, 20, '🌃',
 'Karanlıkta sessiz devriye! Sürekli: karanlıksa (LDR<30) farları beyaz yak ve %30 hızla yavaşça ilerle; aydınlıksa dur ve farları söndür (gündüz devriyesi başkasının işi!). Ek görev: karanlıkta önüne engel çıkarsa (mesafe<12) dur.',
 'sürekli{ karanlık → far+yavaş ileri (engel<12→dur); aydınlık → dur+far kapat }',
 '["Çoklu sensör birleşimi (LDR+US)", "İç içe eğer", "Mod tabanlı davranış"]'::jsonb, 27, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 28, 'Projektöre Yönel', '🌙 TEĞMEN · Gece Operasyonları', 3, 20, 20, '🎯',
 'Karargâh projektörle sinyal veriyor — tanka ışığa yürümesini öğret! Sürekli: ışık>70 (projektör tam üstünde) → ileri %45; 40-70 arası → yavaş sağa dön (ışığı ara); <40 → hızlı sağa dön. El feneriyle tankı odanın içinde yönlendir!',
 'sürekli{ L>70→ileri; L>40→yavaş dön; değilse→hızlı dön }',
 '["Işık izleme (fototaksi)", "Kademeli tepki", "Arama davranışı"]'::jsonb, 28, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 29, 'Zafer Marşı', '📻 ÜSTEĞMEN · Sinyal ve İletişim', 1, 10, 15, '🎺',
 'Birlik moral istiyor! ''Şarkı çal'' bloğuyla İmparatorluk Marşı''nı (pin 20) çal; çalmadan önce farları KIRMIZI yak, bitince YEŞİL yap. Diğer marşları da dene — favori marşını seç!',
 'RGB kırmızı → İmparatorluk Marşı → RGB yeşil',
 '["Hazır melodi bloğu", "Tören sıralaması", "Ses+ışık şovu"]'::jsonb, 29, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 30, 'Durum Işıkları Protokolü', '📻 ÜSTEĞMEN · Sinyal ve İletişim', 2, 15, 15, '🚦',
 'Askeri araçlarda durum ışığı standardı: YEŞİL=hareket, SARI=manevra, KIRMIZI=durdu. Senaryo: yeşil yak + 2 sn ileri → sarı yak + sağa 0.5 sn dön → yeşil + 2 sn ileri → kırmızı + dur. Işık HAREKETTEN ÖNCE yanmalı ki çevre uyarılsın!',
 'yeşil→ileri; sarı→dön; yeşil→ileri; kırmızı→dur',
 '["Renk kodu protokolü", "Durum makinesi fikri", "Sinyal önceliği"]'::jsonb, 30, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 31, 'Mors Alfabesi: SOS', '📻 ÜSTEĞMEN · Sinyal ve İletişim', 3, 20, 20, '🆘',
 'Telsiz düştü, Mors''la SOS gönder! ''kisa'' fonksiyonu: 800 Hz 150 ms bip + beyaz flaş; ''uzun'' fonksiyonu: 800 Hz 450 ms + flaş. SOS = 3 kısa, 3 uzun, 3 kısa (harf aralarında 300 ms). Tüm mesajı 2 kez tekrar et.',
 'fonk kisa(150ms), uzun(450ms); 2×{ 3×kisa; 3×uzun; 3×kisa }',
 '["Mors kodu", "Fonksiyonla desen üretme", "Zamanlama standartları"]'::jsonb, 31, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 32, 'Sinyal Lambaları', '📻 ÜSTEĞMEN · Sinyal ve İletişim', 2, 18, 20, '↔️',
 'Dönmeden önce sinyal ver! Farların 0-1 no''lu LED''leri SOL, 2-3 no''lu LED''leri SAĞ tarafta. Sağa dönüş senaryosu: 3 kez sağ LED''leri (2 ve 3) turuncu yak-söndür (300 ms aralık), sonra sağa dön. Aynısını sol için tekrarla (0 ve 1''i yakıp sola dön).',
 '3×{ LED2-3 turuncu; söndür }→ sağa dön; 3×{ LED0-1 turuncu }→ sola dön',
 '["Tekil LED adresleme", "İndeks kavramı", "Trafik sinyal kuralları"]'::jsonb, 32, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 33, 'Parola: Dost mu Düşman mı?', '📻 ÜSTEĞMEN · Sinyal ve İletişim', 3, 20, 25, '🔐',
 'Nöbetçi tank! Buton GP13''te. Sürekli döngüde: butona BASILIYSA (dost parolayı verdi) farlar yeşil + kısa hoş geldin melodisi (2 yükselen nota); basılı DEĞİLSE kırmızı alarm flaşı (kırmızı 200 ms / söndür 200 ms) + 400 Hz tehdit tonu.',
 'sürekli{ buton→yeşil+bip bip; değilse→kırmızı flaş+alarm }',
 '["Buton dijital girişi", "Dost-düşman tanıma (IFF)", "Alarm döngüsü"]'::jsonb, 33, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 34, 'Komuta Ekranı Açılıyor', '🖥️ YÜZBAŞI · Komuta Ekranı', 1, 12, 15, '🖥️',
 'İ2C ekran SDA GP4, SCL GP5''te. Ekranı başlat, temizle, tam ortaya ''ROBOPANZER'' yaz, altına (alt orta) ''GOREVE HAZIR'' ekle ve ''ekrana yansıt'' de. Yansıt bloğu olmadan hiçbir şey görünmez — tampon mantığını öğren!',
 'OLED başlat → temizle → yaz(ROBOPANZER) → yaz(GOREVE HAZIR) → yansıt',
 '["I2C haberleşme", "Ekran tamponu (buffer)", "show() zorunluluğu"]'::jsonb, 34, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 35, 'Canlı Radar Paneli', '🖥️ YÜZBAŞI · Komuta Ekranı', 2, 18, 20, '📡',
 'Ekran artık radar konsolu! Sürekli döngüde: temizle → üst ortaya ''RADAR'' → tam ortaya mesafe değerini büyük (boyut 2) yaz → yansıt → 300 ms bekle. Elini yaklaştır: sayı ekranda canlı akmalı. BONUS: mesafe<15 iken alt ortaya ''TEHLIKE!'' ekle.',
 'sürekli{ temizle; yaz RADAR; yaz(mesafe,boyut2); m<15→''TEHLIKE!''; yansıt; 300ms }',
 '["Canlı veri ekranı", "Yazı boyutu", "Ekran yenileme döngüsü"]'::jsonb, 35, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 36, 'Hız Göstergesi Paneli', '🖥️ YÜZBAŞI · Komuta Ekranı', 3, 20, 20, '🏎️',
 'Rampa kalkışını ekrana bağla! ''hiz'' 20''den 90''a 10''ar artarken: motorları ''hiz'' ile sür, ekranı temizle, ''HIZ'' başlığı + hız değerini büyük yaz, yansıt, 400 ms bekle. Döngü bitince dur ve ekrana ''MENZILE ULASILDI'' yaz.',
 'hiz 20→90{ ileri(hiz); ekrana hiz yaz; 400ms }; dur; ''MENZILE ULASILDI''',
 '["Değişkeni ekrana basma", "Gösterge paneli tasarımı", "Döngü+ekran senkronu"]'::jsonb, 36, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 37, 'Görev Sayacı Ekranı', '🖥️ YÜZBAŞI · Komuta Ekranı', 3, 22, 25, '🎯',
 '5 turluk mini devriye: her turda 0.8 sn ileri + geri dön (0.9 sn) ve ''tur'' sayacını 1 artırıp ekrana ''TUR: X / 5'' yaz. 5 tur bitince dur, ''GOREV TAMAM'' yaz ve Mario zafer müziği çal!',
 'tur 1→5{ ileri; dön; ekrana TUR:X }; ''GOREV TAMAM''+müzik',
 '["Sayaç + ekran birleşimi", "İlerleme raporlama", "Görev döngüsü"]'::jsonb, 37, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 38, 'Tankın Yüzü', '🖥️ YÜZBAŞI · Komuta Ekranı', 2, 15, 20, '🤖',
 'RoboPanzer''a karakter ver! Sürekli döngüde: normal gözler çiz+yansıt (1 sn) → tank sağa dönerken SAĞA bakan gözler (0.6 sn) → normal (1 sn) → sola dönerken SOLA bakan gözler → arada bir göz kırp (CLOSED 200 ms). Gözler hareketle aynı yöne bakmalı — tank canlandı!',
 'sürekli{ normal göz; sağa bak+dön; normal; sola bak+dön; kırp }',
 '["Hazır göz animasyonları", "Karaktere yön verme", "Animasyon zamanlaması"]'::jsonb, 38, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 39, 'Matrix Göreve Başlıyor', '🔥 BİNBAŞI · Matrix ve Termal', 2, 15, 20, '🔲',
 '8x8 LED Matrix GP7''de = 64 LED''lik WS2812 zinciri! ''RGB başlat pin 7, 64 LED'' de. LED''ler satır satır dizili: no = satır×8 + sütun. Merkezdeki 4 LED''i (27, 28, 35, 36) KIRMIZI yak. Sonra 4 köşeyi (0, 7, 56, 63) MAVİ yak. Satır-sütun matematiğini kavra!',
 'RGB başlat(7,64); merkez 27/28/35/36 kırmızı; köşeler 0/7/56/63 mavi',
 '["Matrix = LED zinciri", "Satır×8+sütun adresleme", "Koordinat düşünme"]'::jsonb, 39, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 40, 'Nişangâh İşareti', '🔥 BİNBAŞI · Matrix ve Termal', 3, 20, 25, '🎯',
 'Matrix''e artı (+) şeklinde nişangâh çiz! 3. sütunun tamamı (3,11,19,27,35,43,51,59) ve 3. satırın tamamı (24-31) KIRMIZI olsun. Merkez LED''i (27) SARI yap — hedef kilitlendi! İpucu: sütun için ''i 0→7'' döngüsüyle i×8+3 numaralı LED''i yak.',
 'i 0→7{ LED(i*8+3) kırmızı }; i 24→31{ kırmızı }; LED27 sarı',
 '["Döngüyle desen çizme", "Matematiksel adresleme", "Artı/nişangâh deseni"]'::jsonb, 40, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 41, 'Taarruz Oku Animasyonu', '🔥 BİNBAŞI · Matrix ve Termal', 3, 20, 25, '⬆️',
 'Matrix''te İLERİ ok işareti yanıp sönsün, tank da oka uyup ilerlesin! ''ok_ciz'' fonksiyonu: ok deseni LED''lerini (örn. 3,4,10,11,12,13,19,20,27,28,35,36,43,44,51,52,59,60''tan uygun bir ok) YEŞİL yaksın. Tekrarla 4 kez: ok çiz + ileri %45 (600 ms) → matrix söndür + dur (300 ms). Işıklı komuta tankı!',
 '4×{ ok_ciz(yeşil)+ileri 600ms; söndür+dur 300ms }',
 '["Fonksiyonla desen", "Yanıp sönme animasyonu", "Görsel komut sistemi"]'::jsonb, 41, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 42, 'Termal Kontrol İstasyonu', '🔥 BİNBAŞI · Matrix ve Termal', 2, 15, 20, '🌡️',
 'DHT11 sıcaklık sensörü GP11''de. Sürekli döngüde sıcaklığı oku; hem konsola ''Sicaklik: X C'' yazdır hem de OLED''e büyük puntoyla bas (üstte ''TERMAL'' başlığı). 2 saniyede bir güncelle (DHT11 yavaş bir sensördür, daha sık okuma!). Sensörü parmağınla ısıt, değeri izle.',
 'sürekli{ t=DHT11; yazdır; OLED''e bas; 2sn }',
 '["DHT11 sensörü", "Sensör okuma hızı sınırı", "Çift kanal raporlama (konsol+ekran)"]'::jsonb, 42, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 43, 'Aşırı Isınma Alarmı', '🔥 BİNBAŞI · Matrix ve Termal', 4, 25, 30, '🥵',
 'Motor bölmesi aşırı ısınırsa tank durmalı! Sürekli: sıcaklık oku → 30°C''den BÜYÜKSE: motorları durdur, matrix''i tamamen KIRMIZI yak, 3 alarm bip''i çal, ekrana ''ASIRI ISINMA'' yaz; DEĞİLSE: matrix YEŞİL, %40 devriye sürüşü, ekrana sıcaklık. Sensörü avucunla ısıtarak alarmı tetikle! (Eşiği odana göre ayarla.)',
 'sürekli{ t>30 → dur+kırmızı+alarm+ekran; değilse → yeşil+devriye }',
 '["Güvenlik eşiği", "Acil durum protokolü", "Çok bileşenli tepki"]'::jsonb, 43, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 44, 'Park Alanı: Geri Geri Park', '🗺️ YARBAY · Parkur Harekâtı', 3, 25, 25, '🅿️',
 'Parkurdaki PARK ALANI''na geri geri gir! Senaryo: park hücresinin önüne gel (1 sn ileri), dur, sağa 90° dön (hücreye sırtını dön), sonra YAVAŞÇA (%30) geri git; arka mesafe için tankı çevirip ölçemeyiz — o yüzden süre ile: 1.2 sn geri, dur. Farları kırmızı yak (fren lambası), 1 uzun bip: park tamam!',
 'ileri 1sn → sağa 90° → geri %30 1.2sn → dur+kırmızı+bip',
 '["Park manevrası planı", "Yavaş hassas sürüş", "Manevra koreografisi"]'::jsonb, 44, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 45, 'Park Sensörü: Bip-Bip-Biiip', '🗺️ YARBAY · Parkur Harekâtı', 3, 20, 25, '🔊',
 'Gerçek park sensörü yap! Tank İLERİ giderken duvara yaklaştıkça bipler sıklaşsın: sürekli döngüde mesafeyi ''m'' değişkenine oku; m>40 → sessiz ilerle; 20<m≤40 → bip + m×10 ms bekle (uzak=seyrek); m≤20 ama >8 → bip + m×5 ms (yakın=sık); m≤8 → DUR + kesintisiz uzun ton. Mesafe → bekleme süresi dönüşümü işin sırrı!',
 'sürekli{ m=mesafe; yakınlaştıkça bip aralığı kısalır; m≤8→dur+sürekli ton }',
 '["Değeri süreye dönüştürme", "Oransal geri bildirim", "Gerçek park sensörü mantığı"]'::jsonb, 45, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 46, 'Teslimat Alanı: Kargo Bırak', '🗺️ YARBAY · Parkur Harekâtı', 4, 30, 30, '📦',
 'Cephane kutusunu TESLİMAT ALANI''na bırak! Kargo kepçesi GP16 servosunda (90=tutuyor, 30=bırakır). Senaryo: servoyu 90''a al (kargo kilitli) → çizgi takibiyle ilerle → İLK kavşakta (iki sensör siyah) dur → ekrana ''TESLIMAT'' yaz → servoyu 30''a indir (kargo bırakıldı) → 1 sn bekle → 1 sn geri çekil → 2 bip: teslimat onayı!',
 'servo 90 → takip → kavşakta dur → servo 30 (bırak) → geri çekil → onay bipi',
 '["Servo ile mekanizma", "Görev içinde görev", "Teslimat protokolü"]'::jsonb, 46, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 47, 'Renk Algılama Bölgesi', '🗺️ YARBAY · Parkur Harekâtı', 4, 30, 30, '🎨',
 'Parkurdaki RENK ALGILAMA şeridinde 4 kare var: kırmızı, mavi, sarı, gri. LDR''yi zemine bakacak şekilde kullan: her renk farklı miktarda ışık yansıtır! Tank şeritte yavaş ilerlerken (%25) sürekli LDR değerini hem yazdır hem OLED''e bas. Her karede dur (1 sn), değeri not al. Sonra eşiklerini belirle: örn. >60=sarı, 40-60=kırmızı, 25-40=mavi, <25=gri — farları o renge boya!',
 'yavaş ilerle; her karede LDR oku; eşiğe göre farı kırmızı/mavi/sarı/beyaz yak',
 '["Yansıma ile renk ayrımı", "Kalibrasyonlu eşikler", "Sensör sınırlarını tanıma"]'::jsonb, 47, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 48, 'Küp Alanı Operasyonu', '🗺️ YARBAY · Parkur Harekâtı', 4, 30, 30, '🧊',
 'KÜP ALANI''nda renkli küpleri karelere it! Tank küpü radar ile bulur: yavaş sağa dönerek tara; mesafe<25 olunca (küp bulundu!) dur, 1 bip, sonra küpe kadar ilerle (mesafe<5), durmadan 1.2 sn daha it (küp kareye girsin), sonra 1 sn geri çekil. Matrix''e yeşil onay (tümü yeşil 1 sn) ver.',
 'tara(dön) → küp<25 bulundu → yaklaş → 1.2sn it → geri çekil → yeşil onay',
 '["Tarama+yaklaşma algoritması", "Nesne itme görevi", "Aşamalı görev planı"]'::jsonb, 48, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 49, 'Zamana Karşı: Tur Kronometresi', '🗺️ YARBAY · Parkur Harekâtı', 4, 25, 30, '⏱️',
 'Hız rekoru denemesi! Başlangıçta ''baslangic'' değişkenine ''çalışma süresi (ms)'' değerini kaydet. Çift sensör takibiyle 4 kavşak say (24. görev gibi). Bitince süreyi hesapla: (şimdiki ms - baslangic) / 1000 = saniye. Ekrana ve konsola ''SURE: X sn'' yaz. Arkadaşlarınla yarış — en hızlı takip programı kimin?',
 'baslangic=ms; takip 4 kavşak; sure=(ms-baslangic)/1000; ekrana yaz',
 '["millis() ile zaman ölçümü", "Kronometre matematiği", "Performans yarışması"]'::jsonb, 49, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 50, 'Konvoy Komutanlığı', '🗺️ YARBAY · Parkur Harekâtı', 4, 25, 30, '🚚',
 '17. görevi tam konvoy sistemine çevir! Öndeki aracı (elini/kutunu) takip et: m<8→geri, m>12→ileri, arada→dur. EK: takip ederken farlar YEŞİL; öndeki kaybolursa (m>50, konvoy koptu!) dur, farlar KIRMIZI, 3 uyarı bip''i ve ekrana ''KONVOY KOPTU'' yaz; tekrar görününce yeşile dönüp devam et.',
 'takip bandı + m>50→kırmızı alarm ''KONVOY KOPTU''; görününce devam',
 '["Durum ekleme (kayıp modu)", "Sistem geri bildirimi", "Dayanıklı davranış tasarımı"]'::jsonb, 50, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 51, 'Kontrol Noktalı Devriye', '🗺️ YARBAY · Parkur Harekâtı', 4, 30, 35, '🚩',
 'Tam teçhizatlı devriye! Çizgiyi takip et; HER kavşakta (kontrol noktası): dur → ''nokta'' sayacını artır → ekrana ''NOKTA: X'' yaz → 1 selam bip''i → farları 1 sn mavi yak → devam (0.4 sn düz). 5. noktada görev biter: dur + Zafer (Star Wars) marşı + matrix yerine farlar yeşil.',
 'takip; kavşakta{ dur; sayaç; ekran; bip; mavi }; 5. noktada marş',
 '["Görev protokolü tasarlama", "Raporlu devriye", "Tüm becerilerin sentezi"]'::jsonb, 51, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 52, 'Sumo: Ringden İtekle!', '⚔️ ALBAY · Otonom Muharebe', 4, 30, 35, '🥋',
 'Sumo muharebesi! Ring: beyaz zemin, siyah sınır çizgisi. Sürekli döngü öncelik sırası: 1) HERHANGİ bir çizgi sensörü siyah görürse → ring kenarındasın: hızlı geri (0.6 sn) + dön (0.5 sn); 2) mesafe<25 → rakip bulundu: TAM GAZ (%90) saldır + kırmızı farlar; 3) hiçbiri → yavaşça dönerek ara (%35) + beyaz farlar. Önceliği bozma: kenar kontrolü HER ZAMAN önce!',
 'sürekli{ kenar→kaç; rakip<25→%90 hücum; değilse→dönerek ara }',
 '["Öncelikli karar ağacı", "Sumo stratejisi", "VEYA (OR) operatörü"]'::jsonb, 52, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 53, 'Kale Savunması', '⚔️ ALBAY · Otonom Muharebe', 4, 30, 35, '🏰',
 'Tank kaleyi (başladığı noktayı) korur! Sürekli: olduğu yerde yavaş dönerek radar taraması yap (%30); mesafe<30''da davetsiz misafir → dur, kırmızı alarm flaşı + 3 sert bip, sonra %80 hızla 1 sn üstüne hücum et, 1 sn geri çekilip nöbete devam. Kimse yoksa sakin mavi devriye ışığı yansın.',
 'sürekli{ tara; m<30→alarm+hücum+geri dön; değilse mavi nöbet }',
 '["Nöbet-tarama davranışı", "Tepkisel savunma", "Hücum-geri çekilme döngüsü"]'::jsonb, 53, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 54, 'Gece Baskını', '⚔️ ALBAY · Otonom Muharebe', 4, 30, 35, '🌑',
 'Gizli operasyon: SADECE karanlıkta hareket! Sürekli: LDR<30 (gece) → farlar KAPALI, %30 sessiz ilerleyiş, engel<12''de sessizce yön değiştir (bip YOK — gizlilik!); LDR≥30 (projektör yakaladı!) → ANINDA dur, 1.5 sn tam gaz GERİ kaç ve ekrana ''TESPIT EDILDIN!'' yaz. Işıklarla tankı yakalamaya çalış!',
 'karanlık→sessiz sız; ışık→dur+hızlı geri ''TESPIT EDILDIN!''',
 '["Ters ışık mantığı", "Gizlilik kısıtları", "Kaçış refleksi"]'::jsonb, 54, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 55, 'Dost-Düşman Işık Parolası', '⚔️ ALBAY · Otonom Muharebe', 5, 35, 40, '🔦',
 'Gelişmiş IFF sistemi: dost birlik fenerle ''parlak sinyal'' verir! Sürekli: normalde sarı ikaz ışığı+bekle. Işık>80 olursa sinyal başladı: ''sinyal'' sayacını 1 artır, ışık sönene kadar bekle (ışık<50 olana kadar), 1.5 sn içinde toplam sayımı bitir. sinyal=2 ise DOST: yeşil+selam melodisi; farklıysa DÜŞMAN: kırmızı+alarm+1 sn geri çekil. Fenerle 2 kez flaş yap: dost tanındı mı?',
 'parlaklık darbelerini say; 2 flaş=dost(yeşil); değilse düşman(alarm)',
 '["Darbe sayma (pulse counting)", "Zaman pencereli ölçüm", "Basit optik haberleşme"]'::jsonb, 55, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 56, 'Komando Parkuru: Görev Zinciri', '⚔️ ALBAY · Otonom Muharebe', 5, 40, 40, '🪂',
 'Üç beceriyi TEK programda zincirle! Fonksiyonlar: 1) ''cizgi_gorevi'' — 2 kavşak çizgi takibi; 2) ''engel_gorevi'' — 5 sn engelden kaçarak ilerleme (döngü sayısıyla); 3) ''park_gorevi'' — dur, dön, geri park + bip. Ana program üçünü sırayla çağırır; her görev arasında farlar 1 sn mavi yanar (görev raporu). Bu, MAREŞAL finalinin provası!',
 'cizgi_gorevi → mavi → engel_gorevi → mavi → park_gorevi → marş',
 '["Görev zinciri mimarisi", "Fonksiyonlarla aşama yönetimi", "Final provası"]'::jsonb, 56, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 57, 'ESP32-CAM: Keşif Gözü', '🎖️ GENERAL · İleri Teknoloji', 5, 40, 45, '📹',
 'Tanka GÖZ takıyoruz! ESP32-CAM eklentisi röle (GP12) üzerinden güç alır ve WiFi''dan canlı yayın verir (kurulum kılavuzu eğitmeninde). Görev programın: röleyi AÇ (kamera güç aldı) → ekrana ''CANLI YAYIN'' + göz animasyonu → 10 sn boyunca çok yavaş (%25) keşif devriyesi at (engellere dikkat!) → röleyi KAPAT → ''YAYIN BITTI''. Telefondan yayını izleyerek tankı gözden uzak bir odada gezdir!',
 'röle AÇ → ''CANLI YAYIN'' → %25 keşif devriyesi (engel korumalı) → röle KAPAT',
 '["Röle ile güç yönetimi", "FPV keşif konsepti", "ESP32-CAM tanıtımı"]'::jsonb, 57, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 58, 'Nerf Topçusu: ATEŞ!', '🎖️ GENERAL · İleri Teknoloji', 5, 40, 45, '🚀',
 'Nerf fırlatıcı eklentisi takıldı! Tetik servosu GP16''da: 60=emniyet, 120=ATEŞ. Atış protokolü şart: 1) servo 60 (emniyet) → 2) ekranda geri sayım 3-2-1 (her sayıda bip + kırmızı flaş) → 3) ''ATES!'' yazısı + servo 120 → 4) 0.5 sn sonra servo 60''a dön (yeniden kurma) → 5) 2 atışlık tam salvo yap. GÜVENLİK: namluyu asla insana doğrultma, sadece hedef tahtası!',
 '2×{ emniyet; 3-2-1 geri sayım; ATES(servo120); yeniden kur }',
 '["Servo ile tetik mekanizması", "Atış güvenlik protokolü", "Geri sayım senaryosu"]'::jsonb, 58, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 59, 'Nişancı: Hedefe Kilitlen ve Vur', '🎖️ GENERAL · İleri Teknoloji', 5, 45, 50, '🎖️',
 'En üst düzey görev: OTONOM nişancılık! Tank radar taramasıyla hedefi arar: yavaş dön (%25), mesafe<40 olunca hedef bulundu → dur → matrix''e nişangâh çiz (merkez sarı+artı kırmızı) → hedef mesafesini ekrana yaz → 58. görevdeki atış protokolüyle ATEŞ ET → yeşil ''HEDEF VURULDU'' + zafer marşı. Hedef tahtasını odanın farklı yerlerine koy ve tankın bulmasını izle!',
 'tara → hedef<40 kilitlen → nişangâh+rapor → atış protokolü → zafer',
 '["Tarama+kilitlenme+eylem zinciri", "Otonom hedefleme", "Tüm sistemin entegrasyonu"]'::jsonb, 59, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('robopanzer', 60, 'BÜYÜK HAREKÂT: Mezuniyet Görevi', '⭐ MAREŞAL · Büyük Harekât', 5, 60, 60, '⭐',
 'Mareşal rütbesi için FİNAL! Kendi büyük harekâtını tasarla ve tüm parkurları kullan: BAŞLANGIÇ''tan çık → DUR-KALK''ta protokol uygula → çizgi takibiyle ilerle → ENGEL ALANI''nı aş → TESLİMAT''ta kargo bırak → PARK ALANI''na park et → zafer şovu (marş+ışık+ekran). En az 3 sensör, 2 fonksiyon ve 1 sayaç kullan. Programını sınıfa SUN: hangi kararları neden verdin? Örnek çözüm bir şablondur — senin harekâtın farklı ve daha iyi olabilir! Görevi tamamlayan MAREŞAL rütbesi ve mezuniyet beratı alır! 🎖️',
 'Örnek: dur-kalk → 2 kavşak takip → engel geçişi → kargo bırakma → park → zafer şovu',
 '["Uçtan uca sistem tasarımı", "Kendi algoritmasını savunma", "Sunum ve mühendislik iletişimi", "MEZUNİYET"]'::jsonb, 60, true, extract(epoch from now())*1000, extract(epoch from now())*1000);
