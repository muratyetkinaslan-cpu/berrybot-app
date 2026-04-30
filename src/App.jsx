import { useState, useEffect, useCallback, useRef } from "react";
import { useData, getLocalPhoto } from "./useData";
import BerryBot3D from "./BerryBot3D";

// ═══════════════════════════════════════════════════════════
//  BerryBot LMS — Production (Supabase)
//  Görseller: public/tasks/gorev_1/ ... gorev_36/
//  Her klasöre: gorsel.jpg, cevap.jpg
// ═══════════════════════════════════════════════════════════

const ROLES = { ADMIN:"admin", INSTRUCTOR:"instructor", STUDENT:"student", PARENT:"parent" };
const TS = { LOCKED:"locked", ACTIVE:"active", IN_PROGRESS:"in_progress", PENDING:"pending_review", APPROVED:"approved", REJECTED:"rejected" };
const SL = { locked:"Kilitli", active:"Aktif", in_progress:"Devam Ediyor", pending_review:"Onay Bekliyor", approved:"Onaylandı", rejected:"Reddedildi" };
const T = { bg:"#1a1035", card:"#231845", input:"#15102a", dark:"#110d20", purple:"#6B3FA0", pl:"#9b6fd0", pd:"#4a2670", orange:"#F5922A", ol:"#ffb347", od:"#c96f10", border:"#3a2860", tp:"#f0e8ff", ts:"#a090c0", tm:"#6b5a90", ok:"#4ade80", err:"#f87171", warn:"#fbbf24", cyan:"#22d3ee" };

// ─── TASK IMAGE COMPONENT ───
function TaskImage({ taskId, type = "gorsel", size = 60, fallbackEmoji = "📋", style = {} }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const src = `/tasks/gorev_${taskId}/${type}.jpg`;
  if (error) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${T.purple}30, ${T.dark})`,
        fontSize: size * 0.5, flexShrink: 0, ...style
      }}>
        {fallbackEmoji}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative", background: T.dark, ...style }}>
      <img src={src} alt={`Görev ${taskId}`} onLoad={() => setLoaded(true)} onError={() => setError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .3s" }}/>
      {!loaded && !error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5 }}>
          {fallbackEmoji}
        </div>
      )}
    </div>
  );
}

function AnswerImage({ taskId }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const src = `/tasks/gorev_${taskId}/cevap.jpg`;
  if (error) return null;
  return (
    <div style={{ marginTop: 6, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.purple}44`, maxWidth: 400 }}>
      <img src={src} alt={`Cevap ${taskId}`} onLoad={() => setLoaded(true)} onError={() => setError(true)}
        style={{ width: "100%", objectFit: "contain", display: loaded ? "block" : "none" }}/>
      {!loaded && <div style={{ padding: 10, fontSize: 10, color: T.tm }}>Cevap görseli yükleniyor...</div>}
    </div>
  );
}

// ─── TABLE PRESETS ───
const TABLE_PRESETS = {
  "2li":  { label:"2'li Masa",     cols:2, rows:1, seats:2 },
  "4lu":  { label:"4'lü Masa",     cols:2, rows:2, seats:4 },
  "6li":  { label:"6'lı Masa 3+3", cols:2, rows:3, seats:6 },
  "8li":  { label:"8'li Masa 4+4", cols:2, rows:4, seats:8 },
};
const WOOD = {
  bg: "linear-gradient(145deg, #8B6914, #6B4F12, #8B6914)",
  border: "#5C4010", headerBg: "#6B4F12", text: "#F5E6C8", textDim: "#C4A868",
};

// ─── 36 TASKS — kazanımlar (learnings) velilerin görmesi için ───
const TASKS=[
  {id:1,title:"RGB LED Yakma",cat:"RGB LED",diff:1,expectedMin:8,xp:10,img:"💡",desc:"Kırmızı, Yeşil, Mavi LED'leri ayrı ayrı yak.",answer:"Doğru blok: set_rgb(255,0,0)",learnings:["RGB renk sistemi","Pin çıkışı kontrolü","Temel blok kod yazımı"]},
  {id:2,title:"LED Renk Karışımı",cat:"RGB LED",diff:1,expectedMin:10,xp:10,img:"🌈",desc:"İki rengi karıştırarak yeni renk elde et.",answer:"set_rgb(255,255,0) → sarı",learnings:["Renk karışımı (additive)","RGB değer kombinasyonları","Yaratıcı düşünme"]},
  {id:3,title:"LED Yanıp Sönme",cat:"RGB LED",diff:2,expectedMin:12,xp:15,img:"✨",desc:"LED'i 1 saniye aralıkla yanıp söndür.",answer:"while true: set_rgb → wait(1) → off → wait(1)",learnings:["Sonsuz döngü kavramı","Zamanlama (delay)","Durum değişimi"]},
  {id:4,title:"Gökkuşağı Efekti",cat:"RGB LED",diff:2,expectedMin:15,xp:15,img:"🌈",desc:"Sırayla 7 rengi göster.",answer:"7 renk döngüsü",learnings:["Sıralı işlem","Renk geçişleri","Animasyon mantığı"]},
  {id:5,title:"SOS Sinyali",cat:"RGB LED",diff:3,expectedMin:15,xp:20,img:"🆘",desc:"Mors koduyla SOS sinyali gönder.",answer:"3 kısa, 3 uzun, 3 kısa",learnings:["Mors kodu","Desen tekrarı","Zamanlama hassasiyeti","İletişim sistemleri"]},
  {id:6,title:"Nefes Alan LED",cat:"RGB LED",diff:3,expectedMin:18,xp:20,img:"💫",desc:"LED parlaklığını yavaşça artır azalt.",answer:"for loop ile PWM",learnings:["PWM (Pulse Width Modulation)","Yumuşak geçiş","Sayaç döngüleri"]},
  {id:7,title:"Motor İleri Geri",cat:"Motor",diff:2,expectedMin:12,xp:15,img:"⚙️",desc:"Motoru ileri ve geri hareket ettir.",answer:"motor.forward() / motor.backward()",learnings:["DC motor kontrolü","Yön belirleme","Hareketin temel komutları"]},
  {id:8,title:"Hız Kontrolü",cat:"Motor",diff:2,expectedMin:15,xp:15,img:"🏎️",desc:"Motor hızını kademeli artır.",answer:"speed değişkeni ile PWM",learnings:["Değişken kullanımı","Kademeli kontrol","PWM ile hız ayarı"]},
  {id:9,title:"Kare Çizme",cat:"Motor",diff:3,expectedMin:25,xp:25,img:"◻️",desc:"Robotla kare şekli çiz.",answer:"4x ileri+90° dönüş",learnings:["Geometri (kare)","Döngü ile tekrar","Açı kavramı (90°)","Adım adım planlama"]},
  {id:10,title:"Buzzer Melodisi",cat:"Sensör+LED+Buzzer",diff:1,expectedMin:8,xp:10,img:"🔔",desc:"Buzzer ile basit melodi çal.",answer:"tone(freq, dur)",learnings:["Frekans ve ses","Müzik notası mantığı","Süre kontrolü"]},
  {id:11,title:"Işık Sensörü Okuma",cat:"Sensör+LED+Buzzer",diff:2,expectedMin:12,xp:15,img:"☀️",desc:"Işık sensöründen değer oku ve göster.",answer:"light = ldr.read()",learnings:["Sensör verisi okuma","Analog değerler","LDR çalışma prensibi"]},
  {id:12,title:"Sıcaklık Alarmı",cat:"Sensör+LED+Buzzer",diff:2,expectedMin:15,xp:15,img:"🌡️",desc:"Sıcaklık eşik değeri geçince alarm ver.",answer:"if temp > 30: buzzer.on()",learnings:["Koşullu ifadeler (if)","Eşik değer","Sensör + aktüatör birleştirme"]},
  {id:13,title:"Işık Takip Başlangıç",cat:"Işık Sensörü",diff:2,expectedMin:12,xp:15,img:"🔦",desc:"Işık kaynağına doğru dön.",answer:"LDR farkına göre motor yönlendir",learnings:["İki sensör karşılaştırma","Yönlendirme algoritması","Tepkisel davranış"]},
  {id:14,title:"Işık Yoğunluk Haritası",cat:"Işık Sensörü",diff:3,expectedMin:18,xp:20,img:"🗺️",desc:"Ortamdaki ışık dağılımını LED ile göster.",answer:"LDR oku → RGB map",learnings:["Veri görselleştirme","Aralık eşleştirme (map)","Çoklu sensör"]},
  {id:15,title:"IR Kumanda Okuma",cat:"IR Kumanda",diff:2,expectedMin:12,xp:15,img:"📡",desc:"IR kumandadan sinyal al ve göster.",answer:"ir.read() → serial",learnings:["Kızılötesi iletişim","Tuş kodları","Seri port debug"]},
  {id:16,title:"Kumanda ile LED",cat:"IR Kumanda",diff:2,expectedMin:15,xp:15,img:"🎮",desc:"Kumanda tuşlarıyla LED rengini değiştir.",answer:"if key==1: red, key==2: green",learnings:["Çoklu koşul (if/elif)","Kullanıcı girdisi","Etkileşimli sistem"]},
  {id:17,title:"Kumanda ile Motor",cat:"IR Kumanda",diff:3,expectedMin:25,xp:25,img:"🕹️",desc:"Kumandayla robotu yönlendir.",answer:"key mapping → motor direction",learnings:["Uzaktan kumanda mantığı","Tuş eşleme","Gerçek zamanlı kontrol"]},
  {id:18,title:"Fonksiyon Tanımlama",cat:"Fonksiyon",diff:2,expectedMin:15,xp:15,img:"📦",desc:"Tekrarlayan işlemi fonksiyon yap.",answer:"def my_func(): ...",learnings:["Fonksiyon kavramı","Kod tekrarını önleme","Modüler programlama"]},
  {id:19,title:"Mesafe Ölçme",cat:"Mesafe/Navigasyon",diff:2,expectedMin:12,xp:15,img:"📏",desc:"Ultrasonik sensörle mesafe ölç.",answer:"dist = ultrasonic.read()",learnings:["Ultrasonik dalgalar","Mesafe hesaplama","Birim dönüşümleri (cm)"]},
  {id:20,title:"Otonom Navigasyon",cat:"Mesafe/Navigasyon",diff:4,expectedMin:30,xp:30,img:"🧭",desc:"Engellere çarpmadan ilerle.",answer:"if dist < 20: turn()",learnings:["Otonom karar verme","Sensör entegrasyonu","Reaktif robotik","Güvenlik mesafesi"]},
  {id:21,title:"Engel Algılama",cat:"Engel Algılama",diff:3,expectedMin:18,xp:20,img:"🚧",desc:"Önündeki engeli tespit et ve dur.",answer:"while dist > 15: forward()",learnings:["While döngüsü","Sürekli kontrol","Acil durdurma"]},
  {id:22,title:"Engelden Kaçınma",cat:"Engel Algılama",diff:4,expectedMin:30,xp:30,img:"🔀",desc:"Engel varsa etrafından dolaş.",answer:"detect → turn → check → forward",learnings:["Çok adımlı strateji","Algılama-eylem döngüsü","Problem çözme"]},
  {id:23,title:"Çizgi Algılama",cat:"Çizgi Takip",diff:2,expectedMin:12,xp:15,img:"➖",desc:"Siyah çizgiyi sensörle algıla.",answer:"line = ir_sensor.read()",learnings:["Yansıma sensörleri","Siyah/beyaz ayrımı","İkili veri (binary)"]},
  {id:24,title:"Çizgi Takip Basit",cat:"Çizgi Takip",diff:3,expectedMin:25,xp:25,img:"〰️",desc:"Basit çizgi takip robotu yap.",answer:"if left: turn_right, if right: turn_left",learnings:["Bang-bang kontrol","Çizgi takip algoritması","Sensör konumlandırma"]},
  {id:25,title:"Kesişim Yönetimi",cat:"Çizgi Takip",diff:4,expectedMin:30,xp:30,img:"✖️",desc:"Çizgi kesişimlerinde doğru karar ver.",answer:"count intersections → decide",learnings:["Sayaç değişkeni","Karar mekanizması","Harita mantığı"]},
  {id:26,title:"Hızlı Çizgi Takip",cat:"Çizgi Takip",diff:5,expectedMin:40,xp:40,img:"⚡",desc:"PID kontrolle hızlı çizgi takip.",answer:"PID: error*Kp + integral*Ki + derivative*Kd",learnings:["PID kontrol algoritması","Hata düzeltme","İleri matematik kullanımı","Optimizasyon"]},
  {id:27,title:"Sumo Duruş",cat:"Sumo Robot",diff:2,expectedMin:15,xp:15,img:"🤼",desc:"Ring içinde kal, dışarı çıkma.",answer:"if edge: backward + turn",learnings:["Sınır algılama","Savunma davranışı","Acil tepki"]},
  {id:28,title:"Rakip Bulma",cat:"Sumo Robot",diff:3,expectedMin:25,xp:25,img:"🔍",desc:"Ultrasonik ile rakibi bul.",answer:"scan 360° → closest target",learnings:["Tarama (scanning)","Hedef takibi","Mesafe karşılaştırma"]},
  {id:29,title:"Sumo Saldırı",cat:"Sumo Robot",diff:3,expectedMin:25,xp:25,img:"💥",desc:"Rakibi bul ve it.",answer:"detect → full speed forward",learnings:["Hedef kilitleme","Maksimum güç kullanımı","Rekabetçi strateji"]},
  {id:30,title:"Sumo Strateji",cat:"Sumo Robot",diff:4,expectedMin:35,xp:35,img:"🧠",desc:"Savunma ve saldırı stratejisi.",answer:"state machine: search/attack/defend",learnings:["Durum makinesi","Stratejik düşünme","Çoklu mod yönetimi","Yapay zeka temelleri"]},
  {id:31,title:"Mini Sumo Turnuva",cat:"Sumo Robot",diff:4,expectedMin:35,xp:35,img:"🏆",desc:"Turnuva kurallarına uygun sumo robotu.",answer:"combine all sumo skills",learnings:["Kural odaklı tasarım","Tüm becerileri birleştirme","Rekabet hazırlığı"]},
  {id:32,title:"Sumo Şampiyonu",cat:"Sumo Robot",diff:5,expectedMin:45,xp:50,img:"👑",desc:"En iyi sumo stratejisini geliştir.",answer:"adaptive strategy",learnings:["Adaptif algoritma","Rakip analizi","Yapay zeka davranışı","İleri robotik"]},
  {id:33,title:"Işık Kaynağı Bulma",cat:"Işık Takip",diff:3,expectedMin:18,xp:20,img:"💡",desc:"En parlak ışık kaynağına git.",answer:"compare LDRs → move toward max",learnings:["Maksimum bulma","Gradyan takibi","Çoklu sensör birleşimi"]},
  {id:34,title:"Işıktan Kaçınma",cat:"Işık Takip",diff:3,expectedMin:18,xp:20,img:"🌑",desc:"Karanlık bölgeye git.",answer:"move toward min light",learnings:["Minimum bulma","Negatif fototaksis","Davranış değiştirme"]},
  {id:35,title:"Işık Labirenti",cat:"Işık Takip",diff:4,expectedMin:30,xp:35,img:"🌟",desc:"Işık ipuçlarıyla labirentten çık.",answer:"follow light gradient",learnings:["Labirent çözme","İpucu takibi","Karmaşık navigasyon"]},
  {id:36,title:"Final Projesi",cat:"Işık Takip",diff:5,expectedMin:60,xp:50,img:"🎓",desc:"Tüm becerileri birleştiren proje.",answer:"combined autonomous robot",learnings:["Sistem entegrasyonu","Proje tasarımı","Sunum becerileri","Otonom robot"]},
];

// ─── LEVELS ───
const LEVELS=[
  {lv:1,name:"Steve Wozniak",min:0,icon:"🔧",color:"#94a3b8",title:"Apple Kurucu Mühendisi",fact:"İlk kişisel bilgisayarı garajında yaptı"},
  {lv:2,name:"Linus Torvalds",min:30,icon:"🐧",color:"#22d3ee",title:"Linux Yaratıcısı",fact:"22 yaşında dünyanın en büyük işletim sistemini yazdı"},
  {lv:3,name:"Grace Hopper",min:80,icon:"💻",color:"#facc15",title:"Bilgisayar Bilimi Öncüsü",fact:"İlk derleyiciyi (compiler) icat etti"},
  {lv:4,name:"Ada Lovelace",min:150,icon:"📜",color:"#34d399",title:"İlk Programcı",fact:"Tarihteki ilk bilgisayar programını yazdı"},
  {lv:5,name:"Alan Turing",min:250,icon:"🧠",color:"#fb923c",title:"Yapay Zeka Babası",fact:"Modern bilgisayarın matematiksel temellerini kurdu"},
  {lv:6,name:"Marie Curie",min:370,icon:"⚛️",color:"#a78bfa",title:"Fizikçi & Kimyager",fact:"İki farklı dalda Nobel kazanan tek kişi"},
  {lv:7,name:"Nikola Tesla",min:500,icon:"⚡",color:"#f472b6",title:"Elektrik Dehası",fact:"Modern elektrik şebekesini icat etti"},
  {lv:8,name:"Albert Einstein",min:640,icon:"🧬",color:"#60a5fa",title:"Teorik Fizikçi",fact:"E=mc² ile fiziği yeniden tanımladı"},
  {lv:9,name:"Steve Jobs",min:770,icon:"🍎",color:"#fbbf24",title:"Apple Vizyoneri",fact:"Teknolojiyi sanatla buluşturdu"},
  {lv:10,name:"Elon Musk",min:900,icon:"🚀",color:"#ff6b9d",title:"BerryBot Master Mühendisi",fact:"İnsanlığı Mars'a taşımak için çalışıyor"},
];
const getLevel=(xp)=>{let l=LEVELS[0];for(const lv of LEVELS)if(xp>=lv.min)l=lv;return l;};

// ═══════════════════════════════════════════════════════════════
// PRACTICE QUESTIONS — Robotik & Yazılım kavramları
// ═══════════════════════════════════════════════════════════════
const QUIZ=[
  // ─── RGB LED ───
  {id:"q_rgb_1",topic:"RGB LED",q:"RGB LED'inde 'R' harfi hangi rengi temsil eder?",opts:["Red (Kırmızı)","Rainbow","Round","Rapid"],ans:0,xp:5},
  {id:"q_rgb_2",topic:"RGB LED",q:"set_rgb(0,255,0) komutu LED'i hangi renge ayarlar?",opts:["Kırmızı","Yeşil","Mavi","Beyaz"],ans:1,xp:5},
  {id:"q_rgb_3",topic:"RGB LED",q:"set_rgb(255,255,0) hangi renk olur?",opts:["Mor","Sarı","Camgöbeği","Pembe"],ans:1,xp:8},
  {id:"q_rgb_4",topic:"RGB LED",q:"RGB değer aralığı kaçtan kaça kadardır?",opts:["0-100","0-255","0-1024","-128 ile 127"],ans:1,xp:5},
  {id:"q_rgb_5",topic:"RGB LED",q:"Tüm değerler 0 olduğunda LED ne yapar?",opts:["Beyaz yanar","Kırmızı yanar","Söner (kapalı)","Yanıp söner"],ans:2,xp:5},

  // ─── Motor ───
  {id:"q_mot_1",topic:"Motor",q:"DC motor robotu hareket için nasıl kontrol edilir?",opts:["Sadece açıp kapamak","Hız ve yön kontrolü","Sadece ses","Sadece ışık"],ans:1,xp:5},
  {id:"q_mot_2",topic:"Motor",q:"Robotun ileri gitmesi için iki motor nasıl çalışmalı?",opts:["İkisi ters","İkisi aynı yön ileri","Biri durmalı","Biri ters biri ileri"],ans:1,xp:5},
  {id:"q_mot_3",topic:"Motor",q:"Robotun sağa dönmesi için ne yapılır?",opts:["İki motor da ileri","Sol motor ileri sağ motor geri","İki motor geri","İki motor durur"],ans:1,xp:8},
  {id:"q_mot_4",topic:"Motor",q:"PWM nedir?",opts:["Permanent Wave Motor","Pulse Width Modulation","Power Wire Mode","Programlama Web Modu"],ans:1,xp:10},
  {id:"q_mot_5",topic:"Motor",q:"Motor hızı %50 demek nedir?",opts:["Yarım voltaj","PWM duty %50","Yarı dönüş","2 saniye gider"],ans:1,xp:8},

  // ─── Sensör ───
  {id:"q_sen_1",topic:"Sensörler",q:"Ultrasonik sensör neyi ölçer?",opts:["Sıcaklık","Mesafe","Renk","Ses"],ans:1,xp:5},
  {id:"q_sen_2",topic:"Sensörler",q:"Çizgi takip sensörü hangi prensiple çalışır?",opts:["Manyetik alan","Işık yansıması","Ses dalgası","Hava basıncı"],ans:1,xp:8},
  {id:"q_sen_3",topic:"Sensörler",q:"LDR sensörü neyi algılar?",opts:["Sıcaklık","Işık","Hareket","Nem"],ans:1,xp:5},
  {id:"q_sen_4",topic:"Sensörler",q:"IR sensörü ne işe yarar?",opts:["Su geçirmezlik","Kızılötesi sinyal almak","Renk algılamak","GPS"],ans:1,xp:8},
  {id:"q_sen_5",topic:"Sensörler",q:"Ultrasonik sensör 30cm görürse engel hakkında ne söylenir?",opts:["Yakın","Uzak","Sensör bozuk","Renk siyah"],ans:0,xp:5},

  // ─── Buzzer ───
  {id:"q_buz_1",topic:"Buzzer",q:"Buzzer ne işe yarar?",opts:["Işık verir","Ses üretir","Hareket eder","Mesafe ölçer"],ans:1,xp:5},
  {id:"q_buz_2",topic:"Buzzer",q:"Buzzer'da 440 Hz değeri hangi notayı temsil eder?",opts:["Do","Re","La","Sol"],ans:2,xp:10},

  // ─── IR Kumanda ───
  {id:"q_ir_1",topic:"IR Kumanda",q:"IR kumanda hangi dalga boyu ile çalışır?",opts:["Görünür ışık","Kızılötesi","Ultraviyole","Radyo dalgası"],ans:1,xp:8},
  {id:"q_ir_2",topic:"IR Kumanda",q:"IR alıcısı kaç pin ile bağlanır genelde?",opts:["1","2","3","5"],ans:2,xp:8},

  // ─── Programlama Temelleri ───
  {id:"q_prog_1",topic:"Programlama",q:"Bir değişken neye benzer?",opts:["Sabit kutu","Etiketli bir kutu","Çıkmaz sokak","Sadece sayı"],ans:1,xp:5},
  {id:"q_prog_2",topic:"Programlama",q:"Robotun karar vermesi için kullandığımız blok nedir?",opts:["if (eğer)","print","wait","loop"],ans:0,xp:5},
  {id:"q_prog_3",topic:"Programlama",q:"Tekrar etmesi için kullandığımız yapı?",opts:["if","while/for","def","import"],ans:1,xp:5},
];

// ─── KOD CHALLENGE (öğrencinin kodu seçmesi) ───
const CODE_CHALLENGES=[
  {id:"c_if_1",topic:"if/else",q:"Mesafe 20cm'den küçükse robotu durdur, yoksa devam ettir.",opts:[
    `if mesafe < 20:\n  dur()\nelse:\n  ileri()`,
    `while mesafe < 20:\n  dur()`,
    `if mesafe > 20:\n  dur()`,
    `for i in mesafe:\n  dur()`,
  ],ans:0,xp:10},
  {id:"c_if_2",topic:"if/else",q:"Çizgi sensörü siyah görürse ileri, beyaz görürse dur.",opts:[
    `if cizgi == "siyah":\n  ileri()\nelse:\n  dur()`,
    `while True:\n  ileri()`,
    `if cizgi:\n  dur()`,
    `for c in cizgi:\n  ileri()`,
  ],ans:0,xp:10},
  {id:"c_elif_1",topic:"elif",q:"Mesafe 10'dan az = dur, 30'dan az = yavaş, yoksa hızlı.",opts:[
    `if m<10: dur()\nelif m<30: yavas()\nelse: hizli()`,
    `if m<10: dur()\nif m<30: yavas()\nif m>=30: hizli()`,
    `if m<10 and m<30: yavas()`,
    `while m<10: dur()`,
  ],ans:0,xp:15},
  {id:"c_while_1",topic:"while",q:"Engel olmayana kadar ileri git.",opts:[
    `while engel == False:\n  ileri()`,
    `if engel == False:\n  ileri()`,
    `for i in range(10):\n  ileri()`,
    `def ileri(): pass`,
  ],ans:0,xp:10},
  {id:"c_while_2",topic:"while",q:"5 saniye boyunca LED'i yanıp söndür.",opts:[
    `t=0\nwhile t<5:\n  led(1); bekle(0.5)\n  led(0); bekle(0.5)\n  t+=1`,
    `if t<5:\n  led(1)`,
    `for t in 5:\n  led(1)`,
    `led(1)\nled(0)`,
  ],ans:0,xp:15},
  {id:"c_for_1",topic:"for",q:"3 kez ileri-geri yap.",opts:[
    `for i in range(3):\n  ileri()\n  geri()`,
    `while i==3:\n  ileri()`,
    `if i<3:\n  geri()`,
    `def hareket(): pass`,
  ],ans:0,xp:10},
  {id:"c_for_2",topic:"for",q:"RGB LED'i kırmızı→yeşil→mavi yap (her biri 1 sn).",opts:[
    `for renk in [(255,0,0),(0,255,0),(0,0,255)]:\n  set_rgb(*renk); bekle(1)`,
    `set_rgb(255,255,255)`,
    `if renk: set_rgb(255,0,0)`,
    `while True: bekle(1)`,
  ],ans:0,xp:15},
  {id:"c_func_1",topic:"Fonksiyon",q:"saga_don() adlı bir fonksiyon nasıl tanımlanır? (Sol motor ileri, sağ motor geri)",opts:[
    `def saga_don():\n  sol_motor(50)\n  sag_motor(-50)`,
    `if saga_don():\n  pass`,
    `for d in saga_don:\n  pass`,
    `saga_don = 50`,
  ],ans:0,xp:15},
  {id:"c_func_2",topic:"Fonksiyon",q:"Bir mesafe parametresi alan ileriGit fonksiyonu.",opts:[
    `def ileriGit(mesafe):\n  while gidilen < mesafe:\n    ileri()`,
    `def ileriGit:\n  ileri()`,
    `if ileriGit(50): pass`,
    `mesafe = ileriGit`,
  ],ans:0,xp:18},
  {id:"c_var_1",topic:"Değişken",q:"hiz adlı bir değişken oluştur ve değeri 100 ata.",opts:[
    `hiz = 100`,
    `def hiz: 100`,
    `if hiz==100`,
    `hiz()`,
  ],ans:0,xp:5},
  {id:"c_op_1",topic:"Operatörler",q:"x değişkeninin 5'ten büyük VE 10'dan küçük olduğu durumu nasıl yazarsın?",opts:[
    `if x > 5 and x < 10:`,
    `if x > 5 or x < 10:`,
    `if x in 5..10:`,
    `if 5 < x < 10 +`,
  ],ans:0,xp:10},
  {id:"c_op_2",topic:"Operatörler",q:"İki sensörden BİRİ tetiklendiğinde alarm çal.",opts:[
    `if sensor1 or sensor2:\n  alarm()`,
    `if sensor1 and sensor2:\n  alarm()`,
    `if not sensor1:\n  alarm()`,
    `for s in sensor: alarm()`,
  ],ans:0,xp:10},
  {id:"c_logic_1",topic:"Mantık",q:"Robot duvara çarpmak üzereyken (mesafe<5) hem dur hem buzzer çal.",opts:[
    `if mesafe < 5:\n  dur()\n  buzzer()`,
    `if mesafe < 5: dur()\nif mesafe > 5: buzzer()`,
    `while mesafe<5: dur()`,
    `for m in mesafe: dur()`,
  ],ans:0,xp:12},
  {id:"c_sumo_1",topic:"Sumo",q:"Rakibi gördüğünde hızlı saldır, yoksa dön.",opts:[
    `if rakip_var:\n  hizli_ileri()\nelse:\n  don()`,
    `while rakip_var:\n  don()`,
    `if not rakip_var:\n  hizli_ileri()`,
    `for r in rakip: don()`,
  ],ans:0,xp:15},
  {id:"c_line_1",topic:"Çizgi Takip",q:"3 sensörlü çizgi takip — orta sensör çizgi görünce ileri.",opts:[
    `if orta == "siyah":\n  ileri()\nelif sol == "siyah":\n  saga_don()\nelse:\n  sola_don()`,
    `if orta: dur()`,
    `while orta: ileri()`,
    `for s in [sol,orta,sag]: ileri()`,
  ],ans:0,xp:18},
];

const getNextLevel=(xp)=>{const cur=getLevel(xp);const idx=LEVELS.indexOf(cur);return idx<LEVELS.length-1?LEVELS[idx+1]:null;};

// ─── FORMAT HELPERS ───
const ft=(ts)=>ts?new Date(ts).toLocaleString("tr-TR",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"}):"—";
const fd=(ms)=>{const m=Math.floor(ms/60000);return m<60?`${m}dk`:`${Math.floor(m/60)}sa ${m%60}dk`;};

// ═══ PERFORMANCE SCORING ═══
// Compares actual completion time vs expected time
// Returns 0-100 score + grade
function calcTaskScore(actualMs,expectedMin){
  if(!actualMs||!expectedMin)return null;
  const actualMin=actualMs/60000;
  const ratio=actualMin/expectedMin; // <1 = fast, 1 = on time, >1 = slow
  let score;
  if(ratio<=0.5)score=100;        // Çok hızlı (yarısında)
  else if(ratio<=0.8)score=95;    // Hızlı
  else if(ratio<=1.0)score=90;    // Beklendiği gibi
  else if(ratio<=1.3)score=80;    // Biraz uzun
  else if(ratio<=1.6)score=70;    // Uzun
  else if(ratio<=2.0)score=60;    // Çok uzun
  else if(ratio<=3.0)score=50;
  else score=40;
  return Math.round(score);
}
function gradeColor(score){
  if(!score)return T.tm;
  if(score>=90)return"#22c55e";   // Yeşil — Mükemmel
  if(score>=80)return"#3b82f6";   // Mavi — İyi
  if(score>=70)return"#f59e0b";   // Turuncu — Orta
  if(score>=60)return"#ef4444";   // Kırmızı — Zayıf
  return"#64748b";                 // Gri — Çok zayıf
}
function gradeLabel(score){
  if(!score)return"—";
  if(score>=95)return"⚡ ÇOK HIZLI";
  if(score>=90)return"⭐ MÜKEMMEL";
  if(score>=80)return"👍 İYİ";
  if(score>=70)return"⏱ ORTA";
  if(score>=60)return"🐌 YAVAŞ";
  return"😴 ÇOK YAVAŞ";
}
// Calculate avg score from all completed tasks for a student
function calcAvgScore(sp){
  const scores=[];
  TASKS.forEach(t=>{
    const tp=sp[t.id];
    if(tp?.status===TS.APPROVED&&tp.startedAt&&(tp.completedAt||tp.approvedAt)){
      const actual=(tp.completedAt||tp.approvedAt)-tp.startedAt;
      const s=calcTaskScore(actual,t.expectedMin);
      if(s)scores.push(s);
    }
  });
  if(scores.length===0)return null;
  return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
}

// ─── ICONS ───
const I = {
  Bot:()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  Logout:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Upload:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Check:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  X:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Clock:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Key:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78Zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Hand:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>,
  Folder:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>,
};
const Stars=({n})=><span style={{display:"inline-flex",gap:2,color:T.orange}}>{[1,2,3,4,5].map(i=><svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i<=n?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</span>;
const Badge=({s})=>{const c={locked:{bg:"#3b3155",t:"#8b7faa",b:"#4a3d6b"},active:{bg:"#2d1f5e",t:"#c4a1ff",b:"#6B3FA0"},in_progress:{bg:"#5c3a0e",t:"#ffb74d",b:"#e89830"},pending_review:{bg:"#3b2070",t:"#d4a5ff",b:"#8b5fcf"},approved:{bg:"#1a4a2e",t:"#6ee7b7",b:"#2d8a56"},rejected:{bg:"#5c1a1a",t:"#fca5a5",b:"#a33"}}[s]||{bg:"#333",t:"#999",b:"#555"};return<span style={{fontSize:12,padding:"3px 10px",borderRadius:6,background:c.bg,color:c.t,border:`1px solid ${c.b}`,fontWeight:600}}>{SL[s]||"—"}</span>;};
const Card=({children,style={}})=><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:18,...style}}>{children}</div>;
const NBtn=({a,o,children})=><button onClick={o} style={{fontSize:14,padding:"7px 16px",borderRadius:8,border:a?`1px solid ${T.orange}55`:"1px solid transparent",background:a?T.orange+"20":"transparent",color:a?T.orange:T.tm,cursor:"pointer",fontWeight:a?700:400}}>{children}</button>;

// ═══════════════════════════════════════
//  MAIN APP (Supabase backend)
// ═══════════════════════════════════════
export default function App() {
  const data = useData();
  const { loading, currentUser: user, users, progress: prog, logs, classLayout,
    practiceProg, homeworks, homeworkSubs, answerUnlocks,
    login: doLogin, logout, addUser, startTask, submitTask, approveTask,
    rejectTask, resubmitTask, requestHelp, clearHelp, saveLayout, setProgressTo, setCurrentPage, refresh,
    recordPractice, addHomework, removeHomework, sendHomework, reviewHw,
    toggleAnswerUnlock } = data;

  const [page,setPage]=useState("dash");
  const [selS,setSelS]=useState(null);
  const [selT,setSelT]=useState(null);
  const [notif,setNotif]=useState(null);

  const notify=(m,t="ok")=>{setNotif({m,t});setTimeout(()=>setNotif(null),3000);};
  const nav=(p)=>{setPage(p);setSelS(null);setSelT(null);};

  // Track current page for student (for parent visibility)
  useEffect(()=>{
    if(user?.role==="student"){
      let pageDesc="Görev Listesi (Mission Board)";
      let taskId=null;
      if(selT){pageDesc=`Görev #${selT.id}: ${selT.title}`;taskId=selT.id;}

      // Send page update with visibility status
      const send=()=>{
        const visible=document.visibilityState==="visible";
        const focused=document.hasFocus();
        const status=visible&&focused?"":" [⚠️ BAŞKA SEKMEDE]";
        const fullDesc=pageDesc+status;
        setCurrentPage(fullDesc,taskId);
      };

      send(); // Immediate
      const iv=setInterval(send,15000); // Every 15s

      // React to visibility changes immediately
      const onVis=()=>send();
      const onFocus=()=>send();
      const onBlur=()=>send();
      document.addEventListener("visibilitychange",onVis);
      window.addEventListener("focus",onFocus);
      window.addEventListener("blur",onBlur);

      return ()=>{
        clearInterval(iv);
        document.removeEventListener("visibilitychange",onVis);
        window.removeEventListener("focus",onFocus);
        window.removeEventListener("blur",onBlur);
      };
    }
  },[user,selT,setCurrentPage]);

  const handleLogin=async(e,p)=>{
    const u=await doLogin(e,p);
    if(u){setPage("dash");return true;}
    return false;
  };

  const handleStartTask=(sId,tId)=>{startTask(sId,tId);};
  const handleSubmitTask=(sId,tId,photo)=>{submitTask(sId,tId,photo);notify(photo?"Fotoğraf yüklendi! Onay bekleniyor.":"Onaya gönderildi!");};
  const handleApprove=(sId,tId,note)=>{approveTask(sId,tId,note);notify("Onaylandı!");};
  const handleReject=(sId,tId,note)=>{rejectTask(sId,tId,note);notify("Reddedildi.","err");};
  const handleResubmit=(sId,tId)=>{resubmitTask(sId,tId);};
  const handleHelp=(sId)=>{requestHelp(sId);notify("Eğitmen çağrıldı!");};
  const handleClearHelp=(sId)=>{clearHelp(sId);};
  const handleSaveLayout=(layouts)=>{saveLayout(layouts);};

  if(loading)return<div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:T.orange,fontSize:18}}>⏳ BerryBot LMS Yükleniyor...</div>;
  if(!user)return<LoginPage onLogin={handleLogin}/>;

  const getXP=(sid)=>TASKS.filter(t=>prog[sid]?.[t.id]?.status===TS.APPROVED).reduce((a,t)=>a+t.xp,0);

  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:T.tp}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        
        /* ═══ GLOBAL RESPONSIVE RULES ═══ */
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100vw; }
        
        /* Tablet & Below (≤900px) */
        @media (max-width: 900px) {
          main { padding: 12px !important; }
          h1 { font-size: 20px !important; }
          h2 { font-size: 18px !important; }
          .resp-hide-mobile { display: none !important; }
          .resp-grid-2 { grid-template-columns: 1fr !important; }
          .resp-stack { flex-direction: column !important; align-items: stretch !important; }
        }
        
        /* Phone (≤600px) */
        @media (max-width: 600px) {
          main { padding: 10px !important; }
          nav { padding: 10px 12px !important; gap: 6px !important; }
          nav b { font-size: 18px !important; }
          h1 { font-size: 18px !important; }
          h2 { font-size: 16px !important; }
          button, input, select, textarea { font-size: 14px !important; }
          .resp-hide-phone { display: none !important; }
          .resp-cv-stack > div { width: 100% !important; }
          /* Make all grids single-column on phone */
          [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
          /* Smaller cards padding */
          .Card-mobile, [style*="padding:18"], [style*="padding: 18"] { padding: 12px !important; }
        }
        
        /* Very small (≤400px) */
        @media (max-width: 400px) {
          main { padding: 8px !important; }
          nav { padding: 8px 10px !important; }
        }
      `}</style>
      <nav style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="/logos/berrybot.png" alt="BerryBot" style={{height:54,width:"auto",maxWidth:200,objectFit:"contain",filter:`drop-shadow(0 2px 8px ${T.orange}66)`}}/>
          <span style={{fontSize:16,background:`linear-gradient(135deg,${T.purple},${T.pd})`,color:"#fff",padding:"6px 16px",borderRadius:10,fontWeight:900,letterSpacing:2,boxShadow:`0 3px 12px ${T.purple}77`,border:`2px solid ${T.pl}66`}}>LMS</span>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {user.role===ROLES.ADMIN&&<><NBtn a={page==="dash"} o={()=>nav("dash")}>Sınıf</NBtn><NBtn a={page==="users"} o={()=>nav("users")}>Kullanıcılar</NBtn><NBtn a={page==="audit"} o={()=>nav("audit")}>Audit</NBtn><NBtn a={page==="tasks"} o={()=>nav("tasks")}>Görevler</NBtn></>}
          {user.role===ROLES.INSTRUCTOR&&<><NBtn a={page==="dash"} o={()=>nav("dash")}>Panel</NBtn><NBtn a={page==="pend"} o={()=>nav("pend")}>Onay</NBtn><NBtn a={page==="hw"} o={()=>nav("hw")}>📝 Ödev</NBtn><NBtn a={page==="show"} o={()=>nav("show")}>📊 Show</NBtn><NBtn a={page==="tasks"} o={()=>nav("tasks")}>Görevler</NBtn></>}
          {user.role===ROLES.STUDENT&&<><NBtn a={page==="dash"} o={()=>nav("dash")}>🗺️ Görev</NBtn><NBtn a={page==="practice"} o={()=>nav("practice")}>🧠 Practice</NBtn><NBtn a={page==="hw"} o={()=>nav("hw")}>📝 Ödev</NBtn></>}
          {user.role===ROLES.PARENT&&null}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {user.role===ROLES.STUDENT&&<span style={{fontSize:14,padding:"5px 12px",borderRadius:8,background:T.orange+"22",color:T.ol,fontWeight:700,whiteSpace:"nowrap"}}>{getLevel(getXP(user.id)).icon} Lv.{getLevel(getXP(user.id)).lv} • {getXP(user.id)} XP</span>}
          <span className="resp-hide-phone" style={{fontSize:14,color:T.ts,fontWeight:500}}>{user.name}</span>
          <button onClick={()=>{logout();nav("dash");}} style={{background:"none",border:`1px solid ${T.err}44`,borderRadius:8,cursor:"pointer",color:T.err,padding:"4px 12px",fontSize:13,fontWeight:600}}>Çıkış</button>
        </div>
      </nav>
      {notif&&<div style={{position:"fixed",top:16,right:16,zIndex:99,padding:"12px 20px",borderRadius:12,fontSize:16,fontWeight:600,background:notif.t==="err"?"#5c1a1a":"#1a4a2e",color:notif.t==="err"?"#fca5a5":"#86efac",boxShadow:"0 8px 30px #0006"}}>{notif.m}</div>}
      <main style={{padding:16,maxWidth:1400,margin:"0 auto"}}>

        {/* ──── ADMIN ──── */}
        {user.role===ROLES.ADMIN&&page==="dash"&&<AdminClassroom users={users} prog={prog} classLayout={classLayout} saveLayout={handleSaveLayout} onClearHelp={handleClearHelp} onSel={s=>{setSelS(s);setPage("sd");}}/>}
        {user.role===ROLES.ADMIN&&page==="sd"&&selS&&<StudentDetail s={selS} prog={prog} users={users} answerUnlocks={answerUnlocks} onToggleUnlock={toggleAnswerUnlock} onBack={()=>nav("dash")}/>}
        {user.role===ROLES.ADMIN&&page==="users"&&<UserManager users={users} prog={prog} onAddUser={addUser} onSetProgress={setProgressTo}/>}
        {user.role===ROLES.ADMIN&&page==="audit"&&<AuditLog logs={logs} users={users}/>}
        {user.role===ROLES.ADMIN&&page==="tasks"&&<TaskBrowser showAns={false}/>}

        {/* ──── INSTRUCTOR ──── */}
        {user.role===ROLES.INSTRUCTOR&&page==="dash"&&<InstructorDash user={user} users={users} prog={prog} onClearHelp={handleClearHelp} onSel={s=>{setSelS(s);setPage("sdi");}}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="sdi"&&selS&&<StudentDetail s={selS} prog={prog} users={users} answerUnlocks={answerUnlocks} onToggleUnlock={toggleAnswerUnlock} canReview onApprove={handleApprove} onReject={handleReject} onBack={()=>nav("dash")}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="pend"&&<PendingReviews user={user} users={users} prog={prog} onApprove={handleApprove} onReject={handleReject}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="show"&&<DailyShow users={users} prog={prog} logs={logs} onSel={s=>{setSelS(s);setPage("sdi");}}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="tasks"&&<TaskBrowser showAns/>}
        {user.role===ROLES.INSTRUCTOR&&page==="hw"&&<InstructorHomework user={user} users={users} homeworks={homeworks} subs={homeworkSubs} onAdd={addHomework} onDel={removeHomework} onReview={reviewHw}/>}

        {/* ──── STUDENT ──── */}
        {user.role===ROLES.STUDENT&&page==="dash"&&!selT&&<MissionBoard user={user} prog={prog} onSel={setSelT} onHelp={()=>handleHelp(user.id)}/>}
        {user.role===ROLES.STUDENT&&page==="dash"&&selT&&<StudentTaskView user={user} task={selT} prog={prog} answerUnlocks={answerUnlocks} onStart={()=>handleStartTask(user.id,selT.id)} onSubmit={p=>handleSubmitTask(user.id,selT.id,p)} onResub={()=>handleResubmit(user.id,selT.id)} onHelp={()=>handleHelp(user.id)} onBack={()=>setSelT(null)}/>}
        {user.role===ROLES.STUDENT&&page==="practice"&&<PracticeView user={user} practiceProg={practiceProg} onAnswer={recordPractice}/>}
        {user.role===ROLES.STUDENT&&page==="hw"&&<StudentHomework user={user} homeworks={homeworks} subs={homeworkSubs} onSubmit={sendHomework}/>}

        {/* ──── PARENT ──── */}
        {user.role===ROLES.PARENT&&<ParentView parent={user} users={users} prog={prog} classLayout={classLayout} logs={logs} initialTab={page==="cv"?"cv":"class"}/>}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════
function LoginPage({onLogin}){
  const[e,setE]=useState("");const[p,setP]=useState("");const[err,setErr]=useState("");
  return(<div style={{
    background:`linear-gradient(135deg,#0f0828,#2a1050,#1a0a3a)`,
    height:"100vh",width:"100vw",
    display:"flex",alignItems:"center",justifyContent:"center",
    position:"relative",overflow:"hidden",
    padding:"20px",boxSizing:"border-box",
  }}>
    <style>{`
      @keyframes float-bg { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
      @keyframes star-blink { 0%,100%{opacity:.3} 50%{opacity:1} }
      @keyframes login-glow { 0%,100%{box-shadow:0 0 30px ${T.orange}55,0 0 60px ${T.purple}33} 50%{box-shadow:0 0 50px ${T.orange}88,0 0 80px ${T.purple}66} }
      @keyframes shadow-pulse {
        0%, 100% { width: 200px; opacity: .35; }
        50% { width: 160px; opacity: .55; }
      }
      @keyframes logo-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    `}</style>

    {/* Floating star decorations */}
    {[...Array(15)].map((_,i)=>(
      <div key={i} style={{
        position:"absolute",
        left:`${(i*7+3)%95}%`,top:`${(i*11+5)%95}%`,
        fontSize:`${12+(i%4)*8}px`,
        animation:`star-blink ${2+(i%4)}s infinite, float-bg ${4+(i%3)}s infinite ease-in-out`,
        animationDelay:`${i*0.3}s`,
        opacity:.5,
        color:i%4===0?T.orange:i%4===1?T.pl:i%4===2?T.cyan:T.warn,
        pointerEvents:"none",
      }}>{["✦","⚡","⭐","💫","🛸"][i%5]}</div>
    ))}

    {/* MAIN CONTAINER — 2 columns side by side */}
    <div style={{
      width:"100%",maxWidth:1200,
      maxHeight:"100%",
      display:"flex",alignItems:"center",justifyContent:"center",
      gap:24,flexWrap:"wrap",
      position:"relative",zIndex:2,
    }}>

      {/* LEFT COLUMN — Big 3D Robot + BerryBot logo */}
      <div style={{
        flex:"2 1 520px",maxWidth:680,minWidth:300,
        display:"flex",flexDirection:"column",alignItems:"center",
      }}>
        {/* 3D BerryBot — large, auto rotates */}
        <div style={{
          width:"100%",position:"relative",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <div style={{
            position:"absolute",bottom:10,left:"50%",
            transform:"translateX(-50%)",
            width:240,height:18,borderRadius:"50%",
            background:`radial-gradient(ellipse,${T.purple}aa,transparent 70%)`,
            animation:"shadow-pulse 4s infinite ease-in-out",
            filter:"blur(8px)",
            zIndex:1,
          }}/>
          <div style={{position:"relative",zIndex:2,width:"100%"}}>
            <BerryBot3D height={420} autoRotate={true} background="transparent" interactive={false}/>
          </div>
        </div>

        {/* BerryBot logo image */}
        <div style={{textAlign:"center",marginTop:-80,width:"100%",position:"relative",zIndex:3}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:14,flexWrap:"wrap",justifyContent:"center"}}>
            <img src="/logos/berrybot.png" alt="BerryBot" style={{maxWidth:"100%",width:340,height:"auto",maxHeight:140,objectFit:"contain",filter:`drop-shadow(0 4px 14px ${T.orange}88)`}}/>
            <span style={{
              fontSize:22,padding:"8px 18px",borderRadius:12,
              background:`linear-gradient(135deg,${T.purple},${T.pd})`,
              color:"#fff",fontWeight:900,letterSpacing:2,
              boxShadow:`0 4px 16px ${T.purple}88`,
              border:`2px solid ${T.pl}66`,
            }}>LMS</span>
          </div>
          <div style={{fontSize:13,color:T.ts,marginTop:-12,letterSpacing:3,textTransform:"uppercase",fontWeight:700}}>Robotik Görev Akademisi</div>
        </div>
      </div>

      {/* RIGHT COLUMN — Login form + sponsor logos */}
      <div style={{
        flex:"1 1 340px",maxWidth:400,minWidth:280,
        display:"flex",flexDirection:"column",gap:14,
      }}>
        {/* LOGIN FORM */}
        <div style={{
          background:`linear-gradient(135deg,${T.card},#1a0e3a)`,
          borderRadius:20,padding:22,
          border:`2px solid ${T.orange}55`,
          animation:"login-glow 3s infinite ease-in-out",
        }}>
          <input type="email" placeholder="📧 E-posta" value={e} onChange={x=>setE(x.target.value)} style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${T.border}`,background:T.input,color:T.tp,fontSize:15,outline:"none",marginBottom:10,boxSizing:"border-box",fontWeight:500}}/>
          <input type="password" placeholder="🔑 Şifre" value={p} onChange={x=>setP(x.target.value)} onKeyDown={x=>x.key==="Enter"&&(onLogin(e,p)||setErr("Hatalı!"))} style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${T.border}`,background:T.input,color:T.tp,fontSize:15,outline:"none",boxSizing:"border-box",fontWeight:500}}/>
          {err&&<div style={{fontSize:13,marginTop:8,padding:"8px 12px",borderRadius:10,background:"#5c1a1a",color:"#fca5a5",fontWeight:600,textAlign:"center"}}>⚠️ {err}</div>}
          <button onClick={()=>onLogin(e,p)||setErr("Hatalı giriş!")} style={{
            width:"100%",marginTop:12,padding:"14px",borderRadius:12,border:"none",
            background:`linear-gradient(135deg,${T.orange},${T.od})`,
            color:"#fff",fontSize:17,fontWeight:800,cursor:"pointer",
            letterSpacing:1,textTransform:"uppercase",
            boxShadow:`0 6px 20px ${T.orange}66`,
            transition:"transform .2s",
          }} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
            🚀 Maceraya Başla
          </button>
        </div>

        {/* SPONSOR LOGOS */}
        <div style={{
          padding:"14px 16px",
          background:"#ffffff08",
          borderRadius:14,
          border:`1px solid ${T.border}66`,
        }}>
          <div style={{
            fontSize:10,color:T.tm,textAlign:"center",
            letterSpacing:3,fontWeight:700,marginBottom:10,
          }}>POWERED BY</div>
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-around",gap:8,
            flexWrap:"nowrap",
          }}>
            {/* Robotistan */}
            <div style={{
              flex:"1 1 0",
              display:"flex",alignItems:"center",justifyContent:"center",
              height:60,
              animation:"logo-float 3s infinite ease-in-out",
            }}>
              <img src="/logos/robotistan.png" alt="Robotistan" style={{maxHeight:"100%",maxWidth:"100%",objectFit:"contain",filter:"drop-shadow(0 2px 6px #0008)"}}/>
            </div>

            {/* RoboGPT — bigger */}
            <div style={{
              flex:"1.4 1 0",
              display:"flex",alignItems:"center",justifyContent:"center",
              height:80,
              animation:"logo-float 3s infinite ease-in-out .4s",
            }}>
              <img src="/logos/robogpt.png" alt="RoboGPT" style={{maxHeight:"100%",maxWidth:"100%",objectFit:"contain",filter:"drop-shadow(0 2px 8px #0008)"}}/>
            </div>

            {/* PicoBricks */}
            <div style={{
              flex:"1 1 0",
              display:"flex",alignItems:"center",justifyContent:"center",
              height:60,
              animation:"logo-float 3s infinite ease-in-out .8s",
            }}>
              <img src="/logos/picobricks.png" alt="PicoBricks" style={{maxHeight:"100%",maxWidth:"100%",objectFit:"contain",filter:"drop-shadow(0 2px 6px #0008)"}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>);
}

// ═══════════════════════════════════════
//  ADMIN: CLASSROOM — ahşap, sürükle, boyutlandır, TV, kaydet
// ═══════════════════════════════════════
function AdminClassroom({users,prog,classLayout,saveLayout,onClearHelp,onSel}){
  const[ac,setAc]=useState(classLayout[0]?.id||"c1");
  const[editMode,setEditMode]=useState(false);
  const[dragId,setDragId]=useState(null); // "t_xxx" or "ob_xxx"
  const[dragOff,setDragOff]=useState({x:0,y:0});
  const[seatPicker,setSeatPicker]=useState(null);
  const[addMenu,setAddMenu]=useState(false);
  const[dirty,setDirty]=useState(false); // unsaved changes
  const[localLayout,setLocalLayout]=useState(classLayout);
  const canvasRef=useRef(null);

  // Sync from parent when not dirty
  useEffect(()=>{if(!dirty)setLocalLayout(classLayout);},[classLayout,dirty]);

  const cls=localLayout.find(c=>c.id===ac)||localLayout[0];
  const inst=users.find(u=>u.id===cls?.instructorId);
  const students=users.filter(u=>u.role===ROLES.STUDENT);
  const totalHelp=students.filter(s=>prog[s.id]?.helpRequest).length;
  const assignedInClass=(cls.tables||[]).flatMap(t=>t.seats).filter(Boolean);
  const canvasH=cls.canvasH||700;

  const getAct=(sid)=>{const sp=prog[sid]||{};for(const t of TASKS){const st=sp[t.id]?.status;if(st&&st!==TS.LOCKED&&st!==TS.APPROVED)return{task:t,status:st};}return null;};
  const getCnt=(sid)=>TASKS.filter(t=>prog[sid]?.[t.id]?.status===TS.APPROVED).length;

  // ── LOCAL EDIT (doesn't save until "Kaydet") ──
  const editClass=(fn)=>{setLocalLayout(prev=>prev.map(c=>c.id===ac?fn({...c,tables:(c.tables||[]).map(t=>({...t,seats:[...t.seats]})),objects:[...(c.objects||[])]}):c));setDirty(true);};
  const editTable=(tid,fn)=>editClass(c=>({...c,tables:c.tables.map(t=>t.id===tid?fn({...t,seats:[...t.seats]}):t)}));
  const editObject=(oid,fn)=>editClass(c=>({...c,objects:(c.objects||[]).map(o=>o.id===oid?fn({...o}):o)}));

  // ── SAVE ──
  const handleSave=()=>{saveLayout(localLayout);setDirty(false);};

  // ── TABLE ACTIONS ──
  const addTable=(type)=>{
    const pr=TABLE_PRESETS[type];
    editClass(c=>({...c,tables:[...c.tables,{id:`t_${Date.now()}`,type,x:60,y:100,horizontal:false,w:250,h:40+pr.rows*85,seats:Array(pr.seats).fill(null)}]}));
    setAddMenu(false);
  };
  const dupTable=(tid)=>{
    const orig=cls.tables.find(t=>t.id===tid);if(!orig)return;
    editClass(c=>({...c,tables:[...c.tables,{...orig,id:`t_${Date.now()}`,x:orig.x+30,y:orig.y+30,seats:orig.seats.map(()=>null)}]}));
  };
  const removeTable=(tid)=>editClass(c=>({...c,tables:c.tables.filter(t=>t.id!==tid)}));
  const toggleOrientation=(tid)=>editTable(tid,t=>({...t,horizontal:!t.horizontal,w:t.h,h:t.w}));

  // Separate W / H resize
  const resizeW=(tid,d)=>editTable(tid,t=>({...t,w:Math.max(120,t.w+d)}));
  const resizeH=(tid,d)=>editTable(tid,t=>({...t,h:Math.max(80,t.h+d)}));

  // ── TV / OBJECT ACTIONS ──
  const addTV=()=>editClass(c=>({...c,objects:[...(c.objects||[]),{id:`ob_${Date.now()}`,type:"tv",x:200,y:10,w:220,h:38,label:"TV"}]}));
  const removeObject=(oid)=>editClass(c=>({...c,objects:(c.objects||[]).filter(o=>o.id!==oid)}));
  const resizeObjW=(oid,d)=>editObject(oid,o=>({...o,w:Math.max(40,o.w+d)}));
  const resizeObjH=(oid,d)=>editObject(oid,o=>({...o,h:Math.max(30,o.h+d)}));
  const rotateObj=(oid)=>editObject(oid,o=>({...o,w:o.h,h:o.w}));

  // ── CANVAS HEIGHT ──
  const resizeCanvas=(d)=>editClass(c=>({...c,canvasH:Math.max(400,Math.min(1500,(c.canvasH||700)+d))}));

  // ── SEAT ASSIGN ──
  const assignSeat=(tid,si,sid)=>{editClass(c=>{const nc={...c,tables:c.tables.map(t=>({...t,seats:t.seats.map(s=>s===sid?null:s)}))};nc.tables=nc.tables.map(t=>t.id===tid?{...t,seats:t.seats.map((s,i)=>i===si?sid:s)}:t);return nc;});setSeatPicker(null);};
  const clearSeat=(tid,si)=>{editTable(tid,t=>({...t,seats:t.seats.map((s,i)=>i===si?null:s)}));setSeatPicker(null);};

  // ── DRAG (works for tables AND objects) ──
  const startDrag=(e,id)=>{
    if(!editMode||e.target.closest('[data-nd]'))return;
    e.preventDefault();
    const r=canvasRef.current.getBoundingClientRect();
    // Find position from table or object
    const tb=cls.tables.find(t=>t.id===id);
    const ob=(cls.objects||[]).find(o=>o.id===id);
    const item=tb||ob;if(!item)return;
    setDragId(id);setDragOff({x:e.clientX-r.left-item.x,y:e.clientY-r.top-item.y});
  };
  const onMouseMove=(e)=>{
    if(!dragId||!canvasRef.current)return;
    const r=canvasRef.current.getBoundingClientRect();
    const x=Math.max(0,e.clientX-r.left-dragOff.x);
    const y=Math.max(0,e.clientY-r.top-dragOff.y);
    const el=document.getElementById(`item-${dragId}`);
    if(el){el.style.left=x+"px";el.style.top=y+"px";el._p={x,y};}
  };
  const onMouseUp=()=>{
    if(!dragId)return;
    const el=document.getElementById(`item-${dragId}`);
    if(el?._p){
      const pos={x:Math.round(el._p.x),y:Math.round(el._p.y)};
      // Is it a table or object?
      if(cls.tables.find(t=>t.id===dragId)){
        editTable(dragId,t=>({...t,...pos}));
      }else{
        editObject(dragId,o=>({...o,...pos}));
      }
    }
    setDragId(null);
  };

  // ── RENDER SEAT ──
  const renderSeat=(sid,tid,si)=>{
    if(!sid)return(
      <div onClick={e=>{e.stopPropagation();if(editMode)setSeatPicker({tableId:tid,seatIdx:si});}} data-nd="1" style={{background:editMode?"#2a200a":"#1a1408",borderRadius:6,textAlign:"center",border:editMode?"2px dashed #8B691444":"1px dashed #5C401033",cursor:editMode?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",minHeight:50}}>
        <div style={{fontSize:14,opacity:.3}}>{editMode?"➕":"💺"}</div>
        <div style={{fontSize:7,color:WOOD.textDim}}>{editMode?"Ata":"Boş"}</div>
      </div>
    );
    const stu=users.find(u=>u.id===sid);
    if(!stu)return<div style={{background:"#1a1408",borderRadius:6,height:"100%"}}/>;
    const cur=getAct(sid);const pct=Math.round(getCnt(sid)/36*100);
    const hasHelp=prog[sid]?.helpRequest;const isOn=prog[sid]?.online;
    const sc=hasHelp?T.err:cur?.status===TS.PENDING?T.pl:cur?.status===TS.IN_PROGRESS?T.warn:T.ok;
    return(
      <div onClick={e=>{e.stopPropagation();if(editMode)setSeatPicker({tableId:tid,seatIdx:si});else onSel(stu);}} data-nd="1" style={{background:hasHelp?"#3a1520":"#1a1408",borderRadius:6,padding:3,textAlign:"center",cursor:"pointer",border:hasHelp?`2px solid ${T.err}55`:`1px solid #5C401044`,position:"relative",height:"100%",minHeight:50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {hasHelp&&<div style={{position:"absolute",top:-3,right:-3,width:13,height:13,borderRadius:"50%",background:T.err,display:"flex",alignItems:"center",justifyContent:"center",animation:"pulse 1s infinite",zIndex:2}}><span style={{fontSize:7}}>🖐</span></div>}
        {isOn&&<div style={{position:"absolute",top:2,left:2,width:5,height:5,borderRadius:"50%",background:T.ok,zIndex:2}}/>}
        <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:`${sc}20`,color:sc,border:`2px solid ${sc}55`,flexShrink:0}}>{stu.name[0]}</div>
        <div style={{fontSize:7,fontWeight:600,color:WOOD.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",marginTop:1}}>{stu.name.split(" ")[0]}</div>
        {cur?<div style={{fontSize:6,color:WOOD.textDim}}>G.{cur.task.id}</div>:<div style={{fontSize:6,color:T.ok}}>✓</div>}
        <Badge s={cur?.status||TS.APPROVED}/>
        <div style={{width:"80%",height:2,borderRadius:1,background:"#5C4010",overflow:"hidden",margin:"1px auto 0"}}><div style={{height:"100%",background:T.orange,width:`${pct}%`}}/></div>
        {hasHelp&&!editMode&&<button onClick={e=>{e.stopPropagation();onClearHelp(sid);}} data-nd="1" style={{marginTop:1,fontSize:6,padding:"1px 4px",borderRadius:3,border:"none",background:T.ok+"30",color:T.ok,cursor:"pointer"}}>✓</button>}
      </div>
    );
  };

  // ── RENDER TABLE (WOOD) ──
  const renderTable=(table)=>{
    const pr=TABLE_PRESETS[table.type]||TABLE_PRESETS["2li"];
    const gCols=table.horizontal?pr.rows:pr.cols;
    const gRows=table.horizontal?pr.cols:pr.rows;
    const isDrag=dragId===table.id;
    return(
      <div id={`item-${table.id}`} key={table.id} onMouseDown={e=>startDrag(e,table.id)} style={{
        position:"absolute",left:table.x,top:table.y,width:table.w,height:table.h,
        background:"linear-gradient(160deg, #A07828, #8B6914 30%, #7A5C12 60%, #6B4F12)",
        borderRadius:10,border:isDrag?`3px solid ${T.orange}`:"3px solid #5C4010",
        boxShadow:isDrag?`0 0 30px ${T.orange}44`:"0 4px 16px #00000055, inset 0 1px 0 #C4A86833",
        cursor:editMode?"grab":"default",userSelect:"none",zIndex:isDrag?10:1,
        display:"flex",flexDirection:"column",overflow:"hidden",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"2px 5px",background:"#5C401088",borderBottom:"1px solid #4a350e",flexShrink:0}}>
          <span style={{fontSize:7,color:"#C4A868",fontWeight:700}}>{pr.label}</span>
          {editMode&&<div style={{display:"flex",gap:1}} data-nd="1">
            <button onClick={e=>{e.stopPropagation();toggleOrientation(table.id);}} title="Yatay↔Dikey" style={tbBtn}>↻</button>
            <button onClick={e=>{e.stopPropagation();resizeW(table.id,25);}} title="En +" style={tbBtn}>W+</button>
            <button onClick={e=>{e.stopPropagation();resizeW(table.id,-25);}} title="En -" style={tbBtn}>W−</button>
            <button onClick={e=>{e.stopPropagation();resizeH(table.id,25);}} title="Boy +" style={tbBtn}>H+</button>
            <button onClick={e=>{e.stopPropagation();resizeH(table.id,-25);}} title="Boy -" style={tbBtn}>H−</button>
            <button onClick={e=>{e.stopPropagation();dupTable(table.id);}} title="Çoğalt" style={{...tbBtn,color:"#86efac"}}>⧉</button>
            <button onClick={e=>{e.stopPropagation();removeTable(table.id);}} title="Sil" style={{...tbBtn,color:T.err}}>✕</button>
          </div>}
        </div>
        <div style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${gCols},1fr)`,gridTemplateRows:`repeat(${gRows},1fr)`,gap:3,padding:3}}>
          {table.seats.map((sid,si)=><div key={si}>{renderSeat(sid,table.id,si)}</div>)}
        </div>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:.05,background:"repeating-linear-gradient(95deg,transparent,transparent 8px,#000 8px,#000 9px)",borderRadius:8}}/>
      </div>
    );
  };
  const tbBtn={fontSize:7,padding:"0 3px",borderRadius:2,border:"none",background:"#C4A86830",color:"#F5E6C8",cursor:"pointer",lineHeight:"14px"};
  const tvBtn={fontSize:7,padding:"0 3px",borderRadius:2,border:"none",background:"#0ea5e933",color:"#67e8f9",cursor:"pointer",lineHeight:"12px"};

  // ── RENDER TV / OBJECT ──
  const renderObject=(obj)=>{
    const isDrag=dragId===obj.id;
    const isVertical=obj.h>obj.w;
    if(obj.type==="tv")return(
      <div id={`item-${obj.id}`} key={obj.id} onMouseDown={e=>startDrag(e,obj.id)} style={{
        position:"absolute",left:obj.x,top:obj.y,width:obj.w,height:obj.h,
        background:"linear-gradient(180deg,#1a1a2e,#0f0f1e)",borderRadius:8,
        border:isDrag?`2px solid ${T.orange}`:"2px solid #333",
        boxShadow:isDrag?`0 0 20px ${T.orange}44`:"0 2px 8px #0004, inset 0 0 20px #0ea5e908",
        cursor:editMode?"grab":"default",userSelect:"none",zIndex:isDrag?10:2,
        display:"flex",alignItems:"center",justifyContent:"center",gap:isVertical?3:6,
        flexDirection:isVertical?"column":"row",
        overflow:"hidden",
      }}>
        <span style={{fontSize:isVertical?12:14}}>🖥️</span>
        <span style={{fontSize:isVertical?7:9,fontWeight:700,color:"#67e8f9",letterSpacing:.5,writingMode:isVertical?"vertical-rl":"horizontal-tb"}}>{obj.label||"TV"}</span>
        {/* Screen glow */}
        <div style={{position:"absolute",inset:0,borderRadius:6,pointerEvents:"none",background:"radial-gradient(ellipse at center,#0ea5e906,transparent 70%)"}}/>
        {editMode&&<div style={{position:"absolute",top:1,right:2,display:"flex",gap:1}} data-nd="1">
          <button onClick={e=>{e.stopPropagation();rotateObj(obj.id);}} style={tvBtn}>↻</button>
          <button onClick={e=>{e.stopPropagation();resizeObjW(obj.id,30);}} style={tvBtn}>W+</button>
          <button onClick={e=>{e.stopPropagation();resizeObjW(obj.id,-30);}} style={tvBtn}>W−</button>
          <button onClick={e=>{e.stopPropagation();resizeObjH(obj.id,15);}} style={tvBtn}>H+</button>
          <button onClick={e=>{e.stopPropagation();resizeObjH(obj.id,-15);}} style={tvBtn}>H−</button>
          <button onClick={e=>{e.stopPropagation();removeObject(obj.id);}} style={{...tvBtn,color:T.err}}>✕</button>
        </div>}
      </div>
    );
    return null;
  };

  // ── SEAT PICKER MODAL ──
  const renderSeatPicker=()=>{
    if(!seatPicker)return null;
    const currentSid=(cls.tables.find(t=>t.id===seatPicker.tableId))?.seats[seatPicker.seatIdx];
    const available=students.filter(s=>!assignedInClass.includes(s.id)||s.id===currentSid);
    return(
      <div onClick={()=>setSeatPicker(null)} style={{position:"fixed",inset:0,zIndex:50,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div onClick={e=>e.stopPropagation()} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:16,width:340,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:16,fontWeight:700,color:T.orange,marginBottom:10,flexShrink:0}}>Koltuğa Öğrenci Ata</div>
          {currentSid&&<button onClick={()=>clearSeat(seatPicker.tableId,seatPicker.seatIdx)} style={{width:"100%",padding:"10px",borderRadius:8,border:`1px solid ${T.err}44`,background:T.err+"15",color:T.err,cursor:"pointer",fontSize:14,marginBottom:8,flexShrink:0}}>🚫 Koltuğu Boşalt</button>}
          {available.length===0&&<div style={{padding:16,textAlign:"center",color:T.tm,fontSize:14}}>Atanacak öğrenci yok</div>}
          <div style={{overflowY:"auto",flex:1,minHeight:0}}>
            {available.map(s=>(
              <button key={s.id} onClick={()=>assignSeat(seatPicker.tableId,seatPicker.seatIdx,s.id)} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${s.id===currentSid?T.orange+"66":T.border}`,background:s.id===currentSid?T.orange+"20":T.dark,color:T.tp,cursor:"pointer",fontSize:14,marginBottom:5,textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:T.orange+"20",color:T.orange,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0}}>{s.name[0]}</div>
                <div><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:11,color:T.tm}}>{s.email}</div></div>
              </button>
            ))}
          </div>
          <button onClick={()=>setSeatPicker(null)} style={{width:"100%",marginTop:10,padding:"8px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.ts,cursor:"pointer",fontSize:14,flexShrink:0}}>İptal</button>
        </div>
      </div>
    );
  };

  return(<div>
    {/* HEADER */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <h1 style={{fontSize:17,fontWeight:800,color:T.orange,margin:0}}>🏫 Sınıf Düzeni</h1>
      <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
        {localLayout.map(c=><button key={c.id} onClick={()=>setAc(c.id)} style={{fontSize:11,padding:"5px 14px",borderRadius:8,border:ac===c.id?`2px solid ${T.orange}`:`1px solid ${T.border}`,background:ac===c.id?T.orange+"20":T.card,color:ac===c.id?T.orange:T.ts,cursor:"pointer",fontWeight:ac===c.id?700:400}}>{c.name}</button>)}
        <div style={{width:1,height:20,background:T.border}}/>
        <button onClick={()=>setEditMode(!editMode)} style={{fontSize:11,padding:"5px 14px",borderRadius:8,border:editMode?`2px solid ${T.warn}`:`1px solid ${T.border}`,background:editMode?T.warn+"20":T.card,color:editMode?T.warn:T.ts,cursor:"pointer",fontWeight:editMode?700:400}}>{editMode?"✓ Düzenleme Bitti":"✏️ Düzenle"}</button>
        {dirty&&<button onClick={handleSave} style={{fontSize:11,padding:"5px 18px",borderRadius:8,border:`2px solid ${T.ok}`,background:T.ok+"20",color:T.ok,cursor:"pointer",fontWeight:700,animation:"pulse 2s infinite"}}>💾 Kaydet</button>}
      </div>
    </div>

    {totalHelp>0&&<Card style={{marginBottom:10,background:"#3a1520",borderColor:T.err+"44",padding:10}}><div style={{fontSize:11,fontWeight:700,color:T.err}}>🖐 {totalHelp} öğrenci yardım bekliyor!</div></Card>}

    {/* TOOLBAR */}
    {editMode&&<div style={{display:"flex",gap:5,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{position:"relative"}}>
        <button onClick={()=>setAddMenu(!addMenu)} style={{fontSize:11,padding:"6px 14px",borderRadius:8,border:`1px solid ${T.ok}44`,background:T.ok+"15",color:T.ok,cursor:"pointer",fontWeight:600}}>+ Masa Ekle</button>
        {addMenu&&<div style={{position:"absolute",top:"100%",left:0,marginTop:4,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:6,zIndex:20,minWidth:220,boxShadow:"0 8px 24px #0005"}}>
          {Object.entries(TABLE_PRESETS).map(([key,pr])=>(
            <button key={key} onClick={()=>addTable(key)} style={{display:"block",width:"100%",padding:"8px 10px",borderRadius:6,border:"none",background:"transparent",color:T.tp,cursor:"pointer",textAlign:"left",fontSize:12,marginBottom:2}}><b>{pr.label}</b><span style={{color:T.tm,marginLeft:8}}>{pr.seats} koltuk</span></button>
          ))}
        </div>}
      </div>
      <button onClick={addTV} style={{fontSize:11,padding:"6px 14px",borderRadius:8,border:`1px solid ${T.cyan}44`,background:T.cyan+"15",color:T.cyan,cursor:"pointer",fontWeight:600}}>🖥️ TV Ekle</button>
      <div style={{display:"flex",gap:3,alignItems:"center"}}>
        <span style={{fontSize:10,color:T.tm}}>Alan:</span>
        <button onClick={()=>resizeCanvas(100)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,border:`1px solid ${T.border}`,background:T.card,color:T.ts,cursor:"pointer"}}>↕ Büyüt</button>
        <button onClick={()=>resizeCanvas(-100)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,border:`1px solid ${T.border}`,background:T.card,color:T.ts,cursor:"pointer"}}>↕ Küçült</button>
        <span style={{fontSize:9,color:T.tm}}>{canvasH}px</span>
      </div>
      <span style={{fontSize:9,color:T.tm,marginLeft:8}}>⧉ Çoğalt | W± En | H± Boy | ↻ Yatay/Dikey</span>
    </div>}

    {/* CANVAS */}
    <div ref={canvasRef} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} style={{
      position:"relative",width:"100%",height:canvasH,
      background:editMode?"linear-gradient(180deg,#100c1e,#0d0a18)":"linear-gradient(180deg,#13101e,#0f0c18)",
      border:editMode?`2px dashed ${T.warn}44`:`1px solid ${T.border}`,borderRadius:16,overflow:"auto",
      backgroundImage:editMode?"radial-gradient(#2a206033 1px,transparent 1px)":"none",backgroundSize:"25px 25px",
    }}>
      {/* Floor texture */}
      <div style={{position:"absolute",inset:0,opacity:.03,background:"repeating-linear-gradient(45deg,#fff 0px,#fff 1px,transparent 1px,transparent 25px)",pointerEvents:"none"}}/>
      {/* Instructor */}
      <div style={{position:"absolute",top:8,left:14,padding:"3px 10px",borderRadius:5,background:T.purple+"20",fontSize:9,color:T.pl,zIndex:5}}>👨‍🏫 {inst?.name||"—"}</div>

      {/* OBJECTS (TVs etc) */}
      {(cls.objects||[]).map(renderObject)}
      {/* TABLES */}
      {(cls.tables||[]).map(renderTable)}

      {cls.tables.length===0&&(cls.objects||[]).length===0&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}><span style={{fontSize:32,opacity:.3}}>🪑</span><span style={{fontSize:13,color:T.tm}}>Masa ve TV ekleyerek başla</span></div>}
    </div>

    <div style={{display:"flex",justifyContent:"center",gap:14,marginTop:10,fontSize:9,color:T.tm,flexWrap:"wrap"}}>
      <span>🟢 Online</span><span>🔴 Yardım</span><span>🟡 Çalışıyor</span><span>🟣 Onay Bekliyor</span>
      {editMode&&<span style={{color:T.warn,fontWeight:600}}>✏️ Düzenleme modu</span>}
      {dirty&&<span style={{color:T.ok,fontWeight:700}}>● Kaydedilmemiş değişiklik var</span>}
    </div>

    {renderSeatPicker()}
  </div>);
}

// ═══════════════════════════════════════
//  STUDENT: MISSION BOARD (GAME STYLE)
// ═══════════════════════════════════════
// ═══════════════════════════════════════
function MissionBoard({user,prog,onSel,onHelp}){
  const sp=prog[user.id]||{};
  const xp=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED).reduce((a,t)=>a+t.xp,0);
  const lv=getLevel(xp);const nlv=getNextLevel(xp);
  const cnt=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED).length;
  const lvProgress=nlv?((xp-lv.min)/(nlv.min-lv.min))*100:100;
  const hasHelp=prog[user.id]?.helpRequest;

  // ═══ Inspirational quotes from tech/science legends — rotate every 8s ═══
  const QUOTES=[
    {text:"Geleceği tahmin etmenin en iyi yolu onu icat etmektir.",author:"Alan Kay",role:"Bilgisayar Bilimcisi",emoji:"💻"},
    {text:"Yapamayacağını söyleyenler, yapanları durdurmamalıdır.",author:"Elon Musk",role:"SpaceX & Tesla CEO",emoji:"🚀"},
    {text:"Başarı kötü bir öğretmendir. Akıllı insanları başarısız olamayacaklarına inandırır.",author:"Bill Gates",role:"Microsoft Kurucusu",emoji:"💼"},
    {text:"Hayal gücü bilgiden daha önemlidir. Çünkü bilgi sınırlıdır, hayal gücü dünyayı kucaklar.",author:"Albert Einstein",role:"Fizikçi",emoji:"🧠"},
    {text:"Kod yazmak, bir robotun düşünmesini öğretmektir.",author:"Steve Jobs",role:"Apple Kurucusu",emoji:"🍎"},
    {text:"Robotlar insanların yerini almayacak; ama robotları kullanan insanlar, kullanmayanların yerini alacak.",author:"Andrew Ng",role:"AI Araştırmacısı",emoji:"🤖"},
    {text:"Mühendislik, mevcut bilimi pratik problem çözmeye uygulamaktır.",author:"Nikola Tesla",role:"Mucit",emoji:"⚡"},
    {text:"Eğer denediğin her şey işe yarıyorsa, yeterince zor şeyler denemiyorsun.",author:"Larry Page",role:"Google Kurucusu",emoji:"🔍"},
    {text:"Yapay zeka insanlığın en önemli teknolojik gelişmelerinden biri olacak.",author:"Sundar Pichai",role:"Google CEO",emoji:"🧠"},
    {text:"Hayatınızı bir başkasının yaşamına harcamayın. Cesur olun.",author:"Steve Jobs",role:"Apple Kurucusu",emoji:"🍎"},
    {text:"Robotik, geleceğin değil; bugünün bilimidir.",author:"Rodney Brooks",role:"MIT Robotik Profesörü",emoji:"🦾"},
    {text:"Her büyük buluş bir hayalle başlar. Önce hayal et, sonra kodla!",author:"Walt Disney",role:"Yaratıcı",emoji:"✨"},
    {text:"Bir şeyi başaramayan kişi, vazgeçen kişidir. Asla pes etme.",author:"Thomas Edison",role:"Mucit",emoji:"💡"},
    {text:"Teknoloji insanlık için bir araçtır; insanları bir araya getirmek için.",author:"Mark Zuckerberg",role:"Meta CEO",emoji:"🌐"},
    {text:"Sadece kullanıcıların ne istediğine değil, neye ihtiyaç duyduğuna odaklanın.",author:"Jeff Bezos",role:"Amazon Kurucusu",emoji:"📦"},
    {text:"Robotlar düşünmez, kod düşünür. İyi kod yazan, iyi robot yapar.",author:"Linus Torvalds",role:"Linux Yaratıcısı",emoji:"🐧"},
    {text:"Başarı 1% ilham, 99% terdir. Görevlerini bitir!",author:"Thomas Edison",role:"Mucit",emoji:"💡"},
    {text:"Cesaret bilgi değildir; bilgiyle birlikte gelen güvendir.",author:"Marie Curie",role:"Fizikçi & Kimyager",emoji:"🔬"},
    {text:"Programlama bir sanat değil, sanat formundaki mühendisliktir.",author:"Donald Knuth",role:"Algoritma Üstadı",emoji:"📐"},
    {text:"Bugün öğrendiğin küçük bir şey, yarın büyük bir robotun beyni olabilir.",author:"BerryBot",role:"Senin Robot Arkadaşın",emoji:"🤖"},
  ];
  const [quoteIdx,setQuoteIdx]=useState(()=>Math.floor(Math.random()*QUOTES.length));
  useEffect(()=>{
    const iv=setInterval(()=>setQuoteIdx(i=>(i+1)%QUOTES.length),8000);
    return ()=>clearInterval(iv);
  },[]);
  const currentQuote=QUOTES[quoteIdx];

  // Difficulty labels
  const diffLabel=(d)=>{
    if(d<=1)return{l:"KOLAY",c:"#22c55e",bg:"#1a4a2e"};
    if(d===2)return{l:"ORTA",c:"#3b82f6",bg:"#1a2a4a"};
    if(d===3)return{l:"ZOR",c:"#f59e0b",bg:"#3a2a0a"};
    if(d===4)return{l:"ÇOK ZOR",c:"#ef4444",bg:"#3a1a1a"};
    return{l:"USTA",c:"#a855f7",bg:"#2a1a3a"};
  };

  // Category themes
  const catThemes={
    "RGB LED":{c:"#ff6b9d",bg:"#3a1a3a",icon:"💡",scene:"🌈"},
    "Motor":{c:"#fbbf24",bg:"#3a2a0a",icon:"⚙️",scene:"🏎️"},
    "Sensör+LED+Buzzer":{c:"#22d3ee",bg:"#0a2a3a",icon:"📡",scene:"🔔"},
    "Işık Sensörü":{c:"#fde047",bg:"#3a2a0a",icon:"🔦",scene:"☀️"},
    "IR Kumanda":{c:"#a78bfa",bg:"#1a0a3a",icon:"🎮",scene:"📡"},
    "Fonksiyon":{c:"#f472b6",bg:"#3a0a2a",icon:"📦",scene:"💻"},
    "Mesafe/Navigasyon":{c:"#34d399",bg:"#0a3a2a",icon:"🧭",scene:"🗺️"},
    "Engel Algılama":{c:"#fb7185",bg:"#3a0a1a",icon:"🚧",scene:"⚠️"},
    "Çizgi Takip":{c:"#60a5fa",bg:"#0a1a3a",icon:"〰️",scene:"🛤️"},
    "Sumo Robot":{c:"#f87171",bg:"#3a0a0a",icon:"🤼",scene:"🏆"},
    "Işık Takip":{c:"#facc15",bg:"#2a2a0a",icon:"🌟",scene:"💫"},
  };

  // Build positions for all 36 tasks on a horizontal map
  // Use sine wave for vertical zigzag, group by category for color zones
  const NODE_GAP=170;
  const MAP_HEIGHT=480;
  const PAD_X=80;
  const positions=TASKS.map((t,i)=>{
    const x=PAD_X+i*NODE_GAP;
    // Sine wave between 100-380 y range
    const y=MAP_HEIGHT/2+Math.sin(i*0.55)*150;
    return{x,y,task:t,theme:catThemes[t.cat]||{c:T.orange,icon:"🎯",scene:"⭐"}};
  });
  const totalWidth=PAD_X*2+TASKS.length*NODE_GAP;

  // Find category zones (start/end x positions)
  const zones=[];
  let curCat=null,zStart=0;
  positions.forEach((p,i)=>{
    if(p.task.cat!==curCat){
      if(curCat)zones.push({cat:curCat,startX:zStart,endX:positions[i-1].x+NODE_GAP/2,theme:catThemes[curCat]});
      curCat=p.task.cat;
      zStart=p.x-NODE_GAP/2;
    }
  });
  if(curCat)zones.push({cat:curCat,startX:zStart,endX:positions[TASKS.length-1].x+NODE_GAP/2,theme:catThemes[curCat]});

  // Auto-scroll to current task on mount
  const mapRef=useRef(null);
  useEffect(()=>{
    if(!mapRef.current)return;
    // Find first non-locked, non-approved task (active/in_progress/pending)
    const currentIdx=TASKS.findIndex(t=>{const s=sp[t.id]?.status;return s===TS.ACTIVE||s===TS.IN_PROGRESS||s===TS.PENDING;});
    const targetIdx=currentIdx>=0?currentIdx:0;
    const targetX=positions[targetIdx].x-mapRef.current.clientWidth/2+50;
    mapRef.current.scrollTo({left:Math.max(0,targetX),behavior:"smooth"});
  },[]);

  return(<div style={{position:"relative"}}>
    <style>{`
      @keyframes mb-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      @keyframes mb-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes mb-shine { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      @keyframes mb-bounce { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-5px) scale(1.06)} }
      @keyframes mb-confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(-40px) rotate(360deg);opacity:0} }
      @keyframes mb-shimmer { 0%{background-position:-1000px 0} 100%{background-position:1000px 0} }
      @keyframes mb-popin { 0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
      @keyframes mb-path-flow { 0%{stroke-dashoffset:50} 100%{stroke-dashoffset:0} }
      @keyframes mb-ring-pulse { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.7);opacity:0} }
      @keyframes mb-twinkle { 0%,100%{opacity:.2} 50%{opacity:.8} }
      @keyframes mb-bob { 0%,100%{transform:translate(0,0)} 50%{transform:translate(4px,-6px)} }
      @keyframes mb-fly { 0%{transform:translate(0,0) rotate(-2deg)} 50%{transform:translate(20px,-15px) rotate(2deg)} 100%{transform:translate(0,0) rotate(-2deg)} }
      @keyframes mb-walk { 0%,100%{transform:translate(0,0) scaleX(1)} 50%{transform:translate(8px,-3px) scaleX(1)} }
      @keyframes mb-arm-wave { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
      @keyframes mb-rocket-fly { 0%{transform:translate(-30px,10px) rotate(45deg)} 100%{transform:translate(30px,-20px) rotate(45deg)} }
      .map-node{transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
      .map-node:hover:not(.map-locked){transform:scale(1.1) translateY(-4px)}
      .map-node:active:not(.map-locked){transform:scale(.92) translateY(2px);transition:transform .1s}
      @keyframes mb-click-burst {
        0%{transform:scale(.5);opacity:1}
        100%{transform:scale(2.5);opacity:0}
      }
      .map-scroll::-webkit-scrollbar{height:14px}
      .map-scroll::-webkit-scrollbar-track{background:#0a0518;border-radius:7px}
      .map-scroll::-webkit-scrollbar-thumb{background:linear-gradient(90deg,#6B3FA0,#FF8800);border-radius:7px;border:2px solid #0a0518}
      .map-scroll::-webkit-scrollbar-thumb:hover{background:linear-gradient(90deg,#8b5fcf,#ffa030)}
    `}</style>

    {/* ═══ HERO LEVEL CARD ═══ */}
    <div style={{
      position:"relative",zIndex:2,marginBottom:18,
      borderRadius:20,padding:20,
      background:`linear-gradient(135deg,${lv.color}33,${T.purple}66,#1a0a3a)`,
      border:`3px solid ${lv.color}88`,
      boxShadow:`0 8px 40px ${lv.color}55`,
      overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:-15,right:-10,fontSize:120,opacity:.07,transform:"rotate(-15deg)",pointerEvents:"none"}}>🤖</div>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:`linear-gradient(90deg,transparent 30%,${lv.color}22 50%,transparent 70%)`,backgroundSize:"200% 100%",animation:"mb-shimmer 4s infinite linear"}}/>

      <div style={{position:"relative",display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:`3px solid ${lv.color}aa`,animation:"mb-ring-pulse 2s infinite"}}/>
          <div style={{
            width:80,height:80,borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:40,
            background:`radial-gradient(circle at 30% 30%,${lv.color}aa,${lv.color}33,#000)`,
            border:`4px solid ${lv.color}`,
            boxShadow:`0 0 24px ${lv.color}aa`,
            animation:"mb-float 3s ease-in-out infinite",
          }}>{lv.icon}</div>
        </div>

        <div style={{flex:1,minWidth:200}}>
          <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap",marginBottom:2}}>
            <span style={{fontSize:11,color:T.tm,letterSpacing:2,fontWeight:800,textTransform:"uppercase"}}>Level</span>
            <span style={{fontSize:36,fontWeight:900,color:lv.color,textShadow:`0 0 20px ${lv.color}aa`,lineHeight:1}}>{lv.lv}</span>
            <span style={{fontSize:18,fontWeight:900,color:T.tp,letterSpacing:.3}}>{lv.name}</span>
          </div>
          {lv.title&&<div style={{fontSize:11,color:lv.color,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>★ {lv.title}</div>}
          <div style={{fontSize:13,color:T.ol,fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{padding:"2px 10px",borderRadius:12,background:`${T.warn}33`,border:`1px solid ${T.warn}55`}}>⚡ <b style={{color:T.warn}}>{xp}</b> XP</span>
            {nlv&&<span style={{color:T.tm,fontSize:12}}>→ {nlv.icon} <b style={{color:nlv.color}}>{nlv.name}</b> <span style={{color:T.tm}}>({nlv.min-xp} XP)</span></span>}
          </div>
          <div style={{position:"relative",width:"100%",height:14,borderRadius:7,background:"#0008",overflow:"hidden",border:`1px solid ${T.border}`}}>
            <div style={{
              height:"100%",borderRadius:7,
              background:`linear-gradient(90deg,${T.warn},${lv.color},${T.pl})`,
              backgroundSize:"200% 100%",
              animation:"mb-shine 2s infinite linear",
              width:`${lvProgress}%`,
              boxShadow:`0 0 10px ${lv.color}aa`,
            }}/>
          </div>
          {lv.fact&&<div style={{fontSize:11,color:T.ts,marginTop:6,fontStyle:"italic",opacity:.85}}>💡 {lv.fact}</div>}
        </div>

        <div style={{textAlign:"center"}}>
          <div style={{
            width:80,height:80,borderRadius:"50%",
            background:`conic-gradient(${T.ok} ${(cnt/36)*360}deg,${T.border} 0deg)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 0 16px ${T.ok}55`,
          }}>
            <div style={{
              width:64,height:64,borderRadius:"50%",
              background:`radial-gradient(circle,${T.bg},#0a0518)`,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              border:`2px solid ${T.ok}33`,
            }}>
              <div style={{fontSize:22,fontWeight:900,color:T.ok,lineHeight:1}}>{cnt}</div>
              <div style={{fontSize:9,color:T.tm,fontWeight:700}}>/36</div>
              <div style={{fontSize:14}}>🏆</div>
            </div>
          </div>
        </div>

        <button onClick={onHelp} disabled={hasHelp} style={{
          padding:"12px 20px",borderRadius:12,
          border:`3px solid ${hasHelp?T.warn:T.err}88`,
          background:hasHelp?`${T.warn}22`:`${T.err}15`,
          color:hasHelp?T.warn:T.err,
          cursor:hasHelp?"default":"pointer",
          fontWeight:800,fontSize:14,
          display:"flex",alignItems:"center",gap:6,
          animation:hasHelp?"mb-bounce 1s infinite":"none",
        }}>
          {hasHelp?<>⏳ Bekleniyor</>:<>🖐 Eğitmen Çağır</>}
        </button>
      </div>
    </div>

    {/* ═══ INSPIRATIONAL QUOTE BANNER — rotates every 8s ═══ */}
    <div key={quoteIdx} style={{
      position:"relative",marginBottom:14,
      borderRadius:16,padding:"16px 22px",
      background:`linear-gradient(135deg,${T.purple}33,${T.orange}22,${T.card})`,
      border:`2px solid ${T.orange}55`,
      overflow:"hidden",
      animation:"quote-fade .8s ease-out",
    }}>
      <style>{`
        @keyframes quote-fade {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes quote-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      {/* Decorative quote marks */}
      <div style={{position:"absolute",top:-8,left:14,fontSize:60,color:T.orange,opacity:.2,fontFamily:"Georgia,serif",pointerEvents:"none",lineHeight:1}}>"</div>
      <div style={{position:"absolute",bottom:-30,right:14,fontSize:60,color:T.purple,opacity:.2,fontFamily:"Georgia,serif",pointerEvents:"none",lineHeight:1}}>"</div>
      {/* Shine sweep */}
      <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,transparent,${T.orange}22,transparent)`,animation:"quote-shine 3s ease-in-out",pointerEvents:"none"}}/>

      <div style={{position:"relative",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        {/* Author emoji avatar */}
        <div style={{
          width:54,height:54,borderRadius:"50%",flexShrink:0,
          background:`radial-gradient(circle at 30% 30%,${T.orange}aa,${T.purple}88)`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:28,
          border:`2px solid ${T.orange}66`,
          boxShadow:`0 4px 14px ${T.orange}55`,
        }}>{currentQuote.emoji}</div>

        <div style={{flex:1,minWidth:200}}>
          <div style={{
            fontSize:15,color:T.tp,fontWeight:600,lineHeight:1.5,
            fontStyle:"italic",fontFamily:"Georgia,serif",
            marginBottom:6,
          }}>"{currentQuote.text}"</div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{
              fontSize:13,fontWeight:800,color:T.orange,
              letterSpacing:.5,
            }}>— {currentQuote.author}</span>
            <span style={{fontSize:11,padding:"2px 8px",borderRadius:8,background:T.purple+"33",color:T.pl,fontWeight:600}}>{currentQuote.role}</span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="resp-hide-phone" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{fontSize:9,color:T.tm,letterSpacing:1,fontWeight:700}}>{quoteIdx+1}/{QUOTES.length}</div>
          <div style={{display:"flex",gap:3,maxWidth:80,flexWrap:"wrap",justifyContent:"center"}}>
            {QUOTES.map((_,i)=>(
              <div key={i} style={{
                width:5,height:5,borderRadius:"50%",
                background:i===quoteIdx?T.orange:T.border,
                boxShadow:i===quoteIdx?`0 0 6px ${T.orange}`:"none",
              }}/>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* ═══ SCROLL HINT ═══ */}
    <div style={{
      display:"flex",justifyContent:"space-between",alignItems:"center",
      marginBottom:8,padding:"0 4px",
    }}>
      <div style={{fontSize:13,color:T.ts,fontWeight:700,letterSpacing:1}}>
        🗺️ <span style={{color:T.orange}}>Macera Haritası</span> — Sağa kaydırarak ilerle
      </div>
      <div style={{fontSize:11,color:T.tm,fontStyle:"italic"}}>
        ← → ok tuşlarıyla da kaydırabilirsin
      </div>
    </div>

    {/* ═══ ADVENTURE MAP — One huge horizontal scrolling map ═══ */}
    <div ref={mapRef} className="map-scroll" style={{
      position:"relative",
      overflowX:"auto",overflowY:"hidden",
      borderRadius:24,
      border:`3px solid ${T.purple}66`,
      background:`linear-gradient(180deg,#0a0518,#1a0a3a 50%,#0a0518)`,
      boxShadow:`0 8px 40px ${T.purple}44,inset 0 0 80px ${T.purple}22`,
      cursor:"grab",
    }} onMouseDown={e=>e.currentTarget.style.cursor="grabbing"} onMouseUp={e=>e.currentTarget.style.cursor="grab"}>
      <div style={{
        position:"relative",
        width:`${totalWidth}px`,
        height:`${MAP_HEIGHT}px`,
      }}>
        {/* TWINKLING STARS */}
        {[...Array(60)].map((_,i)=>(
          <div key={`star${i}`} style={{
            position:"absolute",
            left:`${(i*73)%totalWidth}px`,
            top:`${(i*47)%MAP_HEIGHT}px`,
            fontSize:`${4+(i%4)*2}px`,
            color:i%5===0?"#fbbf24":i%5===1?"#a78bfa":i%5===2?"#22d3ee":"#fff",
            animation:`mb-twinkle ${2+(i%4)}s infinite`,
            animationDelay:`${(i*0.2)%4}s`,
            pointerEvents:"none",
          }}>{i%3===0?"✦":"·"}</div>
        ))}

        {/* ROBOTIC WORLD DECORATIONS — drones, robot dogs, robot arms, satellites */}
        {(()=>{
          // Distribute decorations across the map width
          const decos=[
            {emoji:"🚁",size:50,anim:"mb-fly",dur:"5s",alt:"drone"},
            {emoji:"🤖",size:55,anim:"mb-bob",dur:"4s"},
            {emoji:"🦾",size:48,anim:"mb-arm-wave",dur:"3s",origin:"bottom"},
            {emoji:"🛸",size:45,anim:"mb-fly",dur:"6s"},
            {emoji:"🐕‍🦺",size:50,anim:"mb-walk",dur:"3.5s"},
            {emoji:"📡",size:42,anim:"mb-bob",dur:"5s"},
            {emoji:"🚀",size:46,anim:"mb-rocket-fly",dur:"4s"},
            {emoji:"🤖",size:52,anim:"mb-bob",dur:"4.5s"},
            {emoji:"🦿",size:44,anim:"mb-walk",dur:"3s"},
            {emoji:"🎮",size:40,anim:"mb-bob",dur:"3s"},
            {emoji:"🛰️",size:48,anim:"mb-fly",dur:"7s"},
            {emoji:"⚙️",size:42,anim:"mb-spin",dur:"8s"},
            {emoji:"🔋",size:38,anim:"mb-bob",dur:"4s"},
            {emoji:"💻",size:44,anim:"mb-bob",dur:"5s"},
            {emoji:"🦾",size:50,anim:"mb-arm-wave",dur:"4s"},
            {emoji:"🤖",size:48,anim:"mb-bob",dur:"3.8s"},
            {emoji:"🚁",size:46,anim:"mb-fly",dur:"5.5s"},
            {emoji:"🐕‍🦺",size:52,anim:"mb-walk",dur:"4s"},
            {emoji:"⚡",size:36,anim:"mb-bob",dur:"2s"},
            {emoji:"🛸",size:50,anim:"mb-fly",dur:"6.5s"},
          ];
          // Spread across map: corners + middle, top + bottom
          return decos.map((d,i)=>{
            // Distribute X across full width with some randomness
            const xPercent=(i*5.5+8)%95;
            const x=(totalWidth*xPercent/100);
            // Alternate top/bottom rows; avoid path centerline (around 200-280)
            const yZone=i%4;
            let y;
            if(yZone===0)y=70+(i*7)%40;          // top row
            else if(yZone===1)y=MAP_HEIGHT-100+(i*5)%30;  // bottom row
            else if(yZone===2)y=40+(i*11)%30;     // very top
            else y=MAP_HEIGHT-60+(i*3)%20;        // very bottom
            return(
              <div key={`deco${i}`} style={{
                position:"absolute",
                left:`${x}px`,top:`${y}px`,
                fontSize:`${d.size}px`,
                opacity:.18,
                animation:`${d.anim} ${d.dur} infinite ease-in-out`,
                animationDelay:`${(i*0.3)%3}s`,
                pointerEvents:"none",
                filter:"drop-shadow(0 2px 8px #000)",
                transformOrigin:d.origin||"center",
                zIndex:1,
              }}>{d.emoji}</div>
            );
          });
        })()}

        {/* CATEGORY ZONE BANDS — vertical color stripes */}
        {zones.map((z,i)=>(
          <div key={`zone${i}`} style={{
            position:"absolute",
            left:`${z.startX}px`,
            top:0,bottom:0,
            width:`${z.endX-z.startX}px`,
            background:`linear-gradient(180deg,${z.theme.c}11,transparent 30%,transparent 70%,${z.theme.c}11)`,
            pointerEvents:"none",
            borderLeft:i>0?`2px dashed ${z.theme.c}44`:"none",
          }}>
            {/* Zone label at top */}
            <div style={{
              position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",
              padding:"6px 16px",borderRadius:20,
              background:`linear-gradient(135deg,${z.theme.c},${z.theme.c}cc)`,
              color:"#fff",fontSize:13,fontWeight:900,
              letterSpacing:1,textTransform:"uppercase",
              boxShadow:`0 4px 14px ${z.theme.c}88`,
              whiteSpace:"nowrap",
              border:"2px solid #fff2",
            }}>
              <span style={{marginRight:6}}>{z.theme.icon}</span>{z.cat}
            </div>
            {/* Decorative scene element */}
            <div style={{
              position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",
              fontSize:60,opacity:.12,
              animation:"mb-bob 4s infinite ease-in-out",
              pointerEvents:"none",
            }}>{z.theme.scene}</div>
          </div>
        ))}

        {/* SVG WAVY PATH */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox={`0 0 ${totalWidth} ${MAP_HEIGHT}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={T.orange} stopOpacity=".7"/>
              <stop offset="50%" stopColor={T.pl} stopOpacity=".7"/>
              <stop offset="100%" stopColor={T.cyan} stopOpacity=".7"/>
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Generate smooth path connecting all nodes */}
          <path
            d={positions.map((p,i)=>{
              if(i===0)return `M ${p.x} ${p.y}`;
              const prev=positions[i-1];
              const cx=(prev.x+p.x)/2;
              return `Q ${cx} ${prev.y}, ${cx} ${(prev.y+p.y)/2} T ${p.x} ${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="url(#pathGrad)"
            strokeWidth="6"
            strokeDasharray="12 8"
            strokeLinecap="round"
            style={{animation:"mb-path-flow 1.5s linear infinite",filter:"url(#glow)"}}
          />
        </svg>

        {/* TASK NODES */}
        {positions.map((p,idx)=>{
          const t=p.task;
          const theme=p.theme;
          const s=sp[t.id]?.status||TS.LOCKED;
          const locked=s===TS.LOCKED;
          const approved=s===TS.APPROVED;
          const active=s===TS.ACTIVE||s===TS.IN_PROGRESS;
          const pending=s===TS.PENDING;
          const rejected=s===TS.REJECTED;
          const started=sp[t.id]?.startedAt;
          const completed=sp[t.id]?.completedAt||sp[t.id]?.approvedAt;
          const dur=(started&&completed)?fd(completed-started):null;
          const diff=diffLabel(t.diff);

          return(
            <div key={t.id}
              className={`map-node ${locked?"map-locked":""}`}
              onClick={()=>!locked&&onSel(t)}
              style={{
                position:"absolute",
                left:`${p.x-70}px`,
                top:`${p.y-70}px`,
                width:140,
                cursor:locked?"not-allowed":"pointer",
                opacity:locked?.5:1,
                zIndex:active?5:approved?3:2,
              }}>

              {/* Active pulse ring */}
              {active&&<div style={{
                position:"absolute",top:5,left:25,width:90,height:90,
                borderRadius:"50%",border:`3px solid ${T.orange}`,
                animation:"mb-ring-pulse 1.8s infinite",pointerEvents:"none",
              }}/>}

              {/* Confetti */}
              {approved&&[...Array(3)].map((_,ci)=>(
                <span key={ci} style={{
                  position:"absolute",top:0,
                  left:`${30+ci*30}%`,
                  fontSize:14,
                  animation:`mb-confetti 2s ${ci*0.3}s infinite ease-out`,
                  pointerEvents:"none",zIndex:10,
                }}>{["✨","⭐","🎉"][ci]}</span>
              ))}

              {/* Hexagon node */}
              <div style={{
                position:"relative",width:100,height:100,margin:"0 auto",
                background:approved
                  ?`radial-gradient(circle at 30% 30%,${T.ok}ee,${T.ok}66)`
                  :active
                  ?`radial-gradient(circle at 30% 30%,${T.orange}ee,${T.orange}66)`
                  :pending
                  ?`radial-gradient(circle at 30% 30%,${T.pl}ee,${T.pl}66)`
                  :rejected
                  ?`radial-gradient(circle at 30% 30%,${T.err}ee,${T.err}66)`
                  :`radial-gradient(circle at 30% 30%,${theme.c}66,${theme.c}22)`,
                clipPath:"polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
                boxShadow:active
                  ?`0 0 30px ${T.orange}cc,0 0 60px ${T.orange}66`
                  :approved
                  ?`0 6px 22px ${T.ok}99`
                  :pending
                  ?`0 6px 22px ${T.pl}77`
                  :`0 4px 16px ${theme.c}55`,
              }}>
                {/* Inner hex */}
                <div style={{
                  position:"absolute",inset:6,
                  background:approved?T.ok:active?T.orange:pending?T.pl:rejected?T.err:T.dark,
                  clipPath:"polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
                }}/>
                {/* Inner content */}
                <div style={{
                  position:"absolute",inset:9,
                  background:`radial-gradient(circle at 40% 30%,${T.card},#0a0518)`,
                  clipPath:"polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  <TaskImage taskId={t.id} type="gorsel" size={64} fallbackEmoji={t.img} style={{borderRadius:"50%",width:64,height:64,objectFit:"cover"}}/>
                </div>

                {/* Number badge */}
                <div style={{
                  position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",
                  width:32,height:32,borderRadius:"50%",
                  background:`linear-gradient(135deg,${theme.c},${theme.c}88)`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:13,fontWeight:900,color:"#fff",
                  border:`2px solid ${T.bg}`,
                  boxShadow:`0 2px 10px ${theme.c}aa`,
                  textShadow:"0 1px 2px #0008",zIndex:2,
                }}>{t.id}</div>

                {/* Status pip */}
                {approved&&<div style={{
                  position:"absolute",bottom:-4,right:-2,
                  width:30,height:30,borderRadius:"50%",
                  background:`radial-gradient(circle,${T.ok},#22a55a)`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,color:"#fff",fontWeight:900,
                  boxShadow:`0 0 12px ${T.ok}cc`,
                  border:`2px solid ${T.bg}`,
                  animation:"mb-popin .5s",zIndex:3,
                }}>✓</div>}
                {active&&<div style={{
                  position:"absolute",bottom:-4,right:-2,
                  width:30,height:30,borderRadius:"50%",
                  background:`linear-gradient(135deg,${T.orange},${T.od})`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:14,color:"#fff",
                  boxShadow:`0 0 14px ${T.orange}cc`,
                  border:`2px solid ${T.bg}`,
                  animation:"mb-bounce 1.5s infinite",zIndex:3,
                }}>▶</div>}
                {pending&&<div style={{
                  position:"absolute",bottom:-4,right:-2,
                  width:30,height:30,borderRadius:"50%",
                  background:`linear-gradient(135deg,${T.pl},${T.purple})`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:14,color:"#fff",
                  border:`2px solid ${T.bg}`,zIndex:3,
                }}>⏳</div>}
                {rejected&&<div style={{
                  position:"absolute",bottom:-4,right:-2,
                  width:30,height:30,borderRadius:"50%",
                  background:T.err,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:14,color:"#fff",
                  border:`2px solid ${T.bg}`,zIndex:3,
                }}>↻</div>}

                {/* Lock overlay */}
                {locked&&<div style={{
                  position:"absolute",inset:0,
                  background:"#0a0518cc",
                  clipPath:"polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  <span style={{fontSize:30,filter:"grayscale(.5)"}}>🔒</span>
                </div>}
              </div>

              {/* Task info card below */}
              <div style={{
                marginTop:14,textAlign:"center",
                padding:"8px 6px",borderRadius:10,
                background:`${T.card}cc`,
                border:`1px solid ${active?T.orange:approved?T.ok:T.border}66`,
                backdropFilter:"blur(8px)",
              }}>
                <div style={{
                  fontSize:12,fontWeight:800,color:locked?T.tm:T.tp,
                  lineHeight:1.2,
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                  marginBottom:4,
                }}>{t.title}</div>

                {/* Difficulty pill + XP */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,flexWrap:"wrap"}}>
                  <span style={{
                    fontSize:9,padding:"2px 7px",borderRadius:8,
                    background:diff.bg,color:diff.c,
                    fontWeight:900,letterSpacing:.5,
                    border:`1px solid ${diff.c}55`,
                  }}>{diff.l}</span>
                  <span style={{
                    fontSize:10,padding:"2px 7px",borderRadius:8,
                    background:`${T.warn}22`,color:T.warn,
                    fontWeight:900,
                    border:`1px solid ${T.warn}44`,
                  }}>⚡{t.xp}</span>
                </div>

                {dur&&<div style={{fontSize:9,color:T.ok,marginTop:3,fontWeight:700}}>⏱ {dur}</div>}
              </div>
            </div>
          );
        })}

        {/* START FLAG */}
        <div style={{
          position:"absolute",
          left:`${PAD_X-50}px`,
          top:`${positions[0].y-30}px`,
          fontSize:50,
          animation:"mb-bob 2s infinite",
          pointerEvents:"none",
        }}>🏁</div>

        {/* FINISH TROPHY */}
        <div style={{
          position:"absolute",
          left:`${positions[positions.length-1].x+40}px`,
          top:`${positions[positions.length-1].y-30}px`,
          fontSize:60,
          animation:cnt===36?"mb-bounce 1s infinite":"mb-bob 3s infinite",
          filter:cnt===36?`drop-shadow(0 0 20px ${T.warn})`:"grayscale(.4)",
          pointerEvents:"none",
        }}>🏆</div>
      </div>
    </div>

    {/* ═══ MAP NAVIGATOR — mini overview ═══ */}
    <div style={{
      marginTop:14,padding:14,borderRadius:14,
      background:T.card,border:`1px solid ${T.border}`,
    }}>
      <div style={{fontSize:11,color:T.tm,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>📍 Hızlı Atlama</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {zones.map((z,i)=>{
          const ct=TASKS.filter(t=>t.cat===z.cat);
          const cd=ct.filter(t=>sp[t.id]?.status===TS.APPROVED).length;
          const done=cd===ct.length;
          return(
            <button key={i} onClick={()=>{
              if(mapRef.current)mapRef.current.scrollTo({left:Math.max(0,z.startX-100),behavior:"smooth"});
            }} style={{
              padding:"6px 12px",borderRadius:10,
              border:`2px solid ${z.theme.c}55`,
              background:`${z.theme.c}15`,color:z.theme.c,
              cursor:"pointer",fontSize:12,fontWeight:700,
              display:"flex",alignItems:"center",gap:6,
            }}>
              <span>{z.theme.icon}</span>
              <span>{z.cat}</span>
              <span style={{fontSize:10,opacity:.8}}>{cd}/{ct.length}</span>
              {done&&<span>✓</span>}
            </button>
          );
        })}
      </div>
    </div>

    {/* ═══ FINAL TROPHY BANNER ═══ */}
    {cnt===36&&<div style={{
      marginTop:16,textAlign:"center",padding:30,
      borderRadius:24,
      background:`linear-gradient(135deg,${T.warn}44,${T.orange}44,${T.pl}33)`,
      border:`4px solid ${T.warn}aa`,
    }}>
      <div style={{fontSize:80,animation:"mb-float 3s ease-in-out infinite"}}>🏆</div>
      <div style={{fontSize:28,fontWeight:900,color:T.warn,marginTop:8,letterSpacing:2,textShadow:`0 0 20px ${T.warn}`}}>BERRYBOT MASTER!</div>
      <div style={{fontSize:14,color:T.tp,marginTop:4}}>Tüm 36 görevi tamamladın. Sen bir robotik efsanesin! 🤖✨</div>
    </div>}
  </div>);
}

function StudentTaskView({user,task:t,prog,answerUnlocks=[],onStart,onSubmit,onResub,onHelp,onBack}){
  const[imgZoom,setImgZoom]=useState(false);
  const[imgLoaded,setImgLoaded]=useState(false);
  const[imgError,setImgError]=useState(false);
  const[photo,setPhoto]=useState(null);
  const[photoPreview,setPhotoPreview]=useState(null);
  const[savedPhoto,setSavedPhoto]=useState(null);
  const[now,setNow]=useState(Date.now()); // live tick
  const[mediaTab,setMediaTab]=useState("image"); // image | video | answer
  const[videoError,setVideoError]=useState(false);
  const[videoEnded,setVideoEnded]=useState(false);
  const[answerLoaded,setAnswerLoaded]=useState(false);
  const[answerError,setAnswerError]=useState(false);
  const[answerZoom,setAnswerZoom]=useState(false);
  const tp=prog[user.id]?.[t.id]||{};
  const imgSrc=`/tasks/gorev_${t.id}/gorsel.jpg`;
  const videoSrc=`/tasks/gorev_${t.id}/cozum.mp4`;
  const answerSrc=`/tasks/gorev_${t.id}/cevap.jpg`;
  const hasHelp=prog[user.id]?.helpRequest;
  // Cevap anahtarı SADECE eğitmen kilidi açtığında erişilebilir (onay yetmiyor!)
  const answerUnlocked=answerUnlocks.some(au=>au.student_id===user.id&&au.task_id===t.id);

  // Live timer ticking every second when IN_PROGRESS
  useEffect(()=>{
    if(tp.status===TS.IN_PROGRESS){
      const iv=setInterval(()=>setNow(Date.now()),1000);
      return ()=>clearInterval(iv);
    }
  },[tp.status]);

  // Calculate elapsed/score
  const elapsedMs=tp.startedAt?(now-tp.startedAt):0;
  const elapsedMin=elapsedMs/60000;
  const expectedMin=t.expectedMin||15;
  const timeRatio=elapsedMin/expectedMin;
  const timeColor=timeRatio<=0.8?"#22c55e":timeRatio<=1.0?"#3b82f6":timeRatio<=1.5?"#f59e0b":"#ef4444";
  const finalScore=tp.completedAt&&tp.startedAt?calcTaskScore(tp.completedAt-tp.startedAt,expectedMin):null;

  // Category theme matching MissionBoard
  const catThemes={
    "RGB LED":{c:"#ff6b9d",icon:"💡"},"Motor":{c:"#fbbf24",icon:"⚙️"},
    "Sensör+LED+Buzzer":{c:"#22d3ee",icon:"📡"},"Işık Sensörü":{c:"#fde047",icon:"🔦"},
    "IR Kumanda":{c:"#a78bfa",icon:"🎮"},"Fonksiyon":{c:"#f472b6",icon:"📦"},
    "Mesafe/Navigasyon":{c:"#34d399",icon:"🧭"},"Engel Algılama":{c:"#fb7185",icon:"🚧"},
    "Çizgi Takip":{c:"#60a5fa",icon:"〰️"},"Sumo Robot":{c:"#f87171",icon:"🤼"},
    "Işık Takip":{c:"#facc15",icon:"🌟"},
  };
  const theme=catThemes[t.cat]||{c:T.orange,icon:"🎯"};

  useEffect(()=>{
    if(tp.photo){getLocalPhoto(user.id,t.id).then(p=>setSavedPhoto(p));}
  },[user.id,t.id,tp.photo]);

  const handlePhotoUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const img=new Image();
    img.onload=()=>{
      const MAX=800;let w=img.width,h=img.height;
      if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      const compressed=canvas.toDataURL('image/jpeg',0.6);
      setPhoto(compressed);setPhotoPreview(compressed);
      URL.revokeObjectURL(img.src);
    };
    img.src=URL.createObjectURL(file);
  };

  return(<div className="stv-enter" style={{position:"relative"}}>
    <style>{`
      @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes glowBox { 0%,100%{box-shadow:0 0 20px var(--tc)55,0 0 40px var(--tc)33} 50%{box-shadow:0 0 35px var(--tc)88,0 0 60px var(--tc)55} }
      @keyframes pulseRing { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.5);opacity:0} }
      @keyframes celebrate { 0%{transform:scale(0) rotate(0deg)} 50%{transform:scale(1.2) rotate(180deg)} 100%{transform:scale(1) rotate(360deg)} }
      @keyframes confettiFall { 0%{transform:translateY(-100px) rotate(0deg);opacity:1} 100%{transform:translateY(400px) rotate(720deg);opacity:0} }
      @keyframes shimmer-tv { 0%{background-position:-1000px 0} 100%{background-position:1000px 0} }

      /* ═══ TASK ENTRANCE ANIMATIONS ═══ */
      @keyframes stv-zoom-in {
        0%   { opacity:0; transform: scale(.85) translateY(30px); filter: blur(8px); }
        60%  { opacity:1; filter: blur(0px); }
        100% { opacity:1; transform: scale(1) translateY(0); filter: blur(0px); }
      }
      @keyframes stv-warp-flash {
        0%   { opacity:0; transform: scale(.5); }
        30%  { opacity:1; transform: scale(1.1); }
        100% { opacity:0; transform: scale(2); }
      }
      @keyframes stv-portal-rings {
        0%   { transform: scale(.3); opacity:1; border-width:4px; }
        100% { transform: scale(2.5); opacity:0; border-width:1px; }
      }
      @keyframes stv-back-slide {
        0%   { opacity:0; transform: translateX(-30px); }
        100% { opacity:1; transform: translateX(0); }
      }
      @keyframes stv-section-pop {
        0%   { opacity:0; transform: translateY(40px) scale(.95); }
        100% { opacity:1; transform: translateY(0) scale(1); }
      }
      @keyframes stv-flash-out {
        0%   { opacity:1; }
        100% { opacity:0; pointer-events:none; }
      }

      .stv-enter { animation: stv-zoom-in .55s cubic-bezier(.34,1.56,.64,1) backwards; }
      .stv-section { animation: stv-section-pop .5s cubic-bezier(.34,1.56,.64,1) backwards; }
      .stv-back-anim { animation: stv-back-slide .4s ease-out backwards; }

      .stv-portal-overlay {
        position: fixed; inset: 0; z-index: 999;
        display: flex; align-items: center; justify-content: center;
        background: radial-gradient(circle at center, var(--tc)44, transparent 70%);
        pointer-events: none;
        animation: stv-flash-out .8s ease-out forwards;
      }
      .stv-portal-ring {
        position: absolute; width: 200px; height: 200px;
        border-radius: 50%; border: 4px solid var(--tc);
        animation: stv-portal-rings .8s ease-out forwards;
      }
      .stv-portal-flash {
        position: absolute; width: 100px; height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--tc)cc, var(--tc)33, transparent);
        animation: stv-warp-flash .6s ease-out forwards;
        filter: blur(4px);
      }
    `}</style>

    {/* ═══ PORTAL ENTRANCE OVERLAY ═══ */}
    <div className="stv-portal-overlay" style={{"--tc":theme.c}}>
      <div className="stv-portal-flash" style={{"--tc":theme.c}}/>
      <div className="stv-portal-ring" style={{"--tc":theme.c,animationDelay:"0s"}}/>
      <div className="stv-portal-ring" style={{"--tc":theme.c,animationDelay:".15s"}}/>
      <div className="stv-portal-ring" style={{"--tc":theme.c,animationDelay:".3s"}}/>
      <div style={{
        position:"absolute",fontSize:80,
        animation:"celebrate 0.7s ease-out forwards",
        filter:`drop-shadow(0 0 20px ${theme.c})`,
      }}>{theme.icon}</div>
    </div>

    {/* Top back button */}
    <button onClick={onBack} className="stv-back-anim" style={{
      fontSize:14,padding:"8px 18px",borderRadius:10,
      background:`${theme.c}22`,color:theme.c,
      border:`2px solid ${theme.c}44`,cursor:"pointer",
      marginBottom:14,fontWeight:700,
      display:"inline-flex",alignItems:"center",gap:6,
    }}>← Görevlere Dön</button>

    {/* Lightbox */}
    {imgZoom&&<div onClick={()=>setImgZoom(false)} style={{position:"fixed",inset:0,zIndex:100,background:"#000e",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",padding:20}}>
      <div style={{position:"relative",maxWidth:"90vw",maxHeight:"90vh"}}>
        <img src={imgSrc} alt={`Görev ${t.id}`} style={{maxWidth:"90vw",maxHeight:"85vh",objectFit:"contain",borderRadius:12,border:`2px solid ${theme.c}44`}}/>
        <div style={{position:"absolute",top:-40,right:0,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,color:T.ts}}>Görev #{t.id} — {t.title}</span>
          <button onClick={()=>setImgZoom(false)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.tp,padding:"6px 14px",cursor:"pointer",fontSize:14}}>✕ Kapat</button>
        </div>
      </div>
    </div>}

    {/* ═══ HERO BANNER ═══ */}
    <div className="stv-section" style={{
      position:"relative",marginBottom:18,
      borderRadius:20,padding:"22px 24px",overflow:"hidden",
      background:`linear-gradient(135deg,${theme.c}33,${T.purple}33,#1a0a3a)`,
      border:`3px solid ${theme.c}66`,
      "--tc":theme.c,
    }}>
      {/* Decorative big icon backdrop */}
      <div style={{position:"absolute",top:-30,right:-20,fontSize:200,opacity:.08,transform:"rotate(-15deg)",pointerEvents:"none"}}>{theme.icon}</div>
      {/* Shimmer */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:`linear-gradient(90deg,transparent 30%,${theme.c}22 50%,transparent 70%)`,backgroundSize:"200% 100%",animation:"shimmer-tv 4s infinite linear"}}/>

      <div style={{position:"relative",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        {/* Mission number + icon */}
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",inset:-4,borderRadius:"50%",border:`2px solid ${theme.c}88`,animation:"pulseRing 2s infinite",pointerEvents:"none"}}/>
          <div style={{
            width:74,height:74,borderRadius:"50%",
            background:`radial-gradient(circle at 30% 30%,${theme.c}cc,${theme.c}55)`,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            border:`3px solid ${theme.c}`,
            boxShadow:`0 0 24px ${theme.c}88`,
          }}>
            <div style={{fontSize:26}}>{theme.icon}</div>
            <div style={{fontSize:11,fontWeight:900,color:"#fff",marginTop:-2,textShadow:"0 1px 2px #0008"}}>#{t.id}</div>
          </div>
        </div>

        <div style={{flex:1,minWidth:200}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:`${theme.c}33`,color:theme.c,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>{t.cat}</span>
            <Badge s={tp.status}/>
          </div>
          <h2 style={{margin:0,fontSize:24,fontWeight:900,color:T.tp,letterSpacing:.3,lineHeight:1.2}}>{t.title}</h2>
        </div>

        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{padding:"8px 14px",borderRadius:12,background:`linear-gradient(135deg,${T.warn}33,${T.warn}11)`,border:`2px solid ${T.warn}55`}}>
            <div style={{fontSize:10,color:T.tm,fontWeight:700,letterSpacing:1,textAlign:"center"}}>ÖDÜL</div>
            <div style={{fontSize:18,fontWeight:900,color:T.warn,textAlign:"center"}}>⚡ {t.xp}</div>
          </div>
          <div style={{padding:"8px 14px",borderRadius:12,background:`${T.purple}22`,border:`2px solid ${T.purple}55`}}>
            <div style={{fontSize:10,color:T.tm,fontWeight:700,letterSpacing:1,textAlign:"center"}}>ZORLUK</div>
            <div style={{fontSize:14,textAlign:"center"}}><Stars n={t.diff}/></div>
          </div>
          <div style={{padding:"8px 14px",borderRadius:12,background:`${T.cyan}22`,border:`2px solid ${T.cyan}55`}}>
            <div style={{fontSize:10,color:T.tm,fontWeight:700,letterSpacing:1,textAlign:"center"}}>HEDEF SÜRE</div>
            <div style={{fontSize:18,fontWeight:900,color:T.cyan,textAlign:"center"}}>⏱ {expectedMin}<span style={{fontSize:11,opacity:.7}}>dk</span></div>
          </div>
          {finalScore!==null&&<div style={{padding:"8px 14px",borderRadius:12,background:`${gradeColor(finalScore)}22`,border:`2px solid ${gradeColor(finalScore)}88`}}>
            <div style={{fontSize:10,color:T.tm,fontWeight:700,letterSpacing:1,textAlign:"center"}}>PUAN</div>
            <div style={{fontSize:18,fontWeight:900,color:gradeColor(finalScore),textAlign:"center"}}>🎯 {finalScore}</div>
          </div>}
        </div>
      </div>
    </div>

    {/* ═══ MEDIA HERO — Full Width ═══ */}
    <div className="stv-section" style={{animationDelay:".05s"}}>
      <div style={{
        marginBottom:14,borderRadius:18,overflow:"hidden",
        border:`3px solid ${theme.c}66`,
        background:T.card,
        boxShadow:`0 8px 30px ${theme.c}33`,
      }}>
        {/* TAB BAR */}
        <div style={{display:"flex",borderBottom:`2px solid ${T.border}`,background:T.dark,flexWrap:"wrap"}}>
          <button onClick={()=>setMediaTab("image")} style={{
            flex:"1 1 100px",padding:"12px 10px",border:"none",cursor:"pointer",
            background:mediaTab==="image"?theme.c+"22":"transparent",
            color:mediaTab==="image"?theme.c:T.ts,
            fontWeight:800,fontSize:13,letterSpacing:.5,
            borderBottom:mediaTab==="image"?`3px solid ${theme.c}`:"3px solid transparent",
            display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            transition:"all .2s",
          }}>📷 Görev</button>
          <button onClick={()=>setMediaTab("video")} style={{
            flex:"1 1 100px",padding:"12px 10px",border:"none",cursor:"pointer",
            background:mediaTab==="video"?T.err+"22":"transparent",
            color:mediaTab==="video"?T.err:T.ts,
            fontWeight:800,fontSize:13,letterSpacing:.5,
            borderBottom:mediaTab==="video"?`3px solid ${T.err}`:"3px solid transparent",
            display:"flex",alignItems:"center",justifyContent:"center",gap:6,position:"relative",
            transition:"all .2s",
          }}>
            ▶️ Çözüm Videosu
            {!videoEnded&&<span style={{
              position:"absolute",top:8,right:14,
              width:8,height:8,borderRadius:"50%",background:T.err,
              animation:"pulse 1.5s infinite",
            }}/>}
          </button>
          <button onClick={()=>setMediaTab("answer")} style={{
            flex:"1 1 100px",padding:"12px 10px",border:"none",cursor:"pointer",
            background:mediaTab==="answer"?(answerUnlocked?T.ok+"22":T.purple+"22"):"transparent",
            color:mediaTab==="answer"?(answerUnlocked?T.ok:T.pl):T.ts,
            fontWeight:800,fontSize:13,letterSpacing:.5,
            borderBottom:mediaTab==="answer"?`3px solid ${answerUnlocked?T.ok:T.purple}`:"3px solid transparent",
            display:"flex",alignItems:"center",justifyContent:"center",gap:6,position:"relative",
            transition:"all .2s",
          }}>
            {answerUnlocked?<>🔓 Cevap Anahtarı</>:<>🔒 Cevap Anahtarı</>}
            {answerUnlocked&&<span style={{
              position:"absolute",top:8,right:14,
              width:8,height:8,borderRadius:"50%",background:T.ok,
              animation:"pulse 1.5s infinite",
            }}/>}
          </button>
        </div>

        {/* IMAGE TAB */}
        {mediaTab==="image"&&(!imgError ? (
          <div onClick={()=>imgLoaded&&setImgZoom(true)} style={{width:"100%",maxHeight:520,minHeight:360,background:T.dark,position:"relative",cursor:imgLoaded?"zoom-in":"default",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <img src={imgSrc} alt={`Görev ${t.id}`} onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)}
              style={{width:"100%",height:"auto",maxHeight:520,objectFit:"contain",background:T.dark,opacity:imgLoaded?1:0,transition:"opacity .3s"}}/>
            {!imgLoaded&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
              <span style={{fontSize:80}}>{t.img}</span>
              <span style={{fontSize:13,color:T.tm}}>Görsel yükleniyor...</span>
            </div>}
            {imgLoaded&&<div style={{position:"absolute",bottom:14,right:14,fontSize:12,color:T.ts,background:"#000a",padding:"5px 14px",borderRadius:8,backdropFilter:"blur(4px)"}}>🔍 Büyütmek için tıkla</div>}
          </div>
        ) : (
          <div style={{width:"100%",height:360,background:`linear-gradient(135deg,${theme.c}30,${T.dark})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
            <span style={{fontSize:108}}>{t.img}</span>
            <span style={{fontSize:14,color:T.tm}}>Görev #{t.id}</span>
          </div>
        ))}

        {/* VIDEO TAB */}
        {mediaTab==="video"&&(!videoError?(
          <div style={{position:"relative",background:"#000"}}>
            <video
              key={videoSrc}
              src={videoSrc}
              controls
              playsInline
              preload="metadata"
              onError={()=>setVideoError(true)}
              onEnded={()=>setVideoEnded(true)}
              style={{width:"100%",maxHeight:540,display:"block",background:"#000"}}
            >
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>
            <div style={{
              padding:"12px 16px",
              background:`linear-gradient(135deg,${T.err}22,${T.warn}22)`,
              borderTop:`1px solid ${T.err}33`,
              display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",
            }}>
              <span style={{fontSize:18}}>💡</span>
              <span style={{fontSize:14,color:T.tp,fontWeight:600,flex:1,minWidth:160}}>
                Önce videoyu izle, sonra robotunu PicoBricks IDE'de programla.
              </span>
              {videoEnded&&<span style={{fontSize:12,padding:"3px 10px",borderRadius:8,background:T.ok+"33",color:T.ok,fontWeight:800}}>✓ İzlendi</span>}
            </div>
          </div>
        ):(
          <div style={{padding:60,textAlign:"center",background:T.dark}}>
            <div style={{fontSize:64,opacity:.4,marginBottom:12}}>🎬</div>
            <div style={{fontSize:17,fontWeight:700,color:T.ts,marginBottom:8}}>Çözüm videosu henüz yüklenmemiş</div>
            <div style={{fontSize:13,color:T.tm,maxWidth:340,margin:"0 auto",lineHeight:1.5}}>
              Bu görevin video çözümü yakında eklenecek. Şimdilik görseli ve açıklamayı kullanarak çözmeyi dene!
            </div>
          </div>
        ))}

        {/* ANSWER TAB — sadece APPROVED durumunda erişilebilir */}
        {mediaTab==="answer"&&answerUnlocked&&(!answerError?(
          <div style={{position:"relative"}}>
            <div onClick={()=>answerLoaded&&setAnswerZoom(true)} style={{width:"100%",maxHeight:520,minHeight:360,background:T.dark,position:"relative",cursor:answerLoaded?"zoom-in":"default",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <img src={answerSrc} alt={`Cevap ${t.id}`} onLoad={()=>setAnswerLoaded(true)} onError={()=>setAnswerError(true)}
                style={{width:"100%",height:"auto",maxHeight:520,objectFit:"contain",background:T.dark,opacity:answerLoaded?1:0,transition:"opacity .3s"}}/>
              {!answerLoaded&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
                <span style={{fontSize:80}}>🗝️</span>
                <span style={{fontSize:13,color:T.tm}}>Cevap anahtarı yükleniyor...</span>
              </div>}
              {answerLoaded&&<div style={{position:"absolute",bottom:14,right:14,fontSize:12,color:T.ts,background:"#000a",padding:"5px 14px",borderRadius:8,backdropFilter:"blur(4px)"}}>🔍 Büyütmek için tıkla</div>}
            </div>
            <div style={{
              padding:"12px 16px",
              background:`linear-gradient(135deg,${T.ok}22,${T.warn}22)`,
              borderTop:`1px solid ${T.ok}33`,
              display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",
            }}>
              <span style={{fontSize:18}}>🎉</span>
              <span style={{fontSize:14,color:T.tp,fontWeight:600,flex:1,minWidth:160}}>
                Eğitmenin senin için bu görevin cevap anahtarını açtı. İncelemeden önce kendi çözümünü dene!
              </span>
              <span style={{fontSize:12,padding:"3px 10px",borderRadius:8,background:T.ok+"33",color:T.ok,fontWeight:800}}>🔓 KİLİT AÇIK</span>
            </div>
          </div>
        ):(
          <div style={{padding:60,textAlign:"center",background:T.dark}}>
            <div style={{fontSize:64,opacity:.4,marginBottom:12}}>🗝️</div>
            <div style={{fontSize:17,fontWeight:700,color:T.ts,marginBottom:8}}>Cevap anahtarı henüz yüklenmemiş</div>
            <div style={{fontSize:13,color:T.tm,maxWidth:340,margin:"0 auto",lineHeight:1.5}}>
              Bu görevin cevap anahtarı yakında eklenecek.
            </div>
          </div>
        ))}

        {/* LOCKED ANSWER VIEW — buğulu önizleme, eğitmen onayı bekleniyor */}
        {mediaTab==="answer"&&!answerUnlocked&&(
          <div style={{
            position:"relative",
            width:"100%",maxHeight:520,minHeight:360,
            background:T.dark,overflow:"hidden",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            {/* Buğulu cevap görseli arka planda */}
            <img src={answerSrc}
              onError={()=>{}}
              alt=""
              style={{
                width:"100%",height:"auto",maxHeight:520,objectFit:"contain",
                filter:"blur(20px) brightness(.5) saturate(1.2)",
                transform:"scale(1.08)", // blur kenarlardaki şeffaflığı kapatmak için biraz büyüt
                pointerEvents:"none",userSelect:"none",
              }}/>

            {/* Decorative repeating diagonal pattern overlay */}
            <div style={{
              position:"absolute",inset:0,
              background:"repeating-linear-gradient(45deg,transparent 0,transparent 14px,#ffffff0a 14px,#ffffff0a 16px)",
              pointerEvents:"none",
            }}/>

            {/* Dark gradient overlay for legibility */}
            <div style={{
              position:"absolute",inset:0,
              background:`radial-gradient(ellipse at center,${T.purple}55 0%,#0a0518cc 70%)`,
              pointerEvents:"none",
            }}/>

            {/* LOCK CONTENT (z-index above blur) */}
            <div style={{
              position:"relative",zIndex:2,
              textAlign:"center",padding:"30px 20px",
              maxWidth:480,
            }}>
              <div style={{
                fontSize:80,marginBottom:14,
                filter:`drop-shadow(0 6px 18px ${T.purple})`,
                animation:"celebrate 3s infinite ease-in-out",
              }}>🔒</div>
              <div style={{
                fontSize:24,fontWeight:900,color:"#fff",
                letterSpacing:.5,marginBottom:8,
                textShadow:"0 2px 8px #000a",
              }}>
                Cevap Anahtarı Kilitli
              </div>
              <div style={{
                fontSize:14,color:"#e5e7eb",
                lineHeight:1.6,marginBottom:18,
                textShadow:"0 1px 4px #000a",
              }}>
                Bu görevin cevap anahtarı şu anda <b style={{color:theme.c}}>eğitmenin kontrolünde</b>.
                Eğitmenin uygun gördüğünde sana özel olarak açılır.
              </div>

              {/* Status badge */}
              <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:14,
                background:"#000a",
                backdropFilter:"blur(10px)",
                border:`2px solid ${T.purple}88`,
                fontSize:14,fontWeight:800,color:T.pl,
                boxShadow:"0 4px 16px #000a",
              }}>
                👨‍🏫 Eğitmen Onayı Gerekli
              </div>

              {/* Hint */}
              <div style={{
                marginTop:14,fontSize:11,color:"#cbd5e1",
                fontStyle:"italic",letterSpacing:.5,
                textShadow:"0 1px 2px #000a",
              }}>
                👆 Cevap arkaplanda — eğitmen kilidi açtığında netleşir
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ═══ ANSWER LIGHTBOX ═══ */}
    {answerZoom&&<div onClick={()=>setAnswerZoom(false)} style={{position:"fixed",inset:0,zIndex:100,background:"#000e",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",padding:20}}>
      <div style={{position:"relative",maxWidth:"90vw",maxHeight:"90vh"}}>
        <img src={answerSrc} alt={`Cevap ${t.id}`} style={{maxWidth:"90vw",maxHeight:"85vh",objectFit:"contain",borderRadius:12,border:`2px solid ${T.ok}66`}}/>
        <div style={{position:"absolute",top:-40,right:0,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,color:T.ok}}>🗝️ Görev #{t.id} — Cevap Anahtarı</span>
          <button onClick={()=>setAnswerZoom(false)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.tp,padding:"6px 14px",cursor:"pointer",fontSize:14}}>✕ Kapat</button>
        </div>
      </div>
    </div>}

    {/* ═══ INFO + ACTION — 2 columns BELOW media ═══ */}
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1fr)",gap:14,alignItems:"start"}}>

      {/* ─── LEFT: Description + Learnings ─── */}
      <div className="stv-section" style={{animationDelay:".15s"}}>

        {/* DESCRIPTION */}
        <div style={{
          marginBottom:14,padding:18,borderRadius:18,
          background:T.card,border:`1px solid ${T.border}`,
        }}>
          <div style={{fontSize:11,color:theme.c,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>📋 Görev Açıklaması</div>
          <p style={{fontSize:16,color:T.tp,margin:0,lineHeight:1.7}}>{t.desc}</p>
        </div>

        {/* LEARNINGS */}
        {t.learnings&&t.learnings.length>0&&<div style={{
          padding:18,borderRadius:18,
          background:`linear-gradient(135deg,${T.purple}22,${T.card})`,
          border:`1px solid ${T.purple}44`,
        }}>
          <div style={{fontSize:11,color:T.pl,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>📚 Bu Görevden Kazanımlar</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {t.learnings.map((lr,i)=>(
              <div key={i} style={{
                display:"flex",alignItems:"center",gap:10,
                padding:"10px 14px",borderRadius:10,
                background:`${T.purple}15`,
                border:`1px solid ${T.purple}33`,
              }}>
                <div style={{
                  width:28,height:28,borderRadius:"50%",
                  background:`linear-gradient(135deg,${T.pl},${T.purple})`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:900,color:"#fff",flexShrink:0,
                }}>{i+1}</div>
                <span style={{fontSize:14,color:T.tp,fontWeight:600}}>{lr}</span>
              </div>
            ))}
          </div>
        </div>}
      </div>

      {/* ─── RIGHT: Action Panel ─── */}
      <div className="stv-section" style={{animationDelay:".25s",position:"sticky",top:14}}>

        {/* ACTIVE → Start Button */}
        {tp.status===TS.ACTIVE&&<div style={{
          padding:"30px 22px",borderRadius:20,textAlign:"center",
          background:`linear-gradient(135deg,${theme.c}33,${T.purple}33,${T.card})`,
          border:`3px solid ${theme.c}66`,
          animation:"glowBox 3s infinite ease-in-out",
          "--tc":theme.c,
        }}>
          <div style={{fontSize:64,marginBottom:10,animation:"celebrate 2s infinite"}}>🚀</div>
          <div style={{fontSize:20,fontWeight:800,color:T.tp,marginBottom:4}}>Maceraya Hazır!</div>
          <div style={{fontSize:14,color:T.ts,marginBottom:12}}>Bu görevi başlatmaya hazır mısın?</div>
          <div style={{
            display:"inline-flex",alignItems:"center",gap:6,
            padding:"6px 14px",borderRadius:10,
            background:`${T.cyan}22`,border:`1px solid ${T.cyan}55`,
            marginBottom:18,fontSize:13,color:T.cyan,fontWeight:700,
          }}>⏱ Hedef süre: <b>{expectedMin} dakika</b></div>
          <div style={{display:"block"}}><button onClick={onStart} style={{
            padding:"16px 38px",borderRadius:14,border:"none",
            background:`linear-gradient(135deg,${theme.c},${theme.c}cc)`,
            color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",
            boxShadow:`0 6px 24px ${theme.c}88`,
            letterSpacing:1,textTransform:"uppercase",
            transition:"transform .15s",
          }} onMouseDown={e=>e.currentTarget.style.transform="scale(.96)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
            🎯 Göreve Başla
          </button></div>
        </div>}

        {/* IN PROGRESS → Help + Submit */}
        {tp.status===TS.IN_PROGRESS&&<>
          {/* ═══ LIVE TIMER ═══ */}
          <div style={{
            marginBottom:14,padding:"18px",borderRadius:18,
            background:`linear-gradient(135deg,${timeColor}22,${T.card})`,
            border:`3px solid ${timeColor}66`,
            position:"relative",overflow:"hidden",
          }}>
            <div style={{position:"absolute",top:-10,right:-10,fontSize:80,opacity:.08,pointerEvents:"none"}}>⏱</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:11,color:T.tm,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>⏱ Geçen Süre</div>
                <div style={{fontSize:32,fontWeight:900,color:timeColor,fontFamily:"monospace",lineHeight:1,letterSpacing:1,textShadow:`0 0 12px ${timeColor}66`}}>
                  {String(Math.floor(elapsedMin)).padStart(2,"0")}:{String(Math.floor(elapsedMs/1000)%60).padStart(2,"0")}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:T.tm,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>Hedef</div>
                <div style={{fontSize:18,fontWeight:800,color:T.cyan}}>⏱ {expectedMin} dk</div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{position:"relative",width:"100%",height:10,borderRadius:5,background:"#0008",overflow:"hidden",marginTop:12,border:`1px solid ${T.border}`}}>
              <div style={{
                height:"100%",borderRadius:5,
                background:`linear-gradient(90deg,${timeColor},${timeColor}cc)`,
                width:`${Math.min(100,timeRatio*100)}%`,
                transition:"width 1s linear",
                boxShadow:`0 0 8px ${timeColor}`,
              }}/>
              {/* Target marker at 100% */}
              <div style={{position:"absolute",top:-2,left:"calc(100% - 2px)",width:2,height:14,background:T.tp,opacity:.5}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:T.tm,fontWeight:600}}>
              <span style={{color:timeColor}}>
                {timeRatio<=0.5&&"⚡ Çok hızlı gidiyorsun!"}
                {timeRatio>0.5&&timeRatio<=0.8&&"👍 Hızlısın, devam!"}
                {timeRatio>0.8&&timeRatio<=1.0&&"✓ İyi gidiyorsun"}
                {timeRatio>1.0&&timeRatio<=1.3&&"⏳ Hedefi geçtin"}
                {timeRatio>1.3&&timeRatio<=1.6&&"⚠️ Yavaşladın"}
                {timeRatio>1.6&&"🐌 Çok uzun sürdü"}
              </span>
              <span>{Math.round(timeRatio*100)}%</span>
            </div>
          </div>

          <div style={{
            marginBottom:14,padding:"20px",borderRadius:18,
            background:hasHelp?`linear-gradient(135deg,${T.err}33,${T.warn}22,#3a1520)`:`linear-gradient(135deg,${theme.c}22,${T.card})`,
            border:`2px solid ${hasHelp?T.err:theme.c}55`,
            textAlign:"center",
          }}>
            {hasHelp?(<>
              <div style={{fontSize:48,marginBottom:8,animation:"celebrate 2s infinite"}}>🖐</div>
              <div style={{fontSize:18,color:T.err,fontWeight:800}}>Eğitmen çağrıldı!</div>
              <div style={{fontSize:13,color:T.ts,marginTop:4}}>Eğitmenin gelmesini bekle</div>
            </>):(<>
              <div style={{fontSize:42,marginBottom:6}}>👨‍🏫</div>
              <div style={{fontSize:14,color:T.ts,marginBottom:12,fontWeight:600}}>Yardıma ihtiyacın var mı?</div>
              <button onClick={onHelp} style={{
                padding:"12px 28px",borderRadius:12,
                border:`3px solid ${T.err}66`,background:T.err+"15",color:T.err,
                cursor:"pointer",fontWeight:800,fontSize:15,
                display:"inline-flex",alignItems:"center",gap:6,
              }}>🖐 Eğitmeni Çağır</button>
            </>)}
          </div>

          <div style={{padding:"20px",borderRadius:18,background:T.card,border:`2px solid ${theme.c}55`}}>
            <div style={{fontSize:11,color:theme.c,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>📸 Görevi Tamamla</div>
            <div style={{fontSize:13,color:T.tm,marginBottom:14}}>İstersen fotoğraf ekle, ya da direkt onaya gönder.</div>

            {photoPreview&&<div style={{marginBottom:12,borderRadius:12,overflow:"hidden",border:`2px solid ${T.ok}55`,position:"relative"}}>
              <img src={photoPreview} alt="Yüklenen" style={{width:"100%",maxHeight:220,objectFit:"contain",background:T.dark,display:"block"}}/>
              <button onClick={()=>{setPhoto(null);setPhotoPreview(null);}} style={{position:"absolute",top:8,right:8,padding:"4px 12px",borderRadius:8,border:"none",background:"#000c",color:T.err,cursor:"pointer",fontSize:13,fontWeight:700}}>✕ Kaldır</button>
            </div>}

            <label style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              padding:"14px 20px",borderRadius:12,
              border:`2px dashed ${theme.c}66`,
              background:`${theme.c}10`,color:theme.c,cursor:"pointer",
              fontWeight:700,fontSize:15,marginBottom:12,
            }}>
              📷 Fotoğraf Seç (İsteğe Bağlı)
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{display:"none"}}/>
            </label>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {photo&&<button onClick={()=>onSubmit(photo)} style={{
                padding:"14px 22px",borderRadius:12,border:"none",
                background:`linear-gradient(135deg,${T.ok},#22a55a)`,color:"#fff",
                fontSize:16,fontWeight:900,cursor:"pointer",
                boxShadow:`0 4px 16px ${T.ok}55`,
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              }}>✓ Fotoğrafla Onaya Gönder</button>}
              <button onClick={()=>onSubmit(null)} style={{
                padding:"14px 22px",borderRadius:12,border:"none",
                background:`linear-gradient(135deg,${T.pl},${T.purple})`,color:"#fff",
                fontSize:15,fontWeight:800,cursor:"pointer",
                boxShadow:`0 4px 16px ${T.pl}44`,
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              }}>✓ {photo?"Onaya Gönder":"Fotoğrafsız Onaya Gönder"}</button>
            </div>

            <div style={{fontSize:11,color:T.tm,marginTop:12,display:"flex",alignItems:"center",gap:5}}>
              <I.Clock/> Başlangıç: {ft(tp.startedAt)}
            </div>
          </div>
        </>}

        {/* PENDING */}
        {tp.status===TS.PENDING&&<div style={{
          padding:"28px 22px",borderRadius:20,textAlign:"center",
          background:`linear-gradient(135deg,${T.pl}33,${T.purple}33,${T.card})`,
          border:`3px solid ${T.pl}66`,
        }}>
          <div style={{fontSize:60,marginBottom:8,animation:"celebrate 3s infinite"}}>⏳</div>
          <div style={{fontSize:20,color:T.pl,fontWeight:800}}>Onay Bekleniyor</div>
          <div style={{fontSize:14,color:T.ts,marginTop:6}}>Eğitmenin görevi inceliyor...</div>
          {tp.photo&&savedPhoto&&<div style={{marginTop:14,borderRadius:12,overflow:"hidden",border:`2px solid ${T.pl}44`,display:"inline-block"}}>
            <img src={savedPhoto} alt="Gönderilen" style={{maxWidth:"100%",maxHeight:200,objectFit:"contain",background:T.dark,display:"block"}}/>
          </div>}
          {tp.photo&&!savedPhoto&&<div style={{marginTop:10,fontSize:13,color:T.ok,fontWeight:600}}>📸 Fotoğraf bu cihazda kayıtlı</div>}
        </div>}

        {/* APPROVED — celebration */}
        {tp.status===TS.APPROVED&&<div style={{
          position:"relative",overflow:"hidden",
          padding:"32px 24px",borderRadius:20,textAlign:"center",
          background:`linear-gradient(135deg,${T.ok}33,${T.warn}22,${T.card})`,
          border:`3px solid ${T.ok}88`,
          boxShadow:`0 8px 30px ${T.ok}44`,
        }}>
          {/* Confetti */}
          {[...Array(12)].map((_,i)=>(
            <span key={i} style={{
              position:"absolute",
              left:`${(i*9)%100}%`,top:0,
              fontSize:`${14+(i%3)*4}px`,
              animation:`confettiFall ${2.5+(i%4)*.5}s ${(i*0.2)%2}s infinite linear`,
            }}>{["🎉","✨","⭐","🎊","💫"][i%5]}</span>
          ))}

          <div style={{position:"relative",fontSize:72,marginBottom:6,animation:"celebrate 2s infinite"}}>🏆</div>
          <div style={{position:"relative",fontSize:28,color:T.ok,fontWeight:900,marginTop:4,textShadow:`0 0 20px ${T.ok}88`}}>+{t.xp} XP</div>
          <div style={{position:"relative",fontSize:18,color:T.tp,marginTop:4,fontWeight:700}}>Harika İş!</div>
          <div style={{position:"relative",fontSize:14,color:T.ts,marginTop:4}}>Bu görevi başarıyla tamamladın</div>
          {/* Performance score */}
          {finalScore!==null&&<div style={{position:"relative",marginTop:14,padding:"14px 20px",borderRadius:14,background:`linear-gradient(135deg,${gradeColor(finalScore)}33,${gradeColor(finalScore)}11)`,border:`2px solid ${gradeColor(finalScore)}88`,display:"inline-block"}}>
            <div style={{fontSize:11,letterSpacing:2,fontWeight:800,color:gradeColor(finalScore),marginBottom:4}}>PERFORMANS PUANI</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
              <div style={{fontSize:42,fontWeight:900,color:gradeColor(finalScore),lineHeight:1}}>{finalScore}<span style={{fontSize:18,opacity:.7}}>/100</span></div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:gradeColor(finalScore)}}>{gradeLabel(finalScore)}</div>
                <div style={{fontSize:11,color:T.ts,marginTop:2}}>⏱ {fd((tp.completedAt||tp.approvedAt)-tp.startedAt)} (Hedef: {expectedMin}dk)</div>
              </div>
            </div>
          </div>}
          {tp.instructorNote&&<div style={{position:"relative",fontSize:14,padding:"10px 18px",borderRadius:10,background:`${T.ok}22`,color:"#86efac",marginTop:14,border:`1px solid ${T.ok}55`,fontStyle:"italic"}}>
            💬 "{tp.instructorNote}"
          </div>}
        </div>}

        {/* REJECTED */}
        {tp.status===TS.REJECTED&&<div style={{
          padding:"28px 22px",borderRadius:20,textAlign:"center",
          background:`linear-gradient(135deg,${T.err}33,#3a1520)`,
          border:`3px solid ${T.err}66`,
        }}>
          <div style={{fontSize:56,marginBottom:8}}>🔄</div>
          <div style={{fontSize:20,color:T.err,fontWeight:800}}>Tekrar Dene!</div>
          <div style={{fontSize:13,color:T.ts,marginTop:4}}>Eğitmen geri bildirim bıraktı</div>
          {tp.instructorNote&&<div style={{fontSize:14,padding:"10px 18px",borderRadius:10,background:`${T.err}22`,color:"#fca5a5",marginTop:12,border:`1px solid ${T.err}44`,fontStyle:"italic"}}>
            💬 "{tp.instructorNote}"
          </div>}
          <button onClick={onResub} style={{
            marginTop:16,padding:"12px 28px",borderRadius:12,border:"none",
            background:`linear-gradient(135deg,${T.warn},${T.orange})`,
            color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",
            boxShadow:`0 4px 16px ${T.warn}66`,
          }}>🔄 Tekrar Dene</button>
        </div>}

      </div>
    </div>
  </div>);
}


// ═══════════════════════════════════════
//  INSTRUCTOR DASHBOARD
// ═══════════════════════════════════════
function InstructorDash({user,users,prog,onClearHelp,onSel}){
  const[filter,setFilter]=useState("all"); // all | help | pending | online | stuck | top
  const[sortBy,setSortBy]=useState("progress"); // progress | score | name | pending | activity
  const[search,setSearch]=useState("");

  const my=users.filter(u=>u.role===ROLES.STUDENT);

  // Build stats for each student
  const now=Date.now();
  const dayStart=new Date();dayStart.setHours(0,0,0,0);

  const enriched=my.map(s=>{
    const sp=prog[s.id]||{};
    const completed=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED);
    const cnt=completed.length;
    const pd=TASKS.filter(t=>sp[t.id]?.status===TS.PENDING).length;
    const xp=completed.reduce((a,t)=>a+t.xp,0);
    const pct=Math.round(cnt/36*100);
    const avgScore=calcAvgScore(sp);
    const lv=getLevel(xp);
    const helpRequest=sp.helpRequest||prog[s.id]?.helpRequest;
    const online=sp.online||prog[s.id]?.online;
    const lastSeen=sp.lastSeen||prog[s.id]?.lastSeen||0;

    // Find current task (active or in_progress)
    const currentTask=TASKS.find(t=>{
      const ts=sp[t.id]?.status;
      return ts===TS.IN_PROGRESS||ts===TS.ACTIVE;
    });

    // Today's completed tasks
    const todayCount=completed.filter(t=>{
      const ts=sp[t.id]?.approvedAt||sp[t.id]?.completedAt;
      return ts&&ts>=dayStart.getTime();
    }).length;

    // Last activity
    const lastActivity=Math.max(...TASKS.map(t=>{
      const tp=sp[t.id]||{};
      return Math.max(tp.startedAt||0,tp.completedAt||0,tp.approvedAt||0);
    }),lastSeen);

    // Stuck = ACTIVE status for >30min
    const stuck=currentTask&&sp[currentTask.id]?.startedAt&&(now-sp[currentTask.id].startedAt)>30*60*1000;

    return{...s,sp,cnt,pd,xp,pct,avgScore,lv,helpRequest,online,lastSeen,currentTask,todayCount,lastActivity,stuck};
  });

  // Class-level stats
  const totalCompleted=enriched.reduce((a,s)=>a+s.cnt,0);
  const totalPending=enriched.reduce((a,s)=>a+s.pd,0);
  const helpCount=enriched.filter(s=>s.helpRequest).length;
  const onlineCount=enriched.filter(s=>s.online).length;
  const todayTotal=enriched.reduce((a,s)=>a+s.todayCount,0);
  const classAvg=enriched.filter(s=>s.avgScore!==null).reduce((a,s)=>a+s.avgScore,0);
  const classAvgScore=enriched.filter(s=>s.avgScore!==null).length>0?Math.round(classAvg/enriched.filter(s=>s.avgScore!==null).length):null;

  // Apply filters
  let filtered=enriched;
  if(search)filtered=filtered.filter(s=>s.name.toLowerCase().includes(search.toLowerCase()));
  if(filter==="help")filtered=filtered.filter(s=>s.helpRequest);
  else if(filter==="pending")filtered=filtered.filter(s=>s.pd>0);
  else if(filter==="online")filtered=filtered.filter(s=>s.online);
  else if(filter==="stuck")filtered=filtered.filter(s=>s.stuck);
  else if(filter==="top")filtered=filtered.filter(s=>s.avgScore&&s.avgScore>=85);

  // Sort
  if(sortBy==="progress")filtered=filtered.slice().sort((a,b)=>b.pct-a.pct);
  else if(sortBy==="score")filtered=filtered.slice().sort((a,b)=>(b.avgScore||0)-(a.avgScore||0));
  else if(sortBy==="name")filtered=filtered.slice().sort((a,b)=>a.name.localeCompare(b.name,"tr"));
  else if(sortBy==="pending")filtered=filtered.slice().sort((a,b)=>b.pd-a.pd);
  else if(sortBy==="activity")filtered=filtered.slice().sort((a,b)=>b.lastActivity-a.lastActivity);

  return(<div>
    <style>{`
      @keyframes ind-pulse-help { 0%,100%{box-shadow:0 0 0 0 ${T.err}} 50%{box-shadow:0 0 0 8px ${T.err}00} }
      @keyframes ind-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      @keyframes ind-fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      .ind-card { animation: ind-fade-up .4s ease-out backwards; }
      .ind-student-row { transition: all .2s; }
      .ind-student-row:hover { transform: translateX(6px); border-color: ${T.orange}88 !important; }
    `}</style>

    {/* ═══ STATS BANNER — class overview ═══ */}
    <div className="ind-card" style={{marginBottom:14}}>
      <div style={{
        padding:18,borderRadius:18,
        background:`linear-gradient(135deg,${T.orange}22,${T.purple}33,#1a0a3a)`,
        border:`2px solid ${T.orange}55`,
        position:"relative",overflow:"hidden",
      }}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",
          background:`linear-gradient(90deg,transparent 30%,${T.orange}22 50%,transparent 70%)`,
          backgroundSize:"200% 100%",animation:"ind-shimmer 5s infinite linear",
        }}/>
        <div style={{position:"relative",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{
            width:64,height:64,borderRadius:18,
            background:`linear-gradient(135deg,${T.orange},${T.od})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:30,boxShadow:`0 6px 20px ${T.orange}66`,
          }}>👨‍🏫</div>
          <div style={{flex:1,minWidth:200}}>
            <h2 style={{margin:0,fontSize:24,color:T.tp,fontWeight:900}}>Hoş geldin, {user.name.split(" ")[0]}</h2>
            <div style={{fontSize:13,color:T.ts,marginTop:3}}>{my.length} öğrenci • {totalCompleted} toplam görev tamamlandı</div>
          </div>
        </div>

        {/* Quick stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginTop:14,position:"relative"}}>
          <StatPill icon="📅" label="Bugün" value={todayTotal} unit="görev" color={T.ok}/>
          <StatPill icon="⏳" label="Onay" value={totalPending} color={T.warn} pulse={totalPending>0}/>
          <StatPill icon="🖐" label="Yardım" value={helpCount} color={T.err} pulse={helpCount>0}/>
          <StatPill icon="🟢" label="Online" value={onlineCount} unit={`/ ${my.length}`} color={T.cyan}/>
          {classAvgScore!==null&&<StatPill icon="🎯" label="Sınıf Avg" value={classAvgScore} unit="/ 100" color={gradeColor(classAvgScore)}/>}
        </div>
      </div>
    </div>

    {/* ═══ HELP REQUESTS — priority alert ═══ */}
    {helpCount>0&&<div className="ind-card" style={{
      marginBottom:14,padding:14,borderRadius:14,
      background:`linear-gradient(135deg,${T.err}22,#3a1520)`,
      border:`2px solid ${T.err}66`,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={{
          width:36,height:36,borderRadius:"50%",
          background:T.err,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
          animation:"ind-pulse-help 1.5s infinite",
        }}>🖐</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:900,color:T.err}}>Yardım İstekleri</div>
          <div style={{fontSize:12,color:T.ts}}>{helpCount} öğrenci yardım bekliyor</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {enriched.filter(s=>s.helpRequest).map(s=>(
          <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"#0008",border:`1px solid ${T.err}33`}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:T.err+"33",color:T.err,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,border:`2px solid ${T.err}66`}}>{s.name[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:T.tp}}>{s.name}</div>
              <div style={{fontSize:11,color:T.tm}}>
                {fd(now-s.helpRequest)} önce
                {s.currentTask&&<span> • Görev #{s.currentTask.id}: {s.currentTask.title}</span>}
              </div>
            </div>
            <button onClick={(e)=>{e.stopPropagation();onSel(s);}} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${T.cyan}55`,background:`${T.cyan}22`,color:T.cyan,cursor:"pointer",fontWeight:700,fontSize:12,whiteSpace:"nowrap"}}>👁 İncele</button>
            <button onClick={(e)=>{e.stopPropagation();onClearHelp(s.id);}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:T.ok+"33",color:T.ok,cursor:"pointer",fontWeight:700,fontSize:12,whiteSpace:"nowrap"}}>✓ Hallettim</button>
          </div>
        ))}
      </div>
    </div>}

    {/* ═══ FILTERS BAR ═══ */}
    <div className="ind-card" style={{marginBottom:14,padding:12,borderRadius:14,background:T.card,border:`1px solid ${T.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:10}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Öğrenci ara..." style={{flex:"1 1 200px",padding:"8px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,fontSize:14,outline:"none"}}/>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,fontSize:13,cursor:"pointer",fontWeight:600}}>
          <option value="progress">↓ İlerleme</option>
          <option value="score">↓ Puan</option>
          <option value="pending">↓ Onay Bekleyen</option>
          <option value="activity">↓ Son Aktivite</option>
          <option value="name">A-Z İsim</option>
        </select>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <FilterPill active={filter==="all"} onClick={()=>setFilter("all")} label="Tümü" count={enriched.length} color={T.orange}/>
        <FilterPill active={filter==="help"} onClick={()=>setFilter("help")} label="🖐 Yardım" count={helpCount} color={T.err} highlight={helpCount>0}/>
        <FilterPill active={filter==="pending"} onClick={()=>setFilter("pending")} label="⏳ Onayda" count={enriched.filter(s=>s.pd>0).length} color={T.warn}/>
        <FilterPill active={filter==="online"} onClick={()=>setFilter("online")} label="🟢 Online" count={onlineCount} color={T.ok}/>
        <FilterPill active={filter==="stuck"} onClick={()=>setFilter("stuck")} label="⚠️ Takıldı" count={enriched.filter(s=>s.stuck).length} color={T.warn}/>
        <FilterPill active={filter==="top"} onClick={()=>setFilter("top")} label="⭐ Üstün" count={enriched.filter(s=>s.avgScore&&s.avgScore>=85).length} color={T.cyan}/>
      </div>
    </div>

    {/* ═══ STUDENT CARDS ═══ */}
    {filtered.length===0?(
      <div style={{padding:50,textAlign:"center",borderRadius:16,background:T.card,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:48,opacity:.4,marginBottom:8}}>🔍</div>
        <div style={{fontSize:15,color:T.ts,fontWeight:600}}>Bu filtreye uygun öğrenci yok</div>
      </div>
    ):(
      <div style={{display:"grid",gap:8}}>
        {filtered.map((s,idx)=>{
          const sg=s.avgScore?gradeColor(s.avgScore):null;
          return(
            <div key={s.id} className="ind-student-row ind-card" onClick={()=>onSel(s)}
              style={{
                padding:14,borderRadius:14,cursor:"pointer",
                background:s.helpRequest?`linear-gradient(135deg,${T.err}11,${T.card})`:s.online?`linear-gradient(135deg,${T.ok}08,${T.card})`:T.card,
                border:`2px solid ${s.helpRequest?T.err+"55":s.stuck?T.warn+"55":s.online?T.ok+"33":T.border}`,
                animationDelay:`${idx*30}ms`,
              }}>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                {/* Avatar with progress ring */}
                <div style={{position:"relative",flexShrink:0}}>
                  <div style={{
                    width:54,height:54,borderRadius:"50%",
                    background:`conic-gradient(${T.orange} ${s.pct*3.6}deg,${T.border} 0deg)`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    <div style={{
                      width:44,height:44,borderRadius:"50%",
                      background:`linear-gradient(135deg,${T.orange},${T.od})`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:18,fontWeight:900,color:"#fff",
                    }}>{s.name[0]}</div>
                  </div>
                  {/* Online dot */}
                  {s.online&&<div style={{position:"absolute",bottom:0,right:0,width:14,height:14,borderRadius:"50%",background:T.ok,border:`2px solid ${T.bg}`,boxShadow:`0 0 6px ${T.ok}`}}/>}
                </div>

                {/* Name + level */}
                <div style={{flex:1,minWidth:140}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
                    <span style={{fontSize:15,fontWeight:800,color:T.tp}}>{s.name}</span>
                    <span style={{fontSize:10,padding:"1px 7px",borderRadius:5,background:s.lv.color+"33",color:s.lv.color,fontWeight:700,letterSpacing:.5}}>{s.lv.icon} Lv.{s.lv.lv}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:T.tm,flexWrap:"wrap"}}>
                    <span style={{color:T.warn,fontWeight:700}}>⚡ {s.xp} XP</span>
                    <span>•</span>
                    <span>{s.cnt}/36 görev</span>
                    {s.todayCount>0&&<><span>•</span><span style={{color:T.ok,fontWeight:700}}>📅 Bugün +{s.todayCount}</span></>}
                  </div>
                </div>

                {/* Current task chip */}
                {s.currentTask&&<div className="resp-hide-phone" style={{
                  padding:"6px 10px",borderRadius:10,
                  background:s.stuck?`${T.warn}22`:`${T.cyan}22`,
                  border:`1px solid ${s.stuck?T.warn:T.cyan}55`,
                  fontSize:11,maxWidth:160,
                }}>
                  <div style={{fontSize:9,color:T.tm,fontWeight:700,letterSpacing:1}}>{s.stuck?"⚠️ TAKILDI":"▶ ŞU AN"}</div>
                  <div style={{fontWeight:700,color:s.stuck?T.warn:T.cyan,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>#{s.currentTask.id} {s.currentTask.title}</div>
                </div>}

                {/* Score badge */}
                {s.avgScore!==null&&<div style={{
                  padding:"6px 10px",borderRadius:10,
                  background:`${sg}22`,border:`1px solid ${sg}66`,
                  textAlign:"center",minWidth:54,
                }}>
                  <div style={{fontSize:9,color:T.tm,fontWeight:700,letterSpacing:1}}>PUAN</div>
                  <div style={{fontSize:16,fontWeight:900,color:sg,lineHeight:1}}>🎯 {s.avgScore}</div>
                </div>}

                {/* Pending badge */}
                {s.pd>0&&<div style={{
                  padding:"6px 10px",borderRadius:10,
                  background:`${T.warn}22`,border:`1px solid ${T.warn}66`,
                  textAlign:"center",minWidth:54,
                  animation:"pulse 2s infinite",
                }}>
                  <div style={{fontSize:9,color:T.tm,fontWeight:700,letterSpacing:1}}>ONAY</div>
                  <div style={{fontSize:16,fontWeight:900,color:T.warn,lineHeight:1}}>⏳ {s.pd}</div>
                </div>}

                {/* Help indicator */}
                {s.helpRequest&&<div style={{
                  width:42,height:42,borderRadius:"50%",
                  background:T.err,color:"#fff",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,
                  animation:"ind-pulse-help 1.5s infinite",
                  flexShrink:0,
                }}>🖐</div>}

                {/* Big progress % */}
                <div style={{
                  textAlign:"center",minWidth:50,
                  borderLeft:`1px solid ${T.border}`,
                  paddingLeft:12,
                }}>
                  <div style={{fontSize:9,color:T.tm,fontWeight:700,letterSpacing:1}}>İLERLEME</div>
                  <div style={{fontSize:22,fontWeight:900,color:T.orange,lineHeight:1}}>{s.pct}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>);
}

// ─── Helper: stat pill ───
function StatPill({icon,label,value,unit,color,pulse}){
  return(<div style={{
    padding:"10px 12px",borderRadius:12,
    background:`${color}22`,border:`1px solid ${color}55`,
    textAlign:"center",
    animation:pulse?"pulse 2s infinite":"none",
  }}>
    <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
    <div style={{fontSize:9,color:T.tm,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
    <div style={{fontSize:18,fontWeight:900,color:color,lineHeight:1.2}}>{value}{unit&&<span style={{fontSize:11,opacity:.7,marginLeft:2}}>{unit}</span>}</div>
  </div>);
}

// ─── Helper: filter pill ───
function FilterPill({active,onClick,label,count,color,highlight}){
  return(<button onClick={onClick} style={{
    padding:"6px 12px",borderRadius:10,
    border:`2px solid ${active?color:T.border}`,
    background:active?`${color}22`:T.dark,
    color:active?color:highlight?color:T.ts,
    cursor:"pointer",fontWeight:700,fontSize:12,
    display:"inline-flex",alignItems:"center",gap:6,
    transition:"all .15s",
    animation:highlight&&!active?"pulse 2s infinite":"none",
  }}>
    {label}
    <span style={{
      padding:"1px 7px",borderRadius:8,
      background:active?color+"44":T.border,
      color:active?color:T.tm,
      fontSize:10,fontWeight:800,
    }}>{count}</span>
  </button>);
}

// ═══════════════════════════════════════
//  STUDENT DETAIL
// ═══════════════════════════════════════
function StudentDetail({s,prog,users,canReview,answerUnlocks=[],onToggleUnlock,onApprove,onReject,onBack}){
  const[note,setNote]=useState("");
  const sp=prog[s.id]||{};const cnt=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED).length;
  const xp=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED).reduce((a,t)=>a+t.xp,0);
  const unlockedSet=new Set(answerUnlocks.filter(au=>au.student_id===s.id).map(au=>au.task_id));
  return(<div>
    <button onClick={onBack} style={{fontSize:14,padding:"6px 14px",borderRadius:8,background:T.border,color:T.ts,border:"none",cursor:"pointer",marginBottom:12}}>← Geri</button>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
      <div style={{width:52,height:52,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,background:T.orange+"15",color:T.orange}}>{s.name[0]}</div>
      <div><h2 style={{margin:0,fontSize:20}}>{s.name}</h2><div style={{fontSize:14,color:T.tm}}>{getLevel(xp).icon} Lv.{getLevel(xp).lv} • {xp} XP</div></div>
      <div style={{marginLeft:"auto",fontSize:28,fontWeight:800,color:T.orange}}>{cnt}/36</div>
    </div>

    {canReview&&onToggleUnlock&&<div style={{marginBottom:12,padding:"10px 14px",borderRadius:10,background:`${T.purple}22`,border:`1px solid ${T.purple}55`,fontSize:13,color:T.ts,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span style={{fontSize:18}}>🗝️</span>
      <span style={{flex:1,minWidth:200}}>Cevap anahtarı kilitlerini buradan yönet. Öğrenci, kilidi açtığın görevin cevabını netleştirilmiş halde görür.</span>
      <span style={{fontSize:12,fontWeight:700,color:T.pl,padding:"3px 10px",borderRadius:8,background:T.purple+"33"}}>{unlockedSet.size} açık</span>
    </div>}

    <Card>{TASKS.map(t=>{const tp=sp[t.id]||{};const lk=tp.status===TS.LOCKED;const pn=tp.status===TS.PENDING;
      const started=tp.startedAt;const completed=tp.completedAt||tp.approvedAt;
      const dur=(started&&completed)?fd(completed-started):null;
      const unlocked=unlockedSet.has(t.id);
      return(<div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,marginBottom:4,opacity:lk?.4:1,background:pn?T.purple+"15":"transparent"}}>
        <span style={{width:26,fontSize:13,fontFamily:"monospace",color:T.tm,textAlign:"center"}}>#{t.id}</span>
        <TaskImage taskId={t.id} type="gorsel" size={30} fallbackEmoji={t.img} style={{borderRadius:5}}/>
        <div style={{flex:1,minWidth:0}}>
          <span style={{fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{t.title}</span>
          {dur&&<span style={{fontSize:11,color:T.ok}}><I.Clock/> {dur}</span>}
        </div>
        <span style={{fontSize:12,color:T.warn,fontWeight:600}}>+{t.xp}</span>
        <Badge s={tp.status}/>
        {tp.photo&&<span style={{fontSize:12,color:T.ok}}>📸</span>}
        {canReview&&onToggleUnlock&&!lk&&<button
          onClick={()=>onToggleUnlock({studentId:s.id,taskId:t.id,unlock:!unlocked})}
          title={unlocked?"Cevap anahtarını kilitle":"Cevap anahtarını aç"}
          style={{
            padding:"4px 10px",borderRadius:6,border:"none",
            background:unlocked?`${T.ok}33`:`${T.tm}22`,
            color:unlocked?T.ok:T.tm,
            cursor:"pointer",fontSize:13,fontWeight:700,
          }}>{unlocked?"🔓":"🔒"}</button>}
        {canReview&&pn&&<>
          <button onClick={()=>onApprove(s.id,t.id,note||"OK")} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#1a4a2e",color:T.ok,cursor:"pointer",fontSize:12,fontWeight:600}}>✓</button>
          <button onClick={()=>onReject(s.id,t.id,note||"Tekrar dene")} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#5c1a1a",color:T.err,cursor:"pointer",fontSize:12,fontWeight:600}}>✕</button>
        </>}
      </div>);
    })}
    {canReview&&<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Not yaz..." style={{width:"100%",marginTop:8,padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none",boxSizing:"border-box"}}/>}
    </Card>
  </div>);
}

// ═══════════════════════════════════════
//  PENDING REVIEWS (with answer images)
// ═══════════════════════════════════════
function PendingReviews({user,users,prog,onApprove,onReject}){
  const[notes,setNotes]=useState({});const[zoomPhoto,setZoomPhoto]=useState(null);
  const my=users.filter(u=>u.role===ROLES.STUDENT);
  const items=[];my.forEach(s=>TASKS.forEach(t=>{if(prog[s.id]?.[t.id]?.status===TS.PENDING)items.push({s,t,d:prog[s.id][t.id]});}));
  return(<div>
    <h1 style={{fontSize:22,fontWeight:800,color:T.orange,margin:"0 0 16px"}}>Onay Bekleyenler ({items.length})</h1>

    {/* Photo zoom modal */}
    {zoomPhoto&&<div onClick={()=>setZoomPhoto(null)} style={{position:"fixed",inset:0,zIndex:100,background:"#000e",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",padding:20}}>
      <img src={zoomPhoto} style={{maxWidth:"90vw",maxHeight:"85vh",objectFit:"contain",borderRadius:12,border:`2px solid ${T.orange}44`}}/>
    </div>}

    {items.length===0?<Card><div style={{textAlign:"center",padding:40,color:T.tm,fontSize:18}}>✓ Tüm görevler incelendi!</div></Card>:
    items.map(({s,t,d})=>{const k=`${s.id}_${t.id}`;
      const dur=(d.startedAt&&d.completedAt)?fd(d.completedAt-d.startedAt):null;
      return(
      <Card key={k} style={{marginBottom:14,borderColor:T.purple+"44"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
          <TaskImage taskId={t.id} type="gorsel" size={60} fallbackEmoji={t.img}/>
          <div style={{flex:1}}>
            <div style={{marginBottom:4,fontSize:16}}><b>{s.name}</b> • Görev {t.id}: {t.title}</div>
            <div style={{fontSize:13,color:T.tm,marginBottom:4}}>Bekleme: {fd(Date.now()-(d.completedAt||Date.now()))}</div>
            {dur&&<div style={{fontSize:13,color:T.ok,marginBottom:6}}>⏱ Tamamlama süresi: {dur}</div>}

            {/* Student's photo is stored locally on their device */}
            {d.photo&&<div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:T.ok+"10",border:`1px solid ${T.ok}33`}}>
              <div style={{fontSize:14,fontWeight:600,color:T.ok}}>📸 Öğrenci fotoğraf yükledi</div>
              <div style={{fontSize:12,color:T.ts,marginTop:2}}>Fotoğraf öğrencinin cihazında. Kontrol etmek için öğrenciye gidin.</div>
            </div>}

            {/* Answer key */}
            <details style={{marginBottom:8}}><summary style={{fontSize:13,color:T.pl,cursor:"pointer"}}><I.Key/> Cevap Anahtarı</summary><pre style={{fontSize:12,marginTop:4,padding:10,borderRadius:8,background:T.purple+"15",color:T.pl,fontFamily:"monospace",whiteSpace:"pre-wrap"}}>{t.answer}</pre>
              <AnswerImage taskId={t.id}/>
            </details>

            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input value={notes[k]||""} onChange={e=>setNotes(p=>({...p,[k]:e.target.value}))} placeholder="Not yaz..." style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}/>
              <button onClick={()=>{onApprove(s.id,t.id,notes[k]||"Onaylandı ✓");setNotes(p=>({...p,[k]:""}));}} style={{padding:"8px 18px",borderRadius:8,border:"none",background:"#1a4a2e",color:T.ok,cursor:"pointer",fontSize:14,fontWeight:700}}>✓ Onayla</button>
              <button onClick={()=>{onReject(s.id,t.id,notes[k]||"Tekrar dene");setNotes(p=>({...p,[k]:""}));}} style={{padding:"8px 18px",borderRadius:8,border:"none",background:"#5c1a1a",color:T.err,cursor:"pointer",fontSize:14,fontWeight:700}}>✕ Reddet</button>
            </div>
          </div>
        </div>
      </Card>);
    })}
  </div>);
}

// ═══════════════════════════════════════
//  TASK BROWSER (with answer images for instructors)
// ═══════════════════════════════════════
function TaskBrowser({showAns}){
  const cats=[...new Set(TASKS.map(t=>t.cat))];
  return(<div>
    <h1 style={{fontSize:22,fontWeight:800,color:T.orange,margin:"0 0 6px"}}>Görevler (36)</h1>
    {showAns&&<div style={{fontSize:14,color:T.pl,marginBottom:16}}><I.Key/> Cevap anahtarları + görseller görünür</div>}
    {cats.map(cat=>(<div key={cat} style={{marginBottom:16}}>
      <span style={{fontSize:15,fontWeight:700,color:T.ts,padding:"4px 10px",background:T.purple+"20",borderRadius:6,display:"inline-block",marginBottom:8}}>{cat}</span>
      <Card>{TASKS.filter(t=>t.cat===cat).map(t=>(<div key={t.id} style={{padding:10,borderRadius:8,marginBottom:6,background:T.dark}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <TaskImage taskId={t.id} type="gorsel" size={44} fallbackEmoji={t.img} style={{borderRadius:8}}/>
          <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>#{t.id} {t.title}</div><div style={{fontSize:13,color:T.tm}}>{t.desc}</div></div>
          <span style={{fontSize:13,color:T.warn,fontWeight:600}}>+{t.xp}</span><Stars n={t.diff}/>
        </div>
        {showAns&&<details style={{marginTop:6,marginLeft:54}}>
          <summary style={{fontSize:14,color:T.pl,cursor:"pointer"}}><I.Key/> Cevap</summary>
          <pre style={{fontSize:13,marginTop:4,padding:10,borderRadius:8,background:T.purple+"15",color:T.pl,fontFamily:"monospace",whiteSpace:"pre-wrap"}}>{t.answer}</pre>
          <AnswerImage taskId={t.id}/>
        </details>}
      </div>))}</Card>
    </div>))}
  </div>);
}

// ═══════════════════════════════════════
//  AUDIT LOG
// ═══════════════════════════════════════
function AuditLog({logs,users}){
  const[filter,setFilter]=useState("");
  const tc={login:T.tm,task_started:T.cyan,task_completed:T.pl,task_approved:T.ok,task_rejected:T.err,help_request:T.err};
  const fl=filter?logs.filter(l=>`${users.find(x=>x.id===l.userId)?.name||""} ${l.detail||""}`.toLowerCase().includes(filter.toLowerCase())):logs;
  return(<div>
    <h1 style={{fontSize:22,fontWeight:800,color:T.orange,margin:"0 0 16px"}}>Audit Log ({logs.length})</h1>
    <div style={{display:"flex",gap:8,marginBottom:12,padding:"10px 14px",borderRadius:10,background:T.card,border:`1px solid ${T.border}`}}>
      <span style={{fontSize:16}}>🔍</span><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="İsim veya işlem ara..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:T.tp,fontSize:15}}/>
    </div>
    <Card>{fl.length===0?<div style={{padding:20,textAlign:"center",color:T.tm,fontSize:15}}>Log bulunamadı</div>:fl.slice(0,100).map(l=>{const u=users.find(x=>x.id===l.userId);
      return<div key={l.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,padding:"8px 10px",borderBottom:`1px solid ${T.border}22`}}>
        <span style={{width:110,fontFamily:"monospace",color:T.tm,fontSize:12}}>{ft(l.ts)}</span>
        <span style={{width:8,height:8,borderRadius:"50%",background:tc[l.type]||T.tm,flexShrink:0}}/>
        <span style={{fontWeight:600,color:tc[l.type]||T.ts,minWidth:100}}>{u?.name||l.userId}</span>
        <span style={{color:T.ts}}>{l.detail}</span>
      </div>;
    })}</Card>
  </div>);
}

// ═══════════════════════════════════════
//  ADMIN: USER MANAGER
// ═══════════════════════════════════════
function UserManager({users,prog,onAddUser,onSetProgress}){
  const[showForm,setShowForm]=useState(false);
  const[name,setName]=useState("");const[email,setEmail]=useState("");const[pw,setPw]=useState("");
  const[role,setRole]=useState("student");const[grup,setGrup]=useState("Büyük");
  const[childId,setChildId]=useState("");
  const[busy,setBusy]=useState(false);const[msg,setMsg]=useState(null);
  // Progress setter
  const[selStudent,setSelStudent]=useState(null);
  const[selTask,setSelTask]=useState(1);
  const[progMsg,setProgMsg]=useState(null);
  const[progBusy,setProgBusy]=useState(false);

  const handleAdd=async()=>{
    if(!name.trim()||!email.trim()||!pw.trim()){setMsg("Tüm alanları doldur!");return;}
    if(role==="parent"&&!childId){setMsg("Veli için çocuk seçmelisiniz!");return;}
    setBusy(true);setMsg(null);
    const u=await onAddUser({name:name.trim(),email:email.trim(),password:pw.trim(),role,grup,childId:role==="parent"?childId:null});
    setBusy(false);
    if(u){setMsg("✓ Kullanıcı oluşturuldu!");setName("");setEmail("");setPw("");setChildId("");}
    else setMsg("Hata! Email zaten kayıtlı olabilir.");
  };

  const handleSetProgress=async()=>{
    if(!selStudent||!selTask)return;
    setProgBusy(true);setProgMsg(null);
    await onSetProgress(selStudent.id,selTask);
    setProgBusy(false);
    setProgMsg(`✓ ${selStudent.name}: Görev ${selTask}'den devam edecek (${selTask-1} görev onaylandı)`);
  };

  const students=users.filter(u=>u.role==="student");
  const instructors=users.filter(u=>u.role==="instructor");
  const admins=users.filter(u=>u.role==="admin");
  const parents=users.filter(u=>u.role==="parent");

  // Get current task for a student
  const getCurrentTask=(sid)=>{
    const sp=prog[sid]||{};
    for(let i=1;i<=36;i++){
      const st=sp[i]?.status;
      if(!st||st===TS.LOCKED)return i;
      if(st===TS.ACTIVE||st===TS.IN_PROGRESS||st===TS.PENDING||st===TS.REJECTED)return i;
    }
    return 36;
  };
  const getApprovedCount=(sid)=>TASKS.filter(t=>prog[sid]?.[t.id]?.status===TS.APPROVED).length;

  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <h1 style={{fontSize:22,fontWeight:800,color:T.orange,margin:0}}>👥 Kullanıcı Yönetimi</h1>
      <button onClick={()=>setShowForm(!showForm)} style={{fontSize:14,padding:"8px 20px",borderRadius:10,border:`1px solid ${T.ok}44`,background:T.ok+"15",color:T.ok,cursor:"pointer",fontWeight:700}}>{showForm?"✕ Kapat":"+ Kullanıcı Ekle"}</button>
    </div>

    {showForm&&<Card style={{marginBottom:16,borderColor:T.ok+"44"}}>
      <div style={{fontSize:16,fontWeight:700,color:T.ok,marginBottom:12}}>Yeni Kullanıcı</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ad Soyad" style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}/>
        <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="Şifre" style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}/>
        <select value={role} onChange={e=>setRole(e.target.value)} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}>
          <option value="student">Öğrenci</option><option value="instructor">Eğitmen</option><option value="parent">Veli</option>
        </select>
        {role==="student"&&<select value={grup} onChange={e=>setGrup(e.target.value)} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}>
          <option value="Büyük">Büyük</option><option value="Kids">Kids</option>
        </select>}
        {role==="parent"&&<select value={childId} onChange={e=>setChildId(e.target.value)} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none",gridColumn:"span 2"}}>
          <option value="">Çocuk seç...</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
        </select>}
      </div>
      <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
        <button onClick={handleAdd} disabled={busy} style={{padding:"10px 24px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${T.ok},#22a55a)`,color:"#fff",fontSize:14,fontWeight:700,cursor:busy?"wait":"pointer"}}>{busy?"Oluşturuluyor...":"✓ Oluştur"}</button>
        {msg&&<span style={{fontSize:13,color:msg.startsWith("✓")?T.ok:T.err}}>{msg}</span>}
      </div>
    </Card>}

    {/* ═══ GÖREV AYARLAMA ═══ */}
    <Card style={{marginBottom:16,borderColor:T.warn+"44",border:`2px solid ${T.warn}33`}}>
      <div style={{fontSize:18,fontWeight:700,color:T.warn,marginBottom:12}}>🔧 Öğrenci Görev Ayarla</div>
      <div style={{fontSize:14,color:T.ts,marginBottom:12}}>Öğrenci seç → hangi görevden devam edecekse onu belirle. Önceki görevler otomatik "Onaylandı" olur.</div>

      {/* Student selector */}
      <div style={{fontSize:14,fontWeight:600,color:T.ts,marginBottom:6}}>1. Öğrenci Seç:</div>
      {!selStudent ? (
        <div style={{maxHeight:250,overflowY:"auto",borderRadius:10,border:`1px solid ${T.border}`,marginBottom:12}}>
          {students.map(s=>{
            const cnt=getApprovedCount(s.id);const cur=getCurrentTask(s.id);
            return(
              <button key={s.id} onClick={()=>{setSelStudent(s);setSelTask(cur);setProgMsg(null);}} style={{width:"100%",padding:"10px 14px",border:"none",borderBottom:`1px solid ${T.border}22`,background:"transparent",color:T.tp,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10,fontSize:14}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:T.orange+"20",color:T.orange,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>{s.name[0]}</div>
                <div style={{flex:1}}><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:12,color:T.tm}}>{s.email}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700,color:T.orange}}>{cnt}/36</div><div style={{fontSize:11,color:T.tm}}>Görev {cur}</div></div>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"10px 14px",borderRadius:10,background:T.dark,border:`1px solid ${T.orange}44`}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:T.orange+"20",color:T.orange,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:18}}>{selStudent.name[0]}</div>
          <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700}}>{selStudent.name}</div><div style={{fontSize:13,color:T.tm}}>Şu an: {getApprovedCount(selStudent.id)}/36 onaylı — Görev {getCurrentTask(selStudent.id)}'de</div></div>
          <button onClick={()=>{setSelStudent(null);setProgMsg(null);}} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.ts,cursor:"pointer",fontSize:13}}>Değiştir</button>
        </div>
      )}

      {/* Task selector */}
      {selStudent&&<>
        <div style={{fontSize:14,fontWeight:600,color:T.ts,marginBottom:6}}>2. Hangi Görevden Devam Etsin?</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
          <select value={selTask} onChange={e=>setSelTask(Number(e.target.value))} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:16,outline:"none",minWidth:200}}>
            {TASKS.map(t=><option key={t.id} value={t.id}>Görev {t.id}: {t.title}</option>)}
          </select>
          <span style={{fontSize:14,color:T.tm}}>→ Görev 1-{selTask-1} onaylanır, {selTask} aktif olur</span>
        </div>

        {/* Quick buttons */}
        <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
          {[1,5,10,15,20,25,30,33,36].map(n=>(
            <button key={n} onClick={()=>setSelTask(n)} style={{padding:"6px 12px",borderRadius:6,border:selTask===n?`2px solid ${T.orange}`:`1px solid ${T.border}`,background:selTask===n?T.orange+"20":"transparent",color:selTask===n?T.orange:T.ts,cursor:"pointer",fontSize:13,fontWeight:selTask===n?700:400}}>G.{n}</button>
          ))}
        </div>

        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={handleSetProgress} disabled={progBusy} style={{padding:"12px 28px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${T.warn},${T.od})`,color:"#fff",fontSize:16,fontWeight:800,cursor:progBusy?"wait":"pointer"}}>
            {progBusy?"Ayarlanıyor...":"🔧 Uygula"}
          </button>
          {progMsg&&<span style={{fontSize:14,color:T.ok,fontWeight:600}}>{progMsg}</span>}
        </div>
      </>}
    </Card>

    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
      <Card style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:T.orange}}>{students.length}</div><div style={{fontSize:14,color:T.ts}}>Öğrenci</div></Card>
      <Card style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:T.pl}}>{instructors.length}</div><div style={{fontSize:14,color:T.ts}}>Eğitmen</div></Card>
      <Card style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:T.cyan}}>{parents.length}</div><div style={{fontSize:14,color:T.ts}}>Veli</div></Card>
      <Card style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:T.ok}}>{admins.length}</div><div style={{fontSize:14,color:T.ts}}>Admin</div></Card>
    </div>

    {/* Instructor list */}
    <div style={{fontSize:16,fontWeight:700,color:T.pl,marginBottom:8}}>Eğitmenler</div>
    <Card style={{marginBottom:16}}>
      {instructors.map(u=><div key={u.id} style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:15,fontWeight:600}}>{u.name}</div><div style={{fontSize:13,color:T.tm}}>{u.email}</div></div>
      </div>)}
      {instructors.length===0&&<div style={{padding:14,color:T.tm,fontSize:14}}>Eğitmen yok</div>}
    </Card>

    {/* Student list */}
    <div style={{fontSize:16,fontWeight:700,color:T.orange,marginBottom:8}}>Öğrenciler ({students.length})</div>
    <Card>
      <div style={{maxHeight:500,overflowY:"auto"}}>
        {students.map((u,i)=>{
          const cnt=getApprovedCount(u.id);const pct=Math.round(cnt/36*100);
          return(<div key={u.id} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}22`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:13,color:T.tm,width:28,textAlign:"right"}}>{i+1}.</span>
              <div><div style={{fontSize:14,fontWeight:600}}>{u.name}</div><div style={{fontSize:12,color:T.tm}}>{u.email}</div></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:13,color:T.orange,fontWeight:600}}>{cnt}/36</span>
              <div style={{width:50,height:5,borderRadius:3,background:T.border,overflow:"hidden"}}><div style={{height:"100%",background:T.orange,width:`${pct}%`}}/></div>
              <span style={{fontSize:12,padding:"2px 8px",borderRadius:4,background:u.grup==="Kids"?T.cyan+"20":T.orange+"20",color:u.grup==="Kids"?T.cyan:T.orange}}>{u.grup||"Büyük"}</span>
            </div>
          </div>);
        })}
      </div>
    </Card>
  </div>);
}


// ═══════════════════════════════════════
//  PARENT: DASHBOARD — kendi çocuğunun durumunu görür
// ═══════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// DAILY SHOW — Eğitmen günlük takip ekranı (yeniden tasarlandı)
// ═══════════════════════════════════════════════════════════════
function DailyShow({users,prog,logs,onSel}){
  const[selStudent,setSelStudent]=useState(null);
  const[expandedTask,setExpandedTask]=useState(null);
  const[dayFilter,setDayFilter]=useState("today"); // today | week | all

  const students=users.filter(u=>u.role===ROLES.STUDENT);
  const now=Date.now();
  const dayStart=new Date();dayStart.setHours(0,0,0,0);
  const weekAgo=now-7*24*60*60*1000;
  const filterStart=dayFilter==="today"?dayStart.getTime():dayFilter==="week"?weekAgo:0;

  // Each student → list of completed tasks in date range
  const studentRows=students.map(s=>{
    const sp=prog[s.id]||{};
    const completed=TASKS.filter(t=>{
      const tp=sp[t.id];
      if(!tp||tp.status!==TS.APPROVED)return false;
      const ts=tp.approvedAt||tp.completedAt;
      return ts&&ts>=filterStart;
    }).map(t=>{
      const tp=sp[t.id];
      const dur=(tp.startedAt&&tp.completedAt)?(tp.completedAt-tp.startedAt):null;
      const score=dur?calcTaskScore(dur,t.expectedMin):null;
      return{...t,dur,score,tp};
    }).sort((a,b)=>(b.tp.approvedAt||0)-(a.tp.approvedAt||0));

    const totalXP=completed.reduce((a,t)=>a+t.xp,0);
    const avgScore=completed.length>0?Math.round(completed.filter(t=>t.score).reduce((a,t)=>a+t.score,0)/completed.filter(t=>t.score).length):null;
    const fastCount=completed.filter(t=>t.score&&t.score>=90).length;

    return{student:s,completed,totalXP,avgScore,fastCount};
  }).filter(r=>r.completed.length>0).sort((a,b)=>b.completed.length-a.completed.length);

  const allCount=studentRows.reduce((a,r)=>a+r.completed.length,0);

  if(selStudent){
    const row=studentRows.find(r=>r.student.id===selStudent);
    if(!row)return null;
    return(<div>
      <button onClick={()=>{setSelStudent(null);setExpandedTask(null);}} style={{fontSize:14,padding:"8px 18px",borderRadius:10,background:`${T.cyan}22`,color:T.cyan,border:`2px solid ${T.cyan}44`,cursor:"pointer",marginBottom:14,fontWeight:700}}>← Tüm Öğrenciler</button>

      {/* Student hero */}
      <div style={{padding:18,borderRadius:18,background:`linear-gradient(135deg,${T.orange}22,${T.purple}22,${T.card})`,border:`2px solid ${T.orange}55`,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:`linear-gradient(135deg,${T.orange},${T.od})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff"}}>{row.student.name[0]}</div>
          <div style={{flex:1,minWidth:160}}>
            <h2 style={{margin:0,fontSize:22,color:T.tp}}>{row.student.name}</h2>
            <div style={{fontSize:12,color:T.ts,marginTop:2}}>{dayFilter==="today"?"Bugün":dayFilter==="week"?"Son 7 gün":"Tüm zaman"} özeti</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <div style={{padding:"8px 12px",borderRadius:10,background:`${T.ok}22`,border:`1px solid ${T.ok}55`,textAlign:"center"}}>
              <div style={{fontSize:10,color:T.tm,fontWeight:700}}>GÖREV</div>
              <div style={{fontSize:20,fontWeight:900,color:T.ok}}>{row.completed.length}</div>
            </div>
            <div style={{padding:"8px 12px",borderRadius:10,background:`${T.warn}22`,border:`1px solid ${T.warn}55`,textAlign:"center"}}>
              <div style={{fontSize:10,color:T.tm,fontWeight:700}}>XP</div>
              <div style={{fontSize:20,fontWeight:900,color:T.warn}}>{row.totalXP}</div>
            </div>
            {row.avgScore!==null&&<div style={{padding:"8px 12px",borderRadius:10,background:`${gradeColor(row.avgScore)}22`,border:`1px solid ${gradeColor(row.avgScore)}66`,textAlign:"center"}}>
              <div style={{fontSize:10,color:T.tm,fontWeight:700}}>PUAN</div>
              <div style={{fontSize:20,fontWeight:900,color:gradeColor(row.avgScore)}}>🎯 {row.avgScore}</div>
            </div>}
          </div>
        </div>
      </div>

      {/* Task rows — expand on click */}
      <div style={{display:"grid",gap:8}}>
        {row.completed.map(t=>{
          const expanded=expandedTask===t.id;
          const sc=t.score;
          const sg=gradeColor(sc);
          const ratio=t.dur?t.dur/(t.expectedMin*60000):null;
          return(<div key={t.id} style={{
            borderRadius:14,background:T.card,
            border:`2px solid ${expanded?sg+"88":T.border}`,
            overflow:"hidden",transition:"all .2s",
          }}>
            {/* Row */}
            <div onClick={()=>setExpandedTask(expanded?null:t.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
              cursor:"pointer",background:expanded?`${sg}11`:"transparent",
              transition:"background .15s",
            }}>
              <TaskImage taskId={t.id} type="gorsel" size={42} fallbackEmoji={t.img} style={{borderRadius:8,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
                  <span style={{fontSize:11,color:T.tm,fontFamily:"monospace",fontWeight:700}}>#{t.id}</span>
                  <span style={{fontSize:14,fontWeight:700,color:T.tp,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,fontSize:11,color:T.ts,flexWrap:"wrap"}}>
                  <span style={{padding:"2px 8px",borderRadius:6,background:`${T.purple}22`,color:T.pl,fontWeight:600}}>{t.cat}</span>
                  <span style={{color:T.warn,fontWeight:700}}>+{t.xp} XP</span>
                </div>
              </div>

              {/* Time comparison */}
              <div style={{textAlign:"center",minWidth:90}}>
                <div style={{fontSize:10,color:T.tm,letterSpacing:1,fontWeight:700}}>SÜRE</div>
                <div style={{display:"flex",alignItems:"baseline",gap:4,justifyContent:"center"}}>
                  <span style={{fontSize:18,fontWeight:900,color:sg||T.tp,lineHeight:1}}>{t.dur?fd(t.dur):"—"}</span>
                  <span style={{fontSize:11,color:T.tm}}>/ {t.expectedMin}dk</span>
                </div>
                {ratio&&<div style={{fontSize:10,marginTop:2,color:sg,fontWeight:700}}>
                  {ratio<0.8?`⚡ %${Math.round((1-ratio)*100)} hızlı`:ratio<=1.0?"✓ Zamanında":`+%${Math.round((ratio-1)*100)} fazla`}
                </div>}
              </div>

              {/* Score */}
              {sc!==null&&<div style={{
                padding:"6px 12px",borderRadius:10,
                background:`${sg}22`,border:`1px solid ${sg}66`,
                textAlign:"center",minWidth:62,
              }}>
                <div style={{fontSize:10,color:T.tm,fontWeight:700,letterSpacing:1}}>PUAN</div>
                <div style={{fontSize:18,fontWeight:900,color:sg,lineHeight:1}}>🎯 {sc}</div>
              </div>}

              <span style={{fontSize:18,color:T.tm,transition:"transform .2s",transform:expanded?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
            </div>

            {/* Expanded — what they learned */}
            {expanded&&<div style={{padding:"14px 16px",background:`${sg}08`,borderTop:`1px solid ${sg}33`}}>
              <div style={{fontSize:10,color:sg,fontWeight:800,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>📚 Bu Görevden Öğrendi</div>
              {t.learnings&&t.learnings.length>0?(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {t.learnings.map((lr,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:`${T.purple}15`,border:`1px solid ${T.purple}33`}}>
                      <span style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${T.pl},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff",flexShrink:0}}>{i+1}</span>
                      <span style={{fontSize:13,color:T.tp,fontWeight:600}}>{lr}</span>
                    </div>
                  ))}
                </div>
              ):<div style={{fontSize:13,color:T.tm,fontStyle:"italic"}}>Bu görev için kazanım kaydı yok.</div>}

              {/* Performance breakdown */}
              <div style={{marginTop:12,padding:"10px 12px",borderRadius:10,background:T.dark,border:`1px solid ${T.border}`,fontSize:12,color:T.ts}}>
                <div style={{fontSize:10,color:T.tm,fontWeight:800,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>⏱ Performans Analizi</div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                  <span>Beklenen: <b style={{color:T.cyan}}>{t.expectedMin} dk</b></span>
                  <span>•</span>
                  <span>Gerçekleşen: <b style={{color:sg}}>{fd(t.dur||0)}</b></span>
                  {sc!==null&&<><span>•</span><span style={{color:sg,fontWeight:800}}>{gradeLabel(sc)}</span></>}
                </div>
                {/* Visual bar comparison */}
                <div style={{position:"relative",height:6,borderRadius:3,background:"#0008",marginTop:4,overflow:"hidden"}}>
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${Math.min(100,(ratio||0)*100)}%`,background:`linear-gradient(90deg,${sg},${sg}cc)`,borderRadius:3}}/>
                  <div style={{position:"absolute",top:-2,left:`${Math.min(100,100)}%`,width:2,height:10,background:T.tp,opacity:.6}}/>
                </div>
                <div style={{fontSize:10,color:T.tm,marginTop:4,textAlign:"right"}}>↑ Hedef süre</div>
              </div>

              {t.tp.instructorNote&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:`${T.ok}15`,border:`1px solid ${T.ok}44`,fontSize:13,color:"#86efac",fontStyle:"italic"}}>
                💬 Notunuz: "{t.tp.instructorNote}"
              </div>}
              <div style={{marginTop:8,fontSize:11,color:T.tm}}>
                ✓ Onay: {new Date(t.tp.approvedAt||t.tp.completedAt).toLocaleString("tr-TR")}
              </div>
            </div>}
          </div>);
        })}
      </div>
    </div>);
  }

  // ═══ MAIN LIST VIEW ═══
  return(<div>
    {/* Hero */}
    <div style={{padding:18,borderRadius:18,background:`linear-gradient(135deg,${T.cyan}22,${T.purple}33,#1a0a3a)`,border:`2px solid ${T.cyan}55`,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{fontSize:42}}>📊</div>
        <div style={{flex:1,minWidth:200}}>
          <h2 style={{margin:0,fontSize:24,color:T.cyan,fontWeight:900}}>Günlük Show</h2>
          <div style={{fontSize:13,color:T.ts,marginTop:2}}>Öğrenci ilerlemesi & kazanımlar</div>
        </div>
        <div style={{padding:"8px 14px",borderRadius:10,background:`${T.ok}22`,border:`1px solid ${T.ok}55`,textAlign:"center"}}>
          <div style={{fontSize:10,color:T.tm,fontWeight:700,letterSpacing:1}}>TOPLAM GÖREV</div>
          <div style={{fontSize:22,fontWeight:900,color:T.ok}}>{allCount}</div>
        </div>
      </div>

      {/* Date filters */}
      <div style={{display:"flex",gap:6,marginTop:14,flexWrap:"wrap"}}>
        {[{id:"today",label:"📅 Bugün"},{id:"week",label:"🗓️ Son 7 Gün"},{id:"all",label:"♾️ Tüm Zaman"}].map(f=>(
          <button key={f.id} onClick={()=>setDayFilter(f.id)} style={{
            padding:"8px 16px",borderRadius:10,
            border:`2px solid ${dayFilter===f.id?T.cyan:T.border}`,
            background:dayFilter===f.id?T.cyan+"33":T.dark,
            color:dayFilter===f.id?T.cyan:T.ts,
            cursor:"pointer",fontWeight:700,fontSize:13,
            transition:"all .15s",
          }}>{f.label}</button>
        ))}
      </div>
    </div>

    {/* Student cards */}
    {studentRows.length===0?(
      <div style={{padding:50,textAlign:"center",borderRadius:16,background:T.card,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:48,opacity:.4,marginBottom:8}}>📭</div>
        <div style={{fontSize:15,color:T.ts,fontWeight:600}}>Bu zaman aralığında tamamlanan görev yok</div>
        <div style={{fontSize:13,color:T.tm,marginTop:4}}>Filtreyi değiştirmeyi dene</div>
      </div>
    ):(
      <div style={{display:"grid",gap:10}}>
        {studentRows.map(r=>(
          <div key={r.student.id} onClick={()=>setSelStudent(r.student.id)} style={{
            padding:14,borderRadius:14,cursor:"pointer",
            background:T.card,
            border:`2px solid ${T.border}`,
            transition:"all .2s",
          }} onMouseOver={e=>{e.currentTarget.style.borderColor=T.orange+"66";e.currentTarget.style.transform="translateX(4px)";}} onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="translateX(0)";}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${T.orange},${T.od})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff",flexShrink:0}}>{r.student.name[0]}</div>
              <div style={{flex:1,minWidth:140}}>
                <div style={{fontSize:15,fontWeight:800,color:T.tp}}>{r.student.name}</div>
                <div style={{fontSize:12,color:T.ts,marginTop:2}}>{r.completed.length} görev tamamladı</div>
              </div>

              {/* Stats inline */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <div style={{padding:"4px 10px",borderRadius:8,background:`${T.warn}22`,fontSize:12,color:T.warn,fontWeight:800,whiteSpace:"nowrap"}}>⚡ {r.totalXP}</div>
                {r.avgScore!==null&&<div style={{padding:"4px 10px",borderRadius:8,background:`${gradeColor(r.avgScore)}22`,fontSize:12,color:gradeColor(r.avgScore),fontWeight:800,whiteSpace:"nowrap"}}>🎯 {r.avgScore}</div>}
                {r.fastCount>0&&<div style={{padding:"4px 10px",borderRadius:8,background:`${T.ok}22`,fontSize:12,color:T.ok,fontWeight:800,whiteSpace:"nowrap"}}>⚡ {r.fastCount} hızlı</div>}
              </div>

              <span style={{fontSize:18,color:T.tm}}>▶</span>
            </div>

            {/* Mini task preview row */}
            <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
              {r.completed.slice(0,8).map(t=>(
                <div key={t.id} title={`#${t.id} ${t.title}`} style={{
                  width:30,height:30,borderRadius:6,
                  background:gradeColor(t.score)+"33",
                  border:`1px solid ${gradeColor(t.score)}66`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:800,color:gradeColor(t.score),
                }}>#{t.id}</div>
              ))}
              {r.completed.length>8&&<div style={{padding:"6px 10px",borderRadius:6,background:T.dark,fontSize:11,color:T.tm,fontWeight:600}}>+{r.completed.length-8}</div>}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// PARENT VIEW — Tabs at top, hero card below with current task
// ═══════════════════════════════════════════════════════════════
function ParentView({parent,users,prog,classLayout,logs,initialTab="class"}){
  const[tab,setTab]=useState(initialTab);
  const child=users.find(u=>u.id===parent.childId);

  if(!child)return(<div style={{padding:50,textAlign:"center",borderRadius:20,background:`linear-gradient(135deg,${T.err}22,${T.card})`,border:`2px solid ${T.err}55`,maxWidth:500,margin:"40px auto"}}>
    <div style={{fontSize:64,marginBottom:12,opacity:.6}}>👨‍👩‍👧</div>
    <h2 style={{fontSize:20,color:T.err,margin:"0 0 8px 0"}}>Çocuk Bilgisi Bulunamadı</h2>
    <div style={{fontSize:14,color:T.ts,lineHeight:1.6}}>Henüz hesabınıza bir öğrenci atanmamış görünüyor. Lütfen okul yönetimi veya BerryBot ekibiyle iletişime geçin.</div>
  </div>);

  const sp=prog[child.id]||{};
  const completed=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED);
  const xp=completed.reduce((a,t)=>a+t.xp,0);
  const lv=getLevel(xp);
  const nlv=getNextLevel(xp);
  const lvProgress=nlv?((xp-lv.min)/(nlv.min-lv.min))*100:100;
  const cnt=completed.length;
  const pct=Math.round(cnt/36*100);
  const avgScore=calcAvgScore(sp);
  const isOnline=child.online||(prog[child.id]?.online);
  const currentTask=TASKS.find(t=>sp[t.id]?.status===TS.ACTIVE||sp[t.id]?.status===TS.IN_PROGRESS||sp[t.id]?.status===TS.PENDING);

  // Today's progress
  const dayStart=new Date();dayStart.setHours(0,0,0,0);
  const todayCount=completed.filter(t=>{
    const ts=sp[t.id]?.approvedAt||sp[t.id]?.completedAt;
    return ts&&ts>=dayStart.getTime();
  }).length;

  // Total time spent
  let totalMs=0;
  completed.forEach(t=>{const tp=sp[t.id];if(tp.startedAt&&tp.completedAt)totalMs+=Math.max(0,tp.completedAt-tp.startedAt);});

  return(<div>
    <style>{`
      @keyframes pv-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      @keyframes pv-fadeup { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pv-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      @keyframes pv-ring { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.6);opacity:0} }
      @keyframes pv-pulse-soft { 0%,100%{box-shadow:0 0 0 0 ${T.ok}66} 70%{box-shadow:0 0 0 14px ${T.ok}00} }
      .pv-content { animation: pv-fadeup .5s ease-out backwards; }
    `}</style>

    {/* ═══ TABS — EN ÜSTTE ═══ */}
    <div style={{
      display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",
      padding:6,borderRadius:14,
      background:T.card,border:`1px solid ${T.border}`,
    }}>
      {[
        {k:"class",d:"Çocuğun şu an ne yapıyor",c:T.orange,emoji:"🏫",l:"Sınıf & Aktivite"},
        {k:"learnings",d:"Neler öğrendi",c:T.pl,emoji:"📚",l:"Kazanımlar"},
        {k:"cv",d:"Profesyonel rapor",c:T.cyan,emoji:"📜",l:"Sertifika & CV"},
      ].map(t=>(
        <button key={t.k} onClick={()=>setTab(t.k)} style={{
          flex:"1 1 200px",
          fontSize:14,padding:"12px 16px",borderRadius:10,
          border:tab===t.k?`2px solid ${t.c}`:"2px solid transparent",
          background:tab===t.k?`linear-gradient(135deg,${t.c}33,${t.c}11)`:"transparent",
          color:tab===t.k?t.c:T.ts,
          cursor:"pointer",fontWeight:tab===t.k?800:600,
          textAlign:"left",transition:"all .2s",
          display:"flex",alignItems:"center",gap:10,
        }}>
          <span style={{fontSize:24,filter:tab===t.k?`drop-shadow(0 2px 6px ${t.c}88)`:"none"}}>{t.emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.l}</div>
            <div style={{fontSize:11,opacity:.75,fontWeight:500,marginTop:1}}>{t.d}</div>
          </div>
        </button>
      ))}
    </div>

    {/* ═══ HERO PROFILE CARD ═══ */}
    <div style={{
      position:"relative",marginBottom:18,
      borderRadius:24,padding:24,overflow:"hidden",
      background:`linear-gradient(135deg,${lv.color}22,${T.purple}33,${T.orange}22,#1a0a3a)`,
      border:`3px solid ${lv.color}66`,
      boxShadow:`0 12px 40px ${lv.color}33`,
    }}>
      {/* Decorative big icon backdrop */}
      <div style={{position:"absolute",top:-20,right:-20,fontSize:200,opacity:.06,transform:"rotate(-12deg)",pointerEvents:"none"}}>{lv.icon}</div>
      <div style={{position:"absolute",bottom:-30,left:-30,fontSize:150,opacity:.05,transform:"rotate(15deg)",pointerEvents:"none"}}>🤖</div>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        background:`linear-gradient(90deg,transparent 30%,${lv.color}22 50%,transparent 70%)`,
        backgroundSize:"200% 100%",animation:"pv-shimmer 5s infinite linear",
      }}/>

      <div style={{position:"relative"}}>
        <div style={{fontSize:13,color:T.ts,fontWeight:600,marginBottom:14,letterSpacing:.5}}>
          👋 Merhaba <b style={{color:T.tp}}>{parent.name.split(" ")[0]}</b>, çocuğunuzun robotik yolculuğu:
        </div>

        {/* Profile row: Avatar + Name+CurrentTask + Progress ring */}
        <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap",marginBottom:18}}>
          {/* Avatar with online ring */}
          <div style={{position:"relative",flexShrink:0}}>
            {isOnline&&<div style={{position:"absolute",inset:-6,borderRadius:"50%",border:`3px solid ${T.ok}88`,animation:"pv-ring 2s infinite"}}/>}
            <div style={{
              width:84,height:84,borderRadius:"50%",
              background:`linear-gradient(135deg,${T.orange},${T.od},${T.purple})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:38,fontWeight:900,color:"#fff",
              border:`4px solid ${lv.color}`,
              boxShadow:`0 0 24px ${lv.color}88`,
              animation:"pv-float 3.5s ease-in-out infinite",
            }}>{child.name[0]}</div>
            {isOnline&&<div style={{
              position:"absolute",bottom:2,right:2,
              width:18,height:18,borderRadius:"50%",
              background:T.ok,
              border:`3px solid ${T.bg}`,
              boxShadow:`0 0 8px ${T.ok}`,
            }}/>}
          </div>

          {/* CENTER: Name + Current Task INFO */}
          <div style={{flex:1,minWidth:200}}>
            <h1 style={{margin:0,fontSize:30,fontWeight:900,color:T.tp,letterSpacing:.3,lineHeight:1.1}}>{child.name}</h1>

            {/* Level badge + online */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,flexWrap:"wrap"}}>
              <span style={{fontSize:13,padding:"4px 12px",borderRadius:8,background:`${lv.color}33`,color:lv.color,fontWeight:800,border:`1px solid ${lv.color}55`}}>
                {lv.icon} Lv.{lv.lv} • {lv.name}
              </span>
              {isOnline?(
                <span style={{fontSize:12,padding:"4px 10px",borderRadius:8,background:`${T.ok}22`,color:T.ok,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,animation:"pv-pulse-soft 2s infinite",border:`1px solid ${T.ok}55`}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:T.ok}}/>
                  ŞU AN AKTİF
                </span>
              ):(
                <span style={{fontSize:12,padding:"4px 10px",borderRadius:8,background:`${T.tm}22`,color:T.tm,fontWeight:600}}>○ Çevrimdışı</span>
              )}
            </div>

            {/* CURRENT TASK BANNER — between name and progress */}
            {currentTask?(
              <div style={{
                marginTop:12,padding:"12px 14px",borderRadius:12,
                background:`linear-gradient(135deg,${T.cyan}22,${T.purple}11)`,
                border:`2px solid ${T.cyan}55`,
                display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",
              }}>
                <div style={{
                  width:38,height:38,borderRadius:10,
                  background:`linear-gradient(135deg,${T.cyan},${T.purple})`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,flexShrink:0,
                }}>▶</div>
                <div style={{flex:1,minWidth:160}}>
                  <div style={{fontSize:10,color:T.tm,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase"}}>
                    {sp[currentTask.id]?.status===TS.PENDING?"⏳ Onayda":sp[currentTask.id]?.status===TS.IN_PROGRESS?"🛠 Şu an çalışıyor":"▶ Aktif görev"}
                  </div>
                  <div style={{fontSize:15,fontWeight:800,color:T.cyan,marginTop:1}}>
                    Görev #{currentTask.id} · {currentTask.title}
                  </div>
                  <div style={{fontSize:11,color:T.ts,marginTop:2}}>
                    📂 <b>{currentTask.cat}</b> projesi · ⏱ {currentTask.expectedMin}dk hedef
                  </div>
                </div>
              </div>
            ):(
              <div style={{
                marginTop:12,padding:"10px 12px",borderRadius:12,
                background:`${T.tm}11`,border:`1px solid ${T.border}`,
                fontSize:13,color:T.tm,
                display:"inline-flex",alignItems:"center",gap:6,
              }}>
                💤 Şu anda aktif görev yok
              </div>
            )}
          </div>

          {/* RIGHT: Big circular progress */}
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{
              width:110,height:110,borderRadius:"50%",
              background:`conic-gradient(${T.ok} ${pct*3.6}deg,${T.border} 0deg)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:`0 0 24px ${T.ok}44`,
              position:"relative",
            }}>
              <div style={{
                width:88,height:88,borderRadius:"50%",
                background:`radial-gradient(circle,${T.bg},#0a0518)`,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                border:`2px solid ${T.ok}33`,
              }}>
                <div style={{fontSize:30,fontWeight:900,color:T.ok,lineHeight:1}}>{pct}<span style={{fontSize:14}}>%</span></div>
                <div style={{fontSize:10,color:T.tm,fontWeight:700,letterSpacing:1}}>{cnt}/36 GÖREV</div>
              </div>
            </div>
          </div>
        </div>

        {/* Level XP progress bar */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6}}>
            <span style={{fontSize:12,color:T.ts,fontWeight:700,letterSpacing:1}}>
              ⚡ <b style={{color:T.warn,fontSize:14}}>{xp}</b> XP toplandı
            </span>
            {nlv&&<span style={{fontSize:11,color:T.tm}}>
              Sonraki: {nlv.icon} <b style={{color:nlv.color}}>{nlv.name}</b> ({nlv.min-xp} XP)
            </span>}
          </div>
          <div style={{position:"relative",width:"100%",height:14,borderRadius:7,background:"#0008",overflow:"hidden",border:`1px solid ${T.border}`}}>
            <div style={{
              height:"100%",borderRadius:7,
              background:`linear-gradient(90deg,${T.warn},${lv.color},${T.pl})`,
              backgroundSize:"200% 100%",
              animation:"pv-shimmer 2s infinite linear",
              width:`${lvProgress}%`,
              boxShadow:`0 0 10px ${lv.color}88`,
              transition:"width .6s ease",
            }}/>
          </div>
        </div>

        {/* Quick stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
          <PVStat icon="📅" label="Bugün" value={todayCount} unit="görev" color={T.ok} highlight={todayCount>0}/>
          <PVStat icon="⏱️" label="Toplam Süre" value={totalMs>0?fd(totalMs):"—"} color={T.cyan}/>
          <PVStat icon="🎯" label="Performans" value={avgScore!==null?avgScore:"—"} unit={avgScore!==null?"/100":""} color={avgScore!==null?gradeColor(avgScore):T.tm}/>
          <PVStat icon="📚" label="Kazanım" value={[...new Set(completed.flatMap(t=>t.learnings||[]))].length} color={T.pl}/>
        </div>
      </div>
    </div>

    {/* ═══ CONTENT ═══ */}
    <div className="pv-content" key={tab}>
      {tab==="class"&&<ParentClassroomView child={child} sp={sp} classLayout={classLayout} logs={logs} prog={prog}/>}
      {tab==="learnings"&&<ParentLearningsView child={child} sp={sp}/>}
      {tab==="cv"&&<ParentCVView child={child} sp={sp}/>}
    </div>
  </div>);
}

function PVStat({icon,label,value,unit,color,highlight}){
  return(<div style={{
    padding:"10px 12px",borderRadius:12,
    background:`${color}22`,border:`1px solid ${color}55`,
    textAlign:"center",
    boxShadow:highlight?`0 0 16px ${color}44`:"none",
  }}>
    <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
    <div style={{fontSize:9,color:T.tm,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
    <div style={{fontSize:16,fontWeight:900,color,lineHeight:1.2}}>{value}{unit&&<span style={{fontSize:10,opacity:.7,marginLeft:2}}>{unit}</span>}</div>
  </div>);
}


// ═══════════════════════════════════════════════════════════════
// TAB 1: SINIF & AKTİVİTE — Yenilenmiş, ekran yerleşimi + aktivite üstte
// ═══════════════════════════════════════════════════════════════
function ParentClassroomView({child,sp,classLayout,logs,prog}){
  const[showLayout,setShowLayout]=useState(true); // Veli isterse gizleyebilir

  // Find which class & seat
  let mySeat=null;
  let myClass=null;
  for(const c of (classLayout||[])){
    for(const t of (c.tables||[])){
      const seatIdx=t.seats?.indexOf(child.id);
      if(seatIdx>=0){mySeat={tableId:t.id,seatIdx,table:t};myClass=c;break;}
    }
    if(myClass)break;
  }

  const current=TASKS.find(t=>sp[t.id]?.status===TS.ACTIVE||sp[t.id]?.status===TS.IN_PROGRESS||sp[t.id]?.status===TS.PENDING);
  const childLogs=(logs||[]).filter(l=>l.userId===child.id||l.targetUser===child.id).slice(0,30);
  const currentPage=prog[child.id]?.currentPage;
  const currentTaskId=prog[child.id]?.currentTaskId;
  const pageUpdatedAt=prog[child.id]?.pageUpdatedAt;
  const isRecentlyActive=pageUpdatedAt&&(Date.now()-pageUpdatedAt<2*60*1000);

  const renderPageInfo=()=>{
    if(!isRecentlyActive)return null;
    const pageNames={
      "login":"🔐 Giriş yapıyor",
      "dash":"🗺️ Görev haritasında",
      "task":currentTaskId?`📝 Görev #${currentTaskId} ekranında`:"📝 Görev ekranında",
      "practice":"🧠 Practice yapıyor",
      "hw":"📋 Ödev ekranında",
    };
    return pageNames[currentPage]||"💻 Aktif";
  };

  return(<div>
    {/* ═══ ŞU ANKİ DURUM — En üstte, en önemli ═══ */}
    <div style={{
      marginBottom:14,padding:18,borderRadius:18,
      background:current?`linear-gradient(135deg,${T.cyan}22,${T.purple}22,${T.card})`:`linear-gradient(135deg,${T.tm}11,${T.card})`,
      border:`2px solid ${current?T.cyan:T.border}55`,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{
          width:54,height:54,borderRadius:14,
          background:current?`linear-gradient(135deg,${T.cyan},${T.purple})`:T.dark,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,
          flexShrink:0,
        }}>{current?"▶":"💤"}</div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:11,letterSpacing:2,color:T.tm,fontWeight:800,textTransform:"uppercase",marginBottom:3}}>
            ⚡ ŞU AN
          </div>
          {current?(
            <div>
              <div style={{fontSize:18,fontWeight:900,color:T.cyan,letterSpacing:.3}}>
                #{current.id} {current.title}
              </div>
              <div style={{fontSize:13,color:T.ts,marginTop:3}}>
                {current.cat} • {current.expectedMin}dk hedef süre
                {sp[current.id]?.status===TS.PENDING&&<span style={{marginLeft:8,padding:"2px 8px",borderRadius:6,background:T.pl+"33",color:T.pl,fontSize:11,fontWeight:700}}>⏳ ONAYDA</span>}
                {sp[current.id]?.status===TS.IN_PROGRESS&&<span style={{marginLeft:8,padding:"2px 8px",borderRadius:6,background:T.cyan+"33",color:T.cyan,fontSize:11,fontWeight:700}}>🛠 YAPIYOR</span>}
              </div>
              {renderPageInfo()&&<div style={{marginTop:6,fontSize:12,color:T.ok,fontWeight:600}}>🌐 {renderPageInfo()}</div>}
            </div>
          ):(
            <div>
              <div style={{fontSize:16,fontWeight:700,color:T.tm}}>Şu an aktif görev yok</div>
              <div style={{fontSize:12,color:T.tm,marginTop:3}}>Çocuğunuz tüm güncel görevlerini tamamlamış görünüyor 👏</div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ═══ AKTİVİTE GEÇMİŞİ — Yukarı taşındı (eski yer çok altdaydı) ═══ */}
    <div style={{marginBottom:14}}>
      <div style={{
        padding:18,borderRadius:18,
        background:T.card,border:`1px solid ${T.border}`,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <div style={{fontSize:24}}>📜</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:900,color:T.tp,letterSpacing:.3}}>Aktivite Geçmişi</div>
            <div style={{fontSize:12,color:T.ts}}>Son işlemler & başarılar</div>
          </div>
          {childLogs.length>0&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:T.purple+"22",color:T.pl,fontWeight:700}}>{childLogs.length} kayıt</span>}
        </div>

        {childLogs.length===0?(
          <div style={{padding:24,textAlign:"center",color:T.tm,fontSize:14}}>
            Henüz kayıt yok 🌱
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:400,overflowY:"auto"}}>
            {childLogs.map((l,i)=>{
              const icon=l.type==="task_approved"?"✅":l.type==="task_started"?"▶":l.type==="task_submitted"?"📤":l.type==="task_rejected"?"↻":l.type==="help_requested"?"🖐":l.type==="answer_unlocked"?"🔓":l.type==="practice_attempt"?"🧠":"📝";
              const color=l.type==="task_approved"?T.ok:l.type==="task_rejected"?T.err:l.type==="help_requested"?T.err:l.type==="task_submitted"?T.pl:l.type==="answer_unlocked"?T.cyan:T.ts;
              return(<div key={i} style={{
                display:"flex",alignItems:"center",gap:10,
                padding:"10px 12px",borderRadius:10,
                background:T.dark,border:`1px solid ${color}22`,
              }}>
                <div style={{
                  width:34,height:34,borderRadius:"50%",
                  background:`${color}22`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,flexShrink:0,
                }}>{icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.tp,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {l.detail||l.type}
                  </div>
                  <div style={{fontSize:11,color:T.tm,marginTop:1}}>{new Date(l.ts).toLocaleString("tr-TR")}</div>
                </div>
              </div>);
            })}
          </div>
        )}
      </div>
    </div>

    {/* ═══ SINIF YERLEŞİMİ — Toggle ile gizlenebilir ═══ */}
    <div style={{
      borderRadius:18,
      background:T.card,border:`1px solid ${T.border}`,
      overflow:"hidden",
    }}>
      <div onClick={()=>setShowLayout(!showLayout)} style={{
        padding:"14px 18px",cursor:"pointer",
        background:showLayout?`linear-gradient(135deg,${T.orange}22,${T.card})`:T.card,
        borderBottom:showLayout?`1px solid ${T.border}`:"none",
        display:"flex",alignItems:"center",gap:10,
        transition:"all .2s",
      }}>
        <div style={{fontSize:24}}>🏫</div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:900,color:T.tp,letterSpacing:.3}}>Sınıfın Yerleşimi</div>
          <div style={{fontSize:12,color:T.ts}}>{mySeat?`${myClass.name} sınıfında oturuyor`:"Henüz bir koltuğa atanmadı"}</div>
        </div>
        <button style={{
          padding:"6px 14px",borderRadius:8,
          border:`1px solid ${T.orange}55`,
          background:T.orange+"22",color:T.orange,
          fontWeight:700,fontSize:12,cursor:"pointer",
          display:"flex",alignItems:"center",gap:6,
        }}>
          {showLayout?<>👁️ Gizle</>:<>👁️‍🗨️ Göster</>}
        </button>
      </div>

      {showLayout&&(myClass?(
        <div style={{padding:18}}>
          <ParentMiniClassroom myClass={myClass} childId={child.id}/>
          <div style={{marginTop:10,fontSize:11,color:T.tm,textAlign:"center",fontStyle:"italic"}}>
            📍 Yıldızlı ışık çocuğunuzun oturduğu yer
          </div>
        </div>
      ):(
        <div style={{padding:30,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:8,opacity:.4}}>🪑</div>
          <div style={{fontSize:14,color:T.tm}}>Henüz sınıf yerleşim planı oluşturulmamış</div>
        </div>
      ))}
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// MINI CLASSROOM — Robotik laboratuvar teması (siyah zemin yerine)
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// MINI CLASSROOM — Robotik laboratuvar teması, AdminClassroom ile aynı render
// ═══════════════════════════════════════════════════════════════
function ParentMiniClassroom({myClass,childId}){
  const tables=myClass.tables||[];
  const objects=myClass.objects||[];

  // Calculate actual content bounds (not relying on canvasW/H which may be wrong)
  const allItems=[...tables,...objects];
  const minX=Math.min(0,...allItems.map(t=>t.x||0));
  const minY=Math.min(0,...allItems.map(t=>t.y||0));
  const maxX=Math.max(...allItems.map(t=>(t.x||0)+(t.w||120)),myClass.canvasW||900);
  const maxY=Math.max(...allItems.map(t=>(t.y||0)+(t.h||80)),myClass.canvasH||500);
  const contentW=maxX-minX+40; // padding
  const contentH=maxY-minY+40;

  // Available rendering width — responsive
  const containerW=Math.min(800,contentW);
  const scale=Math.min(containerW/contentW,500/contentH,1);
  const sw=contentW*scale;
  const sh=contentH*scale;

  return(<div style={{
    position:"relative",
    width:"100%",maxWidth:sw,height:sh,margin:"0 auto",
    borderRadius:14,overflow:"hidden",
    background:`
      radial-gradient(circle at 20% 20%,${T.purple}33,transparent 40%),
      radial-gradient(circle at 80% 80%,${T.cyan}22,transparent 40%),
      linear-gradient(135deg,#1a1a2e,#16213e,#0f1729)
    `,
    border:`2px solid ${T.purple}55`,
    boxShadow:`inset 0 0 60px ${T.purple}22`,
  }}>
    {/* Floor grid */}
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.12,pointerEvents:"none"}}>
      <defs>
        <pattern id={`grid-${myClass.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke={T.cyan} strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${myClass.id})`}/>
    </svg>

    {/* Decorative robotic icons in corners */}
    <div style={{position:"absolute",top:8,left:8,fontSize:20,opacity:.25,pointerEvents:"none"}}>🤖</div>
    <div style={{position:"absolute",top:8,right:8,fontSize:20,opacity:.25,pointerEvents:"none"}}>📡</div>
    <div style={{position:"absolute",bottom:8,left:8,fontSize:20,opacity:.25,pointerEvents:"none"}}>⚡</div>
    <div style={{position:"absolute",bottom:8,right:8,fontSize:20,opacity:.25,pointerEvents:"none"}}>🦾</div>

    {/* Class name banner */}
    <div style={{
      position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",
      padding:"4px 14px",borderRadius:6,
      background:`linear-gradient(180deg,#2a4a3a,#1a3a2a)`,
      border:`1px solid ${T.ok}33`,
      fontSize:10,color:T.ok,fontWeight:700,letterSpacing:1,
      boxShadow:`0 2px 6px #000`,
      zIndex:10,
    }}>📚 {(myClass.name||"BERRYBOT LABORATUVARI").toUpperCase()}</div>

    {/* Inner scaled wrapper — all positioning happens here */}
    <div style={{
      position:"absolute",
      left:20*scale,top:20*scale,
      width:contentW-40,height:contentH-40,
      transform:`translate(${-minX*scale}px,${-minY*scale}px) scale(${scale})`,
      transformOrigin:"top left",
    }}>
      {/* TABLES — render with CSS Grid for seats (same as AdminClassroom) */}
      {tables.map(table=>{
        const pr=TABLE_PRESETS[table.type]||TABLE_PRESETS["2li"];
        const gCols=table.horizontal?pr.rows:pr.cols;
        const gRows=table.horizontal?pr.cols:pr.rows;
        return(<div key={table.id} style={{
          position:"absolute",
          left:table.x,top:table.y,
          width:table.w,height:table.h,
          background:"linear-gradient(160deg, #A07828, #8B6914 30%, #7A5C12 60%, #6B4F12)",
          borderRadius:10,
          border:"3px solid #5C4010",
          boxShadow:"0 4px 16px #00000055, inset 0 1px 0 #C4A86833",
          display:"flex",flexDirection:"column",overflow:"hidden",
        }}>
          {/* Table header */}
          <div style={{
            padding:"2px 5px",background:"#5C401088",
            borderBottom:"1px solid #4a350e",flexShrink:0,
          }}>
            <span style={{fontSize:7,color:"#C4A868",fontWeight:700}}>{pr.label}</span>
          </div>
          {/* Seats grid */}
          <div style={{
            flex:1,display:"grid",
            gridTemplateColumns:`repeat(${gCols},1fr)`,
            gridTemplateRows:`repeat(${gRows},1fr)`,
            gap:3,padding:3,
          }}>
            {table.seats.map((sid,si)=>{
              const isMe=sid===childId;
              return(<div key={si} style={{
                borderRadius:5,
                background:isMe?`radial-gradient(circle,${T.warn}cc,${T.orange}aa)`:sid?"#3a2a18":"#2a1f10",
                border:isMe?`2px solid ${T.warn}`:"1px solid #4a350e",
                boxShadow:isMe?`0 0 16px ${T.warn},inset 0 0 8px ${T.warn}88`:"inset 0 0 4px #00000088",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,
                position:"relative",
                animation:isMe?"pulse 2s infinite":"none",
              }}>
                {isMe&&<>
                  <span style={{filter:"drop-shadow(0 0 4px #fff)",fontSize:16}}>⭐</span>
                  <div style={{
                    position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",
                    padding:"2px 6px",borderRadius:4,
                    background:`linear-gradient(135deg,${T.warn},${T.orange})`,
                    color:"#fff",fontSize:9,fontWeight:900,letterSpacing:1,
                    boxShadow:`0 2px 6px ${T.warn}aa`,
                    whiteSpace:"nowrap",zIndex:20,
                  }}>📍 BEN</div>
                </>}
                {!isMe&&sid&&<span style={{fontSize:9,color:"#C4A868",fontWeight:700,opacity:.5}}>•</span>}
              </div>);
            })}
          </div>
        </div>);
      })}

      {/* OBJECTS — TVs etc */}
      {objects.map(obj=>{
        if(obj.type==="tv"){
          const isVertical=(obj.h||0)>(obj.w||0);
          return(<div key={obj.id} style={{
            position:"absolute",
            left:obj.x,top:obj.y,
            width:obj.w,height:obj.h,
            background:"linear-gradient(180deg,#1a1a2e,#0f0f1e)",
            borderRadius:8,border:"2px solid #333",
            boxShadow:"0 2px 8px #0004, inset 0 0 20px #0ea5e908",
            display:"flex",alignItems:"center",justifyContent:"center",
            gap:isVertical?3:6,
            flexDirection:isVertical?"column":"row",
            overflow:"hidden",
          }}>
            <span style={{fontSize:isVertical?12:14}}>🖥️</span>
            <span style={{fontSize:isVertical?7:9,fontWeight:700,color:"#67e8f9",letterSpacing:.5,writingMode:isVertical?"vertical-rl":"horizontal-tb"}}>{obj.label||"TV"}</span>
          </div>);
        }
        return null;
      })}
    </div>
  </div>);
}

function ParentLearningsView({child,sp}){
  const completed=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED);
  const xp=completed.reduce((a,t)=>a+t.xp,0);
  let totalMs=0;
  completed.forEach(t=>{const tp=sp[t.id];if(tp.startedAt&&tp.completedAt)totalMs+=Math.max(0,tp.completedAt-tp.startedAt);});
  const allLearnings=[...new Set(completed.flatMap(t=>t.learnings||[]))];
  const avgScore=calcAvgScore(sp);

  // ═══ 3 BECERI ALANI: Mekanik / Yazılım / Elektronik ═══
  const skillCategories={
    "🔧 Mekanik & Donanım":{
      color:T.warn,
      bg:`linear-gradient(135deg,${T.warn}22,${T.card})`,
      border:T.warn,
      keywords:["motor","tekerlek","servo","mekanik","montaj","yapı","robot","araç","gövde","hareket","yön","döner","sürüş"],
      tasks:["Motor","Mesafe/Navigasyon","Sumo Robot","Engel Algılama"],
      desc:"Robotun fiziksel parçalarını ve hareket sistemlerini öğrendi",
    },
    "💻 Yazılım & Algoritma":{
      color:T.cyan,
      bg:`linear-gradient(135deg,${T.cyan}22,${T.card})`,
      border:T.cyan,
      keywords:["fonksiyon","döngü","koşul","kod","program","algoritma","blok","mantık","değişken","if","while","for","komut"],
      tasks:["Fonksiyon","Çizgi Takip","Sumo Robot","Işık Takip"],
      desc:"Robotunu kontrol etmek için kod yazmayı öğrendi",
    },
    "⚡ Elektronik & Sensörler":{
      color:T.pl,
      bg:`linear-gradient(135deg,${T.purple}22,${T.card})`,
      border:T.pl,
      keywords:["sensör","led","buzzer","kızılötesi","ışık","mesafe","ultrasonik","ldr","ir","rgb","pin","analog","dijital","sinyal","devre","elektrik"],
      tasks:["RGB LED","Sensör+LED+Buzzer","Işık Sensörü","IR Kumanda","Işık Takip"],
      desc:"Sensörler ve elektronik bileşenlerle nasıl çalışılacağını öğrendi",
    },
  };

  // Her kategori için kazanılan beceriler & görevleri hesapla
  const categorized={};
  Object.entries(skillCategories).forEach(([catName,catDef])=>{
    const matchingTasks=completed.filter(t=>catDef.tasks.includes(t.cat));
    const matchingLearnings=allLearnings.filter(lr=>{
      const lower=lr.toLowerCase();
      return catDef.keywords.some(kw=>lower.includes(kw));
    });
    categorized[catName]={
      ...catDef,
      tasks:matchingTasks,
      learnings:[...new Set(matchingLearnings)],
      taskCount:matchingTasks.length,
      xpEarned:matchingTasks.reduce((a,t)=>a+t.xp,0),
    };
  });

  return(<div>
    <style>{`
      @keyframes pl-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    `}</style>

    {/* ═══ ÖZET STATLAR ═══ */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
      <div style={{padding:14,borderRadius:14,background:`linear-gradient(135deg,${T.cyan}22,${T.card})`,border:`1px solid ${T.cyan}44`,textAlign:"center"}}>
        <div style={{fontSize:22,fontWeight:900,color:T.cyan,lineHeight:1}}>{fd(totalMs)}</div>
        <div style={{fontSize:11,color:T.ts,fontWeight:600,marginTop:4}}>⏱ TOPLAM SÜRE</div>
      </div>
      <div style={{padding:14,borderRadius:14,background:`linear-gradient(135deg,${T.warn}22,${T.card})`,border:`1px solid ${T.warn}44`,textAlign:"center"}}>
        <div style={{fontSize:22,fontWeight:900,color:T.warn,lineHeight:1}}>{xp}</div>
        <div style={{fontSize:11,color:T.ts,fontWeight:600,marginTop:4}}>⚡ TOPLAM XP</div>
      </div>
      <div style={{padding:14,borderRadius:14,background:`linear-gradient(135deg,${T.pl}22,${T.card})`,border:`1px solid ${T.pl}44`,textAlign:"center"}}>
        <div style={{fontSize:22,fontWeight:900,color:T.pl,lineHeight:1}}>{allLearnings.length}</div>
        <div style={{fontSize:11,color:T.ts,fontWeight:600,marginTop:4}}>📚 KAZANIM</div>
      </div>
      <div style={{padding:14,borderRadius:14,background:`linear-gradient(135deg,${T.ok}22,${T.card})`,border:`1px solid ${T.ok}44`,textAlign:"center"}}>
        <div style={{fontSize:22,fontWeight:900,color:T.ok,lineHeight:1}}>{Math.round(completed.length/36*100)}%</div>
        <div style={{fontSize:11,color:T.ts,fontWeight:600,marginTop:4}}>📊 İLERLEME</div>
      </div>
      {avgScore!==null&&<div style={{padding:14,borderRadius:14,background:`${gradeColor(avgScore)}22`,border:`2px solid ${gradeColor(avgScore)}66`,textAlign:"center"}}>
        <div style={{fontSize:22,fontWeight:900,color:gradeColor(avgScore),lineHeight:1}}>🎯 {avgScore}</div>
        <div style={{fontSize:11,color:T.ts,fontWeight:600,marginTop:4}}>{gradeLabel(avgScore)}</div>
      </div>}
    </div>

    {/* ═══ 3 BECERI ALANI ═══ */}
    <div style={{marginBottom:14,padding:18,borderRadius:18,background:`linear-gradient(135deg,${T.purple}22,${T.card})`,border:`2px solid ${T.purple}55`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <div style={{fontSize:28}}>🎓</div>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:T.tp,letterSpacing:.3}}>Beceri Alanları</div>
          <div style={{fontSize:12,color:T.ts}}>Robotik mühendisliğinin 3 temel alanında ne kadar ilerledi</div>
        </div>
      </div>
    </div>

    <div style={{display:"grid",gap:12,marginBottom:14}}>
      {Object.entries(categorized).map(([catName,cat])=>{
        const learnedPct=cat.taskCount>0?Math.round((cat.taskCount/cat.tasks.length||1)*100):0;
        return(<div key={catName} style={{
          padding:18,borderRadius:18,
          background:cat.bg,
          border:`2px solid ${cat.border}55`,
          position:"relative",overflow:"hidden",
        }}>
          {/* Shimmer effect */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",
            background:`linear-gradient(90deg,transparent 30%,${cat.color}11 50%,transparent 70%)`,
            backgroundSize:"200% 100%",animation:"pl-shimmer 6s infinite linear",
          }}/>

          <div style={{position:"relative",display:"flex",alignItems:"flex-start",gap:14,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{
              fontSize:36,
              filter:`drop-shadow(0 4px 12px ${cat.color}88)`,
            }}>{catName.split(" ")[0]}</div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:18,fontWeight:900,color:cat.color,marginBottom:3,letterSpacing:.3}}>
                {catName.replace(/^[\u{1F000}-\u{1FFFF}]\s*/u,"")}
              </div>
              <div style={{fontSize:13,color:T.ts,lineHeight:1.4}}>{cat.desc}</div>
            </div>
            {/* XP earned in this category */}
            <div style={{textAlign:"center",padding:"10px 14px",borderRadius:12,background:"#0006",border:`1px solid ${cat.color}55`}}>
              <div style={{fontSize:10,color:T.tm,fontWeight:700,letterSpacing:1}}>KAZANILAN</div>
              <div style={{fontSize:18,fontWeight:900,color:cat.color}}>⚡ {cat.xpEarned}</div>
            </div>
          </div>

          {/* Tasks completed in this category */}
          {cat.tasks.length>0?(
            <div style={{position:"relative"}}>
              <div style={{fontSize:11,color:cat.color,fontWeight:800,letterSpacing:1.5,marginBottom:8,textTransform:"uppercase"}}>
                ✓ Tamamladığı Görevler ({cat.tasks.length})
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                {cat.tasks.map(t=>(
                  <div key={t.id} style={{
                    display:"inline-flex",alignItems:"center",gap:5,
                    padding:"5px 10px",borderRadius:8,
                    background:`${cat.color}22`,border:`1px solid ${cat.color}44`,
                    fontSize:12,
                  }}>
                    <span style={{fontFamily:"monospace",color:T.tm,fontWeight:700,fontSize:10}}>#{t.id}</span>
                    <span style={{color:T.tp,fontWeight:600}}>{t.title}</span>
                    <span style={{color:T.warn,fontWeight:700,fontSize:10}}>+{t.xp}</span>
                  </div>
                ))}
              </div>

              {/* Learnings in this category */}
              {cat.learnings.length>0&&<>
                <div style={{fontSize:11,color:cat.color,fontWeight:800,letterSpacing:1.5,marginBottom:8,textTransform:"uppercase"}}>
                  📚 Bu Alanda Öğrendiği Yetkinlikler
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {cat.learnings.map((lr,i)=>(
                    <div key={i} style={{
                      display:"flex",alignItems:"center",gap:8,
                      padding:"7px 11px",borderRadius:8,
                      background:`${cat.color}11`,border:`1px solid ${cat.color}33`,
                    }}>
                      <span style={{
                        width:22,height:22,borderRadius:"50%",
                        background:cat.color,color:"#fff",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,fontWeight:900,flexShrink:0,
                      }}>{i+1}</span>
                      <span style={{fontSize:13,color:T.tp,fontWeight:600}}>{lr}</span>
                    </div>
                  ))}
                </div>
              </>}
            </div>
          ):(
            <div style={{padding:14,textAlign:"center",borderRadius:10,background:T.dark,border:`1px dashed ${cat.color}33`}}>
              <div style={{fontSize:32,opacity:.4,marginBottom:4}}>🌱</div>
              <div style={{fontSize:13,color:T.tm,fontWeight:600}}>Bu alanda henüz görev tamamlanmadı</div>
              <div style={{fontSize:11,color:T.tm,marginTop:2}}>İlk görevle birlikte beceriler burada listelenecek</div>
            </div>
          )}
        </div>);
      })}
    </div>

    {/* ═══ TÜM TAMAMLANAN GÖREVLER LİSTESİ — eski liste, accordion ═══ */}
    <details style={{borderRadius:14,background:T.card,border:`1px solid ${T.border}`,overflow:"hidden"}}>
      <summary style={{padding:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:14,fontWeight:700,color:T.tp,listStyle:"none",userSelect:"none"}}>
        <span style={{fontSize:20}}>📋</span>
        <span style={{flex:1}}>Tüm Tamamlanan Görevler ({completed.length})</span>
        <span style={{fontSize:11,color:T.tm}}>▼ tıkla aç</span>
      </summary>
      <div style={{padding:"0 14px 14px",borderTop:`1px solid ${T.border}`}}>
        {completed.map(t=>{
          const tp=sp[t.id];
          const dur=(tp.startedAt&&tp.completedAt)?fd(tp.completedAt-tp.startedAt):null;
          const taskScore=tp.startedAt&&tp.completedAt?calcTaskScore(tp.completedAt-tp.startedAt,t.expectedMin):null;
          return(<div key={t.id} style={{
            display:"flex",alignItems:"center",gap:8,
            padding:"8px 10px",borderRadius:8,marginTop:6,
            background:T.dark,border:`1px solid ${T.border}`,
          }}>
            <TaskImage taskId={t.id} type="gorsel" size={36} fallbackEmoji={t.img} style={{borderRadius:6}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:T.tp,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>#{t.id} {t.title}</div>
              <div style={{fontSize:11,color:T.ts}}>{t.cat} {dur&&`• ${dur}`}</div>
            </div>
            <span style={{fontSize:11,color:T.warn,fontWeight:700}}>+{t.xp}</span>
            {taskScore!==null&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:`${gradeColor(taskScore)}22`,color:gradeColor(taskScore),fontWeight:800}}>🎯 {taskScore}</span>}
          </div>);
        })}
      </div>
    </details>
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: CV / SERTİFİKA — Mekanik / Yazılım / Elektronik vurgulu
// ═══════════════════════════════════════════════════════════════
function ParentCVView({child,sp}){
  const completed=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED);
  const xp=completed.reduce((a,t)=>a+t.xp,0);
  const lv=getLevel(xp);
  let totalMs=0;
  completed.forEach(t=>{const tp=sp[t.id];if(tp.startedAt&&tp.completedAt)totalMs+=Math.max(0,tp.completedAt-tp.startedAt);});
  const avgScore=calcAvgScore(sp);

  // 3 ana alan
  const skillAreas={
    "🔧 Mekanik & Donanım":{
      color:"#c97f10",lightBg:"#fff8e8",
      tasks:completed.filter(t=>["Motor","Mesafe/Navigasyon","Sumo Robot","Engel Algılama"].includes(t.cat)),
    },
    "💻 Yazılım & Algoritma":{
      color:"#0e7490",lightBg:"#e6f7fc",
      tasks:completed.filter(t=>["Fonksiyon","Çizgi Takip","Sumo Robot","Işık Takip"].includes(t.cat)),
    },
    "⚡ Elektronik & Sensörler":{
      color:"#7c3aed",lightBg:"#f5edff",
      tasks:completed.filter(t=>["RGB LED","Sensör+LED+Buzzer","Işık Sensörü","IR Kumanda","Işık Takip"].includes(t.cat)),
    },
  };

  // Build categorized learnings
  const buildCat=(taskCats)=>{
    const ts=completed.filter(t=>taskCats.includes(t.cat));
    const learnings=[...new Set(ts.flatMap(t=>t.learnings||[]))];
    return{tasks:ts,learnings};
  };

  const summary=()=>{
    const s=[];
    if(completed.length>=30)s.push("BerryBot programını neredeyse tamamlayan üstün başarılı bir öğrenci");
    else if(completed.length>=20)s.push("Robotik temellerini güçlü şekilde edinmiş ileri seviye öğrenci");
    else if(completed.length>=10)s.push("Robotik dünyasında hızla ilerleyen istekli bir öğrenci");
    else if(completed.length>=3)s.push("Robotik kariyerine güçlü bir başlangıç yapmış");
    else s.push("Robotik yolculuğunun başlangıcında");

    if(avgScore&&avgScore>=90)s.push("Görevleri hedef sürelerin çok altında tamamlayarak üstün performans gösteriyor");
    else if(avgScore&&avgScore>=80)s.push("Görevlerini etkin ve verimli şekilde tamamlıyor");

    const skillCount=Object.values(skillAreas).filter(a=>a.tasks.length>0).length;
    if(skillCount===3)s.push("Mekanik, yazılım ve elektronik alanlarının üçünde de yetkinlik kazanmış");
    else if(skillCount===2)s.push("İki ana mühendislik alanında deneyim sahibi");

    return s.join(". ")+".";
  };

  const verifyCode=`BB-${child.id.toUpperCase()}-${completed.length.toString().padStart(2,"0")}`;

  const handlePrint=()=>{window.print();};

  return(<div>
    {/* PRINT BUTTON */}
    <div style={{marginBottom:14,display:"flex",gap:8,flexWrap:"wrap"}}>
      <button onClick={handlePrint} style={{padding:"12px 20px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${T.cyan},${T.purple})`,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:`0 4px 14px ${T.cyan}55`,display:"inline-flex",alignItems:"center",gap:6}}>
        🖨️ PDF Olarak Yazdır
      </button>
      <div style={{padding:"10px 14px",borderRadius:10,background:T.card,border:`1px solid ${T.border}`,fontSize:12,color:T.ts,display:"flex",alignItems:"center",gap:6}}>
        💡 Yazdırma penceresinden "PDF Olarak Kaydet" seçeneğini işaretleyebilirsiniz
      </div>
    </div>

    {/* CV CARD — print-friendly */}
    <div className="cv-print" style={{
      background:"#fff",color:"#1a1a1a",
      padding:"40px 36px",borderRadius:16,
      maxWidth:840,margin:"0 auto",
      boxShadow:"0 12px 40px #0008",
      fontFamily:"'Segoe UI',system-ui,sans-serif",
    }}>
      {/* HEADER */}
      <div style={{borderBottom:"3px solid #6B3FA0",paddingBottom:20,marginBottom:24,display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
        <div style={{
          width:90,height:90,borderRadius:"50%",
          background:"linear-gradient(135deg,#6B3FA0,#FF8800)",
          color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:40,fontWeight:900,
          boxShadow:"0 4px 16px #0004",
        }}>{child.name[0]}</div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:14,color:"#666",fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>Robotik Eğitim Sertifikası</div>
          <h1 style={{fontSize:34,fontWeight:900,color:"#1a1a1a",margin:"4px 0",letterSpacing:.5}}>{child.name}</h1>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
            <span style={{padding:"3px 12px",borderRadius:6,background:"#f3e8ff",color:"#6B3FA0",fontSize:13,fontWeight:700}}>{lv.icon} Level {lv.lv} — {lv.name}</span>
            {avgScore!==null&&<span style={{padding:"3px 12px",borderRadius:6,background:"#ecfdf5",color:"#059669",fontSize:13,fontWeight:700}}>🎯 {avgScore}/100 Performans</span>}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#888",letterSpacing:1}}>BerryBot LMS</div>
          <div style={{fontSize:13,color:"#444",fontWeight:700,marginTop:2}}>{new Date().toLocaleDateString("tr-TR")}</div>
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{marginBottom:22}}>
        <h2 style={{fontSize:13,color:"#6B3FA0",letterSpacing:2,fontWeight:800,marginBottom:8,textTransform:"uppercase"}}>★ Özet</h2>
        <p style={{fontSize:14,color:"#333",lineHeight:1.7,margin:0}}>{summary()}</p>
      </div>

      {/* GENERAL STATS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:24}}>
        <div style={{padding:14,borderRadius:10,background:"#fef3c7",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#c2410c"}}>{completed.length}</div>
          <div style={{fontSize:11,color:"#92400e",fontWeight:700,letterSpacing:1}}>GÖREV</div>
        </div>
        <div style={{padding:14,borderRadius:10,background:"#fef3c7",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#c2410c"}}>{xp}</div>
          <div style={{fontSize:11,color:"#92400e",fontWeight:700,letterSpacing:1}}>XP</div>
        </div>
        <div style={{padding:14,borderRadius:10,background:"#dbeafe",textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#1e40af"}}>{fd(totalMs)}</div>
          <div style={{fontSize:11,color:"#1e3a8a",fontWeight:700,letterSpacing:1}}>SÜRE</div>
        </div>
        <div style={{padding:14,borderRadius:10,background:"#dcfce7",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#166534"}}>{Math.round(completed.length/36*100)}%</div>
          <div style={{fontSize:11,color:"#14532d",fontWeight:700,letterSpacing:1}}>İLERLEME</div>
        </div>
      </div>

      {/* ═══ 3 BECERI ALANI — KAPSAMLI ═══ */}
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:13,color:"#6B3FA0",letterSpacing:2,fontWeight:800,marginBottom:12,textTransform:"uppercase"}}>★ Mühendislik Yetkinlikleri</h2>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {Object.entries(skillAreas).map(([name,area])=>{
            const ts=area.tasks;
            const learnings=[...new Set(ts.flatMap(t=>t.learnings||[]))];
            const xpInArea=ts.reduce((a,t)=>a+t.xp,0);
            const hasContent=ts.length>0;
            return(<div key={name} style={{
              padding:16,borderRadius:10,
              background:hasContent?area.lightBg:"#f9fafb",
              border:`2px solid ${hasContent?area.color:"#e5e7eb"}`,
              opacity:hasContent?1:.55,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:hasContent?10:0,flexWrap:"wrap"}}>
                <div style={{fontSize:24}}>{name.split(" ")[0]}</div>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{fontSize:15,fontWeight:900,color:hasContent?area.color:"#6b7280"}}>
                    {name.replace(/^[\u{1F000}-\u{1FFFF}]\s*/u,"")}
                  </div>
                  <div style={{fontSize:11,color:"#666"}}>
                    {hasContent?`${ts.length} görev tamamlandı • ${xpInArea} XP`:"Bu alanda henüz görev yok"}
                  </div>
                </div>
              </div>

              {hasContent&&<>
                {/* Görevler etiket olarak */}
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:"#666",fontWeight:700,letterSpacing:1.5,marginBottom:5}}>TAMAMLANAN GÖREVLER:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {ts.map(t=>(
                      <span key={t.id} style={{
                        padding:"3px 9px",borderRadius:5,
                        background:"#fff",border:`1px solid ${area.color}55`,
                        fontSize:11,color:"#1a1a1a",fontWeight:600,
                      }}>{t.title}</span>
                    ))}
                  </div>
                </div>

                {/* Kazanımlar listesi */}
                {learnings.length>0&&<div>
                  <div style={{fontSize:10,color:"#666",fontWeight:700,letterSpacing:1.5,marginBottom:5}}>EDİNDİĞİ YETKİNLİKLER:</div>
                  <ul style={{margin:0,paddingLeft:18,fontSize:12,color:"#1a1a1a",lineHeight:1.7}}>
                    {learnings.map((lr,i)=>(<li key={i} style={{fontWeight:500}}>{lr}</li>))}
                  </ul>
                </div>}
              </>}
            </div>);
          })}
        </div>
      </div>

      {/* DIFFICULTY ANALYSIS */}
      <div style={{marginBottom:22}}>
        <h2 style={{fontSize:13,color:"#6B3FA0",letterSpacing:2,fontWeight:800,marginBottom:8,textTransform:"uppercase"}}>★ Zorluk Analizi</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:6}}>
          {[1,2,3,4,5].map(d=>{
            const tasksAtDiff=completed.filter(t=>t.diff===d);
            const labels={1:"Kolay",2:"Orta",3:"Zor",4:"Çok Zor",5:"Usta"};
            const colors={1:"#16a34a",2:"#2563eb",3:"#ea580c",4:"#dc2626",5:"#7c3aed"};
            return(<div key={d} style={{
              padding:10,borderRadius:8,
              background:tasksAtDiff.length>0?`${colors[d]}15`:"#f9fafb",
              border:`1px solid ${tasksAtDiff.length>0?colors[d]+"66":"#e5e7eb"}`,
              textAlign:"center",
              opacity:tasksAtDiff.length>0?1:.5,
            }}>
              <div style={{fontSize:11,color:"#666",fontWeight:700,letterSpacing:1}}>{labels[d]} {"★".repeat(d)}</div>
              <div style={{fontSize:18,fontWeight:900,color:tasksAtDiff.length>0?colors[d]:"#9ca3af"}}>{tasksAtDiff.length}</div>
            </div>);
          })}
        </div>
      </div>

      {/* FOOTER VERIFICATION */}
      <div style={{borderTop:"1px solid #e5e7eb",paddingTop:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:10,color:"#666",letterSpacing:1,fontWeight:700}}>DOĞRULAMA KODU</div>
          <div style={{fontSize:14,fontFamily:"monospace",fontWeight:800,color:"#1a1a1a"}}>{verifyCode}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#666",marginBottom:2}}>Bu sertifika RoboGPT BerryBot Akademisi tarafından düzenlenmiştir.</div>
          <div style={{fontSize:11,color:"#888"}}>🤖 BerryBot LMS — {new Date().getFullYear()}</div>
        </div>
      </div>
    </div>

    <style>{`
      @media print {
        body { background: white !important; }
        nav, .cv-print + *, header, button { display: none !important; }
        .cv-print { box-shadow: none !important; max-width: 100% !important; }
      }
    `}</style>
  </div>);
}
// ═══════════════════════════════════════════════════════════════
// PRACTICE VIEW — Quiz + Code Challenges
// ═══════════════════════════════════════════════════════════════
function PracticeView({user,practiceProg,onAnswer}){
  const[mode,setMode]=useState("home"); // home | quiz | code | results
  const[currentQ,setCurrentQ]=useState(null);
  const[selectedOpt,setSelectedOpt]=useState(null);
  const[showResult,setShowResult]=useState(false);
  const[startTime,setStartTime]=useState(null);

  // Stats
  const quizStats={total:QUIZ.length,correct:practiceProg.filter(p=>p.category==="quiz"&&p.correct>0).length};
  const codeStats={total:CODE_CHALLENGES.length,correct:practiceProg.filter(p=>p.category==="code"&&p.correct>0).length};
  const totalXP=practiceProg.reduce((a,p)=>a+(p.xp_earned||0),0);

  const startRandom=(category)=>{
    const pool=category==="quiz"?QUIZ:CODE_CHALLENGES;
    // Prefer questions never answered correctly
    const unsolved=pool.filter(q=>{
      const pp=practiceProg.find(p=>p.question_id===q.id);
      return !pp||pp.correct===0;
    });
    const target=unsolved.length>0?unsolved:pool;
    const q=target[Math.floor(Math.random()*target.length)];
    setCurrentQ({...q,category});
    setSelectedOpt(null);
    setShowResult(false);
    setStartTime(Date.now());
    setMode(category);
  };

  const submitAnswer=()=>{
    if(selectedOpt===null||!currentQ)return;
    const isCorrect=selectedOpt===currentQ.ans;
    setShowResult(true);
    onAnswer({
      questionId:currentQ.id,
      category:currentQ.category,
      topic:currentQ.topic,
      isCorrect,
      xp:currentQ.xp,
    });
  };

  const next=()=>{
    if(currentQ)startRandom(currentQ.category);
  };

  const goHome=()=>{setMode("home");setCurrentQ(null);setSelectedOpt(null);setShowResult(false);};

  // ═══ HOME SCREEN ═══
  if(mode==="home"){
    // Topic-wise stats
    const topics={};
    [...QUIZ,...CODE_CHALLENGES].forEach(q=>{
      if(!topics[q.topic])topics[q.topic]={total:0,solved:0,cat:QUIZ.includes(q)?"quiz":"code"};
      topics[q.topic].total++;
      const pp=practiceProg.find(p=>p.question_id===q.id);
      if(pp&&pp.correct>0)topics[q.topic].solved++;
    });

    return(<div>
      <style>{`
        @keyframes pv-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes pv-fade { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .pv-card{animation:pv-fade .5s ease-out backwards}
      `}</style>

      <div className="pv-card" style={{
        marginBottom:18,padding:24,borderRadius:20,
        background:`linear-gradient(135deg,${T.cyan}33,${T.purple}33,#1a0a3a)`,
        border:`3px solid ${T.cyan}66`,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{fontSize:48}}>🧠</div>
          <div style={{flex:1,minWidth:200}}>
            <h2 style={{margin:0,fontSize:26,color:T.cyan,fontWeight:900}}>Practice Bölümü</h2>
            <div style={{fontSize:14,color:T.ts,marginTop:4}}>Robotik konseptleri ve kod yazımı pratik et!</div>
          </div>
          <div style={{padding:"10px 18px",borderRadius:14,background:`${T.warn}22`,border:`2px solid ${T.warn}55`,textAlign:"center"}}>
            <div style={{fontSize:11,color:T.tm,fontWeight:700,letterSpacing:1}}>TOPLAM XP</div>
            <div style={{fontSize:24,fontWeight:900,color:T.warn}}>⚡ {totalXP}</div>
          </div>
        </div>
      </div>

      {/* TWO BIG MODE CARDS */}
      <div className="pv-card" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:18,animationDelay:".1s"}}>
        <div onClick={()=>startRandom("quiz")} style={{
          padding:22,borderRadius:18,cursor:"pointer",
          background:`linear-gradient(135deg,${T.orange}33,${T.warn}22,${T.card})`,
          border:`3px solid ${T.orange}66`,
          transition:"transform .2s",
        }} onMouseOver={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:60,height:60,borderRadius:14,background:`linear-gradient(135deg,${T.orange},${T.od})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:`0 6px 20px ${T.orange}66`}}>🤖</div>
            <div>
              <div style={{fontSize:20,fontWeight:900,color:T.orange}}>Robotik Quiz</div>
              <div style={{fontSize:13,color:T.ts}}>Çoktan seçmeli sorular</div>
            </div>
          </div>
          <div style={{fontSize:13,color:T.ts,marginBottom:10,lineHeight:1.5}}>RGB LED, Motor, Sensörler, IR Kumanda ve daha fazlası hakkında bilgini test et.</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <div style={{fontSize:14,color:T.warn,fontWeight:700}}>{quizStats.correct} / {quizStats.total} çözüldü</div>
            <button style={{padding:"10px 18px",borderRadius:10,border:"none",background:T.orange,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}}>▶ Başla</button>
          </div>
          <div style={{height:8,borderRadius:4,background:"#0008",marginTop:8,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:4,background:`linear-gradient(90deg,${T.orange},${T.warn})`,width:`${(quizStats.correct/quizStats.total)*100}%`,boxShadow:`0 0 8px ${T.orange}`}}/>
          </div>
        </div>

        <div onClick={()=>startRandom("code")} style={{
          padding:22,borderRadius:18,cursor:"pointer",
          background:`linear-gradient(135deg,${T.pl}33,${T.cyan}22,${T.card})`,
          border:`3px solid ${T.pl}66`,
          transition:"transform .2s",
        }} onMouseOver={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:60,height:60,borderRadius:14,background:`linear-gradient(135deg,${T.pl},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:`0 6px 20px ${T.pl}66`}}>💻</div>
            <div>
              <div style={{fontSize:20,fontWeight:900,color:T.pl}}>Kod Challenge</div>
              <div style={{fontSize:13,color:T.ts}}>Doğru kodu seç</div>
            </div>
          </div>
          <div style={{fontSize:13,color:T.ts,marginBottom:10,lineHeight:1.5}}>if/else, while, for, fonksiyon ve operatörlerle robot programlama mantığını öğren.</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <div style={{fontSize:14,color:T.cyan,fontWeight:700}}>{codeStats.correct} / {codeStats.total} çözüldü</div>
            <button style={{padding:"10px 18px",borderRadius:10,border:"none",background:T.pl,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}}>▶ Başla</button>
          </div>
          <div style={{height:8,borderRadius:4,background:"#0008",marginTop:8,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:4,background:`linear-gradient(90deg,${T.pl},${T.cyan})`,width:`${(codeStats.correct/codeStats.total)*100}%`,boxShadow:`0 0 8px ${T.pl}`}}/>
          </div>
        </div>
      </div>

      {/* TOPIC BREAKDOWN */}
      <div className="pv-card" style={{padding:18,borderRadius:18,background:T.card,border:`1px solid ${T.border}`,animationDelay:".2s"}}>
        <div style={{fontSize:12,color:T.tm,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>📊 Konu Bazlı İlerleme</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
          {Object.entries(topics).map(([t,s])=>{
            const pct=s.total>0?(s.solved/s.total)*100:0;
            const c=s.cat==="quiz"?T.orange:T.pl;
            return(<div key={t} style={{padding:"10px 12px",borderRadius:10,background:T.dark,border:`1px solid ${c}44`}}>
              <div style={{fontSize:13,fontWeight:700,color:c,marginBottom:4}}>{t}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1,height:6,borderRadius:3,background:"#0008",overflow:"hidden"}}>
                  <div style={{height:"100%",background:c,width:`${pct}%`,boxShadow:`0 0 4px ${c}`}}/>
                </div>
                <span style={{fontSize:11,color:T.ts,fontWeight:700}}>{s.solved}/{s.total}</span>
              </div>
            </div>);
          })}
        </div>
      </div>
    </div>);
  }

  // ═══ QUESTION SCREEN ═══
  const isQuiz=currentQ?.category==="quiz";
  const accentColor=isQuiz?T.orange:T.pl;

  return(<div>
    <style>{`
      @keyframes pv-correct { 0%{transform:scale(1)} 50%{transform:scale(1.1)} 100%{transform:scale(1)} }
      @keyframes pv-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
      @keyframes pv-pop { 0%{opacity:0;transform:scale(.9) translateY(20px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
      .pv-q{animation:pv-pop .4s cubic-bezier(.34,1.56,.64,1)}
    `}</style>

    <button onClick={goHome} style={{
      fontSize:14,padding:"8px 18px",borderRadius:10,
      background:`${accentColor}22`,color:accentColor,
      border:`2px solid ${accentColor}44`,cursor:"pointer",
      marginBottom:14,fontWeight:700,
    }}>← Practice'e Dön</button>

    <div className="pv-q" style={{
      padding:24,borderRadius:20,
      background:`linear-gradient(135deg,${accentColor}22,${T.card})`,
      border:`3px solid ${accentColor}66`,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:`${accentColor}33`,color:accentColor,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>
          {isQuiz?"🤖 Quiz":"💻 Kod"} • {currentQ.topic}
        </span>
        <span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:`${T.warn}22`,color:T.warn,fontWeight:800}}>⚡ {currentQ.xp} XP</span>
      </div>

      <div style={{fontSize:18,fontWeight:700,color:T.tp,marginBottom:18,lineHeight:1.5}}>
        {currentQ.q}
      </div>

      {/* Options */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {currentQ.opts.map((opt,i)=>{
          const selected=selectedOpt===i;
          const isCorrect=showResult&&i===currentQ.ans;
          const isWrong=showResult&&selected&&i!==currentQ.ans;
          return(<button key={i}
            onClick={()=>!showResult&&setSelectedOpt(i)}
            disabled={showResult}
            style={{
              padding:"14px 18px",borderRadius:12,
              border:`2px solid ${isCorrect?T.ok:isWrong?T.err:selected?accentColor:T.border}`,
              background:isCorrect?T.ok+"22":isWrong?T.err+"22":selected?accentColor+"22":T.dark,
              color:isCorrect?T.ok:isWrong?T.err:T.tp,
              cursor:showResult?"default":"pointer",
              textAlign:"left",fontSize:14,
              fontFamily:isQuiz?"inherit":"'JetBrains Mono','Courier New',monospace",
              whiteSpace:"pre-wrap",
              fontWeight:isQuiz?500:600,
              animation:isCorrect?"pv-correct .5s":isWrong?"pv-shake .4s":"none",
              transition:"all .2s",
            }}>
            <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:isCorrect?T.ok:isWrong?T.err:selected?accentColor:T.border,color:"#fff",marginRight:10,fontSize:13,fontWeight:900,verticalAlign:"middle"}}>{String.fromCharCode(65+i)}</span>
            {opt}
            {isCorrect&&<span style={{float:"right",fontSize:18}}>✓</span>}
            {isWrong&&<span style={{float:"right",fontSize:18}}>✗</span>}
          </button>);
        })}
      </div>

      {/* Action */}
      <div style={{marginTop:18,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        {!showResult?(
          <button onClick={submitAnswer} disabled={selectedOpt===null} style={{
            padding:"12px 28px",borderRadius:12,border:"none",
            background:selectedOpt===null?T.border:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,
            color:"#fff",fontSize:15,fontWeight:800,cursor:selectedOpt===null?"not-allowed":"pointer",
            boxShadow:selectedOpt!==null?`0 4px 14px ${accentColor}66`:"none",
          }}>✓ Cevabı Onayla</button>
        ):(<>
          <div style={{flex:1}}>
            {selectedOpt===currentQ.ans?(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:`${T.ok}22`,border:`1px solid ${T.ok}55`}}>
                <span style={{fontSize:24}}>🎉</span>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:T.ok}}>Doğru!</div>
                  <div style={{fontSize:12,color:T.ts}}>+{currentQ.xp} XP kazandın</div>
                </div>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:`${T.err}22`,border:`1px solid ${T.err}55`}}>
                <span style={{fontSize:24}}>💪</span>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:T.err}}>Yanlış</div>
                  <div style={{fontSize:12,color:T.ts}}>Tekrar dene, başaracaksın!</div>
                </div>
              </div>
            )}
          </div>
          <button onClick={next} style={{
            padding:"12px 28px",borderRadius:12,border:"none",
            background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,
            color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",
            boxShadow:`0 4px 14px ${accentColor}66`,
          }}>Sıradaki ▶</button>
        </>)}
      </div>
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// STUDENT HOMEWORK
// ═══════════════════════════════════════════════════════════════
function StudentHomework({user,homeworks,subs,onSubmit}){
  const[selHw,setSelHw]=useState(null);
  const[note,setNote]=useState("");
  const[photo,setPhoto]=useState(null);
  const[photoPrev,setPhotoPrev]=useState(null);

  // Filter homeworks for this student
  const myHw=homeworks.filter(h=>{
    if(h.target_type==="all")return true;
    if(h.target_type==="student")return h.target_value===user.id;
    if(h.target_type==="group")return h.target_value===user.grup;
    return false;
  });

  const getSub=(hwId)=>subs.find(s=>s.homework_id===hwId);

  const handlePhoto=(e)=>{
    const f=e.target.files?.[0];
    if(!f)return;
    const img=new Image();
    img.onload=()=>{
      const MAX=800;let w=img.width,h=img.height;
      if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
      const c=document.createElement('canvas');
      c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      const d=c.toDataURL('image/jpeg',0.6);
      setPhoto(d);setPhotoPrev(d);
      URL.revokeObjectURL(img.src);
    };
    img.src=URL.createObjectURL(f);
  };

  const handleSubmit=async()=>{
    if(!photo){alert("Lütfen fotoğraf yükleyin");return;}
    // Save to IndexedDB via savePhoto util — using same pattern as tasks
    if(window.indexedDB){
      const req=indexedDB.open("BerryPhotos",1);
      req.onupgradeneeded=e=>{e.target.result.createObjectStore("photos",{keyPath:"k"});};
      req.onsuccess=async e=>{
        const tx=e.target.result.transaction("photos","readwrite");
        tx.objectStore("photos").put({k:`hw_${user.id}_${selHw.id}`,d:photo});
      };
    }
    await onSubmit({homeworkId:selHw.id,photoFlag:"local",note});
    setSelHw(null);setPhoto(null);setPhotoPrev(null);setNote("");
  };

  if(selHw){
    const sub=getSub(selHw.id);
    return(<div>
      <button onClick={()=>setSelHw(null)} style={{fontSize:14,padding:"8px 18px",borderRadius:10,background:`${T.cyan}22`,color:T.cyan,border:`2px solid ${T.cyan}44`,cursor:"pointer",marginBottom:14,fontWeight:700}}>← Ödevlere Dön</button>

      <div style={{padding:24,borderRadius:20,background:`linear-gradient(135deg,${T.cyan}22,${T.card})`,border:`3px solid ${T.cyan}55`,marginBottom:14}}>
        <div style={{fontSize:11,color:T.cyan,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>📝 ÖDEV</div>
        <h2 style={{margin:"0 0 10px 0",fontSize:24,color:T.tp}}>{selHw.title}</h2>
        <div style={{fontSize:15,color:T.ts,lineHeight:1.6,marginBottom:14,whiteSpace:"pre-wrap"}}>{selHw.description}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={{padding:"4px 12px",borderRadius:8,background:`${T.warn}22`,color:T.warn,fontSize:12,fontWeight:700}}>⚡ {selHw.xp} XP</span>
          {selHw.due_at&&<span style={{padding:"4px 12px",borderRadius:8,background:`${T.err}22`,color:T.err,fontSize:12,fontWeight:700}}>⏰ Son Teslim: {new Date(selHw.due_at).toLocaleDateString("tr-TR")}</span>}
        </div>
      </div>

      {sub?(
        <div style={{padding:20,borderRadius:16,background:T.card,border:`2px solid ${sub.status==="approved"?T.ok:sub.status==="rejected"?T.err:T.pl}66`}}>
          <div style={{fontSize:11,color:T.tm,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>📤 GÖNDERİLDİ</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            {sub.status==="pending"&&<span style={{padding:"6px 14px",borderRadius:10,background:`${T.pl}33`,color:T.pl,fontWeight:800}}>⏳ Onay Bekleniyor</span>}
            {sub.status==="approved"&&<span style={{padding:"6px 14px",borderRadius:10,background:`${T.ok}33`,color:T.ok,fontWeight:800}}>✓ Onaylandı</span>}
            {sub.status==="rejected"&&<span style={{padding:"6px 14px",borderRadius:10,background:`${T.err}33`,color:T.err,fontWeight:800}}>↻ Reddedildi</span>}
            <span style={{fontSize:12,color:T.tm}}>{new Date(sub.submitted_at).toLocaleString("tr-TR")}</span>
          </div>
          {sub.note&&<div style={{padding:12,background:T.dark,borderRadius:10,marginBottom:10,fontSize:14,color:T.ts}}>📝 Notum: {sub.note}</div>}
          {sub.instructor_note&&<div style={{padding:12,background:`${T.warn}22`,border:`1px solid ${T.warn}44`,borderRadius:10,marginBottom:10,fontSize:14,color:T.tp,fontStyle:"italic"}}>💬 Eğitmen: "{sub.instructor_note}"</div>}
          {sub.status==="rejected"&&<button onClick={()=>{setNote(sub.note||"");setPhoto(null);setPhotoPrev(null);}} style={{padding:"10px 20px",borderRadius:10,border:"none",background:T.warn,color:"#fff",fontWeight:800,cursor:"pointer"}}>↻ Tekrar Gönder</button>}
        </div>
      ):(
        <div style={{padding:20,borderRadius:16,background:T.card,border:`2px solid ${T.cyan}55`}}>
          <div style={{fontSize:11,color:T.cyan,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>📸 ÖDEVİ TAMAMLA</div>
          {photoPrev&&<div style={{marginBottom:10,borderRadius:12,overflow:"hidden",border:`2px solid ${T.ok}55`}}><img src={photoPrev} style={{width:"100%",maxHeight:240,objectFit:"contain",background:T.dark,display:"block"}}/></div>}
          <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 20px",borderRadius:12,border:`2px dashed ${T.cyan}66`,background:`${T.cyan}10`,color:T.cyan,cursor:"pointer",fontWeight:700,fontSize:15,marginBottom:10}}>
            📷 Fotoğraf Yükle
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
          </label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Notun (isteğe bağlı)" rows={3} style={{width:"100%",padding:12,borderRadius:10,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,fontSize:14,marginBottom:10,resize:"vertical",boxSizing:"border-box"}}/>
          <button onClick={handleSubmit} disabled={!photo} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:!photo?T.border:`linear-gradient(135deg,${T.ok},#22a55a)`,color:"#fff",fontSize:16,fontWeight:900,cursor:!photo?"not-allowed":"pointer",boxShadow:photo?`0 4px 16px ${T.ok}55`:"none"}}>✓ Ödevi Gönder</button>
        </div>
      )}
    </div>);
  }

  return(<div>
    <div style={{padding:20,borderRadius:18,background:`linear-gradient(135deg,${T.cyan}33,${T.purple}33,#1a0a3a)`,border:`3px solid ${T.cyan}66`,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{fontSize:48}}>📝</div>
        <div style={{flex:1,minWidth:200}}>
          <h2 style={{margin:0,fontSize:24,color:T.cyan,fontWeight:900}}>Ödevlerim</h2>
          <div style={{fontSize:13,color:T.ts,marginTop:4}}>Eğitmenin verdiği özel ödevler</div>
        </div>
        <div style={{padding:"8px 14px",borderRadius:10,background:`${T.cyan}22`,fontSize:14,color:T.cyan,fontWeight:700}}>{myHw.length} ödev</div>
      </div>
    </div>

    {myHw.length===0?(
      <div style={{padding:40,textAlign:"center",borderRadius:16,background:T.card,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:48,marginBottom:8,opacity:.5}}>📭</div>
        <div style={{fontSize:15,color:T.ts}}>Henüz ödev verilmemiş.</div>
      </div>
    ):(
      <div style={{display:"grid",gap:10}}>
        {myHw.map(h=>{
          const sub=getSub(h.id);
          const overdue=h.due_at&&Date.now()>h.due_at&&!sub;
          return(<div key={h.id} onClick={()=>{setSelHw(h);setPhoto(null);setPhotoPrev(null);setNote("");}} style={{
            padding:16,borderRadius:14,cursor:"pointer",
            background:T.card,
            border:`2px solid ${sub?(sub.status==="approved"?T.ok:sub.status==="rejected"?T.err:T.pl):overdue?T.err:T.cyan}55`,
            transition:"transform .2s",
          }} onMouseOver={e=>e.currentTarget.style.transform="translateX(4px)"} onMouseOut={e=>e.currentTarget.style.transform="translateX(0)"}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{fontSize:16,fontWeight:800,color:T.tp,flex:1}}>{h.title}</span>
              {sub?.status==="pending"&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:`${T.pl}33`,color:T.pl,fontWeight:800}}>⏳ ONAYDA</span>}
              {sub?.status==="approved"&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:`${T.ok}33`,color:T.ok,fontWeight:800}}>✓ ONAYLANDI</span>}
              {sub?.status==="rejected"&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:`${T.err}33`,color:T.err,fontWeight:800}}>↻ TEKRAR</span>}
              {!sub&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:8,background:overdue?`${T.err}33`:`${T.cyan}33`,color:overdue?T.err:T.cyan,fontWeight:800}}>{overdue?"⏰ GECİKTİ":"📥 YENİ"}</span>}
              <span style={{fontSize:11,color:T.warn,fontWeight:700}}>⚡ {h.xp} XP</span>
            </div>
            <div style={{fontSize:13,color:T.ts,lineHeight:1.5,whiteSpace:"pre-wrap",overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{h.description}</div>
            {h.due_at&&<div style={{fontSize:11,color:T.tm,marginTop:6}}>⏰ Son: {new Date(h.due_at).toLocaleDateString("tr-TR")}</div>}
          </div>);
        })}
      </div>
    )}
  </div>);
}

// ═══════════════════════════════════════════════════════════════
// INSTRUCTOR HOMEWORK MANAGER
// ═══════════════════════════════════════════════════════════════
function InstructorHomework({user,users,homeworks,subs,onAdd,onDel,onReview}){
  const[creating,setCreating]=useState(false);
  const[viewSub,setViewSub]=useState(null);
  const[form,setForm]=useState({title:"",description:"",xp:50,dueAt:"",targetType:"all",targetValue:""});

  // All students from this instructor — fallback to all students if none assigned
  const allStudents=users.filter(u=>u.role==="student");
  const assignedStudents=allStudents.filter(u=>u.instructorId===user.id);
  const myStudents=assignedStudents.length>0?assignedStudents:allStudents;

  const submit=async()=>{
    if(!form.title.trim()||!form.description.trim()){alert("Başlık ve açıklama gerekli");return;}
    await onAdd({
      title:form.title,
      description:form.description,
      xp:parseInt(form.xp)||50,
      dueAt:form.dueAt?new Date(form.dueAt).getTime():null,
      targetType:form.targetType,
      targetValue:form.targetType==="all"?null:form.targetValue,
    });
    setForm({title:"",description:"",xp:50,dueAt:"",targetType:"all",targetValue:""});
    setCreating(false);
  };

  // View submissions for a homework
  if(viewSub){
    const hw=homeworks.find(h=>h.id===viewSub);
    if(!hw)return null;
    const hwSubs=subs.filter(s=>s.homework_id===viewSub);
    return(<div>
      <button onClick={()=>setViewSub(null)} style={{fontSize:14,padding:"8px 18px",borderRadius:10,background:`${T.cyan}22`,color:T.cyan,border:`2px solid ${T.cyan}44`,cursor:"pointer",marginBottom:14,fontWeight:700}}>← Ödevlere Dön</button>

      <div style={{padding:18,borderRadius:18,background:`${T.cyan}22`,border:`2px solid ${T.cyan}55`,marginBottom:14}}>
        <h3 style={{margin:0,fontSize:20,color:T.cyan}}>{hw.title}</h3>
        <div style={{fontSize:13,color:T.ts,marginTop:4}}>{hwSubs.length} öğrenci gönderdi</div>
      </div>

      {hwSubs.length===0?(
        <Card><div style={{padding:30,textAlign:"center",color:T.tm}}>Henüz teslim eden olmadı.</div></Card>
      ):(
        <div style={{display:"grid",gap:10}}>
          {hwSubs.map(s=>{
            const stu=users.find(u=>u.id===s.student_id);
            return(<HomeworkSubCard key={s.id} sub={s} student={stu} onReview={onReview}/>);
          })}
        </div>
      )}
    </div>);
  }

  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
      <h2 style={{margin:0,fontSize:22,color:T.cyan}}>📝 Ödev Yönetimi</h2>
      <button onClick={()=>setCreating(!creating)} style={{
        padding:"10px 20px",borderRadius:10,border:"none",
        background:creating?T.err:`linear-gradient(135deg,${T.cyan},${T.purple})`,
        color:"#fff",fontWeight:800,cursor:"pointer",fontSize:14,
        boxShadow:`0 4px 14px ${T.cyan}66`,
      }}>{creating?"✕ İptal":"+ Yeni Ödev"}</button>
    </div>

    {creating&&<Card style={{marginBottom:14,border:`2px solid ${T.cyan}66`}}>
      <div style={{fontSize:12,color:T.cyan,fontWeight:800,letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>📝 YENİ ÖDEV OLUŞTUR</div>
      <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ödev başlığı" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,fontSize:14,marginBottom:10,boxSizing:"border-box"}}/>
      <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Açıklama (öğrencilere talimat)" rows={4} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,fontSize:14,marginBottom:10,boxSizing:"border-box",resize:"vertical"}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:10}}>
        <div>
          <div style={{fontSize:11,color:T.tm,fontWeight:700,marginBottom:4}}>⚡ XP</div>
          <input type="number" value={form.xp} onChange={e=>setForm({...form,xp:e.target.value})} style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,boxSizing:"border-box"}}/>
        </div>
        <div>
          <div style={{fontSize:11,color:T.tm,fontWeight:700,marginBottom:4}}>⏰ SON TESLİM</div>
          <input type="date" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})} style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,boxSizing:"border-box"}}/>
        </div>
        <div>
          <div style={{fontSize:11,color:T.tm,fontWeight:700,marginBottom:4}}>🎯 HEDEF</div>
          <select value={form.targetType} onChange={e=>setForm({...form,targetType:e.target.value,targetValue:""})} style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,boxSizing:"border-box"}}>
            <option value="all">Tüm öğrenciler</option>
            <option value="student">Belirli öğrenci</option>
            <option value="group">Grup</option>
          </select>
        </div>
      </div>
      {form.targetType==="student"&&<select value={form.targetValue} onChange={e=>setForm({...form,targetValue:e.target.value})} style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,marginBottom:10,boxSizing:"border-box",fontSize:14}}>
        <option value="">— Öğrenci seç ({myStudents.length} öğrenci) —</option>
        {myStudents.slice().sort((a,b)=>a.name.localeCompare(b.name,"tr")).map(s=><option key={s.id} value={s.id}>{s.name}{s.grup?` (${s.grup})`:""}</option>)}
      </select>}
      {form.targetType==="group"&&<input value={form.targetValue} onChange={e=>setForm({...form,targetValue:e.target.value})} placeholder="Grup adı (örn: A grubu)" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,marginBottom:10,boxSizing:"border-box"}}/>}
      <button onClick={submit} style={{padding:"12px 28px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${T.ok},#22a55a)`,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:`0 4px 14px ${T.ok}55`}}>✓ Ödev Oluştur</button>
    </Card>}

    {homeworks.length===0?(
      <Card><div style={{padding:30,textAlign:"center",color:T.tm}}>Henüz ödev yok.</div></Card>
    ):(
      <div style={{display:"grid",gap:10}}>
        {homeworks.map(h=>{
          const hwSubs=subs.filter(s=>s.homework_id===h.id);
          const pending=hwSubs.filter(s=>s.status==="pending").length;
          return(<div key={h.id} style={{padding:14,borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontSize:16,fontWeight:800,color:T.tp}}>{h.title}</span>
                  {h.target_type==="all"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:T.purple+"33",color:T.pl}}>TÜM SINIF</span>}
                  {h.target_type==="student"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:T.cyan+"33",color:T.cyan}}>BİREYSEL</span>}
                  <span style={{fontSize:11,color:T.warn,fontWeight:700}}>⚡ {h.xp} XP</span>
                </div>
                <div style={{fontSize:12,color:T.ts,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{h.description}</div>
                <div style={{fontSize:11,color:T.tm}}>{new Date(h.created_at).toLocaleDateString("tr-TR")}{h.due_at&&` • Son: ${new Date(h.due_at).toLocaleDateString("tr-TR")}`}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                <button onClick={()=>setViewSub(h.id)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:T.cyan,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,whiteSpace:"nowrap"}}>{hwSubs.length} teslim {pending>0&&<span style={{background:T.warn,color:"#000",padding:"1px 6px",borderRadius:6,marginLeft:4,fontSize:11}}>{pending}</span>}</button>
                <button onClick={()=>{if(confirm("Ödevi silmek istediğinden emin misin?"))onDel(h.id);}} style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${T.err}55`,background:"transparent",color:T.err,cursor:"pointer",fontSize:11,fontWeight:700}}>✕ Sil</button>
              </div>
            </div>
          </div>);
        })}
      </div>
    )}
  </div>);
}

// ═══ Sub-component for reviewing a single homework submission ═══
function HomeworkSubCard({sub,student,onReview}){
  const[showImg,setShowImg]=useState(false);
  const[localImg,setLocalImg]=useState(null);
  const[note,setNote]=useState(sub.instructor_note||"");

  useEffect(()=>{
    if(sub.photo==="local"){
      // Try to load from IndexedDB (only works if this is the same device that submitted)
      const req=indexedDB.open("BerryPhotos",1);
      req.onsuccess=e=>{
        try{
          const tx=e.target.result.transaction("photos","readonly");
          const r=tx.objectStore("photos").get(`hw_${sub.student_id}_${sub.homework_id}`);
          r.onsuccess=()=>{if(r.result)setLocalImg(r.result.d);};
        }catch(_){}
      };
    }
  },[sub]);

  return(<div style={{padding:14,borderRadius:12,background:T.card,border:`2px solid ${sub.status==="approved"?T.ok:sub.status==="rejected"?T.err:T.pl}55`}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:T.orange+"22",color:T.orange,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,border:`1px solid ${T.orange}44`}}>{student?.name?.[0]||"?"}</div>
      <div style={{flex:1,minWidth:120}}>
        <div style={{fontSize:14,fontWeight:700}}>{student?.name||"?"}</div>
        <div style={{fontSize:11,color:T.tm}}>{new Date(sub.submitted_at).toLocaleString("tr-TR")}</div>
      </div>
      {sub.status==="pending"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:T.pl+"33",color:T.pl,fontWeight:800}}>⏳ ONAYDA</span>}
      {sub.status==="approved"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:T.ok+"33",color:T.ok,fontWeight:800}}>✓</span>}
      {sub.status==="rejected"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:T.err+"33",color:T.err,fontWeight:800}}>↻</span>}
    </div>
    {sub.note&&<div style={{padding:8,background:T.dark,borderRadius:8,fontSize:13,color:T.ts,marginBottom:8}}>📝 {sub.note}</div>}
    {localImg?(
      <img src={localImg} onClick={()=>setShowImg(true)} style={{maxWidth:"100%",maxHeight:200,objectFit:"contain",borderRadius:10,cursor:"zoom-in",background:T.dark,marginBottom:8}}/>
    ):sub.photo==="local"&&(
      <div style={{padding:10,background:T.dark,borderRadius:8,fontSize:12,color:T.tm,fontStyle:"italic",marginBottom:8}}>📸 Fotoğraf öğrencinin cihazında kayıtlı (bu cihazdan görüntülenemez)</div>
    )}
    {showImg&&localImg&&<div onClick={()=>setShowImg(false)} style={{position:"fixed",inset:0,zIndex:100,background:"#000e",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}><img src={localImg} style={{maxWidth:"95vw",maxHeight:"95vh",objectFit:"contain"}}/></div>}
    {sub.instructor_note&&sub.status!=="pending"&&<div style={{padding:8,background:T.warn+"22",borderRadius:8,fontSize:13,color:T.tp,fontStyle:"italic",marginBottom:8}}>💬 {sub.instructor_note}</div>}
    {sub.status==="pending"&&<>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Geri bildirim (isteğe bağlı)" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.dark,color:T.tp,fontSize:13,marginBottom:8,boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onReview({submissionId:sub.id,status:"approved",instructorNote:note})} style={{flex:1,padding:"8px 14px",borderRadius:8,border:"none",background:T.ok,color:"#fff",fontWeight:700,cursor:"pointer"}}>✓ Onayla</button>
        <button onClick={()=>onReview({submissionId:sub.id,status:"rejected",instructorNote:note||"Tekrar gönder"})} style={{flex:1,padding:"8px 14px",borderRadius:8,border:"none",background:T.err,color:"#fff",fontWeight:700,cursor:"pointer"}}>✗ Reddet</button>
      </div>
    </>}
  </div>);
}