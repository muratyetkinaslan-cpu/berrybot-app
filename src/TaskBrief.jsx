// TaskBrief.jsx — 7-14 yaş için görsel görev kartı
// Görsel yoksa: dev emoji + otomatik çizilen şemalar + basit adımlar + ipucu
import { useMemo } from "react";

// ─── Açıklamayı adımlara böl ───
function parseSteps(desc = "") {
  const clean = String(desc).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts = clean
    .split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return parts.length ? parts : [clean];
}

// ─── Metinden sayıları yakala ───
function extractNums(text = "") {
  const t = String(text);
  const angles = (t.match(/(\d+)\s*(?:°|derece)/gi) || [])
    .map((a) => parseInt((a.match(/\d+/) || [])[0]))
    .filter((n) => !isNaN(n));
  const pin = (t.match(/pin\s*(\d+)/i) || [])[1];
  const ms  = (t.match(/(\d+)\s*ms/i) || [])[1];
  const sn  = (t.match(/(\d+)\s*(?:saniye|sn)\b/i) || [])[1];
  const rep = (t.match(/(\d+)\s*(?:kez|kere|defa)/i) || [])[1];
  const cm  = (t.match(/(\d+)\s*cm/i) || [])[1];
  return { angles, pin, ms, sn, rep, cm };
}

// ─── Kategori: büyük emoji + renk + çocuk dostu ipucu ───
const CAT = {
  "Servo Temelleri":  { e: "🦾", c: "#fb923c", tip: "Servoya kaç derece gideceğini söyle, sonra biraz bekle. Acele etme!" },
  "Döngü & Değişken": { e: "🔁", c: "#a78bfa", tip: "Aynı şeyi tekrar tekrar yazma — döngü senin yerine tekrarlar!" },
  "Gamepad":          { e: "🎮", c: "#22d3ee", tip: "Sürekli 'tuşa basılı mı?' diye sor, basılıysa kolu azıcık oynat." },
  "Buton":            { e: "🔘", c: "#f472b6", tip: "Butonu bırakmasını bekle! Yoksa bir basış 10 kere sayılır." },
  "Potansiyometre":   { e: "🎛️", c: "#facc15", tip: "Pot 0 ile 1023 arası sayı verir. map ile bunu 0-180 açıya çevir." },
  "Mesafe Sensörü":   { e: "📏", c: "#34d399", tip: "Sensör bazen yanlış ölçer. Birkaç ölçüm alıp ortalamasını kullan." },
  "Buzzer":           { e: "🔔", c: "#fb7185", tip: "Ses = frekans + süre. Sayı büyükse ses tiz (ince), küçükse kalın olur." },
  "RGB LED":          { e: "🌈", c: "#ff6b9d", tip: "Kırmızı + Yeşil + Mavi karışır. Her renk 0 ile 255 arası." },
  "LDR":              { e: "💡", c: "#fde047", tip: "Önce karanlıkta ve aydınlıkta değeri ölç, sonra sınırı belirle." },
  "OLED Ekran":       { e: "🖥️", c: "#60a5fa", tip: "Yazdıktan sonra 'göster' demeyi unutma, yoksa ekran boş kalır!" },
  "Sıcaklık & Röle":  { e: "🌡️", c: "#f87171", tip: "Açma ve kapama sıcaklığı farklı olsun, yoksa sürekli aç-kapa yapar." },
  "Parkur":           { e: "🎯", c: "#4ade80", tip: "Önce kolu gamepad ile götür, açıları bir kağıda yaz, sonra koda geçir." },
  "Otomasyon":        { e: "🏭", c: "#e8611a", tip: "Parçaları tek tek dene. Hepsi çalışınca birleştir." },
  "Final Projesi":    { e: "🎓", c: "#ffd166", tip: "Önce kağıda çiz, sonra kodla. Sunumdan önce 3 kez prova yap!" },
};

// ═══════════ ŞEMALAR (SVG) ═══════════

// Açı kadranı: yarım daire, başlangıç ve bitiş açısı
function AngleDial({ from, to, color }) {
  const R = 58, cx = 82, cy = 76;
  const pt = (deg) => {
    const r = ((180 - deg) * Math.PI) / 180;
    return [cx + R * Math.cos(r), cy - R * Math.sin(r)];
  };
  const [x1, y1] = pt(from), [x2, y2] = pt(to);
  const sweep = to > from ? 0 : 1;
  return (
    <svg width="166" height="102" viewBox="0 0 166 102">
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke="#ffffff1a" strokeWidth="11" strokeLinecap="round" />
      <path d={`M ${x1} ${y1} A ${R} ${R} 0 0 ${sweep} ${x2} ${y2}`}
        fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={x1} y2={y1} stroke="#ffffff66" strokeWidth="2.5" strokeDasharray="4 3" />
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth="4" />
      <circle cx={cx} cy={cy} r="8" fill={color} />
      <circle cx={x1} cy={y1} r="15" fill="#111a" stroke="#ffffff55" strokeWidth="1.5" />
      <text x={x1} y={y1 + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{from}°</text>
      <circle cx={x2} cy={y2} r="16" fill={color} />
      <text x={x2} y={y2 + 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="#fff">{to}°</text>
      <text x={cx} y="98" textAnchor="middle" fontSize="11" fontWeight="800" fill={color}>BURAYA ÇEVİR</text>
    </svg>
  );
}

// Tekrar kutuları
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

// Mesafe: sensör → dalgalar → nesne
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

// Kronometre
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

// Pin bağlantısı
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

export default function TaskBrief({ task, theme, T }) {
  const t = task || {};
  const steps = useMemo(() => parseSteps(t.desc), [t.desc]);
  const nums = useMemo(() => extractNums(`${t.desc || ""} ${t.answer || ""}`), [t.desc, t.answer]);
  const meta = CAT[t.cat] || { e: t.img || "📋", c: (theme && theme.c) || T.orange, tip: "Adım adım ilerle, her adımı dene!" };
  const A = meta.c;

  // Şemalar (en fazla 3)
  const vizzes = [];
  if (nums.angles.length >= 2) vizzes.push(<AngleDial key="a" from={nums.angles[0]} to={nums.angles[1]} color={A} />);
  if (nums.rep) vizzes.push(<RepeatBoxes key="r" n={parseInt(nums.rep)} color={A} />);
  if (nums.cm) vizzes.push(<DistanceViz key="d" cm={nums.cm} color={A} />);
  if (vizzes.length < 3 && nums.pin != null) vizzes.push(<PinViz key="p" pin={nums.pin} color={A} />);
  if (vizzes.length < 3 && nums.ms) vizzes.push(<TimeViz key="m" label={`${nums.ms} ms`} color={A} />);
  if (vizzes.length < 3 && nums.sn) vizzes.push(<TimeViz key="s" label={`${nums.sn} saniye`} color={A} />);
  const shown = vizzes.slice(0, 3);

  return (
    <div style={{
      width: "100%", minHeight: 360,
      background: `linear-gradient(165deg, ${T.dark} 0%, ${T.card} 60%, ${T.dark} 100%)`,
      position: "relative", overflow: "hidden", padding: "24px 26px 22px",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(${A}18 1.5px, transparent 1.5px)`,
        backgroundSize: "26px 26px", opacity: .5,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ═══ ÜST: DEV EMOJİ + BAŞLIK + ROZETLER ═══ */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{
            width: 96, height: 96, borderRadius: 26, flexShrink: 0,
            background: `linear-gradient(135deg, ${A}50, ${A}20)`,
            border: `3px solid ${A}80`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 54, boxShadow: `0 8px 28px ${A}44`,
          }}>{meta.e}</div>

          <div style={{ flex: 1, minWidth: 190 }}>
            <div style={{
              display: "inline-block", padding: "4px 12px", borderRadius: 10, marginBottom: 8,
              background: `${A}25`, border: `1.5px solid ${A}55`,
              fontSize: 12, fontWeight: 900, color: A, letterSpacing: 1,
            }}>
              GÖREV {t.id} · {t.cat}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.tp, lineHeight: 1.15 }}>
              {t.title}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip T={T} c={A} big={"⭐".repeat(Math.min(t.diff || 1, 5))} sub="Zorluk" />
            <Chip T={T} c={T.cyan} big={`${t.expectedMin || 15}dk`} sub="Süre" />
            <Chip T={T} c={T.warn} big={`+${t.xp || 10}`} sub="Puan" />
          </div>
        </div>

        {/* ═══ ŞEMALAR ═══ */}
        {shown.length > 0 && (
          <div style={{
            display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap",
            padding: "12px 14px", borderRadius: 16,
            background: `${T.dark}bb`, border: `2px solid ${A}33`,
          }}>
            {shown.map((v, i) => (
              <div key={i} style={{
                flex: "1 1 140px", display: "flex", alignItems: "center", justifyContent: "center",
                padding: "4px 6px", borderRadius: 12, background: `${A}10`,
              }}>{v}</div>
            ))}
          </div>
        )}

        {/* ═══ ADIMLAR ═══ */}
        <div style={{
          background: `${T.dark}cc`, borderRadius: 16,
          border: `2px solid ${T.border}`, padding: "16px 18px", marginBottom: 14,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 900, color: A, marginBottom: 12,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <span style={{ fontSize: 20 }}>🎯</span> NE YAPACAKSIN?
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: "10px 12px", borderRadius: 12,
                background: `${A}0e`, border: `1px solid ${A}22`,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg, ${A}, ${A}bb)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 900, color: "#fff",
                  boxShadow: `0 3px 10px ${A}44`,
                }}>{i + 1}</div>
                <span style={{ fontSize: 16, color: T.tp, lineHeight: 1.55, fontWeight: 500, paddingTop: 3 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ İPUCU ═══ */}
        <div style={{
          padding: "14px 16px", borderRadius: 14,
          background: `linear-gradient(95deg, ${T.warn}22, ${T.warn}08)`,
          border: `2px solid ${T.warn}44`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 30, flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: T.warn, letterSpacing: 1, marginBottom: 2 }}>İPUCU</div>
            <span style={{ fontSize: 15, color: T.tp, lineHeight: 1.5, fontWeight: 500 }}>{meta.tip}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function Chip({ T, c, big, sub }) {
  return (
    <div style={{
      padding: "8px 14px", borderRadius: 14, textAlign: "center",
      background: `${c}22`, border: `2px solid ${c}55`, minWidth: 62,
    }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: c, lineHeight: 1.2 }}>{big}</div>
      <div style={{ fontSize: 9.5, color: T.tm, letterSpacing: .8, textTransform: "uppercase", marginTop: 3, fontWeight: 700 }}>{sub}</div>
    </div>
  );
}
