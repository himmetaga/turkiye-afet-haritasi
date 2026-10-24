export interface AirQualityData {
  time: string;
  aqi: number;
  aqiLevel: 'good' | 'fair' | 'moderate' | 'poor' | 'very_poor';
  aqiLabel: string;
  aqiColorClass: string;
  pm25: number;
  pm10: number;
  co: number; // carbon monoxide
  no2: number;
  so2: number;
  ozone: number;
  debrisRisk: 'low' | 'moderate' | 'high' | 'critical';
  generatorRisk: 'safe' | 'warning' | 'danger';
  maskAdvice: string;
  guidelines: string[];
}

class AirQualityService {
  private cache = new Map<string, { data: AirQualityData; timestamp: number }>();
  private CACHE_DURATION_MS = 15 * 60 * 1000; // 15 mins

  public async fetchAirQuality(lat: number, lng: number): Promise<AirQualityData | null> {
    const key = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      const curr = json.current;
      if (!curr) return null;

      const aqi = Math.round(curr.european_aqi ?? 20);
      const pm25 = Number(curr.pm2_5 ?? 10);
      const pm10 = Number(curr.pm10 ?? 15);
      const co = Number(curr.carbon_monoxide ?? 200);
      const no2 = Number(curr.nitrogen_dioxide ?? 10);
      const so2 = Number(curr.sulphur_dioxide ?? 2);
      const ozone = Number(curr.ozone ?? 50);

      let aqiLevel: AirQualityData['aqiLevel'] = 'good';
      let aqiLabel = 'Temiz & Güvenli';
      let aqiColorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

      if (aqi > 80 || pm25 > 50) {
        aqiLevel = 'very_poor';
        aqiLabel = 'Ağır Tehlikeli / Duman';
        aqiColorClass = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      } else if (aqi > 60 || pm25 > 35) {
        aqiLevel = 'poor';
        aqiLabel = 'Sağlıksız / Yoğun Toz';
        aqiColorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      } else if (aqi > 40 || pm25 > 20) {
        aqiLevel = 'moderate';
        aqiLabel = 'Orta / Hassas';
        aqiColorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      } else if (aqi > 20) {
        aqiLevel = 'fair';
        aqiLabel = 'Kabul Edilebilir';
        aqiColorClass = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      }

      // Rubble debris & asbestos particulate risk
      let debrisRisk: AirQualityData['debrisRisk'] = 'low';
      if (pm10 > 100 || pm25 > 70) debrisRisk = 'critical';
      else if (pm10 > 50 || pm25 > 35) debrisRisk = 'high';
      else if (pm10 > 30 || pm25 > 20) debrisRisk = 'moderate';

      // Carbon monoxide generator & indoor fire risk
      let generatorRisk: AirQualityData['generatorRisk'] = 'safe';
      if (co > 1000) generatorRisk = 'danger';
      else if (co > 500) generatorRisk = 'warning';

      let maskAdvice = 'Normal ortam, standart cerrahi maske yeterlidir.';
      if (pm25 > 35 || pm10 > 50) {
        maskAdvice = '⚠️ FFP2 / FFP3 veya N95 toz/partikül maskesi takılması zorunludur.';
      } else if (pm25 > 20) {
        maskAdvice = 'Hassas bireyler ve astım hastaları dışarıda FFP2/N95 maske kullanmalıdır.';
      }

      const guidelines: string[] = [];
      if (debrisRisk === 'high' || debrisRisk === 'critical') {
        guidelines.push('Enkaz yıkıntısı ve toz bölgelerinde asbest liflerine karşı N95/FFP3 maskesiz bulunmayın.');
        guidelines.push('Gözleri korumak için toz gözlüğü (goggle) takın.');
      }
      if (generatorRisk !== 'safe') {
        guidelines.push('🚨 JENERATÖR TEHLİKESİ: Jeneratörleri ASLA çadır, ev, otopark veya kapalı alanda çalıştırmayın (Karbonmonoksit kokusuz öldürür).');
      }
      guidelines.push('Çadır veya geçici barınaklarda mangal veya açık tüplü ısıtıcı ile uyumayın.');
      guidelines.push('Yoğun duman durumunda ıslak bezle ağız-burun bölgesini kapatın ve alçak seviyede kalın.');

      const data: AirQualityData = {
        time: curr.time,
        aqi,
        aqiLevel,
        aqiLabel,
        aqiColorClass,
        pm25,
        pm10,
        co,
        no2,
        so2,
        ozone,
        debrisRisk,
        generatorRisk,
        maskAdvice,
        guidelines
      };

      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch {
      return null;
    }
  }
}

export const airQualityService = new AirQualityService();
