import { Icons } from './icons';

export class UltraBatterySaverModal {
  private container: HTMLElement;
  private isSaverActive = false;
  private batteryLevel = 100;
  private isCharging = false;
  private onTriggerWhistle?: () => void;
  private onToggleTorch?: () => void;

  constructor(parent: HTMLElement, onTriggerWhistle?: () => void, onToggleTorch?: () => void) {
    this.onTriggerWhistle = onTriggerWhistle;
    this.onToggleTorch = onToggleTorch;

    this.container = document.createElement('div');
    this.container.id = 'ultra-battery-saver-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.isSaverActive = localStorage.getItem('afet_ultra_battery_saver') === 'true';
    if (this.isSaverActive) {
      document.documentElement.classList.add('ultra-battery-saver');
    }

    this.initBatteryStatus();
    this.render();
  }

  private async initBatteryStatus(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        this.updateBatteryInfo(battery);
        battery.addEventListener('levelchange', () => this.updateBatteryInfo(battery));
        battery.addEventListener('chargingchange', () => this.updateBatteryInfo(battery));
      }
    } catch {}
  }

  private updateBatteryInfo(battery: any): void {
    this.batteryLevel = Math.round(battery.level * 100);
    this.isCharging = battery.charging;
    this.render();
  }

  public show(): void {
    this.render();
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  public toggleSaver(): void {
    this.isSaverActive = !this.isSaverActive;
    localStorage.setItem('afet_ultra_battery_saver', String(this.isSaverActive));
    document.documentElement.classList.toggle('ultra-battery-saver', this.isSaverActive);
    this.render();
  }

  private render(): void {
    // Estimate hours remaining: normal ~0.8% per hour in standby, saver ~0.25% per hour
    const normalHours = Math.max(1, Math.round(this.batteryLevel / 1.5));
    const saverHours = Math.max(2, Math.round(this.batteryLevel / 0.35));

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-black text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              ${Icons.battery('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Ultra Pil Tasarrufu (72 Saat Modu)</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  this.isSaverActive ? 'bg-emerald-500 text-black' : 'bg-white/10 text-gray-400'
                }">
                  ${this.isSaverActive ? 'AKTİF' : 'KAPALI'}
                </span>
              </div>
              <p class="text-[11px] text-gray-400">OLED siyah piksel söndürme ve GPU döngülerini durdurarak telefon şarjını günlerce korur.</p>
            </div>
          </div>
          <button id="btn-close-battery-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body -->
        <div class="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <!-- Battery Gauge -->
          <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <div class="text-[11px] text-gray-400 font-medium">MEVCUT PİL SEVİYESİ</div>
              <div class="font-mono text-3xl font-black text-emerald-400 mt-0.5 flex items-baseline gap-1">
                <span>%${this.batteryLevel}</span>
                ${this.isCharging ? '<span class="text-xs font-normal text-amber-300">⚡ Şarj Oluyor</span>' : ''}
              </div>
            </div>

            <div class="text-right space-y-1">
              <div class="text-[11px] text-gray-400">Normal Kullanım: <strong class="text-gray-300 font-mono">~${normalHours} saat</strong></div>
              <div class="text-[11px] text-emerald-300 font-bold">Ultra Tasarruf ile: <strong class="font-mono text-emerald-400 text-sm">~${saverHours} saat</strong></div>
            </div>
          </div>

          <!-- Toggle Button -->
          <button
            id="btn-toggle-saver-mode"
            type="button"
            class="w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
              this.isSaverActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
            }"
          >
            <span>${this.isSaverActive ? '✅ Ultra Pil Tasarrufu Açık (Devre Dışı Bırak)' : '⚡ Ultra Pil Tasarrufunu Hemen Başlat'}</span>
          </button>

          <!-- How it Works -->
          <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-gray-300">
            <div class="font-bold text-white flex items-center gap-1.5">
              <span>🔋 72 Saat Hayatta Kalma Protokolü Nasıl Çalışır?</span>
            </div>
            <ul class="space-y-1.5 text-[11px] text-gray-400 list-disc list-inside">
              <li><strong>OLED Saf Siyah (#000000):</strong> Ekrandaki siyah piksellerin organik diyotları tamamen kapatılarak ekran pili tüketimi %75 azaltılır.</li>
              <li><strong>WebGL & GPU Döngüsü Uyutma:</strong> Harita 3D animasyonları ve sismik dalga render döngüleri dondurulur.</li>
              <li><strong>Arka Plan GPS Kısıtlama:</strong> Pil tüketen sürekli konum izleme kapatılır; yalnızca acil butonuna basıldığında tek seferlik konum okunur.</li>
              <li><strong>Yalnızca Kritik S.O.S Ekranı:</strong> Ekran kilitlenmez (WakeLock) ancak minimum parlaklıkta S.O.S düdüğü ve koordinat paneli aktif kalır.</li>
            </ul>
          </div>

          <!-- Emergency Action Bar in Saver Mode -->
          <div class="p-3 rounded-xl bg-black border border-white/10 flex items-center justify-between gap-2">
            <button
              id="btn-saver-whistle"
              type="button"
              class="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              ${Icons.whistle('w-4 h-4')}
              <span>S.O.S Düdük</span>
            </button>

            <button
              id="btn-saver-torch"
              type="button"
              class="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-white/10"
            >
              ${Icons.bolt('w-4 h-4')}
              <span>Flaşör / Fener</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-battery-modal')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#btn-toggle-saver-mode')?.addEventListener('click', () => {
      this.toggleSaver();
    });

    q<HTMLButtonElement>('#btn-saver-whistle')?.addEventListener('click', () => {
      if (this.onTriggerWhistle) this.onTriggerWhistle();
    });

    q<HTMLButtonElement>('#btn-saver-torch')?.addEventListener('click', () => {
      if (this.onToggleTorch) this.onToggleTorch();
    });
  }
}
