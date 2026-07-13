-- ═══════════════════════════════════════════════════════════════
-- RoboArm Görev Müfredatı v3 — 71 görev (Arduino Uno + Sensor Shield)
-- Supabase Dashboard > SQL Editor'da çalıştır.
-- DONANIM: D4 taban · D5 omuz · D6 dirsek · D7 tutucu · D8 buzzer ·
--          D2 buton · D3 röle · D9/D10/D11 RGB (dijital) ·
--          D12 trig · D13 echo · A0 pot · A1 LDR · A2 pot2/LDR2/LM35
-- GÜVENLİK: taban/omuz/dirsek 30-150°, tutucu 40-140° (40 kapalı, 140 açık)
-- Bu dosya 'roboarm' kitine ait ESKİ kayıtları siler ve 71 görevi yükler.
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

DELETE FROM bb_tasks WHERE kit = 'roboarm';

INSERT INTO bb_tasks
(kit, task_id, title, category, difficulty, expected_min, xp, emoji,
 description, answer, learnings, position, active, created_at, updated_at)
VALUES
('roboarm', 1, 'İlk Hareket: Tabanı Döndür', 'Servo Temelleri', 1, 10, 10, '🦾',
 'Taban servosu D4 pinine bağlı. Tabanı önce 30 dereceye getir, 1 saniye bekle. Sonra 60 dereceye getir, 1 saniye bekle. En son 150 dereceye getir. Döngü kullanma — kodun ''Başlangıçta'' bloğunda 1 kez çalışsın. UYARI: 30''un altına ve 150''nin üstüne asla çıkma, kol mekanik sınırına dayanıp zorlanır!',
 'Başlangıçta{ servo(D4,30); bekle(1sn); servo(D4,60); bekle(1sn); servo(D4,150) }. Kod yukarıdan aşağı bir kez çalışır ve durur.',
 '["Servo motor kavramı","Açı (derece) kavramı","D4 pin bağlantısı","Sıralı komut çalıştırma","Güvenli açı aralığı 30-150"]'::jsonb, 1, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 2, 'Tekrarla: 5 Kez Git-Gel', 'Servo Temelleri', 1, 12, 10, '🔁',
 'Tekrar bloğunu öğren! Taban (D4) 30 dereceye gitsin, 1 sn bekle; 150 dereceye gitsin, 1 sn bekle. Bu dört bloğu ''tekrarla 5 kez'' bloğunun İÇİNE koy.',
 'tekrarla 5 kez { servo(D4,30); bekle(1); servo(D4,150); bekle(1) }',
 '["Tekrar (repeat) bloğu","Döngü kavramına giriş","Kod tekrarından kaçınma"]'::jsonb, 2, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 3, 'Yumuşak Hareket: Hız Değişkeni', 'Servo Temelleri', 2, 15, 15, '🎚️',
 'Kol zıplamasın, süzülsün! ''hiz'' değişkeni yap, 100 yaz. ''aci'' için sayaçlı döngüyle 30''dan 150''ye 1''er derece çık; her adımda servo(D4, aci) de ve ''hiz'' milisaniye bekle. Sonra hiz=50 yap ve 150''den 30''a geri dön — kol 2 kat hızlandı mı?',
 'hiz=100; aci 30→150 adım 1 { servo(D4,aci); bekle_ms(hiz) }; hiz=50; aci 150→30 adım -1 { aynısı }',
 '["Değişken tanımlama","Sayaçlı (for) döngü","Kademeli hareket","Milisaniye kavramı"]'::jsonb, 3, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 4, 'Dört Eksen Tanışma', 'Servo Temelleri', 1, 12, 10, '🧭',
 'Robot kolun 4 servosu var: taban D4, omuz D5, dirsek D6, tutucu D7. Sırayla hepsini 90 dereceye getir, aralarda 1 sn bekle. Kol dimdik ''hazır'' duruşta olacak. Tutucu için güvenli aralık 40-140''tır (40=kapalı, 140=açık).',
 'servo(D4,90); bekle(1); servo(D5,90); bekle(1); servo(D6,90); bekle(1); servo(D7,90)',
 '["4 eksen anatomisi","D4-D7 pin haritası","Ev (home) pozisyonu","Tutucu güvenli aralığı 40-140"]'::jsonb, 4, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 5, 'Selam Veren Kol', 'Servo Temelleri', 1, 12, 10, '👋',
 'Kol seni selamlasın! Omzu (D5) 60 dereceye kaldır. Sonra dirseği (D6) 3 kez 60↔120 arasında salla (arada 300 ms). Bitince tüm eksenleri 90''a getir.',
 'servo(D5,60); tekrarla 3 { servo(D6,60); bekle_ms(300); servo(D6,120); bekle_ms(300) }; hepsi 90',
 '["Birden çok ekseni birlikte kullanma","Tekrar + bekleme ritmi","Başlangıç durumuna dönme"]'::jsonb, 5, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 6, 'Gripper: Aç-Kapa', 'Servo Temelleri', 1, 10, 10, '🤏',
 'Tutucu D7''de. 140 = tam açık, 40 = tam kapalı. 3 kez aç-kapa yap, arada 1 sn bekle. 40''ın altına inme — parmaklar birbirine bastırıp motoru yakar!',
 'tekrarla 3 { servo(D7,140); bekle(1); servo(D7,40); bekle(1) }',
 '["Tutucu (gripper) mekaniği","Motor zorlanması ve akım","Güvenli sınır bilinci"]'::jsonb, 6, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 7, 'İlk Kavrama: Küpü Tut', 'Servo Temelleri', 2, 15, 15, '🧊',
 '3 cm''lik köpük küpü kavra! Sıra: tutucuyu aç (140) → omuz 60 + dirsek 120 ile aşağı in → tutucuyu 80''e kapat (küpü ezmeden sık) → omuz 110 + dirsek 90 ile kaldır → 5 sn havada tut → bırak. Neden 40 değil 80? Küp 3 cm — 80 derece tam sarar, 40 ezerdi!',
 'ac(140) → in(D5:60, D6:120) → kavra(80) → kaldır(D5:110, D6:90) → 5 sn → bırak(140) → ev',
 '["Kavrama kuvveti ayarı","Nesne boyutu ↔ tutucu açısı ilişkisi","Hareket sıralaması planlama"]'::jsonb, 7, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 8, 'Hareket Sesi', 'Buzzer', 2, 15, 15, '🔊',
 'Buzzer D8''de. ''git_pozisyona(taban, omuz, dirsek)'' fonksiyonu yaz: üç servoyu parametrelere göre sürsün, 600 ms beklesin, sonunda 1000 Hz''lik 100 ms bip çalsın. Fonksiyonu 3 farklı pozisyonla çağır. Böylece her hareketin bittiğini kulağınla duyarsın!',
 'fonksiyon git_pozisyona(t,o,d){ servo(D4,t); servo(D5,o); servo(D6,d); bekle_ms(600); ton(1000Hz,100ms) }; git(45,70,110); git(135,70,110); git(90,90,90)',
 '["Fonksiyon tanımlama","Parametre kullanımı","Buzzer ton bloğu","Sesli geri bildirim"]'::jsonb, 8, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 9, 'Geri Vites Sesi', 'Buzzer', 2, 15, 15, '🚛',
 'Kamyon gibi! Taban 150''den 30''a 5''er derece GERİ giderken her adımda 800 Hz / 200 ms bip + 200 ms sessizlik olsun (bip...bip...bip). 30''a varınca sessizce 150''ye dön ve sürekli tekrarla. İpucu: ''aci'' değişkenini sürekli döngüde kendin azalt.',
 'sürekli{ eğer aci>30 { aci=aci-5; servo(D4,aci); ton(800,200); bekle_ms(200) } değilse { aci=150; servo(D4,aci); bekle(1) } }',
 '["Sürekli döngü","Koşullu ses üretme","Değişkenle konum takibi"]'::jsonb, 9, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 10, 'Mesafe Park Sensörü', 'Buzzer', 3, 20, 20, '📡',
 'Gerçek park sensörü: HC-SR04 trig D12, echo D13. Mesafe 40 cm''den 5 cm''e yaklaştıkça bipler SIKLAŞSIN. İpucu: bekleme süresini ''eşle'' bloğuyla hesapla — mesafe (5-40) aralığından bekleme (0-500 ms) aralığına. 5 cm altında kesintisiz uzun ton!',
 'sürekli{ m=mesafe(); eğer m<5 { ton(1200,500) } değilse { aralık=eşle(sınırla(m,5,40),5,40,0,500); ton(1200,80); bekle_ms(aralık) } }',
 '["Ultrasonik sensör okuma","eşle (map) bloğu","Orantısal geri bildirim","sınırla (constrain)"]'::jsonb, 10, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 11, 'Zafer Melodisi', 'Buzzer', 1, 12, 10, '🎵',
 '''zafer_melodisi'' fonksiyonu yaz: Do(523)-Mi(659)-Sol(784) 150''şer ms, ardından tiz Do(1047) 300 ms, sonunda buzzer sustur. Tutucu açılınca melodi çalsın. Bu fonksiyonu sonraki görevlerde de kullanacağız!',
 'fonksiyon zafer(){ nota(523,150); nota(659,150); nota(784,150); nota(1047,300); sustur() }; ac(140); zafer()',
 '["Nota blokları","Fonksiyonu yeniden kullanma","Melodi kurgusu"]'::jsonb, 11, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 12, 'Durum Işığı', 'RGB LED', 2, 15, 15, '🚦',
 'RGB modülü D9(R), D10(G), D11(B) pinlerinde — her renk dijital aç/kapa ile yakılır. ''renk_kirmizi'' ve ''renk_yesil'' fonksiyonları yaz (3''er dijital yaz bloğu). git_pozisyona fonksiyonunu güncelle: harekete başlarken KIRMIZI, hareket bitince YEŞİL yansın. Fabrikalardaki gerçek robotlar da böyle yapar!',
 'renk_kirmizi(){ D9=HIGH; D10=LOW; D11=LOW }; renk_yesil(){ D9=LOW; D10=HIGH; D11=LOW }; git_pozisyona içinde: önce kırmızı, hareket+bekleme, sonra yeşil',
 '["RGB LED'in 3 kanalı","Dijital yaz (HIGH/LOW)","Durum gösterimi","Fonksiyonla renk paketi"]'::jsonb, 12, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 13, 'Bölgeye Göre Renk', 'RGB LED', 2, 15, 15, '🌈',
 'Taban süpürme yaparken LED bölgeye göre renk değiştirsin: açı 70''ten küçükse KIRMIZI (sol bölge), 70-110 arası YEŞİL (orta), 110''dan büyükse MAVİ (sağ). ''bolge_rengi(aci)'' fonksiyonu yaz; içinde eğer / değilse-eğer / değilse zinciri kullan. Süpürme 30→150→30 sürekli dönsün.',
 'bolge_rengi(aci){ eğer aci<70 kırmızı; değilse-eğer aci<110 yeşil; değilse mavi }; sürekli{ aci 30→150 { servo(D4,a); bolge_rengi(a); bekle_ms(30) }; geri aynısı }',
 '["eğer / değilse-eğer zinciri","Aralık (bölge) mantığı","Fonksiyona parametre geçme"]'::jsonb, 13, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 14, 'Kavrama Işığı', 'RGB LED', 2, 18, 15, '💡',
 'LED, tutucunun ne yaptığını anlatsın: cisim 10 cm''den yakın VE tutucu açıksa SARI (hazırlanıyor); tutucu kapalıysa (≤85) MOR (kavradı); yoksa BEYAZ (boşta). 7 cm altına gelince otomatik kavra, 2 sn tut, bırak. renk_sari / renk_mor / renk_beyaz fonksiyonlarını yaz (sarı=R+G, mor=R+B, beyaz=R+G+B).',
 'sürekli{ m=mesafe(); eğer m<10 VE gripper>85 sarı; değilse-eğer gripper<=85 mor; değilse beyaz; eğer m<7 { kavra 40; 2sn; bırak 140 } }',
 '["Renk karışımı (R+G=sarı, R+B=mor)","VE (mantık) bloğu","Çoklu koşul durum makinesi"]'::jsonb, 14, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 15, 'İleri-Geri Süpürme', 'Döngü ve Değişken', 1, 12, 10, '🧹',
 'Radar gibi süpür: sayaçlı döngüyle taban 30→150 (adım 1, her adımda 30 ms), sonra 150→30 (adım -1). İkisini ''sürekli tekrarla'' içine koy — kol durmadan tarasın.',
 'sürekli{ a 30→150 adım1 { servo(D4,a); bekle_ms(30) }; a 150→30 adım-1 { aynısı } }',
 '["İki yönlü for döngüsü","Negatif adım","Sürekli döngü ile birleştirme"]'::jsonb, 15, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 16, 'Hızlanan Süpürme', 'Döngü ve Değişken', 2, 15, 15, '⏩',
 'Süpürme her turda hızlansın! ''hiz'' 60''tan başlasın; her tam git-gel turunda 10 azalsın; 10''un altına inince yine 60 olsun. Bekleme süresi küçüldükçe hareket hızlanır — ters orantıyı gözlemle.',
 'hiz=60; sürekli{ ileri+geri süpür(bekle_ms(hiz)); hiz=hiz-10; eğer hiz<10 { hiz=60 } }',
 '["Değişkeni döngüde güncelleme","Ters orantı: bekleme↓ hız↑","Sıfırlama (reset) deseni"]'::jsonb, 16, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 17, 'İç İçe Döngü: Tarama Deseni', 'Döngü ve Değişken', 2, 18, 15, '🔳',
 'Fotokopi makinesi deseni: DIŞ döngü omzu 60→120 arasında 30''ar derece indirsin; İÇ döngü her omuz konumunda tabanı 40↔140 süpürsün (adım 2, 20 ms). 3 satırlık tarama deseni çıkar.',
 'sürekli{ omuz 60→120 adım30 { servo(D5,omuz); taban 40→140 ve 140→40 süpür } }',
 '["İç içe (nested) döngü","2 boyutlu tarama mantığı","Döngü değişkenlerinin bağımsızlığı"]'::jsonb, 17, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 18, 'Fonksiyon Yaz: git_pozisyona()', 'Döngü ve Değişken', 2, 15, 20, '📦',
 'Kütüphaneni kur! ''git_pozisyona(taban, omuz, dirsek)'': üç servoyu sür + 600 ms bekle. 4 farklı pozisyonla sırayla çağır: (45,70,110) → (90,120,60) → (135,70,110) → (90,90,90). Bu fonksiyon bundan sonra tüm görevlerin temeli.',
 'fonksiyon git_pozisyona(t,o,d){ servo(D4,t); servo(D5,o); servo(D6,d); bekle_ms(600) }; 4 çağrı',
 '["Fonksiyon = yeniden kullanılabilir blok","3 parametre","Kod okunabilirliği"]'::jsonb, 18, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 19, 'Rastgele Dans', 'Döngü ve Değişken', 2, 15, 15, '💃',
 'Kol dans etsin! 10 kez: ''t'' için 30-150 arası, ''o'' için 50-130 arası RASTGELE sayı üret; git_pozisyona(t, o, 90) çağır; 500 ms bekle. Her çalıştırışta dans farklı olur. Bitince ev pozisyonu.',
 'tekrarla 10 { t=rastgele(30,150); o=rastgele(50,130); git_pozisyona(t,o,90); bekle_ms(500) }; ev()',
 '["Rastgele sayı bloğu","Değişkeni fonksiyona geçirme","Güvenli aralıkta rastgelelik"]'::jsonb, 19, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 20, 'Pozisyon Hafızası: Rota Tekrarı', 'Döngü ve Değişken', 2, 15, 15, '🗺️',
 '4 duraklı turist otobüsü: (90,90,90) → (40,70,120) → (140,70,120) → (90,120,60), her durakta 1 sn. Rotayı ''tekrarla 3'' ile 3 kez gez. git_pozisyona sayesinde kod kısacık!',
 'tekrarla 3 { git(90,90,90); 1sn; git(40,70,120); 1sn; git(140,70,120); 1sn; git(90,120,60); 1sn }',
 '["Rota (waypoint) kavramı","Fonksiyon + döngü birleşimi","Sıralı görev planı"]'::jsonb, 20, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 21, 'Buton ile Başlat', 'Buton', 2, 15, 15, '🔘',
 'Buton D2''de (kart INPUT_PULLUP kullanır — basılınca algılanır). ''selam_ver'' fonksiyonu yaz (görev 5''teki sallama). Sürekli döngüde butonu dinle: basılınca selam versin. Robot artık SENİ dinliyor!',
 'sürekli{ eğer buton_basili(D2) { selam_ver(); bekle_ms(300) }; bekle_ms(50) }',
 '["Buton okuma","Olay bekleme (polling) döngüsü","Girdi → tepki modeli"]'::jsonb, 21, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 22, 'Sayaçlı Buton', 'Buton', 2, 18, 15, '🔢',
 'Tek buton, çok iş! ''sayac'' değişkeni tut. Her basışta 1 artır: 1→taban 45, 2→taban 90, 3→taban 135, 4→ev pozisyonu ve sayaç sıfırla. Zıplama önleme: basış algılanınca 50 ms bekle, buton BIRAKILANA KADAR küçük beklemeli döngüde kal.',
 'eğer buton { 50ms bekle; bırakılana kadar bekle; sayac+1; eğer sayac==1 →45; ==2 →90; ==3 →135; değilse → ev + sayac=0; bip }',
 '["Debounce (zıplama önleme)","Durum sayacı","Çoklu koşul dallanması"]'::jsonb, 22, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 23, 'Basılı Tutma vs Tek Basış', 'Buton', 3, 20, 20, '⏱️',
 'Telefon gibi: KISA basış tutucuyu aç/kapa yapsın, 2 saniyeden UZUN basış her şeyi eve döndürsün. İpucu: basış anında kronometre değerini kaydet; bırakınca şimdiki değerden çıkar = basılı kalma süresi. 2000 ms''den büyükse uzun basıştır.',
 'eğer buton { baslangic=kronometre(); bırakılana kadar bekle; sure=kronometre()-baslangic; eğer sure>2000 ev+ton(400) değilse tutucu aç/kapa+ton(1200) }',
 '["millis/kronometre kavramı","Süre ölçme","Tek girdiden iki komut"]'::jsonb, 23, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 24, 'Potla Taban Kontrolü', 'Potansiyometre', 2, 15, 15, '🎛️',
 'Pot A0''da, 0-100 arası değer verir. Sürekli oku; ''eşle'' ile 0-100''ü 30-150 dereceye çevir; tabanı sür (30 ms aralıkla). Pot çevirdikçe kol seni takip etsin — ilk analog kumandan!',
 'sürekli{ deger=pot(A0); aci=eşle(deger,0,100,30,150); servo(D4,aci); bekle_ms(30) }',
 '["Analog girdi kavramı","0-100 → 30-150 eşleme","Gerçek zamanlı kontrol"]'::jsonb, 24, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 25, 'Çift Pot: Kukla Modu', 'Potansiyometre', 2, 18, 15, '🎮',
 'İki potla kukla oynat: A0 potu tabanı (30-150), A2''deki ikinci pot omzu (50-130) sürsün. İki ekseni AYNI ANDA kontrol et — bir eli çevirip diğerini sabit tutmak beyin jimnastiği!',
 'sürekli{ servo(D4, eşle(pot(A0),0,100,30,150)); servo(D5, eşle(pot(A2),0,100,50,130)); bekle_ms(30) }',
 '["Çoklu analog girdi","Paralel eksen kontrolü","Omuz için dar güvenli aralık"]'::jsonb, 25, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 26, 'Pot ile Hız Ayarı', 'Potansiyometre', 2, 15, 15, '🚀',
 'Bu kez pot POZİSYONU değil HIZI ayarlasın! Kol kendi kendine 30↔150 süpürürken her adımda potu oku ve bekleme süresini eşle(pot, 0,100, 10,100) ms yap. Pot bir ucdayken kaplumbağa, öbür uçta tavşan!',
 'süpürme döngüsünün İÇİNDE: hiz=eşle(pot(A0),0,100,10,100); servo(D4,a); bekle_ms(hiz)',
 '["Aynı girdinin farklı anlamı","Döngü içinde canlı parametre","Hız-bekleme ilişkisi"]'::jsonb, 26, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 27, 'Ölü Bölge (Deadzone)', 'Potansiyometre', 3, 20, 20, '🎯',
 'Gerçek joystick tekniği! Pot ortadayken (değer 45-55 arası) kol KIPIRDAMASIN. Orta noktadan fark = pot-50; farkın MUTLAK değeri 5''ten büyükse rotasyonu fark/20 kadar değiştir, ''sınırla'' ile 30-150''de tut. Titremesiz, oransal sürüş.',
 'fark=pot()-50; eğer |fark|>5 { rotasyon += fark/20; rotasyon=sınırla(rotasyon,30,150); servo(D4,rotasyon) }',
 '["Ölü bölge kavramı","Mutlak değer","Oransal (P) kontrolün temeli"]'::jsonb, 27, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 28, 'Mesafe Oku ve Yazdır', 'Mesafe Sensörü', 1, 10, 10, '📏',
 'HC-SR04: trig D12, echo D13. Yarım saniyede bir mesafeyi cm olarak Seri Monitör''e yazdır (''yazdır'' bloğu + metin birleştir). Elini yaklaştırıp uzaklaştır, sayıları izle. 999 görürsen menzil dışı demektir.',
 'sürekli{ m=mesafe(D12,D13); yazdır(birleştir(''Mesafe (cm): '', m)); bekle_ms(500) }',
 '["Ultrasonik çalışma prensibi","Seri Monitör'e yazdırma","Metin birleştirme"]'::jsonb, 28, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 29, 'Yaklaşınca Kaç!', 'Mesafe Sensörü', 2, 15, 15, '😱',
 'Utangaç robot: 10 cm''den yakına gelince omuz 130''a KAÇSIN + kısa bip; 15 cm''den uzaklaşınca 90''a dönsün. Neden kaçış 10 da dönüş 15? Bu boşluğa HİSTEREZİS denir — sınırda titremeyi önler. ''kacti'' isimli doğru/yanlış değişkeni kullan.',
 'eğer m<10 VE kacti==yanlış { omuz 130; kacti=doğru }; eğer m>15 VE kacti==doğru { omuz 90; kacti=yanlış }',
 '["Histerezis","Boolean (doğru/yanlış) değişken","Durum değişimi"]'::jsonb, 29, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 30, 'Mesafeyle Eksen Sürme (Jedi Modu)', 'Mesafe Sensörü', 3, 20, 20, '🧙',
 'Eline değmeden kolu yönet! 5 ölçümün ORTALAMASINI al (gürültü azaltma), ''sınırla'' ile 5-30 cm''e kırp, ''eşle'' ile 30-150 dereceye çevir, tabanı sür. Elin yaklaştıkça kol bir yöne, uzaklaştıkça öbür yöne süzülür.',
 'toplam=0; tekrarla 5 { toplam+=mesafe(); 20ms }; ort=toplam/5; aci=eşle(sınırla(ort,5,30),5,30,30,150); servo(D4,aci)',
 '["Gürültü ve ortalama alma","Ölçüm filtreleme","Sensör → aktüatör zinciri"]'::jsonb, 30, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 31, 'Nesne Var mı? Kavra!', 'Mesafe Sensörü', 2, 15, 15, '🫳',
 'Otomatik el: tutucu açık beklesin; cisim 7 cm''den yakına gelince bip + kavra (40) + 3 sn tut + bırak (140) + 2 sn dinlen. Eline köpük küpü al, sensörün önüne uzat — robot kapsın!',
 'sürekli{ eğer mesafe()<7 { ton(1200,100); kavra(40); 3sn; bırak(140); 2sn } }',
 '["Sensörle tetiklenen eylem","Bekleme sürelerinin rolü","Otomatik kavrama"]'::jsonb, 31, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 32, 'Radar Tarayıcı', 'Mesafe Sensörü', 3, 25, 25, '🛰️',
 'Gerçek radar! Taban 30→150 arasında 10''ar derece dursun; her duruşta mesafeyi ölç, ''açı : mesafe'' olarak yazdır; EN KÜÇÜK mesafeyi ve açısını değişkenlerde tut. Tarama bitince en yakın hedefe dön + zafer sesi. En yakını bulma = minimum arama algoritması!',
 'en_yakin=999; a 30→150 adım10 { servo(D4,a); 200ms; m=mesafe(); yazdır(a,m); eğer m<en_yakin { en_yakin=m; hedef=a } }; servo(D4,hedef)',
 '["Minimum bulma algoritması","Tara-ölç-karşılaştır deseni","999 = geçersiz ölçüm"]'::jsonb, 32, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 33, 'Gamepad: Tek Eksen Sürüşü', 'Gamepad', 2, 15, 20, '🕹️',
 'Gamepad USB kablosuyla RoboExx''e bağlanır; kod yüklendikten sonra tarayıcı tuşları karta canlı gönderir. Sol çubuk SOLA basılıyken rotasyonu 0.7 azalt (30''dan aşağı inme), SAĞA basılıyken 0.7 artır (150''yi aşma); tabanı sür; 20 ms bekle. Küçük adım + kısa bekleme = pürüzsüz sürüş.',
 'sürekli{ eğer sol_çubuk_sol VE rotasyon>30 { rotasyon-=0.7 }; eğer sol_çubuk_sağ VE rotasyon<150 { rotasyon+=0.7 }; servo(D4,rotasyon); 20ms }',
 '["Gamepad canlı bağlantı (USB seri)","Sınır korumalı artırma","Adım boyu ↔ akıcılık"]'::jsonb, 33, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 34, 'Gamepad: 4 Eksen Tam Kontrol', 'Gamepad', 3, 25, 30, '🎮',
 'Vinç operatörü ol! Sol çubuk sol/sağ=taban, yukarı/aşağı=omuz; sağ çubuk yukarı/aşağı=dirsek; LB/RB=tutucu (40-140 sınırlı). Her eksen için görev 33''teki üçlüyü kur: kontrol et → sınırla → sür. ''adim'' değişkeni 0.7 olsun.',
 '4 eksen × { eğer tuş VE sınır uygun { değişken ±= adim }; servo(pin, değişken) }; 20ms',
 '["Çok eksenli eş zamanlı kontrol","Kod deseni kopyalama-uyarlama","Eksen-tuş eşlemesi"]'::jsonb, 34, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 35, 'Turbo Modu', 'Gamepad', 2, 15, 15, '⚡',
 'A tuşu basılıyken ''adim'' 2.1 olsun (turbo), bırakınca 0.7''ye dönsün (hassas). Tek değişkenle tüm robotun karakteri değişir — parametrenin gücü!',
 'sürekli döngünün başında: eğer A_basılı { adim=2.1 } değilse { adim=0.7 }; sonra 4 eksen sürüşü',
 '["Modlu kontrol","Tek parametrenin etkisi","Hassasiyet-hız dengesi"]'::jsonb, 35, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 36, 'Ev Pozisyonu Tuşu', 'Gamepad', 2, 15, 15, '🏠',
 'START tuşuna ''yeni basıldığında'' (basılı tutma değil!) tüm eksen değişkenlerini 90''a çek, servoları eve döndür, 880 Hz onay sesi çal. ''basılı'' ile ''yeni basıldı'' bloklarının farkını keşfet.',
 'eğer START_yeni_basıldı { taban=omuz=dirsek=gripper=90; hepsini sür; ton(880,150) }',
 '["Kenar algılama (yeni basış)","Acil sıfırlama deseni","Değişken-servo senkronu"]'::jsonb, 36, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 37, 'Gamepad ile Küp Taşıma Yarışı', 'Gamepad', 3, 25, 30, '🏁',
 'Yarış günü! Küpü A''dan B''ye gamepad''le taşı. Y tuşu turu bitirsin: geçen süreyi kronometreyle ölç (saniyeye çevir), Seri Monitör''e yazdır, 1500 Hz kutlama, kronometreyi sıfırla. A=turbo da açık. En hızlı süre kimde?',
 'başta baslangic=kronometre(); eğer Y_yeni { sure=(kronometre()-baslangic)/1000; yazdır(''Sure:'',sure); ton(1500,300); baslangic=kronometre() }',
 '["Süre ölçüp raporlama","Yarış döngüsü","İnsan-makine performansı"]'::jsonb, 37, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 38, 'Makro Kaydı: Tuşla Oynat', 'Gamepad', 3, 25, 30, '🎬',
 'X tuşu = otomatik makro: al-taşı-bırak dizisini fonksiyon olarak yaz (git 40/70/120 → kavra → 140''a taşı → bırak → eve dön → bip). X''e yeni basılınca makro çalışsın, bitince eksen değişkenleri 90''a eşitlensin ki elle sürüş kaldığı yerden şaşmadan devam etsin.',
 'fonksiyon makro(){ ...sabit dizi... }; eğer X_yeni { makro(); değişkenleri 90 yap }; sonra normal 4 eksen sürüşü',
 '["Makro kavramı","Otomatik + manuel karışımı","Değişken-gerçeklik senkronu"]'::jsonb, 38, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 39, 'Işık Değeri Oku', 'Işık Sensörü', 1, 10, 10, '🔦',
 'LDR A1''de, 0-100 arası değer verir (0=zifiri karanlık, 100=çok parlak). Yarım saniyede bir Seri Monitör''e yazdır. Elinle kapat, fenerle aydınlat — sınıfın normal değeri kaç?',
 'sürekli{ isik=ldr(A1); yazdır(''Isik (0-100): '', isik); bekle_ms(500) }',
 '["LDR çalışma prensibi","Ortam ölçümü ve kalibrasyon","Değer aralığı keşfi"]'::jsonb, 39, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 40, 'Işığa Dönen Kol (Ayçiçeği)', 'Işık Sensörü', 3, 25, 25, '🌻',
 'İki LDR: sol A1, sağ A2. Fark = sol - sağ. Fark +5''ten büyükse rotasyonu 1 artır, -5''ten küçükse 1 azalt (arası ölü bölge), 30-150''de sınırla, tabanı sür. Fenerle kolu peşinden koştur — bitkilerin fototropizması!',
 'fark=ldr(A1)-ldr(A2); eğer fark>5 { rot+=1 } değilse-eğer fark<-5 { rot-=1 }; rot=sınırla(rot,30,150); servo(D4,rot)',
 '["Diferansiyel (fark) sensör","Işık takip algoritması","Doğadan ilham: fototropizm"]'::jsonb, 40, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 41, 'Karanlık Modu', 'Işık Sensörü', 2, 18, 15, '🌙',
 'Işık 20''nin altına düşünce kol UYKU pozisyonuna katlansın (omuz 140, dirsek 40, tutucu kapalı) + MAVİ ışık; 35''in üstüne çıkınca uyanıp eve dönsün + BEYAZ ışık + 880 Hz nota. 20/35 histerezisi titremeyi önler. ''uyanik'' boolean''ı ile durumu takip et.',
 'eğer isik<20 VE uyanik { katlan; mavi; uyanik=yanlış }; eğer isik>35 VE uyanik==yanlış { ev; beyaz; nota(880); uyanik=doğru }',
 '["Histerezisli eşik","Uyku/uyanma durum makinesi","Enerji tasarrufu senaryosu"]'::jsonb, 41, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 42, 'Merhaba Seri Monitör', 'Seri Monitör', 1, 10, 10, '🖥️',
 'Robotun günlüğü Seri Monitör''dür! Başlangıçta adını ve ''RoboArm Hazir!'' yazdır. Sürekli döngüde ''sayac'' değişkenini 1 artırıp ''Calisiyor... N'' satırını saniyede bir bas. RoboExx''te konsol panelini aç ve akışı izle.',
 'yazdır(''Ali''); yazdır(''RoboArm Hazir!''); sürekli{ sayac+=1; yazdır(''Calisiyor... '', sayac); 1sn }',
 '["Seri Monitör kavramı","Program günlüğü (log)","Sayaçla canlılık kontrolü"]'::jsonb, 42, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 43, 'Canlı Açı Paneli', 'Seri Monitör', 3, 20, 25, '📊',
 'Gamepad''le 4 ekseni sürerken tüm açıları TEK satırda canlı yayınla: ''Taban:90 Omuz:90 Dirsek:90 Tutucu:90''. Her turda yazdırırsan ekran sele döner — ''tur'' sayacı kur, 10 turda bir (≈200 ms) yazdır. Buna ''kısma'' (throttling) denir.',
 'sürekli{ 4 eksen sürüşü; tur+=1; eğer tur>=10 { tur=0; yazdır(birleştir(''Taban:'',taban,'' Omuz:'',omuz,...)) }; 20ms }',
 '["Telemetri kavramı","Yazdırma kısma (throttle)","Çok parçalı metin birleştirme"]'::jsonb, 43, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 44, 'Mesafe Göstergesi + Bar', 'Seri Monitör', 2, 18, 15, '📶',
 'Görsel park sensörü: mesafeyi ölç, 40→5 cm aralığını 0→15 ''blok''a eşle. Boş metinden başla; sayaçlı döngüyle i=1..15 dolaş, i<=blok ise metne ''#'' ekle. ''12 cm |#########'' gibi bas. Yaklaştıkça bar uzar!',
 'bar=eşle(sınırla(m,5,40),40,5,0,15); cubuk=''''; i 1→15 { eğer i<=bar { cubuk=birleştir(cubuk,''#'') } }; yazdır(m,'' cm |'',cubuk)',
 '["Metin biriktirme","Ters yönlü eşleme (40→0, 5→15)","ASCII grafik"]'::jsonb, 44, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 45, 'Görev Sayacı', 'Seri Monitör', 2, 18, 20, '🏆',
 'Skor tablosu: cisim 7 cm''e gelince kavra + skoru 1 artır + ''Skor: N'' yazdır + kısa bip + bırak. Skor 10 olunca ''SAMPIYON!'' bas + zafer_melodisi + sıfırla. Görev 11''deki fonksiyonunu geri çağır!',
 'eğer m<7 { kavra; skor+=1; yazdır(''Skor:'',skor); eğer skor>=10 { yazdır(''SAMPIYON!''); zafer(); skor=0 } değilse bip; bırak }',
 '["Skor durumu tutma","Eşik başarımı","Eski fonksiyonu yeniden kullanma"]'::jsonb, 45, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 46, 'Sıcaklık Oku (LM35)', 'Sıcaklık ve Röle', 2, 15, 15, '🌡️',
 'LM35 sıcaklık sensörü A2''de. ''analog oku'' ham değer verir; santigrata çevir: sicaklik = ham × 500 / 1024. Yarım saniyede bir yazdır. Sensörü PARMAĞINLA tut — vücut ısın sayıyı kaç derece yükseltiyor?',
 'sürekli{ sicaklik = analog_oku(A2)*500/1024; yazdır(''Sicaklik: '', sicaklik, '' C''); 500ms }',
 '["LM35 ve analog→derece çevrimi","Formülü bloklarla kurma","Deneyle doğrulama"]'::jsonb, 46, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 47, 'Röle: Işığı Aç-Kapa', 'Sıcaklık ve Röle', 2, 15, 15, '💡',
 'Röle D3''te — küçük akımla büyük cihaz anahtarlar (öğretmen bağlantısı yapar, sen sadece D3''ü sürersin!). Buton her basışta röleyi TERSİNE çevirsin; ''role_durum'' boolean''ında tut, durumu yazdır, onay bip''i çal. Debounce''u unutma.',
 'eğer buton { debounce; eğer role_durum { röle KAPAT; role_durum=yanlış } değilse { röle AÇ; role_durum=doğru }; yazdır; bip }',
 '["Röle güvenlik kavramı","Toggle (tersine çevirme) deseni","Durum + gösterge birlikte"]'::jsonb, 47, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 48, 'Akıllı Fan Sistemi', 'Sıcaklık ve Röle', 2, 18, 20, '🌀',
 'Termostat yap: LM35 28°C''yi aşınca röledeki fanı AÇ + ''FAN ACILDI''; 25°C altına inince KAPAT + ''FAN KAPANDI''. 28/25 histerezisi olmadan fan sınırda tıkır tıkır açılıp kapanırdı! Her turda sıcaklığı da yazdır.',
 'eğer t>28 VE fan==yanlış { röle AÇ; fan=doğru }; eğer t<25 VE fan { röle KAPAT; fan=yanlış }; yazdır(t)',
 '["Termostat mantığı","Histerezis (28/25)","Gerçek ev otomasyonu"]'::jsonb, 48, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 49, 'Sıcaklık Alarmı + Güvenlik Kolu', 'Sıcaklık ve Röle', 3, 25, 30, '🚨',
 'Güvenlik senaryosu: sıcaklık 30°C''yi aşarsa → ''ALARM'' yazdır + 3 kez (kırmızı ışık + 2000 Hz) flaş + kol önceden belirlenmiş acil butona uzansın (taban 120, omuz 65, dirsek 115) + kavra + röleyi KAPAT + eve dön. Normalde yeşil ışık + sıcaklığı yazdır. Robotlar tehlikede insan yerine müdahale eder!',
 'eğer t>30 { alarm yazdır; 3× kırmızı+2000Hz; git(120,65,115); kavra; röle KAPAT; ev; 3sn } değilse { yeşil; yazdır(t) }',
 '["Alarm eşiği","Çok adımlı acil senaryo","Aktüatör+sensör+ışık+ses entegrasyonu"]'::jsonb, 49, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 50, 'Pick & Place: A''dan B''ye', 'Parkur Görevleri', 3, 25, 30, '📦',
 'Endüstrinin temel görevi! kavra() ve birak() fonksiyonlarını yaz (500 ms''li). Akış: aç → A üstüne git(60,65,120) → kavra → kaldır(60,110,90) → B üstüne taşı(120,110,90) → indir(120,65,120) → bırak → kalk → ev. Küp A noktasından B noktasına ışınlansın!',
 'ac; git(60,65,120); kavra; git(60,110,90); git(120,110,90); git(120,65,120); birak; git(120,110,90); ev',
 '["Pick&place endüstri deseni","Kaldır-taşı-indir sırası","Fonksiyon kütüphanesi kurma"]'::jsonb, 50, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 51, 'Silindir Parkuru: Halkayı Geçir', 'Parkur Görevleri', 3, 30, 35, '🎯',
 'Hassasiyet sınavı: ortası delik köpük küpü dikey direğe geçir. Kritik sır: direğin TAM üstüne git(110,115,85), 1 sn dur, sonra SADECE OMUZ 115→70''e sayaçlı döngüyle 1''er derece insin (40 ms) — taban ve dirsek kıpırdamazsa hiza bozulmaz! Bırak, yine sadece omuzla yüksel.',
 'git(110,115,85); 1sn; omuz 115→70 adım-1 { servo(D5,o); 40ms }; birak; omuz 70→115 geri; bip',
 '["Tek eksen hassas iniş","Hiza koruma stratejisi","Yavaşlık = isabet"]'::jsonb, 51, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 52, 'Kule Yap: 3 Küp Üst Üste', 'Parkur Görevleri', 3, 30, 35, '🗼',
 'Mühendislik: 3 küpü üst üste diz. Her kat ÖNCEKİNDEN YÜKSEĞE bırakılır! ''kat'' 0''dan başlasın; bırakma omuz açısı = 70 + kat×8. Döngüyle 3 kez: kaynaktan al(55,65,120) → kule üstüne taşı → hesaplanan omuzla in → bırak → kat+1 → bip. Formül sayesinde kule kendi kendine yükselir.',
 'kat=0; tekrarla 3 { git(55,65,120); kavra; git(55,115,85); birak_omuz=70+kat*8; git(125,birak_omuz,115); birak; git(125,115,85); kat+=1 }',
 '["Değişkenle yükseklik hesabı","Formül: 70 + kat×8","İstifleme (stacking) mantığı"]'::jsonb, 52, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 53, 'Renk Ayrıştırma Simülasyonu', 'Parkur Görevleri', 3, 30, 35, '🎨',
 'Ayrıştırma bandı: küpü ortadan al(90,65,120), kaldır. 2 saniyelik seçim penceresi aç: butona 1 kez=SOL kutu(40°), 2 kez=ORTA(90°), 3 kez=SAĞ(140°). Pencereyi kronometreyle kur: başlangıcı kaydet, fark<2000 olduğu sürece basışları say (her basışta bip + bırakılmasını bekle). Seçilen kutuya taşı-bırak, başa dön.',
 'al; baslangic=kronometre(); (kronometre()-baslangic)<2000 iken { eğer buton { secim+=1; bip; bırakılana kadar bekle } }; hedef=40/90/140; git(hedef,70,115); birak',
 '["Zaman penceresi tekniği","Basış sayma","İnsan girdisiyle yönlendirme"]'::jsonb, 53, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 54, 'X-O-X: İlk Hamle', 'Parkur Görevleri', 3, 30, 35, '⭕',
 '3×3 tahta, hücreler 0-8. Formül sihri: sutun = hücre mod 3, satir = hücre ÷ 3 (aşağı yuvarla). Taban = 50 + sutun×40; omuz = 60 + satir×15. ''git_hucre(h)'' fonksiyonunu bu formüllerle yaz; kup_al() ve hucreye_birak() ekle. ORTA hücreye (4) ilk hamleyi yap. 9 pozisyonu tek tek yazmak yerine 2 formül — algoritmanın gücü!',
 'git_hucre(h){ sutun=h mod 3; satir=aşağı_yuvarla(h/3); t=50+sutun*40; o=60+satir*15; servo''ları sür }; kup_al(); git_hucre(4); hucreye_birak()',
 '["Mod ve tam bölme","2B ızgara formülü","Koordinat hesaplama"]'::jsonb, 54, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 55, 'X-O-X: Sıralı Hamleler', 'Parkur Görevleri', 3, 30, 35, '🔀',
 'Hamle listesi uygula: 0, 4, 8, 2, 6 sırasıyla (çapraz + köşeler) 5 hamle. Döngü sayacına göre eğer-zinciriyle hedef hücreyi seç; her hamlede al → git_hucre → bırak → hamle numarasını yazdır → bip. Kol tahtada desen çizsin!',
 'i 0→4 { h = (i==0→0, i==1→4, i==2→8, i==3→2, değilse 6); kup_al(); git_hucre(h); hucreye_birak(); yazdır(''Hamle'',i+1,''→'',h) }',
 '["Hamle dizisi uygulama","Sayaç→değer eşleme","Fonksiyonların orkestrasyonu"]'::jsonb, 55, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 56, 'X-O-X: İnsana Karşı!', 'Parkur Görevleri', 3, 35, 40, '🤖',
 'Maç günü! Sen hamleni yap, SIRASI GELİNCE butona bas. Robot ''Dusunuyor...'' yazsın, 800 ms beklesin, stratejiyle oynasın: ÖNCE orta (4), doluysa köşeler (0,2,6,8), sonra kenarlar (1,3,5,7). ''dolu_orta'' boolean''ı + köşe/kenar sayaçlarıyla sırayı takip et. Robot her hamlesini yazdırsın.',
 'eğer buton { yazdır(''Dusunuyor''); eğer !dolu_orta { hamle=4 } değilse-eğer kose<4 { köşe listesinden } değilse { kenar listesinden }; al; git_hucre(hamle); bırak }',
 '["Öncelik stratejisi (orta>köşe>kenar)","Oyun durumu takibi","Sıra tabanlı etkileşim"]'::jsonb, 56, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 57, 'Otomatik Üretim Bandı', 'Otomasyon', 3, 30, 40, '🏭',
 'Fabrika simülasyonu: cisim algılama noktasına küp gelince (mesafe<7) yarım saniye bekle (otursun), al(60,65,120), işlem noktasına taşı(130,...), bırak, ''Islenen kup: N / 5'' yazdır. ''iken'' döngüsüyle sayaç 5 olana kadar sür; bitince ''BITTI!'' + uzun nota. Sen küp koy, robot çalışsın!',
 'sayac<5 iken { eğer mesafe()<7 { 500ms; al; taşı; bırak; sayac+=1; yazdır } }; yazdır(''BITTI''); nota(1047,400)',
 '["Koşullu iken (while) döngüsü","Sensör tetiklemeli üretim","İş sayma ve raporlama"]'::jsonb, 57, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 58, 'Işıkla Komut: Fener Kodu', 'Otomasyon', 3, 30, 40, '🔦',
 'Deniz feneri kodu! 2 saniyelik pencerede fener FLAŞLARINI say: LDR>60 aydınlık sayılır; karanlık→aydınlık GEÇİŞİ = 1 flaş (''onceki'' boolean''ıyla kenar yakala). 1 flaş=SOLA dön, 2=SAĞA dön, 3=al-bırak yap. Komutu yazdır. Işıkla uzaktan kumanda!',
 'pencere 2sn: aydinlik=(ldr()>60); eğer aydinlik VE !onceki { flas+=1; bip }; onceki=aydinlik; sonra: 1→sol, 2→sağ, 3→al-bırak',
 '["Kenar algılama (geçiş sayma)","Zaman pencereli sayım","Işıkla haberleşme"]'::jsonb, 58, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 59, 'Gece Bekçisi Robot', 'Otomasyon', 3, 30, 40, '🌃',
 'Karanlıkta devriye: ışık<20 ise radar taraması yap (görev 32 deseni, 10''ar derece), en yakını bul; 15 cm''den yakın ''davetsiz misafir'' varsa açısını yazdır, o yöne dön, 5 kez kırmızı flaş + 2000 Hz siren! Aydınlıkta mavi ışıkla evinde uyu.',
 'eğer isik<20 { radar tara; eğer en_yakin<15 { yazdır(hedef); dön; 5× kırmızı+siren } } değilse { mavi; ev; 1sn }',
 '["Görevleri birleştirme (LDR+radar+alarm)","Devriye senaryosu","Koşullu görev seçimi"]'::jsonb, 59, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 60, 'Teach & Repeat: Öğret-Tekrarla', 'Otomasyon', 3, 35, 50, '🧑‍🏫',
 'Gerçek endüstriyel robot tekniği! KAYIT modunda gamepad''le sür; A tuşuna her yeni basışta o anki 4 açıyı sıradaki nokta değişkenlerine kaydet (t1..t4, o1..o4, d1..d4, g1..g4 — en çok 4 nokta), ''Kayit edilen nokta: N/4'' yazdır. START''a basınca OYNAT moduna geç: noktaları 1''er sn arayla sonsuz tekrarla. B tuşu kayda geri döndürsün.',
 'kayıt: 4 eksen sürüşü + eğer A_yeni { n+=1; tN/oN/dN/gN = açılar; yazdır }; eğer START { mod=oynat }; oynat: 4 noktayı sırayla sür; eğer B { mod=kayıt; n=0 }',
 '["Teach&repeat endüstri standardı","Nokta belleği (değişken setleri)","Mod makinesi (kayıt/oynat)"]'::jsonb, 60, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 61, 'Pot ile Oynatma Hızı', 'Otomasyon', 2, 20, 25, '🎚️',
 '3 duraklı rotayı (t1..t3/o1..o3/d1..d3 değişkenlerinde) sonsuz oynat; her durakta bekleme süresini POT belirlesin: eşle(pot, 0,100, 2000,200) ms. Tur numarası ve süreyi yazdır. Pot = üretim bandının hız kolu!',
 'sürekli{ bekleme=eşle(pot(),0,100,2000,200); yazdır(tur,bekleme); 3 durağı sırayla sür, her birinde bekle_ms(bekleme) }',
 '["Canlı hız parametresi","Rota + analog girdi birleşimi","Ters eşleme (pot↑ süre↓)"]'::jsonb, 61, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 62, 'Hassasiyet Testi: Aynı Noktaya 10 Kez', 'Otomasyon', 2, 20, 25, '🔬',
 'Bilim deneyi! Tutucuya kalem banda sabitle, altına kağıt koy. 10 kez: yaz pozisyonuna in(90,60,125) → 1 sn → kalk(90,110,90) → 1 sn → bip. Kağıtta 10 nokta oluşur; nokta bulutunun çapını CETVELLE ölç ve yazdırılan mesajla raporla. Buna TEKRARLANABİLİRLİK denir — robotların karnesi!',
 'tekrarla 10 { git(90,60,125); 1sn; git(90,110,90); 1sn; bip }; yazdır(''capi olc'')',
 '["Tekrarlanabilirlik kavramı","Deney tasarımı ve ölçüm","Mekanik boşluk (backlash) gözlemi"]'::jsonb, 62, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 63, 'Servo Yumuşatma: Easing', 'Otomasyon', 3, 30, 40, '🌊',
 'Profesyonel sır: robotik hareket vs süzülen hareket! Önce DOĞRUSAL: i=0→100, açı = başlangıç + (hedef-başlangıç)×i/100. Sonra SİNÜS YUMUŞATMA: e = (1 - cos(i×1.8°)) / 2 → açı = başlangıç + (hedef-başlangıç)×e. Kol yavaş kalkar, ortada hızlanır, yavaş durur. İkisini arka arkaya izle — farkı hisset!',
 'doğrusal: aci=40+(140-40)*i/100; easing: e=(1-cos(i*1.8))/2; aci=40+100*e; her adımda servo+10ms',
 '["Doğrusal interpolasyon","Kosinüsle S-eğrisi (ease-in-out)","İvmelenme kontrolü"]'::jsonb, 63, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 64, 'Final Hazırlık: Sistem Şeması', 'Final Projeleri', 2, 20, 25, '📐',
 'Mühendis gibi planla! Programın Seri Monitör''e tüm pin haritasını ve güvenli açı kurallarını bassın (hazır şablon). Sen de A4''e kendi final projenin şemasını çiz: hangi GİRDİLER (sensör/tuş) → hangi İŞLEM (karar) → hangi ÇIKTILAR (servo/ışık/ses). Akış diyagramı olmadan koda başlamak, haritasız yolculuktur!',
 'yazdır ile pin haritası: D4-D7 servolar, D2 buton, D3 röle, D8 buzzer, D9-11 RGB, D12/13 sonar, A0-A2 analog; kağıda girdi→işlem→çıktı şeması',
 '["Sistem tasarımı","Girdi-işlem-çıktı modeli","Akış diyagramı"]'::jsonb, 64, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 65, 'Final A: Akıllı Depo Robotu', 'Final Projeleri', 3, 45, 80, '🏗️',
 'Büyük proje 1: depo görevlisi! Buton basış sayısıyla raf seç (2.5 sn pencere: 1=sol 45°, 2=orta 90°, 3=sağ 135°) → kırmızı ışıkta depodan al(90,60,125) → seçilen rafa taşı-bırak → yeşil ışık → ''Stok: N/3'' yazdır. 3 küp yerleşince mavi ışık + zafer melodisi + ''DEPO TAMAMLANDI''. Görev 53+45+12''nin birleşimi!',
 'stok<3 iken { pencere ile secim say; raf=45/90/135; kırmızı; al; git(raf,...); birak; yeşil; stok+=1; yazdır }; mavi; zafer()',
 '["Alt görevleri birleştirme","Durum + görsel + ses bütünlüğü","Proje ölçeği yönetimi"]'::jsonb, 65, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 66, 'Final B: X-O-X Turnuva Robotu', 'Final Projeleri', 3, 45, 80, '🏆',
 'Büyük proje 2: şovmen X-O-X robotu! Buton=sıra bende. Sarı ışık + ''Dusunuyor...'' + 3 tıkırtı → kırmızı ışıkta stratejik hamle (orta→köşeler) → hamleyi yazdır → yeşil ışık. 3 hamleyi tamamlayınca ''KAZANDIM!'' + zafer dansı (taban-omuz sallanır, her salınımda renk değişir) + melodi. Turnuvada sınıf arkadaşlarına karşı yarıştır!',
 'eğer buton { sarı+dusunuyor+tıkırtı; hamle stratejisi; al→git_hucre→bırak; yazdır; yeşil; eğer hamle>=3 { dans+melodi+sıfırla } }',
 '["Oyun + gösteri birleşimi","Çok fonksiyonlu mimari","Seyirci deneyimi tasarımı"]'::jsonb, 66, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 67, 'Final C: Serbest Proje', 'Final Projeleri', 3, 45, 80, '🚀',
 'Büyük proje 3: KENDİ fikrin! Kural: en az 2 sensör + 1 hareket dizisi + ışık/ses geri bildirimi + Seri Monitör günlüğü. Örnek çözüm ''Kalem Uzatan Masa Asistanı'': lamba açıkken (LDR>30) el yaklaşınca (mesafe<12) kalemliğe uzanır, kalemi alır, sana uzatır, 2 sn bekler, bırakır. Karanlıkta mavi ışıkla uyur. Sen kendi problemini çöz!',
 'örnek: eğer isik>30 { eğer mesafe<12 { kırmızı; al(50,60,125); uzat(120,75,110); 2sn; birak; nota } } değilse mavi',
 '["Açık uçlu tasarım","Gereksinim karşılama","Yaratıcı problem çözme"]'::jsonb, 67, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 68, 'Kod Temizliği & Yorumlama', 'Final Projeleri', 2, 25, 30, '🧹',
 'Profesyonellik dersi: aynı işi yapan İKİ koddan hangisi 6 ay sonra da anlaşılır? Temiz sürümü kur: ''kolu_pozisyona_gotur(taban_acisi, omuz_acisi, dirsek_acisi)'', ''tutucuyu_kapat'', ''tutucuyu_ac'', ''ev_pozisyonuna_don'' ve hepsini kullanan ''kupu_al_ve_tasi''. Uzun ama ANLAMLI isimler + her fonksiyon TEK iş. Kendi final kodunu da bu gözle temizle!',
 '5 anlamlı isimli fonksiyon; kupu_al_ve_tasi(){ ac; götür(60,65,120); kapat; götür(120,65,120); ac; eve dön }',
 '["Anlamlı isimlendirme","Tek sorumluluk ilkesi","Kod bakımı kültürü"]'::jsonb, 68, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 69, 'Demo Günü Sunumu', 'Final Projeleri', 2, 30, 40, '🎤',
 'Sunum provası! Buton = sunum kumandası: 1. basış ''PROBLEM'' yazdır + beyaz ışık; 2. basış ''COZUM'' + yeşil + kol kendini tanıtsın (sağa-sola); 3. basış ''CANLI DEMO'' + kırmızı + al-bırak gösterisi; 4. basış teşekkür + nota + başa sar. Sahne korkusuna ilaç: teknik akış otomatik, sen anlatmana odaklan!',
 'eğer buton { adim+=1; adim==1 problem/beyaz; ==2 cozum/yeşil/tanıtım; ==3 demo/kırmızı/al-bırak; değilse teşekkür+sıfırla }',
 '["Sunum yapısı (problem→çözüm→demo)","Butonla sahne yönetimi","Teknik + iletişim birleşimi"]'::jsonb, 69, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 70, 'Akran Değerlendirmesi', 'Final Projeleri', 1, 20, 20, '🤝',
 'Jüri ol! Program 3 kriteri sırayla puanlatır (Yaratıcılık, Teknik, Sunum): butona her basış +1 puan (bip + satır yazdırılır); 5 puana ulaşınca kriter kapanır, sıradakine geçilir. 3 kriter bitince uzun nota + ''Form bitti!'' Arkadaşının projesine 2 güçlü yön + 1 öneri de sözlü söyle — yapıcı eleştiri mühendislik kültürüdür.',
 'eğer buton { puan+=1; bip; yazdır(kriter,puan); eğer puan>=5 { kriter+=1; puan=0; eğer kriter>3 { bitir } } }',
 '["Değerlendirme ölçütleri","Yapıcı geri bildirim","Puanlama otomasyonu"]'::jsonb, 70, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('roboarm', 71, 'Mezuniyet: RoboArm Ustası', 'Final Projeleri', 3, 30, 60, '🎓',
 'Son sınav: küpü al, direğe geçir — HER ADIMDA FARKLI RENK: hazır=beyaz, yaklaş=sarı, kavra=mor, taşı=kırmızı, hizala=camgöbeği, bırak=yeşil. Hassas inişte sadece omuz döngüsü (görev 51). Başarıyla bitince ''USTA!'' yazdır + zafer melodisi + kırmızı-yeşil-mavi ışık şovu ×3. 71 görev bitti — artık robot programcısısın! 🎉',
 'beyaz→sarı(git 60,65,120)→mor(kavra)→kırmızı(taşı 110,115,85)→camgöbeği(hizala)→omuz döngüsüyle in→yeşil(birak)→yazdır USTA + melodi + ışık şovu',
 '["Tüm becerilerin birleşimi","Adım-durum-renk eşlemesi","Mezuniyet 🎓"]'::jsonb, 71, true, extract(epoch from now())*1000, extract(epoch from now())*1000);
