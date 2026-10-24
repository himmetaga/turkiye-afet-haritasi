export type FloodRiskTier = 'low' | 'moderate' | 'high' | 'critical';

export interface FloodRadarData {
  latitude: number;
  longitude: number;
  precipitationMmPerHour: number;
  riverDischargeM3s: number | null;
  riverDischargeMaxM3s: number | null;
  windSpeedKmH: number;
  humidityPct: number;
  weatherCode: number;
  weatherDescription: string;
  riskTier: FloodRiskTier;
  riskScore: number; // 0 - 100
  hourlyForecast: { hour: string; rainMm: number }[];
  directives: string[];
  isSimulated?: boolean;
  fetchedAt: number;
}

const WMO_WEATHER_CODES: Record<number, string> = {
  0: 'Açık / Güneşli',
  1: 'Az Bulutlu',
  2: 'Parçalı Bulutlu',
  3: 'Kapalı / Bulutlu',
  45: 'Sisli',
  48: 'Kırağılı Sis',
  51: 'Hafif Çisenti',
  53: 'Orta Çisenti',
  55: 'Yoğun Çisenti',
  61: 'Hafif Yağmurlu',
  63: 'Orta Şiddetli Yağmur',
  65: 'Şiddetli Sağanak Yağış',
  80: 'Hafif Sağanak',
  81: 'Kuvvetli Sağanak',
  82: 'Aşırı Sağanak / Fırtına',
  95: 'Gök Gürültülü Fırtına',
  96: 'Gök Gürültülü Dolu / Fırtına',
  99: 'Şiddetli Fırtına & Yoğun Dolu'
};

class FloodRadarService {
  private cache: Map<string, { data: FloodRadarData; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  public async fetchFloodRadar(coords: [number, number]): Promise<FloodRadarData> {
    const [lng, lat] = coords;
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    try {
      const weatherPromise = this.fetchWeather(lat, lng);
      const floodPromise = this.fetchRiverDischarge(lat, lng);

      const [weather, flood] = await Promise.allSettled([weatherPromise, floodPromise]);

      const weatherData = weather.status === 'fulfilled' ? weather.value : null;
      const floodData = flood.status === 'fulfilled' ? flood.value : null;

      const precip = weatherData?.precipitation ?? 0;
      const windSpeed = weatherData?.windSpeed ?? 0;
      const humidity = weatherData?.humidity ?? 50;
      const weatherCode = weatherData?.weatherCode ?? 0;
      const hourly = weatherData?.hourly ?? [];

      const discharge = floodData?.discharge ?? null;
      const dischargeMax = floodData?.dischargeMax ?? null;

      const { riskTier, riskScore } = this.calculateRisk(precip, discharge, dischargeMax, weatherCode);
      const directives = this.getDirectivesForRisk(riskTier, precip);

      const result: FloodRadarData = {
        latitude: lat,
        longitude: lng,
        precipitationMmPerHour: precip,
        riverDischargeM3s: discharge,
        riverDischargeMaxM3s: dischargeMax,
        windSpeedKmH: windSpeed,
        humidityPct: humidity,
        weatherCode,
        weatherDescription: WMO_WEATHER_CODES[weatherCode] || 'Normal Hava Durumu',
        riskTier,
        riskScore,
        hourlyForecast: hourly,
        directives,
        fetchedAt: Date.now()
      };

      this.cache.set(cacheKey, { data: result, expiresAt: Date.now() + this.CACHE_TTL_MS });
      return result;
    } catch {
      // Fallback in case of complete network failure
      return this.getOfflineFallback(lat, lng);
    }
  }

  private async fetchWeather(lat: number, lng: number): Promise<{
    precipitation: number;
    windSpeed: number;
    humidity: number;
    weatherCode: number;
    hourly: { hour: string; rainMm: number }[];
  }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=precipitation,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation,weather_code&forecast_days=1&timezone=auto`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('Weather API error');
      const j = await res.json();

      const current = j.current || {};
      const hourlyRaw = j.hourly || {};
      const times: string[] = hourlyRaw.time || [];
      const precips: number[] = hourlyRaw.precipitation || [];

      const currentHour = new Date().getHours();
      const hourly: { hour: string; rainMm: number }[] = [];

      for (let i = 0; i < Math.min(times.length, 12); i++) {
        const timeStr = times[i];
        const h = timeStr ? timeStr.split('T')[1]?.slice(0, 5) || `${i}:00` : `${i}:00`;
        hourly.push({
          hour: h,
          rainMm: Number((precips[i] || 0).toFixed(1))
        });
      }

      return {
        precipitation: Number((current.precipitation || 0).toFixed(1)),
        windSpeed: Number((current.wind_speed_10m || 0).toFixed(1)),
        humidity: Math.round(current.relative_humidity_2m || 50),
        weatherCode: current.weather_code ?? 0,
        hourly
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchRiverDischarge(lat: number, lng: number): Promise<{
    discharge: number | null;
    dischargeMax: number | null;
  }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    // Open-Meteo European Commission GloFAS river discharge API
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&daily=river_discharge,river_discharge_max&forecast_days=3`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('Flood API error');
      const j = await res.json();

      const daily = j.daily || {};
      const dischargeList: (number | null)[] = daily.river_discharge || [];
      const dischargeMaxList: (number | null)[] = daily.river_discharge_max || [];

      const discharge = dischargeList[0] !== undefined && dischargeList[0] !== null ? Number(dischargeList[0].toFixed(1)) : null;
      const dischargeMax = dischargeMaxList[0] !== undefined && dischargeMaxList[0] !== null ? Number(dischargeMaxList[0].toFixed(1)) : null;

      return { discharge, dischargeMax };
    } finally {
      clearTimeout(timeout);
    }
  }

  private calculateRisk(
    precip: number,
    discharge: number | null,
    dischargeMax: number | null,
    weatherCode: number
  ): { riskTier: FloodRiskTier; riskScore: number } {
    let score = 0;

    // Precipitation contribution (0 - 50 pts)
    if (precip >= 25) score += 50;
    else if (precip >= 15) score += 40;
    else if (precip >= 7) score += 25;
    else if (precip >= 2) score += 12;
    else if (precip > 0) score += 5;

    // Severe weather code contribution (0 - 30 pts)
    if ([82, 95, 96, 99].includes(weatherCode)) score += 30; // Severe thunderstorm / extreme shower
    else if ([65, 81].includes(weatherCode)) score += 20; // Heavy rain
    else if ([63, 80].includes(weatherCode)) score += 10;

    // GloFAS river discharge anomaly contribution (0 - 20 pts)
    if (discharge !== null && dischargeMax !== null && dischargeMax > 0) {
      const ratio = discharge / dischargeMax;
      if (ratio > 0.85) score += 20;
      else if (ratio > 0.6) score += 10;
    }

    score = Math.min(100, Math.max(0, score));

    let riskTier: FloodRiskTier = 'low';
    if (score >= 70) riskTier = 'critical';
    else if (score >= 45) riskTier = 'high';
    else if (score >= 20) riskTier = 'moderate';

    return { riskTier, riskScore: score };
  }

  public getDirectivesForRisk(tier: FloodRiskTier, precip: number): string[] {
    switch (tier) {
      case 'critical':
        return [
          '🚨 ACİL TAŞKIN & ANİ SEL RİSKİ: Dere yatağı ve su kanallarından derhal yüksek tepelere çıkın.',
          '🚗 15 CM KURALI: Asla araçla su birikintisine girmeyin; 30 cm su otomobilleri sürükler.',
          '🚪 BODRUM KATINI TERK EDİN: Su seviyesi yükseliyorsa üst katlara geçin, eşya kurtarmaya inmeyin.',
          '⚡ ELEKTRİK & TRAFOLAR: Su altındaki elektrik kaçakları ölümcüldür; su basan odaların şalterini indirin.',
          '🚷 AÇIK RÖGAR TEHLİKESİ: Sel suları basınçla kanalizasyon kapaklarını fırlatır; bulanık suya adım atmayın.'
        ];
      case 'high':
        return [
          '⚠️ KUVVETLİ YAĞIŞ ALARMI: Yağış miktarı taşkın eşiğine yaklaştı (${precip} mm/s).',
          '🚗 Alt geçit, dere kenarı ve çukur otopark alanlarını terk edin.',
          '📻 Yetkili kurumların (AFAD, MGM) güncel meteorolojik uyarılarını takip edin.',
          '🎒 Acil durum çantanızı ve su geçirmez poşet içindeki evraklarınızı yanınıza alın.'
        ];
      case 'moderate':
        return [
          '🟡 DİKKAT: Şiddetli sağanak ve yerel su birikintisi riski mevcut.',
          'Gider ve ızgaraların tıkalı olmadığından emin olun.',
          'Yola çıkacaksanız sel eğilimli alt geçit güzergahlarını kullanmayın.'
        ];
      case 'low':
      default:
        return [
          '🟢 DURUM NORMAL: Bölgenizde kritik bir taşkın veya aşırı yağış anomalisi saptanmadı.',
          'Dere yataklarına yapılaşmadan ve dere bentlerini tıkamaktan kaçının.',
          'Olası ani hava değişikliklerinde radarı yeniden kontrol edebilirsiniz.'
        ];
    }
  }

  public getSimulationData(tier: FloodRiskTier, coords: [number, number]): FloodRadarData {
    const [lng, lat] = coords;
    const precipMap: Record<FloodRiskTier, number> = {
      low: 0.2,
      moderate: 8.5,
      high: 19.4,
      critical: 38.6
    };
    const scoreMap: Record<FloodRiskTier, number> = {
      low: 5,
      moderate: 35,
      high: 62,
      critical: 94
    };
    const codeMap: Record<FloodRiskTier, number> = {
      low: 2,
      moderate: 63,
      high: 65,
      critical: 82
    };

    const precip = precipMap[tier];

    return {
      latitude: lat,
      longitude: lng,
      precipitationMmPerHour: precip,
      riverDischargeM3s: tier === 'critical' ? 240.5 : tier === 'high' ? 120.0 : 35.2,
      riverDischargeMaxM3s: tier === 'critical' ? 260.0 : 150.0,
      windSpeedKmH: tier === 'critical' ? 68.4 : 24.0,
      humidityPct: tier === 'critical' ? 96 : 78,
      weatherCode: codeMap[tier],
      weatherDescription: WMO_WEATHER_CODES[codeMap[tier]] || 'Simülasyon Durumu',
      riskTier: tier,
      riskScore: scoreMap[tier],
      hourlyForecast: [
        { hour: '+1h', rainMm: precip },
        { hour: '+2h', rainMm: Number((precip * 1.2).toFixed(1)) },
        { hour: '+3h', rainMm: Number((precip * 0.9).toFixed(1)) },
        { hour: '+4h', rainMm: Number((precip * 0.5).toFixed(1)) }
      ],
      directives: this.getDirectivesForRisk(tier, precip),
      isSimulated: true,
      fetchedAt: Date.now()
    };
  }

  private getOfflineFallback(lat: number, lng: number): FloodRadarData {
    return {
      latitude: lat,
      longitude: lng,
      precipitationMmPerHour: 0,
      riverDischargeM3s: null,
      riverDischargeMaxM3s: null,
      windSpeedKmH: 0,
      humidityPct: 55,
      weatherCode: 0,
      weatherDescription: 'Çevrimdışı / Kayıtlı Güvenlik Modu',
      riskTier: 'low',
      riskScore: 10,
      hourlyForecast: [],
      directives: this.getDirectivesForRisk('low', 0),
      fetchedAt: Date.now()
    };
  }
}

export const floodRadarService = new FloodRadarService();
