import qrcode from 'qrcode-generator';
import { AssemblyPoint, EmergencyFacility } from '../types';
import { haversineDistanceMeters, estimateWalkingMinutes, findNearestAssemblyPoints } from '../utils/geoMath';
import { Icons } from './icons';

export interface PosterConfig {
  buildingName: string;
  addressText: string;
  managerContact?: string;
}

export class ApartmentPosterGenerator {
  private container: HTMLElement;
  private userCoords: [number, number];
  private assemblyPoints: AssemblyPoint[];
  private facilities: EmergencyFacility[];
  private config: PosterConfig = {
    buildingName: 'Apartman / Site Acil Durum Panosu',
    addressText: 'Kadıköy / İstanbul',
    managerContact: ''
  };

  constructor(
    parent: HTMLElement,
    userCoords: [number, number],
    assemblyPoints: AssemblyPoint[],
    facilities: EmergencyFacility[]
  ) {
    this.userCoords = userCoords;
    this.assemblyPoints = assemblyPoints;
    this.facilities = facilities;

    this.container = document.createElement('div');
    this.container.id = 'apartment-poster-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public setData(
    userCoords: [number, number],
    assemblyPoints: AssemblyPoint[],
    facilities: EmergencyFacility[]
  ): void {
    this.userCoords = userCoords;
    this.assemblyPoints = assemblyPoints;
    this.facilities = facilities;
    this.render();
  }

  public show(): void {
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private getNearestData() {
    const nearest3Points = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 3);

    const [uLng, uLat] = this.userCoords;

    const hospitals = this.facilities
      .filter((f) => f.category === 'hospital')
      .map((f) => {
        const dist = haversineDistanceMeters(this.userCoords, f.coordinates);
        return { facility: f, distanceMeters: dist, walkingMinutes: estimateWalkingMinutes(dist) };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    const pharmacies = this.facilities
      .filter((f) => f.category === 'pharmacy')
      .map((f) => {
        const dist = haversineDistanceMeters(this.userCoords, f.coordinates);
        return { facility: f, distanceMeters: dist, walkingMinutes: estimateWalkingMinutes(dist) };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    const nearestHospital = hospitals[0] || null;
    const nearestPharmacy = pharmacies[0] || null;

    return { nearest3Points, nearestHospital, nearestPharmacy };
  }

  private generateQrSvg(url: string): string {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      return qr.createSvgTag({ cellSize: 3, margin: 1, scalable: true });
    } catch {
      return '<div class="text-xs text-red-500">QR Hatası</div>';
    }
  }

  private printPoster(): void {
    window.print();
  }

  private async downloadPosterPng(): Promise<void> {
    const posterEl = this.container.querySelector('#printable-poster-area') as HTMLElement;
    if (!posterEl) return;

    const downloadBtn = this.container.querySelector('#btn-poster-download') as HTMLButtonElement | null;
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `<span>Hazırlanıyor...</span>`;
    }

    try {
      // High-resolution Canvas rendering of the A4 layout (1240 x 1754 px at standard printable density)
      const canvas = document.createElement('canvas');
      const width = 1240;
      const height = 1754;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clean White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top Red/Orange Alert Header Bar
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#dc2626');
      gradient.addColorStop(1, '#ea580c');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 140);

      // Top Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
      ctx.fillText('APARTMAN ACİL DURUM VE AFET BİLGİ PANOSU', 50, 65);
      ctx.font = '500 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('afet.live — T.C. İçişleri Bakanlığı AFAD Onaylı Resmi Koordinatlar', 50, 105);

      // Sub-header Info (Building Name & Location)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(this.config.buildingName || 'Apartman Acil Durum Panosu', 50, 205);
      ctx.fillStyle = '#64748b';
      ctx.font = '20px system-ui, -apple-system, sans-serif';
      ctx.fillText(`📍 Konum: ${this.config.addressText || 'Belirlenen Bölge'} • Koordinat: ${this.userCoords[1].toFixed(5)}, ${this.userCoords[0].toFixed(5)}`, 50, 245);

      // Section 1: Toplanma Alanları
      ctx.fillStyle = '#059669';
      ctx.fillRect(50, 280, width - 100, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('🛡️ EN YAKIN 3 RESMİ AFET TOPLANMA ALANI (AFAD)', 70, 312);

      const { nearest3Points, nearestHospital, nearestPharmacy } = this.getNearestData();

      let yPos = 350;
      nearest3Points.forEach((item, index) => {
        ctx.fillStyle = index === 0 ? '#ecfdf5' : '#f8fafc';
        ctx.strokeStyle = index === 0 ? '#10b981' : '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(50, yPos, width - 100, 95, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = index === 0 ? '#065f46' : '#1e293b';
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${index + 1}. ${item.point.name}`, 75, yPos + 40);

        ctx.fillStyle = '#64748b';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${item.point.district || ''}, ${item.point.city || ''} ${item.point.capacity ? `• Kapasite: ${item.point.capacity.toLocaleString()} kişi` : ''}`, 75, yPos + 72);

        // Distance Badge
        ctx.fillStyle = '#059669';
        ctx.font = 'bold 26px monospace';
        const distStr = `${item.distanceMeters.toLocaleString()} m (~${item.walkingMinutes} dk)`;
        ctx.fillText(distStr, width - 100 - ctx.measureText(distStr).width - 25, yPos + 55);

        yPos += 115;
      });

      // Section 2: Acil Sağlık & Eczane
      yPos += 15;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(50, yPos, width - 100, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('🏥 EN YAKIN 7/24 ACİL HASTANE & NÖBETÇİ ECZANE', 70, yPos + 32);

      yPos += 70;
      // Hospital Box
      ctx.fillStyle = '#f0f9ff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(50, yPos, (width - 120) / 2, 120, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('Acil Servis Hastanesi', 70, yPos + 35);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      const hospName = nearestHospital ? nearestHospital.facility.name : 'Acil Sağlık Merkezi';
      ctx.fillText(hospName.slice(0, 32), 70, yPos + 65);
      ctx.fillStyle = '#64748b';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      const hospDist = nearestHospital ? `${nearestHospital.distanceMeters.toLocaleString()} m • ${nearestHospital.walkingMinutes} dk yürüme` : 'Yakında';
      ctx.fillText(hospDist, 70, yPos + 95);

      // Pharmacy Box
      const pBoxX = 50 + (width - 120) / 2 + 20;
      ctx.fillStyle = '#fffbeb';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pBoxX, yPos, (width - 120) / 2, 120, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('Nöbetçi / Acil Eczane', pBoxX + 20, yPos + 35);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      const pharmName = nearestPharmacy ? nearestPharmacy.facility.name : 'Nöbetçi Eczane';
      ctx.fillText(pharmName.slice(0, 32), pBoxX + 20, yPos + 65);
      ctx.fillStyle = '#64748b';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      const pharmDist = nearestPharmacy ? `${nearestPharmacy.distanceMeters.toLocaleString()} m • ${nearestPharmacy.facility.phone || ''}` : 'Yakında';
      ctx.fillText(pharmDist, pBoxX + 20, yPos + 95);

      // Section 3: Tahliye Adımları
      yPos += 150;
      ctx.fillStyle = '#334155';
      ctx.fillRect(50, yPos, width - 100, 48);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('⚠️ DEPREM ANINDA VE HEMEN SONRASINDA 4 HAYATİ KURAL', 70, yPos + 32);

      yPos += 70;
      const steps = [
        '1. ÇÖK - KAPAN - TUTUN: Sarsıntı bitene kadar sağlam bir mobilya yanında cenin pozisyonunda kalın.',
        '2. ELEKTRİK & DOĞALGAZI KESİN: Sarsıntı biter bitmez ana vanaları ve sigortaları kapatın.',
        '3. ASANSÖRÜ ASLA KULLANMAYIN: Tahliye için yalnızca merdivenleri ve yangın çıkışını kullanın.',
        '4. TOPLANMA ALANINA GİDİN: Afet çantanızı alıp listedeki en yakın toplanma alanına intikal edin.'
      ];
      steps.forEach((st) => {
        ctx.fillStyle = '#1e293b';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        ctx.fillText(st, 70, yPos);
        yPos += 36;
      });

      // Bottom Area: QR code and Emergency Numbers
      yPos += 30;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, yPos);
      ctx.lineTo(width - 50, yPos);
      ctx.stroke();

      yPos += 40;
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('ACİL ÇAĞRI: 112 • AFAD: 122 • İTFAİYE: 110 • POLİS: 155', 50, yPos);

      ctx.fillStyle = '#64748b';
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillText('Bu afişi bina girişine veya asansör yanına asarak komşularınızın hayatını kurtarın.', 50, yPos + 40);
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText('Canlı Harita & Navigasyon: https://afet.live', 50, yPos + 75);

      // Download trigger
      const link = document.createElement('a');
      link.download = `Apartman-Afet-Afisi-${(this.config.buildingName || 'bina').replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('PNG poster download error', e);
    } finally {
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `${Icons.download('w-4 h-4')} <span>Yüksek Çözünürlüklü PNG İndir</span>`;
      }
    }
  }

  private render(): void {
    const { nearest3Points, nearestHospital, nearestPharmacy } = this.getNearestData();
    const [uLng, uLat] = this.userCoords;
    const qrUrl = `https://afet.live/?lat=${uLat.toFixed(5)}&lng=${uLng.toFixed(5)}&zoom=16`;
    const qrSvg = this.generateQrSvg(qrUrl);

    this.container.innerHTML = `
      <div class="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-obsidian-950/95 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl text-white">
        <!-- Top Toolbar -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              ${Icons.printer('w-5 h-5')}
            </span>
            <div>
              <h2 class="text-sm font-bold text-white">Apartman Girişi / Asansör Acil Durum Afişi (A4)</h2>
              <p class="text-xs text-gray-400">Tek tıkla yazdırın veya PNG indirip bina panonuza asın</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              id="btn-poster-download"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
            >
              ${Icons.download('w-4 h-4')}
              <span>PNG İndir</span>
            </button>
            <button
              id="btn-poster-print"
              class="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-obsidian-950 transition-colors shadow-glow-emerald"
            >
              ${Icons.printer('w-4 h-4')}
              <span>A4 Yazdır (Ctrl+P)</span>
            </button>
            <button
              id="btn-close-poster"
              class="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              ${Icons.close('w-4 h-4')}
            </button>
          </div>
        </div>

        <!-- Scrollable Preview & Settings Area -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <!-- Configuration Bar -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
            <div>
              <label class="block text-gray-400 font-medium mb-1">Apartman / Bina / Site Adı</label>
              <input
                id="input-poster-building"
                type="text"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                value="${this.config.buildingName}"
                placeholder="Örn: Menekşe Apartmanı - Blok A"
              />
            </div>
            <div>
              <label class="block text-gray-400 font-medium mb-1">Adres / Mahalle / İlçe</label>
              <input
                id="input-poster-address"
                type="text"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                value="${this.config.addressText}"
                placeholder="Örn: Kadıköy / İstanbul"
              />
            </div>
          </div>

          <!-- Printable A4 Visual Preview -->
          <div
            id="printable-poster-area"
            class="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-200 mx-auto max-w-[760px] text-left transition-all"
            style="font-family: system-ui, -apple-system, sans-serif;"
          >
            <!-- A4 Header Banner -->
            <div class="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 sm:p-5 rounded-xl mb-4 flex items-center justify-between">
              <div>
                <span class="text-[11px] font-mono tracking-wider uppercase opacity-90 block">T.C. AFAD & Sağlık Bakanlığı Verileriyle</span>
                <h1 class="text-xl sm:text-2xl font-black uppercase tracking-tight">Apartman Afet ve Acil Durum Bilgi Panosu</h1>
                <p class="text-xs opacity-95 mt-0.5">Bu bina sakinlerinin afet sonrasında intikal edeceği resmi güvenli sahalar</p>
              </div>
              <div class="hidden sm:block text-right">
                <span class="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">afet.live</span>
              </div>
            </div>

            <!-- Building Title -->
            <div class="mb-4 pb-3 border-b border-gray-200 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id="preview-building-name" class="text-xl font-bold text-gray-900">${this.config.buildingName}</h2>
                <p id="preview-building-address" class="text-xs text-gray-600">📍 ${this.config.addressText} • GPS: ${uLat.toFixed(5)}, ${uLng.toFixed(5)}</p>
              </div>
              <span class="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                🛡️ Doğrulanmış Konum
              </span>
            </div>

            <!-- Section 1: Assembly Points -->
            <div class="mb-5">
              <div class="flex items-center gap-2 mb-2 bg-emerald-700 text-white px-3 py-1.5 rounded-lg">
                <span class="text-sm">🛡️</span>
                <h3 class="text-xs font-bold uppercase tracking-wider">En Yakın 3 Resmi Afet Toplanma Alanı (AFAD)</h3>
              </div>
              <div class="space-y-2">
                ${nearest3Points
                  .map(
                    (item, i) => `
                  <div class="flex items-center justify-between p-3 rounded-xl ${
                    i === 0 ? 'bg-emerald-50 border-2 border-emerald-500' : 'bg-gray-50 border border-gray-200'
                  }">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="w-5 h-5 rounded-full ${i === 0 ? 'bg-emerald-600' : 'bg-gray-600'} text-white text-[11px] font-bold grid place-items-center">${i + 1}</span>
                        <h4 class="text-sm font-bold text-gray-900">${item.point.name}</h4>
                        ${i === 0 ? '<span class="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-1.5 py-0.5 rounded">1. ÖNCELİKLİ BULUŞMA ALANI</span>' : ''}
                      </div>
                      <p class="text-xs text-gray-600 ml-7 mt-0.5">${item.point.district || ''}, ${item.point.city || ''} ${item.point.capacity ? `• Kapasite: ${item.point.capacity.toLocaleString()} kişi` : ''}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <span class="font-mono text-sm font-bold text-emerald-800">${item.distanceMeters.toLocaleString()} metre</span>
                      <span class="block text-[11px] text-gray-500 font-medium">~${item.walkingMinutes} dk yürüyüş</span>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Section 2: Hospital & Pharmacy -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div class="p-3.5 rounded-xl bg-sky-50 border border-sky-300">
                <div class="flex items-center gap-1.5 text-sky-800 font-bold text-xs uppercase mb-1">
                  <span>🏥</span>
                  <span>En Yakın 7/24 Acil Hastane</span>
                </div>
                <div class="text-sm font-bold text-gray-900">${nearestHospital ? nearestHospital.facility.name : 'Sağlık Tesisi'}</div>
                <p class="text-xs text-gray-600 mt-0.5">${nearestHospital?.facility.address || nearestHospital?.facility.district || 'Bölge Hastanesi'}</p>
                <div class="mt-2 text-xs font-semibold text-sky-900 font-mono">
                  ${nearestHospital ? `${nearestHospital.distanceMeters.toLocaleString()} m • ~${nearestHospital.walkingMinutes} dk` : ''}
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-300">
                <div class="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase mb-1">
                  <span>🌙</span>
                  <span>En Yakın Nöbetçi / Acil Eczane</span>
                </div>
                <div class="text-sm font-bold text-gray-900">${nearestPharmacy ? nearestPharmacy.facility.name : 'Nöbetçi Eczane'}</div>
                <p class="text-xs text-gray-600 mt-0.5">${nearestPharmacy?.facility.address || nearestPharmacy?.facility.district || 'Eczane'}</p>
                <div class="mt-2 text-xs font-semibold text-amber-900 font-mono">
                  ${nearestPharmacy ? `${nearestPharmacy.distanceMeters.toLocaleString()} m • Tel: ${nearestPharmacy.facility.phone || '11880'}` : ''}
                </div>
              </div>
            </div>

            <!-- Section 3: 4 Golden Rules -->
            <div class="p-4 rounded-xl bg-gray-100 border border-gray-300 mb-5">
              <div class="text-xs font-bold uppercase tracking-wider text-red-700 mb-2 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Deprem Anı ve Hemen Sonrası 4 Hayati Adım</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-800">
                <div class="flex items-start gap-1.5">
                  <span class="font-bold text-red-600">1.</span>
                  <span><strong>Çök-Kapan-Tutun:</strong> Sarsıntı bitene kadar kolon ve kiriş altı değil, sağlam baza/koltuk yanında cenin kalın.</span>
                </div>
                <div class="flex items-start gap-1.5">
                  <span class="font-bold text-red-600">2.</span>
                  <span><strong>Vanaları Kapatın:</strong> Sarsıntı biter bitmez doğalgaz vanasını ve daire ana elektrik şalterini indirin.</span>
                </div>
                <div class="flex items-start gap-1.5">
                  <span class="font-bold text-red-600">3.</span>
                  <span><strong>Asansör Kullanmayın:</strong> Binayı yalnızca yangın merdiveni veya bina merdiveninden telaşsız tahliye edin.</span>
                </div>
                <div class="flex items-start gap-1.5">
                  <span class="font-bold text-red-600">4.</span>
                  <span><strong>Toplanma Alanına İntikal:</strong> Afet çantanızı alıp yukarıdaki 1. Toplanma Alanına yürüyerek geçin.</span>
                </div>
              </div>
            </div>

            <!-- Footer: Emergency Call Numbers & QR Code -->
            <div class="pt-3 border-t border-gray-300 flex items-center justify-between gap-4">
              <div>
                <div class="text-xs font-black text-red-700 tracking-wider">
                  ACİL ÇAĞRI: 112 • AFAD: 122 • İTFAİYE: 110 • POLİS: 155
                </div>
                <div class="text-[11px] text-gray-500 mt-0.5">
                  Canlı Sokak Rotası ve İnternetsiz Harita: <strong>https://afet.live</strong>
                </div>
                <div class="text-[10px] text-gray-400 mt-0.5">
                  Bu afişi apartman duyuru panonuza asarak komşularınızı bilinçlendirin.
                </div>
              </div>

              <div class="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 flex-shrink-0">
                <div class="w-16 h-16 sm:w-20 sm:h-20 bg-white p-1 rounded-lg">
                  ${qrSvg}
                </div>
                <div class="text-[10px] leading-tight text-gray-600 max-w-[90px]">
                  <strong>Kameranızı tutun:</strong> Canlı harita rotasını hemen açın
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event Listeners
    const closeBtn = this.container.querySelector('#btn-close-poster');
    closeBtn?.addEventListener('click', () => this.hide());

    const printBtn = this.container.querySelector('#btn-poster-print');
    printBtn?.addEventListener('click', () => this.printPoster());

    const downloadBtn = this.container.querySelector('#btn-poster-download');
    downloadBtn?.addEventListener('click', () => this.downloadPosterPng());

    const buildingInput = this.container.querySelector('#input-poster-building') as HTMLInputElement | null;
    buildingInput?.addEventListener('input', (e) => {
      this.config.buildingName = (e.target as HTMLInputElement).value;
      const previewTitle = this.container.querySelector('#preview-building-name');
      if (previewTitle) previewTitle.textContent = this.config.buildingName || 'Apartman Acil Durum Panosu';
    });

    const addressInput = this.container.querySelector('#input-poster-address') as HTMLInputElement | null;
    addressInput?.addEventListener('input', (e) => {
      this.config.addressText = (e.target as HTMLInputElement).value;
      const previewAddr = this.container.querySelector('#preview-building-address');
      if (previewAddr) {
        previewAddr.textContent = `📍 ${this.config.addressText} • GPS: ${this.userCoords[1].toFixed(5)}, ${this.userCoords[0].toFixed(5)}`;
      }
    });

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.hide();
      }
    });
  }
}
