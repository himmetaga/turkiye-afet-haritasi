/**
 * Emergency Kit & Medicine Expiration Rotation Service (Afet Çantası SKT ve Stok Rotasyon Motoru)
 *
 * Gerçek Hayat Afet Standartları:
 * 1. Su Rotasyonu (6 Ay): Pet şişeler 6 aydan sonra ısı/ışıkla mikroplastik ve kimyasal salınım yapar.
 * 2. Konserve & Kuru Gıda (1-2 Yıl): Şişmiş konserveler ölümcül Clostridium botulinum toksini üretir.
 * 3. İlaç Etkinliği: Miadı dolmuş antibiyotik ve tansiyon ilaçları moleküler bozulmaya uğrar.
 * 4. Alkalin Pil Sızıntısı (1 Yıl): Piller bekleme esnasında potasyum hidroksit sızdırarak cihazları bozar.
 */

export type ExpirationCategory = 'water' | 'food' | 'medicine' | 'batteries' | 'hygiene' | 'infant';

export interface ExpirationItem {
  id: string;
  name: string;
  category: ExpirationCategory;
  quantity: string;
  expiryDateStr: string; // YYYY-MM-DD
  recommendedShelfLifeMonths: number;
  notes: string;
}

export interface ExpirationEvaluation {
  item: ExpirationItem;
  daysRemaining: number;
  status: 'EXPIRED' | 'CRITICAL_SOON' | 'NEEDS_ROTATION' | 'FRESH';
  statusLabel: string;
  statusColor: string;
}

const DEFAULT_KIT_EXPIRATIONS: ExpirationItem[] = [
  {
    id: 'exp-1',
    name: 'Pet Şişe İçme Suları (12 Litre)',
    category: 'water',
    quantity: '8 x 1.5 L',
    expiryDateStr: '2027-04-15',
    recommendedShelfLifeMonths: 6,
    notes: 'Pet şişeler güneş ve ısı görmeyen karanlık yerde tutulmalı, 6 ayda bir içilerek yenilenmelidir.'
  },
  {
    id: 'exp-2',
    name: 'Konserve Barbunya & Ton Balığı',
    category: 'food',
    quantity: '6 Kutu',
    expiryDateStr: '2027-09-30',
    recommendedShelfLifeMonths: 24,
    notes: 'Kutuda şişme, pas veya ezilme varsa kesinlikle tüketilmemeli, atılmalıdır (Botulizm riski).'
  },
  {
    id: 'exp-3',
    name: 'Yüksek Enerjili Bisküvi & Kuruyemiş',
    category: 'food',
    quantity: '4 Paket',
    expiryDateStr: '2027-02-28',
    recommendedShelfLifeMonths: 12,
    notes: 'Vakum poşette muhafaza edilmeli; yağ acılaşması başlayınca yenilenmelidir.'
  },
  {
    id: 'exp-4',
    name: 'Ağrı Kesici & Ateş Düşürücü (Parasetamol)',
    category: 'medicine',
    quantity: '2 Kutu (40 Tablet)',
    expiryDateStr: '2027-11-20',
    recommendedShelfLifeMonths: 24,
    notes: 'Orijinal blister ambalajında ve nemden korunaklı poşette saklanmalıdır.'
  },
  {
    id: 'exp-5',
    name: 'Kronik Reçeteli İlaçlar (Tansiyon / Diyabet)',
    category: 'medicine',
    quantity: '1 Aylık Yedek',
    expiryDateStr: '2027-06-15',
    recommendedShelfLifeMonths: 6,
    notes: 'Kullanılan kutu bittikçe çantadaki yedek alınıp yeni alınan çantaya konmalıdır (Sürekli rotasyon).'
  },
  {
    id: 'exp-6',
    name: 'Alkalin AA & AAA Piller (Radyo & Fener)',
    category: 'batteries',
    quantity: '8 Adet',
    expiryDateStr: '2027-05-01',
    recommendedShelfLifeMonths: 12,
    notes: 'Piller cihazların İÇİNDE BIRAKILMAMALIDIR! Ayrı poşette saklanmalıdır (Asit akma riski).'
  },
  {
    id: 'exp-7',
    name: 'Antibakteriyel Islak Mendil & Dezenfektan',
    category: 'hygiene',
    quantity: '3 Paket',
    expiryDateStr: '2027-03-10',
    recommendedShelfLifeMonths: 12,
    notes: 'Zamanla alkolü uçup kurur; kapaklı hava geçirmez paketler tercih edilmelidir.'
  },
  {
    id: 'exp-8',
    name: 'FFP2 / N95 Toz ve Moloz Maskeleri',
    category: 'hygiene',
    quantity: '5 Adet',
    expiryDateStr: '2028-01-01',
    recommendedShelfLifeMonths: 36,
    notes: 'Elektrostatik filtre katmanının nem kapmaması için kilitli torbada tutulmalıdır.'
  }
];

export class KitExpirationService {
  private static instance: KitExpirationService;
  private readonly STORAGE_KEY = 'afet_kit_expirations_v1';

  private constructor() {}

  public static getInstance(): KitExpirationService {
    if (!KitExpirationService.instance) {
      KitExpirationService.instance = new KitExpirationService();
    }
    return KitExpirationService.instance;
  }

  public getItems(): ExpirationItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [...DEFAULT_KIT_EXPIRATIONS];
  }

  public saveItems(items: ExpirationItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }

  public addItem(item: Omit<ExpirationItem, 'id'>): ExpirationItem {
    const items = this.getItems();
    const newItem: ExpirationItem = {
      ...item,
      id: `item-${Date.now()}`
    };
    items.push(newItem);
    this.saveItems(items);
    return newItem;
  }

  public removeItem(id: string): void {
    const items = this.getItems().filter((i) => i.id !== id);
    this.saveItems(items);
  }

  public updateItem(id: string, updates: Partial<ExpirationItem>): void {
    const items = this.getItems().map((item) => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
    this.saveItems(items);
  }

  public rotateItem(id: string, addedMonths: number = 6): void {
    const now = new Date();
    now.setMonth(now.getMonth() + addedMonths);
    const newDateStr = now.toISOString().split('T')[0];
    this.updateItem(id, { expiryDateStr: newDateStr });
  }

  public resetToDefaults(): void {
    this.saveItems([...DEFAULT_KIT_EXPIRATIONS]);
  }

  /**
   * Tüm malzemelerin SKT gün farkını ve tehlike derecesini hesaplar
   */
  public evaluateAll(): {
    evaluations: ExpirationEvaluation[];
    expiredCount: number;
    soonCount: number;
    freshCount: number;
    readinessScore: number; // 0 - 100
  } {
    const items = this.getItems();
    const now = new Date();
    // Midnight comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const evaluations: ExpirationEvaluation[] = items.map((item) => {
      const expDate = new Date(item.expiryDateStr);
      const diffMs = expDate.getTime() - today.getTime();
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

      let status: ExpirationEvaluation['status'] = 'FRESH';
      let statusLabel = 'Taze & Güvenli';
      let statusColor = '#10B981';

      if (days < 0) {
        status = 'EXPIRED';
        statusLabel = `${Math.abs(days)} Gün Önce Süresi Doldu (Tüketmeyin!)`;
        statusColor = '#EF4444';
      } else if (days <= 30) {
        status = 'CRITICAL_SOON';
        statusLabel = `Kritik: ${days} Gün Kaldı (Hemen Yenileyin)`;
        statusColor = '#F97316';
      } else if (days <= 90) {
        status = 'NEEDS_ROTATION';
        statusLabel = `Rotasyon: ${days} Gün Kaldı`;
        statusColor = '#F59E0B';
      } else {
        status = 'FRESH';
        statusLabel = `${days} Gün Güvenli`;
        statusColor = '#10B981';
      }

      return {
        item,
        daysRemaining: days,
        status,
        statusLabel,
        statusColor
      };
    });

    // Sıralama: En acil olanlar en üstte
    evaluations.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const expiredCount = evaluations.filter((e) => e.status === 'EXPIRED').length;
    const soonCount = evaluations.filter((e) => e.status === 'CRITICAL_SOON' || e.status === 'NEEDS_ROTATION').length;
    const freshCount = evaluations.filter((e) => e.status === 'FRESH').length;

    // Hazırlık Skoru (100 üzerinden)
    const penalty = (expiredCount * 25) + (soonCount * 10);
    const readinessScore = Math.max(0, Math.min(100, 100 - penalty));

    return {
      evaluations,
      expiredCount,
      soonCount,
      freshCount,
      readinessScore
    };
  }
}

export const kitExpirationService = KitExpirationService.getInstance();
