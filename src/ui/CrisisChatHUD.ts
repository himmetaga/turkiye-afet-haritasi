import { Icons } from './icons';
import { bitChatService, BitChatMessage } from '../services/bitChatService';
import { LEGAL_DISCLAIMER } from '../services/antiManipulationService';
import { setupModalMobileDismiss, registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';
import { escapeHtml } from '../utils/safeText';

const NOT_SENT_NOTICE =
  'İnternet bağlantısı yok: mesajınız GÖNDERİLMEDİ. Bu cihazda kuyruğa alındı, bağlantı gelince iletilmeye çalışılacak.';
const SOS_NOT_SENT_NOTICE =
  "İnternet bağlantısı yok: imdat çağrınız İLETİLMEDİ. Hemen 112'yi arayın; arama olmuyorsa SMS deneyin.";

export class CrisisChatHUD {
  private container: HTMLElement;
  private userCoords: [number, number];
  // Şehir/ilçe bilinmiyorsa boş kalır; asla varsayılan bir yer adı gönderilmez.
  private currentCity = '';
  private currentDistrict = '';
  private onOpenQRPack?: (status: 'SAFE' | 'HELP') => void;
  private unsubscribeMessages?: () => void;
  private unsubscribeStatus?: () => void;
  private networkStatus = { connectedRelays: 0 };

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

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide(),
      closeBtnSelector: '#btn-close-crisis'
    });

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

  public setUserLocation(coords: [number, number], city = '', district = ''): void {
    this.userCoords = coords;
    this.currentCity = city;
    this.currentDistrict = district;
  }

  public show(): void {
    this.container.classList.remove('hidden');
    registerModalOpen('crisis-chat-modal', () => this.hide());
    // Connect to public Nostr relays in background
    bitChatService.connectRelays();
    this.render();
  }

  public hide(): void {
    registerModalClose('crisis-chat-modal');
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

    const relays = Number(this.networkStatus.connectedRelays) || 0;
    if (relays > 0) {
      badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1';
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Bağlı: ${relays} röle`;
    } else {
      badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1';
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Çevrimdışı — mesajlar gönderilmiyor`;
    }

    const offlineBar = this.container.querySelector('#bitchat-offline-bar');
    if (offlineBar) offlineBar.classList.toggle('hidden', relays > 0);
  }

  private renderMessage(m: BitChatMessage): string {
    const rep = bitChatService.getMessageReputation(m.id);
    const isSOS = m.type === 'sos';
    const isSafe = m.type === 'safe';
    const cardBorder = isSOS
      ? 'border-rose-500/50 bg-rose-500/15 shadow-glow-rose animate-pulse'
      : isSafe
      ? 'border-emerald-500/30 bg-emerald-500/5'
      : 'border-white/5 bg-white/5';

    const transportBadge = m.pending
      ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">⏳ Kuyrukta (iletilmedi)</span>'
      : m.transport === 'nostr'
      ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">Röle</span>'
      : '<span class="text-[9px] px-1.5 py-0.2 rounded bg-gray-500/20 text-gray-300 border border-gray-500/30 font-mono">Yalnızca bu cihazda</span>';

    const pubkeyPrefix = m.pubkey ? escapeHtml(String(m.pubkey).slice(0, 8)) : '';

    const warningBanner = m.warningNotice
      ? `
      <div class="p-1.5 mb-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10.5px] text-amber-200">
        ${escapeHtml(m.warningNotice)}
      </div>
    `
      : '';

    const timeAgo = this.formatTimeAgo(m.timestamp);

    return `
    <div class="p-3 rounded-xl border ${cardBorder} text-xs transition-all">
      ${warningBanner}
      <div class="flex items-center justify-between gap-1 mb-1.5">
        <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span class="font-bold truncate ${isSOS ? 'text-rose-400' : isSafe ? 'text-emerald-400' : 'text-gray-200'}">
            ${escapeHtml(m.senderName)}
          </span>
          ${pubkeyPrefix ? `<span class="text-[9px] text-gray-500 font-mono" title="Gönderen anahtarının ilk haneleri">#${pubkeyPrefix}</span>` : ''}
          ${transportBadge}
          ${m.district ? `<span class="text-[10px] text-gray-400 font-mono">(${escapeHtml(m.district)})</span>` : ''}
        </div>
        <div class="flex items-center gap-2 text-[10px] text-gray-400 font-mono flex-shrink-0">
          ${m.batteryLevel !== undefined ? `<span>🔋 %${escapeHtml(m.batteryLevel)}</span>` : ''}
          <span>${escapeHtml(timeAgo)}</span>
        </div>
      </div>
      <p class="text-gray-200 leading-relaxed font-normal">${escapeHtml(m.text)}</p>

      <!-- Kişisel not: yalnızca bu cihazda saklanır, kimseye iletilmez -->
      <div class="flex items-center justify-end gap-2 mt-2 pt-1.5 border-t border-white/5 text-[10.5px]">
        <span class="text-gray-500 mr-auto">Kendi notum (paylaşılmaz):</span>
        <button
          type="button"
          class="btn-verify-msg flex items-center gap-1 px-2 py-0.5 rounded-md ${
            rep.userVoted === 'verify'
              ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
              : 'bg-white/5 text-gray-400 hover:text-emerald-300'
          } transition-all cursor-pointer"
          data-id="${escapeHtml(m.id)}"
          title="Bu mesajı kendim için güvenilir olarak işaretle"
        >
          <span>Güvenilir</span>
        </button>
        <button
          type="button"
          class="btn-flag-msg flex items-center gap-1 px-2 py-0.5 rounded-md ${
            rep.userVoted === 'flag'
              ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40'
              : 'bg-white/5 text-gray-400 hover:text-rose-300'
          } transition-all cursor-pointer"
          data-id="${escapeHtml(m.id)}"
          title="Bu mesajı kendim için şüpheli olarak işaretle"
        >
          <span>Şüpheli</span>
        </button>
      </div>
    </div>
  `;
  }

  private render(): void {
    const identity = bitChatService.getIdentity();
    const activeChannel = bitChatService.getActiveChannel();
    const messages = bitChatService.getMessages(activeChannel);

    const citySlug = this.currentCity.toLowerCase().replace(/[^a-z0-9]/g, '');
    const channels = [
      { id: '#afet-genel', label: 'Genel Koordinasyon' },
      { id: '#afet-enkaz', label: '🚨 Enkaz & Acil İmdat' },
      ...(citySlug ? [{ id: `#afet-${citySlug}`, label: `📍 ${this.currentCity}` }] : []),
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
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-bold text-white tracking-wide">
                  Afet Sohbeti (herkese açık)
                </h3>
                <div id="bitchat-network-badge"></div>
              </div>
              <p class="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                <span>Rumuz:</span>
                <button id="btn-edit-alias" type="button" class="text-cyan-300 hover:underline font-mono font-semibold" title="Rumuz Değiştir">
                  ${escapeHtml(identity.alias)} (#${escapeHtml(identity.pubkey.slice(0, 8))}) ✏️
                </button>
              </p>
            </div>
          </div>

          <button id="btn-close-crisis" type="button" class="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-gray-300 hover:text-white cursor-pointer touch-manipulation" title="Kapat">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Hukuki Sorumluluk Reddi & Teyit Uyarısı -->
        <div class="px-3.5 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[10.5px] text-amber-200/90 flex items-center justify-between gap-1 flex-shrink-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="font-bold text-amber-300 flex-shrink-0">⚠️ Teyitsiz mesajlar:</span>
            <span class="truncate">112/AFAD yerine geçmez, kimse mesajları doğrulamaz. İnternet gerekir. Önce 112'yi arayın.</span>
          </div>
          <button id="btn-show-legal-disclaimer" type="button" class="text-amber-300 hover:text-white underline flex-shrink-0 text-[10px] font-semibold cursor-pointer">Şartlar</button>
        </div>

        <!-- Çevrimdışı uyarısı -->
        <div id="bitchat-offline-bar" class="hidden px-3.5 py-2 bg-rose-500/20 border-b border-rose-500/40 text-[11px] text-rose-100 font-semibold flex-shrink-0">
          Bağlantı yok: yazdığınız mesajlar ve imdat çağrıları şu anda KİMSEYE ULAŞMIYOR. Acil durumda 112'yi arayın.
        </div>

        <!-- Channel Tabs -->
        <div class="flex items-center gap-1.5 p-2 bg-white/[0.02] border-b border-white/5 overflow-x-auto text-xs no-scrollbar flex-shrink-0">
          ${channels
            .map((ch) => {
              const isActive = ch.id === activeChannel;
              return `
                <button
                  type="button"
                  data-channel="${escapeHtml(ch.id)}"
                  class="btn-channel px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                      : 'bg-white/5 border border-transparent text-gray-400 hover:text-gray-200'
                  }"
                >
                  ${escapeHtml(ch.label)}
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
              id="btn-open-crisis-qr"
              type="button"
              class="flex-1 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 font-medium flex items-center justify-center gap-1 transition-all"
            >
              <span>📱</span><span>QR Kod ile Durum Paylaş</span>
            </button>
            <button
              id="btn-emergency-wipe"
              type="button"
              class="py-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-medium transition-all"
              title="Bu cihazdaki mesaj geçmişini ve kimlik anahtarını siler. Rölelere ulaşmış mesajlar silinemez."
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
              Bu kanalda henüz mesaj bulunmuyor.
            </div>
          `
              : messages.map((m) => this.renderMessage(m)).join('')
          }
        </div>

        <!-- Chat Input Bar -->
        <div class="p-3 border-t border-white/10 bg-obsidian-950/80 flex items-center gap-2 flex-shrink-0">
          <input
            id="crisis-chat-input"
            type="text"
            maxlength="280"
            placeholder="${escapeHtml(activeChannel)} kanalında durum paylaşın..."
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

  /** Konum bilgisi: şehir/ilçe yalnızca gerçekten biliniyorsa eklenir. */
  private buildMeta(batteryLevel: number | undefined) {
    return {
      city: this.currentCity || undefined,
      district: this.currentDistrict || undefined,
      coordinates: this.userCoords,
      batteryLevel
    };
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
        try {
          const bat = await this.getBatteryPercent();
          const result = await bitChatService.broadcastMessage(input.value, 'chat', this.buildMeta(bat));
          input.value = '';
          if (!result.sent) alert(NOT_SENT_NOTICE);
        } catch (err: any) {
          alert(err.message || 'Mesaj gönderilemedi.');
        }
      }
    };

    sendBtn?.addEventListener('click', doSend);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSend();
    });

    // 1-Click Safe Beacon
    this.container.querySelector('#btn-broadcast-safe')?.addEventListener('click', async () => {
      try {
        const bat = await this.getBatteryPercent();
        const result = await bitChatService.broadcastMessage('Durumum iyi, güvendeyim.', 'safe', this.buildMeta(bat));
        if (!result.sent) alert(NOT_SENT_NOTICE);
      } catch (err: any) {
        alert(err.message || 'Durum bildirilemedi.');
      }
    });

    // 1-Click SOS Beacon
    this.container.querySelector('#btn-broadcast-help')?.addEventListener('click', async () => {
      try {
        const bat = await this.getBatteryPercent();
        const result = await bitChatService.broadcastMessage(
          `🚨 ACİL İMDAT / ENKAZ ÇAĞRISI: Konum [${this.userCoords[1].toFixed(5)}, ${this.userCoords[0].toFixed(5)}]. Yardıma ihtiyacım var.`,
          'sos',
          this.buildMeta(bat)
        );
        if (!result.sent) alert(SOS_NOT_SENT_NOTICE);
      } catch (err: any) {
        alert(err.message || 'İmdat çağrısı gönderilemedi.');
      }
    });

    // Kişisel not düğmeleri (yalnızca bu cihazda saklanır)
    this.container.querySelectorAll('.btn-verify-msg').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          bitChatService.voteMessage(id, 'verify');
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.btn-flag-msg').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          bitChatService.voteMessage(id, 'flag');
          this.render();
        }
      });
    });

    // Hukuki Sorumluluk Reddi Bildirimi
    this.container.querySelector('#btn-show-legal-disclaimer')?.addEventListener('click', () => {
      alert(LEGAL_DISCLAIMER.fullText);
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
      if (
        confirm(
          'DİKKAT: Bu cihazdaki sohbet geçmişi, gönderim kuyruğu ve kimlik anahtarı silinecek; yeni bir kimlik oluşturulacak. Daha önce rölelere ulaşmış mesajlar silinemez. Emin misiniz?'
        )
      ) {
        bitChatService.emergencyWipe();
        this.render();
      }
    });

    const closeBtn = this.container.querySelector('#btn-close-crisis');
    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });
    closeBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });
  }

  private formatTimeAgo(timestamp: number): string {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (!Number.isFinite(diff)) return '';
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    return `${Math.floor(diff / 3600)} sa önce`;
  }
}
