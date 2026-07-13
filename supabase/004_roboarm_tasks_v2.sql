-- ═══════════════════════════════════════════════════════════════
-- RoboArm Görev Müfredatı v2 — 71 görev
-- Supabase Dashboard > SQL Editor'da çalıştır.
--
-- v1'DEN FARKLAR:
--   * "Sınırları Keşfet" görevi ÇIKARILDI (servo zorlama riski).
--   * Buzzer (8-11) ve RGB LED (12-14) ÖNE alındı.
--   * Gamepad (33-38) İLERİ tarihlere atıldı — önce kodla, sonra kumanda.
--   * Tüm cevaplar RoboExx blok tabanlı kodlama aracına birebir uyarlandı.
--   * Servo güvenliği: tüm açılar 30-150° arası; gripper 40 (kapalı) / 140 (açık).
--     0° ve 180° HİÇBİR görevde kullanılmaz — robot kol bozulmaz.
--
-- Donanım: PCA9685 (SDA 4 / SCL 5) — kanal 0=taban 1=omuz 2=dirsek 3=tutucu
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

-- Eski roboarm görevlerini temizle (72 görevlik v1 dahil)
DELETE FROM bb_tasks WHERE kit = 'roboarm';

INSERT INTO bb_tasks (kit, task_id, title, category, difficulty, expected_min, xp, emoji, description, answer, learnings, position, active, created_at, updated_at) VALUES

('roboarm', 1, 'İlk Hareket: Tabanı Döndür', 'Servo Temelleri', 1, 10, 10, '🦾',
 'Tabanı önce 30 dereceye getir. 1 saniye bekle. Sonra 60 dereceye getir. 1 saniye bekle. En son 150 dereceye getir. Döngü kullanma — kodun sadece 1 kere çalışsın.',
 'Başlangıçta → PCA9685 başlat → servo kanal 0 açı 30 → 1 sn bekle → kanal 0 açı 60 → 1 sn bekle → kanal 0 açı 150. Kod yukarıdan aşağı bir kez çalışır ve durur.',
 '["Servo motor kavramı", "Açı (derece) kavramı", "Kanal/eklem eşlemesi", "Sıralı komut çalıştırma"]'::jsonb, 1, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 2, 'Tekrarla: 5 Kez Git-Gel', 'Servo Temelleri', 1, 12, 10, '🔁',
 'Tekrar bloğunu öğren! Kol 30 dereceye gitsin, 1 sn beklesin, sonra 150 dereceye gitsin, 1 sn beklesin. Bu ikisini tekrar bloğunun İÇİNE koy ve 5 kez tekrarlat.',
 '5 kez tekrarla { kanal 0 açı 30 → 1 sn bekle → kanal 0 açı 150 → 1 sn bekle }. Bloklar tekrarın içinde olduğu için 5 kez çalışır.',
 '["Tekrar (repeat) bloğu", "Döngü kavramına giriş", "Kod tekrarından kaçınma", "Bekleme süresi"]'::jsonb, 2, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 3, 'Yumuşak Hareket: Hız Değişkeni', 'Servo Temelleri', 2, 15, 15, '🎚️',
 'Kol birden zıplamasın, yavaşça süzülsün! ''hiz'' adında değişken yap, içine 100 yaz. Döngüyle 30''dan 150''ye BİRER derece ilerle, her adımda ''hiz'' kadar ms bekle. Sonra hiz''ı 50 yap, farkı izle — kol 2 kat hızlandı mı?',
 'hiz = 100 → ''aci'' için 30''dan 150''ye 1''er say { kanal 0 açı = aci → aci ms bekle }. Sonra hiz = 50 yapıp geri dön: aynı hareket 2 kat hızlı biter.',
 '["Değişken tanımlama", "Sayaçlı döngü", "Adım adım (kademeli) hareket", "Milisaniye kavramı"]'::jsonb, 3, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 4, 'Dört Eksen Tanışma', 'Servo Temelleri', 1, 12, 10, '🧭',
 'Robot kolun 4 motoru var: taban kanal 0, omuz kanal 1, dirsek kanal 2, tutucu kanal 3. Sırayla hepsini 90 dereceye getir, aralarda 1 sn bekle. Kol dimdik ''hazır'' duruşta olacak.',
 'kanal 0 açı 90 → 1 sn → kanal 1 açı 90 → 1 sn → kanal 2 açı 90 → 1 sn → kanal 3 açı 90. Bu duruş ''ev pozisyonu'' — her programın sonunda buraya dön.',
 '["4 eksen mimarisi", "Kalibrasyon duruşu (90°)", "Kanal-eklem eşlemesi", "Güvenli başlangıç pozisyonu"]'::jsonb, 4, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 5, 'Selam Veren Kol', 'Servo Temelleri', 2, 15, 15, '👋',
 'Robot sana el sallasın! Omzu 60 dereceye getir. Sonra dirseği 60 → 120 → 60 → 120 diye salla (aralarda yarım saniye). Bu sallanmayı 3 kez tekrarla. En son bütün motorları 90 dereceye getir.',
 'kanal 1 açı 60 → 3 kez tekrarla { kanal 2 açı 60 → 300 ms → kanal 2 açı 120 → 300 ms } → hepsi 90° (ev pozisyonu).',
 '["Çoklu eksen koordinasyonu", "Tekrar + sıralı akış", "İnsansı hareket tasarımı"]'::jsonb, 5, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 6, 'Gripper: Aç-Kapa', 'Servo Temelleri', 1, 10, 10, '🤏',
 'Robotun elini aç-kapa yap! Tutucuyu 140 dereceye getir — el AÇILIR. 1 sn bekle. Tutucuyu 40 dereceye getir — el KAPANIR. 1 sn bekle. Bu aç-kapa hareketini 3 kez tekrarla.',
 '3 kez tekrarla { kanal 3 açı 140 (aç) → 1 sn → kanal 3 açı 40 (kapa) → 1 sn }. DİKKAT: 0 veya 180 KULLANMA — gripper mekanik olarak zorlanır ve dişli sıyırır.',
 '["Gripper mekanizması", "Açık/kapalı açı değerleri", "Servo koruma bilinci", "Kavrama mantığına giriş"]'::jsonb, 6, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 7, 'İlk Kavrama: Küpü Tut', 'Servo Temelleri', 3, 20, 20, '🧊',
 'İlk kez bir şey tutacaksın! Küpü kolun önüne koy. Eli aç, kolu aşağı indir, eli kapat ve küpü tut. Çok sıkma (motor zorlanır), az da sıkma (küp düşer). Sonra kolu kaldır — küp 5 saniye havada kalsın!',
 'kanal 3 açı 140 (aç) → omuz 60 + dirsek 120 (in) → kanal 3 açı 80 (kavra) → omuz 110 (kaldır) → 5 sn bekle → aç → ev. ~3cm küp için 80° ideal: çok sıkarsan servo vızıldar, hemen geri aç!',
 '["Hassas kavrama", "Deneme-yanılma kalibrasyonu", "Tork ve kuvvet dengesi", "Pick (alma) operasyonu"]'::jsonb, 7, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 8, 'Hareket Sesi', 'Buzzer', 1, 10, 10, '🔔',
 'Buzzer bağla (pin 20). ''git_pozisyona'' fonksiyonu yaz ve sonuna kısa bir ''bip'' (1000 Hz, 100 ms) ekle — kol her pozisyon değiştirdiğinde konuşsun. R2-D2 gibi!',
 'Fonksiyon git_pozisyona(t, o, d) { kanal 0=t, kanal 1=o, kanal 2=d → 600 ms bekle → buzzer 1000 Hz 100 ms }. Sonra fonksiyonu 3 farklı pozisyonla çağır.',
 '["Buzzer ve frekans", "Geri bildirim sesi", "Fonksiyon tanımlama", "Fonksiyon genişletme"]'::jsonb, 8, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 9, 'Geri Vites Sesi', 'Buzzer', 2, 12, 15, '🚛',
 'Kol geriye dönerken (açı azalırken) kamyon geri vites sesi gibi aralıklı bip çalsın: 800 Hz, 200 ms açık, 200 ms kapalı. Sona gelince başa dönsün ve sessizce ilerlesin.',
 'aci = 90 → sürekli tekrarla { eğer aci > 30 ise: aci = aci - 5 → kanal 0 açı = aci → buzzer 800 Hz 200 ms → 200 ms bekle; değilse: aci = 150 (sessiz başa dön) }.',
 '["Yön algılama", "Koşullu ses", "Endüstriyel güvenlik sesleri"]'::jsonb, 9, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 10, 'Mesafe Park Sensörü', 'Buzzer', 3, 18, 20, '🅿️',
 'Araba park sensörü yap: cisim uzaktayken yavaş bip, yaklaştıkça bip aralığı kısalsın, 5 cm''den yakında SÜREKLİ ötsün. Mesafe sensörü (trig 3, echo 2) + buzzer birleşimi.',
 'sürekli { mesafe oku → eğer mesafe < 5: buzzer 1200 Hz 500 ms (sürekli); değilse: aralik = eşle(mesafe, 5-40 → 0-500) → buzzer 1200 Hz 80 ms → aralik ms bekle }.',
 '["İki modülü birleştirme", "Orantılı geri bildirim", "''eşle'' (map) ile ses aralığı", "Gerçek ürün simülasyonu"]'::jsonb, 10, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 11, 'Zafer Melodisi', 'Buzzer', 2, 15, 15, '🎵',
 'Kol bir görevi bitirince (küpü bırakınca) 5 notalık zafer melodisi çalsın. Nota bloklarını kullan: Do(5) → Re(5) → Mi(5) → Sol(5) → Do(6 = 1047 Hz).',
 'Fonksiyon zafer_melodisi() { nota 523 → 587 → 659 → 784 → 1047, her biri 150 ms + kısa boşluk → buzzer sustur }. Tutucuyu aç, sonra fonksiyonu çağır.',
 '["Nota-frekans ilişkisi", "Do-Re-Mi frekansları", "Fonksiyonla melodi saklama", "Başarı geri bildirimi"]'::jsonb, 11, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 12, 'Durum Işığı', 'RGB LED', 1, 10, 10, '🚥',
 'RGB LED bağla (pin 6). Kol hareket halindeyken KIRMIZI, beklerken YEŞİL yansın — fabrikadaki robot kolların güvenlik ışığı gibi.',
 'RGB başlat (pin 6, 1 LED) → fonksiyon git_pozisyona(t,o,d) { tüm LED''leri KIRMIZI boya → servoları hareket ettir → 600 ms → tüm LED''leri YEŞİL boya }.',
 '["RGB LED başlatma", "Durum göstergesi", "Endüstriyel güvenlik standartları"]'::jsonb, 12, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 13, 'Açıya Göre Renk', 'RGB LED', 3, 18, 20, '🌈',
 'Taban açısı LED rengini belirlesin: kol süpürürken renk yumuşakça değişsin. Açıyı 0-255 arası bir ''adım'' değerine eşle ve gökkuşağı bloğuna ver.',
 'sürekli { aci 30→150 { kanal 0 = aci → adim = eşle(aci, 30-150 → 0-255) → RGB gökkuşağı adim → 30 ms } ve geri }. Açı değiştikçe renk kayar.',
 '["Renk-veri eşlemesi", "''eşle'' (map) kullanımı", "Doğrusal araları yumuşak doldurma", "Görsel veri sunumu"]'::jsonb, 13, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 14, 'Kavrama Işığı', 'RGB LED', 2, 15, 15, '💜',
 'Gripper bir şey tutarken (kapalı) LED MOR yansın; boşken BEYAZ. Mesafe sensörüyle birleştir: nesne yaklaşırken SARI ''hazırlan'' ışığı yansın, 7 cm''den yakına gelince otomatik kavrasın.',
 'sürekli { mesafe oku → eğer mesafe<10 VE gripper>85: SARI; değilse eğer gripper<=85: MOR; değilse BEYAZ → eğer mesafe<7: gripper=40 (kavra), 2 sn, gripper=140 (bırak) }.',
 '["Çoklu koşul (VE)", "3 durumlu gösterge", "Birden çok sensörü birlikte kullanmaya giriş"]'::jsonb, 14, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 15, 'İleri-Geri Süpürme', 'Döngü & Değişken', 2, 15, 15, '🌊',
 'Tabanı 30°''den 150°''ye ve geri, sürekli döngüde yumuşak süpürme yaptır. Her iki yönde de 1''er derecelik adımlar ve 30 ms bekleme kullan.',
 'Sürekli tekrarla { ''a'' 30''dan 150''ye 1''er { kanal 0 = a → 30 ms } → ''a'' 150''den 30''a 1''er { kanal 0 = a → 30 ms } }.',
 '["Sonsuz döngü (sürekli tekrarla)", "Artan/azalan sayaç", "Radar süpürme deseni"]'::jsonb, 15, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 16, 'Hızlanan Süpürme', 'Döngü & Değişken', 3, 18, 20, '📈',
 'Görev 15''teki süpürmeyi her turda hızlandır: ''hiz'' değişkeni 60 ms''den başlasın, her tam turda 10 ms azalsın, 10 ms''ye ulaşınca tekrar 60''a dönsün.',
 'hiz = 60 → sürekli { git-gel süpürme (bekleme = hiz) → hiz = hiz - 10 → eğer hiz < 10 ise hiz = 60 }.',
 '["Değişkeni döngü içinde güncelleme", "Koşullu sıfırlama", "İvme kavramı"]'::jsonb, 16, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 17, 'İç İçe Döngü: Tarama Deseni', 'Döngü & Değişken', 3, 20, 20, '🔬',
 'İç içe iki döngüyle tarama yap: dış döngü omuzu 60°, 90°, 120° yapar; her omuz açısında iç döngü tabanı 40°''den 140°''ye süpürür. 3B tarama simülasyonu!',
 'sürekli { ''omuz'' 60''tan 120''ye 30''ar { kanal 1 = omuz → ''t'' 40''tan 140''a 2''şer { kanal 0 = t → 20 ms } → geri süpür } }.',
 '["İç içe döngü (döngü içinde döngü)", "2 eksenli koordinasyon", "Tarama algoritması"]'::jsonb, 17, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 18, 'Fonksiyon Yaz: git_pozisyona()', 'Döngü & Değişken', 3, 20, 25, '📦',
 'Üç parametre alan fonksiyon yaz: git_pozisyona(taban, omuz, dirsek). Fonksiyon her ekseni verilen açıya götürsün. Sonra bu fonksiyonla 4 farklı pozisyona sırayla git.',
 'Fonksiyon git_pozisyona(taban, omuz, dirsek) { kanal 0=taban, kanal 1=omuz, kanal 2=dirsek → 600 ms bekle } → git_pozisyona(45,70,110) gibi çağır.',
 '["Fonksiyon tanımlama", "Parametre kavramı", "Kodun yeniden kullanımı", "Karmaşık işi tek isim altında toplama"]'::jsonb, 18, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 19, 'Rastgele Dans', 'Döngü & Değişken', 3, 18, 20, '🎲',
 'Rastgele sayı bloğuyla kol 10 kez rastgele pozisyona gitsin: taban 30-150, omuz 50-130 arası. Her pozisyonda yarım saniye dursun. Güvenli sınırların DIŞINA çıkma!',
 '10 kez tekrarla { t = rastgele(30,150) → o = rastgele(50,130) → git_pozisyona(t, o, 90) → 500 ms } → ev pozisyonu. Sınırlar servo koruması: asla 0/180 verme.',
 '["Rastgele sayı üretimi", "Sınır (aralık) belirleme", "Görev 18 fonksiyonunu kullanma"]'::jsonb, 19, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 20, 'Pozisyon Hafızası: Rota Tekrarı', 'Döngü & Değişken', 4, 25, 25, '🗂️',
 '4 pozisyonluk bir rota belirle: (90,90,90) → (40,70,120) → (140,70,120) → (90,120,60). Tekrar bloğuyla bu rotayı 3 tur attır.',
 '3 kez tekrarla { git_pozisyona(90,90,90) → 1 sn → git_pozisyona(40,70,120) → 1 sn → git_pozisyona(140,70,120) → 1 sn → git_pozisyona(90,120,60) → 1 sn } → ev.',
 '["Rota kaydetme mantığı", "Fonksiyon + döngü birleşimi", "Tekrarlanabilir görev", "Teach & repeat temeli"]'::jsonb, 20, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 21, 'Buton ile Başlat', 'Buton', 1, 10, 10, '🔘',
 'Devreye buton bağla (pin 10). Butona basılınca kol selam hareketini (görev 5) bir kez yapsın, basılmadıkça beklesin.',
 'Fonksiyon selam_ver() { görev 5''in blokları } → sürekli { eğer buton basıldı ise: selam_ver() → 300 ms → 50 ms bekle }.',
 '["Dijital giriş (0/1)", "Pull-up kavramı", "Olay bekleme döngüsü", "Fonksiyonu tetikleme"]'::jsonb, 21, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 22, 'Sayaçlı Buton', 'Buton', 2, 15, 15, '🔢',
 'Butona her basışta sayaç 1 artsın. Sayaç 1 ise kol sola (45°), 2 ise ortaya (90°), 3 ise sağa (135°) gitsin; 4. basışta sayaç sıfırlansın ve ev pozisyonuna dönsün.',
 'sürekli { eğer buton { 50 ms bekle → buton bırakılana kadar bekle (zıplama engelleme!) → sayac = sayac + 1 → eğer sayac=1: 45°, =2: 90°, =3: 135°, değilse: sayac=0 ve ev → bip } }.',
 '["Sayaç değişkeni", "Eğer-değilse zinciri", "Buton zıplaması engelleme", "Farklı durumlar arasında geçiş"]'::jsonb, 22, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 23, 'Basılı Tutma vs Tek Basış', 'Buton', 3, 18, 20, '⏱️',
 'Butona KISA basınca gripper aç/kapa değişsin (toggle); 2 saniyeden UZUN basılı tutunca kol ev pozisyonuna dönsün. Basış süresini ''zaman (ms)'' bloğuyla ölç.',
 'eğer buton { baslangic = zaman(ms) → bırakılana kadar bekle → sure = zaman(ms) - baslangic → eğer sure > 2000: ev pozisyonu; değilse: gripper 40 ↔ 140 değiştir }.',
 '["Zaman ölçümü (millis)", "Uzun/kısa basış ayrımı", "Toggle (aç/kapa) mantığı"]'::jsonb, 23, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 24, 'Potla Taban Kontrolü', 'Potansiyometre', 2, 15, 15, '🎛️',
 'Potansiyometreyi ADC0''a (GPIO 26) bağla. Pot değerini (0-100) oku ve 30-150 derece aralığına eşle, tabanı döndür. Potu çevir, kol seni takip etsin!',
 'sürekli { deger = pot oku (ADC0) → aci = eşle(deger, 0-100 → 30-150) → kanal 0 açı = aci → 30 ms }. Çıkış aralığı 30-150: servo asla zorlanmaz.',
 '["Analog giriş", "''eşle'' (map): bir aralığı başka aralığa çevirme", "Sürekli okuma döngüsü", "Güvenli açı aralığı"]'::jsonb, 24, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 25, 'Çift Pot: Kukla Modu', 'Potansiyometre', 3, 20, 20, '🎭',
 'İki potansiyometre bağla (ADC0 ve ADC2): biri tabanı, diğeri omuzu kontrol etsin. İki elinle iki potu çevirerek kolu kukla gibi oynat ve bir küpe dokunmayı dene.',
 'sürekli { aci1 = eşle(pot ADC0, 0-100 → 30-150) → aci2 = eşle(pot ADC2, 0-100 → 50-130) → kanal 0 = aci1 → kanal 1 = aci2 → 30 ms }.',
 '["Çoklu analog kanal", "Eş zamanlı manuel kontrol", "İnsan-makine arayüzü"]'::jsonb, 25, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 26, 'Pot ile Hız Ayarı', 'Potansiyometre', 3, 18, 20, '🚦',
 'Kol sürekli süpürme yapsın (görev 15), ama süpürme HIZINI potansiyometre belirlesin: pot değerini 10-100 ms bekleme aralığına eşle. Döngünün İÇİNDE oku ki canlı değişsin.',
 'süpürme döngüsünün içinde: hiz = eşle(pot, 0-100 → 10-100) → kanal 0 = a → hiz ms bekle. Potu çevirdikçe kol anında hızlanıp yavaşlar.',
 '["Parametreyi canlı ayarlama", "Döngü içinde sensör okuma", "Hız-gecikme ilişkisi"]'::jsonb, 26, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 27, 'Ölü Bölge (Deadzone)', 'Potansiyometre', 4, 20, 25, '🎯',
 'Pot tam ortadayken (45-55 arası) kol hareket ETMESİN (ölü bölge); orta noktadan uzaklaştıkça kol o yöne gittikçe hızlanarak dönsün. Joystick mantığının temeli!',
 'sürekli { fark = pot - 50 → eğer mutlak_değer(fark) > 5 ise: rotasyon = rotasyon + fark/20 → rotasyon = sınırla(rotasyon, 30, 150) → kanal 0 = rotasyon }.',
 '["Ortada hareketsiz bölge (deadzone)", "Uzaklaştıkça hızlanma", "Mutlak değer bloğu", "Sınırla bloğu ile servo koruma"]'::jsonb, 27, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 28, 'Mesafe Oku ve Yazdır', 'Mesafe Sensörü', 2, 12, 15, '📏',
 'HC-SR04 ultrasonik mesafe sensörünü bağla (trig 3, echo 2). Önündeki cismin mesafesini cm olarak oku ve konsola saniyede 2 kez yazdır. Elini yaklaştırıp uzaklaştırarak değerleri gözle.',
 'sürekli { mesafe = ultrasonik mesafe oku → yazdır(birleştir(''Mesafe (cm): '', mesafe)) → 500 ms bekle }.',
 '["Ultrasonik ses prensibi", "Mesafe ölçümü (cm)", "Konsola yazdırma", "Sensör verisi doğrulama"]'::jsonb, 28, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 29, 'Yaklaşınca Kaç!', 'Mesafe Sensörü', 3, 18, 20, '🙈',
 'Sensörü kolun önüne yerleştir. Bir cisim 10 cm''den fazla yaklaşınca kol geriye çekilsin (omuz yukarı), cisim 15 cm''den uzaklaşınca eski pozisyona dönsün. İki farklı eşik kullan — böylece titremez!',
 'kacti = yanlış → sürekli { mesafe oku → eğer mesafe<10 VE kacti değil: omuz 130, kacti=doğru, bip → eğer mesafe>15 VE kacti: omuz 90, kacti=yanlış }.',
 '["Eşik (sınır değeri) kavramı", "Refleks davranış", "İki farklı sınır kullanma (histerezis)", "Durum değişkeni"]'::jsonb, 29, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 30, 'Mesafeyle Eksen Sürme (Jedi Modu)', 'Mesafe Sensörü', 3, 20, 20, '🫲',
 'Elinin sensöre uzaklığı tabanı kontrol etsin: 5 cm = 30°, 30 cm = 150°. Ölçüm gürültüsü için son 5 okumanın ORTALAMASINI al. Elini havada oynatarak kolu ''dokunmadan'' yönet — Jedi modu!',
 'sürekli { toplam=0 → 5 kez { toplam = toplam + mesafe → 20 ms } → ort = toplam/5 → aci = sınırla(eşle(sınırla(ort,5,30), 5-30 → 30-150), 30, 150) → kanal 0 = aci }.',
 '["Sensör-servo eşleme", "Birkaç ölçümün ortalamasını alma", "Gürültü kavramı", "Temassız arayüz"]'::jsonb, 30, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 31, 'Nesne Var mı? Kavra!', 'Mesafe Sensörü', 4, 25, 30, '🤖',
 'Sensör gripper''ın önüne baksın. 7 cm''den yakına bir küp gelirse kol OTOMATİK kavrasın, 3 saniye tutsun, sonra bıraksın ve tekrar beklesin. İlk otonom davranışın!',
 'sürekli { mesafe oku → eğer mesafe < 7: bip → kanal 3 = 40 (kavra) → 3 sn → kanal 3 = 140 (bırak) → 2 sn → 100 ms }.',
 '["Otonom tetikleme", "Algıla-karar ver-davran döngüsü", "Bekleme durumları", "Otomasyon temeli"]'::jsonb, 31, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 32, 'Radar Tarayıcı', 'Mesafe Sensörü', 4, 30, 30, '📡',
 'Sensörü kolun üstüne monte et. Kol 30°''den 150°''ye tararken her 10 derecede mesafe ölçsün ve ''açı : mesafe'' olarak konsola yazsın. En YAKIN nesnenin açısını bulup kolu ona çevirsin.',
 'en_yakin=999 → ''a'' 30''dan 150''ye 10''ar { kanal 0 = a → 200 ms → m = mesafe → yazdır → eğer m < en_yakin: en_yakin=m, hedef=a } → kanal 0 = hedef → bip.',
 '["Tarama + kayıt algoritması", "Minimum bulma", "Hedef kilitleme", "Gerçek radar prensibi"]'::jsonb, 32, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 33, 'Gamepad: Tek Eksen Sürüşü', 'Gamepad', 2, 15, 15, '🎮',
 'Sol analog çubuğun sol/sağ hareketiyle tabanı kontrol et: sola basılıyken açı azalsın, sağa basılıyken artsın (0.7 derecelik adımlar). Sınırları AŞMA: 30° ve 150°''de dur.',
 'rotasyon=90 → sürekli { eğer ''Sol stick ←'' VE rotasyon>30: rotasyon -= 0.7 → eğer ''Sol stick →'' VE rotasyon<150: rotasyon += 0.7 → kanal 0 = rotasyon → 20 ms }.',
 '["Gamepad girişi okuma", "Koşullu artırma/azaltma", "Sınır kontrolü (servo koruma)", "Gerçek zamanlı kontrol"]'::jsonb, 33, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 34, 'Gamepad: 4 Eksen Tam Kontrol', 'Gamepad', 3, 25, 25, '🕹️',
 'Tüm kolu gamepad''e bağla: sol stick yatay=taban, sol stick dikey=omuz, sağ stick dikey=dirsek, LB/RB=gripper aç/kapa. Her eksende sınır koruması ve ''sınırla'' bloğu olsun.',
 'Her eksen için görev 33 kalıbını tekrarla; servo yazarken sınırla(deger, 30, 150) kullan. Gripper: LB azalt / RB artır, sınır 40-140. 4 eksen aynı döngüde çalışır.',
 '["Çoklu giriş yönetimi", "Eş zamanlı eksen kontrolü", "Buton vs analog fark", "Tam uzaktan kumandayla sürme"]'::jsonb, 34, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 35, 'Turbo Modu', 'Gamepad', 3, 15, 20, '⚡',
 'A tuşu basılıyken kol 3 kat hızlı hareket etsin (adım 0.7 yerine 2.1), bırakınca normale dönsün. Hız değişkenini tuşa göre değiştir.',
 'sürekli { eğer A basılı: adim = 2.1; değilse: adim = 0.7 → sonra tüm eksenlerde ''adim'' değişkenini kullan }. Sınırlar hâlâ 30-150 — turbo sınırı değiştirmez!',
 '["Mod değiştirme (state)", "Koşula bağlı değişken", "Kullanıcı deneyimi tasarımı"]'::jsonb, 35, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 36, 'Ev Pozisyonu Tuşu', 'Gamepad', 2, 12, 15, '🏠',
 'START tuşuna basınca kol hangi pozisyonda olursa olsun güvenli ''ev'' duruşuna (hepsi 90°) dönsün ve bip çalsın. Eksen değişkenlerini de 90''a sıfırlamayı unutma!',
 'eğer START basıldı (tek sefer) { taban=90, omuz=90, dirsek=90, gripper=90 → 4 kanalı da 90 yap → bip }. Değişkenleri sıfırlamazsan kol geri sıçrar.',
 '["Acil güvenli duruş", "Değişken ile servo senkronu", "Buton olayı yakalama (tek sefer)"]'::jsonb, 36, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 37, 'Gamepad ile Küp Taşıma Yarışı', 'Gamepad', 3, 25, 25, '🏁',
 'Gamepad''le kolu kullanarak bir küpü A noktasından alıp 20 cm uzaktaki B noktasına bırak. Y tuşuna basınca süre konsola yazılsın. 3 deneme yap, en iyi süreni not et. Sınıf rekoru kimde?',
 'Görev 34 + 35''in üstüne: baslangic = zaman(ms) → eğer Y basıldı: sure = (zaman - baslangic)/1000 → yazdır → sayaç sıfırla. Kavrarken turbo''yu KAPAT, yavaş yaklaş.',
 '["El-göz koordinasyonu", "Süre ölçümü", "Süre baskısı altında kontrol", "Rekabetçi öğrenme"]'::jsonb, 37, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 38, 'Makro Kaydı: Tuşla Oynat', 'Gamepad', 4, 25, 30, '🎬',
 'X tuşuna basınca kol önceden kodladığın hareket dizisini (makro: al → taşı → bırak → ev) otomatik oynatsın; bittiğinde kontrol tekrar gamepad''e geçsin.',
 'Fonksiyon makro_oynat() { al-taşı-bırak-ev adımları } → döngüde: eğer X basıldı (tek sefer): makro_oynat() → eksen değişkenlerini 90''a sıfırla (yoksa kol sıçrar!).',
 '["Manuel/otomatik mod geçişi", "Makro kavramı", "Fonksiyon + gamepad birleşimi", "Yarı-otonom sistem"]'::jsonb, 38, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 39, 'Işık Değeri Oku', 'LDR', 1, 10, 10, '☀️',
 'LDR''yi ADC1''e (GPIO 27) bağla, ışık değerini (0-100) konsola yazdır. El feneriyle üzerine tut ve elinle kapat — ''karanlık'' ve ''aydınlık'' eşik değerlerini not et.',
 'sürekli { isik = LDR oku (ADC1) → yazdır(birleştir(''Isik (0-100): '', isik)) → 500 ms }. Tipik: karanlık < 20, oda ışığı ~40, fener > 80.',
 '["LDR çalışma prensibi", "Ortam ölçümü", "Eşik belirleme deneyi"]'::jsonb, 39, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 40, 'Işığa Dönen Kol (Ayçiçeği)', 'LDR', 4, 25, 30, '🌻',
 'İki LDR''yi kolun soluna (ADC0) ve sağına (ADC2) yerleştir. Kol hangi taraf daha aydınlıksa O TARAFA dönsün — ayçiçeği gibi ışığı takip etsin! El feneriyle kolu yönlendir.',
 'sürekli { sol = LDR(ADC0), sag = LDR(ADC2) → fark = sol - sag → eğer fark > 5: rotasyon += 1; eğer fark < -5: rotasyon -= 1 → rotasyon = sınırla(rotasyon,30,150) → kanal 0 = rotasyon }.',
 '["Diferansiyel sensör okuma", "Işık takip algoritması", "Güneş paneli takip sistemleri", "Sensöre bakarak sürekli düzeltme"]'::jsonb, 40, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 41, 'Karanlık Modu', 'LDR', 2, 15, 15, '🌙',
 'Ortam kararınca kol otomatik ''uyku pozisyonuna'' katlansın ve LED kısık maviye dönsün; ışık gelince uyanıp ev pozisyonuna geçsin ve bip çalsın. İki farklı eşik kullan (20 ve 35).',
 'uyanik = doğru → sürekli { isik oku → eğer isik<20 VE uyanik: katlan (omuz 140, dirsek 40, gripper 40), LED lacivert, uyanik=yanlış → eğer isik>35 VE uyanik değil: ev, LED beyaz, nota çal, uyanik=doğru }.',
 '["Durum değişkeni (uyanık/uyku)", "İki farklı sınırla kararlı çalışma", "Enerji tasarrufu senaryosu"]'::jsonb, 41, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 42, 'Merhaba OLED', 'OLED Ekran', 2, 15, 15, '🖥️',
 'OLED ekranı I2C ile bağla (SDA 4, SCL 5). Ekrana adını ve ''RoboArm Hazır!'' yazdır. Yazdıktan sonra ''ekrana yansıt'' bloğunu çağırmayı UNUTMA.',
 'OLED başlat (SDA 4, SCL 5, 128x64, 0x3C) → OLED temizle → OLED yaz ''RoboArm Hazir!'' (0,0, 1×) → OLED yaz ''Ali'' (0,20, 2×) → OLED ekrana yansıt.',
 '["I2C haberleşme", "SDA/SCL pinleri", "Ekrana metin yazma", "Tampon/göster (show) mantığı"]'::jsonb, 42, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 43, 'Canlı Açı Paneli', 'OLED Ekran', 3, 20, 20, '📊',
 'OLED''e 4 eksenin anlık açılarını canlı yazdır: ''Taban:90  Omuz:45...'' Gamepad''le kolu oynatırken değerler ekranda değişsin — kendi kontrol panelin!',
 'Görev 34''ün döngüsüne ekle: OLED temizle → yaz(birleştir(''Taban:'', taban), y=0) → ''Omuz:'' y=16 → ''Dirsek:'' y=32 → ''Tutucu:'' y=48 → ekrana yansıt.',
 '["Canlı veri gösterimi", "Metin + değişken birleştirme", "Satır konumlandırma", "Telemetri kavramı"]'::jsonb, 43, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 44, 'Mesafe Göstergesi + Bar', 'OLED Ekran', 3, 20, 20, '📶',
 'Mesafe sensörü değerini OLED''de hem SAYI hem de dolan ÇUBUK olarak göster: cisim yaklaştıkça çubuk uzasın. Çubuğu ''#'' karakterleriyle kur (şekil bloğunun boyutu sabittir).',
 'sürekli { mesafe oku → bar = eşle(sınırla(mesafe,5,40), 40-5 → 0-15) → cubuk='''' → ''i'' 1''den 15''e { eğer i <= bar: cubuk = cubuk + ''#'' } → OLED''e mesafe + cubuk yaz → yansıt }.',
 '["Veri görselleştirme", "Metin birleştirme ile grafik", "''eşle'' ile ölçekleme", "Döngü ile dinamik içerik"]'::jsonb, 44, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 45, 'Görev Sayacı Ekranı', 'OLED Ekran', 3, 18, 20, '🏆',
 'Kol her başarılı kavrama yaptığında (mesafe < 7 cm) OLED''deki ''Skor'' 1 artsın ve büyük puntoyla gösterilsin. 10 skora ulaşınca ''ŞAMPİYON!'' yazsın + zafer melodisi çalsın.',
 'sürekli { eğer mesafe<7: kavra → skor = skor+1 → OLED temizle → skor''u 3× puntoyla yaz → eğer skor>=10: ''SAMPIYON!'' yaz + zafer_melodisi(); değilse bip → bırak }.',
 '["Oyunlaştırma", "Sayaç + ekran senkronu", "Font boyutları", "Koşullu kutlama"]'::jsonb, 45, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 46, 'Sıcaklık Oku', 'Sıcaklık & Röle', 2, 12, 15, '🌡️',
 'Sıcaklık sensörünü oku (Pico iç sıcaklık bloğu) ve °C olarak hem OLED''e hem konsola yazdır. Sensörü parmağınla ısıt — değerin yükselişini izle!',
 'sürekli { sicaklik = iç sıcaklık → OLED temizle → yaz(birleştir(sicaklik, '' C''), 2×) → yansıt → konsola da yazdır → 500 ms }.',
 '["Sıcaklık sensörü", "Analog→Celsius dönüşümü", "Çift çıktı (ekran + konsol)"]'::jsonb, 46, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 47, 'Röle: Işığı Aç-Kapa', 'Sıcaklık & Röle', 2, 15, 15, '🔌',
 'Röle modülünü bağla (pin 12) ve DİKKATLE (eğitmen gözetiminde, düşük voltajla) bir LED lambayı röle üzerinden aç-kapa yap. Butonla röleyi kontrol et: bas=açık, tekrar bas=kapalı.',
 'role_durum = yanlış → sürekli { eğer buton { zıplama engelle → eğer role_durum: röle kapat, durum=yanlış; değilse: röle aç, durum=doğru → bip } }.',
 '["Röle çalışma prensibi", "Düşük akımla yüksek güç anahtarlama", "Elektrik güvenliği", "Toggle mantığı"]'::jsonb, 47, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 48, 'Akıllı Fan Sistemi', 'Sıcaklık & Röle', 4, 25, 30, '🌬️',
 'Termostat yap: sıcaklık 28°C''yi geçince röle (fana bağlı) açılsın, 25°C''nin altına inince kapansın. Eşikler arası fark neden gerekli? OLED''de sıcaklık + fan durumu görünsün.',
 'sürekli { t = sıcaklık → eğer t>28 VE fan değil: röle aç, fan=doğru → eğer t<25 VE fan: röle kapat, fan=yanlış → OLED''e t ve ''FAN: ACIK/KAPALI'' yaz }. 25-28 arası boşluk fanın sürekli aç-kapa titremesini önler.',
 '["Termostat algoritması", "İki farklı sınır kullanma (histerezis)", "Gerçek ev otomasyonu", "Çoklu modül sistemi"]'::jsonb, 48, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 49, 'Sıcaklık Alarmı + Güvenlik Kolu', 'Sıcaklık & Röle', 4, 25, 30, '🚨',
 'Güvenlik senaryosu: sıcaklık 30°C''yi aşarsa → LED kırmızı yanıp sönsün, buzzer alarm çalsın, VE kol ''acil kapatma butonuna basma'' hareketi yapıp röleyi kapatsın.',
 'eğer t > 30 { OLED ''ALARM!'' → 3 kez (kırmızı + 2000 Hz bip + söndür) → git(taban 120, omuz 65, dirsek 115) → gripper kapat → röle KAPAT → gripper aç → ev }. Değilse: yeşil LED, normal ekran.',
 '["Çok modüllü senaryo", "Acil durum protokolü", "Robotik müdahale kavramı", "Sistem entegrasyonu"]'::jsonb, 49, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 50, 'Pick & Place: A''dan B''ye', 'Parkur', 3, 25, 25, '📍',
 'Klasik endüstri görevi: küp A noktasında. Gamepad YOK — sadece kodla: kol küpe gitsin, kavrasın, kaldırsın, B noktasına taşısın, bıraksın, ev pozisyonuna dönsün.',
 'A=(60,65,120), B=(120,65,120). git(A) → kavra → git(60,110,90) kaldır → git(120,110,90) taşı → git(B) indir → bırak → ev. Taşırken kolu HEP kaldır, yoksa küp masaya sürtünür.',
 '["Pick & place otomasyonu", "Pozisyon programlama", "Operasyon sıralaması", "Endüstriyel robotik temeli"]'::jsonb, 50, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 51, 'Silindir Parkuru: Halkayı Geçir', 'Parkur', 4, 30, 30, '🎯',
 'Delikli küpü kavra ve silindir parkurunun direğine GEÇİR. Küpün deliği direğe hizalanmalı! Önce gamepad''le dene, hizayı bulunca açıları koda geç.',
 'Küpü al → kaldır → git(taban 110, omuz 115) direğin TAM üstü → sonra SADECE omzu 115''ten 70''e 1''er derece indir (döngüyle, 40 ms) → bırak → omzu geri kaldır. Eksen ayrıştırma: aynı anda 2 eksen oynatma, hiza bozulur!',
 '["Hassas hizalama", "Eksen ayrıştırma tekniği", "Kademeli (yavaş) iniş", "Tolerans kavramı"]'::jsonb, 51, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 52, 'Kule Yap: 3 Küp Üst Üste', 'Parkur', 4, 30, 30, '🗼',
 '3 küpü sırayla al ve aynı noktaya ÜST ÜSTE diz. Her katta bırakma yüksekliği (omuz açısı) bir küp boyu artmalı — yükseklik farkını değişkenle hesapla.',
 'kat=0 → 3 kez { git(55,65,120) al → kavra → kaldır → birak_omuz = 70 + kat*8 → git(125, birak_omuz, 115) → bırak → kaldır → kat = kat+1 → bip }.',
 '["Değişken yükseklik hesabı", "Döngü + pozisyon aritmetiği", "İstifleme (üst üste dizme)", "Hassas bırakma"]'::jsonb, 52, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 53, 'Renk Ayrıştırma Simülasyonu', 'Parkur', 3, 25, 25, '🎨',
 '3 küpü sırayla al; her küp için butona basılma SAYISI rengini temsil etsin (1=sol kutu, 2=orta, 3=sağ). Operatör (arkadaşın) butona basar, kol küpü doğru kutuya taşır!',
 'sürekli { küpü al → kaldır → 2 sn''lik pencerede buton basışlarını say (secim) → eğer secim=1: hedef=40; =2: hedef=90; değilse: hedef=140 → git(hedef,70,115) → bırak }.',
 '["İnsan-robot işbirliği", "Zaman penceresinde giriş sayma", "Sıralı iş istasyonu", "Koşullu dallanma"]'::jsonb, 53, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 54, 'X-O-X: İlk Hamle', 'Parkur', 3, 25, 25, '⭕',
 'X-O-X tablasını kolun önüne sabitle. 9 hücreyi FORMÜLLE hesapla: sütun = hücre mod 3, satır = hücre / 3 (aşağı yuvarla). Sonra kol bir küpü alıp ORTA hücreye (indeks 4) bıraksın.',
 'Fonksiyon git_hucre(h) { sutun = h mod 3 → satir = aşağı_yuvarla(h/3) → t = 50 + sutun*40 → o = 60 + satir*15 → kanal 0 = sınırla(t,30,150), kanal 1 = sınırla(o,50,130), kanal 2 = 115 } → kup_al() → git_hucre(4) → bırak.',
 '["Izgara (grid) haritalama", "Mod (kalan) ve bölme ile koordinat", "9 nokta kalibrasyonu", "Oyun tahtası koordinatları"]'::jsonb, 54, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 55, 'X-O-X: Sıralı Hamleler', 'Parkur', 4, 30, 30, '❌',
 'Kol 5 küpü sırayla tablanın 0., 4., 8., 2. ve 6. hücrelerine dizsin (çapraz + köşeler deseni). Her hamlede buzzer bip + OLED''e hamle numarası.',
 '''i'' 0''dan 4''e { eğer i=0: h=0; i=1: h=4; i=2: h=8; i=3: h=2; değilse: h=6 → kup_al() → git_hucre(h) → bırak → hamle_no++ → OLED''e yaz → bip }.',
 '["Hamle planı", "Depodan seri besleme", "Çoklu pick&place zinciri", "Oyun stratejisi dizilimi"]'::jsonb, 55, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 56, 'X-O-X: İnsana Karşı!', 'Parkur', 5, 40, 40, '🏆',
 'Gerçek maç: sen X küplerini elle koy, ROBOT O küplerini kendi koysun. Robot strateji izlesin: orta boşsa ortayı al, değilse boş köşelerden ilkini, o da yoksa ilk boş kenarı. Sıranı butonla bildir.',
 'eğer buton { OLED ''Dusunuyor...'' → eğer orta boş: hamle=4, orta=dolu; değilse eğer köşe kaldıysa: sırayla 0,2,6,8; değilse: kenarlar 1,3,5,7 → kup_al() → git_hucre(hamle) → bırak → bip → ev }.',
 '["Oyun stratejisi algoritması", "Öncelik sıralaması", "Karar ağacı", "Yapay zekaya giriş"]'::jsonb, 56, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 57, 'Otomatik Üretim Bandı', 'Otomasyon', 4, 30, 30, '🏭',
 'Mini fabrika: mesafe sensörü ''bant başını'' izlesin. Sensöre küp konulduğunda (mesafe<7) kol otomatik alsın, hedefe taşısın, geri dönüp yeni küp beklesin. 5 küpü işle — sayaç OLED''de.',
 'sayac<5 olduğu sürece { mesafe oku → eğer mesafe<7: 500 ms bekle (küp otursun) → al → taşı → bırak → sayac++ → OLED güncelle + bip → ev } → bitince ''BITTI!'' + nota.',
 '["Olay güdümlü otomasyon", "Üretim bandı mantığı", "Sayaçla iş takibi", "Koşullu döngü (while)"]'::jsonb, 57, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 58, 'Işıkla Komut: Fener Kodu', 'Otomasyon', 4, 25, 30, '🔦',
 'LDR''ye fenerle ''komut'' gönder: 2 saniyelik pencerede 1 flaş = kolu sola, 2 flaş = sağa, 3 flaş = küp al-bırak makrosu. Flaşları ''geçiş'' sayarak bul (karanlık→aydınlık).',
 'sürekli { flas=0, onceki=yanlış → 2 sn boyunca { aydinlik = (LDR > 60) → eğer aydinlik VE onceki değil: flas++ (yeni flaş!) → onceki = aydinlik → 20 ms } → eğer flas=1: taban 45; =2: taban 135; =3: al-bırak makrosu }.',
 '["Işıkla mesaj gönderme", "Kaç kez yanıp söndüğünü sayma (kenar algılama)", "Zaman penceresi", "Uzaktan komut protokolü"]'::jsonb, 58, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 59, 'Gece Bekçisi Robot', 'Otomasyon', 4, 30, 30, '🌃',
 'Tüm sensörleri birleştir: ortam karanlıksa kol radar taraması yapsın (görev 32); 15 cm''den yakın bir şey bulursa alarm çalsın, LED kırmızı flaş yapsın ve kol ''davetsiz misafire'' dönsün. Aydınlıkta uyusun.',
 'sürekli { eğer isik<20 (karanlık): tara (30→150, 10''ar) → en yakını bul → eğer en_yakin<15: hedefe dön + 5 kez (kırmızı flaş + 2000 Hz alarm); değilse: LED lacivert + ev pozisyonu (uyku) }.',
 '["Birden çok sensörü birlikte kullanma", "Güvenlik sistemi mimarisi", "Koşullu görev zinciri", "4 modül entegrasyonu"]'::jsonb, 59, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 60, 'Teach & Repeat: Öğret-Tekrarla', 'Otomasyon', 5, 35, 40, '🧠',
 'Gerçek endüstri özelliği! KAYIT modunda gamepad''le kolu gezdir, A tuşuna her bastığında o anki 4 açı kaydedilsin (4 nokta). START ile OYNAT moduna geç: kol rotayı sonsuz tekrarlasın. B ile kayda dön.',
 'mod=''KAYIT'' → eğer KAYIT: gamepad ile sür + eğer A: n++ ve (t1..t4, o1..o4, d1..d4, g1..g4) değişkenlerine kaydet + OLED''de göster; eğer START: mod=''OYNAT''. OYNAT: 4 noktayı sırayla servolara yaz, 1''er sn bekle; eğer B: kayda dön.',
 '["Robota hareketi elle öğretme", "Mod mimarisi (kayıt/oynat)", "Değişkenlerde durum saklama", "Gerçek endüstriyel iş akışı"]'::jsonb, 60, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 61, 'Pot ile Kayıt Hızı', 'Otomasyon', 3, 20, 25, '⏩',
 'Görev 60''taki oynatma hızını potansiyometreye bağla: pot solda = ağır çekim (2000 ms/nokta), pot sağda = hızlı (200 ms/nokta). Operatör üretim hızını canlı ayarlasın. OLED''de hızı göster.',
 'sürekli { bekleme = eşle(pot, 0-100 → 2000-200) → OLED''e yaz → nokta1 → bekleme ms → nokta2 → bekleme ms → nokta3 → bekleme ms }. Ters eşleme: pot artınca bekleme AZALIR.',
 '["Canlı süreç parametresi", "Ters eşleme (map)", "Üretim hızı (cycle time) kavramı"]'::jsonb, 61, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 62, 'Hassasiyet Testi: Aynı Noktaya 10 Kez', 'Otomasyon', 3, 20, 25, '🎯',
 'Tekrarlanabilirlik deneyi: kolun ucuna kalem bantla, kağıda 10 kez aynı pozisyona in-kalk yaptır. Oluşan nokta bulutunun çapını ölç — robotunun tekrarlanabilirliği kaç mm? Sonucu rapor et.',
 '10 kez tekrarla { git(90, 60, 125) kalem kağıda değer → 1 sn → git(90, 110, 90) yukarı kalk → 1 sn → bip } → bitince nota. Noktalar 5 mm çembere sığıyorsa süper!',
 '["Hep aynı yere gidebilme (tekrarlanabilirlik)", "Deneysel ölçüm", "Mühendislik raporu", "Kalite kontrol kavramı"]'::jsonb, 62, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 63, 'Servo Yumuşatma: Easing', 'Otomasyon', 5, 30, 35, '〰️',
 'Kol hareketleri robotik değil AKICI olsun: önce DOĞRUSAL hareket yap, sonra SİNÜS yumuşatması uygula (başta yavaş, ortada hızlı, sonda yavaş). Aynı hareketi iki yöntemle yap, farkı videoya çek!',
 'Doğrusal: aci = baslangic + (hedef-baslangic) * i/100. Yumuşatma: e = (1 - cos(i*180/100)) / 2 → aci = baslangic + (hedef-baslangic) * e. Servoya yazarken sınırla(aci, 30, 150) kullan.',
 '["Yumuşak hızlanma-yavaşlama (easing)", "Trigonometri (cos) uygulaması", "İvmelenme profili", "Profesyonel hareket kalitesi"]'::jsonb, 63, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 64, 'Final Hazırlık: Sistem Şeması', 'Final Projesi', 3, 30, 25, '📐',
 'Final projen için A4''e sistem şeması çiz: hangi sensörler, hangi pinler, hangi davranışlar? Girdi→İşlem→Çıktı kutuları ve akış diyagramı olsun. Kod tarafında pin haritasını OLED''e yazdır.',
 'PIN HARİTASI: PCA9685 SDA=4 SCL=5 (kanal 0=taban, 1=omuz, 2=dirsek, 3=tutucu) · Buzzer 20 · RGB 6 · Buton 10 · Trig 3 / Echo 2 · Röle 12 · Pot ADC0(26) · LDR ADC1(27). GÜVENLİ AÇI: 30-150.',
 '["Sistem tasarımı", "Akış diyagramı", "Dokümantasyon", "Pin haritası çıkarma"]'::jsonb, 64, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 65, 'Final A: Akıllı Depo Robotu', 'Final Projesi', 5, 60, 50, '📦',
 'Tam sistem: küpleri depodan al, butonla seçilen rafa (3 hedef) taşı. OLED''de stok sayısı, her işlemde bip, hareket halinde kırmızı LED, tamamlanınca zafer melodisi.',
 'Görev 50 + 53 + 45 + 12 + 11 birleşimi: stok<3 iken { raf seç (buton sayısı) → LED kırmızı → depodan al → rafa taşı → bırak → stok++ → OLED → LED yeşil } → bitince mavi LED + zafer melodisi.',
 '["Uçtan uca sistem entegrasyonu", "Depo otomasyonu (AS/RS)", "Modüler geliştirme", "Proje yönetimi"]'::jsonb, 65, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 66, 'Final B: X-O-X Turnuva Robotu', 'Final Projesi', 5, 60, 50, '🥇',
 'Sınıf turnuvası için X-O-X robotunu tamamla: 9 hücre kalibre, strateji algoritması (görev 56), hamle öncesi OLED''de ''düşünüyor...'' animasyonu, her hamlede ses, kazanınca zafer dansı + melodi.',
 'Görev 54 + 55 + 56 + 11 + 13 birleşimi + zafer_dansi() fonksiyonu (taban/omuz salla + LED renk değiştir). Hamle sırası: orta → köşeler → kenarlar.',
 '["Oyun yapay zekası", "Turnuva baskısı altında sistem", "Şovmenlik & sunum", "Tam ürün deneyimi"]'::jsonb, 66, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 67, 'Final C: Serbest Proje (Örnek: Kalem Uzatan Masa Asistanı)', 'Final Projesi', 5, 60, 50, '🚀',
 'Kendi fikrin! Şartlar: en az 2 sensör + 1 çıktı modülü (OLED/LED/buzzer/röle) + kol hareketi içermeli, gerçek bir problemi çözmeli. Cevap anahtarındaki örnek: kalem uzatan masa asistanı.',
 'Örnek çözüm (2 sensör: LDR + mesafe): lamba açıksa asistan uyanık → el uzanınca (mesafe<12) kalemliğe git → kavra → kullanıcıya uzat → 2 sn bekle → bırak → ev. Karanlıkta uyku modu.',
 '["Açık uçlu problem çözme", "Yaratıcı mühendislik", "Bağımsız proje geliştirme", "Ürünleştirme"]'::jsonb, 67, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 68, 'Kod Temizliği & Yorumlama', 'Final Projesi', 3, 25, 25, '🧹',
 'Final projenin kodunu profesyonelleştir: anlamlı fonksiyon/değişken adları (a1 değil taban_acisi), tekrar eden blokları fonksiyona çevir, her servo yazımını ''sınırla'' ile koru.',
 'Örnek: kolu_pozisyona_gotur(taban_acisi, omuz_acisi, dirsek_acisi) { her servoya sınırla(...) ile yaz } · tutucuyu_ac() · tutucuyu_kapat() · ev_pozisyonuna_don() · kupu_al_ve_tasi(). İyi kod = 6 ay sonra açtığında anladığın kod.',
 '["Temiz kod prensipleri", "Anlamlı isimlendirme", "Fonksiyonla tekrarı azaltma", "Sınırla ile savunmacı kodlama"]'::jsonb, 68, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 69, 'Demo Günü Sunumu', 'Final Projesi', 4, 40, 40, '🎤',
 'Projeni sınıfa 5 dakikada sun: problem neydi, nasıl çözdün, canlı demo. Sunumu butonla adım adım ilerlet (1. Problem → 2. Çözüm → 3. Canlı Demo → Teşekkürler). Her adım BAĞIMSIZ olsun — biri çökerse diğeri çalışsın.',
 'adim_no değişkeni + butonla artır: 1=OLED ''Problem'' + beyaz LED · 2=''Cozum'' + yeşil + kısa hareket · 3=''Canli Demo'' + kırmızı + kavrama gösterisi · sonra ''Tesekkurler'' + nota + sıfırla. Yedek plan: çalışan halin videosunu telefonda hazır tut.',
 '["Teknik sunum becerisi", "Canlı demo yönetimi", "Risk planlaması (bağımsız adımlar)", "Özgüven"]'::jsonb, 69, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 70, 'Akran Değerlendirmesi', 'Final Projesi', 2, 20, 20, '🤝',
 'İki arkadaşının projesini değerlendir: 3 kriter için butonla 1-5 puan ver, OLED''de göster, konsola kaydet. 2 güçlü yön + 1 gelişim önerisi yaz (kırıcı değil yapıcı!).',
 'sürekli { OLED''e kriter no + puan yaz → eğer buton: puan++ → eğer puan>5: konsola yazdır, puan=0, kriter++ → eğer kriter>3: kriter=1, nota çal }. Yapıcı kalıp: ''X çok iyi olmuş çünkü... Y''yi şöyle denesen daha da iyi olur.''',
 '["Yapıcı geri bildirim", "Puanlama sistemi kodlama", "Eleştiriyi kabullenme", "Takım kültürü"]'::jsonb, 70, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 71, 'Mezuniyet: RoboArm Ustası', 'Final Projesi', 5, 30, 50, '🎓',
 'Son görev: eğitmeninin seçtiği SÜRPRİZ görevi 20 dakikada, yardım almadan tamamla. Cevap anahtarındaki örnek: ''küpü silindire geçir + her adımda farklı LED rengi''. Başarırsan RoboArm Ustası rozetini kazan!',
 'Örnek: beyaz(hazır) → sarı(yaklaş) → mor(kavra) → kırmızı(taşı) → camgöbeği(hizala) → SADECE omzu yavaşça indir → yeşil(bırak) → omzu kaldır → ev → ''USTA!'' + zafer melodisi + gökkuşağı. Sakin ol, adım adım düşün, önce şema çiz.',
 '["Baskı altında bağımsız çözüm", "Tüm becerilerin sentezi", "Zaman yönetimi", "Mühendis kimliği"]'::jsonb, 71, true, extract(epoch from now())*1000, extract(epoch from now())*1000);

-- ═══ Kontrol sorguları ═══
-- SELECT count(*) FROM bb_tasks WHERE kit='roboarm';   -- 71 dönmeli
-- SELECT category, count(*) FROM bb_tasks WHERE kit='roboarm' GROUP BY category ORDER BY min(task_id);
