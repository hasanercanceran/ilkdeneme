import { state, degistir } from './store.js';
import { uid, bugun, tl, tarihGoster, yuvarla, esc } from './util.js';
import { modalAc, formHtml, formOku, bildir, onayla, moneyFocusout, cariSecenekleri } from './ui.js';
import { kalemler, CEK_DURUM } from './derive.js';

export const CARI_TURLERI = [
  { d: 'musteri', e: 'Müşteri' },
  { d: 'tedarikci', e: 'Tedarikçi' },
  { d: 'kiraci', e: 'Kiracı / Ev Sahibi' },
  { d: 'banka', e: 'Banka / Kurum' },
  { d: 'diger', e: 'Diğer' },
];

export function cariFormuAc(mevcut, kaydedildi) {
  const alanlar = [
    { ad: 'unvan', etiket: 'Ünvan / Ad Soyad', zorunlu: true, genislik: 'tam' },
    { ad: 'tur', etiket: 'Cari Türü', tip: 'secim', secenekler: CARI_TURLERI },
    { ad: 'vergiNo', etiket: 'Vergi No / TC Kimlik No' },
    { ad: 'telefon', etiket: 'Telefon' },
    { ad: 'eposta', etiket: 'E-posta' },
    { ad: 'not', etiket: 'Not', tip: 'uzun', genislik: 'tam' },
  ];
  const m = modalAc({
    baslik: mevcut ? 'Cari Hesabı Düzenle' : 'Yeni Cari Hesap',
    govde: formHtml(alanlar, mevcut || {}),
    butonlar: [
      { etiket: 'Vazgeç' },
      {
        etiket: 'Kaydet',
        sinif: 'btn-birincil',
        tikla: (ctl) => {
          const { deger, gecerli } = formOku(ctl.govde, alanlar);
          if (!gecerli) return false;
          const yinelenen = state.cariler.find((c) => c.unvan.toLowerCase() === deger.unvan.toLowerCase() && c.id !== mevcut?.id);
          if (yinelenen) {
            ctl.govde.querySelector('[data-hata="unvan"]').textContent = 'Bu ünvanla kayıtlı bir cari zaten var.';
            return false;
          }
          let id = mevcut?.id;
          degistir((s) => {
            if (mevcut) Object.assign(s.cariler.find((c) => c.id === mevcut.id), deger);
            else {
              id = uid();
              s.cariler.push({ id, ...deger });
            }
          }, `Cari ${mevcut ? 'güncellendi' : 'eklendi'}: ${deger.unvan}`);
          bildir('Cari hesap kaydedildi.');
          kaydedildi?.(id);
        },
      },
    ],
  });
  return m;
}

export function formBagla(kok) {
  moneyFocusout(kok);
  kok.addEventListener('change', (e) => {
    const sel = e.target;
    if (sel.matches?.('select[data-tip="cari"]') && sel.value === '__yeni') {
      sel.value = '';
      cariFormuAc(null, (id) => {
        kok.querySelectorAll('select[data-tip="cari"]').forEach((s) => {
          const onceki = s === sel ? id : s.value;
          s.innerHTML = cariSecenekleri(onceki);
        });
      });
    }
  });
}

export function varsayilanOdemeTarihi() {
  return bugun();
}

export function kalemBul(key) {
  return kalemler().find((k) => k.key === key);
}

function planSatiri(kalem) {
  const kap = kalem.kaynak === 'borc' ? state.borclar : state.kiralar;
  const sozlesme = kap.find((x) => x.id === kalem.kaynakId);
  return sozlesme?.plan.find((p) => p.id === kalem.satirId);
}

export function odemeDialog(key, sonra) {
  const kalem = kalemBul(key);
  if (!kalem) return;
  const tahsilat = kalem.yon > 0;
  const fiil = tahsilat ? 'Tahsilat' : 'Ödeme';
  const cek = kalem.kaynak === 'cek';
  const alanlar = [
    ...(cek ? [] : [{ ad: 'tutar', etiket: `${fiil} Tutarı`, tip: 'para', zorunlu: true, varsayilan: kalem.kalan, ipucu: `Kalan: ${tl(kalem.kalan)} — kısmi ${fiil.toLowerCase()} için tutarı değiştirebilirsiniz.` }]),
    { ad: 'tarih', etiket: `${fiil} Tarihi`, tip: 'tarih', zorunlu: true, varsayilan: bugun() },
  ];
  modalAc({
    baslik: `${fiil} Kaydet`,
    govde: `<div class="ozet-kutu"><strong>${esc(kalem.baslik)}</strong><span>${esc(kalem.cariAd || '')} · Vade: ${tarihGoster(kalem.vade)} · Tutar: ${tl(kalem.tutar)}</span></div>${formHtml(alanlar, {})}`,
    butonlar: [
      { etiket: 'Vazgeç' },
      {
        etiket: `${fiil} Kaydet`,
        sinif: 'btn-birincil',
        tikla: (ctl) => {
          const { deger, gecerli } = formOku(ctl.govde, alanlar);
          if (!gecerli) return false;
          if (!cek && deger.tutar > kalem.kalan + 0.005) {
            ctl.govde.querySelector('[data-hata="tutar"]').textContent = 'Tutar kalan bakiyeden fazla olamaz.';
            return false;
          }
          degistir((s) => {
            if (kalem.kaynak === 'cek') {
              const c = s.cekSenetler.find((x) => x.id === kalem.kaynakId);
              c.durum = 'tamam';
              c.durumTarihi = deger.tarih;
            } else if (kalem.kaynak === 'hareket') {
              const h = s.hareketler.find((x) => x.id === kalem.kaynakId);
              h.odenen = yuvarla((h.odenen || 0) + deger.tutar);
              h.odemeTarihi = deger.tarih;
            } else {
              const p = planSatiri(kalem);
              p.odenen = yuvarla((p.odenen || 0) + deger.tutar);
              p.odemeTarihi = deger.tarih;
            }
          }, `${fiil} kaydedildi: ${kalem.baslik} ${cek ? tl(kalem.tutar) : tl(deger.tutar)}`);
          bildir(`${fiil} kaydedildi.`);
          sonra?.();
        },
      },
    ],
  });
}

export async function odemeGeriAl(key) {
  const kalem = kalemBul(key);
  if (!kalem) return;
  const ok = await onayla('Bu kalemin ödeme / tahsilat kaydı geri alınacak ve tekrar bekleyen duruma dönecek. Devam edilsin mi?', { baslik: 'Kaydı Geri Al', evet: 'Geri Al', tehlike: true });
  if (!ok) return;
  degistir((s) => {
    if (kalem.kaynak === 'cek') {
      const c = s.cekSenetler.find((x) => x.id === kalem.kaynakId);
      c.durum = 'bekliyor';
      c.durumTarihi = '';
    } else if (kalem.kaynak === 'hareket') {
      const h = s.hareketler.find((x) => x.id === kalem.kaynakId);
      h.odenen = 0;
      h.odemeTarihi = '';
    } else {
      const p = planSatiri(kalem);
      p.odenen = 0;
      p.odemeTarihi = '';
    }
  }, `Ödeme kaydı geri alındı: ${kalem.baslik}`);
  bildir('Kayıt geri alındı.', 'bilgi');
}

export function cekDurumDialog(id) {
  const c = state.cekSenetler.find((x) => x.id === id);
  if (!c) return;
  const durumlar = CEK_DURUM[c.yon];
  const alanlar = [
    { ad: 'durum', etiket: 'Yeni Durum', tip: 'secim', secenekler: Object.entries(durumlar).map(([d, e]) => ({ d, e })), varsayilan: c.durum },
    { ad: 'tarih', etiket: 'İşlem Tarihi', tip: 'tarih', varsayilan: c.durumTarihi || bugun() },
  ];
  modalAc({
    baslik: 'Durum Değiştir',
    govde: `<div class="ozet-kutu"><strong>${c.tur === 'cek' ? 'Çek' : 'Senet'} ${esc(c.no || '')}</strong><span>${tl(c.tutar)} · Vade: ${tarihGoster(c.vade)}</span></div>${formHtml(alanlar, { durum: c.durum, tarih: c.durumTarihi || bugun() })}`,
    butonlar: [
      { etiket: 'Vazgeç' },
      {
        etiket: 'Kaydet',
        sinif: 'btn-birincil',
        tikla: (ctl) => {
          const { deger } = formOku(ctl.govde, alanlar);
          degistir((s) => {
            const x = s.cekSenetler.find((k) => k.id === id);
            x.durum = deger.durum;
            x.durumTarihi = deger.durum === 'bekliyor' ? '' : deger.tarih;
          }, `Çek/senet durumu: ${c.no || c.tur} → ${durumlar[deger.durum]}`);
          bildir('Durum güncellendi.');
        },
      },
    ],
  });
}
