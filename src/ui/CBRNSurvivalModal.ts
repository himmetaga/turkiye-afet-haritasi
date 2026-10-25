import { Icons } from './icons';
import { civilDefenseProtocols } from '../services/civilDefenseProtocols';

export class CBRNSurvivalModal {
  private container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'cbrn-survival-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private render(): void {
    const protocols = civilDefenseProtocols.getCBRNProtocols();

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
              ☢️
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">KBRN & Nükleer Serpinti Sığınağı</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  CIVIL DEFENSE
                </span>
              </div>
              <p class="text-[11px] text-gray-400">Radyasyon sızıntısı, kimyasal kaza ve ev sığınağı (Shelter-in-Place)</p>
            </div>
          </div>
          <button id="btn-close-cbrn" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body Content -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <!-- Radiation Threat Alert Banner -->
          <div class="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 space-y-1">
            <span class="font-bold block text-xs">⚠️ 3 Altın Kural: ZAMAN · MESAFE · ZIRH</span>
            <p class="text-[10.5px] text-gray-300 leading-relaxed">
              Radyoaktif serpintiden korunmada en etkili yöntem binanın merkezine sığınmaktır. Kalın beton ve tuğla duvarlar gama ve beta ışınlarını %99 oranında zayıflatır.
            </p>
          </div>

          <!-- Section 1: Shelter In Place -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="font-bold text-white block">🏠 1. Ev İçi Sığınak Hazırlığı (Shelter-in-Place):</span>
            ${protocols.shelterInPlaceRules
              .map((rule) => `<p class="text-[11px] text-gray-300 leading-relaxed">• ${rule}</p>`)
              .join('')}
          </div>

          <!-- Section 2: Potassium Iodide (KI) Dosage -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="font-bold text-white block">💊 2. Potasyum İyodür (KI) Dozaj Tablosu:</span>
            ${protocols.potassiumIodideDosage
              .map((dose) => `<p class="text-[11px] text-gray-300 leading-relaxed">• ${dose}</p>`)
              .join('')}
          </div>

          <!-- Section 3: Decontamination -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="font-bold text-white block">🧼 3. Arındırma & Dekontaminasyon Adımları:</span>
            ${protocols.decontaminationSteps
              .map((step) => `<p class="text-[11px] text-gray-300 leading-relaxed">• ${step}</p>`)
              .join('')}
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-black/40 border-t border-white/10 text-[10.5px] text-gray-400 text-center">
          💡 Resmi sivil savunma sirenleri ve AFAD anonsları gelmeden sığınağı terk etmeyiniz.
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-cbrn')?.addEventListener('click', () => this.hide());
  }
}
