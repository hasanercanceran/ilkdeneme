import { state } from '../store.js';
import { esc, tl, tlSayi, tarihGoster, topla, AYLAR, bugun } from '../util.js';
import { kalemler, nakitSatirlari, aylikOzet, cariBakiyeleri, CEK_DURUM, cariAdi, KAYNAK_ETIKET } from '../derive.js';
import { sayfaBasligi, csvKaydet, pdfKaydet, ikon } from '../ui.js';
import { nav } from '../nav.js';

const f = { rapor: 'vade', bas: '', bit: '', yon: '' };

const RAPORLAR = {
  vade: 'Vade Listesi (bekleyen kalemler)',
  portfoy: 'Çek / Senet Portföy Raporu',
  cari: 'Cari Bakiye Özeti',
  aylik: 'Aylık Nakit Akışı Özeti',
};

function uret() {
  const yil = state.ayarlar.yil;
  const bas = f.bas || `${yil}-01-01`;
  const bit = f.bit || `${yil}-12-31`;
  if (f.rapor === 'vade') {
    const k = kalemler().filter((x) => x.kalan > 0.005 && x.vade >= bas && x.vade <= bit && (!f.yon || String(x.yon) === f.yon)).sort((a, b) => a.vade.localeCompare(b.vade));
    return {
      baslik: RAPORLAR.vade, alt: `${tarihGoster(bas)} – ${tarihGoster(bit)}`,
      kolonlar: [{ b: 'Vade' }, { b: 'Kaynak' }, { b: 'Açıklama' }, { b: 'Cari' }, { b: 'Gelecek', h: 'sag' }, { b: 'Gidecek', h: 'sag' }],
      satirlar: k.map((x) => [tarihGoster(x.vade), KAYNAK_ETIKET[x.kaynak], x.baslik + (x.detay ? ` (${x.detay})` : ''), x.cariAd, x.yon > 0 ? tl(x.kalan) : '', x.yon < 0 ? tl(x.kalan) : '']),
      toplam: ['', '', `Toplam (${k.length} kalem)`, '', tl(topla(k.filter((x) => x.yon > 0), (x) => x.kalan)), tl(topla(k.filter((x) => x.yon < 0), (x) => x.kalan))],
      csv: k.map((x) => [tarihGoster(x.vade), KAYNAK_ETIKET[x.kaynak], x.baslik, x.cariAd, x.yon > 0 ? tlSayi(x.kalan) : '', x.yon < 0 ? tlSayi(x.kalan) : '']),
    };
  }
  if (f.rapor === 'portfoy') {
    const c = state.cekSenetler.filter((x) => (!f.yon || x.yon === (f.yon === '1' ? 'alacak' : 'borc')) && x.vade >= bas && x.vade <= bit).sort((a, b) => a.vade.localeCompare(b.vade));
    return {
      baslik: RAPORLAR.portfoy, alt: `${tarihGoster(bas)} – ${tarihGoster(bit)}`,
      kolonlar: [{ b: 'Vade' }, { b: 'Evrak' }, { b: 'Yön' }, { b: 'Banka' }, { b: 'Cari' }, { b: 'Durum' }, { b: 'Tutar', h: 'sag' }],
      satirlar: c.map((x) => [tarihGoster(x.vade), `${x.tur === 'cek' ? 'Çek' : 'Senet'} ${x.no}`, x.yon === 'alacak' ? 'Alacak' : 'Borç', x.banka, cariAdi(x.cariId), CEK_DURUM[x.yon][x.durum], tl(x.tutar)]),
      toplam: ['', '', '', '', '', `Toplam (${c.length} evrak)`, tl(topla(c, (x) => x.tutar))],
      csv: c.map((x) => [tarihGoster(x.vade), x.tur, x.no, x.yon, x.banka, cariAdi(x.cariId), CEK_DURUM[x.yon][x.durum], tlSayi(x.tutar)]),
    };
  }
  if (f.rapor === 'cari') {
    const r = cariBakiyeleri().sort((a, b) => b.net - a.net);
    return {
      baslik: RAPORLAR.cari, alt: `Düzenlenme: ${tarihGoster(bugun())}`,
      kolonlar: [{ b: 'Cari' }, { b: 'Alacak', h: 'sag' }, { b: 'Borç', h: 'sag' }, { b: 'Net Bakiye', h: 'sag' }],
      satirlar: r.map((x) => [x.cari.unvan, tl(x.alacak), tl(x.borc), tl(x.net)]),
      toplam: ['Toplam', tl(topla(r, (x) => x.alacak)), tl(topla(r, (x) => x.borc)), tl(topla(r, (x) => x.net))],
      csv: r.map((x) => [x.cari.unvan, tlSayi(x.alacak), tlSayi(x.borc), tlSayi(x.net)]),
    };
  }
  const aylar = aylikOzet(nakitSatirlari(kalemler()), yil);
  return {
    baslik: RAPORLAR.aylik, alt: `${yil} yılı · Açılış bakiyesi ${tl(state.ayarlar.acilisBakiyesi || 0)}`,
    kolonlar: [{ b: 'Ay' }, { b: 'Dönem Başı', h: 'sag' }, { b: 'Gelen', h: 'sag' }, { b: 'Giden', h: 'sag' }, { b: 'Net', h: 'sag' }, { b: 'Dönem Sonu', h: 'sag' }],
    satirlar: aylar.map((a) => [AYLAR[a.ay - 1], tl(a.baslangic), tl(a.gelen), tl(a.giden), tl(a.net), tl(a.bitis)]),
    toplam: [`${yil} Toplam`, tl(aylar[0].baslangic), tl(topla(aylar, (a) => a.gelen)), tl(topla(aylar, (a) => a.giden)), tl(topla(aylar, (a) => a.net)), tl(aylar[11].bitis)],
    csv: aylar.map((a) => [AYLAR[a.ay - 1], tlSayi(a.baslangic), tlSayi(a.gelen), tlSayi(a.giden), tlSayi(a.net), tlSayi(a.bitis)]),
  };
}

export function mount(el) {
  el.innerHTML = `
    ${sayfaBasligi('Raporlar', 'Yazdırılabilir raporlar; PDF veya Excel (CSV) olarak kaydedebilirsiniz.', `<button class="btn btn-ikincil" data-act="csv">${ikon('indir')} Excel (CSV)</button><button class="btn btn-ikincil" data-act="pdf">PDF Kaydet</button><button class="btn btn-birincil" data-act="yazdir">${ikon('yazdir')} Yazdır</button>`)}
    <div class="arac-cubugu">
      <select data-f="rapor">${Object.entries(RAPORLAR).map(([d, e]) => `<option value="${d}" ${f.rapor === d ? 'selected' : ''}>${e}</option>`).join('')}</select>
      <label class="mini">Tarih <input type="date" data-f="bas" value="${f.bas}"> – <input type="date" data-f="bit" value="${f.bit}"></label>
      <select data-f="yon"><option value="">Tüm yönler</option><option value="1" ${f.yon === '1' ? 'selected' : ''}>Yalnız gelecek / alacak</option><option value="-1" ${f.yon === '-1' ? 'selected' : ''}>Yalnız gidecek / borç</option></select>
    </div>
    <div data-alan></div>`;
  const boya = () => {
    const r = uret();
    el.querySelector('[data-alan]').innerHTML = `<div id="rapor-alani" class="rapor">
      <div class="rapor-ust"><div><h2>${esc(r.baslik)}</h2><p>${esc(r.alt)}</p></div><div class="rapor-firma">${esc(state.ayarlar.firma || 'Finans Takip')}<small>Oluşturma: ${tarihGoster(bugun())}</small></div></div>
      <table class="tablo"><thead><tr>${r.kolonlar.map((k) => `<th class="${k.h || ''}">${esc(k.b)}</th>`).join('')}</tr></thead><tbody>
      ${r.satirlar.length ? r.satirlar.map((s) => `<tr>${s.map((h, i) => `<td class="${r.kolonlar[i].h || ''}">${esc(h)}</td>`).join('')}</tr>`).join('') : `<tr><td class="bos-satir" colspan="${r.kolonlar.length}">Seçilen kriterlere uyan kayıt yok.</td></tr>`}
      </tbody><tfoot><tr>${r.toplam.map((h, i) => `<td class="${r.kolonlar[i].h || ''}"><strong>${esc(h)}</strong></td>`).join('')}</tr></tfoot></table></div>`;
  };
  boya();
  el.addEventListener('input', (e) => {
    const k = e.target.dataset.f;
    if (!k || k === 'rapor') return;
    f[k] = e.target.value;
    boya();
  });
  el.addEventListener('change', (e) => {
    if (e.target.dataset.f !== 'rapor') return;
    f.rapor = e.target.value;
    f.yon = '';
    nav.yenile();
  });
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'yazdir') window.print();
    else if (b.dataset.act === 'pdf') await pdfKaydet(`${RAPORLAR[f.rapor].split(' (')[0].toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-')}.pdf`);
    else if (b.dataset.act === 'csv') {
      const r = uret();
      await csvKaydet('rapor.csv', r.kolonlar.map((k) => k.b), r.csv);
    }
  });
}
