import { haversineDistanceMeters } from '../utils/geoMath';

export interface PoWResult {
  nonce: number;
  hash: string;
  difficulty: number;
  durationMs: number;
}

export interface HeuristicAnalysisResult {
  isSuspicious: boolean;
  category?: 'panic_rumor' | 'flood_panic' | 'military_unrest' | 'magnitude_exaggeration';
  warningMessage?: string;
  detectedKeyword?: string;
}

export interface ProximityCheckResult {
  isLocal: boolean;
  distanceKm: number;
  badgeLabel: string;
  badgeClass: string;
}

export interface ReputationSummary {
  verifications: number;
  flags: number;
  isDisputed: boolean;
  isVerified: boolean;
  userVoted?: 'verify' | 'flag';
}

const STORAGE_RATE_LIMIT_KEY = 'afet_anti_manipulation_cooldowns_v1';
const STORAGE_REPUTATION_KEY = 'afet_anti_manipulation_reputation_v1';

// Panic & Disinformation keywords that historically caused road blockages and chaos in past Turkish disasters
const PANIC_PATTERNS: { regex: RegExp; category: HeuristicAnalysisResult['category']; message: string }[] = [
  {
    regex: /(baraj|gölet).*(patla|yıkıl|taştı|patlamış|yıkılmış)/i,
    category: 'flood_panic',
    message: '⚠️ TEYİTSİZ BARAJ SÖYLENTİSİ: Resmi AFAD veya Valilik açıklaması olmaksızın baraj/su taşkını duyumlarına itibar etmeyiniz. Yolları ve kaçış güzergahlarını meşgul etmeyiniz.'
  },
  {
    regex: /\b(9\.[5-9]|10|11|12)\s*(şiddet|büyüklü|şiddetinde|büyüklüğünde)/i,
    category: 'magnitude_exaggeration',
    message: '⚠️ BİLİM DIŞI DEPREM BÜYÜKLÜĞÜ: Jeolojik ve sismolojik olarak Türkiye fay zonlarında bu ölçekte deprem üretimi söz konusu değildir. Yalnızca Kandilli ve AFAD verilerine güveniniz.'
  },
  {
    regex: /(tahliye.*(emri|zorunlu|başladı)|şehri.*(boşaltın|terk edin))/i,
    category: 'panic_rumor',
    message: '⚠️ TEYİTSİZ TAHLİYE ÇAĞRISI: Resmi tahliye kararları yalnızca Valilik, Kaymakamlık ve AFAD koordinasyon merkezince hoparlör ve resmi kanallardan ilan edilir.'
  },
  {
    regex: /(nükleer|zehirli gaz|kimyasal).*sızıntı/i,
    category: 'panic_rumor',
    message: '⚠️ TEYİTSİZ KİMYASAL DUYUM: Teyitsiz zehirli gaz iddialarına karşı paniğe kapılmayınız; resmi AFAD KBRN ekiplerinin açıklamalarını takip ediniz.'
  },
  {
    regex: /(yağmacı.*(vuruldu|öldürüldü|çatışma)|asker.*(ateş açtı|müdahale etti))/i,
    category: 'military_unrest',
    message: '⚠️ GÜVENLİK SÖYLENTİSİ: Sahra asayiş ve güvenlik teyitleri yalnızca Emniyet ve Jandarma resmi makamlarınca bildirilir.'
  }
];

export const LEGAL_DISCLAIMER = {
  shortNotice: 'Sivil Afet Haritası · Resmi 112 / AFAD yerine geçmez · Şebeke varsa önce 112 aranmalıdır.',
  fullText: `HUKUKİ SORUMLULUK REDDİ VE SİVİL KULLANIM ŞARTLARI:
1. afet.live, açık kaynaklı sivil bir afet dayanışma, toplanma alanı tespit ve çevrimdışı hayatta kalma rehberidir.
2. T.C. İçişleri Bakanlığı AFAD, T.C. Sağlık Bakanlığı 112 Acil Çağrı Merkezi veya resmi kurtarma birimlerinin yerini tutmaz ve resmi bir acil çağrı taahhüdü vermez.
3. Hücresel şebekenin ve telefon hatlarının çalıştığı durumlarda hayati acil durumlar için derhal 112 Acil Çağrı Merkezi aranmalıdır.
4. Kullanıcılar tarafından BitChat ağı, telsiz frekansları veya sahra masaları üzerinden paylaşılan mesaj ve durumların doğruluğundan bildirimi yapan kullanıcıların kendileri sorumludur.
5. Asılsız ihbar, halkı yanıltıcı bilgiyi alenen yayma veya panik oluşturmaya yönelik manipülasyonlar 5237 sayılı TCK m. 217/A kapsamında suç teşkil edebilir.`,
  badgeTag: 'Sivil Dayanışma Ağı'
};

class AntiManipulationService {
  private reputationCache: Map<string, { verifications: number; flags: number; voters: Record<string, 'verify' | 'flag'> }> = new Map();

  constructor() {
    this.loadReputations();
  }

  /**
   * 1. HASHCASH PROOF-OF-WORK (NIP-13 / Spam & Bot Savunması)
   * Cihazın hafif bir matematiksel SHA-256 bulmacası çözmesini zorunlu kılar.
   * Normal kullanıcı 80-150ms gecikme hissetmez, ancak otomatik botlar saniyede binlerce mesaj basamaz.
   */
  public async solveProofOfWork(payload: string, difficultyBits = 10): Promise<PoWResult> {
    const startTime = performance.now();
    let nonce = 0;
    const encoder = new TextEncoder();

    while (true) {
      const candidate = `${payload}:${nonce}`;
      const data = encoder.encode(candidate);
      const hashBuf = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuf);

      // Check leading zero bits
      if (this.hasLeadingZeroBits(hashArray, difficultyBits)) {
        const hashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, '0')).join('');
        const durationMs = Math.round(performance.now() - startTime);
        return { nonce, hash: hashHex, difficulty: difficultyBits, durationMs };
      }

      nonce++;
      // Failsafe to not block main thread forever on weak hardware
      if (nonce > 150_000) {
        const hashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, '0')).join('');
        return { nonce, hash: hashHex, difficulty: 0, durationMs: Math.round(performance.now() - startTime) };
      }
    }
  }

  public async verifyProofOfWork(payload: string, nonce: number, requiredBits = 10): Promise<boolean> {
    if (requiredBits <= 0) return true;
    try {
      const candidate = `${payload}:${nonce}`;
      const data = new TextEncoder().encode(candidate);
      const hashBuf = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuf);
      return this.hasLeadingZeroBits(hashArray, requiredBits);
    } catch {
      return false;
    }
  }

  private hasLeadingZeroBits(bytes: Uint8Array, bits: number): boolean {
    const fullBytes = Math.floor(bits / 8);
    const remBits = bits % 8;

    for (let i = 0; i < fullBytes; i++) {
      if (bytes[i] !== 0) return false;
    }

    if (remBits > 0) {
      const mask = 0xff << (8 - remBits);
      if ((bytes[fullBytes] & mask) !== 0) return false;
    }

    return true;
  }

  /**
   * 2. RATE LIMITER / TOKEN BUCKET (Sahte SOS ve Mesaj Bombardımanı Koruması)
   */
  public checkRateLimit(action: 'sos' | 'chat' | 'felt' | 'aid'): { allowed: boolean; waitSeconds: number } {
    const limits: Record<string, number> = {
      sos: 30, // 30 saniyede en fazla 1 S.O.S
      chat: 6, // 6 saniyede en fazla 1 sohbet mesajı
      felt: 60, // 60 saniyede en fazla 1 hissettim bildirimi
      aid: 20 // 20 saniyede en fazla 1 ihtiyaç talebi
    };

    const cooldownSec = limits[action] || 10;
    const now = Date.now();
    let storedMap: Record<string, number> = {};

    try {
      const raw = localStorage.getItem(STORAGE_RATE_LIMIT_KEY);
      if (raw) storedMap = JSON.parse(raw);
    } catch {}

    const lastTime = storedMap[action] || 0;
    const elapsedSec = (now - lastTime) / 1000;

    if (elapsedSec < cooldownSec) {
      const waitSeconds = Math.ceil(cooldownSec - elapsedSec);
      return { allowed: false, waitSeconds };
    }

    storedMap[action] = now;
    try {
      localStorage.setItem(STORAGE_RATE_LIMIT_KEY, JSON.stringify(storedMap));
    } catch {}

    return { allowed: true, waitSeconds: 0 };
  }

  /**
   * 3. HEURİSTİK PANİK VE DEZENFORMASYON ANALİZİ
   * "Baraj patladı", "10 büyüklüğünde" gibi infial yaratacak teyitsiz kalıpları denetler.
   */
  public analyzeTextSafety(text: string): HeuristicAnalysisResult {
    const cleanText = text.trim();
    for (const item of PANIC_PATTERNS) {
      const match = cleanText.match(item.regex);
      if (match) {
        return {
          isSuspicious: true,
          category: item.category,
          warningMessage: item.message,
          detectedKeyword: match[0]
        };
      }
    }

    return { isSuspicious: false };
  }

  /**
   * 4. COĞRAFİ MESAFE ÇİTİ (GEOFENCING & YERİNDE DOĞRULAMA)
   * Kullanıcının bildirilen konumdan ne kadar uzakta olduğunu ölçer.
   * 3 km'den yakınsa "Yerinde Teyitli", uzaksa "Uzaktan Bildirim" damgası üretir.
   */
  public checkProximity(userCoords: [number, number], targetCoords?: [number, number]): ProximityCheckResult {
    if (!targetCoords) {
      return {
        isLocal: false,
        distanceKm: 0,
        badgeLabel: 'Konumsuz Bildirim',
        badgeClass: 'bg-gray-500/15 text-gray-400 border-gray-500/25'
      };
    }

    const distMeters = haversineDistanceMeters(userCoords, targetCoords);
    const distKm = Number((distMeters / 1000).toFixed(1));

    if (distKm <= 3.0) {
      return {
        isLocal: true,
        distanceKm: distKm,
        badgeLabel: `📍 Yerinde Doğrulandı (${distKm} km)`,
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    }

    return {
      isLocal: false,
      distanceKm: distKm,
      badgeLabel: `⚠️ Uzaktan Bildirim (${distKm} km)`,
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    };
  }

  /**
   * 5. TOPLULUK KONSENSÜSÜ & ASILSIZ İHBAR ETİKETLEME (QUORUM)
   */
  public voteMessage(messageId: string, voterPubkey: string, vote: 'verify' | 'flag'): ReputationSummary {
    let rep = this.reputationCache.get(messageId);
    if (!rep) {
      rep = { verifications: 0, flags: 0, voters: {} };
      this.reputationCache.set(messageId, rep);
    }

    const prevVote = rep.voters[voterPubkey];
    if (prevVote === vote) {
      // Toggle off
      delete rep.voters[voterPubkey];
      if (vote === 'verify') rep.verifications = Math.max(0, rep.verifications - 1);
      if (vote === 'flag') rep.flags = Math.max(0, rep.flags - 1);
    } else {
      if (prevVote === 'verify') rep.verifications = Math.max(0, rep.verifications - 1);
      if (prevVote === 'flag') rep.flags = Math.max(0, rep.flags - 1);

      rep.voters[voterPubkey] = vote;
      if (vote === 'verify') rep.verifications += 1;
      if (vote === 'flag') rep.flags += 1;
    }

    this.saveReputations();
    return this.getMessageReputation(messageId, voterPubkey);
  }

  public getMessageReputation(messageId: string, voterPubkey?: string): ReputationSummary {
    const rep = this.reputationCache.get(messageId);
    if (!rep) {
      return {
        verifications: 0,
        flags: 0,
        isDisputed: false,
        isVerified: false
      };
    }

    return {
      verifications: rep.verifications,
      flags: rep.flags,
      isDisputed: rep.flags >= 2,
      isVerified: rep.verifications >= 3,
      userVoted: voterPubkey ? rep.voters[voterPubkey] : undefined
    };
  }

  private loadReputations(): void {
    try {
      const raw = localStorage.getItem(STORAGE_REPUTATION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const [id, data] of Object.entries(parsed)) {
          this.reputationCache.set(id, data as any);
        }
      }
    } catch {}
  }

  private saveReputations(): void {
    try {
      const obj: Record<string, any> = {};
      this.reputationCache.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem(STORAGE_REPUTATION_KEY, JSON.stringify(obj));
    } catch {}
  }
}

export const antiManipulationService = new AntiManipulationService();
