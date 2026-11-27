import { esc, tlSayi, tlOku, uid, seriUret, bugun, topla, tl, csvUret } from './util.js';
import { state } from './store.js';

const IKON = {
  panel: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  akis: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  cek: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  borc: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  kira: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  hareket: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  cari: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  rapor: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  ayar: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  ekle: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  duzenle: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  sil: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/>',
  tamam: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  ara: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  indir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  klasor: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  uyari: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  geri: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  git: '<polyline points="9 18 15 12 9 6"/>',
  yazdir: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  takvim: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
};

export function ikon(ad, boyut = 16) {
  return `<svg class="ikon" width="${boyut}" height="${boyut}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON[ad] || ''}</svg>`;
}

export function rozet(metin, ton = 'mute') {
  return `<span class="rozet rozet-${ton}">${esc(metin)}</span>`;
}

export function para(n, ton = false) {
  const t = tl(n);
  if (!ton) return t;
  return `<span class="${n > 0.005 ? 'poz' : n < -0.005 ? 'neg' : ''}">${t}</span>`;
}

let zSayac = 1000;

export function modalAc({ baslik, govde, butonlar = [], genis = false, cok = false, onKapat }) {
  const kap = document.createElement('div');
  kap.className = 'modal-kaplama';
  kap.style.zIndex = ++zSayac;
  kap.innerHTML = `<div class="modal ${genis ? 'modal-genis' : ''} ${cok ? 'modal-cok' : ''}" role="dialog" aria-modal="true" aria-label="${esc(baslik)}">
    <div class="modal-baslik"><h2>${esc(baslik)}</h2><button type="button" class="ikon-btn" data-modal-kapat aria-label="Kapat">${ikon('x', 18)}</button></div>
    <div class="modal-govde">${govde}</div>
    <div class="modal-alt"></div></div>`;
  const alt = kap.querySelector('.modal-alt');
  const ctl = {
    el: kap,
    govde: kap.querySelector('.modal-govde'),
    kapat() {
      if (!kap.isConnected) return;
      kap.remove();
      if (onKapat) onKapat();
    },
  };
  butonlar.forEach((b) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn ${b.sinif || 'btn-ikincil'}`;
    btn.textContent = b.etiket;
    btn.addEventListener('click', async () => {
      if (b.tikla) {
        const r = await b.tikla(ctl);
        if (r === false) return;
      }
      ctl.kapat();
    });
    alt.appendChild(btn);
  });
  kap.querySelector('[data-modal-kapat]').addEventListener('click', () => ctl.kapat());
  kap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'button') {
      e.preventDefault();
      kap.querySelector('.btn-birincil, .btn-tehlike')?.click();
    }
  });
  document.body.appendChild(kap);
  kap.querySelector('input:not([type=hidden]):not([disabled]), select, textarea')?.focus();
  return ctl;
}

export function onayla(mesaj, { baslik = 'Onay', evet = 'Evet', tehlike = false } = {}) {
  return new Promise((coz) => {
    let cevaplandi = false;
    const cevap = (v) => {
      cevaplandi = true;
      coz(v);
    };
    modalAc({
      baslik,
      govde: `<p class="onay-metin">${esc(mesaj)}</p>`,
      butonlar: [
        { etiket: 'Vazgeç', tikla: () => cevap(false) },
        { etiket: evet, sinif: tehlike ? 'btn-tehlike' : 'btn-birincil', tikla: () => cevap(true) },
      ],
      onKapat: () => {
        if (!cevaplandi) coz(false);
      },
    });
  });
}

export function bildir(mesaj, ton = 'ok') {
  let kap = document.getElementById('toast-kap');
  if (!kap) {
    kap = document.createElement('div');
    kap.id = 'toast-kap';
    document.body.appendChild(kap);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${ton}`;
  t.textContent = mesaj;
  kap.appendChild(t);
  setTimeout(() => t.classList.add('gizle'), 3400);
  setTimeout(() => t.remove(), 3900);
}

export function cariSecenekleri(secili = '') {
  const liste = [...state.cariler].sort((a, b) => a.unvan.localeCompare(b.unvan, 'tr'));
  return `<option value="">— Seçiniz —</option>${liste.map((c) => `<option value="${c.id}" ${c.id === secili ? 'selected' : ''}>${esc(c.unvan)}</option>`).join('')}<option value="__yeni">+ Yeni cari ekle…</option>`;
}

export function alanHtml(a, v) {
  const id = `f_${a.ad}`;
  const deger = v ?? a.varsayilan ?? '';
  let girdi;
  switch (a.tip) {
    case 'para':
      girdi = `<input id="${id}" name="${a.ad}" data-tip="para" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${deger === '' || deger === 0 && !a.sifirGoster ? '' : esc(tlSayi(deger))}">`;
      break;
    case 'tarih':
      girdi = `<input id="${id}" type="date" name="${a.ad}" value="${esc(deger)}">`;
      break;
    case 'sayi':
      girdi = `<input id="${id}" type="number" name="${a.ad}" value="${esc(deger)}" ${a.min !== undefined ? `min="${a.min}"` : ''} ${a.max !== undefined ? `max="${a.max}"` : ''} step="${a.adim || 1}">`;
      break;
    case 'secim':
      girdi = `<select id="${id}" name="${a.ad}">${a.secenekler.map((o) => `<option value="${esc(o.d)}" ${String(o.d) === String(deger) ? 'selected' : ''}>${esc(o.e)}</option>`).join('')}</select>`;
      break;
    case 'cari':
      girdi = `<select id="${id}" name="${a.ad}" data-tip="cari">${cariSecenekleri(deger)}</select>`;
      break;
    case 'uzun':
      girdi = `<textarea id="${id}" name="${a.ad}" rows="2">${esc(deger)}</textarea>`;
      break;
    case 'liste':
      girdi = `<input id="${id}" name="${a.ad}" list="l_${a.ad}" value="${esc(deger)}" autocomplete="off"><datalist id="l_${a.ad}">${(a.secenekler || []).map((o) => `<option value="${esc(o)}">`).join('')}</datalist>`;
      break;
    default:
      girdi = `<input id="${id}" name="${a.ad}" value="${esc(deger)}" autocomplete="off" ${a.yer ? `placeholder="${esc(a.yer)}"` : ''}>`;
  }
  return `<div class="alan ${a.genislik === 'tam' ? 'alan-tam' : ''} ${a.genislik === 'ucte' ? 'alan-ucte' : ''}"><label for="${id}">${esc(a.etiket)}${a.zorunlu ? '<span class="zorunlu">*</span>' : ''}</label>${girdi}${a.ipucu ? `<small>${esc(a.ipucu)}</small>` : ''}<div class="hata" data-hata="${a.ad}"></div></div>`;
}

export function formHtml(alanlar, degerler = {}) {
  return `<div class="form-izgara">${alanlar.map((a) => alanHtml(a, degerler[a.ad])).join('')}</div>`;
}

export function formOku(kok, alanlar) {
  const deger = {};
  let gecerli = true;
  kok.querySelectorAll('[data-hata]').forEach((h) => (h.textContent = ''));
  kok.querySelectorAll('.hatali').forEach((h) => h.classList.remove('hatali'));
  for (const a of alanlar) {
    const el = kok.querySelector(`[name="${a.ad}"]`);
    if (!el) continue;
    let v = el.value.trim();
    let hata = '';
    if (a.tip === 'para') {
      if (v === '') {
        if (a.zorunlu) hata = 'Tutar girilmelidir.';
      } else {
        const n = tlOku(v);
        if (Number.isNaN(n)) hata = 'Geçerli bir tutar girin.';
        else if (a.zorunlu && n <= 0) hata = 'Tutar sıfırdan büyük olmalıdır.';
        else v = n;
      }
      if (v === '' && !hata) v = 0;
    } else if (a.tip === 'sayi') {
      const n = parseFloat(v.replace(',', '.'));
      if (v === '' && a.zorunlu) hata = 'Bu alan zorunludur.';
      else if (v !== '' && Number.isNaN(n)) hata = 'Sayı girin.';
      else if (v !== '' && a.min !== undefined && n < a.min) hata = `En az ${a.min} olmalıdır.`;
      else if (v !== '' && a.max !== undefined && n > a.max) hata = `En fazla ${a.max} olabilir.`;
      else v = v === '' ? 0 : n;
    } else if (a.zorunlu && v === '') {
      hata = 'Bu alan zorunludur.';
    }
    if (hata) {
      gecerli = false;
      const h = kok.querySelector(`[data-hata="${a.ad}"]`);
      if (h) h.textContent = hata;
      el.classList.add('hatali');
    }
    deger[a.ad] = v;
  }
  return { deger, gecerli };
}

export function sirala(satirlar, kolonlar, sira) {
  if (!sira) return satirlar;
  const k = kolonlar.find((x) => x.k === sira.k);
  if (!k || !k.s) return satirlar;
  return [...satirlar].sort((a, b) => {
    const x = k.s(a);
    const y = k.s(b);
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'tr');
    return c * sira.y;
  });
}

export function sirayiDegistir(sira, k) {
  return sira && sira.k === k ? { k, y: -sira.y } : { k, y: 1 };
}

export function tabloHtml(kolonlar, satirlar, { sira, bos = 'Kayıt bulunamadı.', altSatir = '', satirOzellik, satirSinif } = {}) {
  const baslik = kolonlar
    .map((k) => `<th class="${k.h || ''} ${k.s ? 'sirali' : ''}" ${k.s ? `data-sirala="${k.k}"` : ''} ${k.w ? `style="width:${k.w}"` : ''}>${esc(k.b)}${sira && sira.k === k.k ? `<span class="sira-ok">${sira.y > 0 ? '▲' : '▼'}</span>` : ''}</th>`)
    .join('');
  const govde = satirlar.length
    ? satirlar
        .map((r) => `<tr ${satirOzellik ? satirOzellik(r) : ''} class="${satirSinif ? satirSinif(r) : ''}">${kolonlar.map((k) => `<td class="${k.h || ''}">${k.v(r)}</td>`).join('')}</tr>`)
        .join('')
    : `<tr><td class="bos-satir" colspan="${kolonlar.length}">${esc(bos)}</td></tr>`;
  return `<div class="tablo-kap"><table class="tablo"><thead><tr>${baslik}</tr></thead><tbody>${govde}</tbody>${altSatir ? `<tfoot>${altSatir}</tfoot>` : ''}</table></div>`;
}

export function islemButonlari(dizi) {
  return `<div class="islemler">${dizi.map((b) => `<button type="button" class="ikon-btn ${b.sinif || ''}" data-act="${b.act}" data-id="${b.id}" ${b.ek || ''} title="${esc(b.baslik)}" aria-label="${esc(b.baslik)}">${ikon(b.ikon)}</button>`).join('')}</div>`;
}

/* ---------- Taksit / ödeme planı düzenleyici ---------- */

function planSatirHtml(s, o, i) {
  const odendi = (s.odenen || 0) > 0.005;
  const tamOdendi = odendi && (s.odenen || 0) >= s.tutar - 0.005;
  return `<tr data-satir data-id="${esc(s.id || '')}" data-odenen="${s.odenen || 0}" data-odeme="${esc(s.odemeTarihi || '')}">
    <td class="sira">${i + 1}</td>
    ${o.metinAlani === false ? '' : `<td><input data-k="aciklama" value="${esc(s.aciklama || '')}" placeholder="${esc(o.yer || '')}"></td>`}
    <td><input type="date" data-k="vade" value="${esc(s.vade || '')}"></td>
    <td><input data-k="tutar" data-tip="para" inputmode="decimal" value="${s.tutar ? esc(tlSayi(s.tutar)) : ''}" placeholder="0,00" class="sag"></td>
    <td>${tamOdendi ? rozet('Ödendi', 'ok') : odendi ? rozet('Kısmi', 'warn') : ''}</td>
    <td><button type="button" class="ikon-btn" data-plan-sil title="Satırı sil">${ikon('x')}</button></td></tr>`;
}

export function planHtml(satirlar, o = {}) {
  const seri = o.seri === false ? '' : `<div class="seri-panel">
      <div class="seri-baslik">${ikon('takvim')} Seri oluştur <small>(her satırın tarihi ve tutarı sonradan tek tek değiştirilebilir)</small></div>
      <div class="seri-alanlar">
        <label>Adet<input type="number" min="1" max="600" value="${o.adet || 12}" data-seri="adet"></label>
        <label>İlk vade<input type="date" value="${esc(o.ilkVade || '')}" data-seri="ilkVade"></label>
        <label>Aralık (ay)<input type="number" min="1" max="24" value="1" data-seri="aralik"></label>
        <label>Tutar<input data-seri="tutar" data-tip="para" inputmode="decimal" placeholder="0,00"></label>
        <label>Tutar türü<select data-seri="tur"><option value="birim">Her satırın tutarı</option><option value="toplam">Toplam (eşit bölünsün)</option></select></label>
        <button type="button" class="btn btn-ikincil" data-seri-uret>Satırları Oluştur</button>
      </div></div>`;
  const kolonSayisi = o.metinAlani === false ? 5 : 6;
  return `<div class="plan" data-plan ${o.otoAciklama ? `data-oto="${esc(o.otoAciklama)}"` : ''} ${o.metinAlani === false ? 'data-metinsiz' : ''}>
    ${seri}
    <div class="plan-kap"><table class="plan-tablo"><thead><tr><th style="width:34px">#</th>${o.metinAlani === false ? '' : `<th>${esc(o.etiket || 'Açıklama')}</th>`}<th style="width:150px">Vade Tarihi</th><th style="width:150px" class="sag">Tutar</th><th style="width:80px">Durum</th><th style="width:34px"></th></tr></thead>
    <tbody data-plan-govde>${satirlar.map((s, i) => planSatirHtml(s, o, i)).join('')}</tbody>
    <tfoot><tr><td colspan="${kolonSayisi - 3}"><button type="button" class="btn btn-ikincil btn-kucuk" data-plan-ekle>${ikon('ekle', 14)} Satır ekle</button></td><td class="sag plan-toplam" data-plan-toplam colspan="3"></td></tr></tfoot></table></div>
    <div class="hata" data-plan-hata></div></div>`;
}

export function planBagla(kok, o = {}) {
  const plan = kok.querySelector('[data-plan]');
  const govde = plan.querySelector('[data-plan-govde]');
  const yenile = () => {
    govde.querySelectorAll('tr[data-satir]').forEach((tr, i) => (tr.querySelector('.sira').textContent = i + 1));
    const { satirlar } = planOku(kok, true);
    plan.querySelector('[data-plan-toplam]').innerHTML = `${satirlar.length} satır · Toplam: <strong>${tl(topla(satirlar, (s) => s.tutar || 0))}</strong>`;
  };
  plan.addEventListener('input', (e) => {
    if (e.target.matches('[data-k="tutar"]')) yenile();
  });
  plan.addEventListener('click', (e) => {
    if (e.target.closest('[data-plan-ekle]')) {
      const son = [...govde.querySelectorAll('tr[data-satir]')].pop();
      const sonVade = son?.querySelector('[data-k="vade"]').value || '';
      const sonTutar = son ? tlOku(son.querySelector('[data-k="tutar"]').value) : 0;
      govde.insertAdjacentHTML('beforeend', planSatirHtml({ vade: sonVade ? addAy(sonVade, 1) : '', tutar: Number.isNaN(sonTutar) ? 0 : sonTutar }, o, govde.children.length));
      yenile();
      govde.lastElementChild.querySelector('input').focus();
    }
    const sil = e.target.closest('[data-plan-sil]');
    if (sil) {
      sil.closest('tr').remove();
      yenile();
    }
    if (e.target.closest('[data-seri-uret]')) {
      const val = (n) => plan.querySelector(`[data-seri="${n}"]`).value;
      const tutar = tlOku(val('tutar'));
      const hata = plan.querySelector('[data-plan-hata]');
      if (!val('ilkVade') || Number.isNaN(tutar) || tutar <= 0) {
        hata.textContent = 'Seri için ilk vade tarihi ve tutar girilmelidir.';
        return;
      }
      hata.textContent = '';
      const uretilen = seriUret({ adet: val('adet'), ilkVade: val('ilkVade'), aralikAy: val('aralik'), tutar, toplamMi: val('tur') === 'toplam' });
      const oto = plan.dataset.oto;
      const korunan = planOku(kok, true).satirlar.filter((s) => (s.odenen || 0) > 0.005);
      const yeni = uretilen.map((u, i) => ({ ...u, aciklama: oto ? oto.replace('{i}', i + 1).replace('{n}', uretilen.length) : '' }));
      planYaz(kok, [...korunan, ...yeni].sort((a, b) => a.vade.localeCompare(b.vade)), o);
    }
  });
  yenile();
}

function addAy(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(y, m - 1 + n, 1);
  const son = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(Math.min(d, son)).padStart(2, '0')}`;
}

export function planYaz(kok, satirlar, o = {}) {
  const plan = kok.querySelector('[data-plan]');
  const govde = plan.querySelector('[data-plan-govde]');
  govde.innerHTML = satirlar.map((s, i) => planSatirHtml(s, o, i)).join('');
  const { satirlar: s2 } = planOku(kok, true);
  plan.querySelector('[data-plan-toplam]').innerHTML = `${s2.length} satır · Toplam: <strong>${tl(topla(s2, (s) => s.tutar || 0))}</strong>`;
}

export function planOku(kok, sessiz = false) {
  const plan = kok.querySelector('[data-plan]');
  const hataEl = plan.querySelector('[data-plan-hata]');
  const satirlar = [];
  let hata = '';
  plan.querySelectorAll('tr[data-satir]').forEach((tr, i) => {
    const vade = tr.querySelector('[data-k="vade"]').value;
    const tutarMetni = tr.querySelector('[data-k="tutar"]').value.trim();
    const tutar = tutarMetni === '' ? NaN : tlOku(tutarMetni);
    const aciklama = tr.querySelector('[data-k="aciklama"]')?.value.trim() || '';
    const satir = { id: tr.dataset.id || uid(), vade, tutar: Number.isNaN(tutar) ? 0 : tutar, aciklama, odenen: Number(tr.dataset.odenen) || 0, odemeTarihi: tr.dataset.odeme || '' };
    if (!sessiz) {
      tr.querySelectorAll('.hatali').forEach((x) => x.classList.remove('hatali'));
      if (!vade) {
        hata ||= `${i + 1}. satır için vade tarihi girilmelidir.`;
        tr.querySelector('[data-k="vade"]').classList.add('hatali');
      }
      if (Number.isNaN(tutar) || tutar <= 0) {
        hata ||= `${i + 1}. satır için tutar sıfırdan büyük olmalıdır.`;
        tr.querySelector('[data-k="tutar"]').classList.add('hatali');
      }
    }
    satirlar.push(satir);
  });
  if (!sessiz) {
    if (!satirlar.length) hata = 'En az bir satır eklenmelidir.';
    hataEl.textContent = hata;
  }
  return { satirlar, hata };
}

export function moneyFocusout(kok) {
  kok.addEventListener('focusout', (e) => {
    const el = e.target;
    if (el.matches?.('input[data-tip="para"]') && el.value.trim() !== '') {
      const n = tlOku(el.value);
      if (!Number.isNaN(n)) el.value = tlSayi(n);
    }
  });
}

export function bosKutu(mesaj, ikonAdi = 'uyari') {
  return `<div class="bos-kutu">${ikon(ikonAdi, 28)}<p>${esc(mesaj)}</p></div>`;
}

export function bugunIso() {
  return bugun();
}

export function sayfaBasligi(baslik, aciklama, aksiyon = '') {
  return `<div class="sayfa-baslik"><div><h1>${esc(baslik)}</h1>${aciklama ? `<p>${esc(aciklama)}</p>` : ''}</div><div class="sayfa-aksiyon">${aksiyon}</div></div>`;
}

export function kartHtml(etiket, deger, alt = '', ton = '') {
  return `<div class="kpi ${ton ? 'kpi-' + ton : ''}"><div class="kpi-etiket">${esc(etiket)}</div><div class="kpi-deger">${deger}</div>${alt ? `<div class="kpi-alt">${alt}</div>` : ''}</div>`;
}

export async function csvKaydet(dosyaAdi, basliklar, satirlar) {
  const yol = await window.finans.dosyaKaydet({ ad: dosyaAdi, icerik: csvUret(basliklar, satirlar), filtreAd: 'Excel için CSV', uzanti: 'csv', bom: true });
  if (yol) bildir('Dosya kaydedildi: ' + yol);
}

export async function pdfKaydet(ad) {
  const yol = await window.finans.pdf(ad);
  if (yol) bildir('PDF kaydedildi: ' + yol);
}
