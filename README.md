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
- **Sel & Taşkın Erken Uyarı Radarı (GloFAS):** Bulunulan koordinat için anlık yağış oranı ($mm/saat$), Avrupa Komisyonu GloFAS nehir debisi ($m^3/s$) ve 4 kademeli taşkın risk skorunu analiz eden erken uyarı paneli. 15 cm / 30 cm araç ve insan sürüklenme kuralı, gizli rögar kapakları ve kaçak elektrik tehlike direktiflerini içerir.
- **Afet Telsizi & Frekans Rehberi (TRAC & PMR 446):** Deprem veya sel sonrasında baz istasyonları ve internet çöktüğünde kullanılan PMR 446 lisanssız el telsizi kanalları (Kanal 1 Genel Çağrı, Kanal 8 Arama Kurtarma) ve TRAC 145.500 MHz VHF / 433.500 MHz UHF afet frekansları. Hayati alt ton kapatma (CTCSS: 0) kuralı ve Web Audio telsiz bip / 1750 Hz röle ton testleri.
- **Afet Düdüğü & Akustik Enkaz Sinyali (Geofon & K9 Arama Köpeği):** 2.9 kHz beton delici afet düdüğünün yanı sıra; AFAD ve INSARAG kurtarma ekiplerinin sismik dinleme mikrofonları için optimize edilmiş **3.5 kHz Geofon Sonar Darbesi** (her 15 saniyede 3 darbe ve titreşim yayarak cihaz şarjını saatlerce korur) ve insan kulağını yormayan **18.5 kHz K9 Arama Köpeği Çağrısı**.
- **Afet Triyaj Asistanı (START Protokolü):** Enkaz başındaki vatandaşlar ve sahra ekipleri için uluslararası START (Simple Triage and Rapid Treatment) karar ağacı. 15 saniyede solunum, nabız ve bilinç kontrolleriyle Kırmızı (Acil Turnike/Hava Yolu), Sarı (Gecikebilir), Yeşil (Ayakta) ve Siyah kodlarını belirler; anlık ilk yardım talimatları üretir ve tek tıkla BitChat acil enkaz kanalına aktarır.
- **BitChat Dağıtık P2P Afet Ağı:** Merkezi sunucu, üyelik veya telefon numarası gerektirmeyen; açık Nostr röleleri (`wss://relay.damus.io`, `wss://nos.lol`), WebRTC DataChannel (telefondan telefona doğrudan veri aktarımı), hava boşluğu QR durum paketi ve acil durumda tüm verileri kalıcı silen Sıfırlama (Emergency Wipe) özellikli kriz haberleşme ağı.
- **Hava Kalitesi, Yangın ve Zehirli Duman Radarı (Open-Meteo):** Bulunulan koordinat için anlık Avrupa Hava Kalitesi İndeksi (AQI), PM2.5 ince toz, PM10 kaba toz ve Karbonmonoksit (CO) seviyeleri. Enkaz yıkıntılarından kalkan asbest liflerine karşı N95/FFP2 maske uyarısı ve kapalı alanda çalıştırılan jeneratörlerin sebep olduğu zehirlenmelere karşı erken ikaz.
- **Tsunami Erken Uyarı & Kıyı Tahliye Radarı:** Marmara, Ege ve Akdeniz kıyılarında deniz tabanı depremleri sonrası oluşabilecek tsunami dalgalarına karşı Kandilli/ODTÜ bilimsel protokolü. Kıyıdan en az 500 metre iç kesimlere veya +15 metre yüksekliğe tırmanma yönlendirmesi, deniz çekilmesi hayati kaçış sinyali ve en yakın yüksek toplanma alanına anında rota.
- **Türk Kızılay Kan Bağış Merkezleri & Donör Eşleşme Portalı:** 22 doğrulanmış Kızılay Bölge Kan Merkezi, 8 kan grubu için interaktif donör-alıcı uyumluluk matrisi (0- evrensel verici, AB+ evrensel alıcı), bağış uygunluk kontrolü ve BitChat kriz ağı üzerinden doğrulanmış acil kan talebi oluşturma.
- **Bina Risk Ön Bilgilendirmesi & Diri Fay Mesafesi:** Kullanıcının bulunduğu noktadan en yakın MTA diri fay hattına olan kuş uçuşu mesafesi, fayın adı, kayma hızı ve bina risk özeti.

---

## Veri Kaynakları

afet.live üzerinde sunulan veriler resmi ve doğrulanmış açık veri kaynaklarından derlenmektedir:

- **Toplanma Alanları:** AFAD (Afet ve Acil Durum Yönetimi Başkanlığı) ve e-Devlet açık verileri (81 il, 27.000+ toplanma sahası).
- **Diri Fay Hatları:** MTA (Maden Tetkik ve Arama Genel Müdürlüğü) Türkiye Diri Fay Haritası veritabanı.
- **Son Depremler:** Kandilli Rasathanesi ve AFAD sismoloji ağları.
- **Hastaneler:** T.C. Sağlık Bakanlığı doğrulanmış acil servis envanteri (HealthTurkiye).
- **Kan Bağış Merkezleri:** Türk Kızılay Bölge Kan Merkezleri envanteri.
- **Nöbetçi Eczaneler:** İzmir Büyükşehir Belediyesi Açık Veri Portalı ve EczaneBul API (günlük dinamik nöbetçi listeleri).
- **Sel & Nehir Debisi:** Open-Meteo & GloFAS (Global Flood Awareness System - Avrupa Komisyonu / ECMWF).
- **Afet Telsiz Standartları:** TRAC (Türkiye Radyo Amatörleri Cemiyeti) ve BTK PMR 446 telsiz haberleşme protokolleri.
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
