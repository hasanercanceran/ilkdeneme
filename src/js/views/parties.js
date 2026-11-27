import { state, degistir } from '../store.js';
import { esc, tl, tarihGoster, topla, tlSayi } from '../util.js';
import { cariBakiyeleri, kalemler, durumEtiketi, KAYNAK_ETIKET } from '../derive.js';
import { rozet, tabloHtml, sirala, sirayiDegistir, islemButonlari, sayfaBasligi, kartHtml, modalAc, bildir, onayla, csvKaydet, pdfKaydet, ikon } from '../ui.js';
import { cariFormuAc, CARI_TURLERI } from '../actions.js';

const f = { arama: '', sira: { k: 'unvan', y: 1 } };
const turAdi = (t) => CARI_TURLERI.find((x) => x.d === t)?.e || t;

const kolonlar = [
  { k: 'unvan', b: 'Cari Ünvanı', s: (r) => r.cari.unvan, v: (r) => `<strong>${esc(r.cari.unvan)}</strong>${r.cari.vergiNo ? `<small class="soluk blok">${esc(r.cari.vergiNo)}</small>` : ''}` },
  { k: 'tur', b: 'Tür', s: (r) => r.cari.tur, v: (r) => rozet(turAdi(r.cari.tur), 'mute') },
  { k: 'iletisim', b: 'İletişim', v: (r) => `${esc(r.cari.telefon) || ''}${r.cari.eposta ? `<small class="soluk blok">${esc(r.cari.eposta)}</small>` : ''}` || '—' },
  { k: 'alacak', b: 'Bekleyen Alacak', h: 'sag', s: (r) => r.alacak, v: (r) => `<span class="yesil">${tl(r.alacak)}</span>` },
  { k: 'borc', b: 'Bekleyen Borç', h: 'sag', s: (r) => r.borc, v: (r) => `<span class="kirmizi">${tl(r.borc)}</span>` },
  { k: 'net', b: 'Net Bakiye', h: 'sag', s: (r) => r.net, v: (r) => `<strong class="${r.net > 0.005 ? 'yesil' : r.net < -0.005 ? 'kirmizi' : ''}">${tl(r.net)}</strong>` },
  {
    k: 'islem', b: '', w: '120px', h: 'sag',
    v: (r) => islemButonlari([
      { act: 'ekstre', id: r.cari.id, ikon: 'git', baslik: 'Hesap ekstresi' },
      { act: 'duzenle', id: r.cari.id, ikon: 'duzenle', baslik: 'Düzenle' },
      { act: 'sil', id: r.cari.id, ikon: 'sil', baslik: 'Sil', sinif: 'ikon-tehlike' },
    ]),
  },
];

function liste() {
  const a = f.arama.toLowerCase();
  return cariBakiyeleri().filter((r) => !a || `${r.cari.unvan} ${r.cari.vergiNo} ${r.cari.telefon} ${r.cari.eposta}`.toLowerCase().includes(a));
}

export function mount(el) {
  const hepsi = cariBakiyeleri();
  el.innerHTML = `
    ${sayfaBasligi('Cari Hesaplar', 'Müşteri, tedarikçi, kiracı ve kurum kartları; her cari için bekleyen alacak/borç bakiyesi ve hesap ekstresi.', `<button class="btn btn-ikincil" data-act="csv">${ikon('indir')} Excel (CSV)</button><button class="btn btn-birincil" data-act="yeni">${ikon('ekle')} Yeni Cari</button>`)}
    <div class="kpi-izgara">
      ${kartHtml('Cari Sayısı', String(hepsi.length))}
      ${kartHtml('Toplam Bekleyen Alacak', tl(topla(hepsi, (r) => r.alacak)), '', 'ok')}
      ${kartHtml('Toplam Bekleyen Borç', tl(topla(hepsi, (r) => r.borc)), '', 'bad')}
    </div>
    <div class="arac-cubugu"><div class="arama-kutu">${ikon('ara')}<input type="search" data-f="arama" placeholder="Ünvan, vergi no, telefon ara…" value="${esc(f.arama)}"></div></div>
    <div data-alan></div>`;
  const boya = () => {
    const satirlar = sirala(liste(), kolonlar, f.sira);
    el.querySelector('[data-alan]').innerHTML = tabloHtml(kolonlar, satirlar, {
      sira: f.sira,
      bos: hepsi.length ? 'Aramaya uyan cari yok.' : 'Henüz cari hesap yok. Çek, borç veya kira eklerken de cari oluşturabilirsiniz.',
      satirOzellik: (r) => `data-id="${r.cari.id}"`,
    });
  };
  boya();
  el.addEventListener('input', (e) => {
    if (e.target.dataset.f === 'arama') {
      f.arama = e.target.value;
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
    if (!b && satir) return ekstre(satir.dataset.id);
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'yeni') cariFormuAc(null);
    else if (b.dataset.act === 'duzenle') cariFormuAc(state.cariler.find((c) => c.id === id));
    else if (b.dataset.act === 'ekstre') ekstre(id);
    else if (b.dataset.act === 'sil') {
      const c = state.cariler.find((x) => x.id === id);
      const baglanti = kalemler().filter((k) => k.cariId === id).length + state.cekSenetler.filter((x) => x.cariId === id).length;
      if (baglanti > 0) return bildir(`“${c.unvan}” carisine bağlı ${baglanti} kayıt var; önce o kayıtları silin veya başka cariye taşıyın.`, 'hata');
      if (await onayla(`“${c.unvan}” cari hesabı silinecek. Emin misiniz?`, { baslik: 'Cariyi Sil', evet: 'Sil', tehlike: true })) {
        degistir((s) => (s.cariler = s.cariler.filter((x) => x.id !== id)), `Cari silindi: ${c.unvan}`);
        bildir('Cari silindi.', 'bilgi');
      }
    } else if (b.dataset.act === 'csv') {
      await csvKaydet('cari-bakiyeleri.csv', ['Ünvan', 'Tür', 'Vergi No', 'Telefon', 'E-posta', 'Bekleyen Alacak', 'Bekleyen Borç', 'Net'],
        sirala(liste(), kolonlar, f.sira).map((r) => [r.cari.unvan, turAdi(r.cari.tur), r.cari.vergiNo, r.cari.telefon, r.cari.eposta, tlSayi(r.alacak), tlSayi(r.borc), tlSayi(r.net)]));
    }
  });
}

export function ekstre(id) {
  const c = state.cariler.find((x) => x.id === id);
  if (!c) return;
  const k = kalemler().filter((x) => x.cariId === id).sort((a, b) => a.vade.localeCompare(b.vade));
  const alacak = topla(k.filter((x) => x.yon > 0), (x) => x.kalan);
  const borc = topla(k.filter((x) => x.yon < 0), (x) => x.kalan);
  const govde = `<div class="detay-ust"><div><div class="detay-baslik">${esc(c.unvan)}</div><div class="soluk">${esc(turAdi(c.tur))}${c.telefon ? ' · ' + esc(c.telefon) : ''}${c.eposta ? ' · ' + esc(c.eposta) : ''}</div></div>
    <div class="detay-ozet"><div><span>Bekleyen Alacak</span><strong class="yesil">${tl(alacak)}</strong></div><div><span>Bekleyen Borç</span><strong class="kirmizi">${tl(borc)}</strong></div><div><span>Net</span><strong>${tl(alacak - borc)}</strong></div></div></div>
    <div class="tablo-kap tablo-kap-kisa"><table class="tablo tablo-ic"><thead><tr><th>Vade</th><th>Kaynak</th><th>Açıklama</th><th class="sag">Tutar</th><th class="sag">Gerçekleşen</th><th class="sag">Kalan</th><th>Durum</th></tr></thead><tbody>
    ${k.length ? k.map((x) => `<tr><td>${tarihGoster(x.vade)}</td><td>${KAYNAK_ETIKET[x.kaynak]}</td><td>${esc(x.baslik)}${x.detay ? `<small class="soluk blok">${esc(x.detay)}</small>` : ''}</td><td class="sag ${x.yon > 0 ? 'yesil' : 'kirmizi'}">${x.yon > 0 ? '+' : '−'}${tl(x.tutar)}</td><td class="sag">${x.odenen > 0 ? tl(x.odenen) : '—'}</td><td class="sag">${tl(x.kalan)}</td><td>${rozet(durumEtiketi(x).metin, durumEtiketi(x).ton)}</td></tr>`).join('') : '<tr><td colspan="7" class="bos-satir">Bu cariye ait kayıt yok.</td></tr>'}
    </tbody></table></div>`;
  modalAc({
    baslik: 'Cari Hesap Ekstresi',
    genis: true,
    govde,
    butonlar: [
      { etiket: 'Excel (CSV)', tikla: async () => { await csvKaydet(`ekstre-${c.unvan}.csv`, ['Vade', 'Kaynak', 'Açıklama', 'Yön', 'Tutar', 'Gerçekleşen', 'Kalan'], k.map((x) => [tarihGoster(x.vade), KAYNAK_ETIKET[x.kaynak], x.baslik, x.yon > 0 ? 'Alacak' : 'Borç', tlSayi(x.tutar), tlSayi(x.odenen), tlSayi(x.kalan)])); return false; } },
      { etiket: 'PDF Kaydet', tikla: async () => { document.body.classList.add('modal-yazdir'); await pdfKaydet(`ekstre-${c.unvan}.pdf`); document.body.classList.remove('modal-yazdir'); return false; } },
      { etiket: 'Kapat', sinif: 'btn-birincil' },
    ],
  });
}
