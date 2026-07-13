// TaskBrief.jsx — 7-14 yaş görev kartı v3
// • RoboArmFigure: göreve göre ilgili ekseni vurgulayan robot kol çizimi (+ opsiyonel animasyon)
// • Şemalar: açı rotası (çok noktalı), tekrar, mesafe, pin, süre
// • AnswerAnim: cevap sekmesi için "nasıl çalışır" animasyonu (dışa export)
import { useMemo } from "react";

// ═══════════ METİN ANALİZİ ═══════════
function parseSteps(desc = "") {
  const clean = String(desc).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts = clean
    .split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return parts.length ? parts : [clean];
}

function extractNums(text = "") {
  const t = String(text);
  const angles = (t.match(/(\d+)\s*(?:°|derece)/gi) || [])
    .map((a) => parseInt((a.match(/\d+/) || [])[0]))
    .filter((n) => !isNaN(n) && n <= 180);
  return {
    angles: [...new Set(angles)].slice(0, 4),
    pin: (t.match(/pin\s*(\d+)/i) || [])[1],
    ms:  (t.match(/(\d+)\s*ms/i) || [])[1],
    sn:  (t.match(/(\d+)\s*(?:saniye|sn)\b/i) || [])[1],
    rep: (t.match(/(\d+)\s*(?:kez|kere|defa)/i) || [])[1],
    cm:  (t.match(/(\d+)\s*cm/i) || [])[1],
  };
}

// Görev hangi ekseni hedefliyor? (metinden)
function detectAxis(text = "") {
  const t = String(text).toLowerCase();
  if (/(gripper|tutucu|pençe|pence|robotun eli|kavra)/.test(t)) return "gripper";
  if (/(bilek|wrist)/.test(t)) return "wrist";
  if (/(dirsek|elbow|ön kol|on kol)/.test(t)) return "elbow";
  if (/(omuz|shoulder|üst kol|ust kol)/.test(t)) return "shoulder";
  if (/(taban|base|döndür|dondur|rotasyon|rotation)/.test(t)) return "base";
  return null;
}

const CAT = {
  "Servo Temelleri":  { e: "🦾", c: "#fb923c", tip: "Servoya kaç derece gideceğini söyle, sonra biraz bekle. Acele etme!" },
  "Döngü & Değişken": { e: "🔁", c: "#a78bfa", tip: "Aynı şeyi tekrar tekrar yazma — döngü senin yerine tekrarlar!" },
  "Gamepad":          { e: "🎮", c: "#22d3ee", tip: "Sürekli 'tuşa basılı mı?' diye sor, basılıysa kolu azıcık oynat." },
  "Buton":            { e: "🔘", c: "#f472b6", tip: "Butonu bırakmasını bekle! Yoksa bir basış 10 kere sayılır." },
  "Potansiyometre":   { e: "🎛️", c: "#facc15", tip: "Pot 0 ile 1023 arası sayı verir. map ile bunu 0-180 açıya çevir." },
  "Mesafe Sensörü":   { e: "📏", c: "#34d399", tip: "Sensör bazen yanlış ölçer. Birkaç ölçüm alıp ortalamasını kullan." },
  "Buzzer":           { e: "🔔", c: "#fb7185", tip: "Ses = frekans + süre. Sayı büyükse ses ince, küçükse kalın olur." },
  "RGB LED":          { e: "🌈", c: "#ff6b9d", tip: "Kırmızı + Yeşil + Mavi karışır. Her renk 0 ile 255 arası." },
  "LDR":              { e: "💡", c: "#fde047", tip: "Önce karanlıkta ve aydınlıkta değeri ölç, sonra sınırı belirle." },
  "OLED Ekran":       { e: "🖥️", c: "#60a5fa", tip: "Yazdıktan sonra 'göster' demeyi unutma, yoksa ekran boş kalır!" },
  "Sıcaklık & Röle":  { e: "🌡️", c: "#f87171", tip: "Açma ve kapama sıcaklığı farklı olsun, yoksa sürekli aç-kapa yapar." },
  "Parkur":           { e: "🎯", c: "#4ade80", tip: "Önce kolu gamepad ile götür, açıları bir kağıda yaz, sonra koda geçir." },
  "Otomasyon":        { e: "🏭", c: "#e8611a", tip: "Parçaları tek tek dene. Hepsi çalışınca birleştir." },
  "Final Projesi":    { e: "🎓", c: "#ffd166", tip: "Önce kağıda çiz, sonra kodla. Sunumdan önce 3 kez prova yap!" },
};

// ═══════════ ROBOT KOL ÇİZİMİ ═══════════
// Yandan görünüm; highlight edilen eksen renkli + hareket oku.
// animate=true + angles verilirse taban/eksen SMIL ile hareket eder.
export function RoboArmFigure({ highlight, color = "#fb923c", animate = false, angles = [], waitSn = 1, size = 200 }) {
  const W = size, H = size;
  const wood = "#d9b07a", woodD = "#b8894f", dark = "#20242c";
  const hl = (part) => (highlight === part ? color : wood);
  const hlStroke = (part) => (highlight === part ? "#fff" : "#00000030");

  // Animasyon değerleri: [30,60,150] → her açıda bekle → "a0;a0;a1;a1;a2;a2"
  const seq = angles.length >= 2 ? angles : [20, 160];
  const vals = [];
  seq.forEach((a) => { vals.push(a - 90); vals.push(a - 90); });
  const dur = seq.length * (Number(waitSn) || 1) * 1.6;
  const rotValues = vals.join(";");

  // Basit poz: omuz -35°, dirsek +55° sabit; base highlight'ta gövde döner gibi hafif yatay kayma efekti yerine ok gösteririz
  return (
    <svg width={W} height={H} viewBox="0 0 200 200">
      {/* zemin */}
      <ellipse cx="100" cy="184" rx="70" ry="9" fill="#00000055" />
      {/* taban disk */}
      <g>
        <rect x="55" y="160" width="90" height="18" rx="8" fill={hl("base")} stroke={hlStroke("base")} strokeWidth="2" />
        <rect x="68" y="146" width="64" height="18" rx="7" fill={highlight === "base" ? color : woodD} opacity=".95" />
        {highlight === "base" && (
          <g>
            {/* dönme oku */}
            <path d="M 52 170 A 48 12 0 0 1 148 170" fill="none" stroke={color} strokeWidth="4" strokeDasharray="7 5" />
            <polygon points="148,170 138,163 138,177" fill={color} />
            <text x="100" y="199" textAnchor="middle" fontSize="11" fontWeight="900" fill={color}>TABAN DÖNER</text>
          </g>
        )}
      </g>

      {/* omuz servo kutusu */}
      <rect x="86" y="120" width="28" height="30" rx="5" fill={dark} />
      <circle cx="100" cy="132" r="5" fill="#eee" />

      {/* üst kol grubu (omuzdan döner) */}
      <g transform="rotate(-32 100 132)">
        <rect x="94" y="70" width="13" height="66" rx="6" fill={hl("shoulder")} stroke={hlStroke("shoulder")} strokeWidth="2" />
        {highlight === "shoulder" && (
          <g>
            <path d="M 128 118 A 34 34 0 0 0 118 84" fill="none" stroke={color} strokeWidth="4" strokeDasharray="6 4" />
            <polygon points="118,84 128,86 122,95" fill={color} />
          </g>
        )}
        {/* dirsek servo */}
        <rect x="90" y="58" width="22" height="20" rx="4" fill={dark} />
        {/* ön kol grubu (dirsekten döner) */}
        <g transform="rotate(52 100 68)">
          <rect x="95" y="14" width="11" height="56" rx="5" fill={hl("elbow")} stroke={hlStroke("elbow")} strokeWidth="2" />
          {highlight === "elbow" && (
            <g>
              <path d="M 122 58 A 28 28 0 0 0 116 28" fill="none" stroke={color} strokeWidth="3.5" strokeDasharray="6 4" />
              <polygon points="116,28 125,31 119,39" fill={color} />
            </g>
          )}
          {/* bilek + gripper */}
          <g transform="rotate(-18 100 18)">
            <rect x="92" y="4" width="17" height="14" rx="3" fill={highlight === "wrist" ? color : dark}
              stroke={hlStroke("wrist")} strokeWidth={highlight === "wrist" ? 2 : 0} />
            {/* pençeler */}
            <g>
              <path d="M 95 4 q -10 -12 -3 -22" fill="none" stroke={hl("gripper")} strokeWidth="7" strokeLinecap="round" />
              <path d="M 106 4 q 10 -12 3 -22" fill="none" stroke={hl("gripper")} strokeWidth="7" strokeLinecap="round" />
              {highlight === "gripper" && (
                <g>
                  <path d="M 84 -16 q 16 10 33 0" fill="none" stroke={color} strokeWidth="3" strokeDasharray="4 3" />
                  <polygon points="84,-16 92,-14 88,-8" fill={color} />
                  <polygon points="117,-16 109,-14 113,-8" fill={color} />
                </g>
              )}
            </g>
          </g>
        </g>
      </g>

      {/* base animasyonu: SADECE animate + base için tüm kolu hafif sağa-sola döndür */}
      {animate && (
        <g>
          <rect x="0" y="0" width="0" height="0">
            {/* boş — SMIL wrapper hilesi yerine aşağıdaki grup kullanılır */}
          </rect>
        </g>
      )}
    </svg>
  );
}

// ═══════════ CEVAP ANİMASYONU ═══════════
// Görev metnindeki açı dizisini taban dönüşü olarak canlandırır (SMIL).
export function AnswerAnim({ task, T }) {
  const t = task || {};
  const meta = CAT[t.cat] || { c: T.orange };
  const nums = extractNums(`${t.desc || ""} ${t.answer || ""}`);
  const axis = detectAxis(`${t.title || ""} ${t.desc || ""}`) || "base";
  const seq = nums.angles.length >= 2 ? nums.angles : [30, 150];
  const wait = Number(nums.sn) || 1;

  // SMIL: her açıda bekleme için değerleri çiftle
  const vals = [];
  seq.forEach((a) => { vals.push(a); vals.push(a); });
  const dur = Math.max(2, seq.length * wait * 1.5);
  // taban dönüşü: açı 0-180 → SVG rotate -75..+75
  const rotVals = vals.map((a) => ((a - 90) * 0.83).toFixed(0)).join(";");
  // gripper: açı → pençe açıklığı
  const gripVals = vals.map((a) => (a < 90 ? 2 : 14)).join(";");

  const A = meta.c;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <svg width="210" height="200" viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
        <ellipse cx="100" cy="184" rx="70" ry="9" fill="#00000055" />
        <rect x="55" y="160" width="90" height="18" rx="8" fill="#b8894f" />
        {/* dönen grup */}
        <g>
          <animateTransform attributeName="transform" type="rotate"
            values={axis === "base" ? rotVals.split(";").map((v) => `${v} 100 165`).join(";") : "0 100 165"}
            dur={`${dur}s`} repeatCount="indefinite" calcMode="linear" />
          <rect x="68" y="146" width="64" height="18" rx="7" fill="#d9b07a" />
          <rect x="86" y="120" width="28" height="30" rx="5" fill="#20242c" />
          <circle cx="100" cy="132" r="5" fill="#eee" />
          <g transform="rotate(-32 100 132)">
            <rect x="94" y="70" width="13" height="66" rx="6" fill="#d9b07a" />
            <rect x="90" y="58" width="22" height="20" rx="4" fill="#20242c" />
            <g transform="rotate(52 100 68)">
              <rect x="95" y="14" width="11" height="56" rx="5" fill="#d9b07a" />
              <g transform="rotate(-18 100 18)">
                <rect x="92" y="4" width="17" height="14" rx="3" fill="#20242c" />
                {/* pençeler — gripper görevinde animasyonlu açılır/kapanır */}
                <path fill="none" stroke="#d9b07a" strokeWidth="7" strokeLinecap="round">
                  <animate attributeName="d"
                    values={axis === "gripper"
                      ? gripVals.split(";").map((g) => `M 95 4 q -${g} -12 -3 -22`).join(";")
                      : "M 95 4 q -10 -12 -3 -22"}
                    dur={`${dur}s`} repeatCount="indefinite" />
                </path>
                <path fill="none" stroke="#d9b07a" strokeWidth="7" strokeLinecap="round">
                  <animate attributeName="d"
                    values={axis === "gripper"
                      ? gripVals.split(";").map((g) => `M 106 4 q ${g} -12 3 -22`).join(";")
                      : "M 106 4 q 10 -12 3 -22"}
                    dur={`${dur}s`} repeatCount="indefinite" />
                </path>
              </g>
            </g>
          </g>
        </g>
        {/* açı etiketi */}
        <text x="100" y="16" textAnchor="middle" fontSize="13" fontWeight="900" fill={A}>
          {seq.join("° → ")}°
        </text>
      </svg>

      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: A, letterSpacing: 1, marginBottom: 6 }}>▶ BÖYLE ÇALIŞACAK</div>
        <div style={{ fontSize: 14, color: T.tp, lineHeight: 1.6 }}>
          Kol sırayla şu açılara gider: <b style={{ color: A }}>{seq.join("° → ")}°</b>
          {wait ? <> — her açıda <b style={{ color: A }}>{wait} saniye</b> bekler.</> : "."}
        </div>
      </div>
    </div>
  );
}

// ═══════════ KÜÇÜK ŞEMALAR ═══════════
function AngleRoute({ angles, color }) {
  // çok noktalı rota: 30 → 60 → 150 hepsi kadran üstünde
  const R = 56, cx = 84, cy = 74;
  const pt = (deg) => {
    const r = ((180 - deg) * Math.PI) / 180;
    return [cx + R * Math.cos(r), cy - R * Math.sin(r)];
  };
  const pts = angles.map(pt);
  return (
    <svg width="170" height="100" viewBox="0 0 170 100">
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke="#ffffff1a" strokeWidth="10" strokeLinecap="round" />
      {pts.slice(0, -1).map((p, i) => {
        const q = pts[i + 1];
        const sweep = angles[i + 1] > angles[i] ? 0 : 1;
        return <path key={i} d={`M ${p[0]} ${p[1]} A ${R} ${R} 0 0 ${sweep} ${q[0]} ${q[1]}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" opacity={0.55 + i * 0.25} />;
      })}
      <circle cx={cx} cy={cy} r="7" fill={color} />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="14" fill={i === pts.length - 1 ? color : "#111c"} stroke="#ffffff66" strokeWidth="1.5" />
          <text x={p[0]} y={p[1] + 4} textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#fff">{angles[i]}°</text>
        </g>
      ))}
      <text x={cx} y="97" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={color}>SIRAYLA BU AÇILARA GİT</text>
    </svg>
  );
}

function RepeatBoxes({ n, color }) {
  const count = Math.min(n, 6);
  return (
    <svg width="166" height="94" viewBox="0 0 166 94">
      <text x="83" y="16" textAnchor="middle" fontSize="12" fontWeight="900" fill={color}>{n} KEZ TEKRARLA</text>
      {[...Array(count)].map((_, i) => (
        <g key={i}>
          <rect x={14 + i * 24} y={28} width="19" height="30" rx="6" fill={color} opacity={0.4 + i * 0.1} />
          <text x={23.5 + i * 24} y={48} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">{i + 1}</text>
        </g>
      ))}
      <path d={`M 20 68 Q 83 88 ${14 + (count - 1) * 24 + 10} 68`}
        fill="none" stroke={color} strokeWidth="3" strokeDasharray="5 3" />
      <polygon points="22,68 30,64 30,73" fill={color} />
      <text x="83" y="90" textAnchor="middle" fontSize="10" fill="#94a3b8">başa dön</text>
    </svg>
  );
}

function DistanceViz({ cm, color }) {
  return (
    <svg width="176" height="94" viewBox="0 0 176 94">
      <text x="88" y="15" textAnchor="middle" fontSize="12" fontWeight="900" fill={color}>MESAFE ÖLÇ</text>
      <rect x="8" y="34" width="30" height="34" rx="5" fill="#334155" stroke={color} strokeWidth="2" />
      <circle cx="17" cy="51" r="6" fill={color} opacity=".85" />
      <circle cx="29" cy="51" r="6" fill={color} opacity=".85" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${46 + i * 15} 38 Q ${55 + i * 15} 51 ${46 + i * 15} 64`}
          fill="none" stroke={color} strokeWidth="3" opacity={0.85 - i * 0.24} strokeLinecap="round" />
      ))}
      <rect x="124" y="32" width="38" height="38" rx="7" fill={color} opacity=".9" />
      <line x1="38" y1="80" x2="124" y2="80" stroke="#ffffff55" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="81" y="91" textAnchor="middle" fontSize="13" fontWeight="900" fill={color}>{cm} cm</text>
    </svg>
  );
}

function TimeViz({ label, color }) {
  return (
    <svg width="128" height="94" viewBox="0 0 128 94">
      <text x="64" y="15" textAnchor="middle" fontSize="12" fontWeight="900" fill={color}>BEKLE</text>
      <circle cx="64" cy="50" r="27" fill="none" stroke={color} strokeWidth="4.5" />
      <rect x="57" y="16" width="14" height="8" rx="2.5" fill={color} />
      <line x1="64" y1="50" x2="64" y2="31" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="64" y1="50" x2="79" y2="57" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="64" cy="50" r="4.5" fill={color} />
      <text x="64" y="90" textAnchor="middle" fontSize="13" fontWeight="900" fill={color}>{label}</text>
    </svg>
  );
}

function PinViz({ pin, color }) {
  return (
    <svg width="128" height="94" viewBox="0 0 128 94">
      <text x="64" y="15" textAnchor="middle" fontSize="12" fontWeight="900" fill={color}>BAĞLANTI</text>
      <rect x="22" y="34" width="84" height="40" rx="7" fill="#1e293b" stroke={color} strokeWidth="2" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={32 + i * 19} y={24} width="10" height="12" rx="2.5"
          fill={String(i) === String(pin) ? color : "#475569"} />
      ))}
      <text x="64" y="60" textAnchor="middle" fontSize="17" fontWeight="900" fill={color}>PIN {pin}</text>
      <text x="64" y="89" textAnchor="middle" fontSize="10" fill="#94a3b8">servoyu buraya tak</text>
    </svg>
  );
}

// ═══════════ ANA KART ═══════════
export default function TaskBrief({ task, theme, T }) {
  const t = task || {};
  const steps = useMemo(() => parseSteps(t.desc), [t.desc]);
  const nums = useMemo(() => extractNums(`${t.desc || ""} ${t.answer || ""}`), [t.desc, t.answer]);
  const axis = useMemo(() => detectAxis(`${t.title || ""} ${t.desc || ""}`), [t.title, t.desc]);
  const meta = CAT[t.cat] || { e: t.img || "📋", c: (theme && theme.c) || T.orange, tip: "Adım adım ilerle, her adımı dene!" };
  const A = meta.c;

  const vizzes = [];
  if (nums.angles.length >= 2) vizzes.push(<AngleRoute key="a" angles={nums.angles} color={A} />);
  if (nums.rep) vizzes.push(<RepeatBoxes key="r" n={parseInt(nums.rep)} color={A} />);
  if (nums.cm) vizzes.push(<DistanceViz key="d" cm={nums.cm} color={A} />);
  if (vizzes.length < 2 && nums.pin != null) vizzes.push(<PinViz key="p" pin={nums.pin} color={A} />);
  if (vizzes.length < 2 && nums.sn) vizzes.push(<TimeViz key="s" label={`${nums.sn} saniye`} color={A} />);
  if (vizzes.length < 2 && nums.ms) vizzes.push(<TimeViz key="m" label={`${nums.ms} ms`} color={A} />);
  const shown = vizzes.slice(0, 2);

  return (
    <div style={{
      width: "100%", minHeight: 360,
      background: `linear-gradient(165deg, ${T.dark} 0%, ${T.card} 60%, ${T.dark} 100%)`,
      position: "relative", overflow: "hidden", padding: "22px 24px 20px",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(${A}18 1.5px, transparent 1.5px)`,
        backgroundSize: "26px 26px", opacity: .5,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ÜST: emoji + başlık + rozetler */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22, flexShrink: 0,
            background: `linear-gradient(135deg, ${A}50, ${A}20)`,
            border: `3px solid ${A}80`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 42, boxShadow: `0 8px 24px ${A}44`,
          }}>{meta.e}</div>

          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{
              display: "inline-block", padding: "3px 11px", borderRadius: 9, marginBottom: 6,
              background: `${A}25`, border: `1.5px solid ${A}55`,
              fontSize: 11.5, fontWeight: 900, color: A, letterSpacing: 1,
            }}>
              GÖREV {t.id} · {t.cat}
            </div>
            <div style={{ fontSize: 25, fontWeight: 900, color: T.tp, lineHeight: 1.15 }}>
              {t.title}
            </div>
          </div>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <Chip T={T} c={A} big={"⭐".repeat(Math.min(t.diff || 1, 5))} sub="Zorluk" />
            <Chip T={T} c={T.cyan} big={`${t.expectedMin || 15}dk`} sub="Süre" />
            <Chip T={T} c={T.warn} big={`+${t.xp || 10}`} sub="Puan" />
          </div>
        </div>

        {/* ORTA: ROBOT KOL ÇİZİMİ (sol) + ŞEMALAR (sağ) */}
        <div style={{
          display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap",
          padding: "12px 14px", borderRadius: 16,
          background: `${T.dark}bb`, border: `2px solid ${A}33`,
        }}>
          {/* robot kol — hangi motor? */}
          <div style={{
            flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center",
            padding: "6px 10px", borderRadius: 14, background: `${A}12`,
          }}>
            <RoboArmFigure highlight={axis} color={A} size={172} />
            <div style={{ fontSize: 11, fontWeight: 900, color: A, letterSpacing: .5, marginTop: 2 }}>
              {axis === "base" ? "🔄 TABAN MOTORU" :
               axis === "shoulder" ? "💪 OMUZ MOTORU" :
               axis === "elbow" ? "🦴 DİRSEK MOTORU" :
               axis === "wrist" ? "✋ BİLEK MOTORU" :
               axis === "gripper" ? "🤏 TUTUCU (GRIPPER)" : "🦾 ROBOT KOLUN"}
            </div>
          </div>

          {shown.map((v, i) => (
            <div key={i} style={{
              flex: "1 1 150px", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "4px 6px", borderRadius: 12, background: `${A}10`, minHeight: 100,
            }}>{v}</div>
          ))}
        </div>

        {/* ADIMLAR */}
        <div style={{
          background: `${T.dark}cc`, borderRadius: 16,
          border: `2px solid ${T.border}`, padding: "14px 16px", marginBottom: 12,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 900, color: A, marginBottom: 11,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <span style={{ fontSize: 19 }}>🎯</span> NE YAPACAKSIN?
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: "flex", gap: 11, alignItems: "flex-start",
                padding: "9px 12px", borderRadius: 12,
                background: `${A}0e`, border: `1px solid ${A}22`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                  background: `linear-gradient(135deg, ${A}, ${A}bb)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 900, color: "#fff",
                  boxShadow: `0 3px 9px ${A}44`,
                }}>{i + 1}</div>
                <span style={{ fontSize: 15.5, color: T.tp, lineHeight: 1.5, fontWeight: 500, paddingTop: 3 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* İPUCU */}
        <div style={{
          padding: "12px 15px", borderRadius: 14,
          background: `linear-gradient(95deg, ${T.warn}22, ${T.warn}08)`,
          border: `2px solid ${T.warn}44`,
          display: "flex", alignItems: "center", gap: 11,
        }}>
          <span style={{ fontSize: 26, flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 900, color: T.warn, letterSpacing: 1, marginBottom: 2 }}>İPUCU</div>
            <span style={{ fontSize: 14.5, color: T.tp, lineHeight: 1.5, fontWeight: 500 }}>{meta.tip}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function Chip({ T, c, big, sub }) {
  return (
    <div style={{
      padding: "7px 13px", borderRadius: 13, textAlign: "center",
      background: `${c}22`, border: `2px solid ${c}55`, minWidth: 58,
    }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: c, lineHeight: 1.2 }}>{big}</div>
      <div style={{ fontSize: 9, color: T.tm, letterSpacing: .8, textTransform: "uppercase", marginTop: 2, fontWeight: 700 }}>{sub}</div>
    </div>
  );
}
