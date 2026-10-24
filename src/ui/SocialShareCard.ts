import qrcode from 'qrcode-generator';
import { AssemblyPoint, EmergencyFacility } from '../types';
import { haversineDistanceMeters, estimateWalkingMinutes, findNearestAssemblyPoints } from '../utils/geoMath';
import { Icons } from './icons';

export interface FamilyCardConfig {
  familyName: string;
  cityContact: string;
  primaryPointId?: string;
  secondaryPointId?: string;
}

export class SocialShareCard {
  private container: HTMLElement;
  private userCoords: [number, number];
  private assemblyPoints: AssemblyPoint[];
  private facilities: EmergencyFacility[];
  private config: FamilyCardConfig = {
    familyName: 'AİLEMİZ',
    cityContact: 'Şehir Dışı İrtibat: Yakın Akraba / 05xx xxx xx xx'
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
    this.container.id = 'social-share-card-modal';
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

  private getPointsData() {
    const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 4);
    const p1 = nearest[0]?.point || this.assemblyPoints[0] || null;
    const p2 = nearest[1]?.point || this.assemblyPoints[1] || null;

    const hospitals = this.facilities
      .filter((f) => f.category === 'hospital')
      .map((f) => {
        const dist = haversineDistanceMeters(this.userCoords, f.coordinates);
        return { facility: f, distanceMeters: dist, walkingMinutes: estimateWalkingMinutes(dist) };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    const nearestHospital = hospitals[0] || null;

    return {
      p1,
      p1Dist: p1 ? haversineDistanceMeters(this.userCoords, p1.coordinates) : 0,
      p2,
      p2Dist: p2 ? haversineDistanceMeters(this.userCoords, p2.coordinates) : 0,
      hospital: nearestHospital
    };
  }

  private async generateStoryCanvas(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const { p1, p1Dist, p2, p2Dist, hospital } = this.getPointsData();

    // 1. Ultra Dark Obsidian Background with subtle radial glow
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, width, height);

    // Subtle background mesh/glow
    const radGlow1 = ctx.createRadialGradient(200, 300, 10, 200, 300, 600);
    radGlow1.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    radGlow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGlow1;
    ctx.fillRect(0, 0, width, height);

    const radGlow2 = ctx.createRadialGradient(880, 1400, 10, 880, 1400, 700);
    radGlow2.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    radGlow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGlow2;
    ctx.fillRect(0, 0, width, height);

    // Decorative top neon line
    const topGrad = ctx.createLinearGradient(0, 0, width, 0);
    topGrad.addColorStop(0, '#10b981');
    topGrad.addColorStop(0.5, '#38bdf8');
    topGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, 14);

    // Brand Pill (Top Left)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(80, 90, 260, 64, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(116, 122, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('afet.live', 142, 133);

    // Date badge (Top Right)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 24px monospace';
    const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(dateStr, width - 80 - ctx.measureText(dateStr).width, 132);

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px system-ui, -apple-system, sans-serif';
    const famTitle = `${(this.config.familyName || 'AİLEMİZ').toUpperCase()} AFET BULUŞMA PLANI`;
    ctx.fillText(famTitle.slice(0, 26), 80, 245);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('Deprem sonrasında aile bireylerimizin toplanacağı resmi alanlar', 80, 300);

    // CARD 1: 1. Birincil Toplanma Alanı
    let y = 370;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(80, y, width - 160, 270, 28);
    ctx.fill();
    ctx.stroke();

    // Priority Tag
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(110, y + 36, 360, 48, 12);
    ctx.fill();
    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('⭐ 1. BİRİNCİL BULUŞMA NOKTASI', 125, y + 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
    const p1Name = p1 ? p1.name : 'Toplanma Alanı Bulunamadı';
    ctx.fillText(p1Name.slice(0, 28), 110, y + 145);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px system-ui, -apple-system, sans-serif';
    const p1Loc = p1 ? `📍 ${p1.district}, ${p1.city} • Kapasite: ${(p1.capacity || 2500).toLocaleString()} kişi` : '';
    ctx.fillText(p1Loc, 110, y + 195);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 36px monospace';
    const p1DistStr = `${p1Dist.toLocaleString()} metre (~${estimateWalkingMinutes(p1Dist)} dk)`;
    ctx.fillText(p1DistStr, 110, y + 245);

    // CARD 2: 2. Yedek Toplanma Alanı
    y += 310;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(80, y, width - 160, 250, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.roundRect(110, y + 32, 340, 44, 12);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('🔄 2. YEDEK BULUŞMA NOKTASI', 125, y + 62);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
    const p2Name = p2 ? p2.name : 'İkinci Toplanma Alanı';
    ctx.fillText(p2Name.slice(0, 30), 110, y + 135);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '26px system-ui, -apple-system, sans-serif';
    const p2Loc = p2 ? `📍 ${p2.district}, ${p2.city}` : '';
    ctx.fillText(p2Loc, 110, y + 180);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px monospace';
    const p2DistStr = `${p2Dist.toLocaleString()} metre (~${estimateWalkingMinutes(p2Dist)} dk)`;
    ctx.fillText(p2DistStr, 110, y + 225);

    // CARD 3: En Yakın 7/24 Acil Hastane
    y += 290;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, y, width - 160, 210, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('🏥 EN YAKIN 7/24 ACİL SERVİS HASTANESİ', 110, y + 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    const hospName = hospital ? hospital.facility.name : 'Bölge Acil Sağlık Merkezi';
    ctx.fillText(hospName.slice(0, 32), 110, y + 110);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '26px system-ui, -apple-system, sans-serif';
    const hospDist = hospital ? `${hospital.distanceMeters.toLocaleString()} m • Acil Servis Aktif` : 'Yakında';
    ctx.fillText(hospDist, 110, y + 158);

    // CARD 4: Şehir Dışı İrtibat & Acil Numaralar
    y += 250;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, y, width - 160, 240, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('📞 ŞEHİR DIŞI İRTİBAT KİŞİSİ (AFET PROTOKOLÜ)', 110, y + 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(this.config.cityContact.slice(0, 40), 110, y + 110);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('ACİL ÇAĞRI: 112  •  AFAD: 122  •  POLİS: 155', 110, y + 165);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    ctx.fillText('Afet anında hatlar kilitlenirse SMS veya WhatsApp tercih edin.', 110, y + 205);

    // Bottom Action Area: QR code & Call to Action
    y += 280;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.roundRect(80, y, width - 160, 280, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Generate QR image on canvas
    const qrUrl = `https://afet.live/?lat=${this.userCoords[1].toFixed(5)}&lng=${this.userCoords[0].toFixed(5)}&zoom=16`;
    const qr = qrcode(0, 'M');
    qr.addData(qrUrl);
    qr.make();
    const qrModules = qr.getModuleCount();
    const qrSize = 200;
    const qrStartX = 120;
    const qrStartY = y + 40;
    const modSize = qrSize / qrModules;

    // QR White Box
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrStartX - 10, qrStartY - 10, qrSize + 20, qrSize + 20, 16);
    ctx.fill();

    ctx.fillStyle = '#090a0f';
    for (let r = 0; r < qrModules; r++) {
      for (let c = 0; c < qrModules; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(qrStartX + c * modSize, qrStartY + r * modSize, modSize + 0.5, modSize + 0.5);
        }
      }
    }

    // Callout text next to QR
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText('Kameranızı QR Koda Tutun', 370, y + 95);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('afet.live üzerinde canlı rotayı açın', 370, y + 145);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillText('Aileniz ve sevdiklerinizle bu kartı paylaşın,', 370, y + 195);
    ctx.fillText('afet anında nerede buluşacağınızı önceden kararlaştırın.', 370, y + 230);

    return canvas;
  }

  private async handleShare(): Promise<void> {
    const shareBtn = this.container.querySelector('#btn-card-share') as HTMLButtonElement | null;
    if (shareBtn) {
      shareBtn.disabled = true;
      shareBtn.innerHTML = `<span>Görsel Üretiliyor...</span>`;
    }

    try {
      const canvas = await this.generateStoryCanvas();

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `afet-live-aile-plani-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${this.config.familyName || 'Ailemiz'} İçin Afet Buluşma Planı — afet.live`,
              text: 'Deprem ve afet anında nerede buluşacağımızı kararlaştırdık. Siz de ailenizin buluşma kartını oluşturun: https://afet.live'
            });
            return;
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.warn('Native share failed, falling back to download', err);
            }
          }
        }

        // Fallback: Download file
        const link = document.createElement('a');
        link.download = `Aile-Afet-Bulusma-Plani.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }, 'image/png');
    } catch (e) {
      console.error('Share card error', e);
    } finally {
      if (shareBtn) {
        shareBtn.disabled = false;
        shareBtn.innerHTML = `${Icons.share('w-4 h-4')} <span>WhatsApp & Instagram'da Paylaş</span>`;
      }
    }
  }

  private async handleDownload(): Promise<void> {
    const canvas = await this.generateStoryCanvas();
    const link = document.createElement('a');
    link.download = `Aile-Afet-Bulusma-Plani.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  private render(): void {
    const { p1, p1Dist, p2, p2Dist, hospital } = this.getPointsData();

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-obsidian-950/95 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl text-white">
        <!-- Top Toolbar -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-sky-500/15 text-sky-400">
              ${Icons.users('w-5 h-5')}
            </span>
            <div>
              <h2 class="text-sm font-bold text-white">Ailem İçin Afet Buluşma Kartı (Story 9:16)</h2>
              <p class="text-xs text-gray-400">WhatsApp Aile Grubu veya Instagram Hikaye için 1080x1920 dikey kart</p>
            </div>
          </div>
          <button
            id="btn-close-family-card"
            class="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Scrollable Inputs & Preview -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <!-- Configuration -->
          <div class="space-y-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
            <div>
              <label class="block text-gray-400 font-medium mb-1">Aile Soyadı / Başlık</label>
              <input
                id="input-card-family-name"
                type="text"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-sky-400 font-semibold"
                value="${this.config.familyName}"
                placeholder="Örn: YILMAZ AİLESİ"
              />
            </div>
            <div>
              <label class="block text-gray-400 font-medium mb-1">Şehir Dışı İrtibat Kişisi & Telefon</label>
              <input
                id="input-card-contact"
                type="text"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-sky-400"
                value="${this.config.cityContact}"
                placeholder="Örn: Ankara - Teyze Ayşe: 0532 xxx xx xx"
              />
            </div>
          </div>

          <!-- Mini Live Preview of the 9:16 Story Card -->
          <div class="relative w-full max-w-[320px] aspect-[9/16] mx-auto rounded-2xl overflow-hidden border border-white/15 shadow-2xl p-4 flex flex-col justify-between bg-[#090a0f] text-left">
            <div>
              <div class="flex items-center justify-between text-[11px] font-semibold text-emerald-400 mb-2">
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>afet.live</span>
                </span>
                <span class="text-gray-400 font-mono text-[10px]">9:16 STORY</span>
              </div>
              <h3 id="preview-family-title" class="text-base font-black text-white leading-tight uppercase mb-1">
                ${this.config.familyName} AFET BULUŞMA PLANI
              </h3>
              <p class="text-[10px] text-gray-400 mb-3">Deprem anında aile bireylerimizin buluşacağı güvenli noktalar</p>

              <!-- Point 1 -->
              <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-2">
                <span class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">⭐ 1. BİRİNCİL TOPLANMA ALANI</span>
                <div class="text-xs font-bold text-white truncate mt-0.5">${p1 ? p1.name : 'Toplanma Alanı'}</div>
                <div class="text-[10px] text-emerald-300 font-mono font-semibold">${p1Dist.toLocaleString()} m (~${estimateWalkingMinutes(p1Dist)} dk)</div>
              </div>

              <!-- Point 2 -->
              <div class="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 mb-2">
                <span class="text-[9px] font-bold text-sky-400 uppercase tracking-wider block">🔄 2. YEDEK TOPLANMA ALANI</span>
                <div class="text-xs font-bold text-white truncate mt-0.5">${p2 ? p2.name : 'Yedek Alan'}</div>
                <div class="text-[10px] text-sky-300 font-mono font-semibold">${p2Dist.toLocaleString()} m (~${estimateWalkingMinutes(p2Dist)} dk)</div>
              </div>

              <!-- Hospital -->
              <div class="p-2 rounded-xl bg-white/5 border border-white/10 text-[10px]">
                <span class="text-rose-400 font-bold">🏥 7/24 Acil Hastane:</span>
                <span class="text-gray-200 block truncate">${hospital ? hospital.facility.name : 'Bölge Acil Hastanesi'}</span>
              </div>
            </div>

            <div class="pt-2 border-t border-white/10 text-[9px] text-gray-400 flex items-center justify-between">
              <span>ACİL: 112 • AFAD: 122</span>
              <span class="text-emerald-400 font-bold">afet.live</span>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-white/10 bg-white/[0.02] flex items-center gap-2.5">
          <button
            id="btn-card-download"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
          >
            ${Icons.download('w-4 h-4')}
            <span>PNG İndir</span>
          </button>
          <button
            id="btn-card-share"
            class="flex-[1.5] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-obsidian-950 transition-colors shadow-glow-emerald"
          >
            ${Icons.share('w-4 h-4')}
            <span>WhatsApp / Story Paylaş</span>
          </button>
        </div>
      </div>
    `;

    // Event Listeners
    const closeBtn = this.container.querySelector('#btn-close-family-card');
    closeBtn?.addEventListener('click', () => this.hide());

    const shareBtn = this.container.querySelector('#btn-card-share');
    shareBtn?.addEventListener('click', () => this.handleShare());

    const downloadBtn = this.container.querySelector('#btn-card-download');
    downloadBtn?.addEventListener('click', () => this.handleDownload());

    const nameInput = this.container.querySelector('#input-card-family-name') as HTMLInputElement | null;
    nameInput?.addEventListener('input', (e) => {
      this.config.familyName = (e.target as HTMLInputElement).value;
      const previewTitle = this.container.querySelector('#preview-family-title');
      if (previewTitle) {
        previewTitle.textContent = `${(this.config.familyName || 'AİLEMİZ').toUpperCase()} AFET BULUŞMA PLANI`;
      }
    });

    const contactInput = this.container.querySelector('#input-card-contact') as HTMLInputElement | null;
    contactInput?.addEventListener('input', (e) => {
      this.config.cityContact = (e.target as HTMLInputElement).value;
    });

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.hide();
      }
    });
  }
}
