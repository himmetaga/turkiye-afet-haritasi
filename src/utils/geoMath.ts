import { AssemblyPoint, NearestResult, FaultLine, NearestFaultResult, ObstaclePoint } from '../types';

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

export function calculateBearingDegrees(
  from: [number, number],
  to: [number, number]
): number {
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.cos(toRad(lon2 - lon1));

  const brng = toDeg(Math.atan2(y, x));
  return Math.round((brng + 360) % 360);
}

export function estimateWalkingMinutes(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / 75));
}

export function findNearestAssemblyPoints(
  userCoord: [number, number],
  points: AssemblyPoint[],
  limit = 3
): NearestResult[] {
  if (!points || points.length === 0) return [];

  const [uLon, uLat] = userCoord;
  const cosLat = Math.cos((uLat * Math.PI) / 180);

  const candidates = points
    .map((p) => {
      const dLon = (p.coordinates[0] - uLon) * cosLat;
      const dLat = p.coordinates[1] - uLat;
      return { p, sqDist: dLon * dLon + dLat * dLat };
    })
    .sort((a, b) => a.sqDist - b.sqDist)
    .slice(0, Math.max(limit * 2, 10));

  const list: NearestResult[] = candidates.slice(0, limit).map(({ p }) => {
    const dist = haversineDistanceMeters(userCoord, p.coordinates);
    const bearing = calculateBearingDegrees(userCoord, p.coordinates);
    const walking = estimateWalkingMinutes(dist);
    return {
      point: {
        ...p,
        distanceMeters: dist,
        walkingMinutes: walking,
        bearingDegrees: bearing
      },
      distanceMeters: dist,
      walkingMinutes: walking,
      bearingDegrees: bearing
    };
  });

  return list;
}

export function getBearingDirectionText(bearing: number): string {
  const directions = [
    { label: 'Kuzey (K)', min: 337.5, max: 360 },
    { label: 'Kuzey (K)', min: 0, max: 22.5 },
    { label: 'Kuzeydoğu (KD)', min: 22.5, max: 67.5 },
    { label: 'Doğu (D)', min: 67.5, max: 112.5 },
    { label: 'Güneydoğu (GD)', min: 112.5, max: 157.5 },
    { label: 'Güney (G)', min: 157.5, max: 202.5 },
    { label: 'Güneybatı (GB)', min: 202.5, max: 247.5 },
    { label: 'Batı (B)', min: 247.5, max: 292.5 },
    { label: 'Kuzeybatı (KB)', min: 292.5, max: 337.5 }
  ];

  for (const d of directions) {
    if (bearing >= d.min && bearing < d.max) return d.label;
  }
  return 'Kuzey (K)';
}

/**
 * Calculates the closest point on segment AB to point P and returns the haversine distance in meters
 */
export function distanceToSegmentMeters(
  point: [number, number],
  segStart: [number, number],
  segEnd: [number, number]
): { distanceMeters: number; closestPoint: [number, number] } {
  const [pLon, pLat] = point;
  const [aLon, aLat] = segStart;
  const [bLon, bLat] = segEnd;

  const midLatRad = (((aLat + bLat) / 2) * Math.PI) / 180;
  const cosLat = Math.cos(midLatRad);

  const dx = (bLon - aLon) * cosLat;
  const dy = bLat - aLat;
  const segLengthSq = dx * dx + dy * dy;

  if (segLengthSq === 0) {
    return {
      distanceMeters: haversineDistanceMeters(point, segStart),
      closestPoint: segStart
    };
  }

  const px = (pLon - aLon) * cosLat;
  const py = pLat - aLat;

  // Projection parameter t clamped to [0, 1]
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLengthSq));

  const closestPoint: [number, number] = [
    Number((aLon + t * (bLon - aLon)).toFixed(6)),
    Number((aLat + t * (bLat - aLat)).toFixed(6))
  ];

  return {
    distanceMeters: haversineDistanceMeters(point, closestPoint),
    closestPoint
  };
}

export function findNearestFaultLine(
  userCoord: [number, number],
  faults: FaultLine[]
): NearestFaultResult | null {
  if (faults.length === 0) return null;

  let minDistanceMeters = Infinity;
  let nearestFault = faults[0];
  let nearestPointOnFault: [number, number] = faults[0].coordinates[0];

  for (const fault of faults) {
    const coords = fault.coordinates;
    if (!coords || coords.length === 0) continue;

    if (coords.length === 1) {
      const d = haversineDistanceMeters(userCoord, coords[0]);
      if (d < minDistanceMeters) {
        minDistanceMeters = d;
        nearestFault = fault;
        nearestPointOnFault = coords[0];
      }
      continue;
    }

    for (let i = 0; i < coords.length - 1; i++) {
      const seg = distanceToSegmentMeters(userCoord, coords[i], coords[i + 1]);
      if (seg.distanceMeters < minDistanceMeters) {
        minDistanceMeters = seg.distanceMeters;
        nearestFault = fault;
        nearestPointOnFault = seg.closestPoint;
      }
    }
  }

  return {
    fault: nearestFault,
    distanceKm: Number((minDistanceMeters / 1000).toFixed(1)),
    nearestCoord: nearestPointOnFault
  };
}

export function generateSafeEvacuationRoute(
  from: [number, number],
  to: [number, number],
  obstacles: ObstaclePoint[] = []
): [number, number][] {
  const [fromLon, fromLat] = from;
  const [toLon, toLat] = to;

  // Baseline 5-point realistic walking street curve
  const coords: [number, number][] = [
    from,
    [fromLon + (toLon - fromLon) * 0.25 + (toLat - fromLat) * 0.04, fromLat + (toLat - fromLat) * 0.25 - (toLon - fromLon) * 0.04],
    [fromLon + (toLon - fromLon) * 0.50 + (toLat - fromLat) * 0.08, fromLat + (toLat - fromLat) * 0.50 - (toLon - fromLon) * 0.08],
    [fromLon + (toLon - fromLon) * 0.75 + (toLat - fromLat) * 0.04, fromLat + (toLat - fromLat) * 0.75 - (toLon - fromLon) * 0.04],
    to
  ];

  // If an obstacle intersects near the path, detour around it
  for (const obs of obstacles) {
    for (let i = 1; i < coords.length - 1; i++) {
      const distToNode = haversineDistanceMeters(coords[i], obs.coordinates);
      if (distToNode < (obs.radiusMeters || 120)) {
        // Shift node away from obstacle
        const dLon = coords[i][0] - obs.coordinates[0];
        const dLat = coords[i][1] - obs.coordinates[1];
        const factor = 0.0015;
        coords[i] = [
          coords[i][0] + (dLon >= 0 ? factor : -factor),
          coords[i][1] + (dLat >= 0 ? factor : -factor)
        ];
      }
    }
  }

  return coords;
}
