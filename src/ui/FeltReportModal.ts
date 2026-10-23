import { feltReportsService, FeltReport } from '../services/feltReportsService';
import { Icons } from './icons';

export class FeltReportModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private selectedIntensity = 4;
  private onSubmitSuccess?: (report: FeltReport) => void;

  constructor(parent: HTMLElement, userCoords: [number, number], onSubmitSuccess?: (report: FeltReport) => void) {
    this.userCoords = userCoords;
    this.onSubmitSuccess = onSubmitSuccess;
    this.container = document.createElement('div');
    this.container.id = 'felt-report-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public setUserCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public show(): void {
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
    this.render();
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private render(): void {
    const intensityOptions = [
      { level: 2, roman: 'II-III', title: 'Hafif Titreşim', desc: 'Sadece duran kişilerce hissedildi, avizeler hafif sallandı.', color: 'border-cyan-500/40 text-cyan-400' },
      { level: 4, roman: 'IV', title: 'Hissedildi', desc: 'Pencereler tıkırdadı, evdeki çoğu kişi fark etti.', color: 'border-emerald-500/40 text-emerald-400' },
      { level: 5, roman: 'V', title: 'Orta Şiddet', desc: 'Kapılar çarptı, uykudan uyandırdı, bardaklar ses çıkardı.', color: 'border-amber-500/40 text-amber-400' },
      { level: 6, roman: 'VI', title: 'Güçlü Sarsıntı', desc: 'Yürümekte zorlanıldı, küçük eşyalar raftan düştü.', color: 'border-orange-500/40 text-orange-400' },
      { level: 8, roman: 'VIII+', title: 'Şiddetli / Yıkıcı', desc: 'Ağır mobilyalar devrildi, duvarda çatlaklar oluştu.', color: 'border-rose-500/40 text-rose-400' }
    ];

    const recentReports = feltReportsService.getReports().slice(0, 3);

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-obsidian-900 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              ${Icons.seismic('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Depremi Hissettiniz mi? (Felt Report)
              </h3>
              <p class="text-[11px] text-gray-400">
                Mercalli şiddet ölçeğiyle bildirimde bulunarak topluluk haritasını güncelleyin
              </p>
            </div>
          </div>

          <button id="btn-close-felt" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Intensity Picker -->
        <div class="mb-4">
          <label class="block text-xs font-semibold text-gray-300 mb-2">
            Hissedilen Şiddet Derecesi:
          </label>
          <div class="space-y-2">
            ${intensityOptions
              .map(
                (opt) => `
              <div
                class="intensity-card cursor-pointer p-3 rounded-xl border bg-white/5 hover:bg-white/10 transition-all flex items-start gap-3 ${
                  this.selectedIntensity === opt.level ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10'
                }"
                data-level="${opt.level}"
              >
                <div class="px-2.5 py-1 rounded-lg bg-white/10 font-mono font-bold text-xs ${opt.color.split(' ')[1]}">
                  ${opt.roman}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-white">${opt.title}</div>
                  <div class="text-[11px] text-gray-400 mt-0.5 leading-snug">${opt.desc}</div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Extra Details -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-[11px] font-medium text-gray-400 mb-1">Bina Tipi</label>
            <select id="felt-building" class="w-full px-3 py-2 text-xs text-white bg-white/5 rounded-xl border border-white/10 outline-none">
              <option value="Betonarme Apartman">Betonarme Apartman</option>
              <option value="Müstakil / Villa">Müstakil / Villa</option>
              <option value="Yığma / Tuğla Bina">Yığma / Tuğla Bina</option>
              <option value="Çelik / Ofis Plaza">Çelik / Ofis Plaza</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-gray-400 mb-1">Bulunulan Kat</label>
            <input
              id="felt-floor"
              type="number"
              min="0"
              max="60"
              value="3"
              class="w-full px-3 py-2 text-xs text-white bg-white/5 rounded-xl border border-white/10 outline-none"
            />
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-[11px] font-medium text-gray-400 mb-1">Kısa Gözleminiz (İsteğe bağlı)</label>
          <input
            id="felt-comment"
            type="text"
            placeholder="Örn: Avizeler 6-7 saniye sallandı, derinden bir uğultu duyuldu..."
            class="w-full px-3 py-2 text-xs text-white bg-white/5 rounded-xl border border-white/10 outline-none placeholder-gray-500"
          />
        </div>

        <!-- Submit Button -->
        <button
          id="btn-submit-felt"
          class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-obsidian-950 font-bold text-sm shadow-glow-emerald active:scale-95 transition-all mb-4"
        >
          ✓ Bildirimi Topluluk Haritasına Gönder
        </button>

        <!-- Recent Reports Preview -->
        <div class="border-t border-white/10 pt-3">
          <h4 class="text-xs font-semibold text-gray-400 mb-2">Bölgenizdeki Son Topluluk Bildirimleri:</h4>
          <div class="space-y-1.5">
            ${recentReports
              .map(
                (r) => `
              <div class="p-2 rounded-lg bg-white/5 flex items-center justify-between text-[11px]">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-amber-400">${r.intensityRoman}</span>
                  <span class="text-white font-medium">${r.district}, ${r.city}</span>
                  <span class="text-gray-400 truncate max-w-[180px]">${r.comment || r.intensityLabel}</span>
                </div>
                <span class="text-gray-500 font-mono text-[10px]">${r.timeString}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelector('#btn-close-felt')?.addEventListener('click', () => this.hide());

    const cards = this.container.querySelectorAll('.intensity-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const level = Number(card.getAttribute('data-level'));
        this.selectedIntensity = level;
        this.render();
      });
    });

    const submitBtn = this.container.querySelector('#btn-submit-felt');
    submitBtn?.addEventListener('click', () => {
      const building = (this.container.querySelector('#felt-building') as HTMLSelectElement)?.value || 'Betonarme Apartman';
      const floor = Number((this.container.querySelector('#felt-floor') as HTMLInputElement)?.value || 1);
      const comment = (this.container.querySelector('#felt-comment') as HTMLInputElement)?.value || '';

      const report = feltReportsService.submitReport({
        intensity: this.selectedIntensity,
        intensityLabel: `Hissedilen Şiddet: ${this.selectedIntensity}/10`,
        city: 'İstanbul',
        district: 'Kadıköy',
        coordinates: this.userCoords,
        buildingType: building,
        floor,
        comment
      });

      if (this.onSubmitSuccess) {
        this.onSubmitSuccess(report);
      }

      this.hide();
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
