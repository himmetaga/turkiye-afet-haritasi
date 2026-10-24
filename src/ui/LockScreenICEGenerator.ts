import qrcode from 'qrcode-generator';
import { AssemblyPoint } from '../types';
import { findNearestAssemblyPoints } from '../utils/geoMath';
import { Icons } from './icons';

export interface ICEProfile {
  fullName: string;
  bloodType: string;
  emergencyContact1Name: string;
  emergencyContact1Phone: string;
  emergencyContact2Name: string;
  emergencyContact2Phone: string;
  medicalNotes: string;
  assemblyAreaName: string;
}

export class LockScreenICEGenerator {
  private container: HTMLElement;
  private userCoords: [number, number];
  private assemblyPoints: AssemblyPoint[];
  private profile: ICEProfile;

  constructor(
    parent: HTMLElement,
    userCoords: [number, number],
    assemblyPoints: AssemblyPoint[]
  ) {
    this.userCoords = userCoords;
    this.assemblyPoints = assemblyPoints;

    const saved = localStorage.getItem('afet_ice_profile');
    if (saved) {
      try {
        this.profile = JSON.parse(saved);
      } catch {
        this.profile = this.getDefaultProfile();
      }
    } else {
      this.profile = this.getDefaultProfile();
    }

    this.container = document.createElement('div');
    this.container.id = 'lock-screen-ice-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  private getDefaultProfile(): ICEProfile {
    let nearestName = 'En Yakın AFAD Toplanma Alanı';
    if (this.assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
      if (nearest.length > 0) nearestName = nearest[0].point.name;
    }

    return {
      fullName: 'Ahmet Yılmaz',
      bloodType: 'A Rh(+)',
      emergencyContact1Name: 'Eşim (Ayşe)',
      emergencyContact1Phone: '0532 000 00 00',
      emergencyContact2Name: 'Kardeşim (Mehmet)',
      emergencyContact2Phone: '0542 000 00 00',
      medicalNotes: 'Kronik rahatsızlık yok. Düzenli kullanılan ilaç yok.',
      assemblyAreaName: nearestName
    };
  }

  public setData(userCoords: [number, number], assemblyPoints: AssemblyPoint[]): void {
    this.userCoords = userCoords;
    this.assemblyPoints = assemblyPoints;
    if (this.profile.assemblyAreaName === 'En Yakın AFAD Toplanma Alanı' && assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(userCoords, assemblyPoints, 1);
      if (nearest.length > 0) {
        this.profile.assemblyAreaName = nearest[0].point.name;
      }
    }
  }

  public show(): void {
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
    this.drawPreview();
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private saveProfile(): void {
    localStorage.setItem('afet_ice_profile', JSON.stringify(this.profile));
  }

  private render(): void {
    const bloodTypes = [
      '0 Rh(+)', '0 Rh(-)', 'A Rh(+)', 'A Rh(-)',
      'B Rh(+)', 'B Rh(-)', 'AB Rh(+)', 'AB Rh(-)', 'Bilinmiyor'
    ];

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 bg-white/5 flex-shrink-0">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              ${Icons.shield('w-5 h-5')}
            </span>
            <div>
              <h2 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Kilit Ekranı Tıbbi Kimlik & Acil Durum Duvar Kağıdı
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">ICE (In Case of Emergency)</span>
              </h2>
              <p class="text-[11px] text-gray-400">Enkaz altında veya baygınlıkta telefon kilitliyken ilk yardım ekiplerinin kan grubunuzu ve yakınlarınızı görmesini sağlar.</p>
            </div>
          </div>
          <button id="btn-close-ice" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body: Left Form, Right Live Canvas Preview -->
        <div class="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col md:flex-row gap-5">
          <!-- Form Section -->
          <div class="flex-1 flex flex-col gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[11px] font-semibold text-gray-300 block mb-1">Ad Soyad</label>
                <input
                  id="ice-name"
                  type="text"
                  value="${this.profile.fullName}"
                  class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Adınız Soyadınız"
                />
              </div>

              <div>
                <label class="text-[11px] font-semibold text-gray-300 block mb-1">Kan Grubu (Hayati Önem)</label>
                <select
                  id="ice-blood"
                  class="w-full px-3 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-xs text-rose-300 font-bold focus:outline-none focus:border-rose-500"
                >
                  ${bloodTypes
                    .map(
                      (b) => `<option value="${b}" ${b === this.profile.bloodType ? 'selected' : ''}>${b}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>

            <!-- Emergency Contact 1 -->
            <div class="p-3 rounded-xl bg-white/5 border border-white/5">
              <span class="text-[10.5px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">1. Acil Durum İrtibat Kişisi (Birincil Yakın)</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  id="ice-c1-name"
                  type="text"
                  value="${this.profile.emergencyContact1Name}"
                  class="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500"
                  placeholder="Yakınlık ve İsim (örn. Eşim Ayşe)"
                />
                <input
                  id="ice-c1-phone"
                  type="tel"
                  value="${this.profile.emergencyContact1Phone}"
                  class="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 font-mono"
                  placeholder="Telefon (örn. 0532 111 22 33)"
                />
              </div>
            </div>

            <!-- Emergency Contact 2 -->
            <div class="p-3 rounded-xl bg-white/5 border border-white/5">
              <span class="text-[10.5px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">2. Acil Durum İrtibat Kişisi (Yedek Yakın)</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  id="ice-c2-name"
                  type="text"
                  value="${this.profile.emergencyContact2Name}"
                  class="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500"
                  placeholder="Yakınlık ve İsim (örn. Kardeşim)"
                />
                <input
                  id="ice-c2-phone"
                  type="tel"
                  value="${this.profile.emergencyContact2Phone}"
                  class="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 font-mono"
                  placeholder="Telefon (örn. 0542 333 44 55)"
                />
              </div>
            </div>

            <!-- Medical Info -->
            <div>
              <label class="text-[11px] font-semibold text-gray-300 block mb-1">Kronik Hastalıklar, Düzenli İlaçlar veya Alerjiler</label>
              <textarea
                id="ice-notes"
                rows="2"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Örn: Tip 1 Diyabet hastası (İnsülin), Penisilin alerjisi var, Kalp pili mevcut."
              >${this.profile.medicalNotes}</textarea>
            </div>

            <!-- Assembly Area -->
            <div>
              <label class="text-[11px] font-semibold text-gray-300 block mb-1">Aile Toplanma Alanı</label>
              <input
                id="ice-assembly"
                type="text"
                value="${this.profile.assemblyAreaName}"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                placeholder="En yakın AFAD toplanma sahası adı"
              />
            </div>
          </div>

          <!-- Preview & Action Section -->
          <div class="w-full md:w-[280px] lg:w-[320px] flex flex-col items-center gap-3">
            <div class="text-[11px] font-semibold text-gray-400">Telefon Kilit Ekranı Önizlemesi (9:16)</div>
            
            <!-- Canvas Phone Frame -->
            <div class="relative w-[210px] h-[373px] sm:w-[240px] sm:h-[426px] rounded-[32px] p-2 bg-gradient-to-b from-gray-700 via-gray-900 to-black shadow-2xl border-2 border-white/20 overflow-hidden flex items-center justify-center">
              <canvas id="ice-canvas" width="1080" height="1920" class="w-full h-full rounded-[24px] object-cover"></canvas>
            </div>

            <!-- Buttons -->
            <div class="flex flex-col gap-2 w-full">
              <button
                id="btn-download-ice"
                type="button"
                class="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                ${Icons.download('w-4 h-4')}
                <span>Duvar Kağıdı Olarak İndir (PNG)</span>
              </button>

              <button
                id="btn-share-ice"
                type="button"
                class="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                ${Icons.share('w-4 h-4')}
                <span>Telefonda Paylaş / Kaydet</span>
              </button>

              <p class="text-[10px] text-gray-400 text-center leading-relaxed">
                İndirdiğiniz görseli telefonunuzun <strong>Kilit Ekranı</strong> (Lock Screen) duvar kağıdı olarak ayarlayınız.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q('#btn-close-ice')?.addEventListener('click', () => this.hide());

    const updateField = (id: string, key: keyof ICEProfile) => {
      const el = q<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(id);
      el?.addEventListener('input', () => {
        this.profile[key] = el.value;
        this.saveProfile();
        this.drawPreview();
      });
    };

    updateField('#ice-name', 'fullName');
    updateField('#ice-blood', 'bloodType');
    updateField('#ice-c1-name', 'emergencyContact1Name');
    updateField('#ice-c1-phone', 'emergencyContact1Phone');
    updateField('#ice-c2-name', 'emergencyContact2Name');
    updateField('#ice-c2-phone', 'emergencyContact2Phone');
    updateField('#ice-notes', 'medicalNotes');
    updateField('#ice-assembly', 'assemblyAreaName');

    q('#btn-download-ice')?.addEventListener('click', () => this.downloadWallpaper());
    q('#btn-share-ice')?.addEventListener('click', () => this.shareWallpaper());
  }

  private drawPreview(): void {
    const canvas = this.container.querySelector('#ice-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;

    // Background: Deep OLED Black with dark emergency glow
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, W, H);

    // Subtle background mesh grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Top Radial Emergency Glow
    const rad = ctx.createRadialGradient(W / 2, 540, 50, W / 2, 540, 500);
    rad.addColorStop(0, 'rgba(225, 29, 72, 0.15)');
    rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 200, W, 800);

    // Note: Top 380px is intentionally reserved for Phone OS Clock & Notifications!
    // We render a soft hint indicator:
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.font = '500 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ SAAT VE BİLDİRİM ALANI ▲', W / 2, 360);

    let currentY = 440;

    // 1. EMERGENCY MEDICAL HEADER
    ctx.fillStyle = '#E11D48'; // Rose red
    ctx.beginPath();
    ctx.roundRect(80, currentY, W - 160, 110, 24);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ACİL DURUM TIBBİ KİMLİK KARTI (ICE)', W / 2, currentY + 70);

    currentY += 160;

    // 2. NAME & BLOOD TYPE HERO CARD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(80, currentY, W - 160, 280, 32);
    ctx.fill();
    ctx.stroke();

    // Full Name
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 30px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KİŞİ ADI SOYADI', 130, currentY + 65);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 48px Outfit, sans-serif';
    const displayName = this.profile.fullName || 'Ad Soyad';
    ctx.fillText(displayName, 130, currentY + 125);

    // Blood Type Giant Badge (Right side of hero)
    const bloodX = W - 350;
    const bloodY = currentY + 45;
    const bloodW = 230;
    const bloodH = 190;

    ctx.fillStyle = 'rgba(225, 29, 72, 0.25)';
    ctx.strokeStyle = '#E11D48';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(bloodX, bloodY, bloodW, bloodH, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDA4AF';
    ctx.font = '700 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KAN GRUBU', bloodX + bloodW / 2, bloodY + 48);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 56px Outfit, sans-serif';
    ctx.fillText(this.profile.bloodType, bloodX + bloodW / 2, bloodY + 130);

    currentY += 320;

    // 3. EMERGENCY CONTACTS (2 CARDS)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, currentY, W - 160, 310, 32);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10B981'; // Emerald
    ctx.font = '800 28px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📞 ACİL DURUMDA ARANACAK KİŞİLER', 120, currentY + 60);

    // Contact 1
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 36px Outfit, sans-serif';
    ctx.fillText(this.profile.emergencyContact1Name || '1. Yakın', 120, currentY + 125);

    ctx.fillStyle = '#34D399';
    ctx.font = '800 40px "Courier New", monospace';
    ctx.fillText(this.profile.emergencyContact1Phone || 'Belirtilmedi', 120, currentY + 175);

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(120, currentY + 195);
    ctx.lineTo(W - 120, currentY + 195);
    ctx.stroke();

    // Contact 2
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px Outfit, sans-serif';
    ctx.fillText(this.profile.emergencyContact2Name || '2. Yakın', 120, currentY + 245);

    ctx.fillStyle = '#38BDF8'; // Cyan
    ctx.font = '800 36px "Courier New", monospace';
    ctx.fillText(this.profile.emergencyContact2Phone || 'Belirtilmedi', 120, currentY + 290);

    currentY += 350;

    // 4. CRITICAL MEDICAL NOTES & ALLERGIES
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(80, currentY, W - 160, 200, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F59E0B'; // Amber
    ctx.font = '800 26px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚠️ TIBBİ BİLGİ / KRONİK RAHATSIZLIK & ALERJİLER', 120, currentY + 55);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '500 30px Inter, sans-serif';
    const notes = this.profile.medicalNotes || 'Belirtilmedi';
    ctx.fillText(notes.slice(0, 55), 120, currentY + 110);
    if (notes.length > 55) {
      ctx.fillText(notes.slice(55, 110), 120, currentY + 155);
    }

    currentY += 240;

    // 5. ASSEMBLY POINT & AFET.LIVE FOOTER
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(80, currentY, W - 160, 150, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6EE7B7';
    ctx.font = '700 24px Inter, sans-serif';
    ctx.fillText('🛡️ AFAD AİLE TOPLANMA ALANI', 120, currentY + 50);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 36px Outfit, sans-serif';
    ctx.fillText((this.profile.assemblyAreaName || 'Toplanma Alanı').slice(0, 38), 120, currentY + 105);

    currentY += 190;

    // Bottom Badge: 112 Acil Çağrı & afet.live
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.roundRect(80, currentY, W - 160, 90, 20);
    ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HAYATİ TEHLİKE ANINDA 112 ACİL ÇAĞRI MERKEZİNİ ARAYIN • afet.live', W / 2, currentY + 55);
  }

  private downloadWallpaper(): void {
    const canvas = this.container.querySelector('#ice-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `kilit-ekrani-ice-${this.profile.fullName.replace(/\s+/g, '-').toLowerCase() || 'acil'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  private async shareWallpaper(): Promise<void> {
    const canvas = this.container.querySelector('#ice-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'kilit-ekrani-acil-durum.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Kilit Ekranı Acil Durum Tıbbi Kimlik Kartı',
            text: `${this.profile.fullName} Acil Durum Tıbbi Kimlik Duvar Kağıdı (Kan Grubu: ${this.profile.bloodType}). afet.live`
          });
        } else {
          this.downloadWallpaper();
        }
      }, 'image/png');
    } catch {
      this.downloadWallpaper();
    }
  }
}
