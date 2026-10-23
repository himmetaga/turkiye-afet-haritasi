import { AssemblyPoint, NearestResult } from '../types';

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
  // 4.5 km/h walking speed (~75 meters/min)
  return Math.max(1, Math.round(distanceMeters / 75));
}

export function findNearestAssemblyPoints(
  userCoord: [number, number],
  points: AssemblyPoint[],
  limit = 3
): NearestResult[] {
  const list: NearestResult[] = points.map((p) => {
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

  list.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return list.slice(0, limit);
}

export function getBearingDirectionText(bearing: number): string {
  const directions = [
    { label: 'K', min: 337.5, max: 360 },
    { label: 'K', min: 0, max: 22.5 },
    { label: 'KD', min: 22.5, max: 67.5 },
    { label: 'D', min: 67.5, max: 112.5 },
    { label: 'GD', min: 112.5, max: 157.5 },
    { label: 'G', min: 157.5, max: 202.5 },
    { label: 'GB', min: 202.5, max: 247.5 },
    { label: 'B', min: 247.5, max: 292.5 },
    { label: 'KB', min: 292.5, max: 337.5 }
  ];

  for (const d of directions) {
    if (bearing >= d.min && bearing < d.max) return d.label;
  }
  return 'K';
}
