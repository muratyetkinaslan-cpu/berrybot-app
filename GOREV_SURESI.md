# ⏱ Görev Süresi Kontrolü

Eğitmen bir öğrencinin görev sayacını durdurabilir, devam ettirebilir veya
istediği süreden başlatabilir.

## Kurulum (tek seferlik)

Supabase Dashboard → SQL Editor → `supabase/007_task_timer.sql` → Run.

`bb_progress` tablosuna 4 kolon ekler: `paused_at`, `paused_ms`,
`time_adjusted_by`, `time_adjusted_at`. Mevcut veriye dokunmaz.

## Nerede

**Tek öğrenci** — Eğitmen paneli → öğrenciye tıkla → görev satırındaki **⏱** butonu.
Admin de aynı ekrandan (Kullanıcılar → öğrenci) erişir.

**Tüm sınıf** — Eğitmen panelinin üstündeki "Sınıf sayacı" kartı.
Ara verirken tek tuşla herkesin sayacını durdurup devam ettirirsin.

## Ne yapar

| Buton | Etki |
|---|---|
| ⏸ Durdur | Sayaç donar. Öğrencinin ekranında da anında durur ve "eğitmenin sayacı durdurdu" yazar. |
| ▶ Devam ettir | Kaldığı yerden devam eder. Duraklamada geçen süre **atlanır**. |
| 5 / 10 / 15 / 20 dk | Sayacı o süreden başlatır. |
| Serbest dakika girişi | İstediğin dakikadan başlatır (0–1440). |
| ↺ Sıfırla | Sayacı 00:00'a çeker, çalışmaya devam eder. |

## Süre nasıl hesaplanıyor

```
çalışıyorsa : şimdi       − başlangıç − duraklamada_geçen
duraklıysa  : duraklatıldığı_an − başlangıç − duraklamada_geçen
bittiyse    : teslim_anı   − başlangıç − duraklamada_geçen
```

**Duraklamada geçen süre hiçbir yere yansımaz** — performans puanına da,
CV'deki toplam süreye de, veli raporuna da. Tüm ekranlar bu tek formülü kullanır.

## Davranış notları

- **Teslim edilmiş görevde** durdur/devam yoktur; sadece kayıtlı süreyi
  düzeltebilirsin. Süre düzeltilince performans puanı otomatik yeniden hesaplanır.
- **Süre ayarlamak görevi başlatır.** Henüz başlamamış veya reddedilmiş bir
  göreve süre verirsen durumu "Devam Ediyor" olur.
- **Duraklı görevde süre ayarlarsan duraklı kalır** — sadece gösterilen rakam değişir.
- **Öğrenci duraklıyken teslim ederse** açık duraklama otomatik kapanır,
  o süre puanına yansımaz.
- **"Takılmış öğrenci" uyarısı** duraklatılmış sayaçları artık saymaz —
  ara verdiğin için kimse yanlışlıkla "30 dakikadır takılı" görünmez.
- Her müdahale Audit'e yazılır: kim, hangi öğrenci, hangi görev, ne zaman.

## Değişen dosyalar

- `supabase/007_task_timer.sql` — yeni migration
- `src/db.js` — `pauseTaskTimer`, `resumeTaskTimer`, `setTaskElapsed`, `bulkTimerControl`
- `src/useData.js` — `pauseTimer`, `resumeTimer`, `setTimerTo`, `bulkTimer`
- `src/App.jsx` — `gecenSure()` / `tamamlanmaSuresi()` yardımcıları, `TimerControl` paneli,
  sınıf sayacı kartı, öğrenci ekranında duraklatma göstergesi
