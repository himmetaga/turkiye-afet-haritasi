/**
 * SphereRationPlannerModal.ts
 * =============================================================================
 * 72 saatlik su ve erzak planlayıcısı.
 * Su ve kalori: Sphere El Kitabı asgari ölçüleri (kişi başı 15 L su/gün,
 * ortalama 2100 kcal/gün). Erzak listesi örnek öneridir, standart değildir.
 */

import { Icons } from './icons';
import {
  sphereRationService,
  SphereHouseholdInput,
  SpherePlanResult,
  SPHERE_TOTAL_WATER_L_PER_PERSON_DAY,
  DRINKING_WATER_L_PER_PERSON_DAY,
  OTHER_WATER_L_PER_PERSON_DAY,
  SPHERE_KCAL_PER_PERSON_DAY
} from '../services/sphereRationService';
import { registerModalOpen, registerModalClose, setupModalMobileDismiss } from '../utils/mobileModalHelper';

export class SphereRationPlannerModal {
  private container: HTMLElement;

  private inputState: SphereHouseholdInput = {
    adultsCount: 2,
    childrenCount: 1,
    infantsCount: 0,
    pregnantLactatingCount: 0,
    durationDays: 3
  };

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'sphere-ration-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide(),
      closeBtnSelector: '#btn-close-sphere'
    });
  }

  public show(): void {
    this.container.classList.remove('hidden');
    registerModalOpen('sphere-ration-modal', () => this.hide());
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
    registerModalClose('sphere-ration-modal');
  }

  private render(): void {
    const plan: SpherePlanResult = sphereRationService.calculateRations(this.inputState);

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              ${Icons.rationBox('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">72 Saat Hayatta Kalma Rasyonu</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Sphere asgari ölçüleri
                </span>
              </div>
              <p class="text-[11px] text-white/60">Minimum Su, Kalori ve Rasyon Hesaplayıcısı</p>
            </div>
          </div>
          <button id="btn-close-sphere" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-4 overflow-y-auto space-y-4 text-xs">
          <!-- Hane Halkı Giriş Kontrolleri -->
          <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
            <h3 class="font-bold text-xs uppercase tracking-wider text-white/80 flex items-center justify-between">
              <span>Hane Halkı Yapısı</span>
              <span class="text-[10px] text-white/40">Kişi Başı Kalori ve Su</span>
            </h3>

            <!-- Kişi Sayacı Butonları -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div class="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center">
                <span class="text-[10px] text-white/60 font-bold mb-1">Yetişkin</span>
                <div class="flex items-center gap-2">
                  <button id="btn-dec-adult" class="w-6 h-6 rounded-lg bg-white/10 font-black">-</button>
                  <span class="font-mono font-black text-sm text-white w-4">${this.inputState.adultsCount}</span>
                  <button id="btn-inc-adult" class="w-6 h-6 rounded-lg bg-white/10 font-black">+</button>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center">
                <span class="text-[10px] text-white/60 font-bold mb-1">Çocuk (2-12)</span>
                <div class="flex items-center gap-2">
                  <button id="btn-dec-child" class="w-6 h-6 rounded-lg bg-white/10 font-black">-</button>
                  <span class="font-mono font-black text-sm text-white w-4">${this.inputState.childrenCount}</span>
                  <button id="btn-inc-child" class="w-6 h-6 rounded-lg bg-white/10 font-black">+</button>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center">
                <span class="text-[10px] text-white/60 font-bold mb-1">Bebek (0-2)</span>
                <div class="flex items-center gap-2">
                  <button id="btn-dec-infant" class="w-6 h-6 rounded-lg bg-white/10 font-black">-</button>
                  <span class="font-mono font-black text-sm text-white w-4">${this.inputState.infantsCount}</span>
                  <button id="btn-inc-infant" class="w-6 h-6 rounded-lg bg-white/10 font-black">+</button>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center">
                <span class="text-[10px] text-white/60 font-bold mb-1">Yetişkinlerden hamile / emziren</span>
                <div class="flex items-center gap-2">
                  <button id="btn-dec-mom" class="w-6 h-6 rounded-lg bg-white/10 font-black">-</button>
                  <span class="font-mono font-black text-sm text-white w-4">${this.inputState.pregnantLactatingCount}</span>
                  <button id="btn-inc-mom" class="w-6 h-6 rounded-lg bg-white/10 font-black">+</button>
                </div>
              </div>
            </div>

            <!-- Süre ve Kış Modu -->
            <div class="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <!-- Süre Seçimi -->
              <div class="flex items-center gap-1">
                <span class="text-[11px] text-white/70 font-bold mr-1">Plan:</span>
                <button
                  data-days="3"
                  class="btn-days-sel px-2.5 py-1 rounded-lg text-xs font-bold ${
                    this.inputState.durationDays === 3
                      ? 'bg-cyan-500 text-obsidian-950 font-black'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }"
                >
                  3 Gün (72s)
                </button>
                <button
                  data-days="7"
                  class="btn-days-sel px-2.5 py-1 rounded-lg text-xs font-bold ${
                    this.inputState.durationDays === 7
                      ? 'bg-cyan-500 text-obsidian-950 font-black'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }"
                >
                  7 Gün
                </button>
                <button
                  data-days="14"
                  class="btn-days-sel px-2.5 py-1 rounded-lg text-xs font-bold ${
                    this.inputState.durationDays === 14
                      ? 'bg-cyan-500 text-obsidian-950 font-black'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }"
                >
                  14 Gün
                </button>
              </div>

              <span class="text-[10px] text-white/50">Toplam ${plan.totalPeople} kişi</span>
            </div>
          </div>

          <!-- Sonuç Özet Kartı (Hero Metrics) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div class="p-3.5 rounded-2xl bg-gradient-to-br from-sky-950/40 to-black/60 border border-sky-500/30">
              <span class="text-[10px] text-sky-400 font-bold block mb-1">💧 İçme ve Yemek Hazırlama Suyu</span>
              <div class="font-mono text-xl sm:text-2xl font-black text-white">
                ${plan.totalDrinkingWaterLiters} <span class="text-xs text-sky-300">Litre</span>
              </div>
              <span class="text-[10px] text-white/50 block mt-0.5">Kişi başı ${DRINKING_WATER_L_PER_PERSON_DAY} L / gün</span>
            </div>

            <div class="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-black/60 border border-cyan-500/30">
              <span class="text-[10px] text-cyan-400 font-bold block mb-1">🧼 Yemek Pişirme ve Hijyen Suyu</span>
              <div class="font-mono text-xl sm:text-2xl font-black text-white">
                ${plan.totalHygieneWaterLiters} <span class="text-xs text-cyan-300">Litre</span>
              </div>
              <span class="text-[10px] text-white/50 block mt-0.5">Kişi başı ${OTHER_WATER_L_PER_PERSON_DAY} L / gün</span>
            </div>

            <div class="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-black/60 border border-amber-500/30">
              <span class="text-[10px] text-amber-400 font-bold block mb-1">🔥 Günlük Toplam Kalori</span>
              <div class="font-mono text-xl sm:text-2xl font-black text-white">
                ${plan.dailyTotalCalories.toLocaleString('tr-TR')} <span class="text-xs text-amber-300">kcal</span>
              </div>
              <span class="text-[10px] text-white/50 block mt-0.5">Kişi başı ortalama ${SPHERE_KCAL_PER_PERSON_DAY} kcal • ${this.inputState.durationDays} gün: ${plan.totalPlanCalories.toLocaleString('tr-TR')} kcal</span>
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-[11px] text-sky-100 leading-relaxed">
            <strong class="text-white">Toplam su: ${plan.totalWaterLiters} litre</strong>
            (${plan.totalPeople} kişi × ${SPHERE_TOTAL_WATER_L_PER_PERSON_DAY} L × ${this.inputState.durationDays} gün).
            Sphere asgari ölçüsü kişi başı günde toplam ${SPHERE_TOTAL_WATER_L_PER_PERSON_DAY} litredir; bunun yaklaşık ${DRINKING_WATER_L_PER_PERSON_DAY} litresi içme ve yemek hazırlama içindir.
            Hepsini depolayamıyorsanız önce içme suyunu ayırın.
          </div>

          <!-- Erzak ve Stok Listesi -->
          <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-xs uppercase tracking-wider text-white/80">
                📦 Örnek Erzak Listesi
              </h3>
              <span class="text-[10px] text-white/40 font-mono">Öneridir, standart değildir</span>
            </div>

            <div class="space-y-1.5">
              ${plan.items
                .map(
                  (item) => `
                <div class="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-start justify-between gap-2">
                  <div>
                    <div class="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>${item.name}</span>
                      <span class="text-[9.5px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-mono">${item.shelfLife}</span>
                    </div>
                    <p class="text-[10.5px] text-white/60 mt-0.5">${item.notes}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="font-mono font-black text-cyan-300 text-sm">${item.totalHouseholdAmount}</span>
                    <span class="text-[10px] text-white/50 block">${item.unit}</span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Gün Gün Rasyon Çizelgesi -->
          <div class="space-y-2">
            <h3 class="font-bold text-xs uppercase tracking-wider text-white/80">
              📅 İlk 72 Saat İçin Örnek Düzen
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              ${plan.dailySchedule
                .map(
                  (sch) => `
                <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span class="text-cyan-400 font-bold block text-xs">${sch.title}</span>
                  <div class="text-[10.5px] text-white/70">
                    <strong>💧 Su:</strong> ${sch.waterSchedule}
                  </div>
                  <div class="text-[10.5px] text-white/70">
                    <strong>🍞 Öğün:</strong> ${sch.mealSchedule}
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Hayati Uyarılar -->
          <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-[11px] space-y-1">
            <strong class="text-rose-300 block mb-1">⚠️ Afet Sırasında Su ve Gıda Hayati Kuralları:</strong>
            ${plan.criticalWarnings.map((w) => `<p>${w}</p>`).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50 shrink-0">
          <span>Su ve kalori: Sphere El Kitabı asgari ölçüleri</span>
          <button id="btn-copy-sphere-list" class="px-3 py-1 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-500/40 text-cyan-200 font-bold flex items-center gap-1.5 transition-all">
            ${Icons.copy('w-3.5 h-3.5')} Erzak Listesini Kopyala
          </button>
        </div>
      </div>
    `;

    this.bindEvents(plan);
  }

  private bindEvents(plan: SpherePlanResult): void {
    // Adult counter
    this.container.querySelector('#btn-dec-adult')?.addEventListener('click', () => {
      if (this.inputState.adultsCount > 1) this.inputState.adultsCount--;
      // Hamile / emziren sayısı yetişkin sayısını aşamaz
      this.inputState.pregnantLactatingCount = Math.min(
        this.inputState.pregnantLactatingCount,
        this.inputState.adultsCount
      );
      this.render();
    });
    this.container.querySelector('#btn-inc-adult')?.addEventListener('click', () => {
      this.inputState.adultsCount++;
      this.render();
    });

    // Child counter
    this.container.querySelector('#btn-dec-child')?.addEventListener('click', () => {
      if (this.inputState.childrenCount > 0) this.inputState.childrenCount--;
      this.render();
    });
    this.container.querySelector('#btn-inc-child')?.addEventListener('click', () => {
      this.inputState.childrenCount++;
      this.render();
    });

    // Infant counter
    this.container.querySelector('#btn-dec-infant')?.addEventListener('click', () => {
      if (this.inputState.infantsCount > 0) this.inputState.infantsCount--;
      this.render();
    });
    this.container.querySelector('#btn-inc-infant')?.addEventListener('click', () => {
      this.inputState.infantsCount++;
      this.render();
    });

    // Mom counter
    this.container.querySelector('#btn-dec-mom')?.addEventListener('click', () => {
      if (this.inputState.pregnantLactatingCount > 0) this.inputState.pregnantLactatingCount--;
      this.render();
    });
    this.container.querySelector('#btn-inc-mom')?.addEventListener('click', () => {
      if (this.inputState.pregnantLactatingCount < this.inputState.adultsCount) {
        this.inputState.pregnantLactatingCount++;
      }
      this.render();
    });

    // Duration days buttons
    this.container.querySelectorAll<HTMLButtonElement>('.btn-days-sel').forEach((btn) => {
      btn.addEventListener('click', () => {
        const days = Number(btn.dataset.days) as 3 | 7 | 14;
        this.inputState.durationDays = days;
        this.render();
      });
    });

    // Copy list
    this.container.querySelector('#btn-copy-sphere-list')?.addEventListener('click', () => {
      let text = `[AFET SU VE ERZAK PLANI]\nSüre: ${this.inputState.durationDays} Gün | Kişi: ${this.inputState.adultsCount} Yetişkin, ${this.inputState.childrenCount} Çocuk, ${this.inputState.infantsCount} Bebek\n`;
      text += `\n💧 İçme ve yemek hazırlama suyu: ${plan.totalDrinkingWaterLiters} Litre`;
      text += `\n🧼 Yemek pişirme ve hijyen suyu: ${plan.totalHygieneWaterLiters} Litre`;
      text += `\n💦 Toplam su: ${plan.totalWaterLiters} Litre (kişi başı günde ${SPHERE_TOTAL_WATER_L_PER_PERSON_DAY} L)`;
      text += `\n🔥 Günlük Kalori: ${plan.dailyTotalCalories} kcal\n\nERZAK LİSTESİ:\n`;
      plan.items.forEach((item) => {
        text += `- ${item.name}: ${item.totalHouseholdAmount} ${item.unit}`.trimEnd() + '\n';
      });
      text += `\nafet.live — 72 Saat Hayatta Kalma Rehberi`;

      navigator.clipboard?.writeText(text).then(() => {
        alert('Erzak ve su kontrol listesi panoya kopyalandı.');
      });
    });
  }
}

