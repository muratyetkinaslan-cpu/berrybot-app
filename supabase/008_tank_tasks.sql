-- ============================================================
-- 008_tank_tasks.sql — 🪖 TANK KİTİ: "ÇELİK PALET HAREKÂTI"
-- 36 görev · savaş temalı hikaye · RoboExx blok cevap anahtarlı
-- Bölümler (rütbe sistemi):
--   OP-1 Eğitim Kampı   (1-6)   → Er
--   OP-2 Çelik Paletler (7-12)  → Onbaşı
--   OP-3 İkmal Hattı    (13-18) → Çavuş
--   OP-4 Cephe Hattı    (19-25) → Astsubay  (özel parkur görevleri)
--   OP-5 Komando Sınavı (26-30) → Teğmen
--   OP-6 Kartal Gözü    (31-36) → Yüzbaşı   (ESP32-CAM, şimdilik KİLİTLİ)
--
-- KAMERA GELİNCE AÇMAK İÇİN:
--   UPDATE bb_tasks SET active = true WHERE kit = 'tank' AND task_id >= 31;
-- ============================================================

-- Eski tank görevlerini temizle (tekrar çalıştırılabilir)
DELETE FROM bb_tasks WHERE kit = 'tank';

INSERT INTO bb_tasks
(kit, task_id, title, category, difficulty, expected_min, xp, emoji,
 description, answer, learnings, position, active, created_at, updated_at)
VALUES

-- ═══════════════ OP-1: EĞİTİM KAMPI (1-6) ═══════════════

('tank', 1, 'Künye: Birliğe Katıl', 'OP-1 Eğitim Kampı', 1, 10, 10, '🎖️',
 '📻 KARARGÂH: "Yeni asker! Birliğe katılman için künyeni sisteme tanıt." GÖREV: Tankın 5x5 ekranında asker kodun kayan yazı olsun (örnek: T-07). Ardından 4 RGB halka LED''i yeşile boya (birlik rengi) ve selam melodisi çal: Do-Mi-Sol notaları, her biri 300 ms. Kod ''Başlangıçta'' bir kez çalışsın, döngü yok.',
 'Sıralı bloklar: [Ekranda kaydır "T-07"] → [Halkayı boya · yeşil] → [Nota çal Do(C4) 300ms] → [Nota çal Mi(E4) 300ms] → [Nota çal Sol(G4) 300ms]. Bloklar yukarıdan aşağı 1 kez çalışır.',
 '["Sıralı komut çalıştırma (algoritma sırası)","5x5 LED matriste kayan yazı","RGB LED renk kontrolü","Buzzer ile nota çalma","Milisaniye kavramı"]'::jsonb,
 1, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 2, 'Mors Telsizi: SOS Yayını', 'OP-1 Eğitim Kampı', 2, 15, 15, '📡',
 '📻 KARARGÂH: "Telsiz düştü, tek iletişim mors kodu! SOS öğrenmeden cepheye çıkamazsın." GÖREV: İki DEĞİŞKEN yap: kisa=200, uzun=600. SOS = 3 kısa + 3 uzun + 3 kısa bip. Her grubu ''tekrarla 3 kez'' bloğuyla çal: [Ses çal 800 Hz, süre=kisa] + [bekle]. Sayıları elle yazmak YASAK — hepsi değişkenden gelecek. Bonus: yayın sırasında matris ekranda üçgen (tehlike) işareti dursun.',
 'kisa=200, uzun=600 değişkenleri. [tekrarla 3 kez{ Ses çal 800Hz süre=kisa; bekle 0.2sn }] → [tekrarla 3 kez{ Ses çal 800Hz süre=uzun; bekle 0.2sn }] → [tekrarla 3 kez{ Ses çal 800Hz süre=kisa; bekle 0.2sn }]. Başta [Ekranda göster △ üçgen].',
 '["Değişken tanımlama ve kullanma","Tekrar (repeat) döngüsü","Mors kodu — bilginin sinyale dönüşmesi","Sabit değer yerine değişken kullanma alışkanlığı","Zamanlama hassasiyeti"]'::jsonb,
 2, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 3, 'Karartma Protokolü', 'OP-1 Eğitim Kampı', 2, 15, 15, '🌘',
 '📻 KARARGÂH: "Düşman uçakları geceleri ışık arıyor! Karanlıkta TÜM ışıklar sönecek, ama üsse projektör tutan olursa hava saldırısı sireni çalacak." GÖREV: Sonsuz döngü içinde ışık sensörünü kontrol et. Ortam KARANLIKSA: halka LED''ler sönük, ekranda uyku (üçgen) işareti. Birisi FENERLE IŞIK TUTARSA (ortam aydınlık olursa): halka kırmızı + siren (600 Hz ve 900 Hz dönüşümlü) + ekranda çarpı. Eşik değerini sınıfın ışığına göre sen kalibre et.',
 '[sonsuz döngü{ eğer [ortam aydınlık mı? eşik 600] → [Halkayı boya kırmızı] + [Ses çal 600Hz 150ms] + [Ses çal 900Hz 150ms] + [Ekranda göster ✗] · değilse → [Halkayı söndür] + [Sesi kes] + [Ekranda göster △] }]. Eşik sınıf ışığına göre ayarlanır.',
 '["Koşullu ifadeler (eğer / değilse)","Sonsuz döngü kavramı","Işık sensörü (LDR) okuma","Eşik değeri ve kalibrasyon","Sensör → karar → eylem zinciri"]'::jsonb,
 3, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 4, 'Şifreli Emir: Kimlik Doğrulama', 'OP-1 Eğitim Kampı', 3, 20, 20, '🔐',
 '📻 KARARGÂH: "Tankı düşman ele geçirirse çalıştıramamalı! Ateşleme şifresi: 3-5-7." GÖREV: ''adim'' adında değişken yap, 0''dan başlasın. Kumandadan tuşlar SIRAYLA doğru gelirse adim 1''er artsın: 3 geldi→adim=1, sonra 5→adim=2, sonra 7→adim=3. adim 3 olunca: ekranda onay ✓ + halka yeşil + zafer notaları (Do-Mi-Sol-Do5). YANLIŞ tuşta: adim=0''a dön, ekranda çarpı ✗ + kısa alarm. Şifre tamamlanana kadar tank kilitli.',
 'adim=0 değişkeni. [sonsuz döngü{ eğer [Kumandada 3 basıldı? VE adim=0] → adim=1 · eğer [Kumandada 5 basıldı? VE adim=1] → adim=2 · eğer [Kumandada 7 basıldı? VE adim=2] → [Ekranda ✓]+[Halka yeşil]+[Do,Mi,Sol,Do5 notaları] · yanlış tuşta → adim=0 + [Ekranda ✗]+[Ses 300Hz 400ms] }]',
 '["Değişkenle durum (state) tutma","Mantık operatörleri (VE)","Çoklu koşul zinciri","Kumanda (IR) girişi okuma","Güvenlik / doğrulama mantığı"]'::jsonb,
 4, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 5, 'Radar İstasyonu', 'OP-1 Eğitim Kampı', 3, 20, 20, '🛰️',
 '📻 KARARGÂH: "Düşman projektörü hangi yönden geliyor? Radar subayı sensin!" GÖREV: Karttaki İKİ ışık sensörünün farkını kullan: [ışık farkı (sağ - sol)] bloğu. Sonsuz döngüde: fark 200''den BÜYÜKSE ışık sağda → ekranda ➡ sağ ok + sağdaki 2 halka LED sarı. Fark -200''den KÜÇÜKSE ışık solda → ⬅ sol ok + soldaki 2 LED sarı. İkisi de değilse (ışık karşıda/yok) → ekranda ■ dolu + tüm LED''ler sönük. Feneri gezdir, radar takip etsin!',
 '[sonsuz döngü{ eğer [ışık farkı (sağ-sol)] > 200 → [Ekranda ➡]+[Halka LED 2,3 sarı] · değilse eğer [ışık farkı] < -200 → [Ekranda ⬅]+[Halka LED 0,1 sarı] · değilse → [Ekranda ■]+[Halkayı söndür] }]',
 '["İki sensör verisini karşılaştırma","Karşılaştırma operatörleri (>, <)","Negatif sayılar","eğer / değilse eğer / değilse merdiveni","Veriyi görselleştirme (ok işaretleri)"]'::jsonb,
 5, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 6, 'Sabotaj Sayacı: Fünye Kur', 'OP-1 Eğitim Kampı', 3, 20, 25, '💣',
 '📻 KARARGÂH: "Köprüyü uçuracağız! Fünyeyi kur ama geri sayımı şaşırma — istihkamcının hatası affetmez." GÖREV: Karttaki BUTONA basılınca geri sayım başlasın: sayaçlı döngü 5''ten 1''e insin. Her sayıda: ekranda çubuk göster (sayı kadar) + kısa bip. İşin püf noktası: her adımda bekleme süresi KISALSIN (bekleme_ms = sayı x 200 → 1000, 800, 600, 400, 200 ms) — tempo hızlanarak gerilim artsın! Sayım bitince PATLAMA: tüm halka kırmızı + ekran ■ dolu + 200 Hz uzun ton (1 sn).',
 '[sonsuz döngü{ eğer [BerryBot butonuna basılı mı?] → [i için 5''ten 1''e adım -1{ Ekranda çubuk göster i; Ses çal 1000Hz 100ms; bekle_ms i*200 }] → [Halkayı boya kırmızı]+[Ekranda ■]+[Ses çal 200Hz 1000ms] }]. Bekleme süresi = i*200 (matematik çarpma bloğu).',
 '["Sayaçlı (for) döngü — geriye sayma","Döngü değişkenini hesapta kullanma (i*200)","Matematik blokları (çarpma)","Buton girişi okuma","Matris çubuk göstergesi"]'::jsonb,
 6, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══════════════ OP-2: ÇELİK PALETLER (7-12) ═══════════════

('tank', 7, 'İlk Ateşleme: Düz Rota', 'OP-2 Çelik Paletler', 2, 15, 15, '⚙️',
 '📻 KARARGÂH: "Onbaşılık yolu paletlerden geçer! Tankın 500 RPM''lik iki N20 motoru var — ama hiçbir iki motor birebir aynı değildir." GÖREV: [BerryBot sür · sol % / sağ %] bloğuyla iki motora da %60 ver, 2 saniye sür, dur. Tank sağa mı kayıyor? Sol motoru azalt ya da sağı artır (örn. sol 58 / sağ 60). Zemine 1 metrelik bant çek — tank bandın üstünden şaşmadan gidene kadar değerlerle oyna. Bulduğun ''altın değerleri'' not et, hep lazım olacak!',
 '[BerryBot sür · sol %60 sağ %60] → [bekle 2sn] → [BerryBot dur]. Sapma varsa asimetrik düzeltme: örn. [sür sol %57 sağ %60]. Doğru cevap robota göre değişir — önemli olan deneme-düzeltme döngüsü.',
 '["Tank (diferansiyel) sürüş mantığı","Motor toleransı ve kalibrasyon","Deneme-yanılma ile parametre ayarı (mühendislik iterasyonu)","Süreli hareket ve durdurma"]'::jsonb,
 7, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 8, 'Manevra Sahası: Tank Dönüşü', 'OP-2 Çelik Paletler', 3, 20, 20, '🔄',
 '📻 KARARGÂH: "Gerçek tanklar yerinde döner — paletlerden biri ileri, biri geri!" GÖREV: [sür · sol %50 sağ %-50] ile tank YERİNDE sağa döner. Kronometreyle ölç: 90 derece dönmesi kaç saniye/milisaniye sürüyor? Bu süreyi ''don90'' değişkenine yaz. Şimdi matematik: 180 derece = don90 x 2, tam tur 360 = don90 x 4. Üç dönüşü de değişken + çarpma bloğuyla yaz, elle süre yazmak yasak! Her dönüşten önce ekranda yön oku göster.',
 'don90 değişkeni (ölçülen süre, örn. 0.6sn). [Ekranda ➡]+[sür sol %50 sağ %-50]+[bekle don90]+[dur] → 180 için [bekle don90*2] → 360 için [bekle don90*4]. Çarpma matematik bloğuyla.',
 '["Negatif hız = geri dönen palet","Yerinde dönüş (pivot) fiziği","Açı-süre orantısı","Değişken + aritmetik ile ölçekleme","Ölçme ve kalibrasyon"]'::jsonb,
 8, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 9, 'Mayın Tarlası Slalomu', 'OP-2 Çelik Paletler', 3, 25, 25, '⚠️',
 '📻 KARARGÂH: "Önünde mayın tarlası var asker — düz giden havaya uçar! Zikzak süreceksin." GÖREV: Yere 3 bardak koy (mayınlar), aralarından slalom yap. Önce İKİ FONKSİYON tanımla: sag_kacis() = sağa kavisli sür (sol %70 sağ %35, 1 sn), sol_kacis() = tersi. Ana programda: [tekrarla 3 kez{ sag_kacis(); sol_kacis() }]. Fonksiyon kullanmadan yazarsan kod 12 blok, fonksiyonla 6 blok — farkı gör! Her kaçışta korna çal, mayına değersen görev baştan.',
 'Fonksiyon tanımla: sag_kacis{ [sür sol %70 sağ %35]+[bekle 1sn] }, sol_kacis{ [sür sol %35 sağ %70]+[bekle 1sn] }. Ana program: [tekrarla 3 kez{ sag_kacis; Korna; sol_kacis; Korna }] → [dur].',
 '["Fonksiyon tanımlama ve çağırma","Kod tekrarını önleme (DRY prensibi)","Fonksiyon + döngü birlikte kullanımı","Asimetrik hızla kavis çizme","Rota planlama"]'::jsonb,
 9, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 10, 'Taktik Geri Çekilme', 'OP-2 Çelik Paletler', 3, 20, 20, '🚨',
 '📻 KARARGÂH: "Pusuya düştük! Geri çekil ama panik yok — sinyalsiz geri çekilen dost ateşine kurban gider." GÖREV: Tank 3 saniye geri giderken AYNI ANDA üç şey olacak: (1) geri hareket, (2) halka LED''ler kırmızı yanıp sönecek, (3) siren çalacak (500 Hz / 800 Hz dönüşümlü). Sır şu: [geri git] bloğu motoru başlatır ve kod akmaya devam eder — yani motor dönerken [tekrarla 6 kez{ kırmızı+bip+söndür+bip }] çalıştırabilirsin. Sonunda dur, ekranda onay ✓.',
 '[BerryBot geri git ⬇ hız %60] (motor arka planda döner) → [tekrarla 6 kez{ [Halka kırmızı]+[Ses 500Hz 150ms]+[Halkayı söndür]+[Ses 800Hz 150ms] }] → [BerryBot dur] → [Ekranda ✓]. Toplam ~3sn geri gider.',
 '["Eşzamanlı çıktı yönetimi (motor + ışık + ses)","Bloklamayan komut kavramı","Yanıp sönme deseni (döngüyle)","Alarm/sinyal protokolü tasarımı"]'::jsonb,
 10, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 11, 'Vites Kademeleri', 'OP-2 Çelik Paletler', 3, 20, 20, '🎚️',
 '📻 KARARGÂH: "Tank sürücüsü gaza yüklenmez, vites kullanır!" GÖREV: ''hiz'' değişkeni yap. Kumandadan: 1 tuşu → hiz=30 (sürünme), 2 → hiz=60 (seyir), 3 → hiz=90 (hücum!). Ekranda vites göstergesi: çubuk göster 1 / 3 / 5. Yukarı ok basılıyken tank ileri gitsin ama hızı hep ''hiz'' değişkeninden alsın — yani sürerken vites değiştirebilmelisin! OK tuşu = dur. Vites değişince onay bip''i çal.',
 'hiz=30 başlangıç. [sonsuz döngü{ eğer [Kumandada 1] → hiz=30+[çubuk 1]+bip · eğer [2] → hiz=60+[çubuk 3]+bip · eğer [3] → hiz=90+[çubuk 5]+bip · eğer [yukarı ⬆] → [ileri git hız %=hiz] · eğer [OK] → [dur] }]',
 '["Değişkenin canlı (runtime) değişimi","Çoklu koşul (eğer merdiveni / switch mantığı)","Değişkeni komut parametresi olarak kullanma","Gösterge paneli tasarımı","Kullanıcı arayüzü mantığı"]'::jsonb,
 11, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 12, 'Uzaktan Komuta Merkezi', 'OP-2 Çelik Paletler', 3, 25, 25, '🕹️',
 '📻 KARARGÂH: "Onbaşı sınavın: tankın tam kumanda kontrolü! Komuta merkezi sensin." GÖREV: Sonsuz döngüde tüm tuşları dinle: ⬆ ileri, ⬇ geri, ⬅ sola dön, ➡ sağa dön (hepsi %70), OK = DUR. 5 tuşu = korna + ekranda kalp (dost selamı). HİÇBİR tuşa basılmıyorsa tank DURMALI — bu satırı unutan tankı duvara gömer! Ekranda hep son yönün oku görünsün. Sınav: eğitmenin çizdiği rotayı çarpmadan tamamla.',
 '[sonsuz döngü{ eğer [⬆] → [ileri %70]+[Ekranda ⬆] · eğer [⬇] → [geri %70]+[Ekranda ⬇] · eğer [⬅] → [sola %70]+[Ekranda ⬅] · eğer [➡] → [sağa %70]+[Ekranda ➡] · eğer [5] → [Korna]+[Ekranda ❤] · hiçbiri değilse → [dur] }]. Kritik: son ''değilse dur'' dalı.',
 '["Olay döngüsü (event loop) kavramı","Tuş → eylem eşleme tablosu","Varsayılan (else) durumun önemi — güvenlik","Gerçek zamanlı kontrol","Bölüm finali: tüm hareket blokları"]'::jsonb,
 12, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══════════════ OP-3: İKMAL HATTI (13-18) ═══════════════

('tank', 13, 'Hatta Bağlan: Kör Takip', 'OP-3 İkmal Hattı', 3, 25, 25, '🛤️',
 '📻 KARARGÂH: "Cepheye mühimmat taşıyan konvoylar siyah hattı izler — GPS yok, uydu yok, tek sensör var!" GÖREV: Tankın TEK çizgi sensörü var, o yüzden hattın KENARINI takip edeceğiz (askerler buna kör takip der): Sensör SİYAHTAYSA → hattın içindesin, hafif sağa kavis (sol %55 sağ %35). Sensör BEYAZDAYSA → dışarı çıktın, hafif sola kavis (sol %35 sağ %55). Tank hattın sağ kenarında yılan gibi salınarak ilerler. Sonsuz döngü + eğer/değilse. Hızları parkurda dene, salınım çoksa hız farkını azalt.',
 '[sonsuz döngü{ eğer [çizgi sensörü siyahta mı?] → [sür sol %55 sağ %35] · değilse → [sür sol %35 sağ %55] }]. Bang-bang kenar takibi — tank çizginin sağ kenarını yalayarak gider.',
 '["Bang-bang (aç-kapa) kontrol algoritması","Tek sensörle kenar takibi","İkili (boolean) sensör verisi","Salınım ve hız dengesi","Robotikte klasik çizgi izleme problemi"]'::jsonb,
 13, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 14, 'Hat Koptu! Arama Protokolü', 'OP-3 İkmal Hattı', 4, 25, 30, '🔍',
 '📻 KARARGÂH: "Bombardıman hattı kopardı! Kaybolan konvoy durur, panik yapmaz, hattı ARAR." GÖREV: Çizgi takibine ''kayip'' sayacı ekle: sensör beyazdayken sayaç her turda +1, siyah görünce sıfırlan. Sayaç 200''ü geçerse (uzun süre beyaz = hat koptu!): DUR, halka sarı, korna çal. Sonra arama manevrası: [şu ana kadar tekrarla: çizgi siyah OLANA KADAR yerinde sağa dön (sol %40 sağ %-40)]. Hat bulununca sayaç sıfırla, halka yeşil, takibe devam. Kodun her ihtimale hazır olmalı — buna savunmacı programlama denir!',
 'kayip=0. [sonsuz döngü{ eğer [siyahta?] → kayip=0 + [sür 55/35] · değilse → kayip=kayip+1 + [sür 35/55] · eğer kayip > 200 → [dur]+[Halka sarı]+[Korna]+[tekrarla ta ki [siyahta?]{ sür sol %40 sağ %-40 }]+kayip=0+[Halka yeşil] }]',
 '["Sayaç değişkeniyle durum izleme","while / ta-ki (until) döngüsü","Hata durumu yakalama ve kurtarma","Savunmacı programlama kavramı","İç içe döngü ve koşullar"]'::jsonb,
 14, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 15, 'Kontrol Noktası Sayacı', 'OP-3 İkmal Hattı', 4, 25, 30, '🚧',
 '📻 KARARGÂH: "İkmal hattında kontrol noktaları KALIN siyah bantlarla işaretli. Her noktada rapor verilir!" GÖREV: Normal çizgi incedir, sensör siyah-beyaz arasında gidip gelir. Kalın bantta ise sensör UZUN SÜRE siyahta kalır. ''siyah_sayac'' değişkeni: siyahken +1, beyazda sıfırla. Sayaç 150''yi aşarsa = kontrol noktası! O an: ''nokta'' değişkenini +1 yap, dur, nokta sayısı kadar bip çal ([tekrarla nokta kez{ bip }]), ekranda çubuk göster (nokta), 1 sn bekle, devam et. Aynı bandı iki kez sayma — bant bitene kadar bekle!',
 'siyah_sayac=0, nokta=0. Çizgi takibi + [eğer siyahta → siyah_sayac+1 · değilse → siyah_sayac=0]. [eğer siyah_sayac > 150 → nokta=nokta+1 + [dur] + [tekrarla nokta kez{ Ses 1000Hz 100ms; bekle 0.15sn }] + [çubuk göster nokta] + [ta ki beyaz: bekle] + devam]',
 '["Süreye dayalı örüntü algılama","İki bağımsız sayaç yönetimi","Döngü sayısını değişkenden alma (tekrarla n kez)","Kenar tetikleme (çift saymayı önleme)","Veri toplama ve raporlama"]'::jsonb,
 15, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 16, 'Ekspres Konvoy: Hız Rekoru', 'OP-3 İkmal Hattı', 4, 25, 30, '🏁',
 '📻 KARARGÂH: "Cephede mühimmat bitiyor — en hızlı konvoy madalya alır! Ama devrilen konvoy hiç ulaşamaz." GÖREV: 13. görevdeki takip kodunu al, hızları DEĞİŞKENE bağla: hizli ve yavas. Parkurda tur süresi tutulacak. Strateji: hizli/yavas farkı az → az salınım ama yavaş viraj; fark çok → keskin dönüş ama zikzak. 3 deneme hakkın var, her denemede değerleri değiştir, sürelerini karşılaştır. En iyi kombinasyonu bul ve NEDEN o değerlerin kazandığını eğitmene anlat. En hızlı 3 asker günün konvoy şeridini takar!',
 'hizli=75, yavas=30 (örnek). [sonsuz döngü{ eğer siyahta → [sür sol=hizli sağ=yavas] · değilse → [sür sol=yavas sağ=hizli] }]. Doğru cevap tek değil — sistematik deneme ve ölçümle bulunan en iyi değer çifti.',
 '["Parametre optimizasyonu","Ölçme-karşılaştırma-iyileştirme döngüsü","Hız/kararlılık ödünleşimi (trade-off)","Değişkenle merkezi ayar yönetimi","Mühendislikte veriye dayalı karar"]'::jsonb,
 16, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 17, 'Tünel Geçişi: Farlar', 'OP-3 İkmal Hattı', 4, 25, 30, '🌌',
 '📻 KARARGÂH: "Hat dağın içinden geçiyor. Tünelde farsız giden konvoy hattı kaybeder!" GÖREV: Parkurun bir bölümüne karton tünel koy. Çizgi takibi aynen sürerken, döngünün İÇİNDE ikinci bir kontrol daha olacak: [ortam aydınlık mı?] HAYIR ise (tüneldesin) → halka LED''ler BEYAZ tam parlak (farlar!) + ekranda ■. EVET ise → farlar sönük + ekranda ☀ güneş. Yani iç içe iki karar: dışta ışık kontrolü, içte çizgi kontrolü — ikisi aynı turda çalışır. Tank tünele girince farları otomatik yanmalı, çıkınca sönmeli.',
 '[sonsuz döngü{ eğer [ortam aydınlık mı? eşik] → [Halkayı söndür]+[Ekranda ☀] · değilse → [Halka beyaz]+[Halka parlaklığı %100]+[Ekranda ■] · SONRA çizgi: eğer [siyahta?] → [sür 55/35] · değilse → [sür 35/55] }]. İki bağımsız if aynı döngüde.',
 '["İç içe / ardışık koşullar (nested if)","Aynı döngüde çoklu sensör işleme","Sensör füzyonuna giriş","Otomatik far mantığı (gerçek araçlardaki gibi)","Kod organizasyonu"]'::jsonb,
 17, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 18, 'Rota Değişim Emri', 'OP-3 İkmal Hattı', 4, 30, 35, '📻',
 '📻 KARARGÂH: "Çavuşluk sınavı! Konvoy giderken telsizden emir gelir: ''Bir sonraki kontrol noktasında sağa sap!'' Emir ANINDA uygulanmaz — doğru yere gelince uygulanır." GÖREV: ''emir'' bayrak değişkeni yap (0=yok, 1=sağa dön). Tank çizgi takibi yaparken kumandadan ➡ tuşu gelirse: emir=1, ekranda ➡ oku, onay bip''i — AMA TANK DÖNMEZ, yoluna devam eder! Ne zaman ki kalın banda gelir (15. görevdeki algılama), O ZAMAN: eğer emir=1 → 90° sağa dön (8. görevdeki don90 süren!), emir=0''a sıfırla, ekranı temizle. Emir yoksa banttan düz geçer.',
 'emir=0. Çizgi takip + [eğer [Kumandada ➡] → emir=1+[Ekranda ➡]+bip]. Kalın bant algılanınca: [eğer emir=1 → [sür sol %50 sağ %-50]+[bekle don90]+emir=0+[Ekranı temizle] · değilse → düz devam]. Bayrak: komutu sakla, doğru anda uygula.',
 '["Bayrak (flag) değişkeni deseni","Komutu erteleme — olay kuyruğu mantığı","Birden çok görevin (13+15+8) birleştirilmesi","Asenkron komut işleme kavramı","OP-3 finali"]'::jsonb,
 18, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══════════════ OP-4: CEPHE HATTI — ÖZEL PARKUR (19-25) ═══════════════

('tank', 19, 'Cepheye İlk Adım: Konvoy Kalkışı', 'OP-4 Cephe Hattı', 4, 30, 35, '🗺️',
 '📻 KARARGÂH: "Çavuş, artık gerçek cephe haritasındasın! BAŞLANGIÇ üssünden kalk, orta kavşağa (göbek) ulaş." GÖREV: Parkurda BAŞLANGIÇ''tan çık, çizgi takibiyle merkez göbeğe gel. Göbek dairesel — kenar takibi seni çemberde döndürür, panik yok: bu doğru davranış! Göbekte BİR tam tur at (turladığını kalın çıkış çizgilerinden say), sonra ekranda onay ✓ göster ve dur. Ekstra: kalkışta 3 saniyelik geri sayım (3-2-1 ekranda çubukla) + kalkış kornası. Tankın hangi ''durumda'' olduğunu düşün: KALKIŞ mı, YOLDA mı, GÖBEKTE mi?',
 'Kalkış: [i için 3''ten 1''e{ çubuk i; bip; bekle 1sn }]+[Korna]. Sonra çizgi takibi (13. görev kodu). Göbekte kalın çizgi sayacı (15. görev) ile çıkış say; sayı hedefe ulaşınca [dur]+[Ekranda ✓]. Durum fikri: kalkis→yolda→gobek.',
 '["Durum (state) kavramına giriş","Önceki kodların gerçek sahada birleşimi","Parkur okuma ve rota planlama","Geri sayım + görsel gösterge","Gerçek dünya belirsizliğiyle baş etme"]'::jsonb,
 19, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 20, 'DUR-KALK Kontrol Noktası', 'OP-4 Cephe Hattı', 4, 25, 30, '🛑',
 '📻 KARARGÂH: "Parkurdaki DUR-KALK bölgesi askeri kontrol noktasıdır. STOP''ta durmayan tank... sorun yaşar." GÖREV: Tank çizgiyi takip ederken DUR-KALK bölgesinin kalın bandına gelince: TAM DUR, halka kırmızı, ekranda ✗. Şimdi iki geçiş yolu var ve İKİSİ DE kodda olmalı: (a) 3 saniye bekleyince otomatik geçiş, YA DA (b) nöbetçi (eğitmen) karttaki butona basarsa anında ''geç'' emri. Yani: bekleme döngüsü hem süreyi hem butonu aynı anda kollayacak. Geçiş anında: halka yeşil, korna, yola devam.',
 'Bant algılanınca: [dur]+[Halka kırmızı]+[Ekranda ✗]. sayac=0; [tekrarla ta ki (sayac>30 VEYA [butona basılı mı?]){ bekle 0.1sn; sayac=sayac+1 }] → [Halka yeşil]+[Korna]+[Ekranda ✓]+takibe devam. VEYA operatörü kritik!',
 '["Bekleme durumu tasarımı","VEYA mantık operatörü","İki farklı tetikleyiciyi aynı anda dinleme","Zaman sayacı (bloklamadan bekleme fikri)","Trafik/protokol kuralları kodlama"]'::jsonb,
 20, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 21, 'Mayınlı Bölge: Engel Alanı', 'OP-4 Cephe Hattı', 4, 30, 35, '💥',
 '📻 KARARGÂH: "ENGEL ALANI''ndayız — yolda kaya ve enkaz var! Kural bir: GÜVENLİK HER ŞEYDEN ÖNCE GELİR." GÖREV: Çizgi takip döngünün EN BAŞINA engel kontrolü koy: [önünde engel var mı? < 12 cm] EVET ise → ANINDA DUR + halka kırmızı flaş + siren + ekranda ✗. Engel duruyorsa tank da durur (bekleme döngüsü). Engel kalkınca (eğitmen kayayı alınca): 1 sn bekle (emin ol!), halka yeşil, devam. Neden engel kontrolü ilk sırada? Çünkü kodda ÜSTTEKİ koşul önce çalışır — güvenlik kontrolleri hep en üstte olur, gerçek robotlarda da böyle!',
 '[sonsuz döngü{ eğer [önünde engel var mı? < 12cm] → [dur]+[tekrarla ta ki engel yok{ Halka kırmızı; Ses 700Hz 200ms; Halkayı söndür }]+[bekle 1sn]+[Halka yeşil] · değilse → çizgi takibi }]. Engel dalı HER ZAMAN önce.',
 '["Koşul öncelik sırası — güvenlik önce","Mesafe sensörüyle engel algılama","Bekle-ve-doğrula deseni (1 sn emin olma)","Acil durdurma (e-stop) kavramı","Gerçek otonom araç güvenlik mantığı"]'::jsonb,
 21, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 22, 'Renk İstihbaratı', 'OP-4 Cephe Hattı', 5, 30, 40, '🎨',
 '📻 KARARGÂH: "RENK ALGILAMA bölgesindeki şeritler gizli emirlerdir! Ama tankta renk sensörü yok — istihbaratçı elindekiyle çözer." GÖREV: Sır: çizgi sensörünün HAM değeri zeminin tonuna göre değişir! Önce keşif: tankı elle her şeridin üstüne koy, [çizgi sensörü · ham değer] bloğunu matriste % dolum olarak göster, her rengin sayısını not et (koyu renkler düşük/yüksek uçta, açıklar ortada). Sonra eşikler kur: KOYU şerit (siyah/gri) → 3 sn dur. ORTA ton (kırmızı/mavi) → korna + kalp. AÇIK ton (sarı) → halka sarı flaş. Kalibrasyon senin işin — istihbarat ölçülür, tahmin edilmez!',
 'Keşif: [sonsuz döngü{ Ekranda % dolum ← [çizgi ham değeri] map }]. Görev: [eğer ham < E1 → dur 3sn · değilse eğer ham < E2 → Korna+❤ · değilse eğer ham < E3 → Halka sarı flaş]. E1,E2,E3 öğrencinin ölçtüğü eşikler — robota/ışığa göre değişir.',
 '["Analog (ham) sensör verisi okuma","Veri toplama ve tablolama","Çoklu eşikle sınıflandırma","map/aralık dönüştürme fikri","Sensör sınırlarıyla yaratıcı çözüm"]'::jsonb,
 22, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 23, 'Cephane Teslimatı', 'OP-4 Cephe Hattı', 5, 35, 40, '📦',
 '📻 KARARGÂH: "Cepheye mühimmat! Küp (cephane sandığı) tankın üstüne yüklendi — TESLİMAT ALANI''na sarsmadan götür." GÖREV: Bu görevi 4 alt parçaya BÖL ve her parçayı ayrı fonksiyon yap: (1) yukle_kontrol: butona basılınca görev başlar (yükleme onayı), (2) git: Başlangıç''tan Teslimat kavşağına çizgi takibi — sarsmamak için yavaş vites, kalın bantta teslimat sapağına gir, (3) teslim: alanda dur + halka mavi + 3 bip + ekranda kalp (5 sn bekle, eğitmen küpü alır), (4) don: geri dön. Ana program sadece 4 satır: dört fonksiyonun çağrısı! Büyük problemler böyle çözülür: parçala, tek tek fethet.',
 'Fonksiyonlar: yukle_kontrol{ ta ki buton: bekle; Korna }, git{ yavaş çizgi takibi + bant sayımı + sapakta dön }, teslim{ dur; Halka mavi; 3x bip; Ekranda ❤; bekle 5sn }, don{ 180° dön (don90*2); geri takip }. Ana: [yukle_kontrol]→[git]→[teslim]→[don].',
 '["Problemi parçalama (decomposition)","Fonksiyonlarla program mimarisi","Ana programın okunabilirliği","Görev fazları / durum sıralaması","Hassas yük taşıma parametreleri"]'::jsonb,
 23, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 24, 'Üsse Dönüş: Park Manevrası', 'OP-4 Cephe Hattı', 5, 30, 40, '🅿️',
 '📻 KARARGÂH: "Görev bitti, tanklar PARK ALANI''na! Ama garaj duvarına toslayan sürücü hafta sonu izin alamaz." GÖREV: Park cebinin dibine karton ''duvar'' koy. Tank cebe yavaş girsin (%35) ve gerçek arabalardaki park sensörünü yap: bip aralığı MESAFEYLE ORANTILI! Formül: bekleme_ms = [mesafe (cm)] x 15 → 40 cm''de tembel bip (600ms arayla), 10 cm''de panik bip (150ms). Mesafe 6 cm''nin altına inince: TAM DUR, halka yeşil, park marşı (Do-Sol-Do5). Matematik bloğu (çarpma) + mesafe bloğu iç içe. 5 cm''den yakın durursan tam puan!',
 '[sonsuz döngü{ eğer [mesafe cm] > 6 → [ileri %35]+[Ses 1200Hz 60ms]+[bekle_ms [mesafe cm]*15] · değilse → [dur]+[Halka yeşil]+[Do,Sol,Do5]+[döngüden çık] }]. Bip temposu = mesafe*15 ms — orantısal geri bildirim.',
 '["Sensör değerini hesapta kullanma (orantı)","Sürekli ölçüm + tepki döngüsü","Döngüden çıkış (break) mantığı","Gerçek park sensörünün çalışma prensibi","Hassas konumlanma"]'::jsonb,
 24, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 25, 'TAM TUR HAREKÂTI', 'OP-4 Cephe Hattı', 5, 40, 50, '🏆',
 '📻 KARARGÂH: "ASTSUBAYLIK SINAVI! Tüm cephe hattı: BAŞLANGIÇ''tan BİTİŞ bayrağına, tüm istasyonlar aktif!" GÖREV: Tek programda birleştir: kalkış geri sayımı (19) → çizgi takibi (13) → DUR-KALK''ta dur protokolü (20) → engel alanında güvenlik (21) → tünelde farlar (17) → BİTİŞ''in damalı bölgesinde (kalın bant üst üste = uzun siyah!) dur + zafer marşı + halka gökkuşağı + ekranda kayan yazı ZAFER. Süre tutulur, en iyi 3 dereceye madalya töreni! İpucu: her istasyon zaten yazdığın bir fonksiyon — bu görev kopyala-yapıştır değil, MİMARİ kurma sınavı.',
 'Ana döngü öncelik sırası: [1) engel var mı → güvenlik dur] → [2) ortam karanlık → farlar] → [3) kalın bant → durum sayacına göre: 1.bant=DUR-KALK protokolü, son bant=BİTİŞ] → [4) normal çizgi takibi]. Bitişte: [dur]+[Halkada gökkuşağı]+[zafer notaları]+[Ekranda kaydır ZAFER].',
 '["Durum makinesi (state machine) kurma","Öncelik sıralı karar mimarisi","Alt sistemlerin entegrasyonu","Uçtan uca sistem testi","OP-4 FİNAL PROJESİ — Astsubay terfisi"]'::jsonb,
 25, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══════════════ OP-5: KOMANDO SINAVI (26-30) ═══════════════

('tank', 26, 'Gece Harekâtı', 'OP-5 Komando Sınavı', 5, 35, 45, '🌙',
 '📻 KARARGÂH: "Komandolar gece çalışır! Işıklar kapalı, perdeler çekili — tank karanlıkta tam tur atacak." GÖREV: 25. görevdeki tam turu ŞİMDİ KARANLIK SINIFTA yap. Zorluk: farlar (halka beyaz) hep açık ama parlaklık %40''ta (ışık disiplinini bozma!), DUR-KALK''ta kırmızı yerine loş sarı kullan (%20 parlaklık), sirenler kısık tonda. Ekstra tehlike: karanlıkta çizgi sensörünün ham değerleri değişebilir — eşiği geceye göre YENİDEN kalibre etmen gerekebilir (22. görevdeki keşif tekniği). Gündüz kodunun gece çalışmaması, gerçek mühendislerin de kabusudur!',
 '25''in kodu + değişiklikler: [Halka beyaz]+[Halka parlaklığı %40] sürekli açık; alarm parlaklıkları %20; [çizgi eşiğini ayarla] bloğuyla gece kalibrasyonu. Ortam değişince eşiklerin yeniden ölçülmesi görevin özü.',
 '["Ortam koşullarının sensöre etkisi","Yeniden kalibrasyon disiplini","Parlaklık (PWM) kontrolü","Aynı kodun farklı koşullara uyarlanması","Sistem dayanıklılığı (robustness)"]'::jsonb,
 26, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 27, 'Dost mu Düşman mı?', 'OP-5 Komando Sınavı', 5, 30, 45, '🔦',
 '📻 KARARGÂH: "Devriyedeyken önüne çıkan herkese ateş edemezsin — önce KİMLİK SOR!" GÖREV: Tank devriye atarken (çizgi takibi) eğitmen İSTEDİĞİ AN kumandadan OK''ye basar = ''karşında biri var''. Tank ANINDA durur, ekranda △ (soru), halka sarı, sorgu melodisi. Şimdi 5 saniyelik cevap penceresi: 3 tuşu gelirse → DOST: halka yeşil, ❤, selam kornası, devriyeye devam. 9 gelirse → DÜŞMAN: kırmızı alarm + tam geri kaç (2 sn) + tekrar devriye. 5 saniyede cevap GELMEZSE → düşman say! Akan görevi kesip önceliğe geçmek, işin en zor kısmı.',
 'Devriye döngüsü içinde: [eğer [Kumandada OK] → [dur]+[Ekranda △]+[Halka sarı]+sorgu sesi + sayac=0 + [tekrarla ta ki (cevap VEYA sayac>50){ bekle 0.1; sayac+1; eğer [3] → dost dalı · eğer [9] → düşman dalı }] + [eğer cevapsız → düşman dalı]]. Düşman: [Halka kırmızı]+[geri %80 2sn].',
 '["Kesme (interrupt) mantığı — akışı bölme","Zaman aşımı (timeout) deseni","Üç dallı karar (dost/düşman/cevapsız)","Görev + olay dinlemenin iç içe geçmesi","Gerçek zamanlı protokol tasarımı"]'::jsonb,
 27, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 28, 'Kod Kırıcı: Sinyal İstihbaratı', 'OP-5 Komando Sınavı', 5, 30, 45, '🧩',
 '📻 KARARGÂH: "Düşman telsizini dinliyoruz asker! Sinyali SAY, şifreyi ÇÖZ, doğru cevapla." GÖREV: Tank her turda [rastgele tam sayı 1-5] bloğuyla gizli sayı üretsin ve o kadar bip çalsın (sinyal yayını). Ekran KAPALI — sayıyı sadece KULAĞINLA sayacaksın! Sonra tank ekranda △ gösterip cevap bekler: kumandadan doğru rakama basarsan → ✓ + yeşil + zafer sesi + skor+1. Yanlışsa → ✗ + kırmızı + doğru cevabı çubukla göster. Skor değişkeni matriste % dolum olarak artsın (skor x 20). 5 doğruda görev tamam — sinyal istihbaratçısı oldun!',
 'skor=0. [sonsuz döngü{ gizli=[rastgele 1-5]; [tekrarla gizli kez{ Ses 900Hz 150ms; bekle 0.3sn }]; [Ekranda △]; cevap bekle; eğer [basılan tuş = gizli] → ✓+yeşil+skor=skor+1+[% dolum skor*20] · değilse → ✗+kırmızı+[çubuk gizli]; eğer skor=5 → zafer+dur }]',
 '["Rastgele sayı üretimi","Değişkenle karşılaştırma (girdi = hedef?)","Skor tutma ve görselleştirme","Döngü sayısını değişkene bağlama","Oyun döngüsü (game loop) tasarımı"]'::jsonb,
 28, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 29, 'Devriye Modu: Gece Nöbeti', 'OP-5 Komando Sınavı', 5, 35, 45, '🔁',
 '📻 KARARGÂH: "Nöbetçi tank sabaha kadar tur atar, her turu rapor eder, 5. turda nöbeti devreder." GÖREV: Tank parkurda kesintisiz devriye atsın. ''tur'' değişkeni: BİTİŞ bandından her geçişte +1 (çift saymayı önle — 15. görevdeki kenar tetikleme!). Her turda: matris % dolum = tur x 20, kısa rapor melodisi, halka rengi değişsin (1.tur mavi, 2.sarı, 3.mor, 4.beyaz). tur 5 olunca: dur, nöbet devri marşı, ekranda kayan yazı NOBET TAMAM. Ekstra komando şartı: devriye boyunca engel güvenliği (21) hep aktif — nöbette gafil avlanmak yok!',
 'tur=0. Devriye döngüsü (çizgi+engel güvenlik) + bant kenar tetiklemeli sayım: [eğer bant algılandı → tur=tur+1 + [% dolum tur*20] + rapor sesi + [eğer tur=1→mavi · 2→sarı · 3→mor · 4→beyaz]]. [eğer tur>=5 → [dur]+marş+[Ekranda kaydır NOBET TAMAM]+çık].',
 '["Uzun süreli döngüde veri biriktirme","Koşullu döngü sonlandırma","Tur/durum başına farklı davranış","Güvenlik katmanının kalıcılığı","Dayanıklılık testi (kod 5 tur boyunca hatasız)"]'::jsonb,
 29, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 30, 'KURMAY SINAVI', 'OP-5 Komando Sınavı', 5, 40, 50, '⭐',
 '📻 KARARGÂH: "TEĞMENLİK SINAVI! Kurmay heyeti (eğitmen) karşında — emirler CANLI gelecek, hazır kod yok!" GÖREV: Eğitmen sınav anında 3 emir seçer, örnekler: ''DUR-KALK bekleme süresini butonla ayarlanır yap'', ''düşman görünce mors ile T harfi çal'', ''parkuru TERS yönden tur at'', ''vites sistemini devriyeye ekle''. Her emri 10 dakikada blokla çöz, çalıştır, kurmaya SUN: hangi blokları neden seçtin, değişkenlerin ne işe yarıyor, kodun nerede karar veriyor? Kod çalışması yetmez — ANLATAMAYAN terfi alamaz! 3 emirde başarı = Teğmen rütbesi + kamera operasyonu yetkisi.',
 'Sabit cevap yok — değerlendirme ölçütleri: (1) doğru blok seçimi, (2) değişken/koşul/döngü/fonksiyonun yerinde kullanımı, (3) çalışan çözüm, (4) SÖZLÜ açıklama: kod akışını kendi cümleleriyle anlatması. Eğitmen 3 emri öğrenciye göre seçer.',
 '["Tüm kavramların sözlü + pratik sınavı","Görülmemiş problemi bloklarla modelleme","Kodunu başkasına anlatma (rubber duck)","Zaman baskısında çalışma","TEĞMEN TERFİSİ — OP-5 finali"]'::jsonb,
 30, true, extract(epoch from now())*1000, extract(epoch from now())*1000),

-- ═══════════ OP-6: KARTAL GÖZÜ — ESP32-CAM (31-36) — KİLİTLİ ═══════════
-- Kamera gelince: UPDATE bb_tasks SET active=true WHERE kit='tank' AND task_id>=31;

('tank', 31, 'Kartal Gözü: Göz Montajı', 'OP-6 Kartal Gözü 🔒', 4, 30, 35, '📷',
 '📻 KARARGÂH: "GİZLİ OPERASYON BAŞLADI! Tanka ESP32-CAM keşif kamerası takılıyor — artık tankın GÖZÜ var." GÖREV: Kamerayı eğitmenle birlikte taretine monte et, kablolamayı şemaya göre yap. Kameranın WiFi yayınını telefon/tablette aç, canlı görüntüyü gör. Kamera açısını ayarla: hem yakın zemin (çizgi) hem 1 metre ilerisi kadrajda olacak. İlk keşif fotoğrafını çek ve birlik panosuna as! Kontrol listesi: görüntü akıyor mu, açı doğru mu, kablo palete değiyor mu?',
 'Donanım görevi: montaj + kablolama + WiFi yayını doğrulama + açı kalibrasyonu. Başarı ölçütü: sarsıntıda kopmayan bağlantı, hem zemini hem ufku gören kadraj, çekilmiş 1 keşif fotoğrafı.',
 '["Kamera modülü donanımı","WiFi üzerinden görüntü aktarımı kavramı","Kadraj ve görüş açısı","Kablolama disiplini","Donanım-yazılım entegrasyonuna giriş"]'::jsonb,
 31, false, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 32, 'Kör Uçuş: FPV Sürüş', 'OP-6 Kartal Gözü 🔒', 5, 35, 45, '🥽',
 '📻 KARARGÂH: "Gerçek tankçı kapağı kapalı sürer — sadece periskoptan bakar! Sen de öylesin artık." GÖREV: 12. görevdeki kumanda kodun yüklü. Tanka SIRTIN DÖNÜK oturacaksın, tankı GÖRMEK YASAK — sadece tabletteki kamera yayınından bakarak parkurda Başlangıç→Bitiş süreceksin. Görüntüde küçük gecikme (latency) var: komutu erken vermeyi öğren! Duvara/engele çarpma = 5 sn ceza. Süre tutulur. Bu, gerçek İHA ve drone operatörlerinin çalışma şekli — FPV (First Person View).',
 'Kod: 12. görevin kumanda programı (değişiklik yok). Sınanan şey pilotluk: FPV''de derinlik algısı, gecikme telafisi, küçük düzeltmelerle sürüş. Başarı: çarpmadan (veya en az cezayla) tur.',
 '["FPV (birinci şahıs görüş) kavramı","Gecikme (latency) ve telafisi","Ekran üzerinden mekânsal algı","İnsan-makine arayüzü deneyimi","Drone/İHA operatörlüğüne giriş"]'::jsonb,
 32, false, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 33, 'Foto İstihbarat', 'OP-6 Kartal Gözü 🔒', 5, 35, 45, '🗂️',
 '📻 KARARGÂH: "Karargâh cephe raporu istiyor: 5 hedefin fotoğrafı — STOP tabelası, düşman tankı, engel kayası, renk şeritleri ve teslimat kutusu!" GÖREV: FPV sürüşle (32) parkuru gez, her hedefin önünde dur, kadraja al, fotoğraf çek. Kural: fotoğraf NET ve hedef MERKEZDE olacak — bulanık istihbarat, istihbarat değildir! 5 fotoğrafı topla, her birine künye yaz (hedef adı + parkurdaki konumu: kuzeydoğu köşesi gibi — haritadaki pusulayı kullan!). Rapor dosyanı kurmaya sun.',
 'FPV sürüş + hedef önünde [dur] + kadraj ayarı + çekim. Değerlendirme: 5/5 hedef, netlik, merkezleme, künye doğruluğu (pusula yönleriyle konum). Harita okuma + fotoğrafçılık + sürüş bir arada.',
 '["Görev planlama (5 hedefli rota)","Hassas konumlanma ve kadrajlama","Harita ve pusula yönleri okuma","Veri etiketleme (künye) disiplini","Raporlama kültürü"]'::jsonb,
 33, false, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 34, 'Renk Kilidi: Küp Alanı', 'OP-6 Kartal Gözü 🔒', 5, 40, 50, '🧊',
 '📻 KARARGÂH: "KÜP ALANI''ndaki sandıklardan sadece biri bizim: karargâh sana renk kodunu son anda bildirecek!" GÖREV: Parkurun küp alanında 4 renkli bölge var (kırmızı, mavi, sarı, gri). Eğitmen sınav anında hedef rengi söyler (örn. MAVİ). Sen FPV kameradan bakarak tankı doğru renk bölgesine sür ve bölgenin içinde dur. Kamera görüntüsündeki rengi ZEMİNDEKİ tonlarla karşılaştırıp karar vereceksin — ekran renkleri ışığa göre değişir, dikkat! Doğru bölge = halka o renge boyanır + zafer sesi (rengi koda kumanda tuşuyla bildir: 1=kırmızı 2=mavi 3=sarı). Yanlış bölge = alarm, 1 deneme hakkı yanar.',
 'FPV sürüş + hedef bölgede [dur]. Onay kodu: [eğer Kumandada 1 → Halka kırmızı · 2 → Halka mavi · 3 → Halka sarı] + zafer/alarm sesi (eğitmen doğrular). Kameradan renk ayırt etme insan gözüyle — ileride yazılıma taşınacak temel.',
 '["Kamerayla renk ayırt etme","Ekran rengi vs gerçek renk (ışık etkisi)","Hedefe hassas navigasyon","Koşullu onay protokolü","Görüntü işlemeye zihinsel hazırlık"]'::jsonb,
 34, false, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 35, 'Hedef Takibi', 'OP-6 Kartal Gözü 🔒', 5, 40, 50, '🎯',
 '📻 KARARGÂH: "Hareketli hedef tespit edildi! Gözünü ondan ayırma — takip mesafesini koru." GÖREV: Eğitmen elinde parlak renkli bir hedef kartıyla (örn. sarı A4) parkurda yavaşça yürür. Sen FPV''den bakarak tankı hedefi izleyecek şekilde sürersin: hedef görüntüde SOLA kayarsa sola dön, SAĞA kayarsa sağa, KÜÇÜLÜRSE (uzaklaşıyor) hızlan, BÜYÜRSE (çok yakınsın!) dur/geri. 20-40 cm mesafe bandını koru — mesafe sensörünü yardımcı olarak matriste % dolumla göster. 2 dakika kesintisiz takip = görev tamam. Bugün senin gözünle yapılan bu takip, gelecek görevde tamamen otomatik olacak!',
 'FPV pilotaj + destek kodu: [sonsuz döngü{ Ekranda % dolum ← [mesafe cm] map 0-60; eğer [mesafe] < 20 → uyarı bip }]. Takip kararları (yön/hız) insan; sensör göstergesi yazılım. Görüntüdeki konum/boyut → yön/hız kuralları sözlü sınanır.',
 '["Görsel takip mantığı (konum→yön, boyut→mesafe)","İnsan destekli otomasyon (yarı otonom)","Sensörü yardımcı gösterge yapma","Mesafe bandı koruma","Nesne takibi algoritmalarına zihinsel temel"]'::jsonb,
 35, false, extract(epoch from now())*1000, extract(epoch from now())*1000),

('tank', 36, 'OTONOM KEŞİF: Son Görev', 'OP-6 Kartal Gözü 🔒', 5, 45, 50, '🦅',
 '📻 KARARGÂH: "YÜZBAŞILIK GÖREVİ — Kartal Gözü operasyonunun finali! Tank artık HEM çizgiyi HEM kamerayı kullanarak yarı-otonom keşfe çıkıyor." GÖREV: Tank çizgi takibiyle KENDİ BAŞINA devriye atar (25. görev kodun). Sen komuta masasında sadece FPV ekranını izlersin — ellerin kumandada ama SADECE müdahale için: ekranda tehlike görürsen (engel, çıkmaz, hedef) OK ile tankı durdurur (27. görev kesmesi!), gerekiyorsa elle sürer, sonra 3 tuşuyla otonomiye geri devredersin. 3 tur boyunca: tank ne kadar az müdahaleyle döndüyse o kadar yüksek puan. Bu, gerçek otonom araçların test edilme şekli: yazılım sürer, insan denetler. TERFİ TÖRENİNDE GÖRÜŞÜRÜZ YÜZBAŞI! 🎖️',
 'Kod = 25 (otonom tur) + 27 (OK kesmesi) + 12 (elle sürüş modu) birleşimi. mod değişkeni: 0=otonom, 1=manuel. [OK → mod=1+dur] · [3 → mod=0]. mod=0''da çizgi takibi, mod=1''de kumanda blokları. Puan: müdahale sayısı ters orantılı.',
 '["Yarı-otonom sistem mimarisi","Mod değişkeniyle çalışma kipi yönetimi","İnsan denetimli otonomi (human-in-the-loop)","Üç büyük programın tek çatıda birleşimi","YÜZBAŞI TERFİSİ — müfredat finali"]'::jsonb,
 36, false, extract(epoch from now())*1000, extract(epoch from now())*1000);

-- Kontrol
SELECT task_id, title, category, difficulty, active FROM bb_tasks WHERE kit='tank' ORDER BY task_id;
