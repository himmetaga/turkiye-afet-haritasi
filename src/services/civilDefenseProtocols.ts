/**
 * civilDefenseProtocols.ts
 * =========================================================================
 * Türkiye Afet Atlası - Sahra Tıbbı, KBRN ve Sivil Savunma Protokolleri
 * =========================================================================
 * 1. Sahra CPR (Kalp Masajı) ve Boğulma Koçu (AHA 110 BPM Metronomu)
 * 2. Ezilme (Crush) Sendromu & Kompartman İlkyardım Kılavuzu
 * 3. Sahra Su Arıtma & Klorlama Dozajlayıcısı (WHO WASH Standartları)
 * 4. KBRN Nükleer Serpinti & Gaz Sığınağı Kılavuzu (Shelter-in-Place)
 * 5. Bina Hasar Tespit Kriterleri (FEMA / Çevre ve Şehircilik Bakanlığı)
 * 6. Çevrimdışı Hak Sahipliği & Mülkiyet Kasası (Offline Credentials)
 * 7. P2P İkmal ve İhtiyaç Takas Defteri (Barter Ledger)
 * 8. DASK 15 Gün Süre Sayacı ve Afet Hukuku Şablonları
 */

export interface WaterDisinfectionCalculation {
  waterVolumeLiters: number;
  householdBleachDrops: number; // 4-5% Sodium Hypochlorite (damla)
  tabletCount: number; // Klor tableti (adet)
  boilingTimeMinutes: number; // Kaynatma süresi
  contactWaitTimeMinutes: number; // Klor temas bekleme süresi
  instructions: string[];
}

export interface CPRState {
  isActive: boolean;
  bpm: number; // 110 standard
  compressionCount: number; // 0 to 30
  cycleCount: number;
  phase: 'compress' | 'breathe';
}

export interface DamageAssessmentItem {
  id: string;
  component: 'kolon' | 'kiris' | 'perde' | 'duvar' | 'merdiven';
  severity: 'hasarsiz' | 'az_hasarli' | 'orta_hasarli' | 'agir_hasarli' | 'acil_yikilacak';
  description: string;
  hasPhoto: boolean;
  photoDataUrl?: string;
  timestamp: number;
}

export interface OfflinePropertyCredential {
  id: string;
  title: string;
  docType: 'tapu' | 'kira_kontrati' | 'kimlik' | 'ruhsat' | 'sigorta_dask';
  serialNumber: string;
  ownerName: string;
  notes: string;
  addedAt: number;
}

export interface BarterItem {
  id: string;
  type: 'offer' | 'need';
  category: 'gida' | 'ilac' | 'bebek' | 'barinma' | 'enerji';
  title: string;
  quantity: string;
  contactLocation: string;
  timestamp: number;
}

class CivilDefenseProtocolsService {
  private cprAudioCtx: AudioContext | null = null;
  private cprInterval: any = null;
  private cprState: CPRState = {
    isActive: false,
    bpm: 110,
    compressionCount: 0,
    cycleCount: 0,
    phase: 'compress'
  };

  /**
   * 1. SAHRA CPR (KALP MASAJI) METRONOMU & SESLİ/TİTREŞİMLİ KOÇ (110 BPM)
   */
  public startCPRCoach(onTick: (state: CPRState) => void): void {
    if (this.cprState.isActive) return;
    this.cprState.isActive = true;
    this.cprState.compressionCount = 0;
    this.cprState.cycleCount = 1;
    this.cprState.phase = 'compress';

    const intervalMs = Math.round((60 / 110) * 1000); // ~545ms per compression

    this.cprInterval = setInterval(() => {
      if (!this.cprState.isActive) return;

      if (this.cprState.phase === 'compress') {
        this.cprState.compressionCount++;
        this.playCPRTickSound(this.cprState.compressionCount === 30);

        // Haptic feedback for tactile pace
        if ('vibrate' in navigator) {
          navigator.vibrate(this.cprState.compressionCount === 30 ? [60, 40, 60] : 35);
        }

        if (this.cprState.compressionCount >= 30) {
          this.cprState.phase = 'breathe';
          this.cprState.compressionCount = 0;
        }
      } else {
        // Breathe phase (2 deep rescue breaths: ~4-5 seconds)
        this.cprState.cycleCount++;
        this.cprState.phase = 'compress';
      }

      onTick({ ...this.cprState });
    }, intervalMs);
  }

  public stopCPRCoach(): void {
    this.cprState.isActive = false;
    clearInterval(this.cprInterval);
    if (this.cprAudioCtx && this.cprAudioCtx.state !== 'closed') {
      try {
        this.cprAudioCtx.close();
      } catch {}
      this.cprAudioCtx = null;
    }
  }

  private playCPRTickSound(isMajorBeat = false): void {
    try {
      if (!this.cprAudioCtx || this.cprAudioCtx.state === 'closed') {
        const AudioClass = window.AudioContext || (window as any).webkitAudioContext;
        this.cprAudioCtx = new AudioClass();
      }
      if (this.cprAudioCtx.state === 'suspended') {
        this.cprAudioCtx.resume();
      }

      const ctx = this.cprAudioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isMajorBeat ? 880 : 550, now); // A5 or C#5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  /**
   * 2. SAHRA SU ARITMA & DOZAJLAMA HESAPLAYICISI (WHO WASH)
   * 1 Litre berrak su için 2-3 damla, bulanık su için 4-5 damla çamaşır suyu (%4-5 NaOCl).
   */
  public calculateWaterDisinfection(liters: number, isCloudy = false): WaterDisinfectionCalculation {
    const dropsPerLiter = isCloudy ? 5 : 3;
    const totalDrops = Math.max(1, Math.round(liters * dropsPerLiter));
    const tabletCount = Math.max(1, Math.ceil(liters / 5)); // 1 tablet per 5L standard

    return {
      waterVolumeLiters: liters,
      householdBleachDrops: totalDrops,
      tabletCount,
      boilingTimeMinutes: 3, // en az 3 dakika fokurdayarak kaynama
      contactWaitTimeMinutes: 30, // klor temas süresi en az 30 dakika
      instructions: [
        '1. Suyu önce tülbent, temiz bez veya kahve filtresinden geçirerek tortulardan arındırın.',
        `2. Berrak suya ${totalDrops} damla katkısız (parfümsüz/deterjansız) ev tipi çamaşır suyu damlatın.`,
        '3. Kabın kapağını kapatıp iyice çalkalayın.',
        '4. EN AZ 30 DAKİKA BEKLEYİN. Suyun hafif klor kokması arındığını gösterir.',
        '5. Klor kokusu hiç yoksa aynı dozu tekrarlayıp 15 dakika daha bekleyin.',
        '6. Mümkünse suyu 3 dakika kaynatmak biyolojik parazitleri tamamen yok eder.'
      ]
    };
  }

  /**
   * 3. EZİLME (CRUSH) SENDROMU İLKYARDIM PROTOKOLÜ
   */
  public getCrushSyndromeGuidelines(): { title: string; warning: string; steps: string[] } {
    return {
      title: 'Enkaz Ezilme (Crush) Sendromu & Kompartman Protokolü',
      warning:
        'HAYATİ UYARI: Enkazdan yeni çıkarılan kişiye ASLA ANİDEN VE BOLCA SU İÇİRMEYİN! Ezilen kas dokusundaki miyoglobin ve potasyum dolaşıma katılarak ani kalp durmasına (hiperkalemi) ve akut böbrek yetmezliğine yol açabilir.',
      steps: [
        '1. Enkaz altında uzun süre sıkışan uzuv gevşetilmeden önce damar yolu açılması hayati önem taşır.',
        '2. Sağlık ekibi yoksa ve uzuv saatlerce ezilmişse, ani serbest kalma sonrası toksinlerin kalbe hücumunu yavaşlatmak için kontrollü turnike hazır bulundurun.',
        '3. Kazazedeye idrar çıkışı ve tıbbi gözetim olmadan potasyum içeren muz, meyve suyu vb. vermeyin.',
        '4. İdrar rengi kola/çay rengine dönerse miyoglobinüri belirtisidir; derhal acil diyaliz/hastane sevki gerekir.',
        '5. Uzuvda şiddetli şişlik, taş gibi sertlik ve nabız kaybı varsa kompartman sendromudur, acil cerrahi fasyotomi gerektirir.'
      ]
    };
  }

  /**
   * 4. KBRN & NÜKLEER SERPİNTİ SIĞINAK KILAVUZU
   */
  public getCBRNProtocols(): {
    shelterInPlaceRules: string[];
    potassiumIodideDosage: string[];
    decontaminationSteps: string[];
  } {
    return {
      shelterInPlaceRules: [
        '1. Dış ortamla hava temasını anında kesin: Klima, havalandırma, fan ve bacaları kapatın.',
        '2. Pencereleri ve kapı aralıklarını kalın naylon branda ve koli bandı ile hava sızdırmaz şekilde izole edin.',
        '3. Binanın en iç, penceresiz merkezine veya bodrum katına geçin. Duvar katmanları radyasyonu katlanarak zayıflatır.',
        '4. En az 72 saat kapalı alanda kalın; resmi sivil savunma ve AFAD tahliye anonsu olmadan dışarı çıkmayın.'
      ],
      potassiumIodideDosage: [
        'Yetişkinler ve Hamileler: 130 mg tek doz (radyoaktif iyot tiroid kanseri blokajı).',
        'Çocuklar (3-12 yaş): 65 mg tek doz.',
        'Bebekler (1 ay - 3 yaş): 32 mg tek doz.',
        'Yenidoğan (ilk 1 ay): 16 mg tek doz.',
        'DİKKAT: Potasyum İyodür (KI) genel radyasyona karşı zırh değildir; yalnızca radyoaktif I-131 izotopunun tiroidde tutulmasını engeller. Resmi otorite talimatı olmadan önleyici olarak ezbere içilmemelidir.'
      ],
      decontaminationSteps: [
        '1. Dışarıdan içeri girerken kıyafetlerinizi ve ayakkabılarınızı kapının dışında çıkarıp çift kat çöp poşetine koyup ağzını bağlayın (%90 kontaminasyonu uzaklaştırır).',
        '2. Cildinizi ovalamadan ılık su ve sabunla nazikçe yıkayın; tahriş ve kesik oluşturmayın.',
        '3. Burun, kulak ve gözlerinizi temiz serum fizyolojik veya içme suyuyla yıkayıp temizleyin.'
      ]
    };
  }

  /**
   * 5. ÇEVRİMDIŞI HAK SAHİPLİĞİ & MÜLKİYET KASASI (OFFLINE CREDENTIALS)
   */
  public getSavedCredentials(): OfflinePropertyCredential[] {
    try {
      const raw = localStorage.getItem('afet_property_vault_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public saveCredential(cred: Omit<OfflinePropertyCredential, 'id' | 'addedAt'>): void {
    const list = this.getSavedCredentials();
    const item: OfflinePropertyCredential = {
      ...cred,
      id: `doc-${Date.now().toString(36)}`,
      addedAt: Date.now()
    };
    list.unshift(item);
    try {
      localStorage.setItem('afet_property_vault_v1', JSON.stringify(list));
    } catch {}
  }

  public deleteCredential(id: string): void {
    const list = this.getSavedCredentials().filter((c) => c.id !== id);
    try {
      localStorage.setItem('afet_property_vault_v1', JSON.stringify(list));
    } catch {}
  }

  /**
   * 6. P2P İHTİYAÇ VE TAKAS DEFTERİ (BARTER LEDGER)
   */
  public getBarterList(): BarterItem[] {
    try {
      const raw = localStorage.getItem('afet_barter_ledger_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public addBarterItem(item: Omit<BarterItem, 'id' | 'timestamp'>): void {
    const list = this.getBarterList();
    const newItem: BarterItem = {
      ...item,
      id: `barter-${Date.now().toString(36)}`,
      timestamp: Date.now()
    };
    list.unshift(newItem);
    try {
      localStorage.setItem('afet_barter_ledger_v1', JSON.stringify(list));
    } catch {}
  }
}

export const civilDefenseProtocols = new CivilDefenseProtocolsService();
