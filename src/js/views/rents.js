import { state, degistir, abone } from '../store.js';
import { esc, tl, tarihGoster, uid, bugun, topla, tlSayi, addMonths, addDays, gunFarki, yuvarla, AYLAR } from '../util.js';
import { cariAdi, planOzet } from '../derive.js';
import { rozet, tabloHtml, sirala, sirayiDegistir, islemButonlari, sayfaBasligi, kartHtml, modalAc, formHtml, formOku, planHtml, planBagla, planOku, planYaz, bildir, onayla, csvKaydet, ikon } from '../ui.js';
import { formBagla, odemeDialog, odemeGeriAl } from '../actions.js';

const f = { arama: '', yon: '', sira: { k: 'bitis', y: 1 } };

const bitisTarihi = (k) => addDays(addMonths(k.baslangic, k.sureAy), -1);

function durumu(k) {
  const o = planOzet(k.plan);
  const bitis = bitisTarihi(k);
  const kalanGun = gunFarki(bugun(), bitis);
  if (o.gecikmis) return { metin: 'Gecikmiş Ödeme', ton: 'bad' };
  if (kalanGun < 0 && o.kalan <= 0.005) return { metin: 'Sona Erdi', ton: 'mute' };
  if (kalanGun < 0) return { metin: 'Süresi Doldu', ton: 'warn' };
  if (kalanGun <= 60) return { metin: `${kalanGun} gün kaldı`, ton: 'warn' };
  return { metin: 'Aktif', ton: 'ok' };
}

const kolonlar = [
  { k: 'cari', b: 'Karşı Taraf', s: (k) => cariAdi(k.cariId), v: (k) => `<strong>${esc(cariAdi(k.cariId)) || '—'}</strong>` },
  { k: 'tasinmaz', b: 'Taşınmaz', s: (k) => k.tasinmaz, v: (k) => esc(k.tasinmaz) },
  { k: 'yon', b: 'Tür', s: (k) => k.yon, v: (k) => (k.yon === 'gelir' ? rozet('Kira Geliri', 'ok') : rozet('Kira Gideri', 'bad')) },
  { k: 'bitis', b: 'Sözleşme Dönemi', s: (k) => bitisTarihi(k), v: (k) => `${tarihGoster(k.baslangic)} – ${tarihGoster(bitisTarihi(k))}<small class="soluk blok">${k.sureAy} ay · ayın ${k.odemeGunu}. günü</small>` },
  { k: 'aylik', b: 'Aylık Kira', h: 'sag', s: (k) => k.aylikTutar, v: (k) => `<strong>${tl(k.aylikTutar)}</strong>${k.artisOrani ? `<small class="soluk blok">Yıllık %${tlSayi(k.artisOrani)} artış</small>` : ''}` },
  { k: 'kalan', b: 'Kalan', h: 'sag', s: (k) => planOzet(k.plan).kalan, v: (k) => tl(planOzet(k.plan).kalan) },
  { k: 'durum', b: 'Durum', s: (k) => durumu(k).metin, v: (k) => rozet(durumu(k).metin, durumu(k).ton) },
  {
    k: 'islem', b: '', w: '120px', h: 'sag',
    v: (k) => islemButonlari([
      { act: 'detay', id: k.id, ikon: 'git', baslik: 'Ödeme planı' },
      { act: 'duzenle', id: k.id, ikon: 'duzenle', baslik: 'Düzenle' },
      { act: 'sil', id: k.id, ikon: 'sil', baslik: 'Sil', sinif: 'ikon-tehlike' },
    ]),
  },
];

function filtrele() {
  const a = f.arama.toLowerCase();
  return state.kiralar.filter((k) => (!f.yon || k.yon === f.yon) && (!a || `${k.tasinmaz} ${cariAdi(k.cariId)} ${k.not}`.toLowerCase().includes(a)));
}

export function mount(el) {
  const gelir = state.kiralar.filter((k) => k.yon === 'gelir');
  const gider = state.kiralar.filter((k) => k.yon === 'gider');
  const biten = state.kiralar.filter((k) => { const g = gunFarki(bugun(), bitisTarihi(k)); return g >= 0 && g <= 90; });
  el.innerHTML = `
    ${sayfaBasligi('Kira Sözleşmeleri', 'Sözleşme tarihleri, aylık kira tutarları ve yıllık artışlarla otomatik ödeme/tahsilat planı.', `<button class="btn btn-ikincil" data-act="csv">${ikon('indir')} Excel (CSV)</button><button class="btn btn-birincil" data-act="yeni">${ikon('ekle')} Yeni Sözleşme</button>`)}
    <div class="kpi-izgara">
      ${kartHtml('Kalan Kira Geliri', tl(topla(gelir, (k) => planOzet(k.plan).kalan)), `${gelir.length} sözleşme`, 'ok')}
      ${kartHtml('Kalan Kira Gideri', tl(topla(gider, (k) => planOzet(k.plan).kalan)), `${gider.length} sözleşme`, 'bad')}
      ${kartHtml('90 Gün İçinde Bitenler', String(biten.length), biten.length ? biten.map((k) => esc(k.tasinmaz)).join(', ') : 'Yaklaşan bitiş yok', biten.length ? 'uyari' : '')}
    </div>
    <div class="arac-cubugu">
      <div class="arama-kutu">${ikon('ara')}<input type="search" data-f="arama" placeholder="Taşınmaz veya kişi ara…" value="${esc(f.arama)}"></div>
      <select data-f="yon">${[['', 'Gelir ve gider'], ['gelir', 'Kira geliri'], ['gider', 'Kira gideri']].map(([d, e]) => `<option value="${d}" ${f.yon === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
    </div>
    <div data-alan></div>`;
  const boya = () => {
    const satirlar = sirala(filtrele(), kolonlar, f.sira);
    el.querySelector('[data-alan]').innerHTML = tabloHtml(kolonlar, satirlar, {
      sira: f.sira,
      bos: state.kiralar.length ? 'Filtreye uyan sözleşme yok.' : 'Henüz kira sözleşmesi eklenmedi. “Yeni Sözleşme” ile başlayın.',
      satirOzellik: (k) => `data-id="${k.id}"`,
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
    if (e.target.dataset.f === 'yon') {
      f.yon = e.target.value;
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
    const satir = e.target.closest('tr[data-id]');
    const b = e.target.closest('[data-act]');
    if (!b && satir) return detayGoster(satir.dataset.id);
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'yeni') kiraFormu();
    else if (b.dataset.act === 'duzenle') kiraFormu(id);
    else if (b.dataset.act === 'detay') detayGoster(id);
    else if (b.dataset.act === 'sil') {
      const k = state.kiralar.find((x) => x.id === id);
      if (await onayla(`“${k.tasinmaz}” kira sözleşmesi ve tüm ödeme planı silinecek. Emin misiniz?`, { baslik: 'Sözleşmeyi Sil', evet: 'Sil', tehlike: true })) {
        degistir((s) => (s.kiralar = s.kiralar.filter((x) => x.id !== id)), `Kira sözleşmesi silindi: ${k.tasinmaz}`);
        bildir('Sözleşme silindi.', 'bilgi');
      }
    } else if (b.dataset.act === 'csv') {
      const rows = [];
      sirala(filtrele(), kolonlar, f.sira).forEach((k) => k.plan.forEach((p, i) => rows.push([k.tasinmaz, cariAdi(k.cariId), k.yon === 'gelir' ? 'Gelir' : 'Gider', i + 1, tarihGoster(p.vade), tlSayi(p.tutar), tlSayi(p.odenen || 0), tarihGoster(p.odemeTarihi)])));
      await csvKaydet('kira-plani.csv', ['Taşınmaz', 'Karşı Taraf', 'Tür', 'Sıra', 'Vade', 'Tutar', 'Gerçekleşen', 'Tarih'], rows);
    }
  });
}

function detayHtml(k) {
  const o = planOzet(k.plan);
  const gelir = k.yon === 'gelir';
  const satirlar = [...k.plan].sort((a, c) => a.vade.localeCompare(c.vade));
  return `<div class="detay-ust">
      <div><div class="detay-baslik">${esc(k.tasinmaz)}</div><div class="soluk">${esc(cariAdi(k.cariId))} · ${gelir ? 'Kira Geliri' : 'Kira Gideri'} · ${tarihGoster(k.baslangic)} – ${tarihGoster(bitisTarihi(k))}${k.depozito ? ` · Depozito ${tl(k.depozito)}` : ''}</div></div>
      <div class="detay-ozet"><div><span>Toplam</span><strong>${tl(o.toplam)}</strong></div><div><span>${gelir ? 'Tahsil Edilen' : 'Ödenen'}</span><strong>${tl(o.odenen)}</strong></div><div><span>Kalan</span><strong class="${gelir ? 'yesil' : 'kirmizi'}">${tl(o.kalan)}</strong></div></div>
    </div>
    ${k.not ? `<p class="soluk">${esc(k.not)}</p>` : ''}
    <div class="tablo-kap tablo-kap-kisa"><table class="tablo tablo-ic"><thead><tr><th>#</th><th>Açıklama</th><th>Vade</th><th class="sag">Tutar</th><th class="sag">${gelir ? 'Tahsil' : 'Ödenen'}</th><th>Durum</th><th></th></tr></thead><tbody>
    ${satirlar.map((p, i) => {
      const kalan = p.tutar - (p.odenen || 0);
      const durum = kalan <= 0.005 ? rozet(gelir ? 'Tahsil Edildi' : 'Ödendi', 'ok') : p.vade < bugun() ? rozet('Gecikmiş', 'bad') : (p.odenen || 0) > 0 ? rozet('Kısmi', 'warn') : rozet('Bekliyor', 'info');
      return `<tr><td>${i + 1}</td><td>${esc(p.aciklama) || '—'}</td><td>${tarihGoster(p.vade)}</td><td class="sag">${tl(p.tutar)}</td><td class="sag">${(p.odenen || 0) > 0 ? tl(p.odenen) : '—'}</td><td>${durum}</td>
      <td class="sag">${kalan > 0.005 ? `<button class="btn btn-kucuk btn-birincil" data-ode="kira:${k.id}:${p.id}">${gelir ? 'Tahsil Et' : 'Öde'}</button>` : ''}${(p.odenen || 0) > 0 ? `<button class="ikon-btn" data-geri="kira:${k.id}:${p.id}" title="Geri al">${ikon('geri')}</button>` : ''}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function detayGoster(id) {
  const var_ = state.kiralar.find((x) => x.id === id);
  if (!var_) return;
  let birak = () => {};
  const m = modalAc({
    baslik: 'Kira Sözleşmesi',
    genis: true,
    govde: detayHtml(var_),
    butonlar: [{ etiket: 'Düzenle', tikla: () => { kiraFormu(id); } }, { etiket: 'Kapat', sinif: 'btn-birincil' }],
    onKapat: () => birak(),
  });
  birak = abone((neden) => {
    if (neden !== 'veri') return;
    const k = state.kiralar.find((x) => x.id === id);
    if (!k) return m.kapat();
    m.govde.innerHTML = detayHtml(k);
  });
  m.govde.addEventListener('click', (e) => {
    const ode = e.target.closest('[data-ode]');
    if (ode) odemeDialog(ode.dataset.ode);
    const geri = e.target.closest('[data-geri]');
    if (geri) odemeGeriAl(geri.dataset.geri);
  });
}

export function kiraPlaniUret({ baslangic, sureAy, odemeGunu, aylikTutar, artisOrani }) {
  const [y, m] = baslangic.split('-').map(Number);
  const satirlar = [];
  let ilkAy = 0;
  const vadeAy = (i) => {
    const t = new Date(y, m - 1 + i, 1);
    const son = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(Math.min(odemeGunu, son)).padStart(2, '0')}`;
  };
  if (vadeAy(0) < baslangic) ilkAy = 1;
  for (let i = 0; i < sureAy; i++) {
    const vade = vadeAy(i + ilkAy);
    const tutar = yuvarla(aylikTutar * (1 + (artisOrani || 0) / 100) ** Math.floor(i / 12));
    const ay = Number(vade.slice(5, 7));
    satirlar.push({ id: uid(), vade, tutar, aciklama: `${AYLAR[ay - 1]} ${vade.slice(0, 4)} kirası`, odenen: 0, odemeTarihi: '' });
  }
  return satirlar;
}

function kiraFormu(id) {
  const mevcut = id ? state.kiralar.find((k) => k.id === id) : null;
  const alanlar = [
    { ad: 'yon', etiket: 'Sözleşme Türü', tip: 'secim', secenekler: [{ d: 'gelir', e: 'Kira Geliri — ben kiraya veriyorum' }, { d: 'gider', e: 'Kira Gideri — ben kiracıyım' }], varsayilan: 'gelir' },
    { ad: 'cariId', etiket: 'Karşı Taraf (Kiracı / Ev Sahibi)', tip: 'cari', zorunlu: true },
    { ad: 'tasinmaz', etiket: 'Taşınmaz / Adres', zorunlu: true, genislik: 'tam', yer: 'Örn. Kadıköy 3+1 daire' },
    { ad: 'baslangic', etiket: 'Sözleşme Başlangıcı', tip: 'tarih', zorunlu: true },
    { ad: 'sureAy', etiket: 'Süre (ay)', tip: 'sayi', zorunlu: true, min: 1, max: 600, varsayilan: 12 },
    { ad: 'odemeGunu', etiket: 'Aylık Ödeme Günü', tip: 'sayi', zorunlu: true, min: 1, max: 31, varsayilan: 1 },
    { ad: 'aylikTutar', etiket: 'Aylık Kira Tutarı', tip: 'para', zorunlu: true },
    { ad: 'artisOrani', etiket: 'Yıllık Artış (%)', tip: 'sayi', min: 0, max: 500, adim: 0.01, varsayilan: 0, ipucu: 'Her 12 ayda bir kira bu oranda artırılır.' },
    { ad: 'depozito', etiket: 'Depozito', tip: 'para' },
    { ad: 'not', etiket: 'Not', tip: 'uzun', genislik: 'tam' },
  ];
  const plan = mevcut ? [...mevcut.plan].sort((a, b) => a.vade.localeCompare(b.vade)) : [];
  const m = modalAc({
    baslik: mevcut ? 'Kira Sözleşmesini Düzenle' : 'Yeni Kira Sözleşmesi',
    genis: true,
    govde: `${formHtml(alanlar, mevcut || {})}
      <div class="form-aksiyon"><button type="button" class="btn btn-ikincil" data-kira-plan>${ikon('takvim')} Ödeme Planını Oluştur / Yenile</button><small class="soluk">Sözleşme bilgilerinden aylık satırlar üretilir. Ödemesi alınmış satırlar korunur. Üretilen her satırın tarihi ve tutarı ayrı ayrı düzenlenebilir.</small></div>
      ${planHtml(plan, { etiket: 'Açıklama', seri: false })}`,
    butonlar: [
      { etiket: 'Vazgeç' },
      {
        etiket: 'Kaydet',
        sinif: 'btn-birincil',
        tikla: (ctl) => {
          const { deger, gecerli } = formOku(ctl.govde, alanlar);
          const { satirlar, hata } = planOku(ctl.govde);
          if (!gecerli || hata) return false;
          satirlar.sort((a, b) => a.vade.localeCompare(b.vade));
          degistir((s) => {
            if (mevcut) Object.assign(s.kiralar.find((k) => k.id === mevcut.id), deger, { plan: satirlar });
            else s.kiralar.push({ id: uid(), ...deger, plan: satirlar });
          }, `Kira sözleşmesi ${mevcut ? 'güncellendi' : 'eklendi'}: ${deger.tasinmaz}`);
          bildir('Sözleşme kaydedildi.');
        },
      },
    ],
  });
  formBagla(m.govde);
  planBagla(m.govde, { etiket: 'Açıklama' });
  m.govde.addEventListener('click', (e) => {
    if (!e.target.closest('[data-kira-plan]')) return;
    const gerekli = alanlar.filter((a) => ['baslangic', 'sureAy', 'odemeGunu', 'aylikTutar'].includes(a.ad));
    const { gecerli } = formOku(m.govde, gerekli);
    if (!gecerli) return;
    const { deger } = formOku(m.govde, alanlar.filter((a) => ['baslangic', 'sureAy', 'odemeGunu', 'aylikTutar', 'artisOrani'].includes(a.ad)));
    const korunan = planOku(m.govde, true).satirlar.filter((p) => (p.odenen || 0) > 0.005);
    const yeni = kiraPlaniUret(deger).filter((p) => !korunan.some((k) => k.vade === p.vade));
    planYaz(m.govde, [...korunan, ...yeni].sort((a, b) => a.vade.localeCompare(b.vade)), { etiket: 'Açıklama' });
  });
}
