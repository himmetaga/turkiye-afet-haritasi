import { Icons } from './icons';
import { escapeHtml } from '../utils/safeText';
import { EmergencyFacility } from '../types';
import { haversineDistanceMeters } from '../utils/geoMath';

export interface BloodGroupInfo {
  group: string;
  canGiveTo: string[];
  canReceiveFrom: string[];
  isUniversalDonor?: boolean;
  isUniversalReceiver?: boolean;
}

const BLOOD_MATRIX: Record<string, BloodGroupInfo> = {
  '0-': {
    group: '0 Rh-',
    canGiveTo: ['0-', '0+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['0-'],
    isUniversalDonor: true
  },
  '0+': {
    group: '0 Rh+',
    canGiveTo: ['0+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['0-', '0+']
  },
  'A-': {
    group: 'A Rh-',
    canGiveTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['0-', 'A-']
  },
  'A+': {
    group: 'A Rh+',
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['0-', '0+', 'A-', 'A+']
  },
  'B-': {
    group: 'B Rh-',
    canGiveTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['0-', 'B-']
  },
  'B+': {
    group: 'B Rh+',
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['0-', '0+', 'B-', 'B+']
  },
  'AB-': {
    group: 'AB Rh-',
    canGiveTo: ['AB-', 'AB+'],
    canReceiveFrom: ['0-', 'A-', 'B-', 'AB-']
  },
  'AB+': {
    group: 'AB Rh+',
    canGiveTo: ['AB+'],
    canReceiveFrom: ['0-', '0+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    isUniversalReceiver: true
  }
};

export class BloodCenterModal {
  private container: HTMLElement;
  private userCoords: [number, number];
  private facilities: EmergencyFacility[] = [];
  private selectedGroup = '0-';
  private onNavigateToPoint?: (point: EmergencyFacility) => void;
  private onBroadcastBloodRequest?: (text: string) => unknown;

  constructor(
    parent: HTMLElement,
    userCoords: [number, number],
    facilities: EmergencyFacility[] = [],
    onNavigateToPoint?: (point: EmergencyFacility) => void,
    onBroadcastBloodRequest?: (text: string) => unknown
  ) {
    this.userCoords = userCoords;
    this.facilities = facilities;
    this.onNavigateToPoint = onNavigateToPoint;
    this.onBroadcastBloodRequest = onBroadcastBloodRequest;

    this.container = document.createElement('div');
    this.container.id = 'blood-center-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public setUserCoords(coords: [number, number]): void {
    this.userCoords = coords;
  }

  public setFacilities(facilities: EmergencyFacility[]): void {
    this.facilities = facilities;
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

  private render(): void {
    const bloodCenters = this.facilities
      .filter((f) => f.category === 'blood_center')
      .map((f) => {
        const distKm = (haversineDistanceMeters(this.userCoords, f.coordinates) / 1000).toFixed(1);
        return { ...f, distKm: Number(distKm) };
      })
      .sort((a, b) => a.distKm - b.distKm);

    const activeInfo = BLOOD_MATRIX[this.selectedGroup] || BLOOD_MATRIX['0-'];

    this.container.innerHTML = `
      <div class="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl bg-obsidian-900 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-4 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              ${Icons.droplet('w-5 h-5')}
            </span>
            <div>
              <h3 class="text-base font-bold text-white tracking-wide">
                Kan Bağış Merkezleri
              </h3>
              <p class="text-[11px] text-gray-400">
                Kan grubu uyumluluğu (genel bilgi) ve haritadaki en yakın merkezler
              </p>
            </div>
          </div>

          <button id="btn-close-blood" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <div class="overflow-y-auto pr-1 space-y-4 flex-1">
          <!-- Blood Group Selector Pills -->
          <div>
            <div class="text-[11px] text-gray-400 font-medium mb-1.5">Kan Grubunuzu Seçin:</div>
            <div class="grid grid-cols-4 gap-1.5">
              ${Object.keys(BLOOD_MATRIX)
                .map((key) => {
                  const isSel = key === this.selectedGroup;
                  return `
                    <button
                      type="button"
                      data-blood="${key}"
                      class="btn-select-blood py-2 rounded-xl text-xs font-bold border transition-all ${
                        isSel
                          ? 'bg-rose-500 text-white border-rose-400 shadow-glow-rose'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                      }"
                    >
                      ${BLOOD_MATRIX[key].group}
                    </button>
                  `;
                })
                .join('')}
            </div>
          </div>

          <!-- Compatibility Matrix Card -->
          <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-white">${activeInfo.group} Uyumluluk Özeti</span>
              ${
                activeInfo.isUniversalDonor
                  ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">🌟 EVRENSEL VERİCİ</span>`
                  : activeInfo.isUniversalReceiver
                  ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✨ EVRENSEL ALICI</span>`
                  : ''
              }
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div class="text-[10.5px] text-emerald-300 font-bold uppercase mb-1">Kan Verebileceği:</div>
                <div class="font-semibold text-white">${activeInfo.canGiveTo.join(', ')}</div>
              </div>
              <div class="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div class="text-[10.5px] text-cyan-300 font-bold uppercase mb-1">Kan Alabileceği:</div>
                <div class="font-semibold text-white">${activeInfo.canReceiveFrom.join(', ')}</div>
              </div>
            </div>
          </div>

          <!-- Broadcast Urgent Blood Request -->
          <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3">
            <div class="text-xs">
              <div class="font-bold text-rose-300">🚨 Kan İhtiyacını Sohbette Paylaş</div>
              <div class="text-[10.5px] text-gray-300 mt-0.5">Herkese açık sohbet kanalına yazılır; Kızılay'a iletilmez. Kan talebi için hastane kan merkezi veya Kızılay 168.</div>
            </div>
            <button
              id="btn-broadcast-blood-req"
              type="button"
              class="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs active:scale-95 transition-all flex-shrink-0"
            >
              Paylaş
            </button>
          </div>

          <!-- Closest Kızılay Blood Donation Centers List -->
          <div>
            <div class="text-xs font-bold text-white mb-2 flex items-center justify-between">
              <span>En Yakın Kan Bağış Noktaları</span>
              <span class="text-[10.5px] text-gray-400 font-normal">${bloodCenters.length} merkez</span>
            </div>

            <div class="space-y-2">
              ${bloodCenters.slice(0, 5).map((bc) => `
                <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <div class="min-w-0">
                    <div class="font-bold text-white truncate">${escapeHtml(bc.name)}</div>
                    <div class="text-[11px] text-gray-400 truncate mt-0.5">${escapeHtml(bc.address || bc.city || '')}</div>
                    <div class="text-[10.5px] text-rose-400 font-mono mt-0.5">Mesafe: ~${bc.distKm} km (kuş uçuşu) • ${bc.phone ? `📞 ${escapeHtml(bc.phone)}` : 'Telefon: veri yok (Kızılay 168)'}</div>
                  </div>
                  <button
                    type="button"
                    data-point-id="${escapeHtml(bc.id)}"
                    class="btn-route-blood px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 active:scale-95 transition-all flex-shrink-0"
                  >
                    Rota
                  </button>
                </div>
              `).join('') || '<div class="p-3 text-center text-gray-500 text-xs">Yakında kayıtlı merkez bulunamadı.</div>'}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-white/10 mt-3 flex-shrink-0">
          <button
            id="btn-close-blood-bottom"
            type="button"
            class="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-blood')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-close-blood-bottom')?.addEventListener('click', () => this.hide());

    // Blood selection
    this.container.querySelectorAll('.btn-select-blood').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bg = btn.getAttribute('data-blood');
        if (bg) {
          this.selectedGroup = bg;
          this.render();
        }
      });
    });

    // Route button
    this.container.querySelectorAll('.btn-route-blood').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-point-id');
        const point = this.facilities.find((f) => f.id === pid);
        if (point && this.onNavigateToPoint) {
          this.hide();
          this.onNavigateToPoint(point);
        }
      });
    });

    // Broadcast urgent blood request
    this.container.querySelector('#btn-broadcast-blood-req')?.addEventListener('click', async () => {
      const hospitalName = prompt('Kan ihtiyacı olan hastane veya merkez adı:', '');
      if (!hospitalName) return;
      const unitCount = prompt('Kaç ünite kan aranıyor?', '2');
      const contact = prompt('İletişim telefon numarası veya hasta yakını:', '');
      const groupLabel = BLOOD_MATRIX[this.selectedGroup]?.group || this.selectedGroup;

      const text = `🩸 KAN İHTİYACI: [${groupLabel}] • ${hospitalName} için ${unitCount ? `${unitCount} ünite` : ''} kan aranıyor. ${contact ? `İletişim: ${contact}` : ''}`;

      if (this.onBroadcastBloodRequest) {
        this.hide();
        // Geri çağrı bir Promise döndürürse sonucuna bakılır; { sent: false } "gönderilmedi" demektir.
        try {
          const result: any = await this.onBroadcastBloodRequest(text);
          if (result && result.sent === false) {
            alert('Bağlantı yok: kan ihtiyacı mesajı GÖNDERİLMEDİ. Hastane kan merkezini veya Kızılay 168\'i arayın.');
          }
        } catch (err: any) {
          alert(err?.message || 'Mesaj gönderilemedi.');
        }
      } else {
        navigator.clipboard?.writeText(text);
        alert('Mesaj panoya kopyalandı. Kimseye gönderilmedi; kendiniz paylaşmalısınız.');
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
