import { EmergencyFacility } from '../types';
import { haversineDistanceMeters } from '../utils/geoMath';

/** Bugünün nöbetçi eczanelerini resmi olarak sorgulamak için e-Devlet hizmeti. */
export const OFFICIAL_DUTY_PHARMACY_URL = 'https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama';

export interface LivePharmacyPayload {
  province: string;
  date: string;
  count: number;
  officialUrl?: string;
  pharmacies: Array<{
    id: string;
    name: string;
    city: string;
    district: string;
    neighborhood?: string;
    address: string;
    phone: string;
    isDuty: boolean;
    dutyDate: string;
    source?: string;
    coordinates: [number, number];
  }>;
}

export class LivePharmacyService {
  private static instance: LivePharmacyService;
  private cachedPharmaciesByProv: Map<string, EmergencyFacility[]> = new Map();

  public static getInstance(): LivePharmacyService {
    if (!LivePharmacyService.instance) {
      LivePharmacyService.instance = new LivePharmacyService();
    }
    return LivePharmacyService.instance;
  }

  public getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public getFormattedTodayDate(): string {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]}`;
  }

  /**
   * Bugünün nöbetçi eczanelerini resmi açık veri API'lerinden çeker.
   * Kaynak yoksa veya erişilemezse boş liste döner; asla veri üretilmez.
   */
  public async fetchDutyPharmacies(province: string = 'istanbul', district?: string): Promise<EmergencyFacility[]> {
    const today = this.getTodayDateString();
    const cleanDist = (district || '').trim().toLowerCase();
    const cacheKey = `${province.toLowerCase()}_${cleanDist}_${today}`;

    const cached = this.cachedPharmaciesByProv.get(cacheKey);
    if (cached) return cached;

    try {
      let endpoint = `/api/duty-pharmacies?province=${encodeURIComponent(province)}`;
      if (cleanDist) {
        endpoint += `&district=${encodeURIComponent(cleanDist)}`;
      }
      const res = await fetch(endpoint);
      if (!res.ok) return [];

      const data: LivePharmacyPayload = await res.json();
      if (!data || !Array.isArray(data.pharmacies)) return [];

      const facilities: EmergencyFacility[] = data.pharmacies
        .filter((p) => Array.isArray(p.coordinates) && p.coordinates.length === 2)
        .map((p, idx) => ({
          id: p.id || `live-pharm-${province}-${cleanDist || 'all'}-${idx + 1}`,
          name: p.name,
          category: 'pharmacy',
          city: p.city || province,
          district: p.district || '',
          neighborhood: p.neighborhood || '',
          address: p.address || '',
          phone: p.phone || '',
          typeText: 'Nöbetçi Eczane',
          emergencyBeds: 0,
          hasTraumaCenter: false,
          helipad: false,
          isDuty: true,
          dutyDate: p.dutyDate || data.date || today,
          source: p.source,
          coordinates: p.coordinates
        }));

      this.cachedPharmaciesByProv.set(cacheKey, facilities);
      return facilities;
    } catch {
      return [];
    }
  }

  /**
   * Canlı nöbetçi eczaneleri mevcut (OpenStreetMap) eczane listesine ekler.
   * Aynı eczanenin iki kez görünmemesi için canlı kaydın 80 m yakınındaki
   * OSM kaydı listeden çıkarılır.
   */
  public mergeLivePharmacies(
    existingFacilities: EmergencyFacility[],
    livePharmacies: EmergencyFacility[]
  ): EmergencyFacility[] {
    if (!livePharmacies || livePharmacies.length === 0) {
      return existingFacilities;
    }

    const liveIds = new Set(livePharmacies.map((p) => p.id));
    const kept = existingFacilities.filter((f) => {
      if (f.category !== 'pharmacy') return true;
      if (liveIds.has(f.id)) return false;
      if (f.isDuty) return true;
      return !livePharmacies.some((p) => haversineDistanceMeters(p.coordinates, f.coordinates) < 80);
    });

    return [...kept, ...livePharmacies];
  }
}

export const livePharmacyService = LivePharmacyService.getInstance();
