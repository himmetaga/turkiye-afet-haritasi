export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  name: string;
}

export interface WalkingRouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationMinutes: number;
  steps: RouteStep[];
  isOffline: boolean;
}

const ROUTE_CACHE_KEY = 'afet_walking_routes';

function getCachedRoute(from: [number, number], to: [number, number]): WalkingRouteResult | null {
  try {
    const key = `${from[0].toFixed(4)},${from[1].toFixed(4)}-${to[0].toFixed(4)},${to[1].toFixed(4)}`;
    const raw = localStorage.getItem(ROUTE_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    return cache[key] || null;
  } catch {
    return null;
  }
}

function setCachedRoute(from: [number, number], to: [number, number], route: WalkingRouteResult): void {
  try {
    const key = `${from[0].toFixed(4)},${from[1].toFixed(4)}-${to[0].toFixed(4)},${to[1].toFixed(4)}`;
    const raw = localStorage.getItem(ROUTE_CACHE_KEY) || '{}';
    const cache = JSON.parse(raw);
    cache[key] = route;
    // Keep max 50 cached routes
    const keys = Object.keys(cache);
    if (keys.length > 50) {
      delete cache[keys[0]];
    }
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export async function fetchWalkingRoute(
  from: [number, number],
  to: [number, number]
): Promise<WalkingRouteResult> {
  const cached = getCachedRoute(from, to);
  if (cached) return cached;

  const [fromLon, fromLat] = from;
  const [toLon, toLat] = to;

  const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson&steps=true`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates;
        const distanceMeters = Math.round(route.distance);
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));

        const steps: RouteStep[] = [];
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          for (const s of route.legs[0].steps) {
            if (s.maneuver && s.distance > 5) {
              const type = s.maneuver.type;
              const modifier = s.maneuver.modifier || '';
              let instr = 'Düz ilerleyin';
              if (modifier.includes('right')) instr = 'Sağa dönün';
              else if (modifier.includes('left')) instr = 'Sola dönün';
              else if (type === 'arrive') instr = 'Toplanma alanına ulaştınız';

              steps.push({
                instruction: instr,
                distanceMeters: Math.round(s.distance),
                name: s.name || 'İsimsiz Sokak'
              });
            }
          }
        }

        const result: WalkingRouteResult = {
          coordinates,
          distanceMeters,
          durationMinutes,
          steps,
          isOffline: false
        };

        setCachedRoute(from, to, result);
        return result;
      }
    }
  } catch {
    clearTimeout(timeoutId);
  }

  // Offline / Fallback: Realistic orthogonal street-grid path generator
  return generateStreetGridFallback(from, to);
}

function generateStreetGridFallback(
  from: [number, number],
  to: [number, number]
): WalkingRouteResult {
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;

  // Real streets turn at blocks. Instead of a diagonal straight line ("kuş uçuşu"),
  // we break the path into cardinal street segments (L-shape / Z-shape street turns).
  const midLat = lat1 + (lat2 - lat1) * 0.45;
  const midLon = lon1 + (lon2 - lon1) * 0.55;

  const points: [number, number][] = [
    [lon1, lat1],
    [lon1, midLat],
    [midLon, midLat],
    [midLon, lat2],
    [lon2, lat2]
  ];

  // Calculate total path distance
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dLon = (points[i + 1][0] - points[i][0]) * 111320 * Math.cos((lat1 * Math.PI) / 180);
    const dLat = (points[i + 1][1] - points[i][1]) * 110540;
    totalDistance += Math.sqrt(dLon * dLon + dLat * dLat);
  }

  const distanceMeters = Math.round(totalDistance);
  const durationMinutes = Math.max(1, Math.round(distanceMeters / 75));

  return {
    coordinates: points,
    distanceMeters,
    durationMinutes,
    steps: [
      { instruction: 'Sokak boyunca ilerleyin', distanceMeters: Math.round(distanceMeters * 0.4), name: 'Ana Cadde' },
      { instruction: 'Sola dönün', distanceMeters: Math.round(distanceMeters * 0.4), name: 'Sokak' },
      { instruction: 'Toplanma alanına ulaştınız', distanceMeters: Math.round(distanceMeters * 0.2), name: 'Afet Alanı' }
    ],
    isOffline: true
  };
}
