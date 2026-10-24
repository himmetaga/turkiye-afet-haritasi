import { FaultLine, AssemblyPoint, NearestFaultResult } from '../types';
import { findNearestFaultLine } from '../utils/geoMath';
import { Icons } from './icons';

export interface BuildingRiskData {
  year: 'pre1999' | '2000_2018' | 'post2018';
  floors: '1_4' | '5_8' | '9plus';
  ground: 'residential' | 'soft_story';
  layout: 'detached' | 'adjacent';
}

export class BuildingRiskModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private faultLines: FaultLine[] = [];
  private nearestAssemblyPoint: AssemblyPoint | null = null;
  private onNavigateToPoint?: (point: AssemblyPoint) => void;

  private data: BuildingRiskData = {
    year: '2000_2018',
    floors: '5_8',
    ground: 'residential',
    layout: 'detached'
  };

  constructor(
    parent: HTMLElement,
    userCoords: [number, number],
    options?: { onNavigateToPoint?: (point: AssemblyPoint) => void }
  ) {
    this.userCoords = userCoords;
    this.onNavigateToPoint = options?.onNavigateToPoint;

    this.container = document.createElement('div');
    this.container.id = 'building-risk-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public setUserContext(
    userCoords: [number, number],
    faultLines: FaultLine[],
    nearestAssemblyPoint: AssemblyPoint | null
  ): void {
    this.userCoords = userCoords;
    this.faultLines = faultLines;
    this.nearestAssemblyPoint = nearestAssemblyPoint;
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

  private calculateRisk(): {
    score: number;
    level: 'YÜKSEK ÖNCELİK' | 'ORTA ÖNCELİK' | 'DÜŞÜK ÖNCELİK';
    colorCls: string;
    bgCls: string;
    borderCls: string;
    pgaEstimate: string;
    faultInfo: NearestFaultResult | null;
    factors: string[];
    actionItems: string[];
  } {
    let score = 0;
    const factors: string[] = [];
    const actionItems: string[] = [];

    // 1. Fault Distance & PGA estimation
    const faultInfo = findNearestFaultLine(this.userCoords, this.faultLines);
    const distKm = faultInfo ? faultInfo.distanceKm : 25;

    let pgaEstimate = '0.20 - 0.35g';
    if (distKm < 8) {
      score += 35;
      pgaEstimate = '0.50 - 0.70g (Şiddetli Sarsıntı Potansiyeli)';
      factors.push(`Faya çok yakın (${distKm} km)`);
    } else if (distKm < 20) {
      score += 25;
      pgaEstimate = '0.35 - 0.50g (Kuvvetli Sarsıntı)';
      factors.push(`Faya yakın (${distKm} km)`);
    } else if (distKm < 45) {
      score += 15;
      pgaEstimate = '0.20 - 0.35g (Orta Şiddet)';
      factors.push(`Fay hattına mesafe: ${distKm} km`);
    } else {
      score += 5;
      pgaEstimate = '< 0.20g (Hafif / Orta)';
    }

    // 2. Year of construction
    if (this.data.year === 'pre1999') {
      score += 35;
      factors.push('1999 Öncesi Yapı (Eski Deprem Yönetmeliği / Nervürsüz Demir Riski)');
      actionItems.push('Belediye veya Çevre Şehircilik lisanslı kuruluştan hızlı bina tarama testi (karot/ultrason) talep edin.');
    } else if (this.data.year === '2000_2018') {
      score += 15;
      factors.push('2000-2018 Yapımı (Denetimli, 2007 Yönetmeliği)');
      actionItems.push('Bina statik projesinin belediye arşivindeki kopyasını kontrol ettirin.');
    } else {
      score += 5;
      factors.push('2018 Sonrası (TBDY 2018 En Güncel Şartname)');
    }

    // 3. Ground / Soft-story
    if (this.data.ground === 'soft_story') {
      score += 20;
      factors.push('Zemin Dükkan / Yumuşak Kat (Kolon Kesintisi ve Rijitlik Farkı)');
      actionItems.push('Zemin katta dükkan tadilatında kolon/kiriş kesintisi veya duvar kaldırılması olup olmadığını kontrol ettirin.');
    }

    // 4. Layout (Adjacent / Detached)
    if (this.data.layout === 'adjacent') {
      score += 10;
      factors.push('Bitişik Nizam (Deprem anında çekiçleme etkisi riski)');
      actionItems.push('Komşu bina ile dilatasyon derzi (ayrım boşluğu) varlığını tespit ettirin.');
    }

    // 5. Floors
    if (this.data.floors === '9plus') {
      score += 10;
      factors.push('9+ Yüksek Kat (Daha uzun rezonans salınım periyodu)');
    } else if (this.data.floors === '5_8') {
      score += 5;
    }

    actionItems.push('Ev içi eşyaları (gardırop, kütüphane, su ısıtıcısı) L-braket ile duvara sabitleyin.');
    if (this.nearestAssemblyPoint) {
      actionItems.push(`En yakın toplanma sahanız: ${this.nearestAssemblyPoint.name} (${this.nearestAssemblyPoint.district}).`);
    }

    // Determine level
    let level: 'YÜKSEK ÖNCELİK' | 'ORTA ÖNCELİK' | 'DÜŞÜK ÖNCELİK' = 'DÜŞÜK ÖNCELİK';
    let colorCls = 'text-emerald-400';
    let bgCls = 'bg-emerald-500/10';
    let borderCls = 'border-emerald-500/30';

    if (score >= 60) {
      level = 'YÜKSEK ÖNCELİK';
      colorCls = 'text-rose-400';
      bgCls = 'bg-rose-500/15';
      borderCls = 'border-rose-500/40';
    } else if (score >= 35) {
      level = 'ORTA ÖNCELİK';
      colorCls = 'text-amber-400';
      bgCls = 'bg-amber-500/15';
      borderCls = 'border-amber-500/30';
    }

    return {
      score: Math.min(100, score),
      level,
      colorCls,
      bgCls,
      borderCls,
      pgaEstimate,
      faultInfo,
      factors,
      actionItems
    };
  }

  private async shareReport(): Promise<void> {
    const risk = this.calculateRisk();
    const nearestName = this.nearestAssemblyPoint ? this.nearestAssemblyPoint.name : 'En Yakın Alan';
    const text =
      `🏢 afet.live Bina ve Zemin Sismik Ön Değerlendirme Özeti\n` +
      `• Değerlendirme: ${risk.level} (${risk.score}/100 Puan)\n` +
      `• En Yakın Fay: ${risk.faultInfo ? `${risk.faultInfo.fault.name} (${risk.faultInfo.distanceKm} km)` : 'MTA Zonu'}\n` +
      `• Tahmini Yer İvmesi (PGA): ${risk.pgaEstimate}\n` +
      `• Acil Toplanma Alanı: ${nearestName}\n` +
      `\nKendi binanızı ve toplanma alanınızı haritada görün: https://afet.live/?mod=bina-risk`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'afet.live Bina Sismik Risk Kartı',
          text,
          url: 'https://afet.live/?mod=bina-risk'
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(text);
      const btn = this.container.querySelector('#btn-share-risk') as HTMLButtonElement | null;
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = `${Icons.checkCircle('w-4 h-4')} <span>Metin Panoya Kopyalandı!</span>`;
        setTimeout(() => {
          btn.innerHTML = orig;
        }, 2200);
      }
    } catch {
      alert(text);
    }
  }

  private render(): void {
    const risk = this.calculateRisk();
    const fault = risk.faultInfo;

    const optBtn = (group: keyof BuildingRiskData, val: string, label: string, note?: string) => {
      const active = (this.data as any)[group] === val;
      return `
        <button
          type="button"
          data-group="${group}"
          data-val="${val}"
          class="risk-opt-btn flex-1 py-2 px-2.5 rounded-xl text-left border transition-all ${
            active
              ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-glow-emerald'
              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
          }"
        >
          <div class="text-[11.5px] font-semibold leading-tight ${active ? 'text-emerald-300' : ''}">${label}</div>
          ${note ? `<div class="text-[9.5px] opacity-75 mt-0.5 truncate">${note}</div>` : ''}
        </button>
      `;
    };

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-obsidian-900 border border-white/10 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-obsidian-950/60">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-400/20">
              ${Icons.building('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm sm:text-base font-bold text-white tracking-wide">
                  Bina ve Zemin Sismik Ön Değerlendirme
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-gray-300">
                  V2 Model
                </span>
              </div>
              <p class="text-[11px] text-gray-400">
                MTA Diri Fay Hattı mesafesi + yapısal faktörlerle hızlı sismik farkındalık analizi
              </p>
            </div>
          </div>

          <button id="btn-close-risk" type="button" aria-label="Kapat" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <!-- 1. Location & Fault Banner -->
          <div class="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="grid place-items-center w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex-shrink-0">
                ${Icons.alertTriangle('w-4 h-4')}
              </span>
              <div class="min-w-0">
                <div class="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Konumunuza En Yakın MTA Diri Fay</div>
                <div class="text-xs font-bold text-white truncate" title="${fault ? fault.fault.name : 'Diri Fay Katmanı'}">
                  ${fault ? fault.fault.name : 'Fay hattı katmanı inceleniyor'}
                </div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-mono text-base font-black text-rose-300 tabular-nums">
                ${fault ? `${fault.distanceKm} km` : '--'}
              </div>
              <div class="text-[10px] text-gray-400 font-medium">Kuş Uçumu</div>
            </div>
          </div>

          <!-- 2. Quick 4 Inputs -->
          <div class="space-y-3">
            <div>
              <label class="hud-section-label block mb-1.5">1. Binanın Yapım Yılı</label>
              <div class="grid grid-cols-3 gap-1.5">
                ${optBtn('year', 'pre1999', '1999 Öncesi', 'Eski Yönetmelik')}
                ${optBtn('year', '2000_2018', '2000 - 2018', '2007 Şartnamesi')}
                ${optBtn('year', 'post2018', '2018 Sonrası', 'Güncel TBDY')}
              </div>
            </div>

            <div>
              <label class="hud-section-label block mb-1.5">2. Toplam Kat Sayısı</label>
              <div class="grid grid-cols-3 gap-1.5">
                ${optBtn('floors', '1_4', '1 - 4 Kat', 'Az Katlı')}
                ${optBtn('floors', '5_8', '5 - 8 Kat', 'Orta Katlı')}
                ${optBtn('floors', '9plus', '9+ Kat', 'Yüksek Yapı')}
              </div>
            </div>

            <div>
              <label class="hud-section-label block mb-1.5">3. Zemin ve Giriş Kat Durumu</label>
              <div class="grid grid-cols-2 gap-1.5">
                ${optBtn('ground', 'residential', 'Tamamen Konut', 'Normal Kat')}
                ${optBtn('ground', 'soft_story', 'Altı Dükkan / Galeri', 'Yumuşak Kat Riski')}
              </div>
            </div>

            <div>
              <label class="hud-section-label block mb-1.5">4. Bina Nizamı (Bitişiklik)</label>
              <div class="grid grid-cols-2 gap-1.5">
                ${optBtn('layout', 'detached', 'Ayrık Nizam', 'Bağımsız Yapı')}
                ${optBtn('layout', 'adjacent', 'Bitişik Nizam', 'Çekiçleme Riski')}
              </div>
            </div>
          </div>

          <!-- 3. Calculated Risk Card -->
          <div class="rounded-2xl ${risk.bgCls} border ${risk.borderCls} p-4 text-white">
            <div class="flex items-center justify-between gap-3 mb-2">
              <div>
                <span class="text-[10px] font-mono tracking-wider uppercase opacity-75">Sismik Hazırlık ve Öncelik Durumu</span>
                <div class="text-lg font-black tracking-wide ${risk.colorCls}">${risk.level}</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-2xl font-black ${risk.colorCls} tabular-nums">${risk.score}<span class="text-xs text-gray-400 font-normal">/100</span></div>
                <div class="text-[10px] text-gray-400">Risk Puanı</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 my-2.5 text-[11px] font-mono">
              <div class="rounded-xl bg-black/25 p-2 border border-white/5">
                <div class="text-gray-400 text-[10px]">Beklenen Yer İvmesi</div>
                <div class="text-white font-bold mt-0.5">${risk.pgaEstimate}</div>
              </div>
              <div class="rounded-xl bg-black/25 p-2 border border-white/5">
                <div class="text-gray-400 text-[10px]">En Yakın Toplanma Alanı</div>
                <div class="text-emerald-300 font-bold truncate mt-0.5" title="${this.nearestAssemblyPoint?.name || ''}">
                  ${this.nearestAssemblyPoint ? this.nearestAssemblyPoint.name : 'Haritada aranıyor'}
                </div>
              </div>
            </div>

            <!-- Action Checklist -->
            <div class="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
              <div class="hud-section-label !text-gray-300">Öncelikli Eylem ve Güvenlik Adımları</div>
              ${risk.actionItems
                .map(
                  (item) => `
                <div class="flex items-start gap-2 text-[11px] text-gray-200">
                  <span class="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>${item}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        <!-- Footer / Share Actions -->
        <div class="p-3.5 border-t border-white/10 bg-obsidian-950/80 flex items-center gap-2">
          ${
            this.nearestAssemblyPoint
              ? `
            <button
              id="btn-risk-to-point"
              type="button"
              class="hud-control px-3 text-[11.5px] font-semibold text-emerald-300 flex items-center gap-1.5 !bg-emerald-500/15 !border-emerald-500/30 hover:!bg-emerald-500/25"
            >
              ${Icons.walking('w-4 h-4')}
              <span>Toplanma Alanına Rota</span>
            </button>
          `
              : ''
          }
          <button
            id="btn-share-risk"
            type="button"
            class="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-obsidian-950 font-black text-xs shadow-glow-emerald active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            ${Icons.share('w-4 h-4')}
            <span>Risk Kartını Paylaş / Kopyala</span>
          </button>
        </div>
      </div>
    `;

    // Bind event listeners
    this.container.querySelector('#btn-close-risk')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-share-risk')?.addEventListener('click', () => this.shareReport());

    const routeBtn = this.container.querySelector('#btn-risk-to-point');
    routeBtn?.addEventListener('click', () => {
      if (this.nearestAssemblyPoint && this.onNavigateToPoint) {
        this.hide();
        this.onNavigateToPoint(this.nearestAssemblyPoint);
      }
    });

    this.container.querySelectorAll('.risk-opt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.getAttribute('data-group') as keyof BuildingRiskData;
        const val = btn.getAttribute('data-val');
        if (group && val) {
          (this.data as any)[group] = val;
          this.render();
        }
      });
    });

    this.container.onclick = (e) => {
      if (e.target === this.container) this.hide();
    };
  }
}
