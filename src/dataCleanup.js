// ═══════════════════════════════════════════════════════════════
//  VERİ TEMİZLİĞİ — analiz, önizleme, arşivleme, kalıcı silme
//  Tüm yıkıcı işlemler önce ÖNİZLEME döndürür, sonra uygulanır.
//  Gerekli migration: supabase/006_data_cleanup.sql
// ═══════════════════════════════════════════════════════════════
import { supabase } from './db';

const GUN = 24 * 60 * 60 * 1000;

/** Bir kullanıcıya bağlı tüm veri tabloları (öğrenci silinince temizlenecekler) */
const OGRENCI_TABLOLARI = [
  { tablo: 'bb_progress', kolon: 'student_id', ad: 'Görev ilerlemesi' },
  { tablo: 'bb_student_meta', kolon: 'student_id', ad: 'Online durumu' },
  { tablo: 'bb_practice_progress', kolon: 'student_id', ad: 'Practice kayıtları' },
  { tablo: 'bb_answer_unlock', kolon: 'student_id', ad: 'Cevap açılımları' },
  { tablo: 'bb_homework_submission', kolon: 'student_id', ad: 'Ödev teslimleri (v1)' },
  { tablo: 'bb_homework_assignment', kolon: 'student_id', ad: 'Ödev atamaları (v2)' },
];

/** Temizlik defterine yaz. Hata olsa bile ana işlemi bozmaz. */
async function kaydet(islem, payload = {}) {
  try {
    await supabase.from('bb_cleanup_log').insert({
      islem,
      hedef_tip: payload.hedefTip || null,
      hedef_id: payload.hedefId || null,
      hedef_ad: payload.hedefAd || null,
      satir_sayisi: payload.satir || 0,
      detay: payload.detay || null,
      yapan_id: payload.yapanId || null,
      yapan_ad: payload.yapanAd || null,
    });
  } catch (e) {
    console.warn('cleanup log yazılamadı:', e?.message);
  }
}

async function say(tablo, filtre) {
  let q = supabase.from(tablo).select('*', { count: 'exact', head: true });
  if (filtre) q = filtre(q);
  const { count, error } = await q;
  if (error) return { sayi: 0, yok: true, hata: error.message };
  return { sayi: count || 0 };
}

// ═══════════════════════════════════════════════════════════════
//  1. GENEL ANALİZ — sistem neden doluyor?
// ═══════════════════════════════════════════════════════════════
export async function analizEt() {
  const sonuc = { tablolar: [], bulgular: [], toplamBytes: 0, statsVar: false };

  // Postgres'ten gerçek boyutlar (006 migration gerekli)
  const { data: stats, error: statsErr } = await supabase.rpc('bb_db_stats');
  if (!statsErr && Array.isArray(stats)) {
    sonuc.statsVar = true;
    sonuc.tablolar = stats.map(s => ({
      tablo: s.tablo, satir: Number(s.satir) || 0,
      boyut: s.boyut, bytes: Number(s.boyut_bytes) || 0,
    }));
    sonuc.toplamBytes = sonuc.tablolar.reduce((a, t) => a + t.bytes, 0);
  } else {
    // RPC yoksa satır sayımına düş
    const tablolar = ['bb_users', 'bb_progress', 'bb_logs', 'bb_student_meta',
      'bb_practice_progress', 'bb_answer_unlock', 'bb_homework_assignment',
      'bb_homework_submission', 'bb_tasks', 'bb_homework_templates'];
    for (const t of tablolar) {
      const r = await say(t);
      if (!r.yok) sonuc.tablolar.push({ tablo: t, satir: r.sayi, boyut: '—', bytes: 0 });
    }
  }

  const simdi = Date.now();

  // ── Bulgu 1: eski log satırları (en hızlı büyüyen tablo) ──
  const log90 = await say('bb_logs', q => q.lt('ts', simdi - 90 * GUN));
  const logToplam = await say('bb_logs');
  if (log90.sayi > 0) {
    sonuc.bulgular.push({
      id: 'eski_log',
      baslik: '90 günden eski işlem kaydı',
      sayi: log90.sayi,
      aciklama: `Toplam ${logToplam.sayi} log satırının ${log90.sayi} tanesi 90 günden eski. Her giriş, her görev onayı buraya yazılıyor — en hızlı büyüyen tablo bu.`,
      risk: 'dusuk',
      tavsiye: 'Silinebilir. Öğrenci ilerlemesi etkilenmez, sadece geçmiş hareket dökümü kısalır.',
    });
  }

  // ── Bulgu 2: base64 fotoğraf artıkları ──
  const { count: b64, error: b64err } = await supabase
    .from('bb_progress').select('*', { count: 'exact', head: true }).like('photo', 'data:%');
  if (!b64err && b64 > 0) {
    sonuc.bulgular.push({
      id: 'base64_foto',
      baslik: 'Satır içine gömülü fotoğraf (base64)',
      sayi: b64,
      aciklama: `${b64} görev satırında fotoğraf doğrudan veritabanına gömülmüş. Bir fotoğraf ~1-3 MB yer kaplar; bunlar tek başına GB'larca alan tutabilir.`,
      risk: 'orta',
      tavsiye: 'Onaylanmış görevlerdeki fotoğraflar zaten gereksiz — silinebilir. Onay bekleyenlere dokunulmaz.',
    });
  }

  // ── Bulgu 3: onaylanmış görevlerde duran fotoğraflar ──
  const onayliFoto = await say('bb_progress', q =>
    q.eq('status', 'approved').not('photo', 'is', null));
  if (onayliFoto.sayi > 0) {
    sonuc.bulgular.push({
      id: 'onayli_foto',
      baslik: 'Onaylanmış görevlerde kalan fotoğraf',
      sayi: onayliFoto.sayi,
      aciklama: `Görev onaylandıktan sonra fotoğrafa ihtiyaç kalmıyor ama ${onayliFoto.sayi} satırda hâlâ duruyor.`,
      risk: 'dusuk',
      tavsiye: 'Silinebilir. Görev "Onaylandı" olarak kalır.',
    });
  }

  // ── Bulgu 4: arşivdeki (ayrılmış) öğrenciler ──
  const arsiv = await say('bb_users', q => q.eq('durum', 'Arşiv'));
  if (arsiv.sayi > 0) {
    sonuc.bulgular.push({
      id: 'arsiv_ogrenci',
      baslik: 'Arşivdeki ayrılmış öğrenci',
      sayi: arsiv.sayi,
      aciklama: `${arsiv.sayi} kayıt arşivde bekliyor. Bunlar giriş yapamıyor ama verileri hâlâ yer kaplıyor.`,
      risk: 'yuksek',
      tavsiye: '30 günden uzun süredir arşivdeyse kalıcı silinebilir. Silmeden önce otomatik yedek alınır.',
    });
  }

  // ── Bulgu 5: uzun süredir giriş yapmayan aktif öğrenciler ──
  const { data: eskiMeta } = await supabase
    .from('bb_student_meta').select('student_id, last_seen')
    .lt('last_seen', simdi - 180 * GUN);
  if (eskiMeta && eskiMeta.length > 0) {
    sonuc.bulgular.push({
      id: 'atil_ogrenci',
      baslik: '6 aydır giriş yapmamış öğrenci',
      sayi: eskiMeta.length,
      aciklama: `${eskiMeta.length} öğrenci 180 gündür sisteme girmemiş. Muhtemelen ayrıldılar ama kayıtları aktif duruyor.`,
      risk: 'yuksek',
      tavsiye: 'Listeyi gözden geçir, ayrılanları arşivle. Otomatik silme yapılmaz — önce sen onaylarsın.',
    });
  }

  // ── Bulgu 6: sahipsiz satırlar ──
  const { data: userIds } = await supabase.from('bb_users').select('id');
  const gecerli = new Set((userIds || []).map(u => u.id));
  let yetim = 0;
  const { data: progIds } = await supabase.from('bb_progress').select('student_id').limit(5000);
  const yetimIds = new Set();
  (progIds || []).forEach(r => { if (!gecerli.has(r.student_id)) { yetim++; yetimIds.add(r.student_id); } });
  if (yetim > 0) {
    sonuc.bulgular.push({
      id: 'yetim_satir',
      baslik: 'Sahipsiz görev satırı',
      sayi: yetim,
      aciklama: `${yetim} görev satırı, artık var olmayan ${yetimIds.size} kullanıcıya ait. Eski silme işlemlerinden kalmış artık.`,
      risk: 'dusuk',
      tavsiye: 'Güvenle silinebilir. Bu veriye kimse erişemiyor.',
    });
  }

  return sonuc;
}

// ═══════════════════════════════════════════════════════════════
//  2. AYRILMIŞ OLABİLECEK ÖĞRENCİLERİ BUL
// ═══════════════════════════════════════════════════════════════
export async function ayrilanAdaylari({ gun = 180 } = {}) {
  const esik = Date.now() - gun * GUN;

  const { data: users } = await supabase.from('bb_users')
    .select('id, name, email, role, kit, grup, durum, created_at')
    .eq('role', 'student');

  const { data: meta } = await supabase.from('bb_student_meta').select('student_id, last_seen');
  const metaMap = {};
  (meta || []).forEach(m => { metaMap[m.student_id] = m.last_seen || 0; });

  const { data: prog } = await supabase.from('bb_progress')
    .select('student_id, status').eq('status', 'approved');
  const onayMap = {};
  (prog || []).forEach(p => { onayMap[p.student_id] = (onayMap[p.student_id] || 0) + 1; });

  return (users || [])
    .filter(u => (u.durum || 'Aktif') === 'Aktif')
    .map(u => {
      const sonGoruldu = metaMap[u.id] || 0;
      return {
        ...u,
        sonGoruldu,
        gunOnce: sonGoruldu ? Math.floor((Date.now() - sonGoruldu) / GUN) : null,
        onayliGorev: onayMap[u.id] || 0,
        aday: !sonGoruldu || sonGoruldu < esik,
      };
    })
    .filter(u => u.aday)
    .sort((a, b) => (a.sonGoruldu || 0) - (b.sonGoruldu || 0));
}

// ═══════════════════════════════════════════════════════════════
//  3. ÖNİZLEME — silinmeden önce ne gidecek?
// ═══════════════════════════════════════════════════════════════
export async function silmeOnizleme(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  if (ids.length === 0) return { toplam: 0, kalemler: [], kisiler: [] };

  const kalemler = [];
  let toplam = 0;

  for (const { tablo, kolon, ad } of OGRENCI_TABLOLARI) {
    const { count, error } = await supabase
      .from(tablo).select('*', { count: 'exact', head: true }).in(kolon, ids);
    if (error) continue;
    if (count > 0) { kalemler.push({ tablo, ad, sayi: count }); toplam += count; }
  }

  const { count: logSayi } = await supabase
    .from('bb_logs').select('*', { count: 'exact', head: true }).in('user_id', ids);
  if (logSayi > 0) { kalemler.push({ tablo: 'bb_logs', ad: 'İşlem kayıtları', sayi: logSayi }); toplam += logSayi; }

  const { data: kisiler } = await supabase.from('bb_users')
    .select('id, name, email, role, durum').in('id', ids);

  toplam += (kisiler || []).length;
  kalemler.push({ tablo: 'bb_users', ad: 'Kullanıcı kaydı', sayi: (kisiler || []).length });

  return { toplam, kalemler, kisiler: kisiler || [] };
}

// ═══════════════════════════════════════════════════════════════
//  4. ARŞİVLE — yumuşak silme, geri alınabilir
// ═══════════════════════════════════════════════════════════════
export async function arsivle(userIds, { sebep = 'Ayrıldı', yapan } = {}) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];

  const { data, error } = await supabase.from('bb_users')
    .update({ durum: 'Arşiv', arsiv_at: Date.now(), arsiv_sebep: sebep, arsivleyen: yapan?.id || null })
    .in('id', ids).select('id, name');

  if (error) throw new Error('Arşivleme başarısız: ' + error.message);

  await supabase.from('bb_student_meta').update({ online: false }).in('student_id', ids);

  await kaydet('arsivle', {
    hedefTip: 'user', satir: (data || []).length,
    hedefAd: (data || []).map(d => d.name).join(', ').slice(0, 200),
    detay: { ids, sebep },
    yapanId: yapan?.id, yapanAd: yapan?.name,
  });

  return { sayi: (data || []).length, kisiler: data || [] };
}

export async function arsivdenCikar(userIds, { yapan } = {}) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const { data, error } = await supabase.from('bb_users')
    .update({ durum: 'Aktif', arsiv_at: null, arsiv_sebep: null, arsivleyen: null })
    .in('id', ids).select('id, name');
  if (error) throw new Error('Geri alma başarısız: ' + error.message);

  await kaydet('geri_al', {
    hedefTip: 'user', satir: (data || []).length,
    hedefAd: (data || []).map(d => d.name).join(', ').slice(0, 200),
    detay: { ids }, yapanId: yapan?.id, yapanAd: yapan?.name,
  });
  return { sayi: (data || []).length };
}

export async function arsivdekiler() {
  const { data } = await supabase.from('bb_users')
    .select('id, name, email, role, kit, grup, durum, arsiv_at, arsiv_sebep')
    .eq('durum', 'Arşiv').order('arsiv_at', { ascending: true });
  return (data || []).map(u => ({
    ...u,
    arsivGun: u.arsiv_at ? Math.floor((Date.now() - u.arsiv_at) / GUN) : 0,
    silinebilir: u.arsiv_at ? (Date.now() - u.arsiv_at) > 30 * GUN : false,
  }));
}

// ═══════════════════════════════════════════════════════════════
//  5. YEDEK İNDİR — silmeden önce JSON dosyası
// ═══════════════════════════════════════════════════════════════
export async function veriyiTopla(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const paket = { alindi: new Date().toISOString(), kullanicilar: [] };

  const { data: users } = await supabase.from('bb_users').select('*').in('id', ids);

  for (const u of users || []) {
    const kayit = { profil: u };
    for (const { tablo, kolon } of OGRENCI_TABLOLARI) {
      const { data, error } = await supabase.from(tablo).select('*').eq(kolon, u.id);
      if (!error) kayit[tablo] = data || [];
    }
    const { data: logs } = await supabase.from('bb_logs').select('*').eq('user_id', u.id);
    kayit.bb_logs = logs || [];
    paket.kullanicilar.push(kayit);
  }
  return paket;
}

export function yedegiIndir(paket, dosyaAdi) {
  const ad = dosyaAdi || `berrybot-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(paket, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = ad;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ═══════════════════════════════════════════════════════════════
//  6. KALICI SİL — geri dönüşü yok
//     Kural: sadece ARŞİVDEKİ kayıt silinebilir. RPC bunu zorlar.
// ═══════════════════════════════════════════════════════════════
export async function kaliciSil(userIds, { yapan, yedekAl = true } = {}) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];

  if (yedekAl) {
    const paket = await veriyiTopla(ids);
    yedegiIndir(paket, `silinen-ogrenciler-${new Date().toISOString().slice(0, 10)}.json`);
  }

  const sonuclar = [];
  for (const id of ids) {
    const { data, error } = await supabase.rpc('bb_purge_user', {
      p_user_id: id,
      p_yapan_id: yapan?.id || null,
      p_yapan_ad: yapan?.name || null,
    });
    if (error) {
      sonuclar.push({ id, ok: false, hata: error.message });
    } else {
      sonuclar.push({ id, ...(data || {}) });
    }
  }

  const basarili = sonuclar.filter(r => r.ok);
  const hatali = sonuclar.filter(r => !r.ok);
  const toplamSatir = basarili.reduce((a, r) => a + (r.toplam || 0), 0);

  return { basarili, hatali, toplamSatir };
}

// ═══════════════════════════════════════════════════════════════
//  7. HEDEFLİ TEMİZLİKLER — kullanıcıya dokunmaz
// ═══════════════════════════════════════════════════════════════

/** Eski işlem kayıtlarını sil. Öğrenci verisi etkilenmez. */
export async function eskiLoglariSil(gun = 90, { yapan, onizleme = false } = {}) {
  const esik = Date.now() - gun * GUN;
  const { count } = await supabase.from('bb_logs')
    .select('*', { count: 'exact', head: true }).lt('ts', esik);

  if (onizleme) return { sayi: count || 0, onizleme: true };
  if (!count) return { sayi: 0 };

  const { error } = await supabase.from('bb_logs').delete().lt('ts', esik);
  if (error) throw new Error('Log temizliği başarısız: ' + error.message);

  await kaydet('log_temizle', {
    hedefTip: 'log', satir: count, detay: { gun, esik },
    yapanId: yapan?.id, yapanAd: yapan?.name,
  });
  return { sayi: count };
}

/** Onaylanmış/reddedilmiş görevlerde kalan fotoğrafları sil (Storage dahil). */
export async function bitmisFotograflariSil({ yapan, onizleme = false } = {}) {
  const { data: satirlar, error } = await supabase.from('bb_progress')
    .select('student_id, task_id, photo, status')
    .in('status', ['approved', 'rejected'])
    .not('photo', 'is', null);

  if (error) throw new Error('Fotoğraf taraması başarısız: ' + error.message);
  const liste = satirlar || [];
  if (onizleme) return { sayi: liste.length, onizleme: true };
  if (liste.length === 0) return { sayi: 0 };

  // Storage dosyalarını topla
  const yollar = [];
  for (const s of liste) {
    if (typeof s.photo === 'string' && s.photo.startsWith('http')) {
      try {
        const m = new URL(s.photo).pathname.match(/\/task-media\/(.+)$/);
        if (m) yollar.push(decodeURIComponent(m[1]));
      } catch { /* bozuk URL, atla */ }
    }
  }
  if (yollar.length > 0) {
    for (let i = 0; i < yollar.length; i += 100) {
      await supabase.storage.from('task-media').remove(yollar.slice(i, i + 100));
    }
  }

  // DB kolonunu boşalt
  const { error: updErr } = await supabase.from('bb_progress')
    .update({ photo: null })
    .in('status', ['approved', 'rejected'])
    .not('photo', 'is', null);
  if (updErr) throw new Error('Fotoğraf temizliği başarısız: ' + updErr.message);

  await kaydet('foto_temizle', {
    hedefTip: 'progress', satir: liste.length,
    detay: { dbSatir: liste.length, storageDosya: yollar.length },
    yapanId: yapan?.id, yapanAd: yapan?.name,
  });
  return { sayi: liste.length, storage: yollar.length };
}

/** Silinmiş kullanıcılardan arta kalan sahipsiz satırları temizle. */
export async function yetimSatirlariSil({ yapan, onizleme = false } = {}) {
  const { data: users } = await supabase.from('bb_users').select('id');
  const gecerli = new Set((users || []).map(u => u.id));

  const detay = {};
  let toplam = 0;

  for (const { tablo, kolon } of OGRENCI_TABLOLARI) {
    const { data, error } = await supabase.from(tablo).select(kolon);
    if (error) continue;
    const yetimler = [...new Set((data || [])
      .map(r => r[kolon]).filter(v => v && !gecerli.has(v)))];
    if (yetimler.length === 0) continue;

    const satirSayisi = (data || []).filter(r => !gecerli.has(r[kolon])).length;
    detay[tablo] = satirSayisi;
    toplam += satirSayisi;

    if (!onizleme) {
      for (let i = 0; i < yetimler.length; i += 50) {
        await supabase.from(tablo).delete().in(kolon, yetimler.slice(i, i + 50));
      }
    }
  }

  if (onizleme) return { sayi: toplam, detay, onizleme: true };
  if (toplam === 0) return { sayi: 0, detay };

  await kaydet('yetim_temizle', {
    hedefTip: 'orphan', satir: toplam, detay,
    yapanId: yapan?.id, yapanAd: yapan?.name,
  });
  return { sayi: toplam, detay };
}

// ═══════════════════════════════════════════════════════════════
//  8. DEFTER — yapılan tüm temizlikler
// ═══════════════════════════════════════════════════════════════
export async function temizlikGecmisi(limit = 50) {
  const { data, error } = await supabase.from('bb_cleanup_log')
    .select('*').order('ts', { ascending: false }).limit(limit);
  if (error) return [];
  return data || [];
}

export async function yedekKasasi(limit = 50) {
  const { data, error } = await supabase.from('bb_deleted_archive')
    .select('id, user_id, user_ad, user_email, silen_ad, ts')
    .order('ts', { ascending: false }).limit(limit);
  if (error) return [];
  return data || [];
}

export async function kasadanGeriYukle(archiveId) {
  const { data, error } = await supabase.rpc('bb_restore_from_archive', { p_archive_id: archiveId });
  if (error) throw new Error('Geri yükleme başarısız: ' + error.message);
  if (data && data.ok === false) throw new Error(data.hata || 'Geri yükleme başarısız');
  return data;
}

export function boyutYaz(bytes) {
  if (!bytes) return '—';
  const b = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${b[i]}`;
}
