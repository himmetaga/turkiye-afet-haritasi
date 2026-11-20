/**
 * Orman / arazi yangını yön yardımcısı.
 *
 * Yalnızca basit geometri yapar: kullanıcının girdiği "rüzgarın GELDİĞİ yön"den
 * rüzgarın estiği yönü (yangının genellikle ilerlediği yön) ve rüzgara dik iki
 * yönü hesaplar. Yangının nerede olduğunu BİLMEZ; yayılma hızı, alev boyu veya
 * güvenli mesafe hesaplamaz. Bu yüzden hiçbir yön "güvenli" olarak sunulamaz.
 */

export interface WildfireDirections {
  /** Rüzgarın geldiği yön (0: Kuzey, 90: Doğu, 180: Güney, 270: Batı) */
  windFromDeg: number;
  /** Rüzgarın estiği yön: yangın çoğunlukla bu yöne doğru ilerler */
  downwindDeg: number;
  /** Rüzgara dik iki yön (olası kaçış yönleri — hangisinin yangından uzak olduğuna kullanıcı bakmalı) */
  crosswindADeg: number;
  crosswindBDeg: number;
}

export class WildfireEscapeService {
  private static instance: WildfireEscapeService;

  private constructor() {}

  public static getInstance(): WildfireEscapeService {
    if (!WildfireEscapeService.instance) {
      WildfireEscapeService.instance = new WildfireEscapeService();
    }
    return WildfireEscapeService.instance;
  }

  public getDirections(windFromDeg: number): WildfireDirections {
    const from = ((windFromDeg % 360) + 360) % 360;
    const downwindDeg = (from + 180) % 360;
    return {
      windFromDeg: from,
      downwindDeg,
      crosswindADeg: (downwindDeg + 90) % 360,
      crosswindBDeg: (downwindDeg + 270) % 360
    };
  }

  /**
   * Derece açısını Türkçe pusula yönüne çevirir
   */
  public bearingToText(deg: number): string {
    const d = ((deg % 360) + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'Kuzey (K)';
    if (d >= 22.5 && d < 67.5) return 'Kuzeydoğu (KD)';
    if (d >= 67.5 && d < 112.5) return 'Doğu (D)';
    if (d >= 112.5 && d < 157.5) return 'Güneydoğu (GD)';
    if (d >= 157.5 && d < 202.5) return 'Güney (G)';
    if (d >= 202.5 && d < 247.5) return 'Güneybatı (GB)';
    if (d >= 247.5 && d < 292.5) return 'Batı (B)';
    return 'Kuzeybatı (KB)';
  }
}

export const wildfireEscapeService = WildfireEscapeService.getInstance();
