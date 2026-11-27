import { uid, seriUret, addMonths } from './util.js';
import { kiraPlaniUret } from './views/rents.js';

export function ornekVeri() {
  const cari = (unvan, tur, ekstra = {}) => ({ id: uid(), unvan, tur, telefon: '', eposta: '', vergiNo: '', not: '', ...ekstra });
  const abc = cari('ABC İnşaat Ltd. Şti.', 'musteri', { telefon: '0212 555 01 01', vergiNo: '1234567890' });
  const yildiz = cari('Yıldız Tekstil A.Ş.', 'musteri', { telefon: '0216 555 02 02' });
  const demir = cari('Demir Çelik San. A.Ş.', 'tedarikci', { telefon: '0262 555 03 03' });
  const ahmet = cari('Ahmet Yılmaz', 'kiraci', { telefon: '0532 555 04 04' });
  const mehmet = cari('Mehmet Kaya (Ev Sahibi)', 'kiraci');
  const banka = cari('Ziraat Bankası', 'banka');
  const kurum = cari('Vergi Dairesi / SGK', 'banka');
  const cekler = [];
  const cek = (tur, yon, no, banka_, c, vade, tutar, durum = 'bekliyor', durumTarihi = '') => cekler.push({ id: uid(), tur, yon, no, banka: banka_, cariId: c.id, tutar, duzenlemeTarihi: addMonths(vade, -3), vade, durum, durumTarihi, not: '' });
  cek('cek', 'alacak', '4410231', 'Garanti BBVA', abc, '2026-11-12', 85000);
  cek('cek', 'alacak', '4410232', 'Garanti BBVA', abc, '2027-01-15', 85000);
  cek('cek', 'alacak', '4410233', 'Garanti BBVA', abc, '2027-02-15', 85000);
  cek('cek', 'alacak', '4410234', 'Garanti BBVA', abc, '2027-03-15', 85000, 'tahsilde');
  cek('senet', 'alacak', 'S-2027-01', '', yildiz, '2027-02-28', 120000);
  cek('cek', 'alacak', '7782001', 'İş Bankası', yildiz, '2027-04-30', 64500);
  cek('cek', 'alacak', '7782002', 'İş Bankası', yildiz, '2027-05-31', 64500);
  cek('cek', 'alacak', '1100551', 'Akbank', abc, '2026-10-20', 40000, 'tamam', '2026-10-21');
  cek('cek', 'borc', '9020001', 'Yapı Kredi', demir, '2027-01-25', 150000);
  cek('cek', 'borc', '9020002', 'Yapı Kredi', demir, '2027-03-25', 150000);
  cek('senet', 'borc', 'S-D-07', '', demir, '2027-06-10', 95000);
  const borc = (c, baslik, tur, adet, ilk, tutar, odenenAdet = 0) => ({
    id: uid(), cariId: c.id, baslik, tur, not: '',
    plan: seriUret({ adet, ilkVade: ilk, aralikAy: 1, tutar, toplamMi: false }).map((p, i) => ({ id: uid(), vade: p.vade, tutar: p.tutar, aciklama: `${i + 1}/${adet}. taksit`, odenen: i < odenenAdet ? p.tutar : 0, odemeTarihi: i < odenenAdet ? p.vade : '' })),
  });
  const kiraGelir = { id: uid(), yon: 'gelir', cariId: ahmet.id, tasinmaz: 'Kadıköy 3+1 Daire', baslangic: '2027-01-01', sureAy: 12, odemeGunu: 5, aylikTutar: 22500, artisOrani: 0, depozito: 45000, not: 'Yıllık sözleşme' };
  kiraGelir.plan = kiraPlaniUret(kiraGelir);
  const kiraGider = { id: uid(), yon: 'gider', cariId: mehmet.id, tasinmaz: 'Merkez Ofis', baslangic: '2027-01-01', sureAy: 24, odemeGunu: 1, aylikTutar: 38000, artisOrani: 30, depozito: 76000, not: '2. yıl %30 artış' };
  kiraGider.plan = kiraPlaniUret(kiraGider);
  const hareket = (yon, kategori, aciklama, tutar, vade, c = null) => ({ id: uid(), yon, kategori, cariId: c?.id || '', aciklama, tutar, vade, odenen: 0, odemeTarihi: '' });
  const hareketler = [
    ...seriUret({ adet: 12, ilkVade: '2027-01-30', aralikAy: 1, tutar: 62000, toplamMi: false }).map((p) => hareket('gider', 'Maaş / Ücret', 'Personel maaşları', p.tutar, p.vade)),
    ...seriUret({ adet: 12, ilkVade: '2027-01-26', aralikAy: 1, tutar: 11800, toplamMi: false }).map((p) => hareket('gider', 'Vergi', 'KDV / Muhtasar ödemesi', p.tutar, p.vade, kurum)),
    ...seriUret({ adet: 12, ilkVade: '2027-01-15', aralikAy: 1, tutar: 4200, toplamMi: false }).map((p) => hareket('gider', 'Fatura', 'Elektrik, su, internet', p.tutar, p.vade)),
    ...seriUret({ adet: 12, ilkVade: '2027-01-10', aralikAy: 1, tutar: 235000, toplamMi: false }).map((p) => hareket('gelir', 'Satış', 'Aylık hizmet geliri', p.tutar, p.vade)),
  ];
  return {
    surum: 2,
    ayarlar: { firma: 'Örnek Firma', yil: 2027, acilisBakiyesi: 150000 },
    cariler: [abc, yildiz, demir, ahmet, mehmet, banka, kurum],
    cekSenetler: cekler,
    borclar: [
      borc(banka, 'İhtiyaç Kredisi', 'Banka Kredisi', 24, '2026-09-15', 18750, 2),
      borc(demir, 'Hammadde Borcu', 'Cari Borç', 4, '2027-01-20', 55000),
      borc(banka, 'Kredi Kartı Taksitleri', 'Kredi Kartı', 6, '2027-02-05', 8400),
    ],
    kiralar: [kiraGelir, kiraGider],
    hareketler,
    gunluk: [{ t: new Date().toISOString(), m: 'Örnek veriler yüklendi' }],
  };
}
