import { state, degistir } from '../store.js';
import { esc, tl, tarihGoster, bugun, gunFarki, uid, topla, tlSayi } from '../util.js';
import { CEK_DURUM, DURUM_TON, cariAdi } from '../derive.js';
import { rozet, tabloHtml, sirala, sirayiDegistir, islemButonlari, sayfaBasligi, kartHtml, modalAc, formHtml, formOku, planHtml, planBagla, planOku, bildir, onayla, csvKaydet, ikon } from '../ui.js';
import { formBagla, cekDurumDialog, odemeDialog } from '../actions.js';
import { nav } from '../nav.js';

const f = { sekme: 'alacak', arama: '', durum: '', bas: '', bit: '', sira: { k: 'vade', y: 1 } };

const kolonlar = [
  { k: 'vade', b: 'Vade', w: '150px', s: (r) => r.vade, v: (r) => `<strong>${tarihGoster(r.vade)}</strong>${kalanGun(r)}` },
  { k: 'evrak', b: 'Evrak', s: (r) => `${r.tur}${r.no}`, v: (r) => `${r.tur === 'cek' ? 'Çek' : 'Senet'}${r.no ? ` <span class="soluk">#${esc(r.no)}</span>` : ''}` },
  { k: 'yon', b: 'Yön', s: (r) => r.yon, v: (r) => (r.yon === 'alacak' ? rozet('Alacak', 'ok') : rozet('Borç', 'bad')) },
  { k: 'cari', b: 'Cari', s: (r) => cariAdi(r.cariId), v: (r) => esc(cariAdi(r.cariId)) || '<span class="soluk">—</span>' },
  { k: 'banka', b: 'Banka', s: (r) => r.banka, v: (r) => esc(r.banka) || '<span class="soluk">—</span>' },
  { k: 'tutar', b: 'Tutar', h: 'sag', s: (r) => r.tutar, v: (r) => `<strong>${tl(r.tutar)}</strong>` },
  { k: 'durum', b: 'Durum', s: (r) => r.durum, v: (r) => rozet(CEK_DURUM[r.yon][r.durum] || r.durum, DURUM_TON[r.durum]) },
  {
    k: 'islem', b: '', w: '130px', h: 'sag',
    v: (r) => islemButonlari([
      ...(r.durum === 'bekliyor' || r.durum === 'tahsilde' ? [{ act: 'ode', id: r.id, ikon: 'tamam', baslik: r.yon === 'alacak' ? 'Tahsil et' : 'Öde', sinif: 'ikon-ok' }] : []),
      { act: 'durum', id: r.id, ikon: 'geri', baslik: 'Durum değiştir' },
      { act: 'duzenle', id: r.id, ikon: 'duzenle', baslik: 'Düzenle' },
      { act: 'sil', id: r.id, ikon: 'sil', baslik: 'Sil', sinif: 'ikon-tehlike' },
    ]),
  },
];

function kalanGun(r) {
  if (r.durum !== 'bekliyor' && r.durum !== 'tahsilde') return '';
  const g = gunFarki(bugun(), r.vade);
  if (g < 0) return `<small class="kirmizi">${-g} gün gecikti</small>`;
  if (g === 0) return '<small class="turuncu">Bugün</small>';
  return `<small class="soluk">${g} gün kaldı</small>`;
}

function filtrele() {
  const a = f.arama.toLowerCase();
  return state.cekSenetler.filter((c) => {
    if (f.sekme !== 'hepsi' && c.yon !== f.sekme) return false;
    if (f.durum && c.durum !== f.durum) return false;
    if (f.bas && c.vade < f.bas) return false;
    if (f.bit && c.vade > f.bit) return false;
    if (a && !`${c.no} ${c.banka} ${cariAdi(c.cariId)} ${c.not}`.toLowerCase().includes(a)) return false;
    return true;
  });
}

export function mount(el) {
  const tumDurumlar = { ...CEK_DURUM.alacak, ...CEK_DURUM.borc };
  const yon = (y) => state.cekSenetler.filter((c) => c.yon === y && (c.durum === 'bekliyor' || c.durum === 'tahsilde'));
  const alacak = yon('alacak');
  const borc = yon('borc');
  const gecik = [...alacak, ...borc].filter((c) => c.vade < bugun());
  el.innerHTML = `
    ${sayfaBasligi('Çek / Senet Portföyü', 'Alınan ve verilen çek/senetlerin takibi, tahsilat ve ödeme durumları.', `<button class="btn btn-ikincil" data-act="csv">${ikon('indir')} Excel (CSV)</button><button class="btn btn-birincil" data-act="yeni">${ikon('ekle')} Yeni Çek / Senet</button>`)}
    <div class="kpi-izgara">
      ${kartHtml('Portföydeki Alacak', tl(topla(alacak, (c) => c.tutar)), `${alacak.length} evrak`, 'ok')}
      ${kartHtml('Ödenecek Verilen Evrak', tl(topla(borc, (c) => c.tutar)), `${borc.length} evrak`, 'bad')}
      ${kartHtml('Vadesi Geçmiş', tl(topla(gecik, (c) => c.tutar)), `${gecik.length} evrak`, gecik.length ? 'uyari' : '')}
    </div>
    <div class="sekmeler">
      ${[['alacak', 'Alınan (Alacak)'], ['borc', 'Verilen (Borç)'], ['hepsi', 'Tümü']].map(([k, e]) => `<button class="sekme ${f.sekme === k ? 'aktif' : ''}" data-sekme="${k}">${e}</button>`).join('')}
    </div>
    <div class="arac-cubugu">
      <div class="arama-kutu">${ikon('ara')}<input type="search" data-f="arama" placeholder="Evrak no, banka veya cari ara…" value="${esc(f.arama)}"></div>
      <select data-f="durum"><option value="">Tüm durumlar</option>${Object.entries(tumDurumlar).map(([d, e]) => `<option value="${d}" ${f.durum === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
      <label class="mini">Vade <input type="date" data-f="bas" value="${f.bas}"> – <input type="date" data-f="bit" value="${f.bit}"></label>
    </div>
    <div data-alan></div>`;

  const boya = () => {
    const satirlar = sirala(filtrele(), kolonlar, f.sira);
    const topTutar = topla(satirlar, (c) => c.tutar);
    el.querySelector('[data-alan]').innerHTML = tabloHtml(kolonlar, satirlar, {
      sira: f.sira,
      bos: state.cekSenetler.length ? 'Filtreye uyan kayıt yok.' : 'Henüz çek veya senet eklenmedi. “Yeni Çek / Senet” ile başlayın.',
      satirOzellik: (r) => `data-id="${r.id}"`,
      altSatir: satirlar.length ? `<tr><td colspan="5"><strong>${satirlar.length} kayıt</strong></td><td class="sag"><strong>${tl(topTutar)}</strong></td><td colspan="2"></td></tr>` : '',
    });
  };
  boya();

  el.addEventListener('input', (e) => {
    const k = e.target.dataset.f;
    if (!k) return;
    f[k] = e.target.value;
    boya();
  });
  el.addEventListener('click', async (e) => {
    const sekme = e.target.closest('[data-sekme]');
    if (sekme) {
      f.sekme = sekme.dataset.sekme;
      nav.yenile();
      return;
    }
    const th = e.target.closest('[data-sirala]');
    if (th) {
      f.sira = sirayiDegistir(f.sira, th.dataset.sirala);
      boya();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'yeni') cekFormu();
    else if (b.dataset.act === 'duzenle') cekFormu(id);
    else if (b.dataset.act === 'durum') cekDurumDialog(id);
    else if (b.dataset.act === 'ode') odemeDialog(`cek:${id}`);
    else if (b.dataset.act === 'sil') {
      const c = state.cekSenetler.find((x) => x.id === id);
      if (await onayla(`${c.tur === 'cek' ? 'Çek' : 'Senet'} ${c.no || ''} (${tl(c.tutar)}) kalıcı olarak silinecek. Emin misiniz?`, { baslik: 'Kaydı Sil', evet: 'Sil', tehlike: true })) {
        degistir((s) => (s.cekSenetler = s.cekSenetler.filter((x) => x.id !== id)), `Çek/senet silindi: ${c.no || c.tur}`);
        bildir('Kayıt silindi.', 'bilgi');
      }
    } else if (b.dataset.act === 'csv') {
      const s = sirala(filtrele(), kolonlar, f.sira);
      await csvKaydet('cek-senet-listesi.csv', ['Vade', 'Tür', 'Evrak No', 'Yön', 'Cari', 'Banka', 'Tutar', 'Durum', 'Not'],
        s.map((c) => [tarihGoster(c.vade), c.tur === 'cek' ? 'Çek' : 'Senet', c.no, c.yon === 'alacak' ? 'Alacak' : 'Borç', cariAdi(c.cariId), c.banka, tlSayi(c.tutar), CEK_DURUM[c.yon][c.durum], c.not]));
    }
  });
}

const BANKALAR = ['Ziraat Bankası', 'Halkbank', 'VakıfBank', 'İş Bankası', 'Garanti BBVA', 'Yapı Kredi', 'Akbank', 'QNB', 'DenizBank', 'TEB', 'ING', 'Şekerbank', 'Kuveyt Türk', 'Albaraka Türk'];

function cekFormu(id) {
  const mevcut = id ? state.cekSenetler.find((c) => c.id === id) : null;
  const ortak = [
    { ad: 'tur', etiket: 'Evrak Türü', tip: 'secim', secenekler: [{ d: 'cek', e: 'Çek' }, { d: 'senet', e: 'Senet' }] },
    { ad: 'yon', etiket: 'Yön', tip: 'secim', secenekler: [{ d: 'alacak', e: 'Alacak — müşteriden aldığım' }, { d: 'borc', e: 'Borç — verdiğim' }] },
    { ad: 'cariId', etiket: 'Cari (Kimden / Kime)', tip: 'cari', zorunlu: true, genislik: 'tam' },
    { ad: 'banka', etiket: 'Banka', tip: 'liste', secenekler: BANKALAR },
    { ad: 'duzenlemeTarihi', etiket: 'Düzenleme Tarihi', tip: 'tarih' },
    { ad: 'not', etiket: 'Not', tip: 'uzun', genislik: 'tam' },
  ];
  const duzenle = mevcut
    ? [
        { ad: 'no', etiket: 'Evrak No' },
        { ad: 'vade', etiket: 'Vade Tarihi', tip: 'tarih', zorunlu: true },
        { ad: 'tutar', etiket: 'Tutar', tip: 'para', zorunlu: true },
        { ad: 'durum', etiket: 'Durum', tip: 'secim', secenekler: Object.entries(CEK_DURUM[mevcut.yon]).map(([d, e]) => ({ d, e })) },
        { ad: 'durumTarihi', etiket: 'Durum Tarihi', tip: 'tarih' },
      ]
    : [];
  const alanlar = [...ortak, ...duzenle];
  const varsayilan = mevcut || { tur: 'cek', yon: 'alacak' };
  const m = modalAc({
    baslik: mevcut ? 'Çek / Senet Düzenle' : 'Yeni Çek / Senet',
    genis: !mevcut,
    govde: formHtml(alanlar, varsayilan) + (mevcut ? '' : `<h3 class="form-baslik">Evraklar <small>Her evrak için ayrı vade tarihi ve tutar girilir</small></h3>${planHtml([{ id: '', vade: '', tutar: 0, aciklama: '' }], { etiket: 'Evrak No', yer: 'Çek / senet no', adet: 1 })}`),
    butonlar: [
      { etiket: 'Vazgeç' },
      {
        etiket: 'Kaydet',
        sinif: 'btn-birincil',
        tikla: (ctl) => {
          const { deger, gecerli } = formOku(ctl.govde, alanlar);
          if (!gecerli) return false;
          if (mevcut) {
            degistir((s) => Object.assign(s.cekSenetler.find((c) => c.id === mevcut.id), deger, { durumTarihi: deger.durum === 'bekliyor' ? '' : deger.durumTarihi }), `Çek/senet güncellendi: ${deger.no || deger.tur}`);
          } else {
            const { satirlar, hata } = planOku(ctl.govde);
            if (hata) return false;
            degistir((s) => {
              satirlar.forEach((p) => s.cekSenetler.push({
                id: uid(), tur: deger.tur, yon: deger.yon, no: p.aciklama, banka: deger.banka, cariId: deger.cariId, tutar: p.tutar,
                duzenlemeTarihi: deger.duzenlemeTarihi, vade: p.vade, durum: 'bekliyor', durumTarihi: '', not: deger.not,
              }));
            }, `${satirlar.length} adet çek/senet eklendi`);
          }
          bildir('Çek / senet kaydedildi.');
        },
      },
    ],
  });
  formBagla(m.govde);
  if (!mevcut) planBagla(m.govde, { etiket: 'Evrak No', yer: 'Çek / senet no' });
}
