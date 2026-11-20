export interface AirQualityData {
  time: string;
  aqi: number;
  aqiLevel: 'good' | 'fair' | 'moderate' | 'poor' | 'very_poor';
  aqiLabel: string;
  aqiColorClass: string;
  pm25: number;
  pm10: number;
  co: number | null; // carbon monoxide (model verisi yoksa null)
  no2: number | null;
  so2: number | null;
  ozone: number | null;
  /** Modelin partikül (PM) düzeyi sınıfı. Enkaz tozunu ÖLÇMEZ. */
  debrisRisk: 'low' | 'moderate' | 'high' | 'critical';
  /** Dış ortam model CO sınıfı. Kapalı alandaki CO'yu ÖLÇMEZ. 'unknown': veri yok. */
  generatorRisk: 'safe' | 'warning' | 'danger' | 'unknown';
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

      // Eksik alanlar için değer UYDURULMAZ: temel alanlardan biri yoksa veri yok sayılır.
      const num = (v: unknown): number | null =>
        typeof v === 'number' && Number.isFinite(v) ? v : null;
      const aqiRaw = num(curr.european_aqi);
      const pm25 = num(curr.pm2_5);
      const pm10 = num(curr.pm10);
      if (aqiRaw === null || pm25 === null || pm10 === null) return null;

      const aqi = Math.round(aqiRaw);
      const co = num(curr.carbon_monoxide);
      const no2 = num(curr.nitrogen_dioxide);
      const so2 = num(curr.sulphur_dioxide);
      const ozone = num(curr.ozone);

      let aqiLevel: AirQualityData['aqiLevel'] = 'good';
      let aqiLabel = 'İyi';
      let aqiColorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

      if (aqi > 80 || pm25 > 50) {
        aqiLevel = 'very_poor';
        aqiLabel = 'Çok Kötü';
        aqiColorClass = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      } else if (aqi > 60 || pm25 > 35) {
        aqiLevel = 'poor';
        aqiLabel = 'Kötü';
        aqiColorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      } else if (aqi > 40 || pm25 > 20) {
        aqiLevel = 'moderate';
        aqiLabel = 'Orta';
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
      if (co === null) generatorRisk = 'unknown';
      else if (co > 1000) generatorRisk = 'danger';
      else if (co > 500) generatorRisk = 'warning';

      let maskAdvice =
        'Model tahminine göre partikül düzeyi düşük. Bu veri enkaz tozunu ölçmez: yıkım veya enkaz yakınındaysanız yine de FFP2/N95 maske takın.';
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
      // Bu uyarı ölçüme bağlı değildir; her zaman gösterilir.
      guidelines.push('Jeneratörleri ASLA çadır, ev, otopark veya kapalı alanda çalıştırmayın (karbonmonoksit kokusuzdur ve öldürür). Bu ekran kapalı alandaki karbonmonoksiti ölçemez.');
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
