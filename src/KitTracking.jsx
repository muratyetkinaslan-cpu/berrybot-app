// KitTracking.jsx — 🔧 Kit Takip Sistemi
// 1) KitTrackingView : Admin sekmesi — öğrenci×kit listesi, durum, arama/filtre,
//    olay geçmişi (tarih+maliyet), QR önizleme + NIIMBOT B1 etiket baskısı
// 2) KitPublicView   : QR okutulunca açılan halka açık sayfa (veli de görür)
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import QRCode from "qrcode";
import "niimbot-web-bluetooth";
import jsQR from "jsqr";
import * as db from "./db";
import { KITS } from "./App";

// ── Sabitler ─────────────────────────────────────────────────────────
export const KIT_STATUS = {
  saglam:        { l: "Sağlam",        e: "✅", c: "#4ade80" },
  tamir_gerekli: { l: "Tamir Gerekli", e: "⚠️", c: "#fbbf24" },
  tamirde:       { l: "Tamirde",       e: "🔧", c: "#fb923c" },
  hurda:         { l: "Kullanım Dışı", e: "❌", c: "#f87171" },
};
export const KIT_EVENT = {
  kontrol: { l: "Kontrol",         e: "🔍" },
  ariza:   { l: "Arıza Bildirimi", e: "⚠️" },
  tamir:   { l: "Tamir Yapıldı",   e: "🔧" },
  parca:   { l: "Parça Değişimi",  e: "⚙️" },
  teslim:  { l: "Teslim / Kayıt",  e: "📦" },
  not:     { l: "Not",             e: "📝" },
};
// olay tipi → önerilen yeni durum
const EVENT_STATUS_SUGGEST = { ariza: "tamir_gerekli", tamir: "saglam", parca: "saglam", teslim: "saglam" };

const NIIMBOT_MODEL = { name_prefixes: ["B1"], task: "b1", density: 3, label_type: 1 };
const PRINTHEAD_PX = 384;             // B1 yazıcı kafası genişliği
const PX_PER_MM = 8;                  // 203 dpi ≈ 8 px/mm
const LABEL_W_MM = 40, LABEL_H_MM = 30;

const fmtDate = (ms) => ms ? new Date(Number(ms)).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
const fmtTL = (n) => Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ₺";
const kitQrUrl = (code) => `${window.location.origin}${window.location.pathname}?kitqr=${code}`;

// ── 40x30mm etiket çizimi ────────────────────────────────────────────
async function buildLabelCanvas(unit, studentName) {
  const W = LABEL_W_MM * PX_PER_MM, H = LABEL_H_MM * PX_PER_MM;   // 320x240
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000";

  // Üst şerit: öğrenci adı
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  let name = studentName || "";
  while (ctx.measureText(name).width > W - 16 && name.length > 3) name = name.slice(0, -2);
  ctx.fillText(name, W / 2, 30);
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(10, 42); ctx.lineTo(W - 10, 42); ctx.stroke();

  // QR (sol)
  const qrCv = document.createElement("canvas");
  await QRCode.toCanvas(qrCv, kitQrUrl(unit.code), { width: 168, margin: 0, errorCorrectionLevel: "M" });
  ctx.drawImage(qrCv, 10, 52, 168, 168);

  // Sağ sütun: kit + kod + marka
  const kitName = KITS[unit.kit]?.name || unit.kit;
  ctx.textAlign = "left";
  ctx.font = "bold 22px Arial";
  ctx.fillText(kitName.slice(0, 10), 188, 92);
  ctx.font = "bold 24px monospace";
  ctx.fillText(unit.code, 186, 138);
  ctx.font = "16px Arial";
  ctx.fillText("Kit Takip", 188, 176);
  ctx.font = "bold 17px Arial";
  ctx.fillText("ROBOGPT", 188, 208);

  return cv;
}

// Genel 40x30 kart: başlık + QR + isim (giriş kartı / veli kartı)
async function buildCardLabel({ name, title, qrText, footer }) {
  const W = LABEL_W_MM * PX_PER_MM, H = LABEL_H_MM * PX_PER_MM;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#000";

  ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
  let n = name || "";
  while (ctx.measureText(n).width > W - 14 && n.length > 3) n = n.slice(0, -2);
  ctx.fillText(n, W / 2, 28);

  const qrCv = document.createElement("canvas");
  await QRCode.toCanvas(qrCv, qrText, { width: 158, margin: 0, errorCorrectionLevel: "M" });
  ctx.drawImage(qrCv, 12, 44, 158, 158);

  ctx.textAlign = "left";
  ctx.font = "bold 20px Arial";
  title.split("\n").forEach((line, i) => ctx.fillText(line, 182, 96 + i * 28));
  ctx.font = "16px Arial";
  ctx.fillText(footer || "", 182, 176);
  ctx.font = "bold 17px Arial";
  ctx.fillText("ROBOGPT", 182, 208);
  return cv;
}

/** Etiket canvas'ını 384px yazıcı kafasına sol hizalı yerleştirip PNG'e çevir. */
function stageForPrint(cv) {
  const out = document.createElement("canvas");
  out.width = PRINTHEAD_PX; out.height = cv.height;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(cv, 0, 0);
  return out.toDataURL("image/png");
}

// ── NIIMBOT hook (test uygulamasındaki akışın birebir aynısı) ────────
function useNiimbot() {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.Niimbot || !window.Niimbot.isSupported()) {
      setError("Bu tarayıcı Bluetooth desteklemiyor — Chrome/Edge kullanın (HTTPS gerekir).");
      return;
    }
    try {
      const info = await window.Niimbot.identify(NIIMBOT_MODEL);
      setConnected(true);
      setDeviceName((info && info.label) || "NIIMBOT B1");
    } catch (e) {
      setError(e.message || "Bağlantı başarısız");
      setConnected(false);
    }
  }, []);

  const printCanvas = useCallback(async (cv) => {
    setPrinting(true); setStatus(""); setError(null);
    try {
      const dataUrl = stageForPrint(cv);
      await window.Niimbot.printImage(dataUrl, {
        model: NIIMBOT_MODEL,
        size: { w_px: PRINTHEAD_PX, h_px: cv.height, dpi: 203, offset_y_px: 0 },
        onProgress: (s) => setStatus(s),
      });
      return true;
    } catch (e) {
      setError("Yazdırma hatası: " + (e.message || e));
      return false;
    } finally {
      setPrinting(false);
    }
  }, []);

  return { connected, deviceName, printing, status, error, connect, printCanvas };
}

// ═════════════════════════════════════════════════════════════════════
// ADMİN SEKMESİ
// ═════════════════════════════════════════════════════════════════════
export function KitTrackingView({ users, T, notify, currentUserName }) {
  const [mode, setMode] = useState("takip");     // takip | kartlar
  const [units, setUnits] = useState(null);
  const [events, setEvents] = useState([]);       // tüm olaylar (özet için)
  const [q, setQ] = useState("");
  const [fKit, setFKit] = useState("all");
  const [fStat, setFStat] = useState("all");
  const [sel, setSel] = useState(null);           // seçili ünite (detay panel)
  const nb = useNiimbot();

  const students = useMemo(() => Object.fromEntries((users || []).filter(u => u.role === "student").map(u => [u.id, u])), [users]);

  const load = useCallback(async () => {
    await db.ensureKitUnits(users || []);          // eksik kayıtları tamamla
    const [us, evs] = await Promise.all([db.getKitUnits(), db.getAllKitEvents()]);
    setUnits(us); setEvents(evs);
    setSel(s => s ? us.find(u => u.id === s.id) || null : null);
  }, [users]);

  useEffect(() => { load(); }, [load]);

  // ünite başına özet: son olay tarihi + toplam maliyet
  const summary = useMemo(() => {
    const m = {};
    events.forEach(e => {
      if (!m[e.unit_id]) m[e.unit_id] = { last: 0, cost: 0, count: 0 };
      m[e.unit_id].last = Math.max(m[e.unit_id].last, Number(e.event_date) || 0);
      m[e.unit_id].cost += Number(e.cost) || 0;
      m[e.unit_id].count++;
    });
    return m;
  }, [events]);

  const list = useMemo(() => {
    if (!units) return [];
    const ql = q.trim().toLowerCase();
    return units.filter(u => {
      const st = students[u.student_id];
      if (!st) return false;                       // silinmiş öğrenci
      if (fKit !== "all" && u.kit !== fKit) return false;
      if (fStat !== "all" && u.status !== fStat) return false;
      if (ql && !(st.name.toLowerCase().includes(ql) || u.code.toLowerCase().includes(ql) || (u.serial_no || "").toLowerCase().includes(ql))) return false;
      return true;
    }).sort((a, b) => (students[a.student_id]?.name || "").localeCompare(students[b.student_id]?.name || "", "tr"));
  }, [units, students, q, fKit, fStat]);

  const statCounts = useMemo(() => {
    const c = { saglam: 0, tamir_gerekli: 0, tamirde: 0, hurda: 0 };
    (units || []).forEach(u => { if (students[u.student_id] && c[u.status] !== undefined) c[u.status]++; });
    return c;
  }, [units, students]);

  const inp = { padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.input, color: T.tp, fontSize: 14, outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.orange, margin: 0 }}>🔧 Kit Takip</h1>
        <div style={{ display: "flex", gap: 4, background: T.card, borderRadius: 10, padding: 4, border: `1px solid ${T.border}` }}>
          {[["takip", "🔧 Kit Takip"], ["kartlar", "🎫 QR Kartları"]].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13,
              background: mode === k ? T.orange : "transparent", color: mode === k ? "#fff" : T.ts,
            }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {/* NIIMBOT bağlantı durumu */}
        <button onClick={nb.connect} disabled={nb.connected} style={{
          ...inp, cursor: nb.connected ? "default" : "pointer", fontWeight: 700,
          borderColor: nb.connected ? T.ok : T.border, color: nb.connected ? T.ok : T.tp,
        }}>
          {nb.connected ? `🖨️ ${nb.deviceName} bağlı` : "🖨️ NIIMBOT'a Bağlan"}
        </button>
      </div>
      {nb.error && <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: `${T.err}22`, color: T.err, fontSize: 13, fontWeight: 600 }}>{nb.error}</div>}

      {mode === "kartlar" ? <QrCardsView users={users} T={T} notify={notify} nb={nb} /> : <>
      {/* Durum özeti */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.entries(KIT_STATUS).map(([k, s]) => (
          <button key={k} onClick={() => setFStat(fStat === k ? "all" : k)} style={{
            padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13,
            border: `2px solid ${fStat === k ? s.c : T.border}`,
            background: fStat === k ? `${s.c}22` : T.card, color: s.c,
          }}>
            {s.e} {s.l}: {statCounts[k]}
          </button>
        ))}
      </div>

      {/* Arama + filtre */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 İsim, kod (KT-...) veya seri no ara..."
          style={{ ...inp, flex: "2 1 240px" }} />
        <select value={fKit} onChange={e => setFKit(e.target.value)} style={{ ...inp, flex: "1 1 140px", fontWeight: 700 }}>
          <option value="all">🌐 Tüm Kitler</option>
          {Object.values(KITS).map(k => <option key={k.id} value={k.id}>{k.icon} {k.name}</option>)}
        </select>
        <select value={fStat} onChange={e => setFStat(e.target.value)} style={{ ...inp, flex: "1 1 150px", fontWeight: 700 }}>
          <option value="all">Tüm Durumlar</option>
          {Object.entries(KIT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.e} {s.l}</option>)}
        </select>
      </div>

      {units === null ? (
        <div style={{ padding: 40, textAlign: "center", color: T.ts }}>Kit kayıtları yükleniyor...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr minmax(360px, 480px)" : "1fr", gap: 14, alignItems: "start" }}>
          {/* LİSTE */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {list.length === 0 && <div style={{ padding: 30, textAlign: "center", color: T.tm, background: T.card, borderRadius: 12 }}>Eşleşen kayıt yok.</div>}
            {list.map(u => {
              const st = students[u.student_id];
              const S = KIT_STATUS[u.status] || KIT_STATUS.saglam;
              const sum = summary[u.id] || {};
              const K = KITS[u.kit];
              return (
                <div key={u.id} onClick={() => setSel(u)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                  background: sel?.id === u.id ? `${S.c}18` : T.card,
                  border: `1.5px solid ${sel?.id === u.id ? S.c : T.border}`,
                }}>
                  <div style={{ fontSize: 26 }}>{K?.icon || "🤖"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: T.tp, fontSize: 15 }}>{st.name}</div>
                    <div style={{ fontSize: 12, color: T.ts }}>{K?.name || u.kit} · <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{u.code}</span>{u.serial_no ? ` · SN:${u.serial_no}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: S.c }}>{S.e} {S.l}</div>
                    <div style={{ fontSize: 11, color: T.tm }}>
                      Son işlem: {fmtDate(sum.last)}{sum.cost > 0 ? ` · ${fmtTL(sum.cost)}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DETAY PANELİ */}
          {sel && <KitDetail key={sel.id} unit={sel} student={students[sel.student_id]} T={T} notify={notify}
            nb={nb} onChanged={load} onClose={() => setSel(null)} currentUserName={currentUserName} />}
        </div>
      )}
      </>}
    </div>
  );
}

// ── 🎫 QR KARTLARI — herkesin giriş & veli QR'ı bir arada ──────────────
function QrCardsView({ users, T, notify, nb }) {
  const [tokens, setTokens] = useState(null);      // {studentId: {login_token, parent_token}}
  const [qrImgs, setQrImgs] = useState({});        // {"id|tip": dataUrl}
  const [q, setQ] = useState("");
  const [bulk, setBulk] = useState(null);          // "3/12" ilerleme

  const students = useMemo(
    () => (users || []).filter(u => u.role === "student").sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [users]
  );

  useEffect(() => { db.ensureAllTokens(users || []).then(setTokens); }, [users]);

  // QR görsellerini üret
  useEffect(() => {
    if (!tokens) return;
    let alive = true;
    (async () => {
      const out = {};
      for (const s of students) {
        const t = tokens[s.id];
        if (!t) continue;
        out[s.id + "|g"] = await QRCode.toDataURL(`${window.location.origin}${window.location.pathname}?qrlogin=${t.login_token}`, { width: 160, margin: 1 });
        out[s.id + "|v"] = await QRCode.toDataURL(`${window.location.origin}${window.location.pathname}?veliqr=${t.parent_token}`, { width: 160, margin: 1 });
      }
      if (alive) setQrImgs(out);
    })();
    return () => { alive = false; };
  }, [tokens, students]);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ql ? students.filter(s => s.name.toLowerCase().includes(ql)) : students;
  }, [students, q]);

  const printOne = async (s, kind) => {
    if (!nb.connected) { notify("Önce NIIMBOT'a bağlan (sağ üst) 🖨️", "err"); return false; }
    const t = tokens?.[s.id];
    if (!t) return false;
    const cv = await buildCardLabel(kind === "g"
      ? { name: s.name, title: "GIRIS\nKARTI", footer: "Kameraya okut", qrText: `${window.location.origin}${window.location.pathname}?qrlogin=${t.login_token}` }
      : { name: s.name, title: "VELI\nTAKIP", footer: "Telefonla okut", qrText: `${window.location.origin}${window.location.pathname}?veliqr=${t.parent_token}` });
    return nb.printCanvas(cv);
  };

  const printAll = async (kind) => {
    if (!nb.connected) { notify("Önce NIIMBOT'a bağlan (sağ üst) 🖨️", "err"); return; }
    if (!confirm(`${list.length} adet ${kind === "g" ? "GİRİŞ" : "VELİ"} kartı basılacak. Etiket rulosu yeterli mi?`)) return;
    for (let i = 0; i < list.length; i++) {
      setBulk(`${i + 1}/${list.length} — ${list[i].name}`);
      const ok = await printOne(list[i], kind);
      if (!ok) { notify(`${list[i].name} kartında durdu — yazıcıyı kontrol et`, "err"); break; }
    }
    setBulk(null);
    notify("Toplu baskı bitti 🖨️✅");
  };

  const copyLink = (s, kind) => {
    const t = tokens?.[s.id]; if (!t) return;
    const url = `${window.location.origin}${window.location.pathname}${kind === "g" ? "?qrlogin=" + t.login_token : "?veliqr=" + t.parent_token}`;
    navigator.clipboard?.writeText(url);
    notify((kind === "g" ? "Giriş" : "Veli") + " linki kopyalandı 📋");
  };

  const inp = { padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.input, color: T.tp, fontSize: 14, outline: "none" };
  const pbtn = (bg) => ({ padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 11.5, background: bg, color: "#fff" });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Öğrenci ara..." style={{ ...inp, flex: "2 1 220px" }} />
        <button onClick={() => printAll("g")} disabled={!!bulk} style={{ ...pbtn(`linear-gradient(135deg,${T.orange},${T.od})`), padding: "10px 16px", fontSize: 13 }}>
          🖨️ Tüm Giriş Kartları ({list.length})
        </button>
        <button onClick={() => printAll("v")} disabled={!!bulk} style={{ ...pbtn(`linear-gradient(135deg,${T.purple},${T.pd})`), padding: "10px 16px", fontSize: 13 }}>
          🖨️ Tüm Veli Kartları ({list.length})
        </button>
      </div>
      {bulk && <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: `${T.orange}22`, color: T.orange, fontWeight: 800, fontSize: 13 }}>🖨️ Basılıyor: {bulk}{nb.status ? ` · ${nb.status}` : ""}</div>}
      {tokens === null && <div style={{ padding: 30, textAlign: "center", color: T.ts }}>QR kartları hazırlanıyor...</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 12 }}>
        {list.map(s => (
          <div key={s.id} style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: T.tp, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{KITS[s.kit]?.icon || "🎓"}</span>{s.name}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["g", "🎓 Giriş QR", T.orange], ["v", "👨‍👩‍👦 Veli QR", T.purple]].map(([k, l, c]) => (
                <div key={k} style={{ textAlign: "center", background: T.input, borderRadius: 12, padding: 10 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: c, marginBottom: 6 }}>{l}</div>
                  {qrImgs[s.id + "|" + k]
                    ? <img src={qrImgs[s.id + "|" + k]} alt={l} style={{ width: 110, height: 110, borderRadius: 8, background: "#fff", padding: 3 }} />
                    : <div style={{ width: 110, height: 110, margin: "0 auto", borderRadius: 8, background: T.dark || "#111", display: "flex", alignItems: "center", justifyContent: "center", color: T.tm, fontSize: 11 }}>...</div>}
                  <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "center" }}>
                    <button onClick={() => printOne(s, k).then(ok => ok && notify("Yazdırıldı 🖨️✅"))} style={pbtn(c)}>🖨️ Bas</button>
                    <button onClick={() => copyLink(s, k)} style={{ ...pbtn("transparent"), border: `1.5px solid ${T.border}`, color: T.ts }}>🔗</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detay paneli: durum, QR, etiket baskı, olay geçmişi + yeni olay ──
function KitDetail({ unit, student, T, notify, nb, onChanged, onClose, currentUserName }) {
  const [events, setEvents] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const labelRef = useRef(null);
  // yeni olay formu
  const [evType, setEvType] = useState("kontrol");
  const [evDesc, setEvDesc] = useState("");
  const [evCost, setEvCost] = useState("");
  const [evDate, setEvDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [evStatus, setEvStatus] = useState("");     // "" = durumu değiştirme
  const [saving, setSaving] = useState(false);
  const [serial, setSerial] = useState(unit.serial_no || "");

  const loadEvents = useCallback(async () => setEvents(await db.getKitEvents(unit.id)), [unit.id]);
  useEffect(() => { loadEvents(); }, [loadEvents]);

  // QR önizleme + etiket önizleme
  useEffect(() => {
    QRCode.toDataURL(kitQrUrl(unit.code), { width: 200, margin: 1 }).then(setQrUrl);
    buildLabelCanvas(unit, student?.name).then(cv => {
      if (labelRef.current) {
        labelRef.current.innerHTML = "";
        cv.style.width = "200px"; cv.style.height = "150px";
        cv.style.borderRadius = "6px";
        labelRef.current.appendChild(cv);
      }
    });
  }, [unit, student]);

  useEffect(() => { setEvStatus(EVENT_STATUS_SUGGEST[evType] || ""); }, [evType]);

  const toplam = (events || []).reduce((a, e) => a + (Number(e.cost) || 0), 0);
  const S = KIT_STATUS[unit.status] || KIT_STATUS.saglam;

  const saveEvent = async () => {
    if (!evDesc.trim() && evType !== "kontrol") { notify("Açıklama yaz — geçmişte ne olduğunu bilelim!", "err"); return; }
    setSaving(true);
    const ok = await db.addKitEvent(unit.id, {
      type: evType,
      description: evDesc.trim() || (evType === "kontrol" ? "Rutin kontrol — sorun yok" : ""),
      cost: parseFloat(evCost) || 0,
      event_date: new Date(evDate + "T12:00:00").getTime(),
      created_by: currentUserName || "admin",
    }, evStatus || null);
    setSaving(false);
    if (ok) {
      notify("Kayıt eklendi ✅");
      setEvDesc(""); setEvCost("");
      await loadEvents(); await onChanged();
    } else notify("Kayıt eklenemedi!", "err");
  };

  const quickStatus = async (st) => {
    if (await db.updateKitUnit(unit.id, { status: st })) { notify(`Durum: ${KIT_STATUS[st].l}`); await onChanged(); }
  };

  const saveSerial = async () => {
    if (await db.updateKitUnit(unit.id, { serial_no: serial.trim() || null })) { notify("Seri no kaydedildi ✅"); await onChanged(); }
  };

  const [tokens, setTokens] = useState(null);
  useEffect(() => { db.ensureUserTokens(unit.student_id).then(setTokens); }, [unit.student_id]);

  const doPrint = async (kind) => {
    if (!nb.connected) { notify("Önce NIIMBOT'a bağlan (sağ üst) 🖨️", "err"); return; }
    let cv;
    if (kind === "kit") cv = await buildLabelCanvas(unit, student?.name);
    else if (kind === "giris") {
      if (!tokens?.login_token) { notify("Token hazırlanıyor, tekrar dene", "err"); return; }
      cv = await buildCardLabel({
        name: student?.name, title: "GIRIS\nKARTI", footer: "Kameraya okut",
        qrText: `${window.location.origin}${window.location.pathname}?qrlogin=${tokens.login_token}`,
      });
    } else {
      if (!tokens?.parent_token) { notify("Token hazırlanıyor, tekrar dene", "err"); return; }
      cv = await buildCardLabel({
        name: student?.name, title: "VELI\nTAKIP", footer: "Telefonla okut",
        qrText: `${window.location.origin}${window.location.pathname}?veliqr=${tokens.parent_token}`,
      });
    }
    if (await nb.printCanvas(cv)) notify("Etiket yazdırıldı 🖨️✅");
  };

  const inp = { padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${T.border}`, background: T.input, color: T.tp, fontSize: 13, outline: "none" };
  const K = KITS[unit.kit];

  return (
    <div style={{ background: T.card, border: `2px solid ${S.c}55`, borderRadius: 16, padding: 18, position: "sticky", top: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 30 }}>{K?.icon || "🤖"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 17, color: T.tp }}>{student?.name}</div>
          <div style={{ fontSize: 12, color: T.ts }}>{K?.name || unit.kit} · <b style={{ fontFamily: "monospace" }}>{unit.code}</b></div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.tm, fontSize: 20, cursor: "pointer" }}>✕</button>
      </div>

      {/* Durum butonları */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.entries(KIT_STATUS).map(([k, s]) => (
          <button key={k} onClick={() => quickStatus(k)} style={{
            flex: 1, padding: "8px 6px", borderRadius: 9, cursor: "pointer", fontWeight: 800, fontSize: 12,
            border: `2px solid ${unit.status === k ? s.c : T.border}`,
            background: unit.status === k ? `${s.c}25` : "transparent", color: s.c,
          }}>{s.e} {s.l}</button>
        ))}
      </div>

      {/* QR + etiket + baskı */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          {qrUrl && <img src={qrUrl} alt="QR" style={{ width: 110, height: 110, borderRadius: 8, background: "#fff", padding: 4 }} />}
          <div style={{ fontSize: 10, color: T.tm, marginTop: 4 }}>Veli de okutabilir 📱</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div ref={labelRef} style={{ marginBottom: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[["kit", "🏷️ Kit"], ["giris", "🎓 Giriş"], ["veli", "👨‍👩‍👦 Veli"]].map(([k, l]) => (
              <button key={k} onClick={() => doPrint(k)} disabled={nb.printing} style={{
                padding: "10px 6px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 12,
                border: "none", background: nb.printing ? T.tm : `linear-gradient(135deg,${T.orange},${T.od})`, color: "#fff",
              }}>{nb.printing ? "..." : l}</button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: T.tm, marginTop: 4 }}>{nb.printing ? (nb.status || "Yazdırılıyor...") : "Bas: kit etiketi · öğrenci giriş kartı · veli takip kartı"}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <button onClick={() => { navigator.clipboard?.writeText(kitQrUrl(unit.code)); notify("Kit linki kopyalandı 📋"); }}
              style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, border: `1.5px solid ${T.border}`, background: "transparent", color: T.ts }}>🔗 Kit</button>
            {tokens?.parent_token && <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?veliqr=${tokens.parent_token}`); notify("Veli linki kopyalandı 📋 (WhatsApp'tan atabilirsin)"); }}
              style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, border: `1.5px solid ${T.border}`, background: "transparent", color: T.ts }}>🔗 Veli Raporu</button>}
          </div>
        </div>
      </div>

      {/* Seri no */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <input value={serial} onChange={e => setSerial(e.target.value)} placeholder="Fiziksel seri no (opsiyonel)" style={{ ...inp, flex: 1 }} />
        <button onClick={saveSerial} style={{ ...inp, cursor: "pointer", fontWeight: 700 }}>Kaydet</button>
      </div>

      {/* Yeni olay */}
      <div style={{ background: T.input, borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: T.tp, marginBottom: 8 }}>➕ Yeni Kayıt</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
          <select value={evType} onChange={e => setEvType(e.target.value)} style={{ ...inp, fontWeight: 700 }}>
            {Object.entries(KIT_EVENT).map(([k, v]) => <option key={k} value={k}>{v.e} {v.l}</option>)}
          </select>
          <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} style={inp} />
        </div>
        <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} rows={2}
          placeholder="Ne oldu? (örn: sol palet motoru değişti, çizgi sensör kablosu lehimlendi...)"
          style={{ ...inp, width: "100%", boxSizing: "border-box", resize: "vertical", marginBottom: 6 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          <input type="number" min="0" step="0.5" value={evCost} onChange={e => setEvCost(e.target.value)}
            placeholder="Maliyet (₺)" style={inp} />
          <select value={evStatus} onChange={e => setEvStatus(e.target.value)} style={{ ...inp, fontWeight: 700 }}>
            <option value="">Durum değişmesin</option>
            {Object.entries(KIT_STATUS).map(([k, s]) => <option key={k} value={k}>→ {s.e} {s.l}</option>)}
          </select>
        </div>
        <button onClick={saveEvent} disabled={saving} style={{
          width: "100%", padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
          fontWeight: 800, fontSize: 14, background: `linear-gradient(135deg,${T.ok},#16a34a)`, color: "#fff",
        }}>{saving ? "Kaydediliyor..." : "💾 Kaydet"}</button>
      </div>

      {/* Geçmiş */}
      <div style={{ fontWeight: 800, fontSize: 13, color: T.tp, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span>📜 Geçmiş ({events?.length ?? "..."})</span>
        {toplam > 0 && <span style={{ color: T.warn }}>Toplam: {fmtTL(toplam)}</span>}
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {events === null && <div style={{ color: T.tm, fontSize: 13 }}>Yükleniyor...</div>}
        {events?.length === 0 && <div style={{ color: T.tm, fontSize: 13 }}>Henüz kayıt yok.</div>}
        {(events || []).map(e => {
          const E = KIT_EVENT[e.type] || KIT_EVENT.not;
          return (
            <div key={e.id} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 9, background: T.input, alignItems: "flex-start" }}>
              <div style={{ fontSize: 18 }}>{E.e}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.tp }}>
                  {E.l} <span style={{ color: T.tm, fontWeight: 600 }}>· {fmtDate(e.event_date)}</span>
                  {Number(e.cost) > 0 && <span style={{ color: T.warn, marginLeft: 6 }}>{fmtTL(e.cost)}</span>}
                </div>
                {e.description && <div style={{ fontSize: 12, color: T.ts, marginTop: 2 }}>{e.description}</div>}
                {e.created_by && <div style={{ fontSize: 10, color: T.tm, marginTop: 2 }}>— {e.created_by}</div>}
              </div>
              <button onClick={async () => { if (confirm("Bu kayıt silinsin mi?")) { await db.deleteKitEvent(e.id); loadEvents(); onChanged(); } }}
                style={{ background: "none", border: "none", color: T.tm, cursor: "pointer", fontSize: 13 }}>🗑</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// HALKA AÇIK QR SAYFASI — ?kitqr=KT-XXXXXX (login gerekmez, veli görür)
// ═════════════════════════════════════════════════════════════════════
const P = { bg: "#12101f", card: "#1c1930", input: "#141225", border: "#332e52", tp: "#f0ecff", ts: "#a79dd0", tm: "#6d6394", orange: "#F5922A" };

export function KitPublicView({ code }) {
  const [data, setData] = useState(undefined);   // undefined=yükleniyor, null=bulunamadı

  useEffect(() => { db.getKitByCode(code).then(setData); }, [code]);

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.tp, fontFamily: "system-ui,-apple-system,sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 34 }}>🤖</div>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>ROBO<span style={{ color: P.orange }}>GPT</span></div>
          <div style={{ fontSize: 12, color: P.tm, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Kit Takip Sistemi</div>
        </div>
        {children}
      </div>
    </div>
  );

  if (data === undefined) return wrap(<div style={{ textAlign: "center", color: P.ts, padding: 40 }}>Kit bilgisi yükleniyor...</div>);
  if (data === null) return wrap(
    <div style={{ textAlign: "center", padding: 40, background: P.card, borderRadius: 16 }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
      <div style={{ fontWeight: 800, fontSize: 17 }}>Kit bulunamadı</div>
      <div style={{ color: P.ts, fontSize: 13, marginTop: 6 }}>Kod: <b style={{ fontFamily: "monospace" }}>{code}</b><br />Etiket eski olabilir — eğitmeninizle iletişime geçin.</div>
    </div>
  );

  const { unit, studentName, events } = data;
  const S = KIT_STATUS[unit.status] || KIT_STATUS.saglam;
  const K = KITS[unit.kit];
  const toplam = events.reduce((a, e) => a + (Number(e.cost) || 0), 0);

  return wrap(<>
    {/* Kit kartı */}
    <div style={{ background: P.card, border: `2px solid ${S.c}66`, borderRadius: 18, padding: 20, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 42 }}>{K?.icon || "🤖"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 19 }}>{studentName}</div>
          <div style={{ color: P.ts, fontSize: 13 }}>{K?.name || unit.kit} · <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{unit.code}</span></div>
          {unit.serial_no && <div style={{ color: P.tm, fontSize: 11 }}>Seri No: {unit.serial_no}</div>}
        </div>
      </div>
      <div style={{
        marginTop: 14, padding: "12px 16px", borderRadius: 12, textAlign: "center",
        background: `${S.c}1c`, border: `1.5px solid ${S.c}55`,
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: S.c }}>{S.e} {S.l}</div>
        <div style={{ fontSize: 11, color: P.ts, marginTop: 2 }}>Son güncelleme: {fmtDate(unit.updated_at)}</div>
      </div>
      {unit.status === "saglam" && events.filter(e => e.type === "tamir" || e.type === "parca").length === 0 && (
        <div style={{ marginTop: 10, textAlign: "center", fontSize: 13, color: P.ts }}>
          Bu kit için bugüne kadar hiçbir tamir gerekmedi. 💪
        </div>
      )}
    </div>

    {/* Geçmiş */}
    <div style={{ background: P.card, borderRadius: 18, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 15 }}>📜 Kit Geçmişi</div>
        {toplam > 0 && <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 800 }}>Toplam tamir: {fmtTL(toplam)}</div>}
      </div>
      {events.length === 0 && <div style={{ color: P.tm, fontSize: 13, textAlign: "center", padding: 16 }}>Henüz kayıt yok.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {events.map(e => {
          const E = KIT_EVENT[e.type] || KIT_EVENT.not;
          return (
            <div key={e.id} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 11, background: P.input }}>
              <div style={{ fontSize: 20 }}>{E.e}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>
                  {E.l}
                  {Number(e.cost) > 0 && <span style={{ color: "#fbbf24", marginLeft: 8 }}>{fmtTL(e.cost)}</span>}
                </div>
                {e.description && <div style={{ fontSize: 12, color: P.ts, marginTop: 2 }}>{e.description}</div>}
                <div style={{ fontSize: 11, color: P.tm, marginTop: 3 }}>{fmtDate(e.event_date)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: P.tm }}>
      Sorularınız için eğitmeninizle iletişime geçebilirsiniz. · RoboGPT Robotik Eğitim
    </div>
  </>);
}

// ═════════════════════════════════════════════════════════════════════
// 🎓 QR GİRİŞ TARAYICISI — login ekranında PC kamerasıyla kart okutma
// ═════════════════════════════════════════════════════════════════════
export function QrLoginScanner({ onToken, onClose }) {
  const videoRef = useRef(null);
  const [err, setErr] = useState(null);
  const stopRef = useRef(false);

  useEffect(() => {
    stopRef.current = false;
    let stream = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const detector = ("BarcodeDetector" in window)
      ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;

    const extract = (raw) => {
      const m = String(raw || "").match(/LG-[A-Z2-9]{6,}/i);
      return m ? m[0].toUpperCase() : null;
    };

    const tick = async () => {
      if (stopRef.current) return;
      const v = videoRef.current;
      if (v && v.readyState === 4) {
        try {
          let raw = null;
          if (detector) {
            const codes = await detector.detect(v);
            raw = codes[0]?.rawValue;
          } else {
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const q = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            raw = q?.data;
          }
          const token = extract(raw);
          if (token) { stopRef.current = true; onToken(token); return; }
        } catch { /* kare atla */ }
      }
      setTimeout(tick, 250);
    };

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } } })
      .then(s => {
        stream = s;
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
        tick();
      })
      .catch(() => setErr("Kameraya erişilemedi. Tarayıcı izinlerini kontrol et (HTTPS gerekir)."));

    return () => {
      stopRef.current = true;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [onToken]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#000c", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1c1930", borderRadius: 20, padding: 20, maxWidth: 460, width: "100%", textAlign: "center", border: "1px solid #332e52" }}>
        <div style={{ fontWeight: 900, fontSize: 17, color: "#f0ecff", marginBottom: 4 }}>📷 Giriş Kartını Kameraya Göster</div>
        <div style={{ fontSize: 12, color: "#a79dd0", marginBottom: 12 }}>QR kodu kameranın ortasına getir — otomatik giriş yapılır</div>
        {err
          ? <div style={{ padding: 24, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{err}</div>
          : (
            <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#000" }}>
              <video ref={videoRef} muted playsInline style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
              <div style={{ position: "absolute", inset: "12%", border: "3px solid #F5922A88", borderRadius: 14, pointerEvents: "none" }} />
            </div>
          )}
        <button onClick={onClose} style={{ marginTop: 14, padding: "10px 24px", borderRadius: 10, border: "1px solid #332e52", background: "transparent", color: "#a79dd0", fontWeight: 700, cursor: "pointer" }}>Vazgeç</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// 👨‍👩‍👦 VELİ QR RAPORU — ?veliqr=VL-XXXXXXXXXX (login gerekmez)
// Kit takibi · görevler & süreler · kaldığı görev · ödevler · son 100 log
// ═════════════════════════════════════════════════════════════════════
const LOG_LABELS = {
  login: ["🔓", "Giriş yaptı"], task_start: ["▶️", "Göreve başladı"], task_submit: ["📤", "Görevi onaya gönderdi"],
  task_approve: ["✅", "Görev onaylandı"], task_reject: ["↩️", "Görev geri gönderildi"], help: ["🙋", "Yardım istedi"],
  kit_added: ["🎒", "Kit eklendi"], hw_submit: ["📝", "Ödev teslim etti"], hw_review: ["🧑‍🏫", "Ödev değerlendirildi"],
};
const fmtDT = (ms) => ms ? new Date(Number(ms)).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";
const fmtDur = (ms) => {
  if (!ms || ms < 0) return "-";
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} dk` : `${Math.floor(m / 60)} sa ${m % 60} dk`;
};

// BerryBot'un gömülü 36 görevi DB'de olmayabilir — başlık bulunamazsa numara gösterilir.
export function VeliPublicView({ token }) {
  const [d, setD] = useState(undefined);
  useEffect(() => { db.getParentReport(token).then(setD); }, [token]);

  const card = { background: P.card, borderRadius: 18, padding: 18, marginBottom: 14 };
  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.tp, fontFamily: "system-ui,-apple-system,sans-serif", padding: "24px 14px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 32 }}>🤖</div>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>ROBO<span style={{ color: P.orange }}>GPT</span></div>
          <div style={{ fontSize: 12, color: P.tm, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Veli Takip Raporu</div>
        </div>
        {children}
      </div>
    </div>
  );

  if (d === undefined) return wrap(<div style={{ textAlign: "center", color: P.ts, padding: 40 }}>Rapor hazırlanıyor...</div>);
  if (d === null) return wrap(<div style={{ ...card, textAlign: "center", padding: 36 }}><div style={{ fontSize: 38 }}>🔍</div><b>Rapor bulunamadı</b><div style={{ color: P.ts, fontSize: 13, marginTop: 6 }}>QR eski olabilir — eğitmeninizle iletişime geçin.</div></div>);

  const taskTitle = (kit, id) => d.tasks.find(t => t.kit === kit && Number(t.task_id) === Number(id))?.title || `Görev ${id}`;
  const byKit = {};
  d.progress.forEach(p => { const k = p.kit || "berrybot"; (byKit[k] = byKit[k] || []).push(p); });

  // toplam çalışma süresi + görev sayıları
  let totalMs = 0, doneCount = 0;
  d.progress.forEach(p => {
    if (p.status === "approved") {
      doneCount++;
      if (p.completed_at && p.started_at) totalMs += Math.max(0, p.completed_at - p.started_at - (p.paused_ms || 0));
    }
  });
  const activeTasks = d.progress.filter(p => p.status === "active" || p.status === "in_progress" || p.status === "pending_review");
  const toplamTamir = d.kitEvents.reduce((a, e) => a + (Number(e.cost) || 0), 0);

  return wrap(<>
    {/* Öğrenci başlığı + özet */}
    <div style={{ ...card, border: `2px solid ${P.orange}55` }}>
      <div style={{ fontWeight: 900, fontSize: 20 }}>{d.student.name}</div>
      <div style={{ fontSize: 12, color: P.ts, marginBottom: 12 }}>Kayıt: {fmtDate(d.student.since)} · Kitler: {d.kits.map(k => `${KITS[k]?.icon || ""} ${KITS[k]?.name || k}`).join(" · ")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
        {[["✅ Tamamlanan", doneCount + " görev"], ["⏱️ Toplam Çalışma", fmtDur(totalMs)], ["🔧 Tamir Masrafı", toplamTamir > 0 ? fmtTL(toplamTamir) : "Yok 💪"]].map(([l, v]) => (
          <div key={l} style={{ background: P.input, borderRadius: 12, padding: "10px 6px" }}>
            <div style={{ fontSize: 11, color: P.tm, fontWeight: 700 }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Şu an kaldığı görev(ler) */}
    <div style={card}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10 }}>🎯 Şu An Kaldığı Görev</div>
      {activeTasks.length === 0 && <div style={{ color: P.tm, fontSize: 13 }}>Aktif görev yok.</div>}
      {activeTasks.map(p => (
        <div key={`${p.kit}-${p.task_id}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 11, background: P.input, marginBottom: 6, border: `1px solid ${P.orange}44` }}>
          <div style={{ fontSize: 20 }}>{KITS[p.kit]?.icon || "🤖"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{taskTitle(p.kit, p.task_id)}</div>
            <div style={{ fontSize: 11, color: P.ts }}>{KITS[p.kit]?.name || p.kit} · {p.status === "pending_review" ? "🕐 Eğitmen onayı bekleniyor" : p.status === "in_progress" ? "▶️ Şu an çalışıyor" : "Sırada"}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Kit durumu */}
    <div style={card}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10 }}>🔧 Kit Durumu</div>
      {d.kitUnits.map(u => {
        const S = KIT_STATUS[u.status] || KIT_STATUS.saglam;
        const evs = d.kitEvents.filter(e => e.unit_id === u.id);
        const cost = evs.reduce((a, e) => a + (Number(e.cost) || 0), 0);
        return (
          <div key={u.id} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 11, background: P.input, border: `1px solid ${S.c}44` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b style={{ fontSize: 13 }}>{KITS[u.kit]?.icon} {KITS[u.kit]?.name || u.kit}</b>
              <span style={{ color: S.c, fontWeight: 800, fontSize: 13 }}>{S.e} {S.l}</span>
            </div>
            {evs.slice(0, 4).map(e => {
              const E = KIT_EVENT[e.type] || KIT_EVENT.not;
              return <div key={e.id} style={{ fontSize: 11, color: P.ts, marginTop: 5 }}>{E.e} {fmtDate(e.event_date)} — {e.description || E.l}{Number(e.cost) > 0 ? ` (${fmtTL(e.cost)})` : ""}</div>;
            })}
            {cost > 0 && <div style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800, marginTop: 5 }}>Toplam: {fmtTL(cost)}</div>}
          </div>
        );
      })}
    </div>

    {/* Görevler & süreler (kit bazlı) */}
    {Object.entries(byKit).map(([k, rows]) => {
      const done = rows.filter(p => p.status === "approved").sort((a, b) => (b.approved_at || 0) - (a.approved_at || 0));
      return (
        <div key={k} style={card}>
          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 8 }}>
            {KITS[k]?.icon} {KITS[k]?.name || k} — Tamamlanan Görevler ({done.length}/{rows.length})
          </div>
          <div style={{ height: 8, background: P.input, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", width: `${rows.length ? Math.round(done.length / rows.length * 100) : 0}%`, background: `linear-gradient(90deg,${P.orange},#4ade80)` }} />
          </div>
          {done.length === 0 && <div style={{ color: P.tm, fontSize: 12 }}>Henüz tamamlanan görev yok.</div>}
          {done.map(p => (
            <div key={p.task_id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 10px", borderRadius: 9, background: P.input, marginBottom: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 700, flex: 1 }}>✅ {taskTitle(k, p.task_id)}</span>
              <span style={{ color: P.ts, whiteSpace: "nowrap" }}>⏱ {fmtDur(p.completed_at && p.started_at ? p.completed_at - p.started_at - (p.paused_ms || 0) : 0)}</span>
              <span style={{ color: P.tm, whiteSpace: "nowrap" }}>{fmtDate(p.approved_at)}</span>
            </div>
          ))}
        </div>
      );
    })}

    {/* Ödevler */}
    <div style={card}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10 }}>📝 Ödevler</div>
      {d.hwAssignments.length === 0 && <div style={{ color: P.tm, fontSize: 13 }}>Henüz ödev atanmamış.</div>}
      {d.hwAssignments.map(a => {
        const t = d.hwTemplates.find(x => x.id === a.template_id);
        const st = a.status === "reviewed" || a.status === "approved" ? ["✅", "Değerlendirildi", "#4ade80"]
          : a.status === "submitted" ? ["📤", "Teslim edildi", "#22d3ee"]
          : ["⏳", "Bekliyor", "#fbbf24"];
        return (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "9px 12px", borderRadius: 10, background: P.input, marginBottom: 5, fontSize: 12 }}>
            <span style={{ fontWeight: 700, flex: 1 }}>{t?.title || "Ödev"}</span>
            <span style={{ color: st[2], fontWeight: 800, whiteSpace: "nowrap" }}>{st[0]} {st[1]}</span>
            <span style={{ color: P.tm, whiteSpace: "nowrap" }}>{fmtDate(a.due_date)}</span>
          </div>
        );
      })}
    </div>

    {/* Audit log — son 100 */}
    <div style={card}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 10 }}>📋 Aktivite Geçmişi <span style={{ fontSize: 11, color: P.tm, fontWeight: 600 }}>(son {d.logs.length} kayıt)</span></div>
      <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {d.logs.map(l => {
          const L = LOG_LABELS[l.type] || ["•", l.type];
          return (
            <div key={l.id} style={{ display: "flex", gap: 8, padding: "6px 10px", borderRadius: 8, background: P.input, fontSize: 11.5 }}>
              <span>{L[0]}</span>
              <span style={{ flex: 1, color: P.ts }}>{l.detail || L[1]}</span>
              <span style={{ color: P.tm, whiteSpace: "nowrap" }}>{fmtDT(l.ts)}</span>
            </div>
          );
        })}
      </div>
    </div>

    <div style={{ textAlign: "center", fontSize: 11, color: P.tm, marginTop: 16 }}>
      Bu sayfa otomatik güncellenir — aynı QR'ı istediğiniz zaman tekrar okutabilirsiniz. · RoboGPT Robotik Eğitim
    </div>
  </>);
}
