/**
 * insaragService.ts
 * =============================================================================
 * Enkaz üzerindeki arama işaretleri için BASİTLEŞTİRİLMİŞ yardımcı.
 *
 * Bu dosya resmi INSARAG el kitabının uygulaması DEĞİLDİR. Buradaki
 * "tek çizgi / çarpı + dört bölme" düzeni ABD FEMA arama işaretlerine benzer;
 * sahadaki ekipler farklı sistemler kullanabilir. Bu yüzden:
 *  - hiçbir işaret "bina güvenli / temizlendi" diye yorumlanmaz,
 *  - L / D sayıları "kurtarıldı" diye yorumlanmaz,
 *  - örnek/uydurma ekip kodu, tarih ya da sayı gösterilmez.
 * Tek sabit öneri: binaya girmeyin, işaretin anlamını sahadaki ekipten teyit edin.
 */

import { escapeHtml } from '../utils/safeText';

export type InsaragStatus =
  | 'in_progress' // '/' tek çizgi
  | 'completed'; // 'X' çarpı

export interface InsaragTag {
  teamId: string;
  startDate: string;
  endDate?: string;
  liveCount: number;
  deadCount: number;
  hazards: string[];
  status: InsaragStatus;
  notes?: string;
}

export interface DecodedExplanation {
  headline: string;
  statusBadge: string;
  statusColor: string;
  teamSummary: string;
  victimSummary: string;
  hazardSummary: string;
  /** Her zaman false: bu yardımcı hiçbir işareti "girilebilir" diye yorumlamaz. */
  isSafeToEnter: boolean;
  recommendation: string;
}

/** Bu ekranda seçim kolaylığı için kullanılan kısaltmalar; resmi kod listesi değildir. */
export const COMMON_HAZARDS = [
  { code: 'GAZ', label: 'Gaz kokusu / patlama riski', danger: 'high' },
  { code: 'ELK', label: 'Açıkta elektrik kablosu', danger: 'high' },
  { code: 'ÇÖK', label: 'Çökme riski', danger: 'critical' },
  { code: 'TOZ', label: 'Asbest / zararlı toz', danger: 'medium' },
  { code: 'SU', label: 'Su baskını / patlak boru', danger: 'medium' }
];

export const INSARAG_FIXED_RECOMMENDATION =
  'İşaret ne olursa olsun binaya girmeyin; işaretin anlamını sahadaki ekipten teyit edin.';

export class InsaragService {
  /**
   * Seçilen işaret parçalarını temkinli bir Türkçe açıklamaya çevirir.
   */
  public decode(tag: InsaragTag): DecodedExplanation {
    const inProgress = tag.status === 'in_progress';

    const headline = inProgress
      ? 'TEK ÇİZGİ ( / ): Bir ekip aramaya başlamış; arama sürüyor olabilir'
      : 'ÇARPI ( X ): Bir ekip bu noktadaki aramasını bitirmiş olabilir';
    const statusBadge = inProgress ? 'Tek çizgi ( / )' : 'Çarpı ( X )';
    const statusColor = inProgress ? 'text-amber-400' : 'text-blue-400';

    const team = tag.teamId.trim();
    const date = tag.startDate.trim();
    const teamSummary =
      team || date
        ? `İşarette yazan ekip kodu: ${team || 'girilmedi'} · tarih/saat: ${date || 'girilmedi'}`
        : 'Ekip kodu ve tarih girilmedi.';

    const victimSummary = `İşaretlenen canlı (L): ${tag.liveCount} · İşaretlenen vefat (D): ${tag.deadCount} — bu sayılar içeride tespit edilen kişileri gösterebilir; "kurtarıldı" anlamına gelmez.`;

    let hazardSummary: string;
    if (tag.hazards.length === 0) {
      hazardSummary = 'Tehlike notu seçilmedi — bu, binanın güvenli olduğu anlamına gelmez.';
    } else {
      const hazardLabels = tag.hazards.map((h) => {
        const found = COMMON_HAZARDS.find((x) => x.code === h);
        return found ? found.label : h;
      });
      hazardSummary = `İşaretlenen tehlikeler: ${hazardLabels.join(', ')}`;
    }

    return {
      headline,
      statusBadge,
      statusColor,
      teamSummary,
      victimSummary,
      hazardSummary,
      isSafeToEnter: false,
      recommendation: INSARAG_FIXED_RECOMMENDATION
    };
  }

  /**
   * Seçilen parçaların şematik çizimini üretir. Boş alanlar boş bırakılır;
   * örnek ekip kodu ya da tarih yazılmaz.
   */
  public generateSvg(tag: InsaragTag, size = 260): string {
    const half = size / 2;
    const padding = 16;
    const innerSize = size - padding * 2;

    const hazardsText = escapeHtml(tag.hazards.join(','));
    const datesText = escapeHtml(tag.endDate ? `${tag.startDate}-${tag.endDate}` : tag.startDate);
    const teamText = escapeHtml(tag.teamId);
    const victimsText = `L:${Number(tag.liveCount) || 0} D:${Number(tag.deadCount) || 0}`;

    let slashPath = '';

    if (tag.status === 'in_progress') {
      // Tek çizgi '/'
      slashPath = `<line x1="${padding}" y1="${size - padding}" x2="${size - padding}" y2="${padding}" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" />`;
    } else {
      // Çarpı 'X'
      slashPath = `
        <line x1="${padding}" y1="${size - padding}" x2="${size - padding}" y2="${padding}" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
        <line x1="${padding}" y1="${padding}" x2="${size - padding}" y2="${size - padding}" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
      `;
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="select-none filter drop-shadow-md">
        <rect x="0" y="0" width="${size}" height="${size}" fill="#111827" rx="14" stroke="#374151" stroke-width="1.5" />
        <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" fill="none" stroke="#e5e7eb" stroke-width="2.5" />

        ${slashPath}

        <!-- ÜST: tarih ve saat -->
        <text x="${half}" y="${padding + 22}" fill="#fbbf24" font-size="11.5" font-family="monospace" font-weight="900" text-anchor="middle">
          ${datesText}
        </text>

        <!-- SOL: ekip kodu -->
        <text x="${padding + 10}" y="${half + 4}" fill="#60a5fa" font-size="11" font-family="monospace" font-weight="900" text-anchor="start">
          ${teamText}
        </text>

        <!-- SAĞ: tehlike notları -->
        <text x="${size - padding - 10}" y="${half + 4}" fill="#f87171" font-size="12" font-family="monospace" font-weight="900" text-anchor="end">
          ${hazardsText}
        </text>

        <!-- ALT: L / D sayıları -->
        <text x="${half}" y="${size - padding - 14}" fill="#34d399" font-size="12" font-family="monospace" font-weight="900" text-anchor="middle">
          ${victimsText}
        </text>
      </svg>
    `;
  }
}

export const insaragService = new InsaragService();
