import { state, degistir, verileriDegistir, bosVeri, kayitBilgisi } from '../store.js';
import { esc, tarihGoster } from '../util.js';
import { sayfaBasligi, formHtml, formOku, bildir, onayla, ikon } from '../ui.js';
import { formBagla } from '../actions.js';
import { ornekVeri } from '../sample.js';

export function mount(el, bilgi) {
  const alanlar = [
    { ad: 'firma', etiket: 'Firma / Kişi Adı', genislik: 'tam', yer: 'Raporlarda ve başlıkta görünür' },
    { ad: 'yil', etiket: 'Dönem Yılı', tip: 'sayi', min: 2000, max: 2100, zorunlu: true },
    { ad: 'acilisBakiyesi', etiket: 'Açılış Bakiyesi (Kasa + Banka)', tip: 'para', sifirGoster: true, ipucu: 'Nakit akışındaki yürüyen bakiyenin başlangıç değeridir. Eksi bakiye için − işaretini kullanın.' },
  ];
  const bos = !state.cariler.length && !state.cekSenetler.length && !state.borclar.length && !state.kiralar.length && !state.hareketler.length;
  const kb = kayitBilgisi();
  el.innerHTML = `
    ${sayfaBasligi('Ayarlar', 'Dönem bilgileri, yedekleme ve veri yönetimi.')}
    <div class="iki-kolon">
      <section class="panel"><h2>Genel Ayarlar</h2><div data-genel>${formHtml(alanlar, state.ayarlar)}</div><div class="panel-alt"><button class="btn btn-birincil" data-act="kaydet">Ayarları Kaydet</button></div></section>
      <section class="panel"><h2>Veri ve Yedekleme</h2>
        <dl class="bilgi-listesi"><dt>Veri dosyası</dt><dd class="yol">${esc(bilgi.yol)}</dd><dt>Son kayıt</dt><dd>${kb.hata ? `<span class="kirmizi">Hata: ${esc(kb.hata)}</span>` : kb.zaman ? kb.zaman.toLocaleTimeString('tr-TR') : 'Bu oturumda henüz değişiklik yok'}</dd><dt>Otomatik yedek</dt><dd>Her gün ilk değişiklikte, son 60 gün saklanır</dd></dl>
        <div class="buton-grubu">
          <button class="btn btn-ikincil" data-act="klasor">${ikon('klasor')} Veri Klasörünü Aç</button>
          <button class="btn btn-ikincil" data-act="yedek-al">${ikon('indir')} Yedek Al (JSON)</button>
          <button class="btn btn-ikincil" data-act="yedek-yukle">Yedekten Geri Yükle</button>
        </div>
      </section>
    </div>
    <section class="panel"><h2>Veri İşlemleri</h2>
      <div class="buton-grubu">
        ${bos ? `<button class="btn btn-ikincil" data-act="ornek">Örnek Veri Yükle (denemek için)</button>` : ''}
        <button class="btn btn-tehlike-hafif" data-act="temizle">Tüm Verileri Sil</button>
      </div>
      <p class="dipnot">“Tüm Verileri Sil” geri alınamaz; önce yedek almanız önerilir. Otomatik yedekler veri klasöründeki <em>otomatik-yedekler</em> dizininde kalır.</p>
    </section>`;
  formBagla(el);
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'kaydet') {
      const { deger, gecerli } = formOku(el.querySelector('[data-genel]'), alanlar);
      if (!gecerli) return;
      degistir((s) => Object.assign(s.ayarlar, { firma: deger.firma, yil: deger.yil, acilisBakiyesi: deger.acilisBakiyesi }), 'Ayarlar güncellendi');
      bildir('Ayarlar kaydedildi.');
    } else if (a === 'klasor') window.finans.klasorAc();
    else if (a === 'yedek-al') {
      const yol = await window.finans.dosyaKaydet({ ad: `finans-takip-yedek-${new Date().toISOString().slice(0, 10)}.json`, icerik: JSON.stringify(state, null, 2), filtreAd: 'Yedek (JSON)', uzanti: 'json' });
      if (yol) bildir('Yedek kaydedildi: ' + yol);
    } else if (a === 'yedek-yukle') {
      const icerik = await window.finans.dosyaAc();
      if (!icerik) return;
      let veri;
      try {
        veri = JSON.parse(icerik);
        if (!Array.isArray(veri.cekSenetler) || !Array.isArray(veri.borclar) || !Array.isArray(veri.cariler)) throw new Error('biçim');
      } catch (err) {
        return bildir('Seçilen dosya geçerli bir Finans Takip yedeği değil.', 'hata');
      }
      if (await onayla('Mevcut tüm veriler yedek dosyasındaki verilerle değiştirilecek. Devam edilsin mi?', { baslik: 'Yedekten Geri Yükle', evet: 'Geri Yükle', tehlike: true })) {
        degistir((s) => {
          verileriDegistir(veri);
          return s;
        }, 'Yedekten geri yüklendi');
        bildir('Yedek geri yüklendi.');
      }
    } else if (a === 'ornek') {
      degistir(() => verileriDegistir(ornekVeri()));
      bildir('Örnek veriler yüklendi.');
    } else if (a === 'temizle') {
      if (await onayla('Tüm cariler, çek/senetler, borçlar, kiralar ve hareketler kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?', { baslik: 'Tüm Verileri Sil', evet: 'Her Şeyi Sil', tehlike: true })) {
        const ayar = { ...state.ayarlar };
        degistir(() => verileriDegistir({ ...bosVeri(), ayarlar: ayar }));
        bildir('Tüm veriler silindi.', 'bilgi');
      }
    }
  });
}
