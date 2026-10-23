# Katkıda Bulunma Rehberi (Contributing Guide)

Türkiye 3D Afet ve Toplanma Atlası, açık kaynaklı ve kamu yararını gözeten bir sivil teknoloji girişimidir. Toplanma alanlarının doğruluğu, yeni veri setlerinin eklenmesi ve performans iyileştirmeleri konusundaki katkılarınızı memnuniyetle kabul ediyoruz.

## Geliştirme Ortamı Kurulumu

1. Projeyi çatallayın (Fork) ve yerel makinenize klonlayın:
   ```bash
   git clone https://github.com/himmetaga/turkiye-afet-haritasi.git
   cd turkiye-afet-haritasi
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Statik afet toplanma verilerini üretin:
   ```bash
   npm run fetch:data
   ```

4. Yerel geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Veri Doğrulama ve Ekleme Standartları

- Toplanma alanları koordinatları `[Boylam (lng), Enlem (lat)]` GeoJSON standardına uygun olmalıdır.
- Yeni bir il veya ilçe eklerken resmi AFAD ve belediye açık veri portallarından teyit edilmiş toplanma alanlarını baz alınız.
- `scripts/fetch-civic-data.mjs` dosyasına ekleme yaparken alan adı, il/ilçe, tahmini kapasite ve temel altyapı olanaklarını (su, elektrik, çadır sahası) eksiksiz giriniz.

## Kod Standartları

- Sıfır sunucu maliyetli ve çevrimdışı öncelikli (Offline-First PWA) mimari korunmalıdır.
- Harita render performansını düşürecek ağır kütüphanelerden kaçınınız.
- PR göndermeden önce `npm run build` komutunun hatasız geçtiğinden emin olunuz.

---

# Contributing Guide (EN)

Thank you for your interest in contributing to Turkiye 3D Disaster & Assembly Atlas. This project is dedicated to public emergency preparedness and civic resilient GIS infrastructure.

1. Fork the repo and clone locally.
2. Run `npm install` and `npm run fetch:data`.
3. Start the dev server with `npm run dev`.
4. Ensure your PR passes `npm run build` with zero errors.
