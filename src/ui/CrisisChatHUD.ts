import { Icons } from './icons';

export interface CrisisMessage {
  id: string;
  senderName: string;
  type: 'safe' | 'help' | 'chat';
  text: string;
  timestamp: number;
  timeString: string;
  city: string;
  district: string;
  batteryLevel?: number;
}

const STORAGE_KEY = 'afet_live_crisis_chat_v1';
const CHANNEL_NAME = 'afet_live_crisis_channel';

export class CrisisChatHUD {
  private container: HTMLElement;
  private messages: CrisisMessage[] = [];
  private channel: BroadcastChannel | null = null;
  private userCoords: [number, number];
  private currentCity = 'İstanbul';
  private currentDistrict = 'Kadıköy';
  private onOpenQRPack?: (status: 'SAFE' | 'HELP') => void;

  constructor(
    parent: HTMLElement,
    userCoords: [number, number],
    options?: { onOpenQRPack?: (status: 'SAFE' | 'HELP') => void }
  ) {
    this.userCoords = userCoords;
    this.onOpenQRPack = options?.onOpenQRPack;
    this.container = document.createElement('div');
    this.container.id = 'crisis-chat-hud';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.loadMessages();
    this.initBroadcastChannel();
    this.render();
  }

  public setUserLocation(coords: [number, number], city = 'İstanbul', district = 'Kadıköy'): void {
    this.userCoords = coords;
    this.currentCity = city;
    this.currentDistrict = district;
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

  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (e) => {
          if (e.data && e.data.type === 'NEW_CHAT_MSG') {
            this.messages.unshift(e.data.message);
            this.render();
          }
        };
      } catch {}
    }
  }

  private loadMessages(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.messages = JSON.parse(raw);
      } else {
        this.messages = [
          {
            id: 'msg-init-1',
            senderName: 'Ahmet Y.',
            type: 'safe',
            text: 'Moda Sahili toplanma alanındayız, ailemizle birlikte güvendeyiz.',
            timestamp: Date.now() - 1000 * 60 * 25,
            timeString: '25 dk önce',
            city: 'İstanbul',
            district: 'Kadıköy',
            batteryLevel: 88
          },
          {
            id: 'msg-init-2',
            senderName: 'Selin B.',
            type: 'safe',
            text: 'Yoğurtçu Parkı toplanma sahasında çadır kurulumu yapılıyor, su dağıtımı mevcut.',
            timestamp: Date.now() - 1000 * 60 * 12,
            timeString: '12 dk önce',
            city: 'İstanbul',
            district: 'Kadıköy',
            batteryLevel: 74
          }
        ];
      }
    } catch {
      this.messages = [];
    }
  }

  private saveMessages(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages.slice(0, 100)));
    } catch {}
  }

  private async getBatteryPercent(): Promise<number | undefined> {
    if ('getBattery' in navigator) {
      try {
        const bat: any = await (navigator as any).getBattery();
        return Math.round(bat.level * 100);
      } catch {}
    }
    return undefined;
  }

  private async sendMessage(text: string, type: 'safe' | 'help' | 'chat' = 'chat'): Promise<void> {
    const bat = await this.getBatteryPercent();
    const newMsg: CrisisMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderName: type === 'safe' ? 'Vatandaş (Güvende)' : type === 'help' ? 'Acil Yardım Çağrısı' : 'Bölge Sakini',
      type,
      text: text.trim(),
      timestamp: Date.now(),
      timeString: 'Az önce',
      city: this.currentCity,
      district: this.currentDistrict,
      batteryLevel: bat
    };

    this.messages.unshift(newMsg);
    this.saveMessages();
    this.render();

    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'NEW_CHAT_MSG', message: newMsg });
      } catch {}
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-obsidian-900 border border-white/10 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-obsidian-950/50">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              ${Icons.user('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-white tracking-wide">
                  Afet Kriz Koordinasyon Odası
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  ${this.currentDistrict} / ${this.currentCity}
                </span>
              </div>
              <p class="text-[11px] text-gray-400">
                P2P & Mesh tabanlı güvenli durum bildirimi ve bilgi paylaşımı
              </p>
            </div>
          </div>

          <button id="btn-close-crisis" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-4 h-4 text-gray-400')}
          </button>
        </div>

        <!-- Quick 1-Click Status Broadcast Bar -->
        <div class="p-3 bg-white/5 border-b border-white/10 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <button
              id="btn-broadcast-safe"
              class="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-obsidian-950 font-extrabold text-xs shadow-glow-emerald active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>✓ Güvendeyim</span>
            </button>
            <button
              id="btn-broadcast-help"
              class="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-glow-rose active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🚨 Acil Yardım Gerekli</span>
            </button>
          </div>

          <button
            id="btn-open-crisis-qr"
            type="button"
            class="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            ${Icons.qrCode('w-4 h-4')}
            <span>İnternetsiz Çevrimdışı QR Kodunu Aç (Kamerayla Okunur)</span>
          </button>
        </div>

        <!-- Message Feed List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[380px]">
          ${
            this.messages.length === 0
              ? `
            <div class="text-center py-10 text-xs text-gray-500">
              Henüz bir mesaj bulunmuyor. İlk durumu siz paylaşın.
            </div>
          `
              : this.messages
                  .map((m) => {
                    const isSafe = m.type === 'safe';
                    const isHelp = m.type === 'help';
                    const cardBorder = isHelp
                      ? 'border-rose-500/40 bg-rose-500/10'
                      : isSafe
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/5 bg-white/5';

                    return `
                    <div class="p-3 rounded-xl border ${cardBorder} text-xs">
                      <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold ${isHelp ? 'text-rose-400' : isSafe ? 'text-emerald-400' : 'text-gray-200'}">
                            ${m.senderName}
                          </span>
                          <span class="text-[10px] text-gray-400 font-mono">(${m.district})</span>
                        </div>
                        <div class="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                          ${m.batteryLevel !== undefined ? `<span>🔋 %${m.batteryLevel}</span>` : ''}
                          <span>${m.timeString}</span>
                        </div>
                      </div>
                      <p class="text-gray-200 leading-relaxed font-normal">${m.text}</p>
                    </div>
                  `;
                  })
                  .join('')
          }
        </div>

        <!-- Chat Input Bar -->
        <div class="p-3 border-t border-white/10 bg-obsidian-950/80 flex items-center gap-2">
          <input
            id="crisis-chat-input"
            type="text"
            placeholder="Bilgi veya durum paylaşın..."
            class="flex-1 px-3 py-2 text-xs text-white bg-white/5 rounded-xl border border-white/10 outline-none placeholder-gray-500 focus:bg-white/10 transition-colors"
          />
          <button
            id="btn-send-crisis"
            class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-obsidian-950 font-bold text-xs active:scale-95 transition-all"
          >
            Gönder
          </button>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelector('#btn-close-crisis')?.addEventListener('click', () => this.hide());

    const input = this.container.querySelector('#crisis-chat-input') as HTMLInputElement;
    const sendBtn = this.container.querySelector('#btn-send-crisis');

    const doSend = () => {
      if (input && input.value.trim()) {
        this.sendMessage(input.value);
        input.value = '';
      }
    };

    sendBtn?.addEventListener('click', doSend);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSend();
    });

    this.container.querySelector('#btn-broadcast-safe')?.addEventListener('click', () => {
      this.sendMessage('Durumum iyi, ailemle birlikte güvendeyim.', 'safe');
    });

    this.container.querySelector('#btn-broadcast-help')?.addEventListener('click', () => {
      this.sendMessage('ACİL YARDIM ÇAĞRISI: Konumum bildirildi, lütfen arama kurtarma yönlendirin!', 'help');
    });

    this.container.querySelector('#btn-open-crisis-qr')?.addEventListener('click', () => {
      if (this.onOpenQRPack) {
        this.hide();
        this.onOpenQRPack('SAFE');
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
