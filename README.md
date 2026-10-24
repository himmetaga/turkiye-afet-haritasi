# afet.live — Türkiye Afet ve Toplanma Haritası

afet.live, Türkiye'de olası bir deprem anında ve sonrasında vatandaşların en yakın toplanma alanlarına, acil hastanelere ve nöbetçi eczanelere en hızlı şekilde ulaşabilmesi için geliştirilmiş açık kaynaklı bir web uygulamasıdır.

İnternet bağlantısının zayıfladığı veya tamamen koptuğu acil durumlarda da kesintisiz hizmet verebilmesi için çevrimdışı (offline-first) mimariyle geliştirilmiştir.

🌐 **Canlı Site:** [afet.live](https://afet.live)

---

## Öne Çıkan Özellikler

- **En Yakın Güvenlik Noktaları:** Bulunduğunuz konuma en yakın AFAD toplanma alanlarını, 7/24 acil hastaneleri ve nöbetçi eczaneleri mesafe ve pusula yönüyle listeler.
- **Canlı ve Günlük Nöbetçi Eczaneler:** Nöbetçi eczaneler her gün düzenli olarak güncellenir; tarih bilgisi, açık adres ve telefon numaralarıyla birlikte sunulur.
- **Çevrimdışı Çalışma (PWA):** Uygulamayı telefonunuzun ana ekranına eklediğinizde, internet erişimi olmasa dahi harita, kayıtlı toplanma alanları ve acil durum araçları kullanılabilir.
- **Afet Düdüğü & Kamera LED Flaşı:** Enkaz altında veya acil yardım çağrısında dikkat çekmek için tasarlanmış, ekran kilitlense bile arka planda çalmaya devam eden 2.9 kHz akustik düdük ve arama köpekleri ile termal kameralar için senkronize donanım kamera flaşı / ekran strobosu.
- **Kilit Ekranı Tıbbi Kimlik & Duvar Kağıdı (ICE):** Enkaz altında veya baygınlık durumunda telefon şifresi bilinmese bile arama kurtarma ve sağlık ekiplerinin kan grubunuzu, alerjilerinizi, acil temas kişilerinizi ve en yakın AFAD toplanma alanınızı görmesini sağlayan kilit ekranı duvar kağıdı oluşturucu.
- **Afet & İlk Yardım Hayatta Kalma Rehberi:** İnternet tamamen kesildiğinde bile çalışan; evde çök-kapan-tutun, enkaz altında 3 vuruş dinleme kodu (çakmak yakmama kuralı), sel/yangın tahliyesi ve ezilme (crush) sendromu kuralı (kazazedeye kontrolsüz su vermeme) içeren acil müdahale rehberi.
- **Acil Durum SMS & İhbar Hatları:** Hücresel veri çöktüğünde 2G baz istasyonu sinyal kuyruğundan iletilebilen hassas GPS koordinatlı tek tuş acil durum SMS'i ve 112 / 122 AFAD / 187 Doğalgaz / 186 Elektrik hızlı arama paneli.
- **Canlı Deprem Takibi:** Kandilli Rasathanesi ve AFAD verileriyle son depremler harita üzerinde derinlik ve büyüklük bilgileriyle gösterilir.
- **Deprem Tatbikatı & Dalga Simülasyonu:** Olası deprem senaryolarında P ve S dalgalarının yayılımını ve tahmini varış süresini gösteren eğitim modu.
- **Apartman Bilgilendirme Afişi:** Bina yöneticileri ve komşuların bina girişine veya asansör yanına asabileceği, çevre toplanma alanlarını ve acil numaraları içeren A4 afiş çıktısı (Yazdır / PNG indir).
- **Aile Afet Buluşma Kartı:** Aile bireyleriyle paylaşılabilecek (WhatsApp / Instagram Hikaye uyumlu) özet buluşma planı görseli.
- **Kalibre Edilebilir Cihaz Sismografı (STA/LTA):** Akıllı telefon ivmeölçerini kullanarak mikrosarsıntıları analiz eden, ayarlanabilir hassasiyet eşiği (Hassas / Normal / Yüksek), gerçek zamanlı ivme ($m/s^2$ ve Gal), Mercalli şiddet skalası ve ekran açık tutma (WakeLock) özellikli sismik sensör paneli.
- **Toplanma Alanı "Buradayım" Güvenli Bildirimi (Check-in):** Haritada veya listede seçilen toplanma alanına ulaştığınızda, tam konum ve koordinatlarınızı içeren "Güvendeyim" mesajını tek tıkla SMS veya WhatsApp üzerinden yakınlarınıza iletme.
- **72 Saatlik Afet Çantası & Eksik Paylaşımı:** Çevrimdışı kaydedilen aile hazırlık kontrol listesi, filtreleme (Tümü / Eksikler / Hazır) ve eksik malzemeleri yakınlarınıza mesaj olarak gönderebilme desteği.
- **Bina Risk Ön Bilgilendirmesi:** Bina yapım yılı, kat sayısı ve diri fay hattına olan mesafeye göre genel durum özeti.

---

## Veri Kaynakları

afet.live üzerinde sunulan veriler resmi ve doğrulanmış açık veri kaynaklarından derlenmektedir:

- **Toplanma Alanları:** AFAD (Afet ve Acil Durum Yönetimi Başkanlığı) ve e-Devlet açık verileri (81 il, 27.000+ toplanma sahası).
- **Diri Fay Hatları:** MTA (Maden Tetkik ve Arama Genel Müdürlüğü) Türkiye Diri Fay Haritası veritabanı.
- **Son Depremler:** Kandilli Rasathanesi ve AFAD sismoloji ağları.
- **Hastaneler:** T.C. Sağlık Bakanlığı doğrulanmış acil servis envanteri.
- **Nöbetçi Eczaneler:** İzmir Büyükşehir Belediyesi Açık Veri Portalı ve EczaneBul API (günlük dinamik nöbetçi listeleri).
- **Harita Katmanları:** OpenStreetMap ve OpenFreeMap vektör tabanları.

---

## Kurulum ve Yerel Çalıştırma

Projeyi kendi bilgisayarınızda yerel olarak çalıştırmak için:

```bash
# Repoyu klonlayın
git clone https://github.com/himmetaga/turkiye-afet-haritasi.git
cd turkiye-afet-haritasi

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Geliştirme sunucusu varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.

### Üretim Derlemesi

```bash
npm run build
npm run preview
```

---

## Teknoloji Altyapısı

- **Arayüz:** TypeScript, Vanilla JavaScript, Tailwind CSS
- **Harita Motoru:** MapLibre GL JS, OpenFreeMap, 3B bina ekstrüzyonları
- **PWA & Önbellekleme:** Vite PWA, Workbox (Service Worker ile tam çevrimdışı destek)
- **Teknik SEO:** Schema.org (SpecialAnnouncement, FAQPage, EmergencyService), 81 il indeks dizini ve XML sitemap
- **Dağıtım:** Cloudflare Pages & Cloudflare Edge Functions (`/api/duty-pharmacies`)

---

## Katkıda Bulunma

afet.live tamamen açık kaynaklı ve kamu yararına yürütülen bir projedir. Hata bildirimleri, yeni özellik önerileri ve katkılar memnuniyetle karşılanır:

1. Bu repoyu fork'layın.
2. Yeni bir dal açın: `git checkout -b ozellik/yeni-ozellik`
3. Değişikliklerinizi yapın ve commit'leyin: `git commit -m 'feat: yeni özellik eklendi'`
4. Dalınızı push'layın: `git push origin ozellik/yeni-ozellik`
5. Bir Pull Request açın.

---

## Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır. Veriler ilgili kamu kurumlarına ve açık veri sağlayıcılarına aittir.
