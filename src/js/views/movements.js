import { state, degistir } from '../store.js';
import { esc, tl, tarihGoster, uid, topla, tlSayi } from '../util.js';
import { cariAdi, kalemler, durumEtiketi } from '../derive.js';
import { rozet, tabloHtml, sirala, sirayiDegistir, islemButonlari, sayfaBasligi, kartHtml, modalAc, formHtml, formOku, planHtml, planBagla, planOku, bildir, onayla, csvKaydet, ikon } from '../ui.js';
import { formBagla, odemeDialog, odemeGeriAl } from '../actions.js';

const KATEGORILER = ['Maaş / Ücret', 'Satış', 'Faiz / Temettü', 'Kira', 'Fatura', 'Vergi', 'SGK / Bağ-Kur', 'Sigorta', 'Aidat', 'Akaryakıt', 'Market', 'Eğitim', 'Sağlık', 'Bakım / Onarım', 'Diğer'];
const f = { arama: '', yon: '', durum: '', sira: { k: 'vade', y: 1 } };

const kolonlar = [
  { k: 'vade', b: 'Vade', w: '110px', s: (r) => r.vade, v: (r) => `<strong>${tarihGoster(r.vade)}</strong>` },
  { k: 'yon', b: 'Tür', s: (r) => r.yon, v: (r) => (r.yon > 0 ? rozet('Gelir', 'ok') : rozet('Gider', 'bad')) },
  { k: 'kategori', b: 'Kategori', s: (r) => r.kategori, v: (r) => esc(r.kategori) },
  { k: 'baslik', b: 'Açıklama', s: (r) => r.baslik, v: (r) => esc(r.baslik) },
  { k: 'cari', b: 'Cari', s: (r) => r.cariAd, v: (r) => esc(r.cariAd) || '<span class="soluk">—</span>' },
  { k: 'tutar', b: 'Tutar', h: 'sag', s: (r) => r.tutar, v: (r) => `<strong class="${r.yon > 0 ? 'yesil' : 'kirmizi'}">${r.yon > 0 ? '+' : '−'}${tl(r.tutar)}</strong>${r.odenen > 0 && r.kalan > 0.005 ? `<small class="soluk blok">Kalan ${tl(r.kalan)}</small>` : ''}` },
  { k: 'durum', b: 'Durum', s: (r) => durumEtiketi(r).metin, v: (r) => rozet(durumEtiketi(r).metin, durumEtiketi(r).ton) },
  {
    k: 'islem', b: '', w: '120px', h: 'sag',
    v: (r) => islemButonlari([
      r.kalan > 0.005 ? { act: 'ode', id: r.key, ikon: 'tamam', baslik: r.yon > 0 ? 'Tahsil et' : 'Öde', sinif: 'ikon-ok' } : { act: 'geri', id: r.key, ikon: 'geri', baslik: 'Geri al' },
      { act: 'duzenle', id: r.kaynakId, ikon: 'duzenle', baslik: 'Düzenle' },
      { act: 'sil', id: r.kaynakId, ikon: 'sil', baslik: 'Sil', sinif: 'ikon-tehlike' },
    ]),
  },
];

function liste() {
  const a = f.arama.toLowerCase();
  return kalemler().filter((k) => {
    if (k.kaynak !== 'hareket') return false;
    if (f.yon && String(k.yon) !== f.yon) return false;
    if (f.durum) {
      const d = durumEtiketi(k).metin;
      if (f.durum === 'bekleyen' && k.kalan <= 0.005) return false;
      if (f.durum === 'tamam' && k.kalan > 0.005) return false;
      if (f.durum === 'gecikmis' && d !== 'Gecikmiş') return false;
    }
    return !a || `${k.baslik} ${k.kategori} ${k.cariAd}`.toLowerCase().includes(a);
  });
}

export function mount(el) {
  const hepsi = kalemler().filter((k) => k.kaynak === 'hareket');
  const gelir = topla(hepsi.filter((k) => k.yon > 0), (k) => k.kalan);
  const gider = topla(hepsi.filter((k) => k.yon < 0), (k) => k.kalan);
  el.innerHTML = `
    ${sayfaBasligi('Gelir / Gider Hareketleri', 'Çek, borç ve kira dışındaki tüm gelir ve giderler. Tekrarlayan kayıtlar için seri oluşturabilirsiniz.', `<button class="btn btn-ikincil" data-act="csv">${ikon('indir')} Excel (CSV)</button><button class="btn btn-birincil" data-act="yeni">${ikon('ekle')} Yeni Hareket</button>`)}
    <div class="kpi-izgara">
      ${kartHtml('Beklenen Gelir', tl(gelir), '', 'ok')}
      ${kartHtml('Beklenen Gider', tl(gider), '', 'bad')}
      ${kartHtml('Net', tl(gelir - gider), '', gelir - gider < 0 ? 'bad' : 'ok')}
    </div>
    <div class="arac-cubugu">
      <div class="arama-kutu">${ikon('ara')}<input type="search" data-f="arama" placeholder="Açıklama, kategori veya cari ara…" value="${esc(f.arama)}"></div>
      <select data-f="yon">${[['', 'Gelir ve gider'], ['1', 'Yalnız gelir'], ['-1', 'Yalnız gider']].map(([d, e]) => `<option value="${d}" ${f.yon === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
      <select data-f="durum">${[['', 'Tüm durumlar'], ['bekleyen', 'Bekleyen'], ['gecikmis', 'Gecikmiş'], ['tamam', 'Gerçekleşen']].map(([d, e]) => `<option value="${d}" ${f.durum === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
    </div>
    <div data-alan></div>`;
  const boya = () => {
    const satirlar = sirala(liste(), kolonlar, f.sira);
    el.querySelector('[data-alan]').innerHTML = tabloHtml(kolonlar, satirlar, {
      sira: f.sira,
      bos: hepsi.length ? 'Filtreye uyan kayıt yok.' : 'Henüz hareket eklenmedi. “Yeni Hareket” ile başlayın.',
      altSatir: satirlar.length ? `<tr><td colspan="5"><strong>${satirlar.length} kayıt</strong></td><td class="sag"><strong>${tl(topla(satirlar, (r) => r.yon * r.tutar))}</strong></td><td colspan="2"></td></tr>` : '',
    });
  };
  boya();
  el.addEventListener('input', (e) => {
    if (e.target.dataset.f === 'arama') {
      f.arama = e.target.value;
      boya();
    }
  });
  el.addEventListener('change', (e) => {
    const k = e.target.dataset.f;
    if (k === 'yon' || k === 'durum') {
      f[k] = e.target.value;
      boya();
    }
  });
  el.addEventListener('click', async (e) => {
    const th = e.target.closest('[data-sirala]');
    if (th) {
      f.sira = sirayiDegistir(f.sira, th.dataset.sirala);
      boya();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'yeni') hareketFormu();
    else if (b.dataset.act === 'duzenle') hareketFormu(id);
    else if (b.dataset.act === 'ode') odemeDialog(id);
    else if (b.dataset.act === 'geri') odemeGeriAl(id);
    else if (b.dataset.act === 'sil') {
      const h = state.hareketler.find((x) => x.id === id);
      if (await onayla(`“${h.aciklama}” (${tl(h.tutar)}) kaydı silinecek. Emin misiniz?`, { baslik: 'Kaydı Sil', evet: 'Sil', tehlike: true })) {
        degistir((s) => (s.hareketler = s.hareketler.filter((x) => x.id !== id)), `Hareket silindi: ${h.aciklama}`);
        bildir('Kayıt silindi.', 'bilgi');
      }
    } else if (b.dataset.act === 'csv') {
      await csvKaydet('gelir-gider.csv', ['Vade', 'Tür', 'Kategori', 'Açıklama', 'Cari', 'Tutar', 'Gerçekleşen', 'Durum'],
        sirala(liste(), kolonlar, f.sira).map((r) => [tarihGoster(r.vade), r.yon > 0 ? 'Gelir' : 'Gider', r.kategori, r.baslik, r.cariAd, tlSayi(r.tutar), tlSayi(r.odenen), durumEtiketi(r).metin]));
    }
  });
}

function hareketFormu(id) {
  const mevcut = id ? state.hareketler.find((h) => h.id === id) : null;
  const alanlar = [
    { ad: 'yon', etiket: 'Tür', tip: 'secim', secenekler: [{ d: 'gelir', e: 'Gelir' }, { d: 'gider', e: 'Gider' }] },
    { ad: 'kategori', etiket: 'Kategori', tip: 'liste', secenekler: KATEGORILER, varsayilan: 'Diğer' },
    { ad: 'aciklama', etiket: 'Açıklama', zorunlu: true, genislik: 'tam' },
    { ad: 'cariId', etiket: 'Cari (isteğe bağlı)', tip: 'cari', genislik: 'tam' },
    ...(mevcut
      ? [
          { ad: 'vade', etiket: 'Vade Tarihi', tip: 'tarih', zorunlu: true },
          { ad: 'tutar', etiket: 'Tutar', tip: 'para', zorunlu: true },
          { ad: 'odenen', etiket: 'Gerçekleşen Tutar', tip: 'para' },
          { ad: 'odemeTarihi', etiket: 'Gerçekleşme Tarihi', tip: 'tarih' },
        ]
      : []),
  ];
  const m = modalAc({
    baslik: mevcut ? 'Hareketi Düzenle' : 'Yeni Gelir / Gider',
    genis: !mevcut,
    govde: formHtml(alanlar, mevcut || { yon: 'gider' }) + (mevcut ? '' : `<h3 class="form-baslik">Tarihler ve Tutarlar <small>Tekrarlayan kayıt için seri oluşturun; her satır ayrı tarih alır</small></h3>${planHtml([{ id: '', vade: '', tutar: 0 }], { metinAlani: false, adet: 1 })}`),
    butonlar: [
      { etiket: 'Vazgeç' },
      {
        etiket: 'Kaydet',
        sinif: 'btn-birincil',
        tikla: (ctl) => {
          const { deger, gecerli } = formOku(ctl.govde, alanlar);
          if (!gecerli) return false;
          if (mevcut) degistir((s) => Object.assign(s.hareketler.find((h) => h.id === mevcut.id), deger), `Hareket güncellendi: ${deger.aciklama}`);
          else {
            const { satirlar, hata } = planOku(ctl.govde);
            if (hata) return false;
            degistir((s) => satirlar.forEach((p) => s.hareketler.push({ id: uid(), yon: deger.yon, kategori: deger.kategori, cariId: deger.cariId, aciklama: deger.aciklama, tutar: p.tutar, vade: p.vade, odenen: 0, odemeTarihi: '' })), `${satirlar.length} hareket eklendi: ${deger.aciklama}`);
          }
          bildir('Kaydedildi.');
        },
      },
    ],
  });
  formBagla(m.govde);
  if (!mevcut) planBagla(m.govde, { metinAlani: false });
}
