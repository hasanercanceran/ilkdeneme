# ilkdeneme

Bu, GitHub'ı öğrenmek için oluşturduğum ilk deneme reposu. 🚀

Burada şunları öğreniyorum:

- **Repository**: Projemin dosyalarının tutulduğu klasör (işte bu repo!)
- **Commit**: Yaptığım her değişikliğe düşülen not
- **Branch**: Ana dosyayı bozmadan deneme yapabileceğim ayrı bir kopya
- **Pull Request**: Bir denemeyi ana hale eklemek için verdiğim teklif

Adım adım ilerliyorum ve her şeyi anlıyorum. 💪

Zaman zaman halledebiliriz.

## 2027 Finans Takip Uygulaması

Çek/senet tahsilatlarını, borçları ve genel gelir/gider kayıtlarını takip edip
2027 için aylık nakit akışını görmeye yarayan, tek sayfalık basit bir web uygulaması.

**Çalıştırma:**

```bash
python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresini aç. Ya da `index.html`
dosyasını doğrudan tarayıcıda çift tıklayarak da açabilirsin.

**Özellikler:**

- **Özet**: toplam gelecek/gidecek para, net durum, bu ay vadesi gelenler, geciken kayıtlar
- **Çek/Senet**: tahsil edilecek çek/senetlerin listesi (bekliyor / tahsil edildi / karşılıksız)
- **Borçlar**: ödenecek borçların listesi (bekliyor / ödendi)
- **Diğer Gelir/Gider**: çek/senet ve borç dışındaki gelir-gider kayıtları
- **Nakit Akışı**: tüm hareketlerin aylara göre gruplanmış hâli, aylık ve kümülatif bakiye

Veriler tarayıcının `localStorage`'ında saklanır (hiçbir sunucuya gönderilmez).
Üstteki "Yedek Al" ile verileri JSON olarak indirip "Yedek Yükle" ile geri
yükleyebilirsin — tarayıcı verisini silersen diye.
