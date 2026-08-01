import { useState, useEffect, useCallback } from "react";
import * as dc from "./dataCleanup";

// ═══════════════════════════════════════════════════════════════
//  VERİ TEMİZLİĞİ PANELİ (admin)
//  Kural: hiçbir şey önizlemesiz silinmez, hiçbir şey yedeksiz gitmez.
// ═══════════════════════════════════════════════════════════════

const RISK = {
  dusuk: { renk: "#4ade80", etiket: "Güvenli" },
  orta: { renk: "#fbbf24", etiket: "Dikkat" },
  yuksek: { renk: "#f87171", etiket: "İnceleme gerekir" },
};

export default function DataCleanup({ user, T, onRefresh }) {
  const [sekme, setSekme] = useState("genel");
  const [analiz, setAnaliz] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bildirim, setBildirim] = useState(null);

  const Card = ({ children, style = {} }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, ...style }}>
      {children}
    </div>
  );

  const bildir = (mesaj, tip = "ok") => {
    setBildirim({ mesaj, tip });
    setTimeout(() => setBildirim(null), 6000);
  };

  const analizYukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      setAnaliz(await dc.analizEt());
    } catch (e) {
      bildir("Analiz yapılamadı: " + e.message, "err");
    }
    setYukleniyor(false);
  }, []);

  useEffect(() => { analizYukle(); }, [analizYukle]);

  const SEKMELER = [
    { k: "genel", ad: "📊 Durum", },
    { k: "ayrilan", ad: "🎓 Ayrılanlar" },
    { k: "arsiv", ad: "📦 Arşiv" },
    { k: "hizli", ad: "🧹 Hızlı Temizlik" },
    { k: "defter", ad: "📒 Defter" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.orange, margin: 0 }}>🧹 Veri Temizliği</h1>
          <div style={{ fontSize: 13, color: T.ts, marginTop: 4 }}>
            Sistemde yer açar. Silinen her şey önce önizlenir, kalıcı silmeden önce yedeklenir.
          </div>
        </div>
        <button onClick={analizYukle} disabled={yukleniyor}
          style={{ fontSize: 14, padding: "8px 20px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.input, color: T.tp, cursor: yukleniyor ? "wait" : "pointer", fontWeight: 700 }}>
          {yukleniyor ? "Taranıyor..." : "↻ Yeniden tara"}
        </button>
      </div>

      {bildirim && (
        <div style={{
          padding: "12px 18px", borderRadius: 12, marginBottom: 14, fontSize: 14, fontWeight: 600,
          background: bildirim.tip === "err" ? "#5c1a1a" : "#1a4a2e",
          color: bildirim.tip === "err" ? "#fca5a5" : "#86efac",
          border: `1px solid ${bildirim.tip === "err" ? "#f8717155" : "#4ade8055"}`,
        }}>{bildirim.mesaj}</div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {SEKMELER.map(s => (
          <button key={s.k} onClick={() => setSekme(s.k)} style={{
            padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14,
            fontWeight: sekme === s.k ? 800 : 500,
            border: sekme === s.k ? `1px solid ${T.orange}66` : `1px solid ${T.border}`,
            background: sekme === s.k ? T.orange + "22" : "transparent",
            color: sekme === s.k ? T.orange : T.ts,
          }}>{s.ad}</button>
        ))}
      </div>

      {sekme === "genel" && <GenelBakis analiz={analiz} yukleniyor={yukleniyor} T={T} Card={Card} onGit={setSekme} />}
      {sekme === "ayrilan" && <AyrilanlarSekmesi user={user} T={T} Card={Card} bildir={bildir} onDegisim={() => { analizYukle(); onRefresh?.(); }} />}
      {sekme === "arsiv" && <ArsivSekmesi user={user} T={T} Card={Card} bildir={bildir} onDegisim={() => { analizYukle(); onRefresh?.(); }} />}
      {sekme === "hizli" && <HizliTemizlik user={user} T={T} Card={Card} bildir={bildir} onDegisim={analizYukle} />}
      {sekme === "defter" && <Defter T={T} Card={Card} bildir={bildir} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SEKME 1 — GENEL BAKIŞ
// ═══════════════════════════════════════════════════════════════
function GenelBakis({ analiz, yukleniyor, T, Card, onGit }) {
  if (yukleniyor) return <Card><div style={{ color: T.ts, textAlign: "center", padding: 30 }}>Veritabanı taranıyor...</div></Card>;
  if (!analiz) return <Card><div style={{ color: T.err }}>Analiz yüklenemedi.</div></Card>;

  const enBuyuk = analiz.tablolar.slice(0, 8);
  const maxBytes = Math.max(...enBuyuk.map(t => t.bytes), 1);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!analiz.statsVar && (
        <Card style={{ borderColor: T.warn + "66", background: T.warn + "0d" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.warn, marginBottom: 6 }}>⚠ Migration çalıştırılmamış</div>
          <div style={{ fontSize: 13, color: T.ts, lineHeight: 1.6 }}>
            Gerçek disk boyutlarını ve kalıcı silmeyi görmek için Supabase Dashboard → SQL Editor'da{" "}
            <code style={{ background: T.dark, padding: "2px 7px", borderRadius: 5, color: T.orange }}>supabase/006_data_cleanup.sql</code>{" "}
            dosyasını bir kez çalıştır. Şimdilik yalnızca satır sayıları gösteriliyor.
          </div>
        </Card>
      )}

      {/* Tablo boyutları */}
      <Card>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.tp, marginBottom: 4 }}>Yeri ne dolduruyor?</div>
        <div style={{ fontSize: 13, color: T.ts, marginBottom: 14 }}>
          {analiz.statsVar ? `Toplam ${dc.boyutYaz(analiz.toplamBytes)}` : "Satır sayısına göre sıralandı"}
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          {enBuyuk.map(t => (
            <div key={t.tablo}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: T.tp, fontWeight: 600 }}>{t.tablo}</span>
                <span style={{ color: T.ts }}>
                  {t.satir.toLocaleString("tr-TR")} satır{t.boyut !== "—" ? ` · ${t.boyut}` : ""}
                </span>
              </div>
              <div style={{ height: 7, background: T.dark, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${Math.max(2, (analiz.statsVar ? t.bytes / maxBytes : t.satir / Math.max(...enBuyuk.map(x => x.satir), 1)) * 100)}%`,
                  background: `linear-gradient(90deg,${T.purple},${T.orange})`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bulgular */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.tp, marginBottom: 4 }}>
          Bulunanlar {analiz.bulgular.length > 0 && <span style={{ color: T.orange }}>({analiz.bulgular.length})</span>}
        </div>
        <div style={{ fontSize: 13, color: T.ts, marginBottom: 12 }}>
          Hiçbiri otomatik silinmez. Her biri için sen karar verirsin.
        </div>

        {analiz.bulgular.length === 0 ? (
          <Card><div style={{ color: T.ok, textAlign: "center", padding: 24, fontSize: 15 }}>
            ✓ Temizlenecek gereksiz veri bulunamadı.
          </div></Card>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {analiz.bulgular.map(b => {
              const r = RISK[b.risk] || RISK.dusuk;
              return (
                <Card key={b.id} style={{ borderLeft: `4px solid ${r.renk}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: T.tp }}>{b.baslik}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: r.renk + "22", color: r.renk }}>{r.etiket}</span>
                      </div>
                      <div style={{ fontSize: 13, color: T.ts, lineHeight: 1.6, marginBottom: 8 }}>{b.aciklama}</div>
                      <div style={{ fontSize: 13, color: T.tm, lineHeight: 1.5 }}>→ {b.tavsiye}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: r.renk }}>{b.sayi.toLocaleString("tr-TR")}</div>
                      <button onClick={() => onGit(
                        b.id === "arsiv_ogrenci" ? "arsiv" : b.id === "atil_ogrenci" ? "ayrilan" : "hizli"
                      )} style={{
                        marginTop: 6, fontSize: 12, padding: "5px 12px", borderRadius: 8,
                        border: `1px solid ${T.border}`, background: T.input, color: T.tp, cursor: "pointer", fontWeight: 600,
                      }}>Göster →</button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SEKME 2 — AYRILANLAR (arşive taşı)
// ═══════════════════════════════════════════════════════════════
function AyrilanlarSekmesi({ user, T, Card, bildir, onDegisim }) {
  const [gun, setGun] = useState(180);
  const [liste, setListe] = useState([]);
  const [secili, setSecili] = useState(new Set());
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sebep, setSebep] = useState("Ayrıldı");
  const [islemde, setIslemde] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      setListe(await dc.ayrilanAdaylari({ gun }));
      setSecili(new Set());
    } catch (e) { bildir("Liste yüklenemedi: " + e.message, "err"); }
    setYukleniyor(false);
  }, [gun]);

  useEffect(() => { yukle(); }, [yukle]);

  const secimDegis = (id) => {
    const y = new Set(secili);
    y.has(id) ? y.delete(id) : y.add(id);
    setSecili(y);
  };

  const arsivle = async () => {
    if (secili.size === 0) return;
    setIslemde(true);
    try {
      const r = await dc.arsivle([...secili], { sebep, yapan: user });
      bildir(`${r.sayi} öğrenci arşive taşındı. Giriş yapamazlar ama verileri duruyor — 30 gün sonra kalıcı silinebilir.`);
      await yukle();
      onDegisim?.();
    } catch (e) { bildir(e.message, "err"); }
    setIslemde(false);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.tp, marginBottom: 6 }}>Uzun süredir giriş yapmayanlar</div>
        <div style={{ fontSize: 13, color: T.ts, lineHeight: 1.6, marginBottom: 14 }}>
          Bu liste bir tahmin — sistem kimin ayrıldığını bilemez, sadece kimin girmediğini bilir.
          İşaretlediklerin <strong style={{ color: T.tp }}>arşive</strong> taşınır: giriş yapamazlar, listelerde görünmezler,
          ama tüm verileri durur ve tek tıkla geri alınır. Kalıcı silme ayrı bir adımdır.
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: T.ts }}>Kaç gündür girmemiş:</span>
          {[90, 180, 365].map(g => (
            <button key={g} onClick={() => setGun(g)} style={{
              padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700,
              border: gun === g ? `1px solid ${T.orange}66` : `1px solid ${T.border}`,
              background: gun === g ? T.orange + "22" : T.input,
              color: gun === g ? T.orange : T.ts,
            }}>{g} gün</button>
          ))}
        </div>
      </Card>

      {yukleniyor ? (
        <Card><div style={{ color: T.ts, textAlign: "center", padding: 24 }}>Taranıyor...</div></Card>
      ) : liste.length === 0 ? (
        <Card><div style={{ color: T.ok, textAlign: "center", padding: 24 }}>
          ✓ {gun} gündür girmemiş aktif öğrenci yok.
        </div></Card>
      ) : (
        <>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: T.ts }}>
                <input type="checkbox"
                  checked={secili.size === liste.length && liste.length > 0}
                  onChange={e => setSecili(e.target.checked ? new Set(liste.map(l => l.id)) : new Set())}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: T.orange }} />
                Tümünü seç ({liste.length})
              </label>
              <span style={{ fontSize: 13, color: secili.size ? T.orange : T.tm, fontWeight: 700 }}>
                {secili.size} seçili
              </span>
            </div>

            <div style={{ maxHeight: 460, overflowY: "auto" }}>
              {liste.map(s => (
                <label key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                  borderBottom: `1px solid ${T.border}55`, cursor: "pointer",
                  background: secili.has(s.id) ? T.orange + "0f" : "transparent",
                }}>
                  <input type="checkbox" checked={secili.has(s.id)} onChange={() => secimDegis(s.id)}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: T.orange }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.tp }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: T.tm, overflow: "hidden", textOverflow: "ellipsis" }}>{s.email}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: T.ts, whiteSpace: "nowrap" }}>
                    <div>{s.gunOnce === null ? "Hiç girmemiş" : `${s.gunOnce} gün önce`}</div>
                    <div style={{ color: T.tm }}>{s.onayliGorev} görev onaylı</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          {secili.size > 0 && (
            <Card style={{ borderColor: T.warn + "66" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.warn, marginBottom: 10 }}>
                {secili.size} öğrenciyi arşive taşı
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <select value={sebep} onChange={e => setSebep(e.target.value)} style={{
                  padding: "9px 14px", borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.input, color: T.tp, fontSize: 14, outline: "none",
                }}>
                  <option value="Ayrıldı">Ayrıldı</option>
                  <option value="Kursu tamamladı">Kursu tamamladı</option>
                  <option value="Dönem bitti">Dönem bitti</option>
                  <option value="Kayıt iptal">Kayıt iptal</option>
                </select>
                <button onClick={arsivle} disabled={islemde} style={{
                  padding: "10px 24px", borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg,${T.warn},#d97706)`,
                  color: "#1a1035", fontSize: 14, fontWeight: 800, cursor: islemde ? "wait" : "pointer",
                }}>{islemde ? "Taşınıyor..." : "📦 Arşive taşı"}</button>
                <span style={{ fontSize: 12, color: T.ts }}>Geri alınabilir · veri silinmez</span>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SEKME 3 — ARŞİV (kalıcı silme burada)
// ═══════════════════════════════════════════════════════════════
function ArsivSekmesi({ user, T, Card, bildir, onDegisim }) {
  const [liste, setListe] = useState([]);
  const [secili, setSecili] = useState(new Set());
  const [yukleniyor, setYukleniyor] = useState(true);
  const [onizleme, setOnizleme] = useState(null);
  const [onayMetni, setOnayMetni] = useState("");
  const [islemde, setIslemde] = useState(false);

  const ONAY_KELIME = "KALICI SIL";

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      setListe(await dc.arsivdekiler());
      setSecili(new Set()); setOnizleme(null); setOnayMetni("");
    } catch (e) { bildir("Arşiv yüklenemedi: " + e.message, "err"); }
    setYukleniyor(false);
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const secimDegis = (id) => {
    const y = new Set(secili);
    y.has(id) ? y.delete(id) : y.add(id);
    setSecili(y); setOnizleme(null); setOnayMetni("");
  };

  const geriAl = async () => {
    setIslemde(true);
    try {
      const r = await dc.arsivdenCikar([...secili], { yapan: user });
      bildir(`${r.sayi} öğrenci tekrar aktif. Giriş yapabilirler.`);
      await yukle(); onDegisim?.();
    } catch (e) { bildir(e.message, "err"); }
    setIslemde(false);
  };

  const onizle = async () => {
    setIslemde(true);
    try {
      setOnizleme(await dc.silmeOnizleme([...secili]));
    } catch (e) { bildir(e.message, "err"); }
    setIslemde(false);
  };

  const yedekIndir = async () => {
    setIslemde(true);
    try {
      const paket = await dc.veriyiTopla([...secili]);
      dc.yedegiIndir(paket);
      bildir("Yedek indirildi. Dosyayı güvenli bir yerde sakla.");
    } catch (e) { bildir(e.message, "err"); }
    setIslemde(false);
  };

  const sil = async () => {
    if (onayMetni.trim().toUpperCase() !== ONAY_KELIME) return;
    setIslemde(true);
    try {
      const r = await dc.kaliciSil([...secili], { yapan: user, yedekAl: true });
      if (r.hatali.length > 0) {
        bildir(`${r.basarili.length} silindi, ${r.hatali.length} silinemedi: ${r.hatali[0].hata}`, "err");
      } else {
        bildir(`${r.basarili.length} öğrenci ve ${r.toplamSatir.toLocaleString("tr-TR")} satır kalıcı silindi. Yedek indirildi.`);
      }
      await yukle(); onDegisim?.();
    } catch (e) { bildir(e.message, "err"); }
    setIslemde(false);
  };

  const seciliListe = liste.filter(l => secili.has(l.id));
  const erkenVar = seciliListe.some(l => !l.silinebilir);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.tp, marginBottom: 6 }}>Arşivdeki kayıtlar</div>
        <div style={{ fontSize: 13, color: T.ts, lineHeight: 1.6 }}>
          Buradakiler giriş yapamıyor ama verileri hâlâ yer kaplıyor. Kalıcı silme geri alınamaz —
          bu yüzden silmeden önce yedek otomatik indirilir ve bir kopya veritabanında saklanır.
          30 gün beklemiş kayıtlar silinmeye hazırdır.
        </div>
      </Card>

      {yukleniyor ? (
        <Card><div style={{ color: T.ts, textAlign: "center", padding: 24 }}>Yükleniyor...</div></Card>
      ) : liste.length === 0 ? (
        <Card><div style={{ color: T.ts, textAlign: "center", padding: 24 }}>
          Arşiv boş. "Ayrılanlar" sekmesinden öğrenci taşıyabilirsin.
        </div></Card>
      ) : (
        <>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: T.ts }}>
                <input type="checkbox"
                  checked={secili.size === liste.length && liste.length > 0}
                  onChange={e => { setSecili(e.target.checked ? new Set(liste.map(l => l.id)) : new Set()); setOnizleme(null); setOnayMetni(""); }}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: T.err }} />
                Tümünü seç ({liste.length})
              </label>
              <span style={{ fontSize: 13, color: secili.size ? T.err : T.tm, fontWeight: 700 }}>{secili.size} seçili</span>
            </div>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {liste.map(s => (
                <label key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                  borderBottom: `1px solid ${T.border}55`, cursor: "pointer",
                  background: secili.has(s.id) ? T.err + "0f" : "transparent",
                }}>
                  <input type="checkbox" checked={secili.has(s.id)} onChange={() => secimDegis(s.id)}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: T.err }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.tp }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: T.tm }}>{s.email} · {s.arsiv_sebep || "—"}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap",
                    background: s.silinebilir ? T.err + "22" : T.tm + "22",
                    color: s.silinebilir ? T.err : T.tm,
                  }}>
                    {s.arsivGun} gündür arşivde
                  </div>
                </label>
              ))}
            </div>
          </Card>

          {secili.size > 0 && (
            <Card style={{ borderColor: T.err + "55" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <button onClick={geriAl} disabled={islemde} style={{
                  padding: "9px 18px", borderRadius: 9, border: `1px solid ${T.ok}55`,
                  background: T.ok + "18", color: T.ok, fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>↩ Arşivden çıkar</button>
                <button onClick={yedekIndir} disabled={islemde} style={{
                  padding: "9px 18px", borderRadius: 9, border: `1px solid ${T.cyan}55`,
                  background: T.cyan + "18", color: T.cyan, fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>⬇ Yedek indir</button>
                <button onClick={onizle} disabled={islemde} style={{
                  padding: "9px 18px", borderRadius: 9, border: `1px solid ${T.warn}55`,
                  background: T.warn + "18", color: T.warn, fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>🔍 Ne silinecek?</button>
              </div>

              {erkenVar && (
                <div style={{ fontSize: 13, color: T.warn, marginBottom: 12, lineHeight: 1.5 }}>
                  ⚠ Seçilenler arasında 30 günü doldurmamış kayıt var. Silebilirsin, ama bekleme süresi
                  yanlışlıkla arşivlenen bir öğrencinin geri dönmesi için var.
                </div>
              )}

              {onizleme && (
                <div style={{ background: T.dark, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.err, marginBottom: 10 }}>
                    Toplam {onizleme.toplam.toLocaleString("tr-TR")} satır silinecek
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {onizleme.kalemler.map(k => (
                      <div key={k.tablo} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: T.ts }}>{k.ad}</span>
                        <span style={{ color: T.tp, fontWeight: 600 }}>{k.sayi.toLocaleString("tr-TR")}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.tm, lineHeight: 1.6 }}>
                    Silinen kişiler: {onizleme.kisiler.map(k => k.name).join(", ")}
                  </div>
                </div>
              )}

              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <div style={{ fontSize: 13, color: T.ts, marginBottom: 8, lineHeight: 1.5 }}>
                  Kalıcı silmek için aşağıya <strong style={{ color: T.err }}>{ONAY_KELIME}</strong> yaz.
                  Silmeden önce yedek dosyası otomatik indirilecek.
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input value={onayMetni} onChange={e => setOnayMetni(e.target.value)}
                    placeholder={ONAY_KELIME}
                    style={{
                      padding: "10px 14px", borderRadius: 9, border: `1px solid ${T.err}44`,
                      background: T.input, color: T.tp, fontSize: 14, outline: "none",
                      letterSpacing: 1, fontWeight: 700, minWidth: 160,
                    }} />
                  <button onClick={sil}
                    disabled={islemde || onayMetni.trim().toUpperCase() !== ONAY_KELIME}
                    style={{
                      padding: "10px 24px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 800,
                      background: onayMetni.trim().toUpperCase() === ONAY_KELIME
                        ? `linear-gradient(135deg,${T.err},#b91c1c)` : T.input,
                      color: onayMetni.trim().toUpperCase() === ONAY_KELIME ? "#fff" : T.tm,
                      cursor: onayMetni.trim().toUpperCase() === ONAY_KELIME && !islemde ? "pointer" : "not-allowed",
                    }}>
                    {islemde ? "Siliniyor..." : `🗑 ${secili.size} kaydı kalıcı sil`}
                  </button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SEKME 4 — HIZLI TEMİZLİK (kullanıcıya dokunmaz)
// ═══════════════════════════════════════════════════════════════
function HizliTemizlik({ user, T, Card, bildir, onDegisim }) {
  const [durum, setDurum] = useState({});
  const [logGun, setLogGun] = useState(90);

  const calistir = async (id, fn, onizleme) => {
    setDurum(d => ({ ...d, [id]: { calisiyor: true } }));
    try {
      const r = await fn(onizleme);
      setDurum(d => ({ ...d, [id]: { sonuc: r, onizleme } }));
      if (!onizleme) {
        bildir(`${(r.sayi || 0).toLocaleString("tr-TR")} satır temizlendi.`);
        onDegisim?.();
      }
    } catch (e) {
      bildir(e.message, "err");
      setDurum(d => ({ ...d, [id]: {} }));
    }
  };

  const ISLEMLER = [
    {
      id: "log",
      baslik: "Eski işlem kayıtlarını sil",
      aciklama: "Her giriş ve her görev onayı log tablosuna yazılıyor. Bu tablo hiç durmadan büyür ve genelde en çok yeri o kaplar. Silmek öğrenci ilerlemesini etkilemez — sadece eski hareket dökümünü kısaltır.",
      ekstra: (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: T.ts }}>Şundan eskisini sil:</span>
          {[30, 90, 180, 365].map(g => (
            <button key={g} onClick={() => setLogGun(g)} style={{
              padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
              border: logGun === g ? `1px solid ${T.orange}66` : `1px solid ${T.border}`,
              background: logGun === g ? T.orange + "22" : T.input,
              color: logGun === g ? T.orange : T.ts,
            }}>{g} gün</button>
          ))}
        </div>
      ),
      fn: (onizleme) => dc.eskiLoglariSil(logGun, { yapan: user, onizleme }),
    },
    {
      id: "foto",
      baslik: "Bitmiş görevlerin fotoğraflarını sil",
      aciklama: "Görev onaylandıktan veya reddedildikten sonra fotoğrafa ihtiyaç kalmıyor. Hem veritabanı satırı hem Storage dosyası silinir. Onay bekleyen görevlere dokunulmaz.",
      fn: (onizleme) => dc.bitmisFotograflariSil({ yapan: user, onizleme }),
    },
    {
      id: "yetim",
      baslik: "Sahipsiz satırları sil",
      aciklama: "Daha önce silinmiş kullanıcılardan arta kalan görev, ödev ve practice satırları. Bunlara kimse erişemiyor, sadece yer kaplıyorlar.",
      fn: (onizleme) => dc.yetimSatirlariSil({ yapan: user, onizleme }),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card style={{ borderColor: T.ok + "44" }}>
        <div style={{ fontSize: 13, color: T.ts, lineHeight: 1.6 }}>
          Bu sekmedeki işlemler <strong style={{ color: T.tp }}>hiçbir öğrenci kaydına dokunmaz</strong>.
          Sadece birikmiş artıkları temizler. Yine de önce "Önce say" ile ne gideceğini gör.
        </div>
      </Card>

      {ISLEMLER.map(i => {
        const d = durum[i.id] || {};
        return (
          <Card key={i.id}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.tp, marginBottom: 6 }}>{i.baslik}</div>
            <div style={{ fontSize: 13, color: T.ts, lineHeight: 1.6, marginBottom: 12 }}>{i.aciklama}</div>
            {i.ekstra}

            {d.sonuc && (
              <div style={{
                background: T.dark, borderRadius: 9, padding: "10px 14px", marginBottom: 12,
                fontSize: 14, color: d.sonuc.sayi > 0 ? T.warn : T.ok, fontWeight: 700,
              }}>
                {d.sonuc.sayi > 0
                  ? `${d.sonuc.sayi.toLocaleString("tr-TR")} satır ${d.onizleme ? "silinecek" : "silindi"}${d.sonuc.storage ? ` · ${d.sonuc.storage} dosya` : ""}`
                  : "Temizlenecek bir şey yok."}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => calistir(i.id, i.fn, true)} disabled={d.calisiyor} style={{
                padding: "9px 18px", borderRadius: 9, border: `1px solid ${T.border}`,
                background: T.input, color: T.tp, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>{d.calisiyor ? "..." : "🔍 Önce say"}</button>

              {d.sonuc && d.onizleme && d.sonuc.sayi > 0 && (
                <button onClick={() => calistir(i.id, i.fn, false)} disabled={d.calisiyor} style={{
                  padding: "9px 18px", borderRadius: 9, border: "none",
                  background: `linear-gradient(135deg,${T.orange},${T.od})`,
                  color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                }}>🧹 Şimdi temizle</button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SEKME 5 — DEFTER (yapılan temizlikler + yedek kasası)
// ═══════════════════════════════════════════════════════════════
function Defter({ T, Card, bildir }) {
  const [gecmis, setGecmis] = useState([]);
  const [kasa, setKasa] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    const [g, k] = await Promise.all([dc.temizlikGecmisi(50), dc.yedekKasasi(50)]);
    setGecmis(g); setKasa(k); setYukleniyor(false);
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const geriYukle = async (id, ad) => {
    try {
      await dc.kasadanGeriYukle(id);
      bildir(`${ad} geri yüklendi.`);
      yukle();
    } catch (e) { bildir(e.message, "err"); }
  };

  const ISLEM_AD = {
    arsivle: "📦 Arşive taşındı", geri_al: "↩ Arşivden çıkarıldı",
    kalici_sil: "🗑 Kalıcı silindi", log_temizle: "🧹 Log temizliği",
    foto_temizle: "🖼 Fotoğraf temizliği", yetim_temizle: "🧹 Sahipsiz satır temizliği",
    geri_yukle: "♻ Yedekten geri yüklendi",
  };

  if (yukleniyor) return <Card><div style={{ color: T.ts, textAlign: "center", padding: 24 }}>Yükleniyor...</div></Card>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.tp, marginBottom: 12 }}>Yapılan temizlikler</div>
        {gecmis.length === 0 ? (
          <div style={{ color: T.tm, fontSize: 13 }}>Henüz temizlik yapılmamış.</div>
        ) : (
          <div style={{ display: "grid", gap: 8, maxHeight: 400, overflowY: "auto" }}>
            {gecmis.map(g => (
              <div key={g.id} style={{
                display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                padding: "10px 12px", background: T.dark, borderRadius: 9,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tp }}>{ISLEM_AD[g.islem] || g.islem}</div>
                  <div style={{ fontSize: 12, color: T.tm }}>
                    {g.hedef_ad ? `${g.hedef_ad} · ` : ""}{g.yapan_ad || "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.orange }}>
                    {(g.satir_sayisi || 0).toLocaleString("tr-TR")} satır
                  </div>
                  <div style={{ fontSize: 11, color: T.tm }}>
                    {new Date(Number(g.ts)).toLocaleString("tr-TR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ borderColor: T.cyan + "44" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.tp, marginBottom: 4 }}>Yedek kasası</div>
        <div style={{ fontSize: 13, color: T.ts, marginBottom: 12, lineHeight: 1.5 }}>
          Kalıcı silinen her öğrencinin tam kopyası burada. Yanlışlıkla sildiysen geri yükleyebilirsin.
        </div>
        {kasa.length === 0 ? (
          <div style={{ color: T.tm, fontSize: 13 }}>Kasa boş.</div>
        ) : (
          <div style={{ display: "grid", gap: 8, maxHeight: 340, overflowY: "auto" }}>
            {kasa.map(k => (
              <div key={k.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: 12, flexWrap: "wrap", padding: "10px 12px", background: T.dark, borderRadius: 9,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.tp }}>{k.user_ad}</div>
                  <div style={{ fontSize: 12, color: T.tm }}>
                    {k.user_email} · {new Date(Number(k.ts)).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <button onClick={() => geriYukle(k.id, k.user_ad)} style={{
                  padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.cyan}55`,
                  background: T.cyan + "18", color: T.cyan, fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>♻ Geri yükle</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
