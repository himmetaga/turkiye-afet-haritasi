/**
 * afetBilgiService.ts
 * =============================================================================
 * Afet yardım hatları.
 *
 * Bu dosyada eskiden elle yazılmış bir "sahra noktası" listesi (aşevi, çadırkent
 * vb.) vardı. O liste güncel bir kaynaktan gelmiyordu ve afet anında insanları
 * var olmayan noktalara yönlendirebilirdi; bu yüzden tamamen kaldırıldı.
 * Güncel yardım noktaları yalnızca AFAD ve Kızılay tarafından duyurulur.
 */

export interface EmergencyHotline {
  number: string;
  name: string;
  operator: string;
  purpose: string;
}

const EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    number: '112',
    name: '112 Acil Çağrı Merkezi',
    operator: 'İçişleri Bakanlığı',
    purpose: 'Tek acil numara: ambulans, itfaiye, polis, jandarma, AFAD arama kurtarma.'
  },
  {
    number: '168',
    name: 'Kızılay Çağrı Merkezi',
    operator: 'Türk Kızılay',
    purpose: 'Beslenme, barınma yardımı ve kan bağışı bilgisi.'
  },
  {
    number: '184',
    name: 'ALO 184 Sağlık Danışma (SABİM)',
    operator: 'Sağlık Bakanlığı',
    purpose: 'Sağlık hizmetleri ile ilgili danışma ve bilgi.'
  },
  {
    number: '144',
    name: 'ALO 144 Sosyal Yardım',
    operator: 'Aile ve Sosyal Hizmetler Bakanlığı',
    purpose: 'Sosyal yardım başvuru ve bilgi hattı.'
  }
];

export class AfetBilgiService {
  /** Acil durum ve yardım çağrı hatlarını listeler. */
  public getEmergencyHotlines(): EmergencyHotline[] {
    return EMERGENCY_HOTLINES;
  }
}

export const afetBilgiService = new AfetBilgiService();
