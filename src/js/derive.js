import { state } from './store.js';
import { bugun, yuvarla, topla } from './util.js';

export const CEK_DURUM = {
  alacak: { bekliyor: 'Portföyde', tahsilde: 'Tahsile Verildi', tamam: 'Tahsil Edildi', ciro: 'Ciro Edildi', karsiliksiz: 'Karşılıksız', iade: 'İade Edildi' },
  borc: { bekliyor: 'Ödenecek', tamam: 'Ödendi', karsiliksiz: 'Karşılıksız', iade: 'İptal / İade' },
};

export const DURUM_TON = { bekliyor: 'info', tahsilde: 'warn', tamam: 'ok', ciro: 'mute', karsiliksiz: 'bad', iade: 'mute' };

export function cekEtkisi(c) {
  if (c.durum === 'tamam') return 'gerceklesen';
  if (c.durum === 'bekliyor' || c.durum === 'tahsilde') return 'bekleyen';
  return 'yok';
}

export const cariAdi = (id) => state.cariler.find((c) => c.id === id)?.unvan || '';

export function kalemler() {
  const cikti = [];
  for (const c of state.cekSenetler) {
    const etki = cekEtkisi(c);
    if (etki === 'yok') continue;
    const tamam = etki === 'gerceklesen';
    cikti.push({
      key: `cek:${c.id}`, kaynak: 'cek', kaynakId: c.id, yon: c.yon === 'alacak' ? 1 : -1, vade: c.vade, tutar: c.tutar,
      odenen: tamam ? c.tutar : 0, odemeTarihi: tamam ? c.durumTarihi || c.vade : '',
      baslik: `${c.tur === 'cek' ? 'Çek' : 'Senet'}${c.no ? ' ' + c.no : ''}`, cariId: c.cariId,
      kategori: c.yon === 'alacak' ? 'Çek/Senet Tahsilatı' : 'Çek/Senet Ödemesi', detay: c.banka || '',
    });
  }
  for (const b of state.borclar) {
    b.plan.forEach((p, i) => cikti.push({
      key: `borc:${b.id}:${p.id}`, kaynak: 'borc', kaynakId: b.id, satirId: p.id, yon: -1, vade: p.vade, tutar: p.tutar,
      odenen: p.odenen || 0, odemeTarihi: p.odemeTarihi || '', baslik: b.baslik, cariId: b.cariId, kategori: 'Borç Ödemesi',
      detay: p.aciklama || (b.plan.length > 1 ? `${i + 1}/${b.plan.length}. taksit` : ''),
    }));
  }
  for (const k of state.kiralar) {
    k.plan.forEach((p, i) => cikti.push({
      key: `kira:${k.id}:${p.id}`, kaynak: 'kira', kaynakId: k.id, satirId: p.id, yon: k.yon === 'gelir' ? 1 : -1, vade: p.vade, tutar: p.tutar,
      odenen: p.odenen || 0, odemeTarihi: p.odemeTarihi || '', baslik: `Kira – ${k.tasinmaz}`, cariId: k.cariId,
      kategori: k.yon === 'gelir' ? 'Kira Geliri' : 'Kira Gideri', detay: p.aciklama || `${i + 1}/${k.plan.length}. ay`,
    }));
  }
  for (const h of state.hareketler) {
    cikti.push({
      key: `hareket:${h.id}`, kaynak: 'hareket', kaynakId: h.id, yon: h.yon === 'gelir' ? 1 : -1, vade: h.vade, tutar: h.tutar,
      odenen: h.odenen || 0, odemeTarihi: h.odemeTarihi || '', baslik: h.aciklama, cariId: h.cariId, kategori: h.kategori || 'Diğer', detay: '',
    });
  }
  for (const x of cikti) {
    x.cariAd = cariAdi(x.cariId);
    x.kalan = yuvarla(Math.max(0, x.tutar - x.odenen));
  }
  return cikti;
}

export function kalemDurumu(x, ref = bugun()) {
  if (x.kalan <= 0.005) return 'odendi';
  if (x.vade < ref) return 'gecikmis';
  if (x.odenen > 0) return 'kismi';
  return 'bekliyor';
}

export function durumEtiketi(x) {
  const d = kalemDurumu(x);
  if (d === 'odendi') return { metin: x.yon > 0 ? 'Tahsil Edildi' : 'Ödendi', ton: 'ok' };
  if (d === 'gecikmis') return { metin: 'Gecikmiş', ton: 'bad' };
  if (d === 'kismi') return { metin: 'Kısmi Ödendi', ton: 'warn' };
  return { metin: 'Bekliyor', ton: 'info' };
}

export const KAYNAK_ETIKET = { cek: 'Çek/Senet', borc: 'Borç', kira: 'Kira', hareket: 'Gelir/Gider' };
export const KAYNAK_GORUNUM = { cek: 'cek', borc: 'borc', kira: 'kira', hareket: 'hareket' };

export function nakitSatirlari(liste) {
  const r = [];
  for (const x of liste) {
    if (x.odenen > 0.005) r.push({ tarih: x.odemeTarihi || x.vade, yon: x.yon, tutar: x.odenen, gerceklesen: true, kalem: x });
    if (x.kalan > 0.005) r.push({ tarih: x.vade, yon: x.yon, tutar: x.kalan, gerceklesen: false, kalem: x });
  }
  r.sort((a, b) => a.tarih.localeCompare(b.tarih) || Number(b.gerceklesen) - Number(a.gerceklesen) || b.yon - a.yon);
  let bakiye = state.ayarlar.acilisBakiyesi || 0;
  for (const s of r) {
    bakiye = yuvarla(bakiye + s.yon * s.tutar);
    s.bakiye = bakiye;
  }
  return r;
}

export function aylikOzet(satirlar, yil) {
  let devir = state.ayarlar.acilisBakiyesi || 0;
  satirlar.forEach((s) => {
    if (s.tarih < `${yil}-01-01`) devir = yuvarla(devir + s.yon * s.tutar);
  });
  const aylar = [];
  for (let m = 1; m <= 12; m++) {
    const on = `${yil}-${String(m).padStart(2, '0')}`;
    const ay = satirlar.filter((s) => s.tarih.startsWith(on));
    const gelen = topla(ay.filter((s) => s.yon > 0), (s) => s.tutar);
    const giden = topla(ay.filter((s) => s.yon < 0), (s) => s.tutar);
    const baslangic = devir;
    devir = yuvarla(devir + gelen - giden);
    aylar.push({ ay: m, on, gelen, giden, net: yuvarla(gelen - giden), baslangic, bitis: devir, adet: ay.length });
  }
  return aylar;
}

export function cariBakiyeleri() {
  const liste = kalemler();
  return state.cariler.map((c) => {
    const k = liste.filter((x) => x.cariId === c.id);
    const alacak = topla(k.filter((x) => x.yon > 0), (x) => x.kalan);
    const borc = topla(k.filter((x) => x.yon < 0), (x) => x.kalan);
    return { cari: c, alacak, borc, net: yuvarla(alacak - borc), adet: k.length };
  });
}

export function planOzet(plan) {
  const toplam = topla(plan, (p) => p.tutar);
  const odenen = topla(plan, (p) => Math.min(p.odenen || 0, p.tutar));
  const kalan = yuvarla(toplam - odenen);
  const sonraki = plan.filter((p) => (p.tutar - (p.odenen || 0)) > 0.005).sort((a, b) => a.vade.localeCompare(b.vade))[0];
  const odenenAdet = plan.filter((p) => (p.tutar - (p.odenen || 0)) <= 0.005).length;
  const gecikmis = plan.some((p) => (p.tutar - (p.odenen || 0)) > 0.005 && p.vade < bugun());
  return { toplam, odenen, kalan, sonraki, odenenAdet, adet: plan.length, gecikmis };
}
