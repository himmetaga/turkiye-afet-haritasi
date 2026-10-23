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
