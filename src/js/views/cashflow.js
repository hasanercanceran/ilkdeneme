import { state } from '../store.js';
import { esc, tl, tarihGoster, topla, tlSayi, AYLAR, ayEtiketi, bugun } from '../util.js';
import { kalemler, nakitSatirlari, aylikOzet, KAYNAK_ETIKET } from '../derive.js';
import { rozet, sayfaBasligi, kartHtml, csvKaydet, pdfKaydet, ikon, tabloHtml } from '../ui.js';
import { odemeDialog, odemeGeriAl } from '../actions.js';
import { nav } from '../nav.js';

const f = { sekme: 'liste', donem: 'yil', yon: '', kaynak: '', durum: '', arama: '' };

function donemSecenekleri() {
  const yil = state.ayarlar.yil;
  const ay = AYLAR.map((a, i) => [`${yil}-${String(i + 1).padStart(2, '0')}`, `${a} ${yil}`]);
  return [['hepsi', 'Tüm zamanlar'], ['yil', `${yil} yılı`], ...ay];
}

function uygun(s) {
  const yil = state.ayarlar.yil;
  if (f.donem === 'yil' && !s.tarih.startsWith(String(yil))) return false;
  if (/^\d{4}-\d{2}$/.test(f.donem) && !s.tarih.startsWith(f.donem)) return false;
  if (f.yon && String(s.yon) !== f.yon) return false;
  if (f.kaynak && s.kalem.kaynak !== f.kaynak) return false;
  if (f.durum === 'bekleyen' && s.gerceklesen) return false;
  if (f.durum === 'gerceklesen' && !s.gerceklesen) return false;
  if (f.durum === 'gecikmis' && (s.gerceklesen || s.tarih >= bugun())) return false;
  const a = f.arama.toLowerCase();
  return !a || `${s.kalem.baslik} ${s.kalem.cariAd} ${s.kalem.detay} ${s.kalem.kategori}`.toLowerCase().includes(a);
}

function satirDurum(s) {
  if (s.gerceklesen) return rozet(s.yon > 0 ? 'Tahsil Edildi' : 'Ödendi', 'ok');
  if (s.tarih < bugun()) return rozet('Gecikmiş', 'bad');
  return rozet('Bekliyor', 'info');
}

function listeHtml(satirlar) {
  if (!satirlar.length) return tabloHtml([{ k: 'a', b: 'Kayıt', v: () => '' }], [], { bos: 'Seçilen filtrelere uyan nakit hareketi yok.' });
  let gecerliAy = '';
  let govde = '';
  const aylikGelen = {};
  satirlar.forEach((s) => {
    const ay = s.tarih.slice(0, 7);
    aylikGelen[ay] ||= { gelen: 0, giden: 0 };
    aylikGelen[ay][s.yon > 0 ? 'gelen' : 'giden'] += s.tutar;
  });
  for (const s of satirlar) {
    const ay = s.tarih.slice(0, 7);
    if (ay !== gecerliAy) {
      gecerliAy = ay;
      const o = aylikGelen[ay];
      govde += `<tr class="ay-satir"><td colspan="9"><strong>${ayEtiketi(ay)}</strong><span class="ay-ozet">Gelen <b class="yesil">${tl(o.gelen)}</b> · Giden <b class="kirmizi">${tl(o.giden)}</b> · Net <b>${tl(o.gelen - o.giden)}</b></span></td></tr>`;
    }
    const k = s.kalem;
    govde += `<tr data-key="${k.key}" class="${s.gerceklesen ? 'satir-bitti' : ''}">
      <td>${tarihGoster(s.tarih)}</td>
      <td>${KAYNAK_ETIKET[k.kaynak]}</td>
      <td>${esc(k.baslik)}${k.detay ? `<small class="soluk blok">${esc(k.detay)}</small>` : ''}</td>
      <td>${esc(k.cariAd) || '<span class="soluk">—</span>'}</td>
      <td class="sag yesil">${s.yon > 0 ? tl(s.tutar) : ''}</td>
      <td class="sag kirmizi">${s.yon < 0 ? tl(s.tutar) : ''}</td>
      <td class="sag"><strong class="${s.bakiye < 0 ? 'kirmizi' : ''}">${tl(s.bakiye)}</strong></td>
      <td>${satirDurum(s)}</td>
      <td class="sag"><div class="islemler">${s.gerceklesen ? `<button class="ikon-btn" data-act="geri" data-key="${k.key}" title="Geri al">${ikon('geri')}</button>` : `<button class="ikon-btn ikon-ok" data-act="ode" data-key="${k.key}" title="${s.yon > 0 ? 'Tahsil et' : 'Öde'}">${ikon('tamam')}</button>`}</div></td></tr>`;
  }
  const gelen = topla(satirlar.filter((s) => s.yon > 0), (s) => s.tutar);
  const giden = topla(satirlar.filter((s) => s.yon < 0), (s) => s.tutar);
  return `<div class="tablo-kap"><table class="tablo"><thead><tr><th style="width:100px">Tarih</th><th style="width:100px">Kaynak</th><th>Açıklama</th><th>Cari</th><th class="sag">Gelen</th><th class="sag">Giden</th><th class="sag">Bakiye</th><th>Durum</th><th style="width:50px"></th></tr></thead><tbody>${govde}</tbody>
    <tfoot><tr><td colspan="4"><strong>Toplam (${satirlar.length} hareket)</strong></td><td class="sag"><strong class="yesil">${tl(gelen)}</strong></td><td class="sag"><strong class="kirmizi">${tl(giden)}</strong></td><td class="sag"><strong>${tl(gelen - giden)}</strong></td><td colspan="2"></td></tr></tfoot></table></div>`;
}

function ozetHtml(tum) {
  const yil = state.ayarlar.yil;
  const aylar = aylikOzet(tum, yil);
  const g = topla(aylar, (a) => a.gelen);
  const c = topla(aylar, (a) => a.giden);
  return `<div class="tablo-kap"><table class="tablo"><thead><tr><th>Ay</th><th class="sag">Dönem Başı Bakiye</th><th class="sag">Gelen</th><th class="sag">Giden</th><th class="sag">Net</th><th class="sag">Dönem Sonu Bakiye</th><th class="orta">Hareket</th></tr></thead><tbody>
    ${aylar.map((a) => `<tr class="tikla" data-ay="${a.on}"><td><strong>${AYLAR[a.ay - 1]} ${yil}</strong></td><td class="sag">${tl(a.baslangic)}</td><td class="sag yesil">${tl(a.gelen)}</td><td class="sag kirmizi">${tl(a.giden)}</td><td class="sag ${a.net < 0 ? 'kirmizi' : 'yesil'}"><strong>${tl(a.net)}</strong></td><td class="sag"><strong class="${a.bitis < 0 ? 'kirmizi' : ''}">${tl(a.bitis)}</strong></td><td class="orta">${a.adet}</td></tr>`).join('')}
    </tbody><tfoot><tr><td><strong>${yil} Toplamı</strong></td><td class="sag">${tl(aylar[0].baslangic)}</td><td class="sag yesil"><strong>${tl(g)}</strong></td><td class="sag kirmizi"><strong>${tl(c)}</strong></td><td class="sag"><strong>${tl(g - c)}</strong></td><td class="sag"><strong>${tl(aylar[11].bitis)}</strong></td><td class="orta">${topla(aylar, (a) => a.adet)}</td></tr></tfoot></table></div>
    <p class="dipnot">Satıra tıklayarak o ayın hareketlerini görebilirsiniz. Açılış bakiyesi Ayarlar bölümünden girilir.</p>`;
}

export function mount(el) {
  const tum = nakitSatirlari(kalemler());
  const yilSat = tum.filter((s) => s.tarih.startsWith(String(state.ayarlar.yil)));
  const bekGelen = topla(tum.filter((s) => !s.gerceklesen && s.yon > 0), (s) => s.tutar);
  const bekGiden = topla(tum.filter((s) => !s.gerceklesen && s.yon < 0), (s) => s.tutar);
  const son = tum.length ? tum[tum.length - 1].bakiye : state.ayarlar.acilisBakiyesi || 0;
  el.innerHTML = `
    ${sayfaBasligi('Nakit Akışı', 'Gelecek ve gidecek tüm paralar tek ekranda: çek/senet, borç, kira ve diğer hareketler tarih sırasıyla, yürüyen bakiyeyle.', `<button class="btn btn-ikincil" data-act="csv">${ikon('indir')} Excel (CSV)</button><button class="btn btn-ikincil" data-act="yazdir">${ikon('yazdir')} Yazdır</button><button class="btn btn-ikincil" data-act="pdf">PDF</button>`)}
    <div class="kpi-izgara">
      ${kartHtml('Gelecek Para (Bekleyen)', tl(bekGelen), 'Tahsil edilmemiş alacaklar', 'ok')}
      ${kartHtml('Gidecek Para (Bekleyen)', tl(bekGiden), 'Ödenmemiş borç ve giderler', 'bad')}
      ${kartHtml('Dönem Sonu Beklenen Bakiye', tl(son), `Açılış: ${tl(state.ayarlar.acilisBakiyesi || 0)}`, son < 0 ? 'uyari' : '')}
    </div>
    <div class="sekmeler">${[['liste', 'Hareket Listesi'], ['ozet', 'Aylık Özet']].map(([k, e]) => `<button class="sekme ${f.sekme === k ? 'aktif' : ''}" data-sekme="${k}">${e}</button>`).join('')}</div>
    ${f.sekme === 'liste' ? `<div class="arac-cubugu">
      <div class="arama-kutu">${ikon('ara')}<input type="search" data-f="arama" placeholder="Açıklama, cari veya kategori ara…" value="${esc(f.arama)}"></div>
      <select data-f="donem">${donemSecenekleri().map(([d, e]) => `<option value="${d}" ${f.donem === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
      <select data-f="yon">${[['', 'Gelen ve giden'], ['1', 'Yalnız gelen'], ['-1', 'Yalnız giden']].map(([d, e]) => `<option value="${d}" ${f.yon === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
      <select data-f="kaynak">${[['', 'Tüm kaynaklar'], ...Object.entries(KAYNAK_ETIKET)].map(([d, e]) => `<option value="${d}" ${f.kaynak === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
      <select data-f="durum">${[['', 'Tüm durumlar'], ['bekleyen', 'Bekleyen'], ['gecikmis', 'Gecikmiş'], ['gerceklesen', 'Gerçekleşen']].map(([d, e]) => `<option value="${d}" ${f.durum === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
    </div>` : ''}
    <div data-alan></div>`;
  const boya = () => {
    el.querySelector('[data-alan]').innerHTML = f.sekme === 'liste' ? listeHtml(tum.filter(uygun)) : ozetHtml(tum);
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
    if (k && k !== 'arama') {
      f[k] = e.target.value;
      boya();
    }
  });
  el.addEventListener('click', async (e) => {
    const sekme = e.target.closest('[data-sekme]');
    if (sekme) {
      f.sekme = sekme.dataset.sekme;
      nav.yenile();
      return;
    }
    const ay = e.target.closest('[data-ay]');
    if (ay) {
      f.sekme = 'liste';
      f.donem = ay.dataset.ay;
      nav.yenile();
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'ode') odemeDialog(b.dataset.key);
    else if (a === 'geri') odemeGeriAl(b.dataset.key);
    else if (a === 'yazdir') window.print();
    else if (a === 'pdf') await pdfKaydet('nakit-akisi.pdf');
    else if (a === 'csv') {
      if (f.sekme === 'ozet') {
        await csvKaydet('aylik-nakit-ozeti.csv', ['Ay', 'Dönem Başı', 'Gelen', 'Giden', 'Net', 'Dönem Sonu', 'Hareket'],
          aylikOzet(tum, state.ayarlar.yil).map((a2) => [`${AYLAR[a2.ay - 1]} ${state.ayarlar.yil}`, tlSayi(a2.baslangic), tlSayi(a2.gelen), tlSayi(a2.giden), tlSayi(a2.net), tlSayi(a2.bitis), a2.adet]));
      } else {
        await csvKaydet('nakit-akisi.csv', ['Tarih', 'Kaynak', 'Açıklama', 'Cari', 'Gelen', 'Giden', 'Bakiye', 'Durum'],
          tum.filter(uygun).map((s) => [tarihGoster(s.tarih), KAYNAK_ETIKET[s.kalem.kaynak], s.kalem.baslik, s.kalem.cariAd, s.yon > 0 ? tlSayi(s.tutar) : '', s.yon < 0 ? tlSayi(s.tutar) : '', tlSayi(s.bakiye), s.gerceklesen ? 'Gerçekleşti' : 'Bekliyor']));
      }
    }
  });
}
