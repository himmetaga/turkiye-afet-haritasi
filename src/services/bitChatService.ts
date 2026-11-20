import { antiManipulationService } from './antiManipulationService';
import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools/pure';

export interface BitChatMessage {
  id: string;
  pubkey: string;
  senderName: string;
  text: string;
  timestamp: number;
  channel: string; // e.g. '#afet-genel', '#afet-istanbul', '#afet-enkaz'
  type: 'chat' | 'safe' | 'sos';
  city?: string;
  district?: string;
  coordinates?: [number, number];
  batteryLevel?: number;
  /**
   * 'nostr': bir Nostr rölesi üzerinden geldi/gitti.
   * 'mesh': yalnızca bu cihazda (aynı tarayıcının sekmeleri arasında) duruyor.
   * 'webrtc' ve 'qr' eski kayıtlarla uyum için tutuluyor.
   */
  transport: 'nostr' | 'mesh' | 'webrtc' | 'qr';
  /** Kendi mesajımız henüz hiçbir röleye iletilemediyse true. */
  pending?: boolean;
  warningNotice?: string;
}

/** broadcastMessage sonucu: mesajın kendisi + gerçekten gönderilip gönderilmediği. */
export type BitChatBroadcastResult = BitChatMessage & {
  /** En az bir bağlı röleye yazılabildiyse true. false ise mesaj yalnızca kuyruktadır. */
  sent: boolean;
  /** Mesajın yazıldığı röle sayısı. */
  relays: number;
};

export interface BitChatIdentity {
  pubkey: string;
  alias: string;
  createdAt: number;
}

const STORAGE_IDENTITY_KEY = 'afet_bitchat_identity_v2';
const STORAGE_SK_KEY = 'afet_bitchat_sk_v2';
const STORAGE_MESSAGES_KEY = 'afet_bitchat_messages_v1';
const STORAGE_OUTBOX_KEY = 'afet_bitchat_outbox_v1';
const BROADCAST_CHANNEL_NAME = 'afet_bitchat_mesh_bus';

const DEFAULT_RELAYS = [
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://relay.snort.social',
  'wss://nostr.mom'
];

const MESSAGE_TYPES = new Set(['chat', 'safe', 'sos']);
const TRANSPORTS = new Set(['nostr', 'mesh', 'webrtc', 'qr']);
const CHANNEL_PATTERN = /^#[a-z0-9-]{1,40}$/;

type MessageListener = (msg: BitChatMessage) => void;
type StatusListener = (status: { connectedRelays: number }) => void;

function cleanString(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

/**
 * Dışarıdan (başka sekme, yerel önbellek) gelen ham nesneyi, yalnızca bilinen ve
 * tipi doğrulanmış alanlardan yeniden kurar. Tanınmayan alanlar atılır.
 */
function buildValidatedMessage(raw: unknown): BitChatMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = cleanString(r.id, 128);
  const text = cleanString(r.text, 1000);
  if (!id || !text) return null;

  const timestamp = Number(r.timestamp);
  if (!Number.isFinite(timestamp)) return null;

  const channelRaw = cleanString(r.channel, 41);
  const channel = channelRaw && CHANNEL_PATTERN.test(channelRaw) ? channelRaw : '#afet-genel';
  const type = (typeof r.type === 'string' && MESSAGE_TYPES.has(r.type) ? r.type : 'chat') as BitChatMessage['type'];
  const transport = (typeof r.transport === 'string' && TRANSPORTS.has(r.transport)
    ? r.transport
    : 'mesh') as BitChatMessage['transport'];

  const msg: BitChatMessage = {
    id,
    pubkey: cleanString(r.pubkey, 64) || '',
    senderName: cleanString(r.senderName, 40) || 'Bilinmeyen',
    text,
    timestamp,
    channel,
    type,
    transport
  };

  const city = cleanString(r.city, 60);
  if (city) msg.city = city;
  const district = cleanString(r.district, 60);
  if (district) msg.district = district;

  if (
    Array.isArray(r.coordinates) &&
    r.coordinates.length === 2 &&
    typeof r.coordinates[0] === 'number' &&
    typeof r.coordinates[1] === 'number' &&
    Number.isFinite(r.coordinates[0]) &&
    Number.isFinite(r.coordinates[1])
  ) {
    msg.coordinates = [r.coordinates[0], r.coordinates[1]];
  }

  if (typeof r.batteryLevel === 'number' && Number.isFinite(r.batteryLevel)) {
    msg.batteryLevel = Math.max(0, Math.min(100, Math.round(r.batteryLevel)));
  }

  if (r.pending === true) msg.pending = true;

  // Uyarı metni dışarıdan alınmaz; varsa yerelde yeniden üretilir.
  if (typeof r.warningNotice === 'string') {
    const heuristic = antiManipulationService.analyzeTextSafety(text);
    if (heuristic.warningMessage) msg.warningNotice = heuristic.warningMessage;
  }

  return msg;
}

class BitChatService {
  private secretKey: Uint8Array;
  private identity: BitChatIdentity;
  private messages: BitChatMessage[] = [];
  private outboxQueue: string[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private sockets: Map<string, WebSocket> = new Map();
  private activeChannel = '#afet-genel';
  private isConnectingRelays = false;

  constructor() {
    this.secretKey = this.loadOrCreateSecretKey();
    this.identity = this.loadOrCreateIdentity();
    this.loadCachedMessages();
    this.loadOutboxQueue();
    this.initBroadcastChannel();
    // Start listening to Nostr relays immediately in background
    this.connectRelays();
  }

  /** Şu anda gerçekten açık olan röle bağlantısı sayısı. */
  private openRelayCount(): number {
    let count = 0;
    this.sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) count++;
    });
    return count;
  }

  /** Ham Nostr olayını açık rölelere yazar; yazılabilen röle sayısını döndürür. */
  private sendToRelays(rawEvent: string): number {
    let sent = 0;
    this.sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(rawEvent);
          sent++;
        } catch {}
      }
    });
    return sent;
  }

  private loadOutboxQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_OUTBOX_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.outboxQueue = Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
      }
    } catch {}
  }

  private saveOutboxQueue(): void {
    try {
      localStorage.setItem(STORAGE_OUTBOX_KEY, JSON.stringify(this.outboxQueue));
    } catch {}
  }

  private flushOutbox(): void {
    if (this.outboxQueue.length === 0 || this.openRelayCount() === 0) return;
    const remaining: string[] = [];
    let changed = false;
    for (const rawEvent of this.outboxQueue) {
      if (this.sendToRelays(rawEvent) === 0) {
        remaining.push(rawEvent);
        continue;
      }
      // Kuyruktaki mesaj artık iletildi: "bekliyor" işaretini kaldır.
      try {
        const parsed = JSON.parse(rawEvent);
        const eventId = Array.isArray(parsed) ? parsed[1]?.id : undefined;
        const local = this.messages.find((m) => m.id === eventId);
        if (local && local.pending) {
          local.pending = false;
          local.transport = 'nostr';
          changed = true;
          this.messageListeners.forEach((listener) => listener(local));
        }
      } catch {}
    }
    this.outboxQueue = remaining;
    this.saveOutboxQueue();
    if (changed) this.saveMessages();
  }

  private loadOrCreateSecretKey(): Uint8Array {
    try {
      const stored = localStorage.getItem(STORAGE_SK_KEY);
      if (stored && stored.length === 64) {
        const arr = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          arr[i] = parseInt(stored.slice(i * 2, i * 2 + 2), 16);
        }
        return arr;
      }
    } catch {}

    const sk = generateSecretKey();
    const hex = Array.from(sk).map((b) => b.toString(16).padStart(2, '0')).join('');
    try {
      localStorage.setItem(STORAGE_SK_KEY, hex);
    } catch {}
    return sk;
  }

  private loadOrCreateIdentity(): BitChatIdentity {
    const fullPubkey = getPublicKey(this.secretKey);
    try {
      const stored = localStorage.getItem(STORAGE_IDENTITY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.pubkey === fullPubkey) {
          return {
            pubkey: fullPubkey,
            alias: cleanString(parsed.alias, 24) || `AfetZede-${fullPubkey.slice(0, 4)}`,
            createdAt: Number.isFinite(Number(parsed.createdAt)) ? Number(parsed.createdAt) : Date.now()
          };
        }
      }
    } catch {}

    const shortId = fullPubkey.slice(0, 4);
    const newIdentity: BitChatIdentity = {
      pubkey: fullPubkey,
      alias: `AfetZede-${shortId}`,
      createdAt: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(newIdentity));
    } catch {}

    return newIdentity;
  }

  public getIdentity(): BitChatIdentity {
    return this.identity;
  }

  public setAlias(newAlias: string): void {
    const trimmed = newAlias.trim();
    if (!trimmed) return;
    this.identity.alias = trimmed.slice(0, 24);
    try {
      localStorage.setItem(STORAGE_IDENTITY_KEY, JSON.stringify(this.identity));
    } catch {}
  }

  private loadCachedMessages(): void {
    this.messages = [];
    try {
      const stored = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          for (const raw of parsed) {
            const msg = buildValidatedMessage(raw);
            // Eski sürümlerin eklediği örnek (gerçek olmayan) mesajları temizle
            if (msg && !msg.id.startsWith('bitchat-init-')) this.messages.push(msg);
          }
        }
      }
    } catch {}
    // Sohbet boş başlar: örnek/sahte mesaj gösterilmez (afet anında yanıltıcı olabilir).
  }

  private saveMessages(): void {
    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(this.messages.slice(0, 100)));
    } catch {}
  }

  /** Yalnızca aynı tarayıcının diğer sekmeleriyle eşitleme sağlar; başka cihaza ulaşmaz. */
  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'BITCHAT_MSG') {
            const msg = buildValidatedMessage(event.data.message);
            if (msg) this.handleIncomingMessage(msg, false);
          }
        };
      } catch {}
    }
  }

  public connectRelays(): void {
    if (this.isConnectingRelays) return;
    this.isConnectingRelays = true;

    DEFAULT_RELAYS.forEach((relayUrl) => {
      this.connectSingleRelay(relayUrl);
    });
  }

  private connectSingleRelay(relayUrl: string): void {
    if (this.sockets.has(relayUrl) && this.sockets.get(relayUrl)?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(relayUrl);
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
        }
      }, 7000);

      ws.onopen = () => {
        clearTimeout(timeout);
        this.notifyStatus();
        this.flushOutbox();

        // Subscribe to disaster messages with tag 'afet-live'
        const subId = `afet-sub-${Math.random().toString(36).slice(2, 6)}`;
        const req = JSON.stringify([
          'REQ',
          subId,
          {
            kinds: [1],
            '#t': ['afet-live'],
            limit: 40
          }
        ]);
        ws.send(req);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data) && data[0] === 'EVENT' && data[2]?.content) {
            const ev = data[2];
            // İmzası ve kimliği doğrulanamayan olaylar gösterilmez.
            let isValid = false;
            try {
              isValid = verifyEvent(ev);
            } catch {
              isValid = false;
            }
            if (!isValid) return;

            const tagMap = new Map<string, string>();
            if (Array.isArray(ev.tags)) {
              for (const t of ev.tags) {
                if (Array.isArray(t) && t.length >= 2) {
                  tagMap.set(String(t[0]), String(t[1]));
                }
              }
            }

            const msg = buildValidatedMessage({
              id: String(ev.id),
              pubkey: String(ev.pubkey),
              senderName: tagMap.get('alias') || `AfetZede-${String(ev.pubkey).slice(0, 4)}`,
              text: String(ev.content),
              timestamp: Number(ev.created_at) * 1000,
              channel: tagMap.get('channel') || '#afet-genel',
              type: tagMap.get('disaster_type') || 'chat',
              city: tagMap.get('city') || '',
              district: tagMap.get('district') || '',
              transport: 'nostr'
            });
            if (msg) this.handleIncomingMessage(msg, false);
          }
        } catch {}
      };

      ws.onclose = () => {
        clearTimeout(timeout);
        if (this.sockets.get(relayUrl) === ws) {
          this.sockets.delete(relayUrl);
        }
        this.notifyStatus();
        // Auto-reconnect to ensure cross-device messages always sync
        setTimeout(() => {
          this.connectSingleRelay(relayUrl);
        }, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      this.sockets.set(relayUrl, ws);
    } catch {}
  }

  private notifyStatus(): void {
    const status = { connectedRelays: this.openRelayCount() };
    this.statusListeners.forEach((l) => l(status));
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener({ connectedRelays: this.openRelayCount() });
    return () => this.statusListeners.delete(listener);
  }

  public subscribeMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public getMessages(channel = this.activeChannel): BitChatMessage[] {
    return this.messages.filter((m) => m.channel === channel || m.type === 'sos');
  }

  public setActiveChannel(ch: string): void {
    this.activeChannel = ch;
  }

  public getActiveChannel(): string {
    return this.activeChannel;
  }

  private handleIncomingMessage(msg: BitChatMessage, propagate = true): void {
    // Avoid duplicates
    if (this.messages.some((m) => m.id === msg.id)) return;

    this.messages.unshift(msg);
    if (this.messages.length > 200) {
      this.messages = this.messages.slice(0, 200);
    }
    this.saveMessages();

    this.messageListeners.forEach((listener) => listener(msg));

    if (propagate && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'BITCHAT_MSG', message: msg });
      } catch {}
    }
  }

  /**
   * Mesajı imzalar ve bağlı Nostr rölelerine yazar.
   *
   * - Hız sınırına takılırsa Promise reddedilir (Error).
   * - Çözülen değer mesajın kendisidir; ek olarak `sent` (en az bir röleye
   *   yazıldı mı) ve `relays` (kaç röleye yazıldı) alanlarını taşır.
   *   `sent === false` ise mesaj GÖNDERİLMEMİŞTİR; yalnızca bu cihazda kuyruktadır
   *   ve bağlantı gelince iletilmeye çalışılır.
   */
  public async broadcastMessage(
    text: string,
    type: 'chat' | 'safe' | 'sos' = 'chat',
    meta?: { city?: string; district?: string; coordinates?: [number, number]; batteryLevel?: number }
  ): Promise<BitChatBroadcastResult> {
    // 1. Rate Limiter (Spam ve asılsız SOS engeli)
    const rateCheck = antiManipulationService.checkRateLimit(type === 'sos' ? 'sos' : 'chat');
    if (!rateCheck.allowed) {
      throw new Error(`Lütfen ${rateCheck.waitSeconds} sn bekleyin (Hızlı mesaj ve sahte ihbar engeli).`);
    }

    // 2. Heuristik Panik & Dezenformasyon Analizi
    const heuristic = antiManipulationService.analyzeTextSafety(text);

    // 3. Hashcash Proof-of-Work (gönderimi yavaşlatır; alıcı tarafta doğrulanmaz)
    const now = Date.now();
    const pow = await antiManipulationService.solveProofOfWork(`${this.identity.pubkey}:${now}:${text}`, type === 'sos' ? 12 : 10);

    const city = meta?.city?.trim() || undefined;
    const district = meta?.district?.trim() || undefined;

    const message: BitChatMessage = {
      id: `msg-${this.identity.pubkey}-${now}-${Math.random().toString(36).slice(2, 6)}`,
      pubkey: this.identity.pubkey,
      senderName: this.identity.alias,
      text: text.trim(),
      timestamp: now,
      channel: this.activeChannel,
      type,
      city,
      district,
      coordinates: meta?.coordinates,
      batteryLevel: meta?.batteryLevel,
      transport: 'mesh',
      pending: true,
      warningNotice: heuristic.warningMessage
    };

    // 4. Sign via BIP-340 Schnorr
    let nostrPayload: string | null = null;
    try {
      const finalized = finalizeEvent(
        {
          kind: 1,
          created_at: Math.floor(now / 1000),
          tags: [
            ['t', 'afet-live'],
            ['channel', this.activeChannel],
            ['disaster_type', type],
            ['alias', this.identity.alias],
            ['city', city || ''],
            ['district', district || ''],
            ['nonce', String(pow.nonce), String(pow.difficulty)],
            ['client', 'afet.live-bitchat']
          ],
          content: message.text
        },
        this.secretKey
      );
      message.id = finalized.id;
      nostrPayload = JSON.stringify(['EVENT', finalized]);
    } catch (err) {
      console.warn('Nostr sign error:', err);
    }

    // 5. Try to write to connected relays right now
    let relays = 0;
    if (nostrPayload) {
      relays = this.sendToRelays(nostrPayload);
      if (relays === 0) {
        // Bağlantı yok: kuyruğa al, bağlantı gelince denenecek.
        this.outboxQueue.push(nostrPayload);
        if (this.outboxQueue.length > 50) this.outboxQueue = this.outboxQueue.slice(-50);
        this.saveOutboxQueue();
      }
    }

    const sent = relays > 0;
    if (sent) {
      message.pending = false;
      message.transport = 'nostr';
    }

    // 6. Local append & sync to other tabs of this browser
    this.handleIncomingMessage(message, true);

    return { ...message, sent, relays };
  }

  /** Kullanıcının bir mesaj için kendi cihazına düştüğü kişisel not (başkalarına iletilmez). */
  public voteMessage(messageId: string, vote: 'verify' | 'flag') {
    return antiManipulationService.voteMessage(messageId, this.identity.pubkey, vote);
  }

  public getMessageReputation(messageId: string) {
    return antiManipulationService.getMessageReputation(messageId, this.identity.pubkey);
  }

  /**
   * Kimlik sıfırlama: bu cihazdaki mesaj geçmişini, gönderim kuyruğunu, takma adı
   * ve gizli anahtarı siler; yeni bir anahtar çifti üretir.
   * Not: daha önce rölelere ulaşmış mesajlar rölelerden silinemez.
   */
  public emergencyWipe(): void {
    try {
      localStorage.removeItem(STORAGE_IDENTITY_KEY);
      localStorage.removeItem(STORAGE_MESSAGES_KEY);
      localStorage.removeItem(STORAGE_SK_KEY);
      localStorage.removeItem(STORAGE_OUTBOX_KEY);
      sessionStorage.clear();
    } catch {}

    this.messages = [];
    this.outboxQueue = [];
    this.secretKey = this.loadOrCreateSecretKey();
    this.identity = this.loadOrCreateIdentity();

    this.messageListeners.forEach((l) =>
      l({
        id: 'wipe-notice',
        pubkey: 'system',
        senderName: 'Sistem',
        text: 'Bu cihazdaki mesaj geçmişi, gönderim kuyruğu ve kimlik anahtarı silindi; yeni bir kimlik oluşturuldu.',
        timestamp: Date.now(),
        channel: this.activeChannel,
        type: 'chat',
        transport: 'mesh'
      })
    );
  }
}

export const bitChatService = new BitChatService();
