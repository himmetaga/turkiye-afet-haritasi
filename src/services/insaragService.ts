/**
 * insaragService.ts
 * =============================================================================
 * UN OCHA / INSARAG Uluslararası Kentsel Arama ve Kurtarma (USAR)
 * Enkaz İşaretleme ve Yapısal Triyaj Sistemi
 * Referans: INSARAG Guidelines Vol II: Operations, Manual B (Marking System)
 * AFAD & AKUT & İtfaiye Saha Standartları
 * =============================================================================
 * Arama kurtarma ekiplerinin enkaz üzerine sprey boyayla çizdiği 1x1 metrelik
 * kare ve 'X' işaretlerinin;
 * 1. Çözülmesi (Decoder): Afetzede ve gönüllülerin duvardaki işareti okuyup
 *    içeride canlı kalıp kalmadığını, hangi ekibin ne zaman girdiğini ve gaz/çökme
 *    riski olup olmadığını saniyeler içinde anlamasını sağlar.
 * 2. Oluşturulması (Generator): Kurtarma ekiplerinin uluslararası standartta
 *    ve hatasız şablon üretmesini sağlar.
 */

export type InsaragStatus =
  | 'in_progress' // '/' tek çizgi: Arama sürüyor
  | 'completed' // 'X' çarpı: Arama tamamlandı
  | 'cleared' // Kutu içinde X: Tüm kazazedeler çıkarıldı, bina kapatıldı
  | 'passed'; // 'G': Boş/İlerlendi

export interface InsaragTag {
  teamId: string;
  startDate: string;
  endDate?: string;
  liveCount: number;
  deadCount: number;
  hazards: string[];
  status: InsaragStatus;
  notes?: string;
  targetRoomArrow?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export interface DecodedExplanation {
  headline: string;
  statusBadge: string;
  statusColor: string;
  teamSummary: string;
  victimSummary: string;
  hazardSummary: string;
  isSafeToEnter: boolean;
  recommendation: string;
}

export const COMMON_HAZARDS = [
  { code: 'G', label: 'Gaz Sızıntısı Kokusu / Patlama Riski', danger: 'high' },
  { code: 'E', label: 'Açıkta Elektrik Kabloları / Yüksek Gerilim', danger: 'high' },
  { code: 'COL', label: 'Kritik Yapısal Çökme Riski (Askıda Döşeme)', danger: 'critical' },
  { code: 'A', label: 'Asbest ve Toksik Toz Salınımı', danger: 'medium' },
  { code: 'W', label: 'Su Baskını / Patlayan Ana Şebeke Borusu', danger: 'medium' },
  { code: 'OK', label: 'Belirgin Tehlike Tespit Edilmedi (Güvenli)', danger: 'low' }
];

export class InsaragService {
  /**
   * Girilen INSARAG etiketini analiz edip anlaşılır Türkçe açıklama üretir.
   */
  public decode(tag: InsaragTag): DecodedExplanation {
    let headline = '';
    let statusBadge = '';
    let statusColor = 'text-amber-400';
    let isSafeToEnter = false;
    let recommendation = '';

    switch (tag.status) {
      case 'in_progress':
        headline = '⚠️ ARAMA VE KURTARMA ÇALIŞMASI DEVAM EDİYOR';
        statusBadge = 'İçeride Ekip Var (/)';
        statusColor = 'text-amber-400';
        recommendation =
          'Enkaz içine kesinlikle girmeyiniz. Ekiplerin dinleme yapabilmesi için çevrede mutlak sessizlik sağlayınız.';
        break;
      case 'completed':
        headline = 'ℹ️ ARAMA ÇALIŞMASI TAMAMLANDI';
        statusBadge = 'Arama Bitti (X)';
        statusColor = 'text-blue-400';
        recommendation =
          'Ekip binadaki aramasını tamamlamıştır. Artçı sarsıntılar nedeniyle binaya izinsiz girmeyiniz.';
        break;
      case 'cleared':
        headline = '✅ BİNA TAMAMEN TAHLİYE EDİLDİ VE KAPATILDI';
        statusBadge = 'Temizlendi [X]';
        statusColor = 'text-emerald-400';
        recommendation =
          'Tüm canlı ve vefat eden kazazedeler çıkarılmıştır. Saha ağır iş makineleri ve enkaz kaldırmaya devredilebilir.';
        break;
      case 'passed':
        headline = '➡️ HIZLI DEĞERLENDİRME YAPILDI - EKİP İLERLEDİ';
        statusBadge = 'İlerlendi (G)';
        statusColor = 'text-purple-400';
        recommendation =
          'Ekip yapıya hızlıca göz atmış ve canlı belirtisi alamadığı için diğer binalara yönelmiştir.';
        break;
    }

    const teamSummary = tag.teamId
      ? `Bu binada görev yapan ekip: ${tag.teamId} (Giriş: ${tag.startDate}${tag.endDate ? ' - Çıkış: ' + tag.endDate : ''})`
      : 'Ekip kodu belirtilmemiş.';

    const victimSummary = `Kurtarılan Canlı: ${tag.liveCount} Kişi | Çıkarılan Vefat: ${tag.deadCount} Kişi. ${
      tag.liveCount > 0 ? 'İçeriden canlı kazazede çıkarılmıştır.' : 'Canlı kazazede kaydı bulunmuyor.'
    }`;

    let hazardSummary = '';
    if (tag.hazards.length === 0 || tag.hazards.includes('OK')) {
      hazardSummary = 'Belirgin gaz, asbest veya çökme tehlikesi işaretlenmemiş.';
      isSafeToEnter = tag.status === 'cleared';
    } else {
      const hazardLabels = tag.hazards.map((h) => {
        const found = COMMON_HAZARDS.find((x) => x.code === h);
        return found ? found.label : h;
      });
      hazardSummary = `DİKKAT! Tespit edilen tehlikeler: ${hazardLabels.join(', ')}`;
      isSafeToEnter = false;
    }

    return {
      headline,
      statusBadge,
      statusColor,
      teamSummary,
      victimSummary,
      hazardSummary,
      isSafeToEnter,
      recommendation
    };
  }

  /**
   * INSARAG sprey boya şablonu için SVG çizimini dinamik olarak üretir.
   */
  public generateSvg(tag: InsaragTag, size = 260): string {
    const half = size / 2;
    const padding = 16;
    const innerSize = size - padding * 2;

    const hazardsText = tag.hazards.length > 0 ? tag.hazards.join(',') : 'OK';
    const datesText = tag.endDate ? `${tag.startDate}-${tag.endDate}` : tag.startDate;
    const victimsText = `L:${tag.liveCount} D:${tag.deadCount}`;

    let slashPath = '';
    let boxBorder = '';

    if (tag.status === 'in_progress') {
      // Tek slash '/'
      slashPath = `<line x1="${padding}" y1="${size - padding}" x2="${size - padding}" y2="${padding}" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" />`;
    } else if (tag.status === 'completed' || tag.status === 'cleared') {
      // Tam 'X'
      slashPath = `
        <line x1="${padding}" y1="${size - padding}" x2="${size - padding}" y2="${padding}" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
        <line x1="${padding}" y1="${padding}" x2="${size - padding}" y2="${size - padding}" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
      `;
    }

    if (tag.status === 'cleared') {
      boxBorder = `<rect x="${padding - 4}" y="${padding - 4}" width="${innerSize + 8}" height="${innerSize + 8}" fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="6,4" rx="4" />`;
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="select-none filter drop-shadow-md">
        <!-- Arka plan beton hissi -->
        <rect x="0" y="0" width="${size}" height="${size}" fill="#111827" rx="14" stroke="#374151" stroke-width="1.5" />
        
        <!-- Dış Kutu (1x1m INSARAG Box) -->
        <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" fill="none" stroke="#e5e7eb" stroke-width="2.5" />
        ${boxBorder}

        <!-- Çapraz Slaşlar -->
        ${slashPath}

        <!-- Kadran 1: ÜST (Tarih ve Saat) -->
        <text x="${half}" y="${padding + 22}" fill="#fbbf24" font-size="11.5" font-family="monospace" font-weight="900" text-anchor="middle">
          ${datesText || '06.02 09:00'}
        </text>

        <!-- Kadran 2: SOL (Ekip ID) -->
        <text x="${padding + 10}" y="${half + 4}" fill="#60a5fa" font-size="11" font-family="monospace" font-weight="900" text-anchor="start">
          ${tag.teamId || 'TR-AFAD'}
        </text>

        <!-- Kadran 3: SAĞ (Tehlikeler: Gaz, Asbest, Çökme) -->
        <text x="${size - padding - 10}" y="${half + 4}" fill="#f87171" font-size="12" font-family="monospace" font-weight="900" text-anchor="end">
          ${hazardsText}
        </text>

        <!-- Kadran 4: ALT (Canlı ve Vefat Kazazedeler) -->
        <text x="${half}" y="${size - padding - 14}" fill="#34d399" font-size="12" font-family="monospace" font-weight="900" text-anchor="middle">
          ${victimsText}
        </text>
      </svg>
    `;
  }
}

export const insaragService = new InsaragService();

