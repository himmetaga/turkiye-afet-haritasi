import { Icons } from './icons';
import { antiManipulationService, LEGAL_DISCLAIMER } from '../services/antiManipulationService';

export interface CampInfrastructureReport {
  campName: string;
  locationDetails: string;
  foodStatus: 'active' | 'preparing' | 'none';
  waterStatus: 'available' | 'low' | 'none';
  toiletStatus: 'ready' | 'insufficient' | 'none';
  capacityStatus: 'low' | 'half' | 'full';
  powerStatus: 'active' | 'solar' | 'none';
  securityStatus: 'police' | 'volunteer' | 'none';
  notes: string;
  reportedAt: number;
}

const STORAGE_KEY = 'afet_camp_status_report_v1';

export class FieldCampStatusModal {
  private container: HTMLElement;
  private report: CampInfrastructureReport;
  private onBroadcast?: (text: string) => void;

  constructor(parent: HTMLElement, onBroadcast?: (text: string) => void) {
    this.onBroadcast = onBroadcast;

    this.container = document.createElement('div');
    this.container.id = 'field-camp-status-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.report = this.loadReport();
    this.render();
  }

  private loadReport(): CampInfrastructureReport {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      campName: '',
      locationDetails: '',
      foodStatus: 'preparing',
      waterStatus: 'available',
      toiletStatus: 'insufficient',
      capacityStatus: 'half',
      powerStatus: 'active',
      securityStatus: 'volunteer',
      notes: '',
      reportedAt: Date.now()
    };
  }

  private saveReport(): void {
    try {
      this.report.reportedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.report));
    } catch {}
  }

  public show(prefillCampName?: string): void {
    if (prefillCampName && !this.report.campName) {
      this.report.campName = prefillCampName;
    }
    this.render();
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private formatSummaryText(): string {
    const foodMap = { active: '🟢 Sıcak Çorba/Yemek Başladı', preparing: '🟡 Yemek Hazırlanıyor', none: '🔴 Yemek Dağıtımı Yok' };
    const waterMap = { available: '🟢 İçme Suyu Var', low: '🟡 Su Kritik Düzeyde', none: '🔴 Su Tükendi / Yok' };
    const toiletMap = { ready: '🟢 Sahra WC Kurulu', insufficient: '🟡 Tuvalet Yetersiz / Sıra Var', none: '🔴 WC Yok' };
    const capacityMap = { low: '🟢 Çadır Yeri Var (%25)', half: '🟡 Yarı Dolu (%50)', full: '🔴 Tamamen Dolu (%100)' };
    const powerMap = { active: '🟢 Jeneratör Şarj İstasyonu Aktif', solar: '🟡 Sınırlı Güneş/Akü', none: '🔴 Elektrik/Şarj Yok' };

    return `🏕️ [TOPLANMA ALANI SAHRA ALTYAPI KARNESİ]\n` +
      `Saha: ${this.report.campName.trim() || 'Sahra Toplanma Alanı'}\n` +
      `Detay: ${this.report.locationDetails.trim() || '-'}\n` +
      `• Yemek: ${foodMap[this.report.foodStatus]}\n` +
      `• Su: ${waterMap[this.report.waterStatus]}\n` +
      `• WC/Hijyen: ${toiletMap[this.report.toiletStatus]}\n` +
      `• Kapasite: ${capacityMap[this.report.capacityStatus]}\n` +
      `• Enerji: ${powerMap[this.report.powerStatus]}\n` +
      (this.report.notes ? `Not: ${this.report.notes.trim()}\n` : '') +
      `Rapor Saati: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} (P2P Sahra Bildirimi)`;
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              ${Icons.tent('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Toplanma Alanı Sahra Karnesi</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">ÇADIRKENT DURUMU</span>
              </div>
              <p class="text-[11px] text-gray-400">Yemek, içme suyu, tuvalet ve çadır doluluk durumunu raporlayın ve BitChat ağına aktarın.</p>
            </div>
          </div>
          <button id="btn-close-camp-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          <!-- Camp Name -->
          <div>
            <label class="block text-gray-400 font-medium mb-1">Toplanma Alanı / Çadırkent Adı</label>
            <input
              id="input-camp-name"
              type="text"
              placeholder="Örn: Kadıköy Yoğurtçu Parkı Toplanma Alanı"
              value="${this.report.campName}"
              class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-amber-400"
            />
          </div>

          <!-- Status Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- Food -->
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <label class="block font-bold text-gray-200">🍲 Sıcak Yemek / Çorba</label>
              <select id="select-food-status" class="w-full px-2.5 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 text-xs text-white outline-none">
                <option value="active" ${this.report.foodStatus === 'active' ? 'selected' : ''}>🟢 Sıcak Yemek Dağıtılıyor</option>
                <option value="preparing" ${this.report.foodStatus === 'preparing' ? 'selected' : ''}>🟡 Dağıtım Hazırlanıyor</option>
                <option value="none" ${this.report.foodStatus === 'none' ? 'selected' : ''}>🔴 Sıcak Yemek Yok</option>
              </select>
            </div>

            <!-- Water -->
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <label class="block font-bold text-gray-200">💧 İçme Suyu Durumu</label>
              <select id="select-water-status" class="w-full px-2.5 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 text-xs text-white outline-none">
                <option value="available" ${this.report.waterStatus === 'available' ? 'selected' : ''}>🟢 İçme Suyu Var</option>
                <option value="low" ${this.report.waterStatus === 'low' ? 'selected' : ''}>🟡 Su Azalıyor / Kritik</option>
                <option value="none" ${this.report.waterStatus === 'none' ? 'selected' : ''}>🔴 İçme Suyu Yok / Tükendi</option>
              </select>
            </div>

            <!-- Toilet -->
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <label class="block font-bold text-gray-200">🚻 Sahra Tuvaleti / WC</label>
              <select id="select-toilet-status" class="w-full px-2.5 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 text-xs text-white outline-none">
                <option value="ready" ${this.report.toiletStatus === 'ready' ? 'selected' : ''}>🟢 Sahra WC Kurulu & Temiz</option>
                <option value="insufficient" ${this.report.toiletStatus === 'insufficient' ? 'selected' : ''}>🟡 WC Yetersiz / Yoğun Kuyruk</option>
                <option value="none" ${this.report.toiletStatus === 'none' ? 'selected' : ''}>🔴 Tuvalet Yok</option>
              </select>
            </div>

            <!-- Capacity -->
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <label class="block font-bold text-gray-200">⛺ Çadır Doluluk Oranı</label>
              <select id="select-capacity-status" class="w-full px-2.5 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 text-xs text-white outline-none">
                <option value="low" ${this.report.capacityStatus === 'low' ? 'selected' : ''}>🟢 Boş Çadır Yeri Var (%25)</option>
                <option value="half" ${this.report.capacityStatus === 'half' ? 'selected' : ''}>🟡 Yarı Dolu (%50)</option>
                <option value="full" ${this.report.capacityStatus === 'full' ? 'selected' : ''}>🔴 Tamamen Dolu (%100)</option>
              </select>
            </div>

            <!-- Power -->
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <label class="block font-bold text-gray-200">⚡ Jeneratör & Telefon Şarjı</label>
              <select id="select-power-status" class="w-full px-2.5 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 text-xs text-white outline-none">
                <option value="active" ${this.report.powerStatus === 'active' ? 'selected' : ''}>🟢 Jeneratör / Şarj Masası Aktif</option>
                <option value="solar" ${this.report.powerStatus === 'solar' ? 'selected' : ''}>🟡 Sınırlı Güneş Paneli</option>
                <option value="none" ${this.report.powerStatus === 'none' ? 'selected' : ''}>🔴 Elektrik / Şarj İstasyonu Yok</option>
              </select>
            </div>

            <!-- Security -->
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
              <label class="block font-bold text-gray-200">🛡️ Asayiş & Koordinasyon</label>
              <select id="select-security-status" class="w-full px-2.5 py-1.5 rounded-lg bg-obsidian-900 border border-white/10 text-xs text-white outline-none">
                <option value="police" ${this.report.securityStatus === 'police' ? 'selected' : ''}>🟢 Polis / Jandarma / AFAD Nöbette</option>
                <option value="volunteer" ${this.report.securityStatus === 'volunteer' ? 'selected' : ''}>🟡 Sivil Gönüllüler Yönetiyor</option>
                <option value="none" ${this.report.securityStatus === 'none' ? 'selected' : ''}>🔴 Güvenlik / Koordinatör Yok</option>
              </select>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-gray-400 font-medium mb-1">Özel İhtiyaç veya Durum Notu</label>
            <textarea
              id="input-camp-notes"
              rows="2"
              placeholder="Örn: Çocuk bezi acil aranıyor, 3. kapıda çorba dağıtımı var..."
              class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-amber-400 resize-none"
            >${this.report.notes}</textarea>
          </div>
        </div>

        <!-- Anti-Manipulation & Legal Notice -->
        <div class="px-3.5 py-2 bg-amber-500/10 border-t border-amber-500/20 text-[10.5px] text-amber-300 flex items-start gap-2 shrink-0">
          <span class="shrink-0 text-sm">🏕️</span>
          <p class="leading-snug">
            <strong>Sahra Karnesi Doğruluk Uyarısı:</strong> ${LEGAL_DISCLAIMER.shortNotice} Çadırkent durum karneleri sahadaki gözlemleri yansıtır. Resmi tahliye ve güvenlik kararları için lütfen mülki amirlik ve AFAD anonslarını esas alınız.
          </p>
        </div>

        <!-- Footer Actions -->
        <div class="p-3.5 sm:p-4 border-t border-white/10 bg-black/30 flex items-center justify-between gap-2 shrink-0">
          <button
            id="btn-copy-camp-status"
            type="button"
            class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-gray-200 active:scale-95 transition-all flex items-center gap-1.5 border border-white/10"
          >
            ${Icons.copy('w-3.5 h-3.5')}
            <span>Kopyala (SMS / WhatsApp)</span>
          </button>

          ${
            this.onBroadcast
              ? `
            <button
              id="btn-broadcast-camp-status"
              type="button"
              class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-xs font-bold text-black transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              ${Icons.messages('w-3.5 h-3.5')}
              <span>BitChat Ağına Yayınla</span>
            </button>
          `
              : ''
          }
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-camp-modal')?.addEventListener('click', () => this.hide());

    const syncInput = (id: string, key: keyof CampInfrastructureReport) => {
      q<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(id)?.addEventListener('change', (e) => {
        (this.report as any)[key] = (e.target as any).value;
        this.saveReport();
      });
      q<HTMLInputElement | HTMLTextAreaElement>(id)?.addEventListener('input', (e) => {
        (this.report as any)[key] = (e.target as any).value;
        this.saveReport();
      });
    };

    syncInput('#input-camp-name', 'campName');
    syncInput('#select-food-status', 'foodStatus');
    syncInput('#select-water-status', 'waterStatus');
    syncInput('#select-toilet-status', 'toiletStatus');
    syncInput('#select-capacity-status', 'capacityStatus');
    syncInput('#select-power-status', 'powerStatus');
    syncInput('#select-security-status', 'securityStatus');
    syncInput('#input-camp-notes', 'notes');

    q<HTMLButtonElement>('#btn-copy-camp-status')?.addEventListener('click', (e) => {
      const text = this.formatSummaryText();
      navigator.clipboard.writeText(text).then(() => {
        const btn = e.currentTarget as HTMLButtonElement;
        const original = btn.innerHTML;
        btn.innerHTML = `${Icons.checkCircle('w-3.5 h-3.5 text-emerald-400')} <span class="text-emerald-400">Kopyalandı!</span>`;
        setTimeout(() => (btn.innerHTML = original), 1800);
      });
    });

    q<HTMLButtonElement>('#btn-broadcast-camp-status')?.addEventListener('click', (e) => {
      if (this.onBroadcast) {
        // Anti-manipulation rate limiting
        const rateCheck = antiManipulationService.checkRateLimit('aid');
        if (!rateCheck.allowed) {
          alert(`⏱️ Çok sık sahra karnesi güncellendi. Lütfen ${rateCheck.waitSeconds} saniye bekleyin.`);
          return;
        }

        const text = this.formatSummaryText();
        const safety = antiManipulationService.analyzeTextSafety(text);
        if (safety.isSuspicious) {
          const proceed = confirm(
            `⚠️ Doğrulama Uyarısı:\nKarnede teyitsiz veya panik yaratabilecek bir ifade tespit edildi: "${safety.detectedKeyword}"\n${
              safety.warningMessage || ''
            }\n\nYine de bu durumu ağa aktarmak istiyor musunuz?`
          );
          if (!proceed) return;
        }

        this.onBroadcast(text);
        const btn = e.currentTarget as HTMLButtonElement;
        const original = btn.innerHTML;
        btn.innerHTML = `${Icons.checkCircle('w-3.5 h-3.5 text-black')} <span>Ağa Yayınlandı!</span>`;
        setTimeout(() => (btn.innerHTML = original), 1800);
      }
    });
  }
}
