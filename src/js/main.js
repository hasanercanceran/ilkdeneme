import { state, baslat, abone, kayitBilgisi } from './store.js';
import { nav } from './nav.js';
import { kalemler } from './derive.js';
import { esc, tarihGoster, tl } from './util.js';
import { ikon, bildir, modalAc } from './ui.js';
import { cariFormuAc } from './actions.js';
import * as dashboard from './views/dashboard.js';
import * as cashflow from './views/cashflow.js';
import * as cheques from './views/cheques.js';
import * as debts from './views/debts.js';
import * as rents from './views/rents.js';
import * as movements from './views/movements.js';
import * as parties from './views/parties.js';
import * as reports from './views/reports.js';
import * as settings from './views/settings.js';

const SAYFALAR = [
  { id: 'panel', ad: 'Gösterge Paneli', ikon: 'panel', modul: dashboard },
  { id: 'akis', ad: 'Nakit Akışı', ikon: 'akis', modul: cashflow },
  { grup: 'Kayıtlar' },
  { id: 'cek', ad: 'Çek / Senet', ikon: 'cek', modul: cheques },
  { id: 'borc', ad: 'Borçlar', ikon: 'borc', modul: debts },
  { id: 'kira', ad: 'Kira Sözleşmeleri', ikon: 'kira', modul: rents },
  { id: 'hareket', ad: 'Gelir / Gider', ikon: 'hareket', modul: movements },
  { id: 'cari', ad: 'Cari Hesaplar', ikon: 'cari', modul: parties },
  { grup: 'Sistem' },
  { id: 'rapor', ad: 'Raporlar', ikon: 'rapor', modul: reports },
  { id: 'ayar', ad: 'Ayarlar', ikon: 'ayar', modul: settings },
];

const KAYNAK_SAYFA = { cek: 'cek', borc: 'borc', kira: 'kira', hareket: 'hareket' };
let aktif = 'panel';
let bilgi = { yol: '' };

function kabukKur() {
  document.getElementById('uygulama').innerHTML = `
    <aside class="yan-menu">
      <div class="marka"><div class="marka-logo">₺</div><div><div class="marka-ad">Finans Takip</div><div class="marka-alt" id="marka-alt"></div></div></div>
      <nav class="menu">${SAYFALAR.map((s) => (s.grup ? `<div class="menu-grup">${s.grup}</div>` : `<button class="menu-oge" data-sayfa="${s.id}">${ikon(s.ikon, 18)}<span>${s.ad}</span></button>`)).join('')}</nav>
      <div class="yan-alt"><div id="kayit-durum" class="kayit-durum"></div></div>
    </aside>
    <div class="ana">
      <header class="ust-cubuk">
        <div class="global-ara">${ikon('ara', 16)}<input id="global-ara" type="search" placeholder="Ara: evrak no, cari, açıklama…   (Ctrl+K)" autocomplete="off"><div id="ara-sonuc" class="ara-sonuc" hidden></div></div>
        <div class="ust-sag"><div class="tarih-rozet">${ikon('takvim', 15)} <span id="ust-tarih"></span></div>
          <div class="yeni-kap"><button class="btn btn-birincil" id="yeni-btn">${ikon('ekle', 16)} Yeni</button><div class="yeni-menu" id="yeni-menu" hidden>
            <button data-yeni="cek">Çek / Senet</button><button data-yeni="borc">Borç</button><button data-yeni="kira">Kira Sözleşmesi</button><button data-yeni="hareket">Gelir / Gider</button><button data-yeni="cari">Cari Hesap</button></div></div></div>
      </header>
      <main id="icerik" class="icerik"></main>
    </div>`;
}

function goster(id, koru = false) {
  aktif = id;
  const sayfa = SAYFALAR.find((s) => s.id === id);
  const icerik = document.getElementById('icerik');
  const kaydirma = koru ? icerik.scrollTop : 0;
  document.querySelectorAll('.menu-oge').forEach((b) => b.classList.toggle('aktif', b.dataset.sayfa === id));
  const kap = document.createElement('div');
  kap.className = 'sayfa';
  icerik.replaceChildren(kap);
  try {
    sayfa.modul.mount(kap, bilgi);
  } catch (e) {
    console.error(e);
    kap.innerHTML = `<div class="bos-kutu"><p>Bu sayfa yüklenirken bir hata oluştu: ${esc(e.message)}</p></div>`;
  }
  icerik.scrollTop = kaydirma;
  document.getElementById('marka-alt').textContent = `${state.ayarlar.firma || 'Dönem'} · ${state.ayarlar.yil}`;
}

function kayitDurumunuYaz() {
  const k = kayitBilgisi();
  const el = document.getElementById('kayit-durum');
  if (k.hata) el.innerHTML = `<span class="kirmizi-acik">● Kayıt hatası</span>`;
  else if (k.zaman) el.innerHTML = `<span class="yesil-acik">● Kaydedildi</span> ${k.zaman.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  else el.innerHTML = '<span class="soluk-acik">● Hazır</span>';
}

function aramaBagla() {
  const girdi = document.getElementById('global-ara');
  const kutu = document.getElementById('ara-sonuc');
  const kapat = () => (kutu.hidden = true);
  girdi.addEventListener('input', () => {
    const q = girdi.value.trim().toLowerCase();
    if (q.length < 2) return kapat();
    const kalem = kalemler()
      .filter((k) => `${k.baslik} ${k.cariAd} ${k.detay} ${k.kategori}`.toLowerCase().includes(q))
      .slice(0, 8)
      .map((k) => ({ sayfa: KAYNAK_SAYFA[k.kaynak], baslik: k.baslik, alt: `${k.cariAd || k.kategori} · ${tarihGoster(k.vade)}`, tutar: tl(k.tutar) }));
    const cari = state.cariler.filter((c) => c.unvan.toLowerCase().includes(q)).slice(0, 4).map((c) => ({ sayfa: 'cari', baslik: c.unvan, alt: 'Cari hesap', tutar: '' }));
    const sonuc = [...cari, ...kalem];
    kutu.innerHTML = sonuc.length
      ? sonuc.map((s) => `<button class="ara-oge" data-git="${s.sayfa}"><span><strong>${esc(s.baslik)}</strong><small>${esc(s.alt)}</small></span><span>${esc(s.tutar)}</span></button>`).join('')
      : '<div class="ara-bos">Sonuç bulunamadı.</div>';
    kutu.hidden = false;
  });
  kutu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-git]');
    if (!b) return;
    nav.git(b.dataset.git);
    girdi.value = '';
    kapat();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-ara')) kapat();
  });
}

function yeniMenuBagla() {
  const btn = document.getElementById('yeni-btn');
  const menu = document.getElementById('yeni-menu');
  const ac = () => (menu.hidden = !menu.hidden);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    ac();
  });
  document.addEventListener('click', () => (menu.hidden = true));
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-yeni]');
    if (!b) return;
    menu.hidden = true;
    const t = b.dataset.yeni;
    if (t === 'cari') return cariFormuAc(null);
    nav.git(t);
    document.querySelector('#icerik [data-act="yeni"]')?.click();
  });
  return ac;
}

function baslat_() {
  document.documentElement.lang = 'tr';
  kabukKur();
  bilgi = baslat();
  document.getElementById('ust-tarih').textContent = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
  document.querySelector('.menu').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sayfa]');
    if (b) goster(b.dataset.sayfa);
  });
  aramaBagla();
  const yeniAc = yeniMenuBagla();
  nav.git = (id) => goster(id);
  nav.yenile = () => goster(aktif, true);
  abone((neden) => {
    if (neden === 'kayit') kayitDurumunuYaz();
    else {
      goster(aktif, true);
      kayitDurumunuYaz();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const m = [...document.querySelectorAll('.modal-kaplama')].pop();
      if (m) m.querySelector('[data-modal-kapat]')?.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      document.getElementById('global-ara').focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      yeniAc();
    }
  });
  kayitDurumunuYaz();
  goster('panel');
  if (bilgi.uyari) modalAc({ baslik: 'Dikkat', govde: `<p class="onay-metin">${esc(bilgi.uyari)}</p>`, butonlar: [{ etiket: 'Tamam', sinif: 'btn-birincil' }] });
  if (bilgi.bilgi) bildir(bilgi.bilgi, 'bilgi');
}

baslat_();
