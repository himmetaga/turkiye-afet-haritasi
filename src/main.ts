import './index.css';
import { MapEngine } from './map/mapEngine';
import { AssemblyPoint, Earthquake, NearestResult } from './types';
import { fetchLiveEarthquakes } from './services/earthquakeService';
import { findNearestAssemblyPoints } from './utils/geoMath';
import { HeaderHUD } from './ui/HeaderHUD';
import { NearestPointsHUD } from './ui/NearestPointsHUD';
import { PointDetailHUD } from './ui/PointDetailHUD';
import { EmergencySOSModal } from './ui/EmergencySOSModal';
import { OfflineSyncHUD } from './ui/OfflineSyncHUD';
import { SeismicFeedHUD } from './ui/SeismicFeedHUD';
import { OfflineNotificationToast } from './ui/OfflineNotificationToast';

class DisasterAtlasApp {
  private mapEngine: MapEngine;
  private assemblyPoints: AssemblyPoint[] = [];
  private earthquakes: Earthquake[] = [];
  private userCoords: [number, number] | null = null;
  private selectedPoint: AssemblyPoint | null = null;

  private headerHUD!: HeaderHUD;
  private nearestHUD!: NearestPointsHUD;
  private detailHUD!: PointDetailHUD;
  private sosModal!: EmergencySOSModal;
  private offlineSyncHUD!: OfflineSyncHUD;
  private seismicFeedHUD!: SeismicFeedHUD;
  private notificationToast!: OfflineNotificationToast;

  constructor() {
    this.mapEngine = new MapEngine();
  }

  public async bootstrap(): Promise<void> {
    const appEl = document.getElementById('app')!;
    const mapContainer = document.getElementById('map-container')!;

    this.notificationToast = new OfflineNotificationToast(appEl);

    // Initialize HUDs
    this.headerHUD = new HeaderHUD(appEl, {
      onSearchChange: (q) => this.handleSearch(q),
      onLocateMe: () => this.requestUserLocation(true),
      onToggleSeismic: () => this.toggleSeismicDrawer(),
      onToggleSOS: () => this.openSOSModal(),
      onSelectProvince: (prov) => this.handleProvinceSelect(prov)
    });

    this.nearestHUD = new NearestPointsHUD(appEl, (point) => {
      this.focusPoint(point);
    });

    this.detailHUD = new PointDetailHUD(appEl, {
      onRoute: (point) => this.routeToPoint(point),
      onClose: () => {
        this.selectedPoint = null;
        this.mapEngine.clearRoute();
      }
    });

    this.sosModal = new EmergencySOSModal(appEl);

    this.offlineSyncHUD = new OfflineSyncHUD(appEl, () => {
      return this.userCoords || [29.0275, 40.9885];
    });

    this.seismicFeedHUD = new SeismicFeedHUD(appEl, {
      onSelectEarthquake: (eq) => this.focusEarthquake(eq),
      onClose: () => {}
    });

    // Start 3D WebGL Map
    await this.mapEngine.init(mapContainer);

    // Map Event Hooks
    this.mapEngine.onAssemblyPointClick((point) => {
      this.focusPoint(point);
    });

    this.mapEngine.onEarthquakeClick((eq) => {
      this.focusEarthquake(eq);
    });

    this.mapEngine.onMapClick((coords) => {
      this.setUserLocationManual(coords);
    });

    // Load Data
    await Promise.all([
      this.loadAssemblyData(),
      this.loadEarthquakeData()
    ]);

    // Initial Geolocation Probe
    this.requestUserLocation(false);

    // PWA Service Worker Registration
    this.registerPWA();
  }

  private async loadAssemblyData(): Promise<void> {
    try {
      const res = await fetch('/data/assembly-points.geojson');
      if (!res.ok) throw new Error('Data fetch failed');
      const geojson = await res.json();

      this.assemblyPoints = geojson.features.map((f: any) => ({
        id: f.id || f.properties.id,
        name: f.properties.name,
        city: f.properties.city,
        district: f.properties.district,
        coordinates: f.geometry.coordinates as [number, number],
        capacity: Number(f.properties.capacity || 0),
        areaSqM: Number(f.properties.areaSqM || 0),
        hasWater: f.properties.hasWater ?? true,
        hasElectricity: f.properties.hasElectricity ?? true,
        hasTentArea: f.properties.hasTentArea ?? true,
        hasGenerator: f.properties.hasGenerator ?? true
      }));

      this.mapEngine.setAssemblyPoints(this.assemblyPoints);

      // Load summary provinces
      try {
        const sumRes = await fetch('/data/summary.json');
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          if (sumData.provinces) {
            this.headerHUD.populateProvinces(sumData.provinces);
          }
        }
      } catch {}
    } catch {
      // Offline fallback handling
    }
  }

  private async loadEarthquakeData(): Promise<void> {
    try {
      const { earthquakes, isOffline } = await fetchLiveEarthquakes();
      this.earthquakes = earthquakes;
      this.mapEngine.setEarthquakes(earthquakes);
      this.headerHUD.updateSeismicCount(earthquakes.length);
      if (isOffline) {
        this.headerHUD.setOnlineState(false);
      }
    } catch {}
  }

  private requestUserLocation(flyToUser = true): void {
    if (!('geolocation' in navigator)) {
      this.fallbackToDefaultLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        this.userCoords = coords;
        this.mapEngine.setUserLocation(coords, pos.coords.heading || 0);

        if (flyToUser) {
          this.mapEngine.flyTo(coords, 15, 50, -10);
        }

        this.calculateAndShowNearest(coords, 'Konumunuza En Yakın 3 Toplanma Alanı');
      },
      () => {
        this.fallbackToDefaultLocation();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }

  private fallbackToDefaultLocation(): void {
    // Default to Kadıköy/İstanbul center for realistic preview
    const defaultCoords: [number, number] = [29.0345, 40.9858];
    this.userCoords = defaultCoords;
    this.mapEngine.setUserLocation(defaultCoords, 0);
    this.calculateAndShowNearest(defaultCoords, 'Kadıköy / İstanbul (Örnek Konum)');
  }

  private setUserLocationManual(coords: [number, number]): void {
    this.userCoords = coords;
    this.mapEngine.setUserLocation(coords, 0);
    this.calculateAndShowNearest(coords, 'Seçilen Noktaya En Yakın 3 Alan');
  }

  private calculateAndShowNearest(coords: [number, number], label: string): void {
    if (this.assemblyPoints.length === 0) return;
    const nearest = findNearestAssemblyPoints(coords, this.assemblyPoints, 3);
    this.nearestHUD.updatePoints(nearest, label);

    if (nearest.length > 0) {
      const topPoint = nearest[0].point;
      this.mapEngine.drawRoute(coords, topPoint.coordinates);
    }
  }

  private focusPoint(point: AssemblyPoint): void {
    this.selectedPoint = point;
    this.mapEngine.flyTo(point.coordinates, 16.5, 60, -25);
    this.detailHUD.show(point);

    if (this.userCoords) {
      this.mapEngine.drawRoute(this.userCoords, point.coordinates);
    }
  }

  private routeToPoint(point: AssemblyPoint): void {
    if (this.userCoords) {
      this.mapEngine.drawRoute(this.userCoords, point.coordinates);
      this.mapEngine.flyTo(point.coordinates, 16, 55, -20);
    }
  }

  private focusEarthquake(eq: Earthquake): void {
    this.mapEngine.flyTo(eq.coordinates, 12.5, 60, 0);
    this.seismicFeedHUD.show(this.earthquakes);
  }

  private handleSearch(query: string): void {
    const q = query.trim().toLowerCase();
    if (!q) {
      this.mapEngine.setAssemblyPoints(this.assemblyPoints);
      return;
    }

    const matched = this.assemblyPoints.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );

    this.mapEngine.setAssemblyPoints(matched);
    if (matched.length > 0) {
      this.mapEngine.flyTo(matched[0].coordinates, 14.5, 52, -15);
      if (this.userCoords) {
        const nearest = findNearestAssemblyPoints(this.userCoords, matched, 3);
        this.nearestHUD.updatePoints(nearest, `"${query}" Arama Sonuçları`);
      }
    }
  }

  private handleProvinceSelect(province: string): void {
    if (!province) {
      this.mapEngine.setAssemblyPoints(this.assemblyPoints);
      this.mapEngine.flyTo([35.24, 38.96], 6.5, 45, 0);
      return;
    }

    const filtered = this.assemblyPoints.filter((p) => p.city === province);
    this.mapEngine.setAssemblyPoints(filtered);

    if (filtered.length > 0) {
      const first = filtered[0];
      this.mapEngine.flyTo(first.coordinates, 13.5, 55, -15);
      if (this.userCoords) {
        const nearest = findNearestAssemblyPoints(this.userCoords, filtered, 3);
        this.nearestHUD.updatePoints(nearest, `${province} Toplanma Alanları`);
      }
    }
  }

  private toggleSeismicDrawer(): void {
    this.seismicFeedHUD.show(this.earthquakes);
  }

  private openSOSModal(): void {
    let nearestPoint: AssemblyPoint | null = null;
    if (this.userCoords && this.assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
      if (nearest.length > 0) nearestPoint = nearest[0].point;
    }

    this.sosModal.show({
      userCoords: this.userCoords,
      nearestPoint
    });
  }

  private registerPWA(): void {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new DisasterAtlasApp();
  app.bootstrap().catch(console.error);
});
