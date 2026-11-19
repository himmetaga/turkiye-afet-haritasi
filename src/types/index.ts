export interface AssemblyPoint {
  id: string;
  name: string;
  city: string;
  district: string;
  coordinates: [number, number]; // [lng, lat]
  /** Kaynakta (AFAD verisi) bildirilen alan, m². 0 = bilinmiyor. Kapasite ve donanım bilgisi kaynakta yok. */
  areaSqM: number;
  distanceMeters?: number;
  walkingMinutes?: number;
  bearingDegrees?: number;
}

export interface Earthquake {
  id: string;
  title: string;
  location: string;
  mag: number;
  depth: number;
  coordinates: [number, number]; // [lng, lat]
  date: string;
  timestamp: number;
}

export interface UserLocation {
  coordinates: [number, number];
  accuracy?: number;
  heading?: number;
}

export interface NearestResult {
  point: AssemblyPoint;
  distanceMeters: number;
  walkingMinutes: number;
  bearingDegrees: number;
}

export interface FaultLine {
  id: string;
  name: string;
  zone: string;
  slipRateMmYear: number;
  riskLevel: string;
  description: string;
  coordinates: [number, number][];
}

export interface NearestFaultResult {
  fault: FaultLine;
  distanceKm: number;
  nearestCoord: [number, number];
}

export interface EmergencyFacility {
  id: string;
  name: string;
  category: 'hospital' | 'pharmacy' | 'blood_center' | 'water';
  city: string;
  district: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  typeText: string;
  /** Kurumun bildirdiği yatak kapasitesi (HealthTurkiye). Yoksa bilinmiyor; tahmin edilmez. */
  bedCapacity?: number;
  coordinates: [number, number];
  distanceMeters?: number;
  walkingMinutes?: number;
  bearingDegrees?: number;
  isDuty?: boolean;
  closingHour?: string; // e.g. "19:00"
  dutyDate?: string; // e.g. "2026-10-24"
  openingHours?: string; // OSM opening_hours tag, verbatim
  source?: string; // e.g. "osm", "İzmir Büyükşehir Belediyesi Açık Veri"
}

export interface ObstaclePoint {
  id: string;
  coordinates: [number, number];
  title: string;
  radiusMeters: number;
  reportedAt: number;
}

export interface EmergencyBagItem {
  id: string;
  title: string;
  category: 'vital' | 'medical' | 'tools' | 'documents' | 'hygiene';
  checked: boolean;
  expiryDays?: number;
  description: string;
}
