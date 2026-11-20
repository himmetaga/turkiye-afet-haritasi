/**
 * Afet çantası son kullanma tarihi (SKT) takibi.
 *
 * Bu servis YALNIZCA kullanıcının kendi girdiği malzemeleri ve ambalajdan
 * okuyup yazdığı tarihleri saklar. Örnek/uydurma malzeme ya da tarih eklenmez;
 * hiçbir şey girilmemişse liste boştur ve skor hesaplanmaz.
 */

export type ExpirationCategory = 'water' | 'food' | 'medicine' | 'batteries' | 'hygiene' | 'infant';

export interface ExpirationItem {
  id: string;
  name: string;
  category: ExpirationCategory;
  quantity: string;
  expiryDateStr: string; // YYYY-MM-DD (kullanıcının ambalajdan okuduğu tarih)
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

/** Yalnızca isim önerisi: tarih ve miktar içermez, kullanıcı kendi ürününe göre doldurur. */
export interface KitSuggestion {
  name: string;
  category: ExpirationCategory;
  notes: string;
}

export const KIT_SUGGESTIONS: KitSuggestion[] = [
  {
    name: 'Pet şişe içme suyu',
    category: 'water',
    notes: 'Güneş ve ısı görmeyen yerde tutun; ambalajdaki tarihe göre yenileyin.'
  },
  {
    name: 'Konserve yiyecek',
    category: 'food',
    notes: 'Kutuda şişme, pas veya ezilme varsa tüketmeyin, atın.'
  },
  {
    name: 'Bisküvi / kuruyemiş',
    category: 'food',
    notes: 'Kapalı ambalajda saklayın.'
  },
  {
    name: 'Ağrı kesici / ateş düşürücü',
    category: 'medicine',
    notes: 'Orijinal ambalajında, nemden uzak saklayın.'
  },
  {
    name: 'Düzenli kullanılan reçeteli ilaçlar',
    category: 'medicine',
    notes: 'Yedeği çantada tutun; yeni kutu aldıkça eskisiyle değiştirin.'
  },
  {
    name: 'Piller (radyo ve fener için)',
    category: 'batteries',
    notes: 'Pilleri cihazın içinde bırakmayın; ayrı poşette saklayın (akma riski).'
  },
  {
    name: 'Islak mendil / dezenfektan',
    category: 'hygiene',
    notes: 'Zamanla kuruyabilir; kapağı sıkı kapanan paket seçin.'
  },
  {
    name: 'Toz maskesi (FFP2 / N95)',
    category: 'hygiene',
    notes: 'Nem almaması için kapalı torbada tutun.'
  }
];

/**
 * Eski sürüm, kullanıcı hiçbir şey girmeden bu kimlik + tarihlerle uydurma bir
 * envanter kaydediyordu. Tarihi değiştirilmemiş bu kayıtlar yüklenirken atılır.
 */
const LEGACY_SEEDED_DATES: Record<string, string> = {
  'exp-1': '2027-04-15',
  'exp-2': '2027-09-30',
  'exp-3': '2027-02-28',
  'exp-4': '2027-11-20',
  'exp-5': '2027-06-15',
  'exp-6': '2027-05-01',
  'exp-7': '2027-03-10',
  'exp-8': '2028-01-01'
};

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

  /** Kullanıcının kendi girdiği malzemeler. Kayıt yoksa boş liste döner. */
  public getItems(): ExpirationItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (i) =>
              i &&
              typeof i.id === 'string' &&
              typeof i.name === 'string' &&
              LEGACY_SEEDED_DATES[i.id] !== i.expiryDateStr
          );
        }
      }
    } catch {}
    return [];
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

  /**
   * Ürün yenilendiğinde kullanıcının yeni ambalajdan okuduğu SKT'yi kaydeder.
   * Tarih tahmin edilmez; geçersiz tarih reddedilir.
   */
  public setExpiryDate(id: string, expiryDateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDateStr) || isNaN(new Date(expiryDateStr).getTime())) {
      return false;
    }
    this.updateItem(id, { expiryDateStr });
    return true;
  }

  /** Tüm kayıtları siler (liste boş kalır; örnek veri yüklenmez). */
  public clearAll(): void {
    this.saveItems([]);
  }

  /**
   * Girilen SKT'lere göre kalan gün sayısını hesaplar.
   * Hiç malzeme yoksa readinessScore null döner (skor uydurulmaz).
   */
  public evaluateAll(): {
    evaluations: ExpirationEvaluation[];
    expiredCount: number;
    soonCount: number;
    freshCount: number;
    readinessScore: number | null; // 0 - 100, kayıt yoksa null
  } {
    const items = this.getItems();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const evaluations: ExpirationEvaluation[] = items.map((item) => {
      const expDate = new Date(item.expiryDateStr);
      const diffMs = expDate.getTime() - today.getTime();
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

      let status: ExpirationEvaluation['status'];
      let statusLabel: string;
      let statusColor: string;

      if (isNaN(days)) {
        status = 'CRITICAL_SOON';
        statusLabel = 'SKT okunamadı — tarihi yeniden girin';
        statusColor = '#F97316';
      } else if (days < 0) {
        status = 'EXPIRED';
        statusLabel = `Süresi ${Math.abs(days)} gün önce doldu (tüketmeyin)`;
        statusColor = '#EF4444';
      } else if (days <= 30) {
        status = 'CRITICAL_SOON';
        statusLabel = `${days} gün kaldı (hemen yenileyin)`;
        statusColor = '#F97316';
      } else if (days <= 90) {
        status = 'NEEDS_ROTATION';
        statusLabel = `${days} gün kaldı (yenilemeyi planlayın)`;
        statusColor = '#F59E0B';
      } else {
        status = 'FRESH';
        statusLabel = `${days} gün kaldı (ambalaj tarihine göre)`;
        statusColor = '#10B981';
      }

      return {
        item,
        daysRemaining: isNaN(days) ? 0 : days,
        status,
        statusLabel,
        statusColor
      };
    });

    // Sıralama: en acil olanlar en üstte
    evaluations.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const expiredCount = evaluations.filter((e) => e.status === 'EXPIRED').length;
    const soonCount = evaluations.filter((e) => e.status === 'CRITICAL_SOON' || e.status === 'NEEDS_ROTATION').length;
    const freshCount = evaluations.filter((e) => e.status === 'FRESH').length;

    const penalty = expiredCount * 25 + soonCount * 10;
    const readinessScore = items.length === 0 ? null : Math.max(0, Math.min(100, 100 - penalty));

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
