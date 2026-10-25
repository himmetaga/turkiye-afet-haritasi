import { Icons } from './icons';
import { soundSynthesizer } from '../services/soundSynthesizer';

export interface TourniquetRecord {
  id: string;
  victimName: string;
  limb: 'Sağ Kol' | 'Sol Kol' | 'Sağ Bacak' | 'Sol Bacak';
  appliedAt: number; // timestamp
  initialNotes?: string;
}

const STORAGE_KEY = 'afet_active_tourniquets_v1';

export class TourniquetTimerModal {
  private container: HTMLElement;
  private records: TourniquetRecord[] = [];
  private intervalId: number | null = null;
  private onBroadcast?: (text: string) => void;
  private selectedLimb: TourniquetRecord['limb'] = 'Sağ Bacak';

  constructor(parent: HTMLElement, onBroadcast?: (text: string) => void) {
    this.onBroadcast = onBroadcast;
    this.container = document.createElement('div');
    this.container.id = 'tourniquet-timer-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.loadRecords();
    this.startTicker();
    this.render();
  }

  private loadRecords(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.records = JSON.parse(stored);
      }
    } catch {}
  }

  private saveRecords(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch {}
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private startTicker(): void {
    if (this.intervalId) return;
    this.intervalId = window.setInterval(() => {
      if (this.records.length > 0 && !this.container.classList.contains('hidden')) {
        this.updateTimers();
      }
    }, 1000);
  }

  private addRecord(victimName: string, notes?: string): void {
    const record: TourniquetRecord = {
      id: `tq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      victimName: victimName.trim() || 'İsimsiz Kazazede',
      limb: this.selectedLimb,
      appliedAt: Date.now(),
      initialNotes: notes?.trim()
    };
    this.records.unshift(record);
    this.saveRecords();
    soundSynthesizer.playCountdownBeep(880, 150);
    this.render();
  }

  private removeRecord(id: string): void {
    this.records = this.records.filter((r) => r.id !== id);
    this.saveRecords();
    this.render();
  }

  private formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  private getElapsedInfo(appliedAt: number): {
    elapsedMin: number;
    formattedElapsed: string;
    stage: 'safe' | 'warning' | 'critical' | 'necrosis';
    stageText: string;
    stageBadgeClass: string;
  } {
    const elapsedMs = Math.max(0, Date.now() - appliedAt);
    const totalSec = Math.floor(elapsedMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const formattedElapsed = `${hours > 0 ? `${hours}sa ` : ''}${minutes}dk ${String(seconds).padStart(2, '0')}sn`;
    const elapsedMin = Math.floor(totalSec / 60);

    if (elapsedMin < 45) {
      return {
        elapsedMin,
        formattedElapsed,
        stage: 'safe',
        stageText: 'Güvenli Süre',
        stageBadgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    } else if (elapsedMin < 90) {
      return {
        elapsedMin,
        formattedElapsed,
        stage: 'warning',
        stageText: 'İskemi Uyarısı (Nabız Kontrolü)',
        stageBadgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      };
    } else if (elapsedMin < 120) {
      return {
        elapsedMin,
        formattedElapsed,
        stage: 'critical',
        stageText: 'Kritik Eşik (Acil Ameliyathane)',
        stageBadgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
      };
    } else {
      return {
        elapsedMin,
        formattedElapsed,
        stage: 'necrosis',
        stageText: 'Geri Dönüşsüz Doku Hasarı Riski',
        stageBadgeClass: 'bg-red-700/40 text-red-100 border-red-500'
      };
    }
  }

  private updateTimers(): void {
    this.records.forEach((r) => {
      const card = this.container.querySelector(`[data-tq-id="${r.id}"]`);
      if (card) {
        const info = this.getElapsedInfo(r.appliedAt);
        const timerEl = card.querySelector('.tq-timer-display');
        const badgeEl = card.querySelector('.tq-stage-badge');
        if (timerEl) timerEl.textContent = info.formattedElapsed;
        if (badgeEl) {
          badgeEl.className = `tq-stage-badge text-[11px] font-semibold px-2 py-0.5 rounded-full border ${info.stageBadgeClass}`;
          badgeEl.textContent = info.stageText;
        }
      }
    });
  }

  private render(): void {
    const limbButtons = (['Sağ Bacak', 'Sol Bacak', 'Sağ Kol', 'Sol Kol'] as TourniquetRecord['limb'][])
      .map((limb) => {
        const isSelected = this.selectedLimb === limb;
        return `
          <button
            type="button"
            data-limb="${limb}"
            class="limb-select-btn flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
              isSelected
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }"
          >
            ${limb}
          </button>
        `;
      })
      .join('');

    const recordsHtml =
      this.records.length === 0
        ? `
          <div class="text-center py-8 text-gray-400 bg-white/[0.02] rounded-2xl border border-dashed border-white/10 p-4">
            <span class="inline-block p-3 rounded-2xl bg-white/5 text-gray-400 mb-2">
              ${Icons.timer('w-8 h-8')}
            </span>
            <div class="text-sm font-semibold text-gray-200">Aktif Turnike Kaydı Yok</div>
            <p class="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Kanayan uzva turnike uyguladığınız anda yukarıdaki butona basarak kronometreyi başlatın.
              Süre 120 dakikayı aşarsa doku kangreni ve uzuv kaybı riski başlar.
            </p>
          </div>
        `
        : this.records
            .map((r) => {
              const info = this.getElapsedInfo(r.appliedAt);
              const stamp = `T: ${this.formatTime(r.appliedAt)} - ${r.limb.toUpperCase()}`;

              return `
                <div data-tq-id="${r.id}" class="p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-2.5">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-white">${r.victimName}</span>
                        <span class="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono text-[11px] font-bold">
                          ${r.limb}
                        </span>
                      </div>
                      <div class="text-xs text-gray-400 mt-0.5">
                        Başlangıç: <strong class="text-gray-200 font-mono">${this.formatTime(r.appliedAt)}</strong>
                      </div>
                    </div>
                    <span class="tq-stage-badge text-[11px] font-semibold px-2 py-0.5 rounded-full border ${info.stageBadgeClass}">
                      ${info.stageText}
                    </span>
                  </div>

                  <!-- Elapsed Time Large Display -->
                  <div class="flex items-baseline justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <div class="text-[10px] text-gray-400 font-medium">GEÇEN SÜRE</div>
                      <div class="tq-timer-display font-mono text-2xl sm:text-3xl font-black text-rose-400 tabular-nums">
                        ${info.formattedElapsed}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-[10px] text-gray-400 font-medium">ALIN DAMGASI</div>
                      <div class="font-mono text-xs sm:text-sm font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        ${stamp}
                      </div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-xs">
                    <button
                      type="button"
                      data-copy-stamp="${stamp}"
                      class="btn-copy-stamp flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 active:scale-95 transition-all"
                    >
                      ${Icons.copy('w-3.5 h-3.5')}
                      <span>Damgayı Kopyala</span>
                    </button>

                    ${
                      this.onBroadcast
                        ? `
                      <button
                        type="button"
                        data-broadcast-tq="${r.id}"
                        class="btn-broadcast-tq flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 active:scale-95 transition-all"
                        title="BitChat Afet Ağına turnike durumunu bildir"
                      >
                        ${Icons.messages('w-3.5 h-3.5')}
                        <span>Ağa Bildir</span>
                      </button>
                    `
                        : ''
                    }

                    <button
                      type="button"
                      data-remove-tq="${r.id}"
                      class="btn-remove-tq flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 active:scale-95 transition-all ml-auto"
                      title="Turnikeyi sonlandır ve sil"
                    >
                      ${Icons.close('w-3.5 h-3.5')}
                      <span>Turnike Çözüldü</span>
                    </button>
                  </div>
                </div>
              `;
            })
            .join('');

    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-obsidian-900/95 backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              ${Icons.timer('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">Turnike Güvenlik Zamanlayıcısı</h2>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">120 DK PROTOKOLÜ</span>
              </div>
              <p class="text-[11px] text-gray-400">Şiddetli kanamalarda uzuv kaybını önlemek için kesin zaman takibi ve alın damgası.</p>
            </div>
          </div>
          <button id="btn-close-tq-modal" type="button" class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Add Tourniquet Section -->
        <div class="p-3.5 sm:p-4 border-b border-white/10 bg-black/20 flex flex-col gap-2.5 shrink-0">
          <div class="text-[11px] font-bold uppercase tracking-wider text-gray-400">YENİ TURNİKE KAYDI BAŞLAT</div>
          
          <div class="flex items-center gap-1.5">
            ${limbButtons}
          </div>

          <div class="flex items-center gap-2">
            <input
              id="tq-input-name"
              type="text"
              placeholder="Kazazede adı / no (Örn: Kazazede 1)"
              class="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-rose-400"
            />
            <button
              id="btn-start-tq"
              type="button"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all shrink-0 flex items-center gap-1.5"
            >
              ${Icons.siren('w-4 h-4')}
              <span>Turnikeyi Başlat</span>
            </button>
          </div>
        </div>

        <!-- Active Timers List -->
        <div class="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          <div class="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>AKTİF TURNİKELER (${this.records.length})</span>
            <span class="text-[10px] text-gray-500">120 dakikadan sonra kangren başlar</span>
          </div>
          ${recordsHtml}

          <!-- Emergency Field Guidelines -->
          <div class="mt-4 p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-xs text-rose-200/90 space-y-1.5">
            <div class="font-bold flex items-center gap-1.5 text-rose-300">
              ${Icons.alertTriangle('w-4 h-4')}
              <span>T.C. Sağlık Bakanlığı Turnike Kuralları:</span>
            </div>
            <ul class="list-disc list-inside space-y-1 text-[11px] text-gray-300">
              <li>Turnikeyi yaranın <strong>5 - 7 cm yukarısına</strong> (eklemlerin üzerine değil) uygulayın.</li>
              <li>Turnike uygulandığı an kazazedenin alnına silinmez kalemle saati yazın (Örn: <code>T: 14:35</code>).</li>
              <li>Turnikeyi <strong>asla gevşetmeyin veya çözmeyin</strong>; gevşetme işlemi yalnızca hastane ameliyathanesinde uzman cerrahlarca yapılmalıdır.</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-tq-modal')?.addEventListener('click', () => this.hide());

    this.container.querySelectorAll<HTMLButtonElement>('.limb-select-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const limb = btn.getAttribute('data-limb') as TourniquetRecord['limb'];
        if (limb) {
          this.selectedLimb = limb;
          this.render();
        }
      });
    });

    q<HTMLButtonElement>('#btn-start-tq')?.addEventListener('click', () => {
      const input = q<HTMLInputElement>('#tq-input-name');
      const name = input?.value || 'Kazazede';
      this.addRecord(name);
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-remove-tq').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove-tq');
        if (id && confirm('Turnikenin çözüldüğünü ve sağlık ekibine devredildiğini onaylıyor musunuz?')) {
          this.removeRecord(id);
        }
      });
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-copy-stamp').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stamp = btn.getAttribute('data-copy-stamp');
        if (stamp) {
          navigator.clipboard.writeText(stamp).then(() => {
            btn.innerHTML = `${Icons.checkCircle('w-3.5 h-3.5 text-emerald-400')} <span class="text-emerald-400">Kopyalandı!</span>`;
            setTimeout(() => this.render(), 1500);
          });
        }
      });
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-broadcast-tq').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-broadcast-tq');
        const match = this.records.find((r) => r.id === id);
        if (match && this.onBroadcast) {
          const info = this.getElapsedInfo(match.appliedAt);
          const msg = `🚨 [TURNİKE ACİL TIBBİ BİLDİRİM] Kazazede: ${match.victimName} | Uzuv: ${match.limb} | Başlangıç: ${this.formatTime(match.appliedAt)} | Geçen Süre: ${info.formattedElapsed} | Durum: ${info.stageText}. Acil cerrahi müdahale bekleniyor!`;
          this.onBroadcast(msg);
          btn.innerHTML = `${Icons.checkCircle('w-3.5 h-3.5 text-cyan-400')} <span class="text-cyan-400">Ağa Gönderildi</span>`;
          setTimeout(() => this.render(), 1800);
        }
      });
    });
  }
}
