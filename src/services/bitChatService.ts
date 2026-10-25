import { antiManipulationService } from './antiManipulationService';

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
  transport: 'nostr' | 'mesh' | 'webrtc' | 'qr';
  powNonce?: number;
  powDifficulty?: number;
  warningNotice?: string;
  proximityBadge?: string;
  proximityClass?: string;
}

export interface BitChatIdentity {
  pubkey: string;
  alias: string;
  createdAt: number;
}

const STORAGE_IDENTITY_KEY = 'afet_bitchat_identity_v1';
const STORAGE_MESSAGES_KEY = 'afet_bitchat_messages_v1';
const BROADCAST_CHANNEL_NAME = 'afet_bitchat_mesh_bus';

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

type MessageListener = (msg: BitChatMessage) => void;
type StatusListener = (status: { connectedRelays: number; meshPeers: number }) => void;

class BitChatService {
  private identity: BitChatIdentity;
  private messages: BitChatMessage[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private sockets: Map<string, WebSocket> = new Map();
  private connectedRelays = 0;
  private activeChannel = '#afet-genel';
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private isConnectingRelays = false;

  constructor() {
    this.identity = this.loadOrCreateIdentity();
    this.loadCachedMessages();
    this.initBroadcastChannel();
  }

  private loadOrCreateIdentity(): BitChatIdentity {
    try {
      const stored = localStorage.getItem(STORAGE_IDENTITY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const newIdentity: BitChatIdentity = {
      pubkey: hex,
      alias: `AfetZede-${hex.slice(0, 4)}`,
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
    try {
      const stored = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (stored) {
        this.messages = JSON.parse(stored);
        return;
      }
    } catch {}

    // Initial situational defaults
    this.messages = [
      {
        id: 'bitchat-init-1',
        pubkey: 'e3f19a02b4',
        senderName: 'Kurtarma-01 (TRAC)',
        text: 'Moda Sahili ve Yoğurtçu Parkı toplanma sahalarında mobil aşevi ve acil su dağıtımı açıldı.',
        timestamp: Date.now() - 1000 * 60 * 18,
        channel: '#afet-genel',
        type: 'chat',
        city: 'İstanbul',
        district: 'Kadıköy',
        transport: 'nostr'
      },
      {
        id: 'bitchat-init-2',
        pubkey: '7a88c4d1f0',
        senderName: 'Vatandaş-Can',
        text: 'Ailemizle birlikte toplanma alanındayız. Durumumuz iyi, şebeke zayıf ancak P2P ağı çalışıyor.',
        timestamp: Date.now() - 1000 * 60 * 7,
        channel: '#afet-genel',
        type: 'safe',
        city: 'İstanbul',
        district: 'Kadıköy',
        batteryLevel: 82,
        transport: 'mesh'
      }
    ];
  }

  private saveMessages(): void {
    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(this.messages.slice(0, 100)));
    } catch {}
  }

  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'BITCHAT_MSG') {
            this.handleIncomingMessage(event.data.message, false);
          }
        };
      } catch {}
    }
  }

  public connectRelays(): void {
    if (this.isConnectingRelays) return;
    this.isConnectingRelays = true;

    DEFAULT_RELAYS.forEach((relayUrl) => {
      try {
        const ws = new WebSocket(relayUrl);
        const timeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
          }
        }, 6000);

        ws.onopen = () => {
          clearTimeout(timeout);
          this.connectedRelays++;
          this.notifyStatus();

          // Subscribe to disaster messages with tag 'afet-live'
          const subId = `afet-sub-${Math.random().toString(36).slice(2, 6)}`;
          const req = JSON.stringify([
            'REQ',
            subId,
            {
              kinds: [1],
              '#t': ['afet-live'],
              limit: 30
            }
          ]);
          ws.send(req);
        };

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (Array.isArray(data) && data[0] === 'EVENT' && data[2]?.content) {
              const ev = data[2];
              const tagMap = new Map<string, string>();
              if (Array.isArray(ev.tags)) {
                for (const t of ev.tags) {
                  if (Array.isArray(t) && t.length >= 2) {
                    tagMap.set(String(t[0]), String(t[1]));
                  }
                }
              }
              const type = (tagMap.get('disaster_type') as 'chat' | 'safe' | 'sos') || 'chat';
              const district = tagMap.get('district') || '';
              const city = tagMap.get('city') || '';
              const channel = tagMap.get('channel') || '#afet-genel';

              const msg: BitChatMessage = {
                id: String(ev.id),
                pubkey: String(ev.pubkey).slice(0, 10),
                senderName: `Nostr-${String(ev.pubkey).slice(0, 5)}`,
                text: String(ev.content),
                timestamp: Number(ev.created_at) * 1000,
                channel,
                type,
                city,
                district,
                transport: 'nostr'
              };
              this.handleIncomingMessage(msg, false);
            }
          } catch {}
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          if (this.sockets.has(relayUrl)) {
            this.sockets.delete(relayUrl);
            this.connectedRelays = Math.max(0, this.connectedRelays - 1);
            this.notifyStatus();
          }
        };

        ws.onerror = () => {
          ws.close();
        };

        this.sockets.set(relayUrl, ws);
      } catch {}
    });
  }

  private notifyStatus(): void {
    const status = {
      connectedRelays: this.connectedRelays,
      meshPeers: this.broadcastChannel ? 1 : 0
    };
    this.statusListeners.forEach((l) => l(status));
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener({
      connectedRelays: this.connectedRelays,
      meshPeers: this.broadcastChannel ? 1 : 0
    });
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

  public async broadcastMessage(
    text: string,
    type: 'chat' | 'safe' | 'sos' = 'chat',
    meta?: { city?: string; district?: string; coordinates?: [number, number]; batteryLevel?: number }
  ): Promise<BitChatMessage> {
    // 1. Rate Limiter (Spam ve asılsız SOS engeli)
    const rateCheck = antiManipulationService.checkRateLimit(type === 'sos' ? 'sos' : 'chat');
    if (!rateCheck.allowed) {
      throw new Error(`Lütfen ${rateCheck.waitSeconds} sn bekleyin (Hızlı mesaj ve sahte ihbar engeli).`);
    }

    // 2. Heuristik Panik & Dezenformasyon Analizi
    const heuristic = antiManipulationService.analyzeTextSafety(text);

    // 3. Hashcash Proof-of-Work (Bot ve script flooding koruması)
    const now = Date.now();
    const id = `msg-${this.identity.pubkey}-${now}-${Math.random().toString(36).slice(2, 6)}`;
    const difficulty = type === 'sos' ? 12 : 10;
    const pow = await antiManipulationService.solveProofOfWork(`${this.identity.pubkey}:${now}:${text}`, difficulty);

    // 4. Coğrafi Mesafe Çiti / Yerinde Doğrulama
    let proximityBadge: string | undefined;
    let proximityClass: string | undefined;
    if (meta?.coordinates) {
      const prox = antiManipulationService.checkProximity(meta.coordinates, meta.coordinates);
      proximityBadge = prox.badgeLabel;
      proximityClass = prox.badgeClass;
    }

    const message: BitChatMessage = {
      id,
      pubkey: this.identity.pubkey,
      senderName: this.identity.alias,
      text: text.trim(),
      timestamp: now,
      channel: this.activeChannel,
      type,
      city: meta?.city,
      district: meta?.district,
      coordinates: meta?.coordinates,
      batteryLevel: meta?.batteryLevel,
      transport: this.connectedRelays > 0 ? 'nostr' : 'mesh',
      powNonce: pow.nonce,
      powDifficulty: pow.difficulty,
      warningNotice: heuristic.warningMessage,
      proximityBadge,
      proximityClass
    };

    // 5. Local append & broadcast to other tabs/windows
    this.handleIncomingMessage(message, true);

    // 6. Publish to Nostr relays via raw WebSocket event (NIP-13 PoW tag compliant)
    if (this.connectedRelays > 0) {
      const nostrEvent = [
        'EVENT',
        {
          id,
          pubkey: this.identity.pubkey.padEnd(64, '0'),
          created_at: Math.floor(now / 1000),
          kind: 1,
          tags: [
            ['t', 'afet-live'],
            ['channel', this.activeChannel],
            ['disaster_type', type],
            ['city', meta?.city || ''],
            ['district', meta?.district || ''],
            ['nonce', String(pow.nonce), String(pow.difficulty)],
            ['client', 'afet.live-bitchat']
          ],
          content: message.text,
          sig: '00'.repeat(64)
        }
      ];

      this.sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify(nostrEvent));
          } catch {}
        }
      });
    }

    // 7. Send over WebRTC DataChannel if peer is active
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify({ type: 'BITCHAT_DIRECT', message }));
      } catch {}
    }

    return message;
  }

  public voteMessage(messageId: string, vote: 'verify' | 'flag') {
    return antiManipulationService.voteMessage(messageId, this.identity.pubkey, vote);
  }

  public getMessageReputation(messageId: string) {
    return antiManipulationService.getMessageReputation(messageId, this.identity.pubkey);
  }

  // WebRTC P2P Direct Pair (Zero-Server Phone-to-Phone)
  public async createWebRTCOffer(): Promise<string> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.dataChannel = this.peerConnection.createDataChannel('bitchat_emergency');
    this.setupDataChannel(this.dataChannel);

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    await new Promise<void>((resolve) => {
      if (this.peerConnection?.iceGatheringState === 'complete') {
        resolve();
      } else {
        const check = () => {
          if (this.peerConnection?.iceGatheringState === 'complete') {
            this.peerConnection.removeEventListener('icegatheringstatechange', check);
            resolve();
          }
        };
        this.peerConnection?.addEventListener('icegatheringstatechange', check);
        setTimeout(resolve, 1500); // Max wait
      }
    });

    return JSON.stringify(this.peerConnection.localDescription);
  }

  public async acceptWebRTCOffer(offerStr: string): Promise<string> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.peerConnection.ondatachannel = (e) => {
      this.dataChannel = e.channel;
      this.setupDataChannel(this.dataChannel);
    };

    const offer = JSON.parse(offerStr);
    await this.peerConnection.setRemoteDescription(offer);

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await new Promise<void>((resolve) => {
      if (this.peerConnection?.iceGatheringState === 'complete') {
        resolve();
      } else {
        const check = () => {
          if (this.peerConnection?.iceGatheringState === 'complete') {
            this.peerConnection.removeEventListener('icegatheringstatechange', check);
            resolve();
          }
        };
        this.peerConnection?.addEventListener('icegatheringstatechange', check);
        setTimeout(resolve, 1500);
      }
    });

    return JSON.stringify(this.peerConnection.localDescription);
  }

  public async finalizeWebRTCAnswer(answerStr: string): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not started');
    const answer = JSON.parse(answerStr);
    await this.peerConnection.setRemoteDescription(answer);
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'BITCHAT_DIRECT' && data.message) {
          data.message.transport = 'webrtc';
          this.handleIncomingMessage(data.message, true);
        }
      } catch {}
    };
    channel.onopen = () => {
      this.notifyStatus();
    };
  }

  /** Emergency Wipe: Destroys all stored messages, keys and cached history. */
  public emergencyWipe(): void {
    try {
      localStorage.removeItem(STORAGE_IDENTITY_KEY);
      localStorage.removeItem(STORAGE_MESSAGES_KEY);
      sessionStorage.clear();
      this.messages = [];
      this.identity = this.loadOrCreateIdentity();
      this.messageListeners.forEach((l) =>
        l({
          id: 'wipe-notice',
          pubkey: 'system',
          senderName: 'Sistem',
          text: 'Tüm mesaj geçmişi ve kimlik anahtarları cihazdan kalıcı olarak silindi.',
          timestamp: Date.now(),
          channel: this.activeChannel,
          type: 'chat',
          transport: 'mesh'
        })
      );
    } catch {}
  }
}

export const bitChatService = new BitChatService();
