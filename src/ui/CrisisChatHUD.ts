import { Icons } from './icons';
import { bitChatService, BitChatMessage } from '../services/bitChatService';

export class CrisisChatHUD {
  private container: HTMLElement;
  private userCoords: [number, number];
  private currentCity = 'İstanbul';
  private currentDistrict = 'Kadıköy';
  private onOpenQRPack?: (status: 'SAFE' | 'HELP') => void;
  private unsubscribeMessages?: () => void;
  private unsubscribeStatus?: () => void;
  private networkStatus = { connectedRelays: 0, meshPeers: 1 };
  private isPairingModalOpen = false;

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
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md hidden transition-all';
    parent.appendChild(this.container);

    this.initSubscriptions();
  }

  private initSubscriptions(): void {
    this.unsubscribeMessages = bitChatService.subscribeMessages(() => {
      this.render();
    });

    this.unsubscribeStatus = bitChatService.subscribeStatus((st) => {
      this.networkStatus = st;
      this.updateStatusBadge();
    });
  }

  public setUserLocation(coords: [number, number], city = 'İstanbul', district = 'Kadıköy'): void {
    this.userCoords = coords;
    this.currentCity = city;
    this.currentDistrict = district;
  }

  public show(): void {
    this.container.classList.remove('hidden');
    // Connect to public Nostr relays in background
    bitChatService.connectRelays();
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
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

  private updateStatusBadge(): void {
    const badge = this.container.querySelector('#bitchat-network-badge');
    if (!badge) return;

    const relays = this.networkStatus.connectedRelays;
    if (relays > 0) {
      badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1';
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Nostr: ${relays} Röle • P2P Mesh`;
    } else {
      badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1';
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Yerel Mesh (Çevrimdışı P2P)`;
    }
  }

  private render(): void {
    const identity = bitChatService.getIdentity();
    const activeChannel = bitChatService.getActiveChannel();
    const messages = bitChatService.getMessages(activeChannel);

    const channels = [
      { id: '#afet-genel', label: 'Genel Koordinasyon' },
      { id: '#afet-enkaz', label: '🚨 Enkaz & Acil İmdat' },
      { id: `#afet-${this.currentCity.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yerel'}`, label: `📍 ${this.currentCity}` },
      { id: '#afet-lojistik', label: 'Erzak & Su' }
    ];

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-obsidian-900/95 border border-white/10 shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-obsidian-950/60 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
              ${Icons.messages('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm sm:text-base font-bold text-white tracking-wide">
                  BitChat Afet Ağı
                </h3>
                <div id="bitchat-network-badge"></div>
              </div>
              <p class="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                <span>Kimlik:</span>
                <button id="btn-edit-alias" type="button" class="text-cyan-300 hover:underline font-mono font-semibold" title="Rumuz Değiştir">
                  ${identity.alias} (${identity.pubkey}) ✏️
                </button>
              </p>
            </div>
          </div>

          <button id="btn-close-crisis" type="button" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white">
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Channel Tabs -->
        <div class="flex items-center gap-1.5 p-2 bg-white/[0.02] border-b border-white/5 overflow-x-auto text-xs no-scrollbar flex-shrink-0">
          ${channels
            .map((ch) => {
              const isActive = ch.id === activeChannel;
              return `
                <button
                  type="button"
                  data-channel="${ch.id}"
                  class="btn-channel px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                      : 'bg-white/5 border border-transparent text-gray-400 hover:text-gray-200'
                  }"
                >
                  ${ch.label}
                </button>
              `;
            })
            .join('')}
        </div>

        <!-- Quick 1-Click Action Bar -->
        <div class="p-2.5 sm:p-3 bg-white/[0.03] border-b border-white/5 flex flex-col gap-2 flex-shrink-0">
          <div class="flex items-center gap-2">
            <button
              id="btn-broadcast-safe"
              type="button"
              class="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-bold text-xs shadow-glow-emerald active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>✓ Güvendeyim</span>
            </button>
            <button
              id="btn-broadcast-help"
              type="button"
              class="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-glow-rose active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🚨 Acil İmdat / Enkaz</span>
            </button>
          </div>

          <div class="flex items-center gap-2 text-[11px]">
            <button
              id="btn-webrtc-pair"
              type="button"
              class="flex-1 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-medium flex items-center justify-center gap-1 transition-all"
            >
              <span>🔗</span><span>Cihaz Eşle (P2P WebRTC)</span>
            </button>
            <button
              id="btn-open-crisis-qr"
              type="button"
              class="flex-1 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 font-medium flex items-center justify-center gap-1 transition-all"
            >
              <span>📱</span><span>Hava Boşluğu (QR Kod)</span>
            </button>
            <button
              id="btn-emergency-wipe"
              type="button"
              class="py-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-medium transition-all"
              title="Acil Temizle: Cihazdaki tüm mesajları ve anahtarları kalıcı olarak siler"
            >
              <span>🧹 Sıfırla</span>
            </button>
          </div>
        </div>

        <!-- Message Feed List -->
        <div class="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 min-h-[220px]">
          ${
            messages.length === 0
              ? `
            <div class="text-center py-10 text-xs text-gray-500">
              Bu kanalda henüz mesaj bulunmuyor. İlk durumu siz paylaşın.
            </div>
          `
              : messages
                  .map((m) => {
                    const isSOS = m.type === 'sos';
                    const isSafe = m.type === 'safe';
                    const cardBorder = isSOS
                      ? 'border-rose-500/50 bg-rose-500/15 shadow-glow-rose animate-pulse'
                      : isSafe
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/5 bg-white/5';

                    const transportBadge =
                      m.transport === 'nostr'
                        ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">Nostr</span>'
                        : m.transport === 'webrtc'
                        ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">P2P</span>'
                        : '<span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">Mesh</span>';

                    const timeAgo = this.formatTimeAgo(m.timestamp);

                    return `
                    <div class="p-3 rounded-xl border ${cardBorder} text-xs">
                      <div class="flex items-center justify-between gap-1 mb-1">
                        <div class="flex items-center gap-1.5 min-w-0">
                          <span class="font-bold truncate ${isSOS ? 'text-rose-400' : isSafe ? 'text-emerald-400' : 'text-gray-200'}">
                            ${m.senderName}
                          </span>
                          ${transportBadge}
                          ${m.district ? `<span class="text-[10px] text-gray-400 font-mono">(${m.district})</span>` : ''}
                        </div>
                        <div class="flex items-center gap-2 text-[10px] text-gray-400 font-mono flex-shrink-0">
                          ${m.batteryLevel !== undefined ? `<span>🔋 %${m.batteryLevel}</span>` : ''}
                          <span>${timeAgo}</span>
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
        <div class="p-3 border-t border-white/10 bg-obsidian-950/80 flex items-center gap-2 flex-shrink-0">
          <input
            id="crisis-chat-input"
            type="text"
            maxlength="280"
            placeholder="${activeChannel} kanalında durum paylaşın..."
            class="flex-1 px-3 py-2 text-xs text-white bg-white/5 rounded-xl border border-white/10 outline-none placeholder-gray-500 focus:border-cyan-500/50 transition-colors"
          />
          <button
            id="btn-send-crisis"
            type="button"
            class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-bold text-xs active:scale-95 transition-all"
          >
            Gönder
          </button>
        </div>
      </div>
    `;

    this.updateStatusBadge();
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    this.container.querySelector('#btn-close-crisis')?.addEventListener('click', () => this.hide());

    // Channel Switching
    this.container.querySelectorAll('.btn-channel').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ch = btn.getAttribute('data-channel');
        if (ch) {
          bitChatService.setActiveChannel(ch);
          this.render();
        }
      });
    });

    // Send Message
    const input = this.container.querySelector('#crisis-chat-input') as HTMLInputElement;
    const sendBtn = this.container.querySelector('#btn-send-crisis');

    const doSend = async () => {
      if (input && input.value.trim()) {
        const bat = await this.getBatteryPercent();
        await bitChatService.broadcastMessage(input.value, 'chat', {
          city: this.currentCity,
          district: this.currentDistrict,
          coordinates: this.userCoords,
          batteryLevel: bat
        });
        input.value = '';
      }
    };

    sendBtn?.addEventListener('click', doSend);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSend();
    });

    // 1-Click Safe Beacon
    this.container.querySelector('#btn-broadcast-safe')?.addEventListener('click', async () => {
      const bat = await this.getBatteryPercent();
      await bitChatService.broadcastMessage(
        'Durumum iyi, ailemle birlikte güvendeyiz.',
        'safe',
        {
          city: this.currentCity,
          district: this.currentDistrict,
          coordinates: this.userCoords,
          batteryLevel: bat
        }
      );
    });

    // 1-Click SOS Beacon
    this.container.querySelector('#btn-broadcast-help')?.addEventListener('click', async () => {
      const bat = await this.getBatteryPercent();
      await bitChatService.broadcastMessage(
        `🚨 ACİL İMDAT / ENKAZ ÇAĞRISI: Konum [${this.userCoords[1].toFixed(5)}, ${this.userCoords[0].toFixed(5)}], acil kurtarma ve sağlık ekibi yönlendirin!`,
        'sos',
        {
          city: this.currentCity,
          district: this.currentDistrict,
          coordinates: this.userCoords,
          batteryLevel: bat
        }
      );
    });

    // QR Mode
    this.container.querySelector('#btn-open-crisis-qr')?.addEventListener('click', () => {
      if (this.onOpenQRPack) {
        this.hide();
        this.onOpenQRPack('SAFE');
      }
    });

    // Alias Edit
    this.container.querySelector('#btn-edit-alias')?.addEventListener('click', () => {
      const newAlias = prompt('Yeni rumuzunuzu girin:', bitChatService.getIdentity().alias);
      if (newAlias) {
        bitChatService.setAlias(newAlias);
        this.render();
      }
    });

    // Emergency Wipe
    this.container.querySelector('#btn-emergency-wipe')?.addEventListener('click', () => {
      if (confirm('DİKKAT: Cihazdaki tüm sohbet geçmişi ve kimlik anahtarları kalıcı olarak silinecek. Emin misiniz?')) {
        bitChatService.emergencyWipe();
        this.render();
      }
    });

    // WebRTC Direct Pairing Modal / Prompt
    this.container.querySelector('#btn-webrtc-pair')?.addEventListener('click', async () => {
      try {
        const offer = await bitChatService.createWebRTCOffer();
        prompt('P2P WebRTC Bağlantı Kodunuz (Karşı cihaza gönderin veya yapıştırın):', offer);
      } catch {
        alert('WebRTC doğrudan eşleme başlatılamadı. Nostr veya QR modu kullanılabilir.');
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }

  private formatTimeAgo(timestamp: number): string {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    return `${Math.floor(diff / 3600)} sa önce`;
  }
}
