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
  {id:1,title:"RGB LED Yakma",cat:"RGB LED",diff:1,xp:10,img:"💡",desc:"Kırmızı, Yeşil, Mavi LED'leri ayrı ayrı yak.",answer:"Doğru blok: set_rgb(255,0,0)",learnings:["RGB renk sistemi","Pin çıkışı kontrolü","Temel blok kod yazımı"]},
  {id:2,title:"LED Renk Karışımı",cat:"RGB LED",diff:1,xp:10,img:"🌈",desc:"İki rengi karıştırarak yeni renk elde et.",answer:"set_rgb(255,255,0) → sarı",learnings:["Renk karışımı (additive)","RGB değer kombinasyonları","Yaratıcı düşünme"]},
  {id:3,title:"LED Yanıp Sönme",cat:"RGB LED",diff:2,xp:15,img:"✨",desc:"LED'i 1 saniye aralıkla yanıp söndür.",answer:"while true: set_rgb → wait(1) → off → wait(1)",learnings:["Sonsuz döngü kavramı","Zamanlama (delay)","Durum değişimi"]},
  {id:4,title:"Gökkuşağı Efekti",cat:"RGB LED",diff:2,xp:15,img:"🌈",desc:"Sırayla 7 rengi göster.",answer:"7 renk döngüsü",learnings:["Sıralı işlem","Renk geçişleri","Animasyon mantığı"]},
  {id:5,title:"SOS Sinyali",cat:"RGB LED",diff:3,xp:20,img:"🆘",desc:"Mors koduyla SOS sinyali gönder.",answer:"3 kısa, 3 uzun, 3 kısa",learnings:["Mors kodu","Desen tekrarı","Zamanlama hassasiyeti","İletişim sistemleri"]},
  {id:6,title:"Nefes Alan LED",cat:"RGB LED",diff:3,xp:20,img:"💫",desc:"LED parlaklığını yavaşça artır azalt.",answer:"for loop ile PWM",learnings:["PWM (Pulse Width Modulation)","Yumuşak geçiş","Sayaç döngüleri"]},
  {id:7,title:"Motor İleri Geri",cat:"Motor",diff:2,xp:15,img:"⚙️",desc:"Motoru ileri ve geri hareket ettir.",answer:"motor.forward() / motor.backward()",learnings:["DC motor kontrolü","Yön belirleme","Hareketin temel komutları"]},
  {id:8,title:"Hız Kontrolü",cat:"Motor",diff:2,xp:15,img:"🏎️",desc:"Motor hızını kademeli artır.",answer:"speed değişkeni ile PWM",learnings:["Değişken kullanımı","Kademeli kontrol","PWM ile hız ayarı"]},
  {id:9,title:"Kare Çizme",cat:"Motor",diff:3,xp:25,img:"◻️",desc:"Robotla kare şekli çiz.",answer:"4x ileri+90° dönüş",learnings:["Geometri (kare)","Döngü ile tekrar","Açı kavramı (90°)","Adım adım planlama"]},
  {id:10,title:"Buzzer Melodisi",cat:"Sensör+LED+Buzzer",diff:1,xp:10,img:"🔔",desc:"Buzzer ile basit melodi çal.",answer:"tone(freq, dur)",learnings:["Frekans ve ses","Müzik notası mantığı","Süre kontrolü"]},
  {id:11,title:"Işık Sensörü Okuma",cat:"Sensör+LED+Buzzer",diff:2,xp:15,img:"☀️",desc:"Işık sensöründen değer oku ve göster.",answer:"light = ldr.read()",learnings:["Sensör verisi okuma","Analog değerler","LDR çalışma prensibi"]},
  {id:12,title:"Sıcaklık Alarmı",cat:"Sensör+LED+Buzzer",diff:2,xp:15,img:"🌡️",desc:"Sıcaklık eşik değeri geçince alarm ver.",answer:"if temp > 30: buzzer.on()",learnings:["Koşullu ifadeler (if)","Eşik değer","Sensör + aktüatör birleştirme"]},
  {id:13,title:"Işık Takip Başlangıç",cat:"Işık Sensörü",diff:2,xp:15,img:"🔦",desc:"Işık kaynağına doğru dön.",answer:"LDR farkına göre motor yönlendir",learnings:["İki sensör karşılaştırma","Yönlendirme algoritması","Tepkisel davranış"]},
  {id:14,title:"Işık Yoğunluk Haritası",cat:"Işık Sensörü",diff:3,xp:20,img:"🗺️",desc:"Ortamdaki ışık dağılımını LED ile göster.",answer:"LDR oku → RGB map",learnings:["Veri görselleştirme","Aralık eşleştirme (map)","Çoklu sensör"]},
  {id:15,title:"IR Kumanda Okuma",cat:"IR Kumanda",diff:2,xp:15,img:"📡",desc:"IR kumandadan sinyal al ve göster.",answer:"ir.read() → serial",learnings:["Kızılötesi iletişim","Tuş kodları","Seri port debug"]},
  {id:16,title:"Kumanda ile LED",cat:"IR Kumanda",diff:2,xp:15,img:"🎮",desc:"Kumanda tuşlarıyla LED rengini değiştir.",answer:"if key==1: red, key==2: green",learnings:["Çoklu koşul (if/elif)","Kullanıcı girdisi","Etkileşimli sistem"]},
  {id:17,title:"Kumanda ile Motor",cat:"IR Kumanda",diff:3,xp:25,img:"🕹️",desc:"Kumandayla robotu yönlendir.",answer:"key mapping → motor direction",learnings:["Uzaktan kumanda mantığı","Tuş eşleme","Gerçek zamanlı kontrol"]},
  {id:18,title:"Fonksiyon Tanımlama",cat:"Fonksiyon",diff:2,xp:15,img:"📦",desc:"Tekrarlayan işlemi fonksiyon yap.",answer:"def my_func(): ...",learnings:["Fonksiyon kavramı","Kod tekrarını önleme","Modüler programlama"]},
  {id:19,title:"Mesafe Ölçme",cat:"Mesafe/Navigasyon",diff:2,xp:15,img:"📏",desc:"Ultrasonik sensörle mesafe ölç.",answer:"dist = ultrasonic.read()",learnings:["Ultrasonik dalgalar","Mesafe hesaplama","Birim dönüşümleri (cm)"]},
  {id:20,title:"Otonom Navigasyon",cat:"Mesafe/Navigasyon",diff:4,xp:30,img:"🧭",desc:"Engellere çarpmadan ilerle.",answer:"if dist < 20: turn()",learnings:["Otonom karar verme","Sensör entegrasyonu","Reaktif robotik","Güvenlik mesafesi"]},
  {id:21,title:"Engel Algılama",cat:"Engel Algılama",diff:3,xp:20,img:"🚧",desc:"Önündeki engeli tespit et ve dur.",answer:"while dist > 15: forward()",learnings:["While döngüsü","Sürekli kontrol","Acil durdurma"]},
  {id:22,title:"Engelden Kaçınma",cat:"Engel Algılama",diff:4,xp:30,img:"🔀",desc:"Engel varsa etrafından dolaş.",answer:"detect → turn → check → forward",learnings:["Çok adımlı strateji","Algılama-eylem döngüsü","Problem çözme"]},
  {id:23,title:"Çizgi Algılama",cat:"Çizgi Takip",diff:2,xp:15,img:"➖",desc:"Siyah çizgiyi sensörle algıla.",answer:"line = ir_sensor.read()",learnings:["Yansıma sensörleri","Siyah/beyaz ayrımı","İkili veri (binary)"]},
  {id:24,title:"Çizgi Takip Basit",cat:"Çizgi Takip",diff:3,xp:25,img:"〰️",desc:"Basit çizgi takip robotu yap.",answer:"if left: turn_right, if right: turn_left",learnings:["Bang-bang kontrol","Çizgi takip algoritması","Sensör konumlandırma"]},
  {id:25,title:"Kesişim Yönetimi",cat:"Çizgi Takip",diff:4,xp:30,img:"✖️",desc:"Çizgi kesişimlerinde doğru karar ver.",answer:"count intersections → decide",learnings:["Sayaç değişkeni","Karar mekanizması","Harita mantığı"]},
  {id:26,title:"Hızlı Çizgi Takip",cat:"Çizgi Takip",diff:5,xp:40,img:"⚡",desc:"PID kontrolle hızlı çizgi takip.",answer:"PID: error*Kp + integral*Ki + derivative*Kd",learnings:["PID kontrol algoritması","Hata düzeltme","İleri matematik kullanımı","Optimizasyon"]},
  {id:27,title:"Sumo Duruş",cat:"Sumo Robot",diff:2,xp:15,img:"🤼",desc:"Ring içinde kal, dışarı çıkma.",answer:"if edge: backward + turn",learnings:["Sınır algılama","Savunma davranışı","Acil tepki"]},
  {id:28,title:"Rakip Bulma",cat:"Sumo Robot",diff:3,xp:25,img:"🔍",desc:"Ultrasonik ile rakibi bul.",answer:"scan 360° → closest target",learnings:["Tarama (scanning)","Hedef takibi","Mesafe karşılaştırma"]},
  {id:29,title:"Sumo Saldırı",cat:"Sumo Robot",diff:3,xp:25,img:"💥",desc:"Rakibi bul ve it.",answer:"detect → full speed forward",learnings:["Hedef kilitleme","Maksimum güç kullanımı","Rekabetçi strateji"]},
  {id:30,title:"Sumo Strateji",cat:"Sumo Robot",diff:4,xp:35,img:"🧠",desc:"Savunma ve saldırı stratejisi.",answer:"state machine: search/attack/defend",learnings:["Durum makinesi","Stratejik düşünme","Çoklu mod yönetimi","Yapay zeka temelleri"]},
  {id:31,title:"Mini Sumo Turnuva",cat:"Sumo Robot",diff:4,xp:35,img:"🏆",desc:"Turnuva kurallarına uygun sumo robotu.",answer:"combine all sumo skills",learnings:["Kural odaklı tasarım","Tüm becerileri birleştirme","Rekabet hazırlığı"]},
  {id:32,title:"Sumo Şampiyonu",cat:"Sumo Robot",diff:5,xp:50,img:"👑",desc:"En iyi sumo stratejisini geliştir.",answer:"adaptive strategy",learnings:["Adaptif algoritma","Rakip analizi","Yapay zeka davranışı","İleri robotik"]},
  {id:33,title:"Işık Kaynağı Bulma",cat:"Işık Takip",diff:3,xp:20,img:"💡",desc:"En parlak ışık kaynağına git.",answer:"compare LDRs → move toward max",learnings:["Maksimum bulma","Gradyan takibi","Çoklu sensör birleşimi"]},
  {id:34,title:"Işıktan Kaçınma",cat:"Işık Takip",diff:3,xp:20,img:"🌑",desc:"Karanlık bölgeye git.",answer:"move toward min light",learnings:["Minimum bulma","Negatif fototaksis","Davranış değiştirme"]},
  {id:35,title:"Işık Labirenti",cat:"Işık Takip",diff:4,xp:35,img:"🌟",desc:"Işık ipuçlarıyla labirentten çık.",answer:"follow light gradient",learnings:["Labirent çözme","İpucu takibi","Karmaşık navigasyon"]},
  {id:36,title:"Final Projesi",cat:"Işık Takip",diff:5,xp:50,img:"🎓",desc:"Tüm becerileri birleştiren proje.",answer:"combined autonomous robot",learnings:["Sistem entegrasyonu","Proje tasarımı","Sunum becerileri","Otonom robot"]},
];

// ─── LEVELS ───
const LEVELS=[{lv:1,name:"Çaylak",min:0,icon:"🥚"},{lv:2,name:"Başlangıç",min:30,icon:"🐣"},{lv:3,name:"Keşifçi",min:80,icon:"🔍"},{lv:4,name:"Geliştirici",min:150,icon:"🔧"},{lv:5,name:"Mühendis",min:250,icon:"⚙️"},{lv:6,name:"Uzman",min:370,icon:"🏅"},{lv:7,name:"Usta",min:500,icon:"🎖️"},{lv:8,name:"Profesör",min:640,icon:"🎓"},{lv:9,name:"Efsane",min:770,icon:"🌟"},{lv:10,name:"BerryBot Master",min:900,icon:"👑"}];
const getLevel=(xp)=>{let l=LEVELS[0];for(const lv of LEVELS)if(xp>=lv.min)l=lv;return l;};
const getNextLevel=(xp)=>{const cur=getLevel(xp);const idx=LEVELS.indexOf(cur);return idx<LEVELS.length-1?LEVELS[idx+1]:null;};

// ─── FORMAT HELPERS ───
const ft=(ts)=>ts?new Date(ts).toLocaleString("tr-TR",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"}):"—";
const fd=(ms)=>{const m=Math.floor(ms/60000);return m<60?`${m}dk`:`${Math.floor(m/60)}sa ${m%60}dk`;};

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
    login: doLogin, logout, addUser, startTask, submitTask, approveTask,
    rejectTask, resubmitTask, requestHelp, clearHelp, saveLayout, setProgressTo, setCurrentPage, refresh } = data;

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
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <nav style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:T.orange,display:"flex",alignItems:"center",gap:6}}><I.Bot/><b style={{fontSize:22}}>BerryBot</b></span><span style={{fontSize:12,background:T.purple,color:"#fff",padding:"3px 10px",borderRadius:6,fontWeight:700}}>LMS</span></div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {user.role===ROLES.ADMIN&&<><NBtn a={page==="dash"} o={()=>nav("dash")}>Sınıf Düzeni</NBtn><NBtn a={page==="users"} o={()=>nav("users")}>Kullanıcılar</NBtn><NBtn a={page==="audit"} o={()=>nav("audit")}>Audit Log</NBtn><NBtn a={page==="tasks"} o={()=>nav("tasks")}>Görevler</NBtn></>}
          {user.role===ROLES.INSTRUCTOR&&<><NBtn a={page==="dash"} o={()=>nav("dash")}>Panel</NBtn><NBtn a={page==="pend"} o={()=>nav("pend")}>Onay Bekleyenler</NBtn><NBtn a={page==="show"} o={()=>nav("show")}>📊 Günlük Show</NBtn><NBtn a={page==="tasks"} o={()=>nav("tasks")}>Görev+Cevap</NBtn></>}
          {user.role===ROLES.STUDENT&&<NBtn a={page==="dash"} o={()=>nav("dash")}>Görevlerim</NBtn>}
          {user.role===ROLES.PARENT&&<><NBtn a={page==="dash"} o={()=>nav("dash")}>👨‍👩‍👧 Çocuğum</NBtn><NBtn a={page==="cv"} o={()=>nav("cv")}>📜 CV Çıkar</NBtn></>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {user.role===ROLES.STUDENT&&<span style={{fontSize:15,padding:"5px 14px",borderRadius:8,background:T.orange+"22",color:T.ol,fontWeight:700}}>{getLevel(getXP(user.id)).icon} Lv.{getLevel(getXP(user.id)).lv} • {getXP(user.id)} XP</span>}
          <span style={{fontSize:15,color:T.ts,fontWeight:500}}>{user.name}</span>
          <button onClick={()=>{logout();nav("dash");}} style={{background:"none",border:`1px solid ${T.err}44`,borderRadius:8,cursor:"pointer",color:T.err,padding:"4px 12px",fontSize:13,fontWeight:600}}>Çıkış</button>
        </div>
      </nav>
      {notif&&<div style={{position:"fixed",top:16,right:16,zIndex:99,padding:"12px 20px",borderRadius:12,fontSize:16,fontWeight:600,background:notif.t==="err"?"#5c1a1a":"#1a4a2e",color:notif.t==="err"?"#fca5a5":"#86efac",boxShadow:"0 8px 30px #0006"}}>{notif.m}</div>}
      <main style={{padding:16,maxWidth:1200,margin:"0 auto"}}>

        {/* ──── ADMIN ──── */}
        {user.role===ROLES.ADMIN&&page==="dash"&&<AdminClassroom users={users} prog={prog} classLayout={classLayout} saveLayout={handleSaveLayout} onClearHelp={handleClearHelp} onSel={s=>{setSelS(s);setPage("sd");}}/>}
        {user.role===ROLES.ADMIN&&page==="sd"&&selS&&<StudentDetail s={selS} prog={prog} users={users} onBack={()=>nav("dash")}/>}
        {user.role===ROLES.ADMIN&&page==="users"&&<UserManager users={users} prog={prog} onAddUser={addUser} onSetProgress={setProgressTo}/>}
        {user.role===ROLES.ADMIN&&page==="audit"&&<AuditLog logs={logs} users={users}/>}
        {user.role===ROLES.ADMIN&&page==="tasks"&&<TaskBrowser showAns={false}/>}

        {/* ──── INSTRUCTOR ──── */}
        {user.role===ROLES.INSTRUCTOR&&page==="dash"&&<InstructorDash user={user} users={users} prog={prog} onClearHelp={handleClearHelp} onSel={s=>{setSelS(s);setPage("sdi");}}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="sdi"&&selS&&<StudentDetail s={selS} prog={prog} users={users} canReview onApprove={handleApprove} onReject={handleReject} onBack={()=>nav("dash")}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="pend"&&<PendingReviews user={user} users={users} prog={prog} onApprove={handleApprove} onReject={handleReject}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="show"&&<DailyShow users={users} prog={prog} logs={logs} onSel={s=>{setSelS(s);setPage("sdi");}}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="tasks"&&<TaskBrowser showAns/>}

        {/* ──── STUDENT ──── */}
        {user.role===ROLES.STUDENT&&!selT&&<MissionBoard user={user} prog={prog} onSel={setSelT} onHelp={()=>handleHelp(user.id)}/>}
        {user.role===ROLES.STUDENT&&selT&&<StudentTaskView user={user} task={selT} prog={prog} onStart={()=>handleStartTask(user.id,selT.id)} onSubmit={p=>handleSubmitTask(user.id,selT.id,p)} onResub={()=>handleResubmit(user.id,selT.id)} onHelp={()=>handleHelp(user.id)} onBack={()=>setSelT(null)}/>}

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
      width:"100%",maxWidth:980,
      maxHeight:"100%",
      display:"flex",alignItems:"center",justifyContent:"center",
      gap:32,flexWrap:"wrap",
      position:"relative",zIndex:2,
    }}>

      {/* LEFT COLUMN — 3D Robot + Title */}
      <div style={{
        flex:"1 1 380px",maxWidth:480,minWidth:280,
        display:"flex",flexDirection:"column",alignItems:"center",
      }}>
        {/* 3D BerryBot — non-interactive, auto rotates */}
        <div style={{
          width:"100%",position:"relative",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <div style={{
            position:"absolute",bottom:10,left:"50%",
            transform:"translateX(-50%)",
            height:14,borderRadius:"50%",
            background:`radial-gradient(ellipse,${T.purple}aa,transparent 70%)`,
            animation:"shadow-pulse 4s infinite ease-in-out",
            filter:"blur(6px)",
            zIndex:1,
          }}/>
          <div style={{position:"relative",zIndex:2,width:"100%"}}>
            <BerryBot3D height={280} autoRotate={true} background="transparent" interactive={false}/>
          </div>
        </div>

        {/* Title */}
        <div style={{textAlign:"center",marginTop:-8}}>
          <div style={{
            fontSize:46,fontWeight:900,lineHeight:1,
            background:`linear-gradient(135deg,${T.orange},${T.pl})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            letterSpacing:1,
          }}>BerryBot</div>
          <div style={{fontSize:13,color:T.ts,marginTop:6,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Robotik Görev Akademisi</div>
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
            flexWrap:"wrap",
          }}>
            {/* Robotistan */}
            <div style={{
              display:"flex",flexDirection:"column",alignItems:"center",gap:6,
              animation:"logo-float 3s infinite ease-in-out",
            }}>
              <div style={{
                height:56,width:120,
                background:"#fff",borderRadius:10,padding:8,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 4px 12px #00000055",
              }}>
                <img src="/logos/robotistan.png" alt="Robotistan" style={{maxHeight:"100%",maxWidth:"100%",objectFit:"contain"}}/>
              </div>
            </div>

            {/* RoboGPT */}
            <div style={{
              display:"flex",flexDirection:"column",alignItems:"center",gap:6,
              animation:"logo-float 3s infinite ease-in-out .4s",
            }}>
              <div style={{
                height:56,width:120,
                background:"#fff",borderRadius:10,padding:8,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 4px 12px #00000055",
              }}>
                <img src="/logos/robogpt.png" alt="RoboGPT" style={{maxHeight:"100%",maxWidth:"100%",objectFit:"contain"}}/>
              </div>
            </div>

            {/* PicoBricks */}
            <div style={{
              display:"flex",flexDirection:"column",alignItems:"center",gap:6,
              animation:"logo-float 3s infinite ease-in-out .8s",
            }}>
              <div style={{
                height:56,width:120,
                background:"#fff",borderRadius:10,padding:8,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 4px 12px #00000055",
              }}>
                <img src="/logos/picobricks.png" alt="PicoBricks" style={{maxHeight:"100%",maxWidth:"100%",objectFit:"contain"}}/>
              </div>
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
function MissionBoard({user,prog,onSel,onHelp}){
  const sp=prog[user.id]||{};
  const xp=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED).reduce((a,t)=>a+t.xp,0);
  const lv=getLevel(xp);const nlv=getNextLevel(xp);
  const cnt=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED).length;
  const cats=[...new Set(TASKS.map(t=>t.cat))];
  const lvProgress=nlv?((xp-lv.min)/(nlv.min-lv.min))*100:100;
  const hasHelp=prog[user.id]?.helpRequest;

  // Category color palette
  const catColors={
    "RGB LED":"#ff6b9d","Motor":"#fbbf24","Sensör+LED+Buzzer":"#22d3ee",
    "Işık Sensörü":"#fde047","IR Kumanda":"#a78bfa","Fonksiyon":"#f472b6",
    "Mesafe/Navigasyon":"#34d399","Engel Algılama":"#fb7185","Çizgi Takip":"#60a5fa",
    "Sumo Robot":"#f87171","Işık Takip":"#facc15"
  };

  return(<div style={{position:"relative"}}>
    {/* Inject animations */}
    <style>{`
      @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      @keyframes glow { 0%,100%{box-shadow:0 0 12px ${T.orange}99,0 0 24px ${T.orange}55} 50%{box-shadow:0 0 24px ${T.orange}cc,0 0 48px ${T.orange}88} }
      @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes shine { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      @keyframes bounce { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-4px) scale(1.05)} }
      @keyframes confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(-40px) rotate(360deg);opacity:0} }
      @keyframes shimmer { 0%{background-position:-1000px 0} 100%{background-position:1000px 0} }
      @keyframes popin { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      @keyframes path-draw { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
      @keyframes stars-twinkle { 0%,100%{opacity:.4} 50%{opacity:1} }
      @keyframes ring-pulse { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.6);opacity:0} }
      .mission-node:hover { transform: translateY(-4px) scale(1.04); transition: all .3s; }
      .mission-locked:hover { transform: none; }
      .star-bg { position:absolute; pointer-events:none; animation:stars-twinkle 3s infinite; }
    `}</style>

    {/* Decorative star background */}
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {[...Array(20)].map((_,i)=>(
        <div key={i} className="star-bg" style={{
          left:`${(i*7)%100}%`,top:`${(i*13)%100}%`,
          fontSize:`${8+(i%3)*4}px`,
          animationDelay:`${(i*0.2)%3}s`,
          color:i%3===0?T.orange:i%3===1?T.pl:T.cyan,
        }}>✦</div>
      ))}
    </div>

    {/* ═══ HERO LEVEL CARD — Premium ═══ */}
    <div style={{
      position:"relative",zIndex:1,
      marginBottom:24,
      borderRadius:20,
      padding:24,
      background:`linear-gradient(135deg,${T.purple}66,${T.orange}33,#1a0a3a)`,
      border:`2px solid ${T.orange}66`,
      boxShadow:`0 8px 40px ${T.purple}55,inset 0 1px 0 #ffffff22`,
      overflow:"hidden",
    }}>
      {/* Shimmer overlay */}
      <div style={{
        position:"absolute",inset:0,pointerEvents:"none",
        background:`linear-gradient(90deg,transparent 30%,${T.orange}22 50%,transparent 70%)`,
        backgroundSize:"200% 100%",
        animation:"shimmer 4s infinite linear",
      }}/>

      <div style={{position:"relative",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        {/* Animated avatar */}
        <div style={{position:"relative"}}>
          <div style={{
            position:"absolute",inset:-8,borderRadius:"50%",
            border:`3px solid ${T.orange}88`,
            animation:"ring-pulse 2s infinite",
          }}/>
          <div style={{
            width:88,height:88,borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:44,
            background:`radial-gradient(circle,${T.orange}55,${T.purple}77)`,
            border:`4px solid ${T.orange}`,
            boxShadow:`0 0 20px ${T.orange}88,inset 0 0 20px ${T.orange}33`,
            animation:"float 3s ease-in-out infinite",
          }}>{lv.icon}</div>
        </div>

        <div style={{flex:1,minWidth:240}}>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:2}}>
            <span style={{fontSize:13,color:T.tm,letterSpacing:2,fontWeight:700,textTransform:"uppercase"}}>Level</span>
            <span style={{fontSize:36,fontWeight:900,color:T.orange,textShadow:`0 0 20px ${T.orange}66`,letterSpacing:1}}>{lv.lv}</span>
            <span style={{fontSize:18,fontWeight:700,color:T.pl,marginLeft:4}}>{lv.name}</span>
          </div>
          <div style={{fontSize:14,color:T.ol,fontWeight:600,marginBottom:8}}>
            ⚡ <b style={{fontSize:18,color:T.warn}}>{xp}</b> XP {nlv&&<span style={{color:T.tm}}>→ {nlv.icon} {nlv.name} <b style={{color:T.ol}}>{nlv.min} XP</b></span>}
          </div>
          {/* XP Bar with shine */}
          <div style={{position:"relative",width:"100%",height:14,borderRadius:7,background:"#0008",overflow:"hidden",border:`1px solid ${T.border}`}}>
            <div style={{
              height:"100%",borderRadius:7,
              background:`linear-gradient(90deg,${T.warn},${T.orange},${T.pl})`,
              backgroundSize:"200% 100%",
              animation:"shine 2s infinite linear",
              width:`${lvProgress}%`,
              transition:"width .6s ease",
              boxShadow:`0 0 10px ${T.orange}88`,
            }}/>
            {nlv&&<div style={{position:"absolute",top:0,right:0,bottom:0,width:1,background:T.tp,opacity:.3}}/>}
          </div>
        </div>

        {/* Progress counter — trophy */}
        <div style={{textAlign:"center",position:"relative"}}>
          <div style={{
            width:80,height:80,borderRadius:"50%",
            background:`conic-gradient(${T.ok} ${(cnt/36)*360}deg,${T.border} 0deg)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            position:"relative",
          }}>
            <div style={{
              width:64,height:64,borderRadius:"50%",
              background:T.bg,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            }}>
              <div style={{fontSize:22,fontWeight:900,color:T.ok,lineHeight:1}}>{cnt}</div>
              <div style={{fontSize:10,color:T.tm,fontWeight:600}}>/36</div>
            </div>
          </div>
          <div style={{fontSize:10,color:T.tm,marginTop:4,fontWeight:600}}>GÖREV</div>
        </div>

        {/* Help button — glowing */}
        <button onClick={onHelp} disabled={hasHelp} style={{
          padding:"14px 22px",borderRadius:14,
          border:`3px solid ${hasHelp?T.warn:T.err}88`,
          background:hasHelp?`linear-gradient(135deg,${T.warn}33,${T.warn}22)`:`linear-gradient(135deg,${T.err}22,${T.err}11)`,
          color:hasHelp?T.warn:T.err,
          cursor:hasHelp?"default":"pointer",
          fontWeight:800,fontSize:15,
          display:"flex",alignItems:"center",gap:8,
          animation:hasHelp?"bounce 1s infinite":"none",
          boxShadow:hasHelp?`0 0 20px ${T.warn}66`:`0 4px 12px ${T.err}33`,
          transition:"all .2s",
        }}>
          {hasHelp?<>⏳ Bekleniyor</>:<><I.Hand/> Eğitmen Çağır</>}
        </button>
      </div>
    </div>

    {/* ═══ ROADMAP SECTIONS BY CATEGORY ═══ */}
    {cats.map((cat,catIdx)=>{
      const ct=TASKS.filter(t=>t.cat===cat);
      const cd=ct.filter(t=>sp[t.id]?.status===TS.APPROVED).length;
      const catComplete=cd===ct.length;
      const catColor=catColors[cat]||T.orange;
      const catProgress=ct.length>0?(cd/ct.length)*100:0;

      return(<div key={cat} style={{marginBottom:30,position:"relative",zIndex:1}}>
        {/* Category Banner */}
        <div style={{
          position:"relative",
          padding:"14px 20px",
          borderRadius:16,
          background:`linear-gradient(135deg,${catColor}33,${catColor}11)`,
          border:`2px solid ${catColor}55`,
          marginBottom:16,
          overflow:"hidden",
        }}>
          {catComplete&&<div style={{
            position:"absolute",top:-20,right:-20,
            fontSize:80,opacity:.15,
            transform:"rotate(15deg)",
          }}>🏆</div>}
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <div style={{
              width:46,height:46,borderRadius:12,
              background:`linear-gradient(135deg,${catColor},${catColor}88)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,fontWeight:900,color:"#fff",
              boxShadow:`0 4px 12px ${catColor}66`,
              animation:catComplete?"bounce 2s infinite":"none",
            }}>{catIdx+1}</div>
            <div style={{flex:1,minWidth:160}}>
              <div style={{fontSize:18,fontWeight:800,color:catColor}}>{cat} {catComplete&&"✨"}</div>
              <div style={{fontSize:12,color:T.ts,marginTop:2}}>
                {cd}/{ct.length} görev tamamlandı
                {catComplete&&<span style={{marginLeft:8,color:T.ok,fontWeight:700}}>BÖLÜM TAMAMLANDI!</span>}
              </div>
            </div>
            {/* Mini progress bar */}
            <div style={{width:120,height:6,borderRadius:3,background:"#0006",overflow:"hidden"}}>
              <div style={{
                height:"100%",borderRadius:3,
                background:`linear-gradient(90deg,${catColor},${catColor}cc)`,
                width:`${catProgress}%`,
                transition:"width .6s ease",
                boxShadow:`0 0 8px ${catColor}`,
              }}/>
            </div>
            <span style={{fontSize:14,fontWeight:800,color:catColor,minWidth:42,textAlign:"right"}}>{Math.round(catProgress)}%</span>
          </div>
        </div>

        {/* Task Roadmap — zigzag layout */}
        <div style={{position:"relative",padding:"16px 0"}}>
          {/* SVG dotted path connecting nodes */}
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity:.4}} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradPath${catIdx}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={catColor}/>
                <stop offset="100%" stopColor={catColor} stopOpacity=".3"/>
              </linearGradient>
            </defs>
          </svg>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",
            gap:16,
            position:"relative",
          }}>
            {ct.map((t,idx)=>{
              const s=sp[t.id]?.status||TS.LOCKED;
              const locked=s===TS.LOCKED;
              const approved=s===TS.APPROVED;
              const active=s===TS.ACTIVE||s===TS.IN_PROGRESS;
              const pending=s===TS.PENDING;
              const rejected=s===TS.REJECTED;
              const started=sp[t.id]?.startedAt;
              const completed=sp[t.id]?.completedAt||sp[t.id]?.approvedAt;
              const dur=(started&&completed)?fd(completed-started):null;

              const nodeColor=approved?T.ok:active?T.orange:pending?T.pl:rejected?T.err:T.tm;
              const offsetY=idx%2===0?0:8; // zigzag

              return(
                <div key={t.id}
                  className={`mission-node ${locked?"mission-locked":""}`}
                  onClick={()=>!locked&&onSel(t)}
                  style={{
                    cursor:locked?"not-allowed":"pointer",
                    opacity:locked?.4:1,
                    position:"relative",
                    transform:`translateY(${offsetY}px)`,
                    transition:"all .3s",
                  }}>

                  {/* Glowing ring for active task */}
                  {active&&<div style={{
                    position:"absolute",inset:-6,borderRadius:20,
                    border:`2px solid ${T.orange}`,
                    animation:"ring-pulse 1.8s infinite",
                    pointerEvents:"none",
                  }}/>}

                  {/* Confetti for newly approved */}
                  {approved&&[...Array(3)].map((_,ci)=>(
                    <span key={ci} style={{
                      position:"absolute",
                      top:8,
                      left:`${20+ci*30}%`,
                      fontSize:14,
                      animation:`confetti 2s ${ci*0.3}s infinite ease-out`,
                      pointerEvents:"none",
                      zIndex:3,
                    }}>{["✨","⭐","🎉"][ci]}</span>
                  ))}

                  {/* Card body */}
                  <div style={{
                    borderRadius:18,
                    background:approved
                      ?`linear-gradient(160deg,${T.ok}33,${T.card})`
                      :active
                      ?`linear-gradient(160deg,${T.orange}33,${T.card})`
                      :pending
                      ?`linear-gradient(160deg,${T.pl}33,${T.card})`
                      :rejected
                      ?`linear-gradient(160deg,${T.err}33,${T.card})`
                      :T.card,
                    border:`2px solid ${nodeColor}66`,
                    boxShadow:active
                      ?`0 8px 24px ${T.orange}44,0 0 30px ${T.orange}33`
                      :approved
                      ?`0 6px 18px ${T.ok}33`
                      :"0 4px 12px #0004",
                    overflow:"hidden",
                    position:"relative",
                  }}>

                    {/* Image area */}
                    <div style={{height:100,position:"relative",overflow:"hidden",background:T.dark}}>
                      <TaskImage taskId={t.id} type="gorsel" size={999} fallbackEmoji={t.img} style={{width:"100%",height:100,borderRadius:0}}/>

                      {/* Top gradient overlay */}
                      <div style={{
                        position:"absolute",top:0,left:0,right:0,height:40,
                        background:"linear-gradient(180deg,#000a,transparent)",
                        pointerEvents:"none",
                      }}/>

                      {/* Task number badge — hexagon style */}
                      <div style={{
                        position:"absolute",top:8,left:8,
                        width:36,height:36,
                        background:`linear-gradient(135deg,${catColor},${catColor}88)`,
                        clipPath:"polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:13,fontWeight:900,color:"#fff",
                        textShadow:"0 1px 2px #0008",
                      }}>{t.id}</div>

                      {/* Status badge top right */}
                      {approved&&<div style={{
                        position:"absolute",top:8,right:8,
                        width:32,height:32,borderRadius:"50%",
                        background:`radial-gradient(circle,${T.ok},#22a55a)`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:18,fontWeight:900,color:"#fff",
                        boxShadow:`0 0 12px ${T.ok}88`,
                        animation:"popin .5s",
                      }}>✓</div>}
                      {active&&!pending&&<div style={{
                        position:"absolute",top:8,right:8,
                        padding:"3px 10px",borderRadius:10,
                        background:`linear-gradient(135deg,${T.orange},${T.od})`,
                        fontSize:10,fontWeight:800,color:"#fff",
                        textTransform:"uppercase",letterSpacing:1,
                        boxShadow:`0 2px 8px ${T.orange}88`,
                        animation:"bounce 1.5s infinite",
                      }}>▶ Şimdi</div>}
                      {pending&&<div style={{
                        position:"absolute",top:8,right:8,
                        padding:"3px 10px",borderRadius:10,
                        background:`linear-gradient(135deg,${T.pl},${T.purple})`,
                        fontSize:10,fontWeight:800,color:"#fff",
                        textTransform:"uppercase",letterSpacing:1,
                        animation:"shimmer 2s infinite",
                      }}>⏳ Onayda</div>}
                      {rejected&&<div style={{
                        position:"absolute",top:8,right:8,
                        padding:"3px 10px",borderRadius:10,
                        background:T.err,
                        fontSize:10,fontWeight:800,color:"#fff",
                      }}>↻ Tekrar</div>}
                    </div>

                    {/* Content */}
                    <div style={{padding:"12px 14px"}}>
                      <div style={{
                        fontSize:14,fontWeight:800,marginBottom:8,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                        color:locked?T.tm:T.tp,
                      }}>{t.title}</div>

                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                        {/* XP coin */}
                        <div style={{
                          display:"flex",alignItems:"center",gap:4,
                          padding:"3px 9px",borderRadius:12,
                          background:`linear-gradient(135deg,${T.warn}33,${T.warn}11)`,
                          border:`1px solid ${T.warn}44`,
                        }}>
                          <span style={{fontSize:11}}>⚡</span>
                          <span style={{fontSize:12,fontWeight:800,color:T.warn}}>{t.xp}</span>
                        </div>
                        {/* Stars */}
                        <div style={{display:"flex",gap:1}}>
                          {[1,2,3,4,5].map(i=>(
                            <span key={i} style={{
                              fontSize:11,
                              color:i<=t.diff?T.warn:T.border,
                              filter:i<=t.diff?`drop-shadow(0 0 2px ${T.warn}66)`:"none",
                            }}>★</span>
                          ))}
                        </div>
                      </div>

                      {dur&&<div style={{
                        marginTop:6,fontSize:11,color:T.ok,
                        display:"flex",alignItems:"center",gap:4,
                        padding:"2px 8px",
                        background:T.ok+"15",borderRadius:8,
                        width:"fit-content",
                      }}><I.Clock/> {dur}</div>}
                    </div>
                  </div>

                  {/* LOCKED overlay */}
                  {locked&&<div style={{
                    position:"absolute",inset:0,
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    background:"linear-gradient(180deg,#0a0518cc,#0a0518ee)",
                    borderRadius:18,
                    backdropFilter:"blur(2px)",
                  }}>
                    <div style={{fontSize:40,marginBottom:6,filter:"grayscale(.5)"}}>🔒</div>
                    <div style={{fontSize:11,color:T.tm,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Önce Görev #{t.id-1}</div>
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>);
    })}

    {/* End-of-roadmap trophy */}
    {cnt===36&&<div style={{
      textAlign:"center",padding:30,marginBottom:20,
      borderRadius:20,
      background:`linear-gradient(135deg,${T.warn}33,${T.orange}33)`,
      border:`3px solid ${T.warn}88`,
      animation:"glow 2s infinite",
    }}>
      <div style={{fontSize:80,animation:"float 3s ease-in-out infinite"}}>🏆</div>
      <div style={{fontSize:28,fontWeight:900,color:T.warn,marginTop:10,letterSpacing:1}}>BERRYBOT MASTER!</div>
      <div style={{fontSize:14,color:T.tp,marginTop:4}}>Tüm 36 görevi tamamladın! Sen bir efsanesin.</div>
    </div>}
  </div>);
}

// ═══════════════════════════════════════
//  STUDENT: TASK VIEW
// ═══════════════════════════════════════
function StudentTaskView({user,task:t,prog,onStart,onSubmit,onResub,onHelp,onBack}){
  const[imgZoom,setImgZoom]=useState(false);
  const[imgLoaded,setImgLoaded]=useState(false);
  const[imgError,setImgError]=useState(false);
  const[photo,setPhoto]=useState(null);
  const[photoPreview,setPhotoPreview]=useState(null);
  const[savedPhoto,setSavedPhoto]=useState(null); // loaded from IndexedDB
  const tp=prog[user.id]?.[t.id]||{};
  const imgSrc=`/tasks/gorev_${t.id}/gorsel.jpg`;
  const hasHelp=prog[user.id]?.helpRequest;

  // Load saved photo from IndexedDB
  useEffect(()=>{
    if(tp.photo){getLocalPhoto(user.id,t.id).then(p=>setSavedPhoto(p));}
  },[user.id,t.id,tp.photo]);

  // Handle photo upload — compress to max 800px, JPEG 60% quality
  const handlePhotoUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const img=new Image();
    img.onload=()=>{
      const MAX=800;
      let w=img.width,h=img.height;
      if(w>MAX||h>MAX){
        if(w>h){h=Math.round(h*MAX/w);w=MAX;}
        else{w=Math.round(w*MAX/h);h=MAX;}
      }
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      const compressed=canvas.toDataURL('image/jpeg',0.6);
      setPhoto(compressed);
      setPhotoPreview(compressed);
      URL.revokeObjectURL(img.src);
    };
    img.src=URL.createObjectURL(file);
  };

  return(<div>
    <button onClick={onBack} style={{fontSize:14,padding:"6px 14px",borderRadius:8,background:T.border,color:T.ts,border:"none",cursor:"pointer",marginBottom:12}}>← Görevlere Dön</button>

    {/* FULLSCREEN IMAGE LIGHTBOX */}
    {imgZoom&&<div onClick={()=>setImgZoom(false)} style={{position:"fixed",inset:0,zIndex:100,background:"#000e",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",padding:20}}>
      <div style={{position:"relative",maxWidth:"90vw",maxHeight:"90vh"}}>
        <img src={imgSrc} alt={`Görev ${t.id}`} style={{maxWidth:"90vw",maxHeight:"85vh",objectFit:"contain",borderRadius:12,border:`2px solid ${T.orange}44`}}/>
        <div style={{position:"absolute",top:-40,right:0,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,color:T.ts}}>Görev #{t.id} — {t.title}</span>
          <button onClick={()=>setImgZoom(false)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.tp,padding:"6px 14px",cursor:"pointer",fontSize:14}}>✕ Kapat</button>
        </div>
      </div>
    </div>}

    {/* TASK HEADER WITH LARGE IMAGE */}
    <Card style={{marginBottom:16,padding:0,overflow:"hidden"}}>
      {!imgError ? (
        <div onClick={()=>imgLoaded&&setImgZoom(true)} style={{width:"100%",height:240,background:T.dark,position:"relative",cursor:imgLoaded?"zoom-in":"default",overflow:"hidden"}}>
          <img src={imgSrc} alt={`Görev ${t.id}`} onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)}
            style={{width:"100%",height:"100%",objectFit:"contain",background:T.dark,opacity:imgLoaded?1:0,transition:"opacity .3s"}}/>
          {!imgLoaded&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:56}}>{t.img}</span>
            <span style={{fontSize:14,color:T.tm}}>Görsel yükleniyor...</span>
          </div>}
          {imgLoaded&&<div style={{position:"absolute",bottom:10,right:10,fontSize:12,color:T.ts,background:"#000a",padding:"4px 12px",borderRadius:8}}>🔍 Büyütmek için tıkla</div>}
          <div style={{position:"absolute",top:10,left:10,fontSize:14,fontWeight:800,color:T.tp,background:"#000a",padding:"4px 12px",borderRadius:8}}>#{t.id}</div>
        </div>
      ) : (
        <div style={{width:"100%",height:140,background:`linear-gradient(135deg,${T.purple}30,${T.dark})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
          <span style={{fontSize:56}}>{t.img}</span>
        </div>
      )}

      {/* TASK INFO — bigger fonts */}
      <div style={{padding:18}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <span style={{fontSize:13,padding:"3px 10px",borderRadius:6,background:T.purple+"30",color:T.pl,fontWeight:600}}>{t.cat}</span>
          <span style={{fontSize:14,color:T.tm}}>Görev #{t.id}</span>
          <Stars n={t.diff}/>
          <span style={{fontSize:14,color:T.warn,fontWeight:700}}>+{t.xp} XP</span>
          <div style={{marginLeft:"auto"}}><Badge s={tp.status}/></div>
        </div>
        <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:800}}>{t.title}</h2>
        <p style={{fontSize:16,color:T.ts,margin:0,lineHeight:1.7}}>{t.desc}</p>
      </div>
    </Card>

    {/* ── ACTIVE: Start button ── */}
    {tp.status===TS.ACTIVE&&<Card><div style={{textAlign:"center",padding:30}}>
      <div style={{fontSize:56,marginBottom:12}}>🎯</div>
      <div style={{fontSize:18,color:T.ts,marginBottom:16}}>Bu görevi başlatmaya hazır mısın?</div>
      <button onClick={onStart} style={{padding:"14px 40px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${T.orange},${T.od})`,color:"#fff",fontSize:20,fontWeight:800,cursor:"pointer",boxShadow:`0 4px 20px ${T.orange}44`}}>🚀 Göreve Başla!</button>
    </div></Card>}

    {/* ── IN PROGRESS: Call instructor + Upload photo ── */}
    {tp.status===TS.IN_PROGRESS&&<>
      {/* CALL INSTRUCTOR */}
      <Card style={{marginBottom:12,background:hasHelp?"#3a1520":T.card,border:hasHelp?`2px solid ${T.err}55`:undefined}}>
        <div style={{textAlign:"center",padding:16}}>
          {hasHelp ? (
            <>
              <div style={{fontSize:40,marginBottom:8,animation:"pulse 2s infinite"}}>🖐</div>
              <div style={{fontSize:18,color:T.err,fontWeight:700}}>Eğitmen çağrıldı!</div>
              <div style={{fontSize:14,color:T.ts,marginTop:4}}>Eğitmenin gelmesini bekle...</div>
            </>
          ) : (
            <>
              <div style={{fontSize:18,color:T.ts,marginBottom:12}}>Görev üzerinde çalışıyorsun. Hazır olduğunda eğitmeni çağır!</div>
              <button onClick={onHelp} style={{padding:"14px 32px",borderRadius:14,border:`3px solid ${T.err}66`,background:T.err+"15",color:T.err,cursor:"pointer",fontWeight:800,fontSize:18,display:"inline-flex",alignItems:"center",gap:8}}>
                <I.Hand/> Eğitmeni Çağır
              </button>
            </>
          )}
        </div>
      </Card>

      {/* UPLOAD PHOTO */}
      <Card>
        <div style={{fontSize:16,fontWeight:700,color:T.ts,marginBottom:6}}>📸 Görevi Tamamla</div>
        <div style={{fontSize:14,color:T.tm,marginBottom:12}}>İstersen fotoğraf ekle, ya da direkt onaya gönder.</div>

        {/* Photo preview */}
        {photoPreview&&<div style={{marginBottom:12,borderRadius:12,overflow:"hidden",border:`2px solid ${T.ok}44`,position:"relative"}}>
          <img src={photoPreview} alt="Yüklenen fotoğraf" style={{width:"100%",maxHeight:300,objectFit:"contain",background:T.dark}}/>
          <button onClick={()=>{setPhoto(null);setPhotoPreview(null);}} style={{position:"absolute",top:8,right:8,padding:"4px 12px",borderRadius:8,border:"none",background:"#000a",color:T.err,cursor:"pointer",fontSize:13,fontWeight:600}}>✕ Kaldır</button>
        </div>}

        {/* File input — accepts images, also camera on mobile */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <label style={{padding:"12px 24px",borderRadius:12,border:`2px dashed ${T.orange}55`,background:T.orange+"10",color:T.orange,cursor:"pointer",fontWeight:700,fontSize:16,display:"inline-flex",alignItems:"center",gap:8}}>
            📷 Fotoğraf Seç (İsteğe Bağlı)
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{display:"none"}}/>
          </label>
        </div>

        {/* Submit buttons */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginTop:14}}>
          {photo&&<button onClick={()=>onSubmit(photo)} style={{padding:"14px 28px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${T.ok},#22a55a)`,color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,boxShadow:`0 4px 16px ${T.ok}44`}}>
            ✓ Fotoğrafla Gönder
          </button>}
          <button onClick={()=>onSubmit(null)} style={{padding:"14px 28px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${T.pl},${T.purple})`,color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,boxShadow:`0 4px 16px ${T.pl}44`}}>
            ✓ Onaya Gönder {photo?"":"(Fotoğrafsız)"}
          </button>
        </div>

        <div style={{fontSize:12,color:T.tm,marginTop:10,display:"flex",alignItems:"center",gap:6}}>
          <I.Clock/> Başlangıç: {ft(tp.startedAt)}
        </div>
      </Card>
    </>}

    {/* ── PENDING ── */}
    {tp.status===TS.PENDING&&<Card><div style={{textAlign:"center",padding:30}}>
      <div style={{fontSize:48}}>⏳</div>
      <div style={{fontSize:20,color:T.pl,marginTop:10,fontWeight:700}}>Eğitmen onayı bekleniyor...</div>
      <div style={{fontSize:14,color:T.tm,marginTop:6}}>Eğitmenin incelemesini bekle.</div>
      {tp.photo&&savedPhoto&&<div style={{marginTop:14,borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`,display:"inline-block"}}><img src={savedPhoto} alt="Gönderilen" style={{maxWidth:300,maxHeight:200,objectFit:"contain",background:T.dark}}/></div>}
      {tp.photo&&!savedPhoto&&<div style={{marginTop:10,fontSize:13,color:T.ok}}>📸 Fotoğraf bu cihazda kayıtlı</div>}
    </div></Card>}

    {/* ── APPROVED ── */}
    {tp.status===TS.APPROVED&&<Card><div style={{textAlign:"center",padding:30}}>
      <div style={{fontSize:56}}>🎉</div>
      <div style={{fontSize:24,color:T.ok,fontWeight:800,marginTop:8}}>+{t.xp} XP Kazandın!</div>
      <div style={{fontSize:16,color:T.ts,marginTop:4}}>Harika iş çıkardın!</div>
      {tp.instructorNote&&<div style={{fontSize:15,padding:"8px 20px",borderRadius:10,background:"#1a4a2e",color:"#86efac",marginTop:10,display:"inline-block"}}>"{tp.instructorNote}"</div>}
    </div></Card>}

    {/* ── REJECTED ── */}
    {tp.status===TS.REJECTED&&<Card><div style={{textAlign:"center",padding:30}}>
      <div style={{fontSize:48}}>🔄</div>
      <div style={{fontSize:18,color:T.err,marginTop:6,fontWeight:700}}>Tekrar dene!</div>
      {tp.instructorNote&&<div style={{fontSize:15,padding:"8px 20px",borderRadius:10,background:"#5c1a1a",color:"#fca5a5",marginTop:8,display:"inline-block"}}>"{tp.instructorNote}"</div>}
      <div><button onClick={onResub} style={{marginTop:14,padding:"12px 28px",borderRadius:12,border:"none",background:T.warn,color:T.dark,fontSize:16,fontWeight:800,cursor:"pointer"}}>🔄 Tekrar Dene</button></div>
    </div></Card>}
  </div>);
}

// ═══════════════════════════════════════
//  INSTRUCTOR DASHBOARD
// ═══════════════════════════════════════
function InstructorDash({user,users,prog,onClearHelp,onSel}){
  const my=users.filter(u=>u.role===ROLES.STUDENT);
  const pend=my.reduce((a,s)=>a+TASKS.filter(t=>prog[s.id]?.[t.id]?.status===TS.PENDING).length,0);
  const helpReqs=my.filter(s=>prog[s.id]?.helpRequest);
  return(<div>
    <h1 style={{fontSize:22,fontWeight:800,color:T.orange,margin:"0 0 16px"}}>Eğitmen Paneli</h1>
    {helpReqs.length>0&&<Card style={{marginBottom:16,background:"#3a1520",borderColor:T.err+"44"}}>
      <div style={{fontSize:16,fontWeight:700,color:T.err,marginBottom:10}}>🖐 Yardım İstekleri ({helpReqs.length})</div>
      {helpReqs.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:T.dark,marginBottom:6}}>
        <span style={{fontWeight:700,fontSize:15}}>{s.name}</span><span style={{fontSize:13,color:T.tm}}>{fd(Date.now()-prog[s.id].helpRequest)} önce</span>
        <button onClick={()=>{onClearHelp(s.id);onSel(s);}} style={{marginLeft:"auto",fontSize:13,padding:"6px 16px",borderRadius:8,border:"none",background:T.ok+"30",color:T.ok,cursor:"pointer",fontWeight:600}}>Git →</button>
      </div>)}
    </Card>}
    <Card>{my.map(s=>{const cnt=TASKS.filter(t=>prog[s.id]?.[t.id]?.status===TS.APPROVED).length;const pd=TASKS.filter(t=>prog[s.id]?.[t.id]?.status===TS.PENDING).length;const pct=Math.round(cnt/36*100);const xp=TASKS.filter(t=>prog[s.id]?.[t.id]?.status===TS.APPROVED).reduce((a,t)=>a+t.xp,0);
      return(<div key={s.id} onClick={()=>onSel(s)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,cursor:"pointer",marginBottom:6,background:T.dark,border:`1px solid ${prog[s.id]?.helpRequest?T.err+"55":T.border}`}}>
        <div style={{width:40,height:40,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,background:T.orange+"15",color:T.orange,border:`2px solid ${T.orange}44`}}>{s.name[0]}</div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>{s.name}</div><div style={{fontSize:12,color:T.tm}}>{getLevel(xp).icon} Lv.{getLevel(xp).lv} • {xp}XP • {cnt}/36 görev</div></div>
        {pd>0&&<span style={{fontSize:12,padding:"4px 10px",borderRadius:12,background:T.warn+"20",color:T.warn,fontWeight:600}}>{pd} onay</span>}
        {prog[s.id]?.helpRequest&&<span style={{fontSize:12,padding:"4px 10px",borderRadius:12,background:T.err+"20",color:T.err}}>🖐</span>}
        <div style={{fontSize:16,fontWeight:800,color:T.orange}}>{pct}%</div>
      </div>);
    })}</Card>
  </div>);
}

// ═══════════════════════════════════════
//  STUDENT DETAIL
// ═══════════════════════════════════════
function StudentDetail({s,prog,users,canReview,onApprove,onReject,onBack}){
  const[note,setNote]=useState("");
  const sp=prog[s.id]||{};const cnt=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED).length;
  const xp=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED).reduce((a,t)=>a+t.xp,0);
  return(<div>
    <button onClick={onBack} style={{fontSize:14,padding:"6px 14px",borderRadius:8,background:T.border,color:T.ts,border:"none",cursor:"pointer",marginBottom:12}}>← Geri</button>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
      <div style={{width:52,height:52,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,background:T.orange+"15",color:T.orange}}>{s.name[0]}</div>
      <div><h2 style={{margin:0,fontSize:20}}>{s.name}</h2><div style={{fontSize:14,color:T.tm}}>{getLevel(xp).icon} Lv.{getLevel(xp).lv} • {xp} XP</div></div>
      <div style={{marginLeft:"auto",fontSize:28,fontWeight:800,color:T.orange}}>{cnt}/36</div>
    </div>
    <Card>{TASKS.map(t=>{const tp=sp[t.id]||{};const lk=tp.status===TS.LOCKED;const pn=tp.status===TS.PENDING;
      const started=tp.startedAt;const completed=tp.completedAt||tp.approvedAt;
      const dur=(started&&completed)?fd(completed-started):null;
      return(<div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,marginBottom:4,opacity:lk?.3:1,background:pn?T.purple+"15":"transparent"}}>
        <span style={{width:26,fontSize:13,fontFamily:"monospace",color:T.tm,textAlign:"center"}}>#{t.id}</span>
        <TaskImage taskId={t.id} type="gorsel" size={30} fallbackEmoji={t.img} style={{borderRadius:5}}/>
        <div style={{flex:1,minWidth:0}}>
          <span style={{fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{t.title}</span>
          {dur&&<span style={{fontSize:11,color:T.ok}}><I.Clock/> {dur}</span>}
        </div>
        <span style={{fontSize:12,color:T.warn,fontWeight:600}}>+{t.xp}</span>
        <Badge s={tp.status}/>
        {tp.photo&&<span style={{fontSize:12,color:T.ok}}>📸</span>}
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
function DailyShow({users,prog,logs,onSel}){
  const[selStudent,setSelStudent]=useState(null);
  const[dayFilter,setDayFilter]=useState("today"); // today, week, all

  const students=users.filter(u=>u.role===ROLES.STUDENT);
  const now=Date.now();
  const dayStart=new Date();dayStart.setHours(0,0,0,0);
  const weekAgo=now-7*24*60*60*1000;

  const isInRange=(ts)=>{
    if(!ts)return false;
    if(dayFilter==="today")return ts>=dayStart.getTime();
    if(dayFilter==="week")return ts>=weekAgo;
    return true;
  };

  // Today's active students
  const activeStudents=students.map(s=>{
    const sp=prog[s.id]||{};
    const tasksInRange=TASKS.filter(t=>{
      const tp=sp[t.id];
      return tp&&(isInRange(tp.startedAt)||isInRange(tp.completedAt)||isInRange(tp.approvedAt));
    });
    const approved=tasksInRange.filter(t=>sp[t.id]?.status===TS.APPROVED);
    const xpGained=approved.reduce((a,t)=>a+t.xp,0);
    let totalMs=0;
    tasksInRange.forEach(t=>{const tp=sp[t.id];if(tp.startedAt&&tp.completedAt)totalMs+=Math.max(0,tp.completedAt-tp.startedAt);});
    return{student:s,tasks:tasksInRange,approved,xpGained,totalMs};
  }).filter(x=>x.tasks.length>0).sort((a,b)=>b.xpGained-a.xpGained);

  const detail=selStudent;
  if(detail){
    const sp=prog[detail.id]||{};
    const allTasks=TASKS.filter(t=>{
      const tp=sp[t.id];
      return tp&&(isInRange(tp.startedAt)||isInRange(tp.completedAt)||isInRange(tp.approvedAt));
    });
    const totalLearnings=[...new Set(allTasks.filter(t=>sp[t.id]?.status===TS.APPROVED).flatMap(t=>t.learnings||[]))];
    let totalMs=0;
    allTasks.forEach(t=>{const tp=sp[t.id];if(tp.startedAt&&tp.completedAt)totalMs+=Math.max(0,tp.completedAt-tp.startedAt);});

    return(<div>
      <button onClick={()=>setSelStudent(null)} style={{fontSize:14,padding:"6px 14px",borderRadius:8,background:T.border,color:T.ts,border:"none",cursor:"pointer",marginBottom:14}}>← Geri</button>
      <h1 style={{fontSize:22,fontWeight:800,color:T.orange,margin:"0 0 4px"}}>📊 {detail.name}</h1>
      <div style={{fontSize:14,color:T.tm,marginBottom:14}}>{dayFilter==="today"?"Bugün":dayFilter==="week"?"Son 7 Gün":"Tüm Zaman"} özeti</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
        <Card style={{textAlign:"center",padding:14}}><div style={{fontSize:24,fontWeight:800,color:T.ok}}>{allTasks.filter(t=>sp[t.id]?.status===TS.APPROVED).length}</div><div style={{fontSize:13,color:T.ts}}>Tamamlanan</div></Card>
        <Card style={{textAlign:"center",padding:14}}><div style={{fontSize:24,fontWeight:800,color:T.cyan}}>{fd(totalMs)}</div><div style={{fontSize:13,color:T.ts}}>Süre</div></Card>
        <Card style={{textAlign:"center",padding:14}}><div style={{fontSize:24,fontWeight:800,color:T.warn}}>{allTasks.filter(t=>sp[t.id]?.status===TS.APPROVED).reduce((a,t)=>a+t.xp,0)}</div><div style={{fontSize:13,color:T.ts}}>XP</div></Card>
        <Card style={{textAlign:"center",padding:14}}><div style={{fontSize:24,fontWeight:800,color:T.pl}}>{totalLearnings.length}</div><div style={{fontSize:13,color:T.ts}}>Kazanım</div></Card>
      </div>

      {totalLearnings.length>0&&<Card style={{marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:700,color:T.pl,marginBottom:8}}>🎯 Kazanılan Yetkinlikler</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {totalLearnings.map((lr,i)=><span key={i} style={{fontSize:13,padding:"4px 12px",borderRadius:6,background:T.purple+"22",color:T.pl,border:`1px solid ${T.purple}44`}}>{lr}</span>)}
        </div>
      </Card>}

      <div style={{fontSize:16,fontWeight:700,color:T.ol,marginBottom:8}}>📋 Görev Detayları ({allTasks.length})</div>
      {allTasks.map(t=>{
        const tp=sp[t.id];
        const dur=(tp.startedAt&&tp.completedAt)?fd(tp.completedAt-tp.startedAt):null;
        return(<Card key={t.id} style={{marginBottom:8,padding:12}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <TaskImage taskId={t.id} type="gorsel" size={42} fallbackEmoji={t.img}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                <span style={{fontSize:14,fontWeight:700}}>#{t.id} {t.title}</span>
                <Badge s={tp.status}/>
                {dur&&<span style={{fontSize:12,color:T.cyan}}>⏱ {dur}</span>}
                <span style={{fontSize:12,color:T.warn,fontWeight:600}}>+{t.xp} XP</span>
              </div>
              <div style={{fontSize:11,color:T.tm}}>
                {tp.startedAt&&`Başladı: ${ft(tp.startedAt)} `}
                {tp.completedAt&&`• Bitti: ${ft(tp.completedAt)} `}
                {tp.approvedAt&&`• Onay: ${ft(tp.approvedAt)}`}
              </div>
              {t.learnings&&tp.status===TS.APPROVED&&<div style={{marginTop:4,display:"flex",flexWrap:"wrap",gap:4}}>
                {t.learnings.map((lr,i)=><span key={i} style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:T.purple+"15",color:T.pl}}>{lr}</span>)}
              </div>}
            </div>
          </div>
        </Card>);
      })}
    </div>);
  }

  return(<div>
    <h1 style={{fontSize:22,fontWeight:800,color:T.orange,margin:"0 0 14px"}}>📊 Günlük Show</h1>
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      {[{k:"today",l:"Bugün"},{k:"week",l:"Son 7 Gün"},{k:"all",l:"Tüm Zaman"}].map(d=>
        <button key={d.k} onClick={()=>setDayFilter(d.k)} style={{fontSize:13,padding:"7px 16px",borderRadius:8,border:dayFilter===d.k?`2px solid ${T.orange}`:`1px solid ${T.border}`,background:dayFilter===d.k?T.orange+"20":T.card,color:dayFilter===d.k?T.orange:T.ts,cursor:"pointer",fontWeight:dayFilter===d.k?700:400}}>{d.l}</button>
      )}
    </div>
    {activeStudents.length===0?<Card><div style={{padding:30,textAlign:"center",color:T.tm,fontSize:15}}>Bu zaman aralığında aktivite yok.</div></Card>:
    activeStudents.map(({student:s,tasks,approved,xpGained,totalMs})=>(
      <Card key={s.id} style={{marginBottom:10,cursor:"pointer"}} >
        <div onClick={()=>setSelStudent(s)} style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:T.orange+"15",color:T.orange,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:18,border:`2px solid ${T.orange}44`}}>{s.name[0]}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700}}>{s.name}</div>
            <div style={{fontSize:13,color:T.tm}}>{tasks.length} görev • {approved.length} tamamlandı • {fd(totalMs)} süre</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:18,fontWeight:800,color:T.warn}}>+{xpGained} XP</div>
            <div style={{fontSize:11,color:T.tm}}>tıkla → detay</div>
          </div>
        </div>
      </Card>
    ))}
  </div>);
}

// ═══════════════════════════════════════
//  PARENT: NEW UNIFIED VIEW — 3 sekme: Sınıf | Kazanımlar | CV
// ═══════════════════════════════════════
function ParentView({parent,users,prog,classLayout,logs,initialTab="class"}){
  const[tab,setTab]=useState(initialTab);
  const child=users.find(u=>u.id===parent.childId);

  if(!child)return<Card><div style={{padding:30,textAlign:"center",color:T.tm,fontSize:16}}>Çocuk bilgisi bulunamadı. Admin'e başvurun.</div></Card>;

  const sp=prog[child.id]||{};

  return(<div>
    {/* TABS */}
    <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
      {[
        {k:"class",l:"🏫 Sınıf & Aktivite",c:T.orange},
        {k:"learnings",l:"📚 Kazanımlar",c:T.pl},
        {k:"cv",l:"📜 CV / Sertifika",c:T.cyan},
      ].map(t=>
        <button key={t.k} onClick={()=>setTab(t.k)} style={{fontSize:14,padding:"10px 18px",borderRadius:10,border:tab===t.k?`2px solid ${t.c}`:`1px solid ${T.border}`,background:tab===t.k?t.c+"20":T.card,color:tab===t.k?t.c:T.ts,cursor:"pointer",fontWeight:tab===t.k?700:500}}>{t.l}</button>
      )}
    </div>

    {tab==="class"&&<ParentClassroomView child={child} sp={sp} classLayout={classLayout} logs={logs} prog={prog}/>}
    {tab==="learnings"&&<ParentLearningsView child={child} sp={sp}/>}
    {tab==="cv"&&<ParentCVView child={child} sp={sp}/>}
  </div>);
}

// ─── TAB 1: SINIF (Layout + Aktif Görev Popup + Audit Log) ───
function ParentClassroomView({child,sp,classLayout,logs,prog}){
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

  // Current task
  const current=TASKS.find(t=>sp[t.id]?.status===TS.ACTIVE||sp[t.id]?.status===TS.IN_PROGRESS||sp[t.id]?.status===TS.PENDING);
  const isOnline=child.online||(prog[child.id]?.online);
  const lastSeen=prog[child.id]?.lastSeen;
  const currentPage=prog[child.id]?.currentPage;
  const currentTaskId=prog[child.id]?.currentTaskId;
  const pageUpdatedAt=prog[child.id]?.pageUpdatedAt;
  const isRecentlyActive=pageUpdatedAt&&(Date.now()-pageUpdatedAt<2*60*1000); // 2 min

  return(<div>
    {/* HEADER */}
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14,flexWrap:"wrap"}}>
      <div style={{width:64,height:64,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,background:T.orange+"20",color:T.orange,border:`3px solid ${T.orange}66`}}>{child.name[0]}</div>
      <div style={{flex:1}}>
        <h1 style={{fontSize:22,fontWeight:800,color:T.orange,margin:0}}>{child.name}</h1>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4,flexWrap:"wrap"}}>
          {isRecentlyActive?
            <span style={{fontSize:13,padding:"4px 12px",borderRadius:6,background:T.ok+"22",color:T.ok,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:T.ok,animation:"pulse 1.5s infinite"}}/>
              Online — Şu an aktif
            </span>:
            <span style={{fontSize:13,padding:"4px 12px",borderRadius:6,background:T.tm+"22",color:T.tm,fontWeight:500}}>
              Çevrimdışı {lastSeen?`• Son görülme: ${ft(lastSeen)}`:""}
            </span>
          }
        </div>
      </div>
    </div>

    {/* CURRENT WEB ACTIVITY */}
    {isRecentlyActive&&currentPage&&(()=>{
      const inOtherTab=currentPage.includes("BAŞKA SEKMEDE");
      const cleanPage=currentPage.replace(" [⚠️ BAŞKA SEKMEDE]","");
      return(<Card style={{marginBottom:14,background:inOtherTab?`linear-gradient(135deg,${T.warn}25,${T.err}15)`:`linear-gradient(135deg,${T.ok}20,${T.cyan}10)`,borderColor:inOtherTab?T.warn+"77":T.ok+"55"}}>
        <div style={{fontSize:12,fontWeight:700,color:inOtherTab?T.warn:T.ok,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>🌐 Şu An Tarayıcıda</div>
        <div style={{fontSize:18,fontWeight:700,color:T.tp}}>{cleanPage}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:6,flexWrap:"wrap"}}>
          {inOtherTab?
            <span style={{fontSize:13,padding:"4px 12px",borderRadius:6,background:T.warn+"33",color:T.warn,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
              ⚠️ BerryBot sekmesi açık ama başka sekmede / pencerede
            </span>:
            <span style={{fontSize:13,padding:"4px 12px",borderRadius:6,background:T.ok+"33",color:T.ok,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
              ✓ BerryBot aktif sekmede — odaklanmış
            </span>
          }
        </div>
        {currentTaskId&&<div style={{fontSize:12,color:T.tm,marginTop:6}}>Görev #{currentTaskId} • Güncel: {fd(Date.now()-pageUpdatedAt)} önce</div>}
        <div style={{fontSize:11,color:T.tm,marginTop:8,fontStyle:"italic",borderTop:`1px solid ${T.border}33`,paddingTop:6}}>
          ℹ️ Tarayıcı güvenlik kuralları gereği başka sekmelerin (YouTube, oyun, vb.) içeriği görüntülenemez.
          Sadece BerryBot uygulamasından çıkıp çıkmadığı izlenebilir.
        </div>
      </Card>);
    })()}

    {/* CLASSROOM LAYOUT — read only */}
    {myClass&&mySeat&&<Card style={{marginBottom:14,padding:14}}>
      <div style={{fontSize:15,fontWeight:700,color:T.orange,marginBottom:8}}>🏫 Çocuğunuzun Yeri — {myClass.name}</div>
      <ParentMiniClassroom myClass={myClass} childId={child.id}/>
    </Card>}
    {!myClass&&<Card style={{marginBottom:14}}><div style={{padding:14,textAlign:"center",color:T.tm,fontSize:13}}>Çocuk henüz bir sınıfa atanmamış</div></Card>}

    {/* CURRENT TASK POPUP */}
    {current&&<Card style={{marginBottom:14,borderColor:T.orange+"55",position:"relative"}}>
      <div style={{fontSize:12,color:T.orange,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>🎯 Şu An Üzerinde Çalıştığı Görev</div>
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <TaskImage taskId={current.id} type="gorsel" size={80} fallbackEmoji={current.img}/>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>#{current.id} — {current.title}</div>
          <div style={{fontSize:13,padding:"3px 10px",borderRadius:5,background:T.purple+"30",color:T.pl,display:"inline-block",marginBottom:6}}>{current.cat}</div>
          <div style={{fontSize:14,color:T.ts,lineHeight:1.5}}>{current.desc}</div>
          <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center"}}>
            <Badge s={sp[current.id]?.status}/>
            <span style={{fontSize:12,color:T.warn,fontWeight:600}}>+{current.xp} XP</span>
            {sp[current.id]?.startedAt&&<span style={{fontSize:12,color:T.cyan}}>⏱ {fd(Date.now()-sp[current.id].startedAt)} önce başladı</span>}
          </div>
        </div>
      </div>
    </Card>}

    {/* AUDIT LOG — only for this child */}
    <div style={{fontSize:16,fontWeight:700,color:T.pl,marginBottom:8}}>📋 Aktivite Geçmişi</div>
    <Card>
      {logs.length===0?<div style={{padding:14,textAlign:"center",color:T.tm,fontSize:13}}>Henüz aktivite yok</div>:
      <div style={{maxHeight:500,overflowY:"auto"}}>
        {logs.slice(0,80).map(lg=>{
          const tc={login:T.tm,task_started:T.cyan,task_completed:T.pl,task_approved:T.ok,task_rejected:T.err,help_request:T.err}[lg.type]||T.tm;
          const icon={login:"🔐",task_started:"🎯",task_completed:"📤",task_approved:"✓",task_rejected:"🔄",help_request:"🖐"}[lg.type]||"•";
          return(<div key={lg.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderBottom:`1px solid ${T.border}33`}}>
            <span style={{fontSize:18,width:24,textAlign:"center"}}>{icon}</span>
            <span style={{fontSize:13,color:tc,fontWeight:600,minWidth:100}}>{ft(lg.ts)}</span>
            <span style={{fontSize:14,color:T.tp,flex:1}}>{lg.detail}</span>
            {lg.taskId&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:5,background:T.purple+"22",color:T.pl}}>G.{lg.taskId}</span>}
          </div>);
        })}
      </div>}
    </Card>
  </div>);
}

// Mini classroom — only show parent's child highlighted
function ParentMiniClassroom({myClass,childId}){
  const renderTable=(table)=>{
    const isMyTable=table.seats?.includes(childId);
    return(<div key={table.id} style={{
      position:"absolute",left:table.x,top:table.y,
      width:table.w,height:table.h,
      background:"linear-gradient(160deg, #A07828, #8B6914 30%, #7A5C12 60%, #6B4F12)",
      borderRadius:10,border:isMyTable?`3px solid ${T.orange}`:"3px solid #5C4010",
      boxShadow:isMyTable?`0 0 24px ${T.orange}88`:"0 4px 12px #00000055",
      display:"flex",flexDirection:"column",overflow:"hidden",
    }}>
      <div style={{padding:"3px 8px",background:"#5C401088",borderBottom:"1px solid #4a350e",fontSize:9,color:"#C4A868",fontWeight:700}}>
        {TABLE_PRESETS[table.type]?.label||"Masa"}
      </div>
      <div style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${table.horizontal?(TABLE_PRESETS[table.type]?.rows||1):(TABLE_PRESETS[table.type]?.cols||2)},1fr)`,gap:3,padding:4}}>
        {table.seats.map((sid,i)=>{
          const isMe=sid===childId;
          return(<div key={i} style={{
            background:isMe?T.orange+"33":sid?"#1a1408":"transparent",
            border:isMe?`2px solid ${T.orange}`:sid?`1px solid #5C401044`:"1px dashed #5C401033",
            borderRadius:6,minHeight:42,display:"flex",alignItems:"center",justifyContent:"center",
            position:"relative",
          }}>
            {isMe&&<>
              <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:14,zIndex:2}}>📍</div>
              <div style={{fontSize:11,fontWeight:700,color:T.orange}}>BEN</div>
            </>}
            {!isMe&&sid&&<div style={{fontSize:14,color:WOOD.textDim,opacity:.4}}>•</div>}
            {!sid&&<div style={{fontSize:11,color:T.tm,opacity:.5}}>boş</div>}
          </div>);
        })}
      </div>
    </div>);
  };

  return(<div style={{position:"relative",width:"100%",height:Math.min(myClass.canvasH||500,500),background:"linear-gradient(180deg,#13101e,#0f0c18)",border:`1px solid ${T.border}`,borderRadius:10,overflow:"auto"}}>
    <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",padding:"4px 16px",borderRadius:6,background:"#1a4a2e88",border:"2px solid #2d8a5666",fontSize:11,fontWeight:700,color:"#86efac",zIndex:5}}>🖥️ AKILLI TAHTA</div>
    {(myClass.objects||[]).filter(o=>o.type==="tv").map(o=>(
      <div key={o.id} style={{position:"absolute",left:o.x,top:o.y,width:o.w,height:o.h,background:"linear-gradient(180deg,#1a1a2e,#0f0f1e)",borderRadius:6,border:"2px solid #333",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#67e8f9",fontWeight:700}}>🖥️ {o.label||"TV"}</div>
    ))}
    {(myClass.tables||[]).map(renderTable)}
  </div>);
}

// ─── TAB 2: KAZANIMLAR ───
function ParentLearningsView({child,sp}){
  const completed=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED);
  const xp=completed.reduce((a,t)=>a+t.xp,0);
  const lv=getLevel(xp);
  const nlv=getNextLevel(xp);
  let totalMs=0;
  completed.forEach(t=>{const tp=sp[t.id];if(tp.startedAt&&tp.completedAt)totalMs+=Math.max(0,tp.completedAt-tp.startedAt);});
  const cats=[...new Set(TASKS.map(t=>t.cat))];
  const allLearnings=[...new Set(completed.flatMap(t=>t.learnings||[]))];

  return(<div>
    {/* HERO */}
    <Card style={{marginBottom:14,background:`linear-gradient(135deg,${T.purple}40,${T.orange}20)`,border:`1px solid ${T.orange}44`}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{width:64,height:64,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,background:T.orange+"20",border:`3px solid ${T.orange}88`}}>{lv.icon}</div>
        <div style={{flex:1,minWidth:180}}>
          <div style={{fontSize:22,fontWeight:800,color:T.orange}}>Level {lv.lv} — {lv.name}</div>
          <div style={{fontSize:14,color:T.ol,fontWeight:700,marginTop:2}}>{xp} XP {nlv&&<span style={{fontSize:12,color:T.tm,fontWeight:400}}>• Sonraki: {nlv.icon} {nlv.name} ({nlv.min})</span>}</div>
          <div style={{width:"100%",height:10,borderRadius:5,background:T.border,overflow:"hidden",marginTop:6}}>
            <div style={{height:"100%",borderRadius:5,background:`linear-gradient(90deg,${T.orange},${T.pl})`,width:`${nlv?((xp-lv.min)/(nlv.min-lv.min))*100:100}%`}}/>
          </div>
        </div>
        <div style={{textAlign:"center",minWidth:90}}>
          <div style={{fontSize:30,fontWeight:800,color:T.orange}}>{completed.length}<span style={{fontSize:18,color:T.tm}}>/36</span></div>
          <div style={{fontSize:11,color:T.tm}}>Tamamlanan</div>
        </div>
      </div>
    </Card>

    {/* STATS */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
      <Card style={{textAlign:"center",padding:14}}><div style={{fontSize:22,fontWeight:800,color:T.cyan}}>{fd(totalMs)}</div><div style={{fontSize:12,color:T.ts}}>Toplam Süre</div></Card>
      <Card style={{textAlign:"center",padding:14}}><div style={{fontSize:22,fontWeight:800,color:T.warn}}>{xp}</div><div style={{fontSize:12,color:T.ts}}>XP Puanı</div></Card>
      <Card style={{textAlign:"center",padding:14}}><div style={{fontSize:22,fontWeight:800,color:T.pl}}>{allLearnings.length}</div><div style={{fontSize:12,color:T.ts}}>Yetkinlik</div></Card>
      <Card style={{textAlign:"center",padding:14}}><div style={{fontSize:22,fontWeight:800,color:T.ok}}>{Math.round(completed.length/36*100)}%</div><div style={{fontSize:12,color:T.ts}}>İlerleme</div></Card>
    </div>

    {/* CATEGORY BREAKDOWN */}
    {completed.length===0?<Card><div style={{padding:30,textAlign:"center",color:T.tm,fontSize:14}}>Henüz tamamlanmış görev yok.</div></Card>:
    cats.map(cat=>{
      const ct=completed.filter(t=>t.cat===cat);
      if(ct.length===0)return null;
      const ctTotal=TASKS.filter(t=>t.cat===cat).length;
      return(<div key={cat} style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <span style={{fontSize:15,fontWeight:700,color:T.orange,padding:"4px 14px",background:T.orange+"15",borderRadius:8}}>{cat}</span>
          <span style={{fontSize:12,color:T.ts}}>{ct.length}/{ctTotal} tamamlandı</span>
        </div>
        {ct.map(t=>{
          const tp=sp[t.id];
          const dur=(tp.startedAt&&tp.completedAt)?fd(tp.completedAt-tp.startedAt):null;
          return(<Card key={t.id} style={{marginBottom:8,padding:12}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <TaskImage taskId={t.id} type="gorsel" size={48} fallbackEmoji={t.img}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:15,fontWeight:700}}>#{t.id} {t.title}</span>
                  <span style={{fontSize:12,padding:"2px 8px",borderRadius:5,background:T.ok+"20",color:T.ok,fontWeight:600}}>✓ Tamamlandı</span>
                  {dur&&<span style={{fontSize:12,color:T.cyan}}>⏱ {dur}</span>}
                  <span style={{fontSize:12,color:T.warn,fontWeight:600}}>+{t.xp} XP</span>
                </div>
                <div style={{fontSize:13,color:T.ts,marginBottom:6}}>{t.desc}</div>
                {t.learnings&&t.learnings.length>0&&<div>
                  <div style={{fontSize:11,color:T.pl,fontWeight:700,marginBottom:4}}>📚 KAZANIMLAR</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {t.learnings.map((lr,i)=><span key={i} style={{fontSize:12,padding:"3px 10px",borderRadius:5,background:T.purple+"22",color:T.pl,border:`1px solid ${T.purple}33`}}>{lr}</span>)}
                  </div>
                </div>}
              </div>
            </div>
          </Card>);
        })}
      </div>);
    })}
  </div>);
}

// ─── TAB 3: CV / SERTIFIKA ───
function ParentCVView({child,sp}){
  const completed=TASKS.filter(t=>sp[t.id]?.status===TS.APPROVED);
  const xp=completed.reduce((a,t)=>a+t.xp,0);
  const lv=getLevel(xp);
  let totalMs=0;
  completed.forEach(t=>{const tp=sp[t.id];if(tp.startedAt&&tp.completedAt)totalMs+=Math.max(0,tp.completedAt-tp.startedAt);});
  const allLearnings=[...new Set(completed.flatMap(t=>t.learnings||[]))];
  const cats=[...new Set(completed.map(t=>t.cat))];
  const today=new Date().toLocaleDateString("tr-TR",{day:"2-digit",month:"long",year:"numeric"});

  // Avg time per task
  const avgMin=completed.length>0?Math.round((totalMs/completed.length)/60000):0;
  // Difficulty stats
  const easyDone=completed.filter(t=>t.diff<=2).length;
  const medDone=completed.filter(t=>t.diff===3).length;
  const hardDone=completed.filter(t=>t.diff>=4).length;
  // Top categories
  const catCounts={};
  completed.forEach(t=>{catCounts[t.cat]=(catCounts[t.cat]||0)+1;});
  const topCats=Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);

  const handlePrint=()=>{window.print();};

  return(<div>
    <style>{`
      @media print {
        nav, .no-print { display: none !important; }
        body { background: #fff !important; }
        .cv-container { box-shadow: none !important; padding: 24px !important; max-width: 100% !important; }
      }
    `}</style>

    <div className="no-print" style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={handlePrint} style={{padding:"12px 24px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${T.orange},${T.od})`,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>🖨 Yazdır / PDF Olarak Kaydet</button>
      <span style={{fontSize:12,color:T.tm}}>"Yazdır" → Hedef: "PDF olarak kaydet" seç</span>
    </div>

    <div className="cv-container" style={{background:"#fff",color:"#1a1035",borderRadius:14,padding:36,fontFamily:"'Segoe UI',sans-serif",boxShadow:"0 8px 30px #0006",maxWidth:840,margin:"0 auto"}}>
      {/* HEADER */}
      <div style={{borderBottom:"4px double #6B3FA0",paddingBottom:16,marginBottom:20,display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,color:"#888",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Robotik Eğitim Sertifikası</div>
          <h1 style={{margin:0,fontSize:34,fontWeight:800,color:"#6B3FA0",letterSpacing:.5}}>{child.name}</h1>
          <div style={{fontSize:14,color:"#666",marginTop:6}}>📜 Tamamlanan Müfredat: BerryBot Robotik Programı</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:24,fontWeight:800,color:"#c96f10",letterSpacing:.5}}>🤖 RoboGPT</div>
          <div style={{fontSize:11,color:"#666",fontWeight:600}}>BERRYBOT ROBOTİK AKADEMİSİ</div>
          <div style={{fontSize:10,color:"#999",marginTop:4}}>{today}</div>
        </div>
      </div>

      {/* SUMMARY PARAGRAPH */}
      <div style={{padding:16,background:"linear-gradient(135deg,#f5f0ff,#fff5e6)",borderRadius:10,marginBottom:18,border:"1px solid #e0d0ff"}}>
        <div style={{fontSize:11,letterSpacing:2,color:"#6B3FA0",fontWeight:700,marginBottom:6}}>ÖZET</div>
        <div style={{fontSize:14,lineHeight:1.7,color:"#333"}}>
          <b>{child.name}</b>, BerryBot Robotik Akademisi'nin <b>36 görevlik</b> kapsamlı müfredatında 
          <b style={{color:"#c96f10"}}> {completed.length} görevi</b> başarıyla tamamlamıştır. 
          Bu süreçte <b>{xp} XP</b> kazanmış, <b>Level {lv.lv} ({lv.name})</b> seviyesine ulaşmıştır.
          {cats.length>0&&<> Eğitim boyunca <b>{cats.length} farklı disiplinde</b> deneyim kazanmış,
          özellikle {topCats.map(([c])=>`"${c}"`).join(", ")} kategorilerinde yoğunlaşmıştır.</>}
          {totalMs>0&&<> Toplamda <b>{fd(totalMs)}</b> aktif eğitim süresi tamamlamış,
          görev başına ortalama <b>{avgMin} dakika</b> harcamıştır.</>}
        </div>
      </div>

      {/* KEY METRICS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
        <div style={{padding:12,background:"#fff5e6",borderRadius:8,textAlign:"center",border:"1px solid #f5d99a"}}>
          <div style={{fontSize:26,fontWeight:800,color:"#c96f10"}}>{completed.length}<span style={{fontSize:14,color:"#888"}}>/36</span></div>
          <div style={{fontSize:10,color:"#666",fontWeight:600,letterSpacing:1}}>GÖREV</div>
        </div>
        <div style={{padding:12,background:"#fff0e6",borderRadius:8,textAlign:"center",border:"1px solid #f5b88a"}}>
          <div style={{fontSize:26,fontWeight:800,color:"#c96f10"}}>{xp}</div>
          <div style={{fontSize:10,color:"#666",fontWeight:600,letterSpacing:1}}>XP PUANI</div>
        </div>
        <div style={{padding:12,background:"#f5f0ff",borderRadius:8,textAlign:"center",border:"1px solid #d0c0ff"}}>
          <div style={{fontSize:26,fontWeight:800,color:"#6B3FA0"}}>Lv.{lv.lv}</div>
          <div style={{fontSize:10,color:"#666",fontWeight:600,letterSpacing:1}}>{lv.name.toUpperCase()}</div>
        </div>
        <div style={{padding:12,background:"#f0f8f0",borderRadius:8,textAlign:"center",border:"1px solid #c0e0c0"}}>
          <div style={{fontSize:26,fontWeight:800,color:"#22a55a"}}>{fd(totalMs)}</div>
          <div style={{fontSize:10,color:"#666",fontWeight:600,letterSpacing:1}}>EĞİTİM SÜRESİ</div>
        </div>
      </div>

      {/* DIFFICULTY BREAKDOWN */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:13,fontWeight:700,color:"#6B3FA0",marginBottom:8,paddingBottom:4,borderBottom:"1px solid #e0d0ff",letterSpacing:1}}>📊 ZORLUK ANALİZİ</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,fontSize:12}}>
          <div style={{padding:10,background:"#e6f7ed",borderRadius:6,textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:"#22a55a"}}>{easyDone}</div>
            <div style={{color:"#666"}}>Kolay (★★)</div>
          </div>
          <div style={{padding:10,background:"#fef3e6",borderRadius:6,textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:"#c96f10"}}>{medDone}</div>
            <div style={{color:"#666"}}>Orta (★★★)</div>
          </div>
          <div style={{padding:10,background:"#fde6e6",borderRadius:6,textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:"#c93030"}}>{hardDone}</div>
            <div style={{color:"#666"}}>Zor (★★★★+)</div>
          </div>
        </div>
      </div>

      {/* COMPETENCIES */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:13,fontWeight:700,color:"#6B3FA0",marginBottom:8,paddingBottom:4,borderBottom:"1px solid #e0d0ff",letterSpacing:1}}>🎯 KAZANILAN YETKİNLİKLER ({allLearnings.length})</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {allLearnings.length===0?<span style={{fontSize:12,color:"#888",fontStyle:"italic"}}>Henüz yetkinlik kazanılmadı</span>:
          allLearnings.map((lr,i)=><span key={i} style={{fontSize:11,padding:"4px 11px",borderRadius:5,background:"#f5f0ff",color:"#5a3580",border:"1px solid #d0c0ff",fontWeight:500}}>{lr}</span>)}
        </div>
      </div>

      {/* COMPLETED TASKS BY CATEGORY */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:13,fontWeight:700,color:"#6B3FA0",marginBottom:8,paddingBottom:4,borderBottom:"1px solid #e0d0ff",letterSpacing:1}}>✓ TAMAMLANAN GÖREVLER</div>
        {cats.length===0?<div style={{fontSize:12,color:"#888",fontStyle:"italic"}}>Henüz tamamlanmış görev yok</div>:
        cats.map(cat=>{
          const ct=completed.filter(t=>t.cat===cat);
          if(ct.length===0)return null;
          const catXP=ct.reduce((a,t)=>a+t.xp,0);
          return(<div key={cat} style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,fontWeight:700,color:"#c96f10"}}>{cat}</span>
              <span style={{fontSize:11,color:"#888"}}>{ct.length} görev • {catXP} XP</span>
            </div>
            <div style={{paddingLeft:14,fontSize:12,color:"#444",lineHeight:1.6}}>
              {ct.map(t=><span key={t.id}><b>#{t.id}</b> {t.title} <span style={{color:"#888",fontSize:10}}>(+{t.xp})</span>{t.id!==ct[ct.length-1].id?" • ":""}</span>)}
            </div>
          </div>);
        })}
      </div>

      {/* FOOTER / SIGNATURE */}
      <div style={{marginTop:30,paddingTop:14,borderTop:"4px double #6B3FA0",display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:11,color:"#666",marginBottom:2}}>Bu sertifika RoboGPT BerryBot Akademisi tarafından düzenlenmiştir.</div>
          <div style={{fontSize:10,color:"#999"}}>www.robogpt.com.tr</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:"#999"}}>Doğrulama Kodu</div>
          <div style={{fontSize:11,fontFamily:"monospace",color:"#666",fontWeight:700}}>BB-{child.id.toUpperCase()}-{Date.now().toString(36).toUpperCase().slice(-6)}</div>
        </div>
      </div>
    </div>
  </div>);
}