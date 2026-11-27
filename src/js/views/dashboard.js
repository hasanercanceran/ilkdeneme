import { state, referansTarih } from '../store.js';
import { esc, tl, tarihGoster, topla, bugun, addDays, gunFarki, AYLAR } from '../util.js';
import { kalemler, nakitSatirlari, aylikOzet, KAYNAK_ETIKET } from '../derive.js';
import { sayfaBasligi, kartHtml, ikon } from '../ui.js';
import { odemeDialog } from '../actions.js';
import { nav } from '../nav.js';

const GORUNUM = { cek: 'cek', borc: 'borc', kira: 'kira', hareket: 'hareket' };

export function mount(el) {
  const tum = kalemler();
  const bekleyen = tum.filter((k) => k.kalan > 0.005);
  const alacak = bekleyen.filter((k) => k.yon > 0);
  const borc = bekleyen.filter((k) => k.yon < 0);
  const b = bugun();
  const gecikenAlacak = alacak.filter((k) => k.vade < b);
  const gecikenBorc = borc.filter((k) => k.vade < b);
  const ref = referansTarih();
  const ufuk = addDays(ref, 30);
  const yaklasan = bekleyen.filter((k) => k.vade >= ref && k.vade <= ufuk).sort((x, y) => x.vade.localeCompare(y.vade));
  const geciken = bekleyen.filter((k) => k.vade < b).sort((x, y) => x.vade.localeCompare(y.vade));
  const portfoy = state.cekSenetler.filter((c) => c.yon === 'alacak' && (c.durum === 'bekliyor' || c.durum === 'tahsilde'));
  const bitenKira = state.kiralar
    .map((k) => {
      const [y, m, d] = k.baslangic.split('-').map(Number);
      const t = new Date(y, m - 1 + k.sureAy, d - 1);
      const bitis = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
      return { k, bitis, gun: gunFarki(b, bitis) };
    })
    .filter((x) => x.gun >= 0 && x.gun <= 90)
    .sort((x, y) => x.gun - y.gun);

  const net = topla(alacak, (k) => k.kalan) - topla(borc, (k) => k.kalan);
  const satirlar = nakitSatirlari(tum);
  const aylar = aylikOzet(satirlar, state.ayarlar.yil);
  const bos = !state.cekSenetler.length && !state.borclar.length && !state.kiralar.length && !state.hareketler.length;

  const liste = (dizi, bosMetin) => dizi.length
    ? `<div class="mini-tablo">${dizi.slice(0, 8).map((k) => `<div class="mini-satir" data-git="${GORUNUM[k.kaynak]}">
        <div class="mini-tarih"><strong>${tarihGoster(k.vade)}</strong><small class="${k.vade < b ? 'kirmizi' : 'soluk'}">${k.vade < b ? `${gunFarki(k.vade, b)} gün gecikti` : gunFarki(b, k.vade) <= 0 ? 'Bugün' : `${gunFarki(b, k.vade)} gün sonra`}</small></div>
        <div class="mini-aciklama"><strong>${esc(k.baslik)}</strong><small class="soluk">${esc(k.cariAd || KAYNAK_ETIKET[k.kaynak])}${k.detay ? ' · ' + esc(k.detay) : ''}</small></div>
        <div class="mini-tutar ${k.yon > 0 ? 'yesil' : 'kirmizi'}">${k.yon > 0 ? '+' : '−'}${tl(k.kalan)}</div>
        <button class="ikon-btn ikon-ok" data-ode="${k.key}" title="${k.yon > 0 ? 'Tahsil et' : 'Öde'}">${ikon('tamam')}</button></div>`).join('')}${dizi.length > 8 ? `<div class="mini-devam" data-git="akis">+${dizi.length - 8} kayıt daha — Nakit Akışı'nda görüntüle</div>` : ''}</div>`
    : `<div class="bos-ince">${bosMetin}</div>`;

  el.innerHTML = `
    ${sayfaBasligi(state.ayarlar.firma ? `${state.ayarlar.firma}` : 'Gösterge Paneli', `${state.ayarlar.yil} dönemi finansal durum özeti`, '')}
    ${bos ? `<div class="karsilama"><h2>Hoş geldiniz</h2><p>Başlamak için soldaki menüden çek/senet, borç veya kira sözleşmesi ekleyin. Üstteki <strong>+ Yeni</strong> düğmesi hızlı kayıt içindir. Programı denemek için <strong>Ayarlar → Örnek Veri Yükle</strong> kullanabilirsiniz.</p></div>` : ''}
    <div class="kpi-izgara kpi-6">
      ${kartHtml('Toplam Alacak', tl(topla(alacak, (k) => k.kalan)), `${alacak.length} kalem · tahsil edilecek`, 'ok')}
      ${kartHtml('Toplam Borç', tl(topla(borc, (k) => k.kalan)), `${borc.length} kalem · ödenecek`, 'bad')}
      ${kartHtml('Net Pozisyon', tl(net), net >= 0 ? 'Alacaklar borçları karşılıyor' : 'Borçlar alacaklardan fazla', net < 0 ? 'uyari' : '')}
      ${kartHtml('Geciken Alacak', tl(topla(gecikenAlacak, (k) => k.kalan)), `${gecikenAlacak.length} kalem`, gecikenAlacak.length ? 'uyari' : '')}
      ${kartHtml('Geciken Ödeme', tl(topla(gecikenBorc, (k) => k.kalan)), `${gecikenBorc.length} kalem`, gecikenBorc.length ? 'uyari' : '')}
      ${kartHtml('Çek/Senet Portföyü', tl(topla(portfoy, (c) => c.tutar)), `${portfoy.length} evrak`)}
    </div>
    <div class="iki-kolon">
      <section class="panel"><h2>Önümüzdeki 30 Gün <small>${tarihGoster(ref)} – ${tarihGoster(ufuk)}</small></h2>${liste(yaklasan, 'Bu dönemde vadesi gelen kayıt yok.')}</section>
      <section class="panel"><h2>Vadesi Geçmiş Kalemler</h2>${liste(geciken, 'Vadesi geçmiş kayıt yok.')}</section>
    </div>
    <section class="panel"><h2>${state.ayarlar.yil} Aylık Nakit Özeti <a class="baglanti" data-git="akis">Ayrıntılı nakit akışı ${ikon('git', 14)}</a></h2>
      <div class="tablo-kap"><table class="tablo"><thead><tr><th>Ay</th><th class="sag">Gelen</th><th class="sag">Giden</th><th class="sag">Net</th><th class="sag">Dönem Sonu Bakiye</th></tr></thead><tbody>
      ${aylar.map((a) => `<tr><td><strong>${AYLAR[a.ay - 1]}</strong></td><td class="sag yesil">${a.gelen ? tl(a.gelen) : '—'}</td><td class="sag kirmizi">${a.giden ? tl(a.giden) : '—'}</td><td class="sag ${a.net < 0 ? 'kirmizi' : ''}">${a.adet ? tl(a.net) : '—'}</td><td class="sag"><strong class="${a.bitis < 0 ? 'kirmizi' : ''}">${tl(a.bitis)}</strong></td></tr>`).join('')}
      </tbody></table></div></section>
    <div class="iki-kolon">
      <section class="panel"><h2>Biten Kira Sözleşmeleri <small>90 gün içinde</small></h2>${bitenKira.length ? `<div class="mini-tablo">${bitenKira.map((x) => `<div class="mini-satir" data-git="kira"><div class="mini-tarih"><strong>${tarihGoster(x.bitis)}</strong><small class="turuncu">${x.gun} gün kaldı</small></div><div class="mini-aciklama"><strong>${esc(x.k.tasinmaz)}</strong><small class="soluk">${x.k.yon === 'gelir' ? 'Kira geliri' : 'Kira gideri'}</small></div><div class="mini-tutar">${tl(x.k.aylikTutar)}</div></div>`).join('')}</div>` : '<div class="bos-ince">Yakında sona erecek sözleşme yok.</div>'}</section>
      <section class="panel"><h2>Son İşlemler</h2>${state.gunluk.length ? `<div class="mini-tablo">${state.gunluk.slice(0, 7).map((g) => `<div class="mini-satir"><div class="mini-tarih"><strong>${tarihGoster(g.t.slice(0, 10))}</strong><small class="soluk">${new Date(g.t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small></div><div class="mini-aciklama">${esc(g.m)}</div></div>`).join('')}</div>` : '<div class="bos-ince">Henüz işlem yok.</div>'}</section>
    </div>`;
  el.addEventListener('click', (e) => {
    const ode = e.target.closest('[data-ode]');
    if (ode) return odemeDialog(ode.dataset.ode);
    const git = e.target.closest('[data-git]');
    if (git) nav.git(git.dataset.git);
  });
}
