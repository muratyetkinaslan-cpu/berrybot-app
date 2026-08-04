// KitTracking.jsx — 🔧 Kit Takip Sistemi
// 1) KitTrackingView : Admin sekmesi — öğrenci×kit listesi, durum, arama/filtre,
//    olay geçmişi (tarih+maliyet), QR önizleme + NIIMBOT B1 etiket baskısı
// 2) KitPublicView   : QR okutulunca açılan halka açık sayfa (veli de görür)
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import QRCode from "qrcode";
import "niimbot-web-bluetooth";
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

  const printLabel = useCallback(async (unit, studentName) => {
    setPrinting(true); setStatus(""); setError(null);
    try {
      const cv = await buildLabelCanvas(unit, studentName);
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

  return { connected, deviceName, printing, status, error, connect, printLabel };
}

// ═════════════════════════════════════════════════════════════════════
// ADMİN SEKMESİ
// ═════════════════════════════════════════════════════════════════════
export function KitTrackingView({ users, T, notify, currentUserName }) {
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

  const doPrint = async () => {
    if (!nb.connected) { notify("Önce NIIMBOT'a bağlan (sağ üst) 🖨️", "err"); return; }
    if (await nb.printLabel(unit, student?.name)) notify("Etiket yazdırıldı 🖨️✅");
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={doPrint} disabled={nb.printing} style={{
              flex: 1, padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13,
              border: "none", background: nb.printing ? T.tm : `linear-gradient(135deg,${T.orange},${T.od})`, color: "#fff",
            }}>{nb.printing ? (nb.status || "Yazdırılıyor...") : "🖨️ Etiket Bas (40×30)"}</button>
            <button onClick={() => { navigator.clipboard?.writeText(kitQrUrl(unit.code)); notify("QR linki kopyalandı 📋"); }}
              style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, border: `1.5px solid ${T.border}`, background: "transparent", color: T.ts }}>🔗</button>
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
