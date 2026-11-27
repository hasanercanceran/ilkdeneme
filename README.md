# ilkdeneme

Bu, GitHub'ı öğrenmek için oluşturduğum ilk deneme reposu. 🚀

Burada şunları öğreniyorum:

- **Repository**: Projemin dosyalarının tutulduğu klasör (işte bu repo!)
- **Commit**: Yaptığım her değişikliğe düşülen not
- **Branch**: Ana dosyayı bozmadan deneme yapabileceğim ayrı bir kopya
- **Pull Request**: Bir denemeyi ana hale eklemek için verdiğim teklif

Adım adım ilerliyorum ve her şeyi anlıyorum. 💪

Zaman zaman halledebiliriz.

## Finans Takip (masaüstü programı)

Çek/senet, borç, kira sözleşmesi, gelir/gider ve cari hesapları tek yerde tutan,
nakit akışını (gelecek/gidecek para) tarih sırasıyla ve yürüyen bakiyeyle gösteren
Windows masaüstü programı. Tarayıcı gerekmez; veriler bilgisayarda bir dosyada saklanır.

**Modüller**

- **Gösterge Paneli**: toplam alacak/borç, net pozisyon, geciken kalemler, önümüzdeki 30 gün, aylık özet
- **Nakit Akışı**: tüm hareketler tek ekranda, filtre/arama, aylık özet tablosu, tek tıkla tahsil/ödeme
- **Çek / Senet**: alınan ve verilen evraklar; portföyde, tahsile verildi, tahsil edildi, ciro, karşılıksız durumları
- **Borçlar**: borç kartı, her taksit için ayrı vade tarihi, kısmi ödeme
- **Kira Sözleşmeleri**: başlangıç, süre, ödeme günü, yıllık artış; aylık plan otomatik üretilir
- **Gelir / Gider**: tekrarlayan kayıtlar için seri oluşturma
- **Cari Hesaplar**: bakiye ve hesap ekstresi
- **Raporlar**: vade listesi, çek/senet portföyü, cari bakiye, aylık nakit; yazdır / PDF / Excel (CSV)

**Veri**

`Belgelerim/Finans Takip/finans-takip-veri.json` dosyasında tutulur. Her gün ilk
değişiklikte `otomatik-yedekler` klasörüne kopya alınır (son 60 gün saklanır).
Yedek Al / Yedekten Geri Yükle Ayarlar sayfasındadır.

**Kurulum (Windows)**

Derlenmiş zip dosyasını ayıklayıp `Kur.bat` dosyasını çalıştırmak yeterlidir.

**Geliştirme**

Node.js gerekir.

```bash
npm install
npm start
```

**Windows paketi üretme**

```bash
npm run derle:windows
```

Çıktı `dist/` klasörüne yazılır. `derle:mac` ve `derle:linux` komutları da vardır.

**Proje yapısı**

- `masaustu/`: Electron ana süreç (pencere, dosya diyalogları, PDF, yedekleme)
- `src/`: arayüz (HTML, CSS, JavaScript modülleri)
- `build/`: simge ve derleme adımı
