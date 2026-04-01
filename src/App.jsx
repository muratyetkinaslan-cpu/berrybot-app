import { useState, useEffect, useCallback, useRef } from "react";
import { useData, getLocalPhoto } from "./useData";

// ═══════════════════════════════════════════════════════════
//  BerryBot LMS — Production (Supabase)
//  Görseller: public/tasks/gorev_1/ ... gorev_36/
//  Her klasöre: gorsel.jpg, cevap.jpg
// ═══════════════════════════════════════════════════════════

const ROLES = { ADMIN:"admin", INSTRUCTOR:"instructor", STUDENT:"student" };
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

// ─── 36 TASKS ───
const TASKS=[
  {id:1,title:"RGB LED Yakma",cat:"RGB LED",diff:1,xp:10,img:"💡",desc:"Kırmızı, Yeşil, Mavi LED'leri ayrı ayrı yak.",answer:"Doğru blok: set_rgb(255,0,0)"},
  {id:2,title:"LED Renk Karışımı",cat:"RGB LED",diff:1,xp:10,img:"🌈",desc:"İki rengi karıştırarak yeni renk elde et.",answer:"set_rgb(255,255,0) → sarı"},
  {id:3,title:"LED Yanıp Sönme",cat:"RGB LED",diff:2,xp:15,img:"✨",desc:"LED'i 1 saniye aralıkla yanıp söndür.",answer:"while true: set_rgb → wait(1) → off → wait(1)"},
  {id:4,title:"Gökkuşağı Efekti",cat:"RGB LED",diff:2,xp:15,img:"🌈",desc:"Sırayla 7 rengi göster.",answer:"7 renk döngüsü"},
  {id:5,title:"SOS Sinyali",cat:"RGB LED",diff:3,xp:20,img:"🆘",desc:"Mors koduyla SOS sinyali gönder.",answer:"3 kısa, 3 uzun, 3 kısa"},
  {id:6,title:"Nefes Alan LED",cat:"RGB LED",diff:3,xp:20,img:"💫",desc:"LED parlaklığını yavaşça artır azalt.",answer:"for loop ile PWM"},
  {id:7,title:"Motor İleri Geri",cat:"Motor",diff:2,xp:15,img:"⚙️",desc:"Motoru ileri ve geri hareket ettir.",answer:"motor.forward() / motor.backward()"},
  {id:8,title:"Hız Kontrolü",cat:"Motor",diff:2,xp:15,img:"🏎️",desc:"Motor hızını kademeli artır.",answer:"speed değişkeni ile PWM"},
  {id:9,title:"Kare Çizme",cat:"Motor",diff:3,xp:25,img:"◻️",desc:"Robotla kare şekli çiz.",answer:"4x ileri+90° dönüş"},
  {id:10,title:"Buzzer Melodisi",cat:"Sensör+LED+Buzzer",diff:1,xp:10,img:"🔔",desc:"Buzzer ile basit melodi çal.",answer:"tone(freq, dur)"},
  {id:11,title:"Işık Sensörü Okuma",cat:"Sensör+LED+Buzzer",diff:2,xp:15,img:"☀️",desc:"Işık sensöründen değer oku ve göster.",answer:"light = ldr.read()"},
  {id:12,title:"Sıcaklık Alarmı",cat:"Sensör+LED+Buzzer",diff:2,xp:15,img:"🌡️",desc:"Sıcaklık eşik değeri geçince alarm ver.",answer:"if temp > 30: buzzer.on()"},
  {id:13,title:"Işık Takip Başlangıç",cat:"Işık Sensörü",diff:2,xp:15,img:"🔦",desc:"Işık kaynağına doğru dön.",answer:"LDR farkına göre motor yönlendir"},
  {id:14,title:"Işık Yoğunluk Haritası",cat:"Işık Sensörü",diff:3,xp:20,img:"🗺️",desc:"Ortamdaki ışık dağılımını LED ile göster.",answer:"LDR oku → RGB map"},
  {id:15,title:"IR Kumanda Okuma",cat:"IR Kumanda",diff:2,xp:15,img:"📡",desc:"IR kumandadan sinyal al ve göster.",answer:"ir.read() → serial"},
  {id:16,title:"Kumanda ile LED",cat:"IR Kumanda",diff:2,xp:15,img:"🎮",desc:"Kumanda tuşlarıyla LED rengini değiştir.",answer:"if key==1: red, key==2: green"},
  {id:17,title:"Kumanda ile Motor",cat:"IR Kumanda",diff:3,xp:25,img:"🕹️",desc:"Kumandayla robotu yönlendir.",answer:"key mapping → motor direction"},
  {id:18,title:"Fonksiyon Tanımlama",cat:"Fonksiyon",diff:2,xp:15,img:"📦",desc:"Tekrarlayan işlemi fonksiyon yap.",answer:"def my_func(): ..."},
  {id:19,title:"Mesafe Ölçme",cat:"Mesafe/Navigasyon",diff:2,xp:15,img:"📏",desc:"Ultrasonik sensörle mesafe ölç.",answer:"dist = ultrasonic.read()"},
  {id:20,title:"Otonom Navigasyon",cat:"Mesafe/Navigasyon",diff:4,xp:30,img:"🧭",desc:"Engellere çarpmadan ilerle.",answer:"if dist < 20: turn()"},
  {id:21,title:"Engel Algılama",cat:"Engel Algılama",diff:3,xp:20,img:"🚧",desc:"Önündeki engeli tespit et ve dur.",answer:"while dist > 15: forward()"},
  {id:22,title:"Engelden Kaçınma",cat:"Engel Algılama",diff:4,xp:30,img:"🔀",desc:"Engel varsa etrafından dolaş.",answer:"detect → turn → check → forward"},
  {id:23,title:"Çizgi Algılama",cat:"Çizgi Takip",diff:2,xp:15,img:"➖",desc:"Siyah çizgiyi sensörle algıla.",answer:"line = ir_sensor.read()"},
  {id:24,title:"Çizgi Takip Basit",cat:"Çizgi Takip",diff:3,xp:25,img:"〰️",desc:"Basit çizgi takip robotu yap.",answer:"if left: turn_right, if right: turn_left"},
  {id:25,title:"Kesişim Yönetimi",cat:"Çizgi Takip",diff:4,xp:30,img:"✖️",desc:"Çizgi kesişimlerinde doğru karar ver.",answer:"count intersections → decide"},
  {id:26,title:"Hızlı Çizgi Takip",cat:"Çizgi Takip",diff:5,xp:40,img:"⚡",desc:"PID kontrolle hızlı çizgi takip.",answer:"PID: error*Kp + integral*Ki + derivative*Kd"},
  {id:27,title:"Sumo Duruş",cat:"Sumo Robot",diff:2,xp:15,img:"🤼",desc:"Ring içinde kal, dışarı çıkma.",answer:"if edge: backward + turn"},
  {id:28,title:"Rakip Bulma",cat:"Sumo Robot",diff:3,xp:25,img:"🔍",desc:"Ultrasonik ile rakibi bul.",answer:"scan 360° → closest target"},
  {id:29,title:"Sumo Saldırı",cat:"Sumo Robot",diff:3,xp:25,img:"💥",desc:"Rakibi bul ve it.",answer:"detect → full speed forward"},
  {id:30,title:"Sumo Strateji",cat:"Sumo Robot",diff:4,xp:35,img:"🧠",desc:"Savunma ve saldırı stratejisi.",answer:"state machine: search/attack/defend"},
  {id:31,title:"Mini Sumo Turnuva",cat:"Sumo Robot",diff:4,xp:35,img:"🏆",desc:"Turnuva kurallarına uygun sumo robotu.",answer:"combine all sumo skills"},
  {id:32,title:"Sumo Şampiyonu",cat:"Sumo Robot",diff:5,xp:50,img:"👑",desc:"En iyi sumo stratejisini geliştir.",answer:"adaptive strategy"},
  {id:33,title:"Işık Kaynağı Bulma",cat:"Işık Takip",diff:3,xp:20,img:"💡",desc:"En parlak ışık kaynağına git.",answer:"compare LDRs → move toward max"},
  {id:34,title:"Işıktan Kaçınma",cat:"Işık Takip",diff:3,xp:20,img:"🌑",desc:"Karanlık bölgeye git.",answer:"move toward min light"},
  {id:35,title:"Işık Labirenti",cat:"Işık Takip",diff:4,xp:35,img:"🌟",desc:"Işık ipuçlarıyla labirentten çık.",answer:"follow light gradient"},
  {id:36,title:"Final Projesi",cat:"Işık Takip",diff:5,xp:50,img:"🎓",desc:"Tüm becerileri birleştiren proje.",answer:"combined autonomous robot"},
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
    rejectTask, resubmitTask, requestHelp, clearHelp, saveLayout, refresh } = data;

  const [page,setPage]=useState("dash");
  const [selS,setSelS]=useState(null);
  const [selT,setSelT]=useState(null);
  const [notif,setNotif]=useState(null);

  const notify=(m,t="ok")=>{setNotif({m,t});setTimeout(()=>setNotif(null),3000);};
  const nav=(p)=>{setPage(p);setSelS(null);setSelT(null);};

  const handleLogin=async(e,p)=>{
    const u=await doLogin(e,p);
    if(u){setPage("dash");return true;}
    return false;
  };

  const handleStartTask=(sId,tId)=>{startTask(sId,tId);};
  const handleSubmitTask=(sId,tId,photo)=>{submitTask(sId,tId,photo);notify("Fotoğraf yüklendi! Onay bekleniyor.");};
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
          {user.role===ROLES.INSTRUCTOR&&<><NBtn a={page==="dash"} o={()=>nav("dash")}>Panel</NBtn><NBtn a={page==="pend"} o={()=>nav("pend")}>Onay Bekleyenler</NBtn><NBtn a={page==="tasks"} o={()=>nav("tasks")}>Görev+Cevap</NBtn></>}
          {user.role===ROLES.STUDENT&&<NBtn a={page==="dash"} o={()=>nav("dash")}>Görevlerim</NBtn>}
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
        {user.role===ROLES.ADMIN&&page==="users"&&<UserManager users={users} onAddUser={addUser}/>}
        {user.role===ROLES.ADMIN&&page==="audit"&&<AuditLog logs={logs} users={users}/>}
        {user.role===ROLES.ADMIN&&page==="tasks"&&<TaskBrowser showAns={false}/>}

        {/* ──── INSTRUCTOR ──── */}
        {user.role===ROLES.INSTRUCTOR&&page==="dash"&&<InstructorDash user={user} users={users} prog={prog} onClearHelp={handleClearHelp} onSel={s=>{setSelS(s);setPage("sdi");}}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="sdi"&&selS&&<StudentDetail s={selS} prog={prog} users={users} canReview onApprove={handleApprove} onReject={handleReject} onBack={()=>nav("dash")}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="pend"&&<PendingReviews user={user} users={users} prog={prog} onApprove={handleApprove} onReject={handleReject}/>}
        {user.role===ROLES.INSTRUCTOR&&page==="tasks"&&<TaskBrowser showAns/>}

        {/* ──── STUDENT ──── */}
        {user.role===ROLES.STUDENT&&!selT&&<MissionBoard user={user} prog={prog} onSel={setSelT} onHelp={()=>handleHelp(user.id)}/>}
        {user.role===ROLES.STUDENT&&selT&&<StudentTaskView user={user} task={selT} prog={prog} onStart={()=>handleStartTask(user.id,selT.id)} onSubmit={p=>handleSubmitTask(user.id,selT.id,p)} onResub={()=>handleResubmit(user.id,selT.id)} onHelp={()=>handleHelp(user.id)} onBack={()=>setSelT(null)}/>}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════
function LoginPage({onLogin}){
  const[e,setE]=useState("");const[p,setP]=useState("");const[err,setErr]=useState("");
  return(<div style={{background:`linear-gradient(135deg,${T.bg},#2a1050)`,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:420,maxWidth:"92vw"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,color:T.orange,marginBottom:8}}><I.Bot/><span style={{fontWeight:800,fontSize:32}}>BerryBot</span></div>
        <div style={{fontSize:16,color:T.ts}}>Robotik Eğitim Takip Sistemi</div>
      </div>
      <Card>
        <input type="email" placeholder="E-posta" value={e} onChange={x=>setE(x.target.value)} style={{width:"100%",padding:"14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:16,outline:"none",marginBottom:10,boxSizing:"border-box"}}/>
        <input type="password" placeholder="Şifre" value={p} onChange={x=>setP(x.target.value)} onKeyDown={x=>x.key==="Enter"&&(onLogin(e,p)||setErr("Hatalı!"))} style={{width:"100%",padding:"14px",borderRadius:10,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:16,outline:"none",boxSizing:"border-box"}}/>
        {err&&<div style={{fontSize:14,marginTop:8,padding:"8px",borderRadius:8,background:"#5c1a1a",color:"#fca5a5"}}>{err}</div>}
        <button onClick={()=>onLogin(e,p)||setErr("Hatalı giriş!")} style={{width:"100%",marginTop:14,padding:"14px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${T.orange},${T.od})`,color:"#fff",fontSize:18,fontWeight:700,cursor:"pointer"}}>Giriş Yap</button>
      </Card>
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
      <div onClick={()=>setSeatPicker(null)} style={{position:"fixed",inset:0,zIndex:50,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:16,width:300}}>
          <div style={{fontSize:14,fontWeight:700,color:T.orange,marginBottom:10}}>Koltuğa Öğrenci Ata</div>
          {currentSid&&<button onClick={()=>clearSeat(seatPicker.tableId,seatPicker.seatIdx)} style={{width:"100%",padding:"8px",borderRadius:8,border:`1px solid ${T.err}44`,background:T.err+"15",color:T.err,cursor:"pointer",fontSize:12,marginBottom:8}}>🚫 Koltuğu Boşalt</button>}
          {available.length===0&&<div style={{padding:12,textAlign:"center",color:T.tm,fontSize:12}}>Atanacak öğrenci yok</div>}
          {available.map(s=>(
            <button key={s.id} onClick={()=>assignSeat(seatPicker.tableId,seatPicker.seatIdx,s.id)} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${s.id===currentSid?T.orange+"66":T.border}`,background:s.id===currentSid?T.orange+"20":T.dark,color:T.tp,cursor:"pointer",fontSize:12,marginBottom:4,textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:T.orange+"20",color:T.orange,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,flexShrink:0}}>{s.name[0]}</div>
              <div><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:9,color:T.tm}}>{s.email}</div></div>
            </button>
          ))}
          <button onClick={()=>setSeatPicker(null)} style={{width:"100%",marginTop:8,padding:"6px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.ts,cursor:"pointer",fontSize:12}}>İptal</button>
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

  return(<div>
    {/* LEVEL HEADER */}
    <Card style={{marginBottom:18,background:`linear-gradient(135deg,${T.purple}40,${T.orange}20)`,border:`1px solid ${T.orange}44`}}>
      <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{width:64,height:64,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,background:T.orange+"20",border:`3px solid ${T.orange}88`}}>{lv.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:22,fontWeight:800,color:T.orange}}>Level {lv.lv} <span style={{fontSize:16,color:T.pl}}>{lv.name}</span></div>
          <div style={{fontSize:15,fontWeight:700,color:T.ol}}>{xp} XP {nlv&&<span style={{fontSize:13,color:T.tm}}>→ {nlv.icon} {nlv.name} ({nlv.min})</span>}</div>
          <div style={{width:"100%",height:10,borderRadius:5,background:T.border,overflow:"hidden",marginTop:6}}>
            <div style={{height:"100%",borderRadius:5,background:`linear-gradient(90deg,${T.orange},${T.pl})`,width:`${nlv?((xp-lv.min)/(nlv.min-lv.min))*100:100}%`}}/>
          </div>
        </div>
        <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:T.orange}}>{cnt}<span style={{fontSize:16,color:T.tm}}>/36</span></div></div>
        <button onClick={onHelp} style={{padding:"12px 22px",borderRadius:12,border:`3px solid ${T.err}66`,background:T.err+"15",color:T.err,cursor:"pointer",fontWeight:800,fontSize:16,display:"flex",alignItems:"center",gap:6}}><I.Hand/> Eğitmeni Çağır</button>
      </div>
    </Card>

    {/* MISSION CARDS */}
    {cats.map(cat=>{
      const ct=TASKS.filter(t=>t.cat===cat);const cd=ct.filter(t=>sp[t.id]?.status===TS.APPROVED).length;
      return(<div key={cat} style={{marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <span style={{fontSize:15,fontWeight:800,color:T.orange,padding:"4px 14px",background:T.orange+"15",borderRadius:8}}>{cat}</span>
          <div style={{flex:1,height:2,background:T.border}}/><span style={{fontSize:13,color:cd===ct.length?T.ok:T.ts,fontWeight:600}}>{cd}/{ct.length}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12}}>
          {ct.map(t=>{
            const s=sp[t.id]?.status||TS.LOCKED;const locked=s===TS.LOCKED;const approved=s===TS.APPROVED;const active=s===TS.ACTIVE||s===TS.IN_PROGRESS;
            const glow=active?T.orange:s===TS.PENDING?T.pl:s===TS.REJECTED?T.err:approved?T.ok:"transparent";
            const started=sp[t.id]?.startedAt;const completed=sp[t.id]?.completedAt||sp[t.id]?.approvedAt;
            const dur=(started&&completed)?fd(completed-started):null;
            return(
              <div key={t.id} onClick={()=>!locked&&onSel(t)} style={{borderRadius:16,cursor:locked?"not-allowed":"pointer",opacity:locked?.35:1,background:T.card,border:`2px solid ${locked?T.border:glow}44`,boxShadow:active?`0 0 20px ${T.orange}22`:"none",overflow:"hidden",position:"relative"}}>
                <div style={{height:90,position:"relative",overflow:"hidden"}}>
                  <TaskImage taskId={t.id} type="gorsel" size={999} fallbackEmoji={t.img} style={{width:"100%",height:90,borderRadius:0}}/>
                  {approved&&<div style={{position:"absolute",top:6,right:6,width:26,height:26,borderRadius:"50%",background:T.ok,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700}}>✓</div>}
                  {active&&<div style={{position:"absolute",top:6,left:6,width:10,height:10,borderRadius:"50%",background:T.orange,boxShadow:`0 0 10px ${T.orange}`}}/>}
                  <div style={{position:"absolute",top:6,left:active?20:6,fontSize:13,fontWeight:800,color:T.tp,background:"#000a",padding:"2px 8px",borderRadius:6}}>#{t.id}</div>
                </div>
                <div style={{padding:"10px 12px"}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <Badge s={s}/>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:13,color:T.warn,fontWeight:600}}>+{t.xp}</span>
                      <Stars n={t.diff}/>
                    </div>
                  </div>
                  {dur&&<div style={{marginTop:5,fontSize:12,color:T.ok,display:"flex",alignItems:"center",gap:4}}><I.Clock/> {dur}</div>}
                </div>
                {locked&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#1a103580"}}><span style={{fontSize:28}}>🔒</span></div>}
              </div>
            );
          })}
        </div>
      </div>);
    })}
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

  // Handle photo upload from file input or camera
  const handlePhotoUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      setPhoto(ev.target.result);
      setPhotoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
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
        <div style={{fontSize:16,fontWeight:700,color:T.ts,marginBottom:10}}>📸 Görev Fotoğrafı Yükle</div>
        <div style={{fontSize:14,color:T.tm,marginBottom:12}}>Robotunu veya ekranını fotoğrafla ve buraya yükle.</div>

        {/* Photo preview */}
        {photoPreview&&<div style={{marginBottom:12,borderRadius:12,overflow:"hidden",border:`2px solid ${T.ok}44`,position:"relative"}}>
          <img src={photoPreview} alt="Yüklenen fotoğraf" style={{width:"100%",maxHeight:300,objectFit:"contain",background:T.dark}}/>
          <button onClick={()=>{setPhoto(null);setPhotoPreview(null);}} style={{position:"absolute",top:8,right:8,padding:"4px 12px",borderRadius:8,border:"none",background:"#000a",color:T.err,cursor:"pointer",fontSize:13,fontWeight:600}}>✕ Kaldır</button>
        </div>}

        {/* File input — accepts images, also camera on mobile */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <label style={{padding:"12px 24px",borderRadius:12,border:`2px dashed ${T.orange}55`,background:T.orange+"10",color:T.orange,cursor:"pointer",fontWeight:700,fontSize:16,display:"inline-flex",alignItems:"center",gap:8}}>
            📷 Fotoğraf Seç
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{display:"none"}}/>
          </label>

          {photo&&<button onClick={()=>onSubmit(photo)} style={{padding:"12px 28px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${T.ok},#22a55a)`,color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,boxShadow:`0 4px 16px ${T.ok}44`}}>
            ✓ Fotoğrafı Gönder & Onay İste
          </button>}
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
      <div style={{fontSize:14,color:T.tm,marginTop:6}}>Fotoğrafın gönderildi. Eğitmenin incelemesini bekle.</div>
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
function UserManager({users,onAddUser}){
  const[showForm,setShowForm]=useState(false);
  const[name,setName]=useState("");const[email,setEmail]=useState("");const[pw,setPw]=useState("");
  const[role,setRole]=useState("student");const[grup,setGrup]=useState("Büyük");
  const[busy,setBusy]=useState(false);const[msg,setMsg]=useState(null);

  const handleAdd=async()=>{
    if(!name.trim()||!email.trim()||!pw.trim()){setMsg("Tüm alanları doldur!");return;}
    setBusy(true);setMsg(null);
    const u=await onAddUser({name:name.trim(),email:email.trim(),password:pw.trim(),role,grup});
    setBusy(false);
    if(u){setMsg("✓ Kullanıcı oluşturuldu!");setName("");setEmail("");setPw("");}
    else setMsg("Hata! Email zaten kayıtlı olabilir.");
  };

  const students=users.filter(u=>u.role==="student");
  const instructors=users.filter(u=>u.role==="instructor");
  const admins=users.filter(u=>u.role==="admin");

  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <h1 style={{fontSize:20,fontWeight:800,color:T.orange,margin:0}}>👥 Kullanıcı Yönetimi</h1>
      <button onClick={()=>setShowForm(!showForm)} style={{fontSize:13,padding:"8px 18px",borderRadius:10,border:`1px solid ${T.ok}44`,background:T.ok+"15",color:T.ok,cursor:"pointer",fontWeight:700}}>{showForm?"✕ Kapat":"+ Kullanıcı Ekle"}</button>
    </div>

    {showForm&&<Card style={{marginBottom:16,borderColor:T.ok+"44"}}>
      <div style={{fontSize:16,fontWeight:700,color:T.ok,marginBottom:12}}>Yeni Kullanıcı</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ad Soyad" style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}/>
        <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="Şifre" style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}/>
        <select value={role} onChange={e=>setRole(e.target.value)} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}>
          <option value="student">Öğrenci</option><option value="instructor">Eğitmen</option>
        </select>
        {role==="student"&&<select value={grup} onChange={e=>setGrup(e.target.value)} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.input,color:T.tp,fontSize:14,outline:"none"}}>
          <option value="Büyük">Büyük</option><option value="Kids">Kids</option>
        </select>}
      </div>
      <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
        <button onClick={handleAdd} disabled={busy} style={{padding:"10px 24px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${T.ok},#22a55a)`,color:"#fff",fontSize:14,fontWeight:700,cursor:busy?"wait":"pointer"}}>{busy?"Oluşturuluyor...":"✓ Oluştur"}</button>
        {msg&&<span style={{fontSize:13,color:msg.startsWith("✓")?T.ok:T.err}}>{msg}</span>}
      </div>
    </Card>}

    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
      <Card style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:T.orange}}>{students.length}</div><div style={{fontSize:13,color:T.ts}}>Öğrenci</div></Card>
      <Card style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:T.pl}}>{instructors.length}</div><div style={{fontSize:13,color:T.ts}}>Eğitmen</div></Card>
      <Card style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:T.ok}}>{admins.length}</div><div style={{fontSize:13,color:T.ts}}>Admin</div></Card>
    </div>

    {/* Instructor list */}
    <div style={{fontSize:15,fontWeight:700,color:T.pl,marginBottom:8}}>Eğitmenler</div>
    <Card style={{marginBottom:16}}>
      {instructors.map(u=><div key={u.id} style={{padding:"8px 0",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:14,fontWeight:600}}>{u.name}</div><div style={{fontSize:12,color:T.tm}}>{u.email}</div></div>
      </div>)}
      {instructors.length===0&&<div style={{padding:12,color:T.tm,fontSize:13}}>Eğitmen yok</div>}
    </Card>

    {/* Student list */}
    <div style={{fontSize:15,fontWeight:700,color:T.orange,marginBottom:8}}>Öğrenciler ({students.length})</div>
    <Card>
      <div style={{maxHeight:400,overflowY:"auto"}}>
        {students.map((u,i)=><div key={u.id} style={{padding:"6px 0",borderBottom:`1px solid ${T.border}22`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:T.tm,width:24,textAlign:"right"}}>{i+1}.</span>
            <div><div style={{fontSize:13,fontWeight:600}}>{u.name}</div><div style={{fontSize:11,color:T.tm}}>{u.email}</div></div>
          </div>
          <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:u.grup==="Kids"?T.cyan+"20":T.orange+"20",color:u.grup==="Kids"?T.cyan:T.orange}}>{u.grup||"Büyük"}</span>
        </div>)}
      </div>
    </Card>
  </div>);
}