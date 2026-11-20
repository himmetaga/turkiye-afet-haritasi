/**
 * openLocationCodeService.ts
 * =============================================================================
 * Google Open Location Code (Plus Codes) Standart Entegrasyonu
 * Açık Kaynak Referansı: https://github.com/google/open-location-code (Apache 2.0)
 * =============================================================================
 * Afet, enkaz ve arama kurtarma sahasında sokak tabelaları ve bina numaraları
 * yıkıldığında koordinatları (enlem/boylam) telsiz üzerinden okumak parazit ve
 * gürültü nedeniyle ciddi can kayıplarına yol açar.
 *
 * Plus Codes, dünya üzerindeki her 14x14 metre veya 3x3 metrelik alanı
 * 10 haneli, sesli harf içermeyen ve harf-rakam karışıklığını önleyen
 * standart bir koda (Örn: 8GG3VX2Q+9R) dönüştürür.
 *
 * Sunucuya istek atmaz, harici kütüphane kullanmaz; telsizde okumayı
 * kolaylaştırmak için NATO fonetik alfabesi karşılıklarını da üretir.
 *
 * Yalnızca 10 haneli TAM kodlar çözülür (ör. 8GHCVX2Q+9R). Google Haritalar'ın
 * paylaştığı kısa kodlar (ör. "VX2Q+9R Fatih") bir referans konum olmadan
 * çözülemez; 11+ haneli kodlar da desteklenmez. Bu durumlarda yanlış koordinat
 * üretmek yerine kod reddedilir (bkz. isShort / getInvalidReason).
 */

export type PlusCodeInvalidReason = 'empty' | 'short' | 'too_long' | 'invalid';

const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
const ENCODING_BASE = 20;
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;
const SEPARATOR = '+';
const SEPARATOR_POSITION = 8;

const NATO_PHONETIC_TR: Record<string, { en: string; tr: string }> = {
  '2': { en: 'Two', tr: 'İki' },
  '3': { en: 'Three', tr: 'Üç' },
  '4': { en: 'Four', tr: 'Dört' },
  '5': { en: 'Five', tr: 'Beş' },
  '6': { en: 'Six', tr: 'Altı' },
  '7': { en: 'Seven', tr: 'Yedi' },
  '8': { en: 'Eight', tr: 'Sekiz' },
  '9': { en: 'Nine', tr: 'Dokuz' },
  'C': { en: 'Charlie', tr: 'Çarli' },
  'F': { en: 'Foxtrot', tr: 'Fokstrot' },
  'G': { en: 'Golf', tr: 'Golf' },
  'H': { en: 'Hotel', tr: 'Otel' },
  'J': { en: 'Juliet', tr: 'Jülyet' },
  'M': { en: 'Mike', tr: 'Mayk' },
  'P': { en: 'Papa', tr: 'Papa' },
  'Q': { en: 'Quebec', tr: 'Kıbek' },
  'R': { en: 'Romeo', tr: 'Romeo' },
  'V': { en: 'Victor', tr: 'Viktor' },
  'W': { en: 'Whiskey', tr: 'Viski' },
  'X': { en: 'X-ray', tr: 'İks-Rey' },
  '+': { en: 'Plus', tr: 'Artı' }
};

export interface PlusCodeArea {
  latitudeCenter: number;
  longitudeCenter: number;
  latitudeLo: number;
  latitudeHi: number;
  longitudeLo: number;
  longitudeHi: number;
  codeLength: number;
}

export interface PhoneticItem {
  char: string;
  nato: string;
  tr: string;
}

export class OpenLocationCodeService {
  /**
   * Verilen enlem ve boylamı 10 haneli Plus Code'a dönüştürür (~14x14m hassasiyet).
   */
  public encode(latitude: number, longitude: number, codeLength = 10): string {
    if (codeLength < 2 || (codeLength < 10 && codeLength % 2 === 1)) {
      codeLength = 10;
    }

    // Enlem ve boylamı normalleştir
    let lat = Math.min(90, Math.max(-90, latitude));
    let lng = longitude;
    while (lng < -180) lng += 360;
    while (lng >= 180) lng -= 360;

    if (lat === 90) {
      lat = lat - 0.0000001;
    }

    let latVal = lat + LATITUDE_MAX;
    let lngVal = lng + LONGITUDE_MAX;

    let code = '';
    let latResolution = 20.0;
    let lngResolution = 20.0;

    // Standart çiftler (ilk 10 basamağa kadar)
    for (let i = 0; i < Math.min(codeLength, 10) / 2; i++) {
      const latDigit = Math.floor(latVal / latResolution);
      const lngDigit = Math.floor(lngVal / lngResolution);

      latVal -= latDigit * latResolution;
      lngVal -= lngDigit * lngResolution;

      code += CODE_ALPHABET.charAt(latDigit);
      code += CODE_ALPHABET.charAt(lngDigit);

      latResolution /= ENCODING_BASE;
      lngResolution /= ENCODING_BASE;

      if (code.length === SEPARATOR_POSITION) {
        code += SEPARATOR;
      }
    }

    if (code.indexOf(SEPARATOR) === -1) {
      if (code.length < SEPARATOR_POSITION) {
        code = code.padEnd(SEPARATOR_POSITION, '0') + SEPARATOR;
      } else {
        code = code.slice(0, SEPARATOR_POSITION) + SEPARATOR + code.slice(SEPARATOR_POSITION);
      }
    }

    return code;
  }

  /**
   * Verilen Plus Code'u çözer ve merkez enlem, boylam ve koordinat kutusunu döndürür.
   */
  public decode(code: string): PlusCodeArea | null {
    if (!this.isValid(code)) return null;

    const clean = code.toUpperCase().trim().replace(/\+/g, '').replace(/0+$/, '');
    let latLo = -LATITUDE_MAX;
    let lngLo = -LONGITUDE_MAX;
    let latRes = 20.0;
    let lngRes = 20.0;

    for (let i = 0; i < clean.length; i += 2) {
      const latIdx = CODE_ALPHABET.indexOf(clean.charAt(i));
      const lngIdx = CODE_ALPHABET.indexOf(clean.charAt(i + 1));

      latLo += latIdx * latRes;
      lngLo += lngIdx * lngRes;

      if (i + 2 < clean.length) {
        latRes /= ENCODING_BASE;
        lngRes /= ENCODING_BASE;
      }
    }

    const latHi = latLo + latRes;
    const lngHi = lngLo + lngRes;

    return {
      latitudeCenter: Number(((latLo + latHi) / 2).toFixed(6)),
      longitudeCenter: Number(((lngLo + lngHi) / 2).toFixed(6)),
      latitudeLo: Number(latLo.toFixed(6)),
      latitudeHi: Number(latHi.toFixed(6)),
      longitudeLo: Number(lngLo.toFixed(6)),
      longitudeHi: Number(lngHi.toFixed(6)),
      codeLength: clean.length
    };
  }

  /**
   * Plus Code geçerliliğini kontrol eder.
   */
  public isValid(code: string): boolean {
    return this.getInvalidReason(code) === null;
  }

  /**
   * Kısa (yerel) kod mu? Ör. "VX2Q+9R" ya da "VX2Q+9R Fatih, İstanbul".
   * Kısa kodlar tek başına konum vermez; decode() bunları çözmez.
   */
  public isShort(code: string): boolean {
    if (!code || typeof code !== 'string') return false;
    const token = code.toUpperCase().trim().split(/[\s,]+/)[0] || '';
    const sepIdx = token.indexOf(SEPARATOR);
    if (sepIdx === -1 || sepIdx !== token.lastIndexOf(SEPARATOR)) return false;
    if (sepIdx < 2 || sepIdx >= SEPARATOR_POSITION || sepIdx % 2 === 1) return false;
    const before = token.slice(0, sepIdx);
    const after = token.slice(sepIdx + 1);
    if (after.length < 2 || after.length > 7) return false;
    for (const ch of before + after) {
      if (CODE_ALPHABET.indexOf(ch) === -1) return false;
    }
    return true;
  }

  /**
   * Kod neden çözülemiyor? Geçerli (10 haneli tam) kod için null döner.
   *  - 'short'    : kısa/yerel kod (ör. VX2Q+9R) — tam kod gerekir
   *  - 'too_long' : 10 haneden uzun kod — desteklenmiyor
   *  - 'invalid'  : biçim hatalı
   */
  public getInvalidReason(code: string): PlusCodeInvalidReason | null {
    if (!code || typeof code !== 'string' || !code.trim()) return 'empty';
    if (this.isShort(code)) return 'short';

    const upper = code.toUpperCase().trim();
    const sepIdx = upper.indexOf(SEPARATOR);
    if (sepIdx !== SEPARATOR_POSITION || sepIdx !== upper.lastIndexOf(SEPARATOR)) return 'invalid';

    const before = upper.slice(0, sepIdx);
    const after = upper.slice(sepIdx + 1);

    const padMatch = before.match(/0+$/);
    const padLength = padMatch ? padMatch[0].length : 0;
    const significant = before.slice(0, before.length - padLength);

    if (padLength > 0) {
      // Dolgulu kodlar (ör. 8GHC0000+) yalnızca artıdan sonrası boşsa geçerlidir.
      if (padLength % 2 === 1 || significant.length < 2 || after.length > 0) return 'invalid';
    } else {
      if (after.length > 2 && /^[23456789CFGHJMPQRVWX]+$/.test(after)) return 'too_long';
      if (after.length !== 2 && after.length !== 0) return 'invalid';
    }

    for (const ch of significant + after) {
      if (CODE_ALPHABET.indexOf(ch) === -1) return 'invalid';
    }

    // İlk çift: enlem en fazla 8 (180°/20°), boylam en fazla 17 (360°/20°) olabilir.
    if (CODE_ALPHABET.indexOf(significant.charAt(0)) > 8) return 'invalid';
    if (CODE_ALPHABET.indexOf(significant.charAt(1)) > 17) return 'invalid';

    return null;
  }

  /**
   * Telsizde okumak için NATO ve Türkçe fonetik heceleme tablosunu üretir.
   */
  public getPhoneticBreakdown(code: string): PhoneticItem[] {
    const clean = code.toUpperCase().trim();
    const result: PhoneticItem[] = [];

    for (let i = 0; i < clean.length; i++) {
      const char = clean.charAt(i);
      const natoItem = NATO_PHONETIC_TR[char] || { en: char, tr: char };
      result.push({
        char,
        nato: natoItem.en,
        tr: natoItem.tr
      });
    }

    return result;
  }

  /**
   * Telsiz telsiz çağrı cümlesi metnini oluşturur.
   */
  public getRadioSpokenPhrase(code: string): string {
    const phonetic = this.getPhoneticBreakdown(code);
    return phonetic.map((p) => (p.char === '+' ? 'ARTI (PLUS)' : `${p.char} (${p.tr})`)).join(' - ');
  }
}

export const openLocationCodeService = new OpenLocationCodeService();

