import { uid, bugun } from './util.js';

export const state = bosVeri();
const dinleyiciler = new Set();
let kayitDurumu = { zaman: null, hata: null };

export function bosVeri() {
  return {
    surum: 2,
    ayarlar: { firma: '', yil: 2027, acilisBakiyesi: 0 },
    cariler: [],
    cekSenetler: [],
    borclar: [],
    kiralar: [],
    hareketler: [],
    gunluk: [],
  };
}

export function verileriDegistir(yeni) {
  const bos = bosVeri();
  Object.keys(bos).forEach((k) => {
    state[k] = yeni[k] ?? bos[k];
  });
  state.ayarlar = { ...bos.ayarlar, ...(yeni.ayarlar || {}) };
}

export function abone(f) {
  dinleyiciler.add(f);
  return () => dinleyiciler.delete(f);
}

export const kayitBilgisi = () => kayitDurumu;

async function diskeYaz() {
  try {
    const sonuc = await window.finans.yaz(JSON.stringify(state));
    kayitDurumu = sonuc.tamam ? { zaman: new Date(), hata: null } : { zaman: null, hata: sonuc.hata };
  } catch (e) {
    kayitDurumu = { zaman: null, hata: String(e) };
  }
  dinleyiciler.forEach((f) => f('kayit'));
}

export function degistir(fn, gunlukMetni) {
  fn(state);
  if (gunlukMetni) {
    state.gunluk.unshift({ t: new Date().toISOString(), m: gunlukMetni });
    state.gunluk.length = Math.min(state.gunluk.length, 100);
  }
  diskeYaz();
  dinleyiciler.forEach((f) => f('veri'));
}

export function baslat() {
  const girdi = window.finans.oku();
  if (girdi.yeni) {
    try {
      verileriDegistir(JSON.parse(girdi.yeni));
      return { yol: girdi.yol };
    } catch (e) {
      window.finans.bozukAyir();
      return { yol: girdi.yol, uyari: 'Kayıt dosyası okunamadı. Bozuk dosya ayrı bir adla saklandı, program boş başladı. Otomatik yedeklerden geri yükleyebilirsiniz.' };
    }
  }
  if (girdi.eski) {
    try {
      verileriDegistir(eskiVeriyiDonustur(JSON.parse(girdi.eski)));
      diskeYaz();
      return { yol: girdi.yol, bilgi: 'Önceki sürümdeki verileriniz yeni sisteme aktarıldı.' };
    } catch (e) {
      return { yol: girdi.yol };
    }
  }
  return { yol: girdi.yol };
}

export function cariBulVeyaOlustur(ad, tur = 'diger') {
  const temiz = (ad || '').trim();
  if (!temiz) return '';
  const var_ = state.cariler.find((c) => c.unvan.toLowerCase() === temiz.toLowerCase());
  if (var_) return var_.id;
  const c = { id: uid(), unvan: temiz, tur, telefon: '', eposta: '', vergiNo: '', not: '' };
  state.cariler.push(c);
  return c.id;
}

function eskiVeriyiDonustur(eski) {
  const yeni = bosVeri();
  const cari = (ad) => cariBulVeyaOlustur2(yeni, ad);
  (eski.checks || []).forEach((c) => {
    yeni.cekSenetler.push({
      id: uid(), tur: 'cek', yon: 'alacak', no: '', banka: '', cariId: cari(c.kisi), tutar: c.tutar,
      duzenlemeTarihi: '', vade: c.vade, durum: { bekliyor: 'bekliyor', tahsil: 'tamam', karsiliksiz: 'karsiliksiz' }[c.durum] || 'bekliyor',
      durumTarihi: c.durum === 'tahsil' ? c.vade : '', not: c.not || '',
    });
  });
  (eski.debts || []).forEach((d) => {
    const odendi = d.durum === 'odendi';
    yeni.borclar.push({
      id: uid(), cariId: cari(d.kisi), baslik: d.not || 'Borç', tur: 'diger', not: '',
      plan: [{ id: uid(), vade: d.vade, tutar: d.tutar, aciklama: '', odenen: odendi ? d.tutar : 0, odemeTarihi: odendi ? d.vade : '' }],
    });
  });
  (eski.others || []).forEach((o) => {
    const bitti = o.durum === 'gerceklesti';
    yeni.hareketler.push({
      id: uid(), yon: o.tur, kategori: 'Diğer', cariId: '', aciklama: o.aciklama, tutar: o.tutar, vade: o.vade,
      odenen: bitti ? o.tutar : 0, odemeTarihi: bitti ? o.vade : '',
    });
  });
  const gruplar = {};
  (eski.rents || []).forEach((r) => {
    const anahtar = `${r.tur}|${r.kisi}`;
    if (!gruplar[anahtar]) {
      gruplar[anahtar] = {
        id: uid(), yon: r.tur, cariId: cari(r.kisi), tasinmaz: r.not || 'Kira', baslangic: r.vade, sureAy: 0, odemeGunu: Number(r.vade.slice(8, 10)) || 1,
        aylikTutar: r.tutar, artisOrani: 0, depozito: 0, not: '', plan: [],
      };
      yeni.kiralar.push(gruplar[anahtar]);
    }
    const g = gruplar[anahtar];
    const bitti = r.durum === 'tamamlandi';
    g.plan.push({ id: uid(), vade: r.vade, tutar: r.tutar, aciklama: '', odenen: bitti ? r.tutar : 0, odemeTarihi: bitti ? r.vade : '' });
    g.sureAy = g.plan.length;
  });
  return yeni;
}

function cariBulVeyaOlustur2(veri, ad) {
  const temiz = (ad || '').trim();
  if (!temiz) return '';
  const var_ = veri.cariler.find((c) => c.unvan.toLowerCase() === temiz.toLowerCase());
  if (var_) return var_.id;
  const c = { id: uid(), unvan: temiz, tur: 'diger', telefon: '', eposta: '', vergiNo: '', not: '' };
  veri.cariler.push(c);
  return c.id;
}

export function yilBasi() {
  return `${state.ayarlar.yil}-01-01`;
}

export function referansTarih() {
  const b = bugun();
  return b < yilBasi() ? yilBasi() : b;
}
