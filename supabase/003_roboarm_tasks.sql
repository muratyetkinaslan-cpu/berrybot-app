-- ═══════════════════════════════════════════════════════════════
-- RoboArm Görev Müfredatı — 72 görev, 2 aylık eğitim programı
-- Supabase Dashboard > SQL Editor'da çalıştır
-- Resim GEREKMEZ: her görev emoji + metin tabanlıdır.
-- ═══════════════════════════════════════════════════════════════

-- bb_tasks tablosu (yoksa oluştur — kod bu tabloyu kullanıyor)
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

-- Eski roboarm görevlerini temizle (tekrar çalıştırılabilir olsun)
DELETE FROM bb_tasks WHERE kit = 'roboarm';

INSERT INTO bb_tasks (kit, task_id, title, category, difficulty, expected_min, xp, emoji, description, answer, learnings, position, active, created_at, updated_at) VALUES

-- ═══ BÖLÜM 1: SERVO TEMELLERİ (Hafta 1) ═══
('roboarm', 1, 'İlk Hareket: Taban 30°→100°', 'Servo Temelleri', 1, 10, 10, '🦾',
 'Robot kolun tabanını (en alttaki motor) 30 dereceden 100 dereceye çevir. Arada 1 saniye beklesin. Taban motoru pin 0''a takılı.',
 'servo_yaz(0, 30) → bekle(1sn) → servo_yaz(0, 100). İpucu: Başlangıçta blokları sırayla diz.',
 '["Servo motor kavramı","Açı (derece) kavramı","Pin bağlantısı","Sıralı komut çalıştırma"]'::jsonb, 1, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 2, 'Tekrarla: 5 Kez Git-Gel', 'Servo Temelleri', 1, 12, 10, '🔁',
 'Görev 1''deki hareketi 5 kez tekrarlat. Kol 30 dereceye gitsin, sonra 100 dereceye, sonra tekrar başa dönsün. Her seferinde 1 saniye beklesin. Tekrar bloğunu kullan!',
 'repeat(5){ servo_yaz(0,30); bekle(1); servo_yaz(0,100); bekle(1); }',
 '["Tekrar (repeat) bloğu","Döngü kavramına giriş","Kod tekrarından kaçınma","Bekleme süresi"]'::jsonb, 2, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 3, 'Yumuşak Hareket: Hız Değişkeni', 'Servo Temelleri', 2, 15, 15, '🎚️',
 'Kol birden zıplamasın, yavaş yavaş gitsin! 30''dan 100''e birer derece ilerlesin, her adımda 100 ms beklesin. Bekleme süresini ''hiz'' adında bir kutuya (değişkene) koy. Sayıyı küçültünce kol hızlanır, büyütünce yavaşlar.',
 'hiz=100; for(aci=30; aci<=100; aci++){ servo_yaz(0,aci); bekle_ms(hiz); }. hiz=50 yapınca 2 kat hızlanır.',
 '["Değişken tanımlama","for döngüsü","Adım adım (kademeli) hareket","Milisaniye kavramı"]'::jsonb, 3, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 4, 'Dört Eksen Tanışma', 'Servo Temelleri', 1, 12, 10, '🧭',
 'Robot kolunun 4 motoru var: taban (pin 0), omuz (pin 1), dirsek (pin 2), tutucu/gripper (pin 3). Hepsini sırayla 90 dereceye getir. Her motordan sonra 1 saniye bekle. Kol dimdik ''hazır'' pozisyonuna gelsin.',
 'servo_yaz(0,90); bekle(1); servo_yaz(1,90); bekle(1); servo_yaz(2,90); bekle(1); servo_yaz(3,90);',
 '["4 eksen mimarisi","Kalibrasyon duruşu (90°)","Pin-eklem eşlemesi","Güvenli başlangıç pozisyonu"]'::jsonb, 4, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 5, 'Sınırları Keşfet', 'Servo Temelleri', 2, 15, 15, '⚠️',
 'Her motorun en fazla nereye kadar dönebildiğini bul. Motor ''vızzz'' diye ses çıkarıp zorlanıyorsa DUR, geri çek! Bulduğun en küçük ve en büyük açıları kağıda yaz. Sonra bunları koda değişken olarak koy.',
 'Örnek: taban 5–175, omuz 20–160, dirsek 15–165, gripper 30–150 (her kitte küçük fark olabilir). Zorlanan servo VIZILDAR — hemen geri çek!',
 '["Mekanik sınırlar","Servo koruma bilinci","Değişkenle sınır saklama","Gözlem ve not alma"]'::jsonb, 5, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 6, 'Selam Veren Kol', 'Servo Temelleri', 2, 15, 15, '👋',
 'Robotun sana el sallasın! Önce omuz 60 dereceye eğilsin. Sonra bilek 3 kez sağa sola sallansın (60 ve 120 derece arası). En son kol hazır duruşa dönsün.',
 'servo_yaz(1,60); repeat(3){ servo_yaz(2,60); bekle_ms(300); servo_yaz(2,120); bekle_ms(300); } → hepsi 90°.',
 '["Çoklu eksen koordinasyonu","Tekrar + sıralı akış","İnsansı hareket tasarımı"]'::jsonb, 6, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 7, 'Gripper: Aç-Kapa', 'Servo Temelleri', 1, 10, 10, '🤏',
 'Robotun elini (gripper) aç kapa yap! Pin 3''teki motorla: tam aç (150 derece), 1 saniye bekle, tam kapat (30 derece). Bunu 3 kez tekrarla.',
 'repeat(3){ servo_yaz(3,150); bekle(1); servo_yaz(3,30); bekle(1); }',
 '["Gripper mekanizması","Açık/kapalı açı değerleri","Kavrama mantığına giriş"]'::jsonb, 7, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 8, 'İlk Kavrama: Küpü Tut', 'Servo Temelleri', 3, 20, 20, '🧊',
 'İlk kez bir şey tutacaksın! Küpü kolun önüne koy. Robotun elini aç, kolu aşağı indir, eli kapat ve küpü tut. Çok sıkma (motor zorlanır), az da sıkma (küp düşer). Sonra kolu kaldır — küp 5 saniye havada kalsın!',
 'Kavrama açısı kritik: küp ~3cm ise gripper ~75-85° arasında ideal tutar. Çok sıkarsan servo zorlanır, az sıkarsan düşer.',
 '["Hassas kavrama","Deneme-yanılma kalibrasyonu","Tork ve kuvvet dengesi","Pick (alma) operasyonu"]'::jsonb, 8, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 2: DÖNGÜLER & DEĞİŞKENLER (Hafta 2) ═══
('roboarm', 9, 'İleri-Geri Süpürme', 'Döngü & Değişken', 2, 15, 15, '🌊',
 'Tabanı 20°''den 160°''ye ve geri, sürekli döngüde (while true) yumuşak süpürme hareketi yaptır. Her iki yönde de 1''er derecelik adımlar ve 30 ms bekleme kullan.',
 'while(true){ for(a=20;a<=160;a++){servo(0,a);bekle_ms(30);} for(a=160;a>=20;a--){servo(0,a);bekle_ms(30);} }',
 '["Sonsuz döngü (while true)","Artan/azalan sayaç","Radar süpürme deseni"]'::jsonb, 9, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 10, 'Hızlanan Süpürme', 'Döngü & Değişken', 3, 18, 20, '📈',
 'Görev 9''daki süpürmeyi her turda hızlandır: hiz değişkeni 60 ms''den başlasın, her tam turda 10 ms azalsın, 10 ms''ye ulaşınca tekrar 60''a dönsün.',
 'hiz=60; her tur sonunda: hiz = hiz - 10; if(hiz < 10){ hiz = 60; }',
 '["Değişkeni döngü içinde güncelleme","Koşullu sıfırlama (if)","İvme kavramı"]'::jsonb, 10, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 11, 'İç İçe Döngü: Tarama Deseni', 'Döngü & Değişken', 3, 20, 20, '🔬',
 'İç içe iki döngüyle tarama yap: dış döngü omuzu 60°, 90°, 120° yapar; her omuz açısında iç döngü tabanı 40°''den 140°''ye süpürür. 3B tarama simülasyonu!',
 'for(omuz of [60,90,120]){ servo(1,omuz); for(t=40;t<=140;t+=2){ servo(0,t); bekle_ms(20); } }',
 '["İç içe döngü (döngü içinde döngü)","2 eksenli koordinasyon","Tarama algoritması","Liste üzerinde gezinme"]'::jsonb, 11, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 12, 'Fonksiyon Yaz: git_pozisyona()', 'Döngü & Değişken', 3, 20, 25, '📦',
 'Üç parametre alan bir fonksiyon yaz: git_pozisyona(taban, omuz, dirsek). Fonksiyon her ekseni verilen açıya yumuşakça götürsün. Sonra bu fonksiyonla 3 farklı pozisyona sırayla git.',
 'function git_pozisyona(t,o,d){ servo(0,t); servo(1,o); servo(2,d); bekle_ms(600); } → git_pozisyona(45,70,110) gibi çağır.',
 '["Fonksiyon tanımlama","Parametre kavramı","Kodun yeniden kullanımı","Karmaşık işi tek isim altında toplama"]'::jsonb, 12, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 13, 'Rastgele Dans', 'Döngü & Değişken', 3, 18, 20, '🎲',
 'random (rastgele) bloğu kullanarak kol 10 kez rastgele pozisyona gitsin: taban 20-160, omuz 50-130 arası rastgele açılar. Her pozisyonda yarım saniye dursun. Güvenli sınırların DIŞINA çıkma!',
 'repeat(10){ t=random(20,160); o=random(50,130); git_pozisyona(t,o,90); bekle_ms(500); }',
 '["Rastgele sayı üretimi","Sınır (aralık) belirleme","Görev 12 fonksiyonunu kullanma"]'::jsonb, 13, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 14, 'Pozisyon Hafızası: Diziler', 'Döngü & Değişken', 4, 25, 25, '🗂️',
 'Bir dizi (liste) içine 4 pozisyon kaydet: [[90,90,90],[40,70,120],[140,70,120],[90,120,60]]. Döngüyle diziyi gez, kol her pozisyona sırayla gitsin, sonra başa dönsün ve 3 tur atsın.',
 'pozisyonlar=[[90,90,90],[40,70,120],[140,70,120],[90,120,60]]; repeat(3){ for(p of pozisyonlar){ git_pozisyona(p[0],p[1],p[2]); bekle(1); } }',
 '["Dizi (liste) veri yapısı","Dizin (index) kavramı","Rota kaydetme mantığı","Teach & repeat temeli"]'::jsonb, 14, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 3: GAMEPAD KONTROL (Hafta 2-3) ═══
('roboarm', 15, 'Gamepad: Tek Eksen Sürüşü', 'Gamepad', 2, 15, 15, '🎮',
 'Sol analog çubuğun sol/sağ hareketiyle tabanı kontrol et: sola basılıyken açı azalsın, sağa basılıyken artsın (0.7 derecelik adımlar). Sınırları aşma: 1° ve 179°''de dur.',
 'if(sol_stick_sol && rotasyon>1){ rotasyon -= 0.7; } if(sol_stick_sag && rotasyon<179){ rotasyon += 0.7; } servo(0, rotasyon);',
 '["Gamepad girişi okuma","Koşullu artırma/azaltma","Sınır kontrolü (sınırda durdurma)","Gerçek zamanlı kontrol"]'::jsonb, 15, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 16, 'Gamepad: 4 Eksen Tam Kontrol', 'Gamepad', 3, 25, 25, '🕹️',
 'Tüm kolu gamepad''e bağla: sol stick yatay=taban, sol stick dikey=omuz, sağ stick dikey=dirsek, LB/RB tuşları=gripper aç/kapa. Her eksende sınır koruması olsun.',
 'Her eksen için görev 15 kalıbını tekrarla. Gripper: if(LB){gripper-=1} if(RB){gripper+=1} + sınırlar.',
 '["Çoklu giriş yönetimi","Eş zamanlı eksen kontrolü","Buton vs analog fark","Tam uzaktan kumandayla sürme"]'::jsonb, 16, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 17, 'Turbo Modu', 'Gamepad', 3, 15, 20, '⚡',
 'A tuşu basılıyken kol 3 kat hızlı hareket etsin (adım 0.7 yerine 2.1), bırakınca normale dönsün. Hız değişkenini tuşa göre değiştir.',
 'adim = A_basili ? 2.1 : 0.7; rotasyon += adim;',
 '["Mod değiştirme (state)","Koşula bağlı değişken","Kullanıcı deneyimi tasarımı"]'::jsonb, 17, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 18, 'Ev Pozisyonu Tuşu', 'Gamepad', 2, 12, 15, '🏠',
 'START tuşuna basınca kol hangi pozisyonda olursa olsun güvenli "ev" duruşuna (hepsi 90°) yumuşakça dönsün.',
 'if(START_basildi){ git_pozisyona(90,90,90); gripper=90; }',
 '["Acil güvenli duruş","Fonksiyon tekrar kullanımı","Buton olayı yakalama"]'::jsonb, 18, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 19, 'Gamepad ile Küp Taşıma Yarışı', 'Gamepad', 3, 25, 25, '🏁',
 'Gamepad''le kolu kullanarak bir küpü A noktasından alıp 20 cm uzaktaki B noktasına bırak. Süre tut! 3 deneme yap, en iyi süreni not et. Sınıf rekoru kimde?',
 'Teknik yok — pilotluk becerisi! İpucu: küpe yaklaşırken yavaşla (turbo kapalı), kavrarken gripper açısını görev 8''den hatırla.',
 '["El-göz koordinasyonu","Hassas uzaktan kumandayla sürme","Süre baskısı altında kontrol","Rekabetçi öğrenme"]'::jsonb, 19, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 20, 'Makro Kaydı: Tuşla Oynat', 'Gamepad', 4, 25, 30, '🎬',
 'X tuşuna basınca kol önceden kodladığın 3 pozisyonluk bir hareket dizisini (makro) otomatik oynatsın; bittiğinde kontrol tekrar gamepad''e geçsin.',
 'if(X_basildi){ makro_oynat(); } — makro_oynat içinde görev 14''teki dizi mantığını kullan.',
 '["Manuel/otomatik mod geçişi","Makro kavramı","Fonksiyon + dizi birleşimi","Yarı-otonom sistem"]'::jsonb, 20, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 4: BUTON & DİJİTAL GİRİŞ (Hafta 3) ═══
('roboarm', 21, 'Buton ile Başlat', 'Buton', 1, 10, 10, '🔘',
 'Devreye bir buton bağla. Butona basılınca kol selam hareketini (görev 6) bir kez yapsın, basılmadıkça beklesin.',
 'while(true){ if(buton_okundu()==1){ selam_ver(); } }',
 '["Dijital giriş (0/1)","Pull-up/pull-down kavramı","Olay bekleme döngüsü"]'::jsonb, 21, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 22, 'Sayaçlı Buton', 'Buton', 2, 15, 15, '🔢',
 'Butona her basışta bir sayaç 1 artsın. Sayaç 1 ise kol sola (taban 45°), 2 ise ortaya (90°), 3 ise sağa (135°) gitsin; 4. basışta sayaç sıfırlansın ve ev pozisyonuna dönsün.',
 'sayac++; if(sayac==1)... else if(sayac==3)... else{ sayac=0; ev(); }. İpucu: buton bırakılana kadar bekle, yoksa tek basış 10 sayılır (buton zıplaması engelleme)!',
 '["Sayaç değişkeni","if-else if zinciri","Buton sıçraması (buton zıplaması engelleme)","Farklı durumlar arasında geçiş"]'::jsonb, 22, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 23, 'Basılı Tutma vs Tek Basış', 'Buton', 3, 18, 20, '⏱️',
 'Butona KISA basınca gripper aç/kapa değişsin (toggle); 2 saniyeden UZUN basılı tutunca kol ev pozisyonuna dönsün. Basış süresini ölç.',
 'Basınca zamanı kaydet, bırakınca farkı hesapla: sure = simdi - baslangic; if(sure > 2000){ ev(); } else { gripper_degistir(); }',
 '["Zaman ölçümü (millis)","Uzun/kısa basış ayrımı","Toggle (aç/kapa) mantığı"]'::jsonb, 23, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 5: POTANSİYOMETRE & ANALOG (Hafta 3-4) ═══
('roboarm', 24, 'Potla Taban Kontrolü', 'Potansiyometre', 2, 15, 15, '🎛️',
 'Potansiyometreyi analog pine bağla. Pot değerini (0-1023) oku ve 0-180 derece aralığına dönüştürüp (map) tabanı döndür. Potu çevir, kol seni takip etsin!',
 'deger = analog_oku(A0); aci = map(deger, 0,1023, 0,180); servo(0, aci);',
 '["Analog giriş","Analog değer 0-1023 arası okunur","map: bir sayı aralığını başka aralığa çevirme","Sürekli okuma döngüsü"]'::jsonb, 24, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 25, 'Çift Pot: Kukla Modu', 'Potansiyometre', 3, 20, 20, '🎭',
 'İki potansiyometre bağla: biri tabanı, diğeri omuzu kontrol etsin. İki elinle iki potu çevirerek kolu kukla gibi oynat ve bir küpe dokunmayı dene.',
 'aci1=map(analog_oku(A0),0,1023,0,180); aci2=map(analog_oku(A1),0,1023,30,150); servo(0,aci1); servo(1,aci2);',
 '["Çoklu analog kanal","Eş zamanlı manuel kontrol","İnsan-makine arayüzü"]'::jsonb, 25, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 26, 'Pot ile Hız Ayarı', 'Potansiyometre', 3, 18, 20, '🚦',
 'Kol sürekli süpürme yapsın (görev 9), ama süpürme HIZINI potansiyometre belirlesin: pot değerini 10-100 ms bekleme aralığına dönüştür.',
 'hiz = map(analog_oku(A0), 0,1023, 10,100); ...döngüde bekle_ms(hiz);',
 '["Parametreyi canlı ayarlama","map ile ters ölçekleme","Hız-gecikme ilişkisi"]'::jsonb, 26, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 27, 'Ölü Bölge (Deadzone)', 'Potansiyometre', 4, 20, 25, '🎯',
 'Pot tam ortadayken (değer 480-540 arası) kol hareket ETMESİN (ölü bölge); orta noktadan uzaklaştıkça kol o yöne gittikçe hızlanarak dönsün. Joystick mantığının temelini kur.',
 'fark = deger - 512; if(abs(fark) > 30){ rotasyon += fark / 200.0; } — fark büyüdükçe adım büyür.',
 '["Ortada hareketsiz bölge","Uzaklaştıkça hızlanma mantığı","Mutlak değer","İşaretli fark hesabı"]'::jsonb, 27, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 6: MESAFE SENSÖRÜ (Hafta 4) ═══
('roboarm', 28, 'Mesafe Oku ve Yazdır', 'Mesafe Sensörü', 2, 12, 15, '📏',
 'HC-SR04 ultrasonik (ses dalgalı) mesafe sensörünü bağla, önündeki cismin mesafesini cm olarak oku ve Serial Monitor''e saniyede 2 kez yazdır. Elini yaklaştırıp uzaklaştırarak değerleri gözle.',
 'mesafe = ultrasonik_oku(); seri_yazdir(mesafe); bekle_ms(500);',
 '["Ultrasonik ses prensibi","Mesafe ölçümü (cm)","Serial Monitor kullanımı","Sensör verisi doğrulama"]'::jsonb, 28, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 29, 'Yaklaşınca Kaç!', 'Mesafe Sensörü', 3, 18, 20, '🙈',
 'Sensörü kolun önüne yerleştir. Bir cisim 10 cm''den fazla yaklaşınca kol geriye çekilsin (omuz yukarı), cisim uzaklaşınca eski pozisyona dönsün.',
 'if(mesafe < 10){ servo(1, 130); } else { servo(1, 90); } — titremesin diye açma ve kapama sınırını farklı yap (böylece titremez): geri dönüş eşiği 15 cm olsun.',
 '["Eşik (sınır değeri) kavramı","Refleks davranış","İki farklı sınır kullanma","Sensör-motor bağlantısı"]'::jsonb, 29, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 30, 'Mesafeyle Eksen Sürme', 'Mesafe Sensörü', 3, 20, 20, '🫲',
 'Elinin sensöre uzaklığı tabanı kontrol etsin: 5 cm = 30°, 30 cm = 150°. Elini havada ileri-geri oynatarak kolu "dokunmadan" yönet — Jedi modu!',
 'aci = map(mesafe, 5,30, 30,150); aci = sinirla(aci, 30,150); servo(0, aci); — ölçüm gürültüsü için son 5 okumanın ortalamasını al.',
 '["Sensör-servo eşleme","Birkaç ölçümün ortalamasını alma","Gürültü kavramı","Temassız arayüz"]'::jsonb, 30, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 31, 'Nesne Var mı? Kavra!', 'Mesafe Sensörü', 4, 25, 30, '🤖',
 'Sensör gripper yakınına baksın. Gripper''ın önüne (7 cm''den yakına) bir küp gelirse kol OTOMATİK kavrasın, 3 saniye tutsun, sonra bıraksın ve tekrar beklesin. İlk otonom davranışın!',
 'while(true){ if(mesafe < 7){ gripper_kapat(); bekle(3); gripper_ac(); bekle(2); } }',
 '["Otonom tetikleme","Algıla-karar ver-davran döngüsü","Bekleme durumları","Otomasyon temeli"]'::jsonb, 31, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 32, 'Radar Tarayıcı', 'Mesafe Sensörü', 4, 30, 30, '📡',
 'Sensörü kolun üstüne monte et. Kol 30°''den 150°''ye tararken her 10 derecede mesafe ölçsün ve "açı: mesafe" olarak Serial''e yazdırsın. En YAKIN nesnenin açısını bulup kolu ona çevirsin.',
 'en_yakin=999; for(a=30;a<=150;a+=10){ servo(0,a); bekle_ms(200); m=mesafe(); if(m<en_yakin){en_yakin=m; hedef=a;} } servo(0,hedef);',
 '["Tarama + kayıt algoritması","Minimum bulma","Hedef kilitleme","Gerçek radar prensibi"]'::jsonb, 32, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 7: BUZZER & SES (Hafta 4-5) ═══
('roboarm', 33, 'Hareket Sesi', 'Buzzer', 1, 10, 10, '🔔',
 'Buzzer bağla. Kol her pozisyon değiştirdiğinde kısa bir "bip" (1000 Hz, 100 ms) çalsın — R2-D2 gibi konuşan robot!',
 'git_pozisyona() fonksiyonunun sonuna ekle: ton_cal(1000, 100);',
 '["Buzzer ve frekans","Geri bildirim sesi","Fonksiyon genişletme"]'::jsonb, 33, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 34, 'Geri Vites Sesi', 'Buzzer', 2, 12, 15, '🚛',
 'Kol geriye (taban 90°''den küçüğe) dönerken kamyon geri vites sesi gibi aralıklı bip çalsın: 800 Hz, 200 ms açık, 200 ms kapalı. İleri dönerken sessiz.',
 'if(hedef_aci < mevcut_aci){ her adımda: ton_cal(800,200); bekle_ms(200); }',
 '["Yön algılama","Koşullu ses","Endüstriyel güvenlik sesleri"]'::jsonb, 34, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 35, 'Mesafe Park Sensörü', 'Buzzer', 3, 18, 20, '🅿️',
 'Araba park sensörü yap: cisim uzaktayken yavaş bip (500 ms aralık), yaklaştıkça aralık kısalsın, 5 cm''den yakında SÜREKLİ ötsün. Mesafe sensörü + buzzer birleşimi.',
 'aralik = map(mesafe, 5,40, 0,500); ton_cal(1200,80); bekle_ms(aralik);',
 '["İki modülü birleştirme","Orantılı geri bildirim","map ile ses aralığı","Gerçek ürün simülasyonu"]'::jsonb, 35, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 36, 'Zafer Melodisi', 'Buzzer', 2, 15, 15, '🎵',
 'Kol bir görevi bitirince (örn. küpü bırakınca) 5 notalık bir zafer melodisi çalsın. Notaları frekans dizisi olarak sakla: [523, 587, 659, 784, 1047].',
 'notalar=[523,587,659,784,1047]; for(n of notalar){ ton_cal(n, 150); bekle_ms(180); }',
 '["Nota-frekans ilişkisi","Dizi ile melodi","Do-Re-Mi frekansları","Başarı geri bildirimi"]'::jsonb, 36, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 8: RGB LED (Hafta 5) ═══
('roboarm', 37, 'Durum Işığı', 'RGB LED', 1, 10, 10, '🚥',
 'RGB LED bağla. Kol hareket halindeyken KIRMIZI, beklerken YEŞİL yansın — fabrikadaki robot kolların güvenlik ışığı gibi.',
 'Hareket fonksiyonunun başında rgb(255,0,0), sonunda rgb(0,255,0).',
 '["RGB pin bağlantısı","Durum göstergesi","Endüstriyel güvenlik standartları"]'::jsonb, 37, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 38, 'Açıya Göre Renk', 'RGB LED', 3, 18, 20, '🌈',
 'Taban açısı LED rengini belirlesin: 0°=tam kırmızı, 90°=tam yeşil, 180°=tam mavi; aradaki açılarda renkler yumuşak geçsin (map ile kanal hesapla).',
 '0-90 arası: k=map(a,0,90,255,0); y=map(a,0,90,0,255); m=0. 90-180 arası: benzer şekilde yeşilden maviye.',
 '["Renk kanalı hesaplama","Çoklu map kullanımı","Doğrusal araları yumuşak doldurma","Görsel veri sunumu"]'::jsonb, 38, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 39, 'Kavrama Işığı', 'RGB LED', 2, 12, 15, '💜',
 'Gripper bir şey tutarken (kapalı, açı < 85°) LED mor yansın; boşken beyaz. Mesafe sensörüyle birleştir: nesne yaklaşırken sarı "hazırlan" ışığı!',
 'if(mesafe<10 && gripper>85) rgb(255,200,0); else if(gripper<85) rgb(160,0,255); else rgb(255,255,255);',
 '["Çoklu koşul (&&)","3 durumlu gösterge","Birden çok sensörü birlikte kullanmana giriş"]'::jsonb, 39, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 9: LDR IŞIK SENSÖRÜ (Hafta 5-6) ═══
('roboarm', 40, 'Işık Değeri Oku', 'LDR', 1, 10, 10, '☀️',
 'LDR''yi analog pine bağla, ışık değerini Serial''e yazdır. El feneriyle üzerine tut ve elinle kapat — değişimi gözle, "karanlık" ve "aydınlık" eşik değerlerini not et.',
 'isik = analog_oku(A2); seri_yazdir(isik); — tipik: karanlık <200, oda ışığı ~500, fener >800.',
 '["LDR çalışma prensibi","Ortam ölçümü","Eşik belirleme deneyi"]'::jsonb, 40, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 41, 'Işığa Dönen Kol (Ayçiçeği)', 'LDR', 4, 25, 30, '🌻',
 'İki LDR''yi kolun soluna ve sağına yerleştir. Kol hangi taraf daha aydınlıksa O TARAFA dönsün — ayçiçeği gibi ışığı takip etsin! El feneriyle kolu yönlendir.',
 'fark = sol_ldr - sag_ldr; if(fark > 50) rotasyon += 1; if(fark < -50) rotasyon -= 1; servo(0, rotasyon);',
 '["Diferansiyel sensör okuma","Işık takip algoritması","Güneş paneli takip sistemleri","Sensöre bakarak sürekli düzeltme"]'::jsonb, 41, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 42, 'Karanlık Modu', 'LDR', 2, 15, 15, '🌙',
 'Ortam kararınca (LDR < eşik) kol otomatik "uyku pozisyonuna" katlansın ve LED kısık maviye dönsün; ışık gelince uyanıp ev pozisyonuna geçsin ve bip çalsın.',
 'if(isik < 200 && uyanik){ katlan(); uyanik=false; } if(isik > 350 && !uyanik){ ev(); ton_cal(880,150); uyanik=true; }',
 '["Durum değişkeni (uyanık/uyku)","İki farklı sınırla kararlı çalışma","Enerji tasarrufu senaryosu"]'::jsonb, 42, true, extract(epoch from now())*1000, extract(epoch from now())*1000);

-- ═══ BÖLÜM 10: OLED EKRAN (Hafta 6) ═══
INSERT INTO bb_tasks (kit, task_id, title, category, difficulty, expected_min, xp, emoji, description, answer, learnings, position, active, created_at, updated_at) VALUES
('roboarm', 43, 'Merhaba OLED', 'OLED Ekran', 2, 15, 15, '🖥️',
 'OLED ekranı I2C ile bağla (SDA/SCL). Ekrana adını ve "RoboArm Hazır!" yazdır.',
 'oled_temizle(); oled_yaz(0,0,"Ali - RoboArm Hazir!"); oled_goster();',
 '["I2C haberleşme","SDA/SCL pinleri","Ekrana metin yazma","Buffer/göster mantığı"]'::jsonb, 43, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 44, 'Canlı Açı Paneli', 'OLED Ekran', 3, 20, 20, '📊',
 'OLED''e 4 eksenin anlık açılarını canlı yazdır: "Taban:90 Omuz:45..." Gamepad''le kolu oynatırken değerler ekranda değişsin — kendi kontrol panelin!',
 'Her döngüde: oled_temizle(); oled_yaz(0,0,"Taban:"+taban); oled_yaz(0,16,"Omuz:"+omuz); ... oled_goster();',
 '["Canlı veri gösterimi","Metin + değişken birleştirme","Satır konumlandırma","Telemetri kavramı"]'::jsonb, 44, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 45, 'Mesafe Göstergesi + Bar', 'OLED Ekran', 3, 20, 20, '📶',
 'Mesafe sensörü değerini OLED''de hem sayı hem de dolan ÇUBUK (bar) olarak göster: cisim yaklaştıkça bar uzasın (dikdörtgen çizimi).',
 'bar = map(mesafe, 40,5, 0,120); oled_dikdortgen_dolu(0, 40, bar, 12);',
 '["Grafik çizim komutları","Veri görselleştirme","map ile piksel ölçekleme"]'::jsonb, 45, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 46, 'Görev Sayacı Ekranı', 'OLED Ekran', 3, 18, 20, '🏆',
 'Kol her başarılı kavrama yaptığında OLED''deki "Skor" 1 artsın ve büyük puntoyla ortada gösterilsin. 10 skora ulaşınca ekranda "ŞAMPİYON!" yazsın + zafer melodisi çalsın.',
 'skor++; oled_yaz_buyuk(40,20,skor); if(skor>=10){ oled_yaz(20,50,"SAMPIYON!"); zafer_melodisi(); }',
 '["Oyunlaştırma","Sayaç + ekran senkronu","Font boyutları","Koşullu kutlama"]'::jsonb, 46, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 11: SICAKLIK & RÖLE (Hafta 6-7) ═══
('roboarm', 47, 'Sıcaklık Oku', 'Sıcaklık & Röle', 2, 12, 15, '🌡️',
 'Sıcaklık sensörünü bağla, oda sıcaklığını °C olarak OLED''e yazdır. Sensörü parmağınla tut — değerin yükselişini izle (dokunma termometresi!).',
 'sicaklik = sicaklik_oku(); oled_yaz(0,0, sicaklik + " C");',
 '["Sıcaklık sensörü tipleri","Analog→Celsius dönüşümü","Vücut ısısı deneyi"]'::jsonb, 47, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 48, 'Röle: Işığı Aç-Kapa', 'Sıcaklık & Röle', 2, 15, 15, '🔌',
 'Röle modülünü bağla ve DİKKATLE (eğitmen gözetiminde, düşük voltaj devreyle) bir LED lambayı röle üzerinden aç-kapa yap. Butonla röleyi kontrol et: bas=açık, bas=kapalı.',
 'if(buton_basildi){ role_durum = !role_durum; role_yaz(role_durum); }',
 '["Röle çalışma prensibi","Düşük akımla yüksek güç anahtarlama","Elektrik güvenliği","Toggle mantığı"]'::jsonb, 48, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 49, 'Akıllı Fan Sistemi', 'Sıcaklık & Röle', 4, 25, 30, '🌬️',
 'Termostat yap: sıcaklık 28°C''yi geçince röle (fana bağlı) açılsın, 25°C''nin altına inince kapansın. Eşikler arası fark neden gerekli? OLED''de sıcaklık + fan durumu görünsün.',
 'if(t > 28) role_ac(); if(t < 25) role_kapat(); — 25-28 arası iki farklı sınır: fan sürekli aç-kapa titremez (klima mantığı).',
 '["Termostat algoritması","İki farklı sınır kullanmayı iyi öğrenme","Gerçek ev otomasyonu","Çoklu modül sistemi"]'::jsonb, 49, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 50, 'Sıcaklık Alarmı + Güvenlik Kolu', 'Sıcaklık & Röle', 4, 25, 30, '🚨',
 'Güvenlik senaryosu: sıcaklık 30°C''yi aşarsa (sensörü elinle ısıt) → LED kırmızı yanıp sönsün, buzzer alarm çalsın, VE kol "acil kapatma butonuna basma" hareketi yapsın (önceden belirlediğin pozisyona uzanıp gripper''la dokunsun).',
 'if(t > 30){ alarm(); git_pozisyona(buton_taban, buton_omuz, buton_dirsek); gripper_kapat(); } — endüstride buna acil müdahale robotu denir.',
 '["Çok modüllü senaryo","Acil durum protokolü","Robotik müdahale kavramı","Sistem entegrasyonu"]'::jsonb, 50, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 12: PARKUR GÖREVLERİ — XOX, SİLİNDİR, DELİKLİ KÜP (Hafta 7) ═══
('roboarm', 51, 'Pick & Place: A''dan B''ye', 'Parkur', 3, 25, 25, '📍',
 'Klasik endüstri görevi: küp A noktasında duruyor. Kodla (gamepad YOK!): kol küpe gitsin, kavrasın, kaldırsın, B noktasına taşısın, bıraksın, ev pozisyonuna dönsün. A ve B pozisyon açılarını dizide sakla.',
 'A=[60,65,120], B=[120,65,120]; git(A); gripper_kapat(); kaldir(); git(B); gripper_ac(); ev();',
 '["Pick & place otomasyonu","Pozisyon programlama","Operasyon sıralaması","Endüstriyel robotik temeli"]'::jsonb, 51, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 52, 'Silindir Parkuru: Halkayı Geçir', 'Parkur', 4, 30, 30, '🎯',
 'Delikli küpü kavra ve silindir parkurunun direğine GEÇİR. Küpün deliği direğe hizalanmalı — bilek açısı kritik! Önce gamepad''le dene, hizayı bulunca açıları koda geçir.',
 'İpucu: küpü direğin TAM üstüne getir (taban+omuz), sonra SADECE omzu yavaşça indir. Deliğin yönü bilek açısıyla ayarlanır.',
 '["Hassas hizalama","Eksen ayrıştırma tekniği","Uzaktan kumandayla sürmedan otomasyona geçiş","Tolerans kavramı"]'::jsonb, 52, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 53, 'Kule Yap: 3 Küp Üst Üste', 'Parkur', 4, 30, 30, '🗼',
 '3 küpü sırayla al ve aynı noktaya ÜST ÜSTE diz. Her katta bırakma yüksekliği (omuz açısı) bir küp boyu artmalı — yükseklik farkını değişkenle hesapla.',
 'for(kat=0; kat<3; kat++){ al(kaynak[kat]); birak_omuz = taban_omuz - kat*8; git_ve_birak(hedef, birak_omuz); }',
 '["Değişken yükseklik hesabı","Döngü + pozisyon aritmetiği","İstifleme (üst üste dizme)","Hassas bırakma"]'::jsonb, 53, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 54, 'Renk Ayrıştırma Simülasyonu', 'Parkur', 3, 25, 25, '🎨',
 '3 küpü sırayla al; her küp için butona basılma SAYISI rengini temsil etsin (1=sol kutu, 2=orta, 3=sağ). Operatör (arkadaşın) butona basar, kol küpü doğru kutuya taşır — insan+robot işbirliği!',
 'kup_al(); secim = buton_sayisi_bekle(); if(secim==1) git(sol); else if(secim==2) git(orta); else git(sag); birak();',
 '["İnsan-robot işbirliği (insanla çalışan robot)","Giriş bekleme + dallanma","Sıralı iş istasyonu","switch/case mantığı"]'::jsonb, 54, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 55, 'X-O-X: İlk Hamle', 'Parkur', 3, 25, 25, '⭕',
 'X-O-X tablasını kolun önüne sabitle. 9 hücrenin (3x3) pozisyon açılarını bul ve 9 elemanlı bir diziye kaydet. Sonra kol bir küpü alıp ORTA hücreye (5. hücre) bıraksın.',
 'hucreler = [[t1,o1],[t2,o2],...,[t9,o9]]; kup_al(); git(hucreler[4]); birak(); — hücre pozisyonlarını gamepad + OLED açı panelinden okuyarak bul!',
 '["Izgara (grid) haritalama","9 nokta kalibrasyonu","Dizi indeksleme","Oyun tahtası koordinatları"]'::jsonb, 55, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 56, 'X-O-X: Sıralı Hamleler', 'Parkur', 4, 30, 30, '❌',
 'Kol 5 küpü sırayla tablanın 1., 5., 9., 3. ve 7. hücrelerine dizsin (çapraz + köşeler deseni). Hamle sırasını dizi olarak sakla; her hamlede buzzer bip + OLED''e hamle numarası.',
 'hamleler=[0,4,8,2,6]; for(h of hamleler){ kup_al(depo); git(hucreler[h]); birak(); bip(); }',
 '["Dizi ile hamle planı","Depodan seri besleme","Çoklu pick&place zinciri","Oyun stratejisi dizilimi"]'::jsonb, 56, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 57, 'X-O-X: İnsana Karşı!', 'Parkur', 5, 40, 40, '🏆',
 'Gerçek maç: sen X küplerini elle koy, ROBOT O küplerini kendi koysun. Robotun hamle seçimi basit strateji izlesin: orta boşsa ortayı al, değilse boş köşelerden ilkini, o da yoksa ilk boş kenarı. Boş hücreleri operatör butonlarla bildirsin.',
 'Strateji fonksiyonu: if(bos[4]) hamle=4; else hamle = ilk_bos([0,2,6,8]) ?? ilk_bos([1,3,5,7]); — tam otonom görüş bir sonraki seviye, şimdilik insan bildirimli.',
 '["Oyun stratejisi algoritması","Öncelik sıralaması","Karar ağacı","Yapay zekaya giriş"]'::jsonb, 57, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 13: İLERİ OTOMASYON (Hafta 8) ═══
('roboarm', 58, 'Otomatik Üretim Bandı', 'Otomasyon', 4, 30, 30, '🏭',
 'Mini fabrika: mesafe sensörü "bant başını" izlesin. Sensöre küp konulduğunda kol otomatik alsın, hedefe taşısın, geri dönüp yeni küp beklesin. 5 küpü arka arkaya işle — sayaç OLED''de.',
 'while(sayac<5){ if(mesafe<7){ bekle_ms(500); al_ve_tasi(); sayac++; oled_guncelle(); } }',
 '["Olay güdümlü otomasyon","Üretim bandı mantığı","Sayaçla iş takibi","Tam otonom döngü"]'::jsonb, 58, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 59, 'Işıkla Komut: Fener Kodu', 'Otomasyon', 4, 25, 30, '🔦',
 'LDR''ye fenerle "komut" gönder: 1 kısa flaş = kolu sola çevir, 2 flaş = sağa, 3 flaş = küp al-bırak makrosu. 2 saniyelik pencerede flaşları say.',
 'flaş sayma: pencere boyunca isik>esik geçişlerini say; switch(sayi){ 1: sola(); 2: saga(); 3: makro(); }',
 '["Işıkla mesaj gönderme","Kaç kez yanıp söndüğünü sayma","Zaman penceresi","Uzaktan komut protokolü"]'::jsonb, 59, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 60, 'Gece Bekçisi Robot', 'Otomasyon', 4, 30, 30, '🌃',
 'Tüm sensörleri birleştir: ortam karanlıksa (LDR) kol radar taraması yapsın (görev 32); 15 cm''den yakın hareket algılarsa alarm çalsın, LED kırmızı flaş yapsın ve kol "davetsiz misafire" dönsün. Aydınlıkta uyusun.',
 'if(karanlik){ tara(); if(en_yakin<15){ alarm(); rgb_flas(); servo(0,hedef_aci); } } else { uyku(); }',
 '["Birden çok sensörü birlikte kullanma","Güvenlik sistemi mimarisi","Koşullu görev zinciri","4 modül entegrasyonu"]'::jsonb, 60, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 61, 'Teach & Repeat: Öğret-Tekrarla', 'Otomasyon', 5, 35, 40, '🧠',
 'Gerçek endüstri özelliği: "öğretme modunda" gamepad''le kolu gezdir; butona her bastığında mevcut 4 eksen açısı diziye kaydedilsin (en fazla 10 nokta). "Oynatma modunda" kol kaydedilen rotayı sırayla, sonsuz döngüde tekrarlasın.',
 'kayit: if(A_basildi){ rota.push([taban,omuz,dirsek,gripper]); } oynat: while(true){ for(p of rota){ git(p); bekle(1); } }',
 '["Robota hareketi elle öğretme","Dinamik dizi (push)","Mod mimarisi (kayıt/oynat)","Gerçek endüstriyel iş akışı"]'::jsonb, 61, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 62, 'Pot ile Kayıt Hızı', 'Otomasyon', 3, 20, 25, '⏩',
 'Görev 61''deki oynatma hızını potansiyometreye bağla: pot sola = ağır çekim (2 sn/nokta), pot sağa = hızlı (0.2 sn/nokta). Operatör üretim hızını canlı ayarlasın.',
 'bekleme = map(analog_oku(A0), 0,1023, 2000,200); ...oynatmada bekle_ms(bekleme);',
 '["Canlı süreç parametresi","İki sistemi birleştirme","Üretim hızı (cycle time) kavramı"]'::jsonb, 62, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 63, 'Hassasiyet Testi: Aynı Noktaya 10 Kez', 'Otomasyon', 3, 20, 25, '🎯',
 'Tekrarlanabilirlik deneyi: kolun ucuna kalem bantla, kağıda 10 kez aynı pozisyona in-kalk yaptır. Oluşan nokta bulutunun çapını ölç — robotunun tekrarlanabilirliği kaç mm? Sonucu rapor et.',
 'repeat(10){ git(hedef); bekle(1); git(yukari); bekle(1); } — noktalar 5mm çembere sığıyorsa süper!',
 '["Hep aynı yere gidebilme","Deneysel ölçüm","Mühendislik raporu","Kalite kontrol kavramı"]'::jsonb, 63, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 64, 'Servo Yumuşatma: Easing', 'Otomasyon', 5, 30, 35, '〰️',
 'Kol hareketleri robotik değil AKICI olsun: doğrusal adım yerine sinüs yumuşatması uygula — başta yavaş, ortada hızlı, sonda yavaş. Aynı hareketi iki yöntemle yap, farkı videoya çek.',
 'for(i=0;i<=100;i++){ t=i/100.0; e=(1-cos(t*PI))/2; aci = baslangic + (hedef-baslangic)*e; servo(0,aci); bekle_ms(10); }',
 '["Yumuşak hızlanma-yavaşlama","Trigonometri uygulaması","İvmelenme profili","Profesyonel hareket kalitesi"]'::jsonb, 64, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══ BÖLÜM 14: FİNAL PROJELERİ (Hafta 8) ═══
('roboarm', 65, 'Final Hazırlık: Sistem Şeması', 'Final Projesi', 3, 30, 25, '📐',
 'Final projen için A4''e sistem şeması çiz: hangi sensörler, hangi pinler, hangi davranışlar? Girdi→İşlem→Çıktı kutuları ve akış diyagramı olsun. Eğitmenine sun, onay al.',
 'Şemada olması gerekenler: pin tablosu, güç dağılımı, akış diyagramı (karar elmasları ile), malzeme listesi.',
 '["Sistem tasarımı","Akış diyagramı","Dokümantasyon","Mühendislik sunumu"]'::jsonb, 65, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 66, 'Final A: Akıllı Depo Robotu', 'Final Projesi', 5, 60, 50, '📦',
 'Tam sistem: 3 küpü depo bölgesinden al, butonla seçilen rafa (3 hedef) taşı. OLED''de stok sayısı, her işlemde bip, hareket halinde kırmızı LED, tamamlanınca zafer melodisi. Teach&repeat ile rotaları kaydet.',
 'Görev 51+54+61+44+36''nın birleşimi. Modül modül test et, sonra birleştir — profesyoneller böyle yapar.',
 '["Uçtan uca sistem entegrasyonu","Depo otomasyonu (AS/RS)","Modüler geliştirme","Proje yönetimi"]'::jsonb, 66, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 67, 'Final B: X-O-X Turnuva Robotu', 'Final Projesi', 5, 60, 50, '🥇',
 'Sınıf turnuvası için X-O-X robotunu tamamla: 9 hücre kalibre, strateji algoritması (görev 57), hamle öncesi OLED''de "düşünüyor..." animasyonu, her hamlede ses, kazanınca zafer dansı + melodi. Turnuvada 2 maç oyna!',
 'Görev 55+56+57+36+44 birleşimi + zafer dansı koreografisi senin tasarımın.',
 '["Oyun yapay zekası","Turnuva baskısı altında sistem","Şovmenlik & sunum","Tam ürün deneyimi"]'::jsonb, 67, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 68, 'Final C: Serbest Proje', 'Final Projesi', 5, 60, 50, '🚀',
 'Kendi fikrin! Şartlar: en az 2 sensör + 1 çıktı modülü (OLED/LED/buzzer/röle) + kol hareketi içermeli, gerçek bir problemi çözmeli. Örnekler: çay servis robotu, kalem uzatan masa asistanı, otomatik atık ayrıştırıcı...',
 'Değerlendirme: yaratıcılık %30, teknik zorluk %30, çalışırlık %25, sunum %15. Görev 65''teki şemayı bu projen için de yap.',
 '["Açık uçlu problem çözme","Yaratıcı mühendislik","Bağımsız proje geliştirme","Ürünleştirme"]'::jsonb, 68, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 69, 'Kod Temizliği & Yorumlama', 'Final Projesi', 3, 25, 25, '🧹',
 'Final projenin kodunu profesyonelleştir: her fonksiyona açıklama yorumu, anlamlı değişken adları (a1 değil taban_acisi), tekrar eden kodları fonksiyona çevir. Eğitmen kodunu "başkası okuyabilir mi?" gözüyle inceleyecek.',
 'İyi kod = 6 ay sonra açtığında anladığın kod. Yorum satırı: neyi değil NEDEN yaptığını anlatır.',
 '["Temiz kod prensipleri","Yorum yazma kültürü","Kodu daha düzenli hale getirme","Kod okunabilirliği"]'::jsonb, 69, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 70, 'Demo Günü Sunumu', 'Final Projesi', 4, 40, 40, '🎤',
 'Projeni sınıfa/velilere 5 dakikada sun: problem neydi, nasıl çözdün, canlı demo, bir aksilik planı (demo çökerse ne yapacaksın?). Sunum akışını kartlara yaz, en az 1 kez prova yap.',
 'Altın kural: demoyu sunumdan ÖNCE 3 kez test et. Yedek plan: çalışan halinin videosunu telefonda hazır tut.',
 '["Teknik sunum becerisi","Canlı demo yönetimi","Risk planlaması","Özgüven"]'::jsonb, 70, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 71, 'Akran Değerlendirmesi', 'Final Projesi', 2, 20, 20, '🤝',
 'İki arkadaşının projesini değerlendirme formuyla incele: 2 güçlü yön + 1 gelişim önerisi yaz (kırıcı değil yapıcı!). Kendi projen için gelen önerilerden en az 1''ini uygula.',
 'Yapıcı geri bildirim kalıbı: "X çok iyi olmuş çünkü... Y''yi şöyle denesen daha da iyi olabilir."',
 '["Yapıcı geri bildirim","Kod/proje inceleme (review)","Eleştiriyi kabullenme","Takım kültürü"]'::jsonb, 71, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 72, 'Mezuniyet: RoboArm Ustası', 'Final Projesi', 5, 30, 50, '🎓',
 'Son görev: eğitmeninin seçtiği SÜRPRİZ bir görevi 20 dakikada, yardım almadan tamamla (örn. "küpü silindire geçir + her adımda farklı LED rengi"). Başarırsan RoboArm Ustası rozetini kazan!',
 'Bu bir sınav değil, kutlama — 71 görevde öğrendiklerin fazlasıyla yeter. Sakin ol, adım adım düşün, önce şema çiz.',
 '["Baskı altında bağımsız çözüm","Tüm becerilerin sentezi","Zaman yönetimi","Mühendis kimliği"]'::jsonb, 72, true, extract(epoch from now())*1000, extract(epoch from now())*1000);

-- ═══ Kontrol sorgusu ═══
-- SELECT category, count(*) FROM bb_tasks WHERE kit='roboarm' GROUP BY category ORDER BY min(task_id);

