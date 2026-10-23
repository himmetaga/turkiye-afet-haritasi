export interface AssemblyPoint {
  id: string;
  name: string;
  city: string;
  district: string;
  coordinates: [number, number]; // [lng, lat]
  capacity: number;
  areaSqM: number;
  hasWater: boolean;
  hasElectricity: boolean;
  hasTentArea: boolean;
  hasGenerator: boolean;
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
  emergencyBeds: number;
  hasTraumaCenter: boolean;
  helipad: boolean;
  coordinates: [number, number];
  distanceMeters?: number;
  walkingMinutes?: number;
  bearingDegrees?: number;
  isDuty?: boolean;
  closingHour?: string; // e.g. "19:00"
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
