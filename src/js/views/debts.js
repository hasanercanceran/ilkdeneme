import { state, degistir, abone } from '../store.js';
import { esc, tl, tarihGoster, uid, bugun, topla, tlSayi } from '../util.js';
import { cariAdi, planOzet, kalemler } from '../derive.js';
import { rozet, tabloHtml, sirala, sirayiDegistir, islemButonlari, sayfaBasligi, kartHtml, modalAc, formHtml, formOku, planHtml, planBagla, planOku, bildir, onayla, csvKaydet, ikon } from '../ui.js';
import { formBagla, odemeDialog, odemeGeriAl } from '../actions.js';

const TURLER = ['Banka Kredisi', 'Kredi Kartı', 'Cari Borç', 'Vergi / SGK', 'Şahıs Borcu', 'Taksitli Alım', 'Diğer'];
const f = { arama: '', durum: '', sira: { k: 'sonraki', y: 1 } };

function durumu(b) {
  const o = planOzet(b.plan);
  if (o.kalan <= 0.005) return { metin: 'Tamamlandı', ton: 'ok', anahtar: 'tamam' };
  if (o.gecikmis) return { metin: 'Gecikmiş', ton: 'bad', anahtar: 'gecikmis' };
  return { metin: 'Devam Ediyor', ton: 'info', anahtar: 'devam' };
}

const kolonlar = [
  { k: 'cari', b: 'Alacaklı', s: (b) => cariAdi(b.cariId), v: (b) => `<strong>${esc(cariAdi(b.cariId)) || '—'}</strong>` },
  { k: 'baslik', b: 'Borç', s: (b) => b.baslik, v: (b) => `${esc(b.baslik)}<small class="soluk blok">${esc(b.tur)}</small>` },
  { k: 'taksit', b: 'Taksit', h: 'orta', s: (b) => planOzet(b.plan).odenenAdet, v: (b) => { const o = planOzet(b.plan); return `${o.odenenAdet} / ${o.adet}`; } },
  { k: 'toplam', b: 'Toplam', h: 'sag', s: (b) => planOzet(b.plan).toplam, v: (b) => tl(planOzet(b.plan).toplam) },
  { k: 'odenen', b: 'Ödenen', h: 'sag', s: (b) => planOzet(b.plan).odenen, v: (b) => tl(planOzet(b.plan).odenen) },
  { k: 'kalan', b: 'Kalan', h: 'sag', s: (b) => planOzet(b.plan).kalan, v: (b) => `<strong>${tl(planOzet(b.plan).kalan)}</strong>` },
  { k: 'sonraki', b: 'Sonraki Vade', s: (b) => planOzet(b.plan).sonraki?.vade || '9999', v: (b) => { const s = planOzet(b.plan).sonraki; return s ? tarihGoster(s.vade) : '<span class="soluk">—</span>'; } },
  { k: 'durum', b: 'Durum', s: (b) => durumu(b).metin, v: (b) => rozet(durumu(b).metin, durumu(b).ton) },
  {
    k: 'islem', b: '', w: '120px', h: 'sag',
    v: (b) => islemButonlari([
      { act: 'detay', id: b.id, ikon: 'git', baslik: 'Ödeme planı ve ödemeler' },
      { act: 'duzenle', id: b.id, ikon: 'duzenle', baslik: 'Düzenle' },
      { act: 'sil', id: b.id, ikon: 'sil', baslik: 'Sil', sinif: 'ikon-tehlike' },
    ]),
  },
];

function filtrele() {
  const a = f.arama.toLowerCase();
  return state.borclar.filter((b) => {
    if (f.durum && durumu(b).anahtar !== f.durum) return false;
    if (a && !`${b.baslik} ${b.tur} ${cariAdi(b.cariId)}`.toLowerCase().includes(a)) return false;
    return true;
  });
}

export function mount(el) {
  const aktif = state.borclar.filter((b) => durumu(b).anahtar !== 'tamam');
  const kalan = topla(aktif, (b) => planOzet(b.plan).kalan);
  const gecik = topla(state.borclar, (b) => topla(b.plan.filter((p) => p.vade < bugun() && p.tutar - (p.odenen || 0) > 0.005), (p) => p.tutar - (p.odenen || 0)));
  const bu30 = kalemler().filter((k) => k.kaynak === 'borc' && k.kalan > 0.005 && k.vade >= bugun());
  const sonraki = bu30.sort((a, b) => a.vade.localeCompare(b.vade))[0];
  el.innerHTML = `
    ${sayfaBasligi('Borçlar', 'Borç kartları, taksit planları ve ödeme takibi. Her taksitin kendi vade tarihi vardır.', `<button class="btn btn-ikincil" data-act="csv">${ikon('indir')} Excel (CSV)</button><button class="btn btn-birincil" data-act="yeni">${ikon('ekle')} Yeni Borç</button>`)}
    <div class="kpi-izgara">
      ${kartHtml('Toplam Kalan Borç', tl(kalan), `${aktif.length} aktif borç`, 'bad')}
      ${kartHtml('Vadesi Geçmiş', tl(gecik), gecik > 0 ? 'Acil ödeme gerekiyor' : 'Gecikmiş ödeme yok', gecik > 0 ? 'uyari' : '')}
      ${kartHtml('Sıradaki Ödeme', sonraki ? tl(sonraki.kalan) : '—', sonraki ? `${tarihGoster(sonraki.vade)} · ${esc(sonraki.baslik)}` : 'Planlı ödeme yok')}
    </div>
    <div class="arac-cubugu">
      <div class="arama-kutu">${ikon('ara')}<input type="search" data-f="arama" placeholder="Borç adı veya alacaklı ara…" value="${esc(f.arama)}"></div>
      <select data-f="durum">${[['', 'Tüm durumlar'], ['devam', 'Devam eden'], ['gecikmis', 'Gecikmiş'], ['tamam', 'Tamamlanan']].map(([d, e]) => `<option value="${d}" ${f.durum === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
    </div>
    <div data-alan></div>`;
  const boya = () => {
    const satirlar = sirala(filtrele(), kolonlar, f.sira);
    el.querySelector('[data-alan]').innerHTML = tabloHtml(kolonlar, satirlar, {
      sira: f.sira,
      bos: state.borclar.length ? 'Filtreye uyan borç yok.' : 'Henüz borç eklenmedi. “Yeni Borç” ile başlayın.',
      satirOzellik: (b) => `data-id="${b.id}"`,
      altSatir: satirlar.length ? `<tr><td colspan="3"><strong>${satirlar.length} borç</strong></td><td class="sag"><strong>${tl(topla(satirlar, (b) => planOzet(b.plan).toplam))}</strong></td><td class="sag"><strong>${tl(topla(satirlar, (b) => planOzet(b.plan).odenen))}</strong></td><td class="sag"><strong>${tl(topla(satirlar, (b) => planOzet(b.plan).kalan))}</strong></td><td colspan="3"></td></tr>` : '',
    });
  };
  boya();
  el.addEventListener('input', (e) => {
    const k = e.target.dataset.f;
    if (!k) return;
    f[k] = e.target.value;
    boya();
  });
  el.addEventListener('change', (e) => {
    if (e.target.dataset.f === 'durum') {
      f.durum = e.target.value;
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
    if (b.dataset.act === 'yeni') borcFormu();
    else if (b.dataset.act === 'duzenle') borcFormu(id);
    else if (b.dataset.act === 'detay') detayGoster(id);
    else if (b.dataset.act === 'sil') {
      const x = state.borclar.find((y) => y.id === id);
      if (await onayla(`“${x.baslik}” borcu ve tüm ödeme planı kalıcı olarak silinecek. Emin misiniz?`, { baslik: 'Borcu Sil', evet: 'Sil', tehlike: true })) {
        degistir((s) => (s.borclar = s.borclar.filter((y) => y.id !== id)), `Borç silindi: ${x.baslik}`);
        bildir('Borç silindi.', 'bilgi');
      }
    } else if (b.dataset.act === 'csv') {
      const rows = [];
      sirala(filtrele(), kolonlar, f.sira).forEach((x) => x.plan.forEach((p, i) => rows.push([cariAdi(x.cariId), x.baslik, x.tur, `${i + 1}/${x.plan.length}`, tarihGoster(p.vade), tlSayi(p.tutar), tlSayi(p.odenen || 0), tlSayi(Math.max(0, p.tutar - (p.odenen || 0))), tarihGoster(p.odemeTarihi)])));
      await csvKaydet('borc-odeme-plani.csv', ['Alacaklı', 'Borç', 'Tür', 'Taksit', 'Vade', 'Tutar', 'Ödenen', 'Kalan', 'Ödeme Tarihi'], rows);
    }
  });
}

function detayHtml(b) {
  const o = planOzet(b.plan);
  const satirlar = [...b.plan].sort((a, c) => a.vade.localeCompare(c.vade));
  return `<div class="detay-ust">
      <div><div class="detay-baslik">${esc(b.baslik)}</div><div class="soluk">${esc(cariAdi(b.cariId))} · ${esc(b.tur)}</div></div>
      <div class="detay-ozet"><div><span>Toplam</span><strong>${tl(o.toplam)}</strong></div><div><span>Ödenen</span><strong>${tl(o.odenen)}</strong></div><div><span>Kalan</span><strong class="kirmizi">${tl(o.kalan)}</strong></div></div>
    </div>
    ${b.not ? `<p class="soluk">${esc(b.not)}</p>` : ''}
    <table class="tablo tablo-ic"><thead><tr><th>#</th><th>Açıklama</th><th>Vade</th><th class="sag">Tutar</th><th class="sag">Ödenen</th><th>Durum</th><th></th></tr></thead><tbody>
    ${satirlar.map((p, i) => {
      const kalan = p.tutar - (p.odenen || 0);
      const durum = kalan <= 0.005 ? rozet('Ödendi', 'ok') : p.vade < bugun() ? rozet('Gecikmiş', 'bad') : (p.odenen || 0) > 0 ? rozet('Kısmi', 'warn') : rozet('Bekliyor', 'info');
      return `<tr><td>${i + 1}</td><td>${esc(p.aciklama) || '<span class="soluk">—</span>'}</td><td>${tarihGoster(p.vade)}</td><td class="sag">${tl(p.tutar)}</td><td class="sag">${(p.odenen || 0) > 0 ? `${tl(p.odenen)}<small class="soluk blok">${tarihGoster(p.odemeTarihi)}</small>` : '—'}</td><td>${durum}</td>
      <td class="sag">${kalan > 0.005 ? `<button class="btn btn-kucuk btn-birincil" data-ode="borc:${b.id}:${p.id}">Öde</button>` : ''}${(p.odenen || 0) > 0 ? `<button class="ikon-btn" data-geri="borc:${b.id}:${p.id}" title="Ödemeyi geri al">${ikon('geri')}</button>` : ''}</td></tr>`;
    }).join('')}
    </tbody></table>`;
}

function detayGoster(id) {
  const var_ = state.borclar.find((x) => x.id === id);
  if (!var_) return;
  let birakAbone = () => {};
  const m = modalAc({
    baslik: 'Borç Kartı',
    genis: true,
    govde: detayHtml(var_),
    butonlar: [{ etiket: 'Düzenle', tikla: () => { borcFormu(id); } }, { etiket: 'Kapat', sinif: 'btn-birincil' }],
    onKapat: () => birakAbone(),
  });
  birakAbone = abone((neden) => {
    if (neden !== 'veri') return;
    const b = state.borclar.find((x) => x.id === id);
    if (!b) return m.kapat();
    m.govde.innerHTML = detayHtml(b);
  });
  m.govde.addEventListener('click', (e) => {
    const ode = e.target.closest('[data-ode]');
    if (ode) odemeDialog(ode.dataset.ode);
    const geri = e.target.closest('[data-geri]');
    if (geri) odemeGeriAl(geri.dataset.geri);
  });
}

function borcFormu(id) {
  const mevcut = id ? state.borclar.find((b) => b.id === id) : null;
  const alanlar = [
    { ad: 'cariId', etiket: 'Alacaklı (Cari)', tip: 'cari', zorunlu: true },
    { ad: 'tur', etiket: 'Borç Türü', tip: 'liste', secenekler: TURLER, varsayilan: 'Banka Kredisi' },
    { ad: 'baslik', etiket: 'Borç Adı', zorunlu: true, genislik: 'tam', yer: 'Örn. İş Bankası ihtiyaç kredisi' },
    { ad: 'not', etiket: 'Not', tip: 'uzun', genislik: 'tam' },
  ];
  const plan = mevcut ? [...mevcut.plan].sort((a, b) => a.vade.localeCompare(b.vade)) : [{ id: '', vade: '', tutar: 0, aciklama: '' }];
  const m = modalAc({
    baslik: mevcut ? 'Borcu Düzenle' : 'Yeni Borç',
    genis: true,
    govde: `${formHtml(alanlar, mevcut || {})}<h3 class="form-baslik">Ödeme Planı <small>Her taksit için ayrı vade tarihi ve tutar</small></h3>${planHtml(plan, { etiket: 'Açıklama', yer: 'Örn. 1. taksit', otoAciklama: '{i}/{n}. taksit', adet: 12 })}`,
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
            if (mevcut) Object.assign(s.borclar.find((b) => b.id === mevcut.id), deger, { plan: satirlar });
            else s.borclar.push({ id: uid(), ...deger, plan: satirlar });
          }, `Borç ${mevcut ? 'güncellendi' : 'eklendi'}: ${deger.baslik}`);
          bildir('Borç kaydedildi.');
        },
      },
    ],
  });
  formBagla(m.govde);
  planBagla(m.govde, { etiket: 'Açıklama', yer: 'Örn. 1. taksit' });
}
