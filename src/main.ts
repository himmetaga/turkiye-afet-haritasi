import './index.css';
import { MapEngine } from './map/mapEngine';
import { AssemblyPoint, Earthquake, FaultLine, EmergencyFacility, ObstaclePoint } from './types';
import { fetchLiveEarthquakes } from './services/earthquakeService';
import { findNearestAssemblyPoints, findNearestFaultLine } from './utils/geoMath';
import { HeaderHUD } from './ui/HeaderHUD';
import { NearestPointsHUD } from './ui/NearestPointsHUD';
import { PointDetailHUD } from './ui/PointDetailHUD';
import { EmergencySOSModal } from './ui/EmergencySOSModal';
import { OfflineSyncHUD } from './ui/OfflineSyncHUD';
import { SeismicFeedHUD } from './ui/SeismicFeedHUD';
import { OfflineNotificationToast } from './ui/OfflineNotificationToast';
import { EmergencyBagHUD } from './ui/EmergencyBagHUD';
import { FamilySafetyHUD } from './ui/FamilySafetyHUD';
import { LayerControlHUD } from './ui/LayerControlHUD';
import { RouteNavigationHUD } from './ui/RouteNavigationHUD';
import { filterPharmaciesBySchedule } from './utils/pharmacySchedule';

class DisasterAtlasApp {
  private mapEngine: MapEngine;
  private assemblyPoints: AssemblyPoint[] = [];
  private earthquakes: Earthquake[] = [];
  private faultLines: FaultLine[] = [];
  private facilities: EmergencyFacility[] = [];
  private obstacles: ObstaclePoint[] = [];
  private userCoords: [number, number] = [29.03367, 40.98527]; // Kadıköy/İstanbul (Yoğurtçu Parkı çevresi)
  private selectedPoint: AssemblyPoint | null = null;
  private onlyDutyPharmacies = true;

  private headerHUD!: HeaderHUD;
  private nearestHUD!: NearestPointsHUD;
  private detailHUD!: PointDetailHUD;
  private navHUD!: RouteNavigationHUD;
  private sosModal!: EmergencySOSModal;
  private bagHUD!: EmergencyBagHUD;
  private familyHUD!: FamilySafetyHUD;
  private layerHUD!: LayerControlHUD;
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

    // 1. Initialize UI Modals & Drawers
    this.headerHUD = new HeaderHUD(appEl, {
      onSearchChange: (q) => this.handleSearch(q),
      onLocateMe: () => this.requestUserLocation(true),
      onToggleSeismic: () => this.toggleSeismicDrawer(),
      onToggleSOS: () => this.openSOSModal(),
      onToggleBag: () => this.bagHUD.show(),
      onToggleFamily: () => this.openFamilyModal(),
      onToggleLayers: () => this.layerHUD.toggle(),
      onSelectProvince: (prov) => this.handleProvinceSelect(prov)
    });

    this.nearestHUD = new NearestPointsHUD(appEl, (point) => {
      this.focusPoint(point);
    });

    this.detailHUD = new PointDetailHUD(appEl, {
      onRoute: (point) => this.routeToPoint(point),
      onClose: () => {
        this.selectedPoint = null;
        this.clearActiveRoute();
      }
    });

    this.navHUD = new RouteNavigationHUD(appEl, {
      onClose: () => this.clearActiveRoute()
    });

    this.sosModal = new EmergencySOSModal(appEl);
    this.bagHUD = new EmergencyBagHUD(appEl);
    this.familyHUD = new FamilySafetyHUD(appEl);

    this.layerHUD = new LayerControlHUD(appEl, (layerKey, visible) => {
      this.handleLayerToggle(layerKey, visible);
    });

    this.offlineSyncHUD = new OfflineSyncHUD(appEl, () => {
      return this.userCoords;
    });

    this.seismicFeedHUD = new SeismicFeedHUD(appEl, {
      onSelectEarthquake: (eq) => this.focusEarthquake(eq),
      onClose: () => {}
    });

    // 2. Start 3D WebGL Map
    await this.mapEngine.init(mapContainer);

    // 3. Map Event Listeners
    this.mapEngine.onAssemblyPointClick((point) => {
      this.focusPoint(point);
    });

    this.mapEngine.onFacilityClick((fac) => {
      this.focusFacility(fac);
    });

    this.mapEngine.onFaultLineClick((fault) => {
      this.focusFault(fault);
    });

    this.mapEngine.onEarthquakeClick((eq) => {
      this.focusEarthquake(eq);
    });

    this.mapEngine.onMapClick((coords) => {
      this.setUserLocationManual(coords);
    });

    // 4. Load Datasets in Parallel
    await Promise.all([
      this.loadAssemblyData(),
      this.loadFaultLinesData(),
      this.loadFacilitiesData(),
      this.loadEarthquakeData()
    ]);

    // 5. Place user marker & immediate calculations
    this.mapEngine.setUserLocation(this.userCoords, 0);
    this.updateUserContextCalculations('Kadıköy / İstanbul (Örnek Konum)');

    // 6. Request real GPS location if permission granted
    this.requestUserLocation(true);

    // 7. PWA Service Worker
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

      // Summary provinces for dropdown
      try {
        const sumRes = await fetch('/data/summary.json');
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          if (sumData.provinces) {
            this.headerHUD.populateProvinces(sumData.provinces);
          }
        }
      } catch {}

      // Re-trigger nearest calculation now that assembly data is ready
      this.updateUserContextCalculations();
    } catch {}
  }

  private async loadFaultLinesData(): Promise<void> {
    try {
      const res = await fetch('/data/fault-lines.geojson');
      if (res.ok) {
        const geojson = await res.json();
        this.faultLines = geojson.features.map((f: any) => ({
          id: f.id || f.properties.name,
          name: f.properties.name,
          zone: f.properties.zone,
          slipRateMmYear: Number(f.properties.slipRateMmYear || 0),
          riskLevel: f.properties.riskLevel || 'high',
          description: f.properties.description || '',
          coordinates: f.geometry.coordinates as [number, number][]
        }));
        this.mapEngine.setFaultLines(this.faultLines);
        this.updateFaultProximity();
      }
    } catch {}
  }

  private async loadFacilitiesData(): Promise<void> {
    try {
      const res = await fetch('/data/emergency-facilities.geojson');
      if (res.ok) {
        const geojson = await res.json();
        this.facilities = geojson.features.map((f: any) => ({
          id: f.id || f.properties.id,
          name: f.properties.name,
          category: f.properties.category,
          city: f.properties.city,
          district: f.properties.district,
          neighborhood: f.properties.neighborhood,
          address: f.properties.address,
          phone: f.properties.phone,
          isDuty: Boolean(f.properties.isDuty),
          closingHour: f.properties.closingHour,
          typeText: f.properties.typeText,
          emergencyBeds: Number(f.properties.emergencyBeds || 0),
          hasTraumaCenter: Boolean(f.properties.hasTraumaCenter),
          helipad: Boolean(f.properties.helipad),
          coordinates: f.geometry.coordinates as [number, number]
        }));
        this.mapEngine.setEmergencyFacilities(this.facilities, this.onlyDutyPharmacies);
        this.updateUserContextCalculations();
      }
    } catch {}
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
      this.notificationToast.show('Tarayıcınız konum servisini desteklemiyor. Haritaya dokunarak seçebilirsiniz.', true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        this.userCoords = coords;
        this.mapEngine.setUserLocation(coords, pos.coords.heading || 0);

        if (flyToUser) {
          this.mapEngine.flyTo(coords, 15.5, 52, -15);
        }

        this.updateUserContextCalculations('GPS Doğrulandı: Bölgenizdeki Acil Noktalar');
        this.notificationToast.show('📍 GPS konumunuz başarıyla doğrulandı.', false);
      },
      () => {
        this.notificationToast.show('GPS konumu alınamadı. Haritada istediğiniz yere dokunarak konum belirleyebilirsiniz.', true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }

  private setUserLocationManual(coords: [number, number]): void {
    this.userCoords = coords;
    this.mapEngine.setUserLocation(coords, 0);
    this.mapEngine.flyTo(coords, 15.5, 52, -15);
    this.updateUserContextCalculations('Seçilen Konuma En Yakın Noktalar');
    this.notificationToast.show('📍 Konumunuz güncellendi. En yakın toplanma alanları ve yürüyüş rotası hesaplandı.', false);
  }

  private updateUserContextCalculations(label?: string): void {
    const assemblyResults = this.assemblyPoints.length > 0
      ? findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 3)
      : [];

    const hospitalsList = this.facilities.filter((f) => f.category === 'hospital');
    const hospitalResults = hospitalsList.length > 0
      ? findNearestAssemblyPoints(this.userCoords, hospitalsList as any, 3)
      : [];

    const activePharmacies = filterPharmaciesBySchedule(
      this.facilities.filter((f) => f.category === 'pharmacy'),
      this.onlyDutyPharmacies
    );
    const pharmacyResults = activePharmacies.length > 0
      ? findNearestAssemblyPoints(this.userCoords, activePharmacies as any, 3)
      : [];

    this.nearestHUD.updateAll(
      {
        assembly: assemblyResults,
        hospitals: hospitalResults,
        pharmacies: pharmacyResults
      },
      label
    );

    // Default route to #1 nearest assembly point
    if (assemblyResults.length > 0) {
      this.mapEngine.drawRoute(this.userCoords, assemblyResults[0].point.coordinates, this.obstacles);
    }

    this.updateFaultProximity();
  }

  private updateFaultProximity(): void {
    if (this.faultLines.length > 0) {
      const nearestFault = findNearestFaultLine(this.userCoords, this.faultLines);
      this.headerHUD.updateNearestFault(nearestFault);
    }
  }

  private async focusPoint(point: AssemblyPoint | EmergencyFacility): Promise<void> {
    this.selectedPoint = point as any;
    this.detailHUD.show(point);
    try {
      const route = await this.mapEngine.drawWalkingRoute(this.userCoords, point.coordinates, this.obstacles);
      this.navHUD.show(route, point);
    } catch {
      this.mapEngine.flyTo(point.coordinates, 16.5, 60, -25);
    }
  }

  private focusFacility(fac: EmergencyFacility): void {
    this.focusPoint(fac);
  }

  private focusFault(fault: FaultLine): void {
    const center = fault.coordinates[Math.floor(fault.coordinates.length / 2)];
    this.mapEngine.flyTo(center, 10, 45, 0);
  }

  private async routeToPoint(point: AssemblyPoint | EmergencyFacility): Promise<void> {
    try {
      this.detailHUD.setRoutingState(true);
      const route = await this.mapEngine.drawWalkingRoute(this.userCoords, point.coordinates, this.obstacles);
      this.detailHUD.setRoutingState(false);
      this.navHUD.show(route, point);
      const km = (route.distanceMeters / 1000).toFixed(1);
      this.notificationToast.show(
        `📍 "${point.name}" için gerçek sokak yürüyüş rotası çizildi (${km} km, ~${route.durationMinutes} dk).`,
        false
      );
    } catch {
      this.detailHUD.setRoutingState(false);
      this.notificationToast.show('Yürüyüş rotası hesaplanırken hata oluştu.', true);
    }
  }

  private clearActiveRoute(): void {
    this.navHUD.hide();
    this.mapEngine.clearRoute();
    if (this.assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
      if (nearest.length > 0) {
        this.mapEngine.drawRoute(this.userCoords, nearest[0].point.coordinates, this.obstacles);
      }
    }
  }

  private focusEarthquake(eq: Earthquake): void {
    this.mapEngine.flyTo(eq.coordinates, 12, 60, 0);
    this.seismicFeedHUD.show(this.earthquakes);
  }

  private handleSearch(query: string): void {
    const q = query.trim().toLowerCase();
    if (!q) {
      this.mapEngine.setAssemblyPoints(this.assemblyPoints);
      this.updateUserContextCalculations();
      return;
    }

    const matchedPoints = this.assemblyPoints.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );

    const matchedFacilities = this.facilities.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q)
    );

    if (matchedPoints.length > 0) {
      this.mapEngine.setAssemblyPoints(matchedPoints);
      const target = matchedPoints[0];
      this.userCoords = target.coordinates;
      this.mapEngine.setUserLocation(target.coordinates, 0);
      this.mapEngine.flyTo(target.coordinates, 14.5, 52, -15);
      this.updateUserContextCalculations(`"${query}" Bölgesi ve Çevresi`);
    } else if (matchedFacilities.length > 0) {
      const target = matchedFacilities[0];
      this.userCoords = target.coordinates;
      this.mapEngine.setUserLocation(target.coordinates, 0);
      this.mapEngine.flyTo(target.coordinates, 15, 52, -15);
      this.updateUserContextCalculations(`"${query}" Arama Sonuçları`);
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
      this.userCoords = first.coordinates;
      this.mapEngine.setUserLocation(first.coordinates, 0);
      this.mapEngine.flyTo(first.coordinates, 13.5, 55, -15);
      this.updateUserContextCalculations(`${province} İli ve Çevresi`);
    }
  }

  private handleLayerToggle(layerKey: string, visible: boolean): void {
    if (layerKey === 'assembly') {
      this.mapEngine.toggleLayer('assembly-core', visible);
      this.mapEngine.toggleLayer('assembly-glow', visible);
      this.mapEngine.toggleLayer('assembly-label', visible);
      this.mapEngine.toggleLayer('assembly-3d-extrusions', visible);
    } else if (layerKey === 'faults') {
      this.mapEngine.toggleLayer('fault-lines-core', visible);
      this.mapEngine.toggleLayer('fault-lines-glow', visible);
    } else if (layerKey === 'hospitals') {
      this.mapEngine.updateFacilityFilters({ showHospitals: visible });
    } else if (layerKey === 'pharmacies') {
      this.mapEngine.updateFacilityFilters({ showPharmacies: visible });
    } else if (layerKey === 'dutyOnly') {
      this.onlyDutyPharmacies = visible;
      this.mapEngine.updateFacilityFilters({ onlyDutyPharmacies: visible });
      this.updateUserContextCalculations();
      this.notificationToast.show(
        visible
          ? '🌙 19:00 Sonrası Yalnızca Nöbetçi Eczaneler Filtresi Aktif'
          : '💊 Tüm Gündüz ve Nöbetçi Eczaneler Haritada Gösteriliyor',
        false
      );
    } else if (layerKey === 'buildings') {
      this.mapEngine.toggleLayer('3d-buildings', visible);
    }
  }

  private toggleSeismicDrawer(): void {
    this.seismicFeedHUD.show(this.earthquakes);
  }

  private openSOSModal(): void {
    let nearestPoint: AssemblyPoint | null = null;
    if (this.assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
      if (nearest.length > 0) nearestPoint = nearest[0].point;
    }

    this.sosModal.show({
      userCoords: this.userCoords,
      nearestPoint
    });
  }

  private openFamilyModal(): void {
    let nearestPoint: AssemblyPoint | null = null;
    if (this.assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
      if (nearest.length > 0) nearestPoint = nearest[0].point;
    }

    this.familyHUD.show({
      userCoords: this.userCoords,
      nearestPoint,
      onReportObstacle: () => this.addObstacleAtUserLocation()
    });
  }

  private addObstacleAtUserLocation(): void {
    const obs: ObstaclePoint = {
      id: `obs-${Date.now()}`,
      coordinates: [this.userCoords[0] + 0.001, this.userCoords[1] + 0.001],
      title: 'Enkaz / Kapalı Sokak',
      radiusMeters: 150,
      reportedAt: Date.now()
    };
    this.obstacles.push(obs);
    this.mapEngine.setObstacles(this.obstacles);
    this.updateUserContextCalculations();
    this.notificationToast.show('⚠️ Enkaz eklendi. Rota alternatif sokaklardan güncellendi.', true);
  }

  private registerPWA(): void {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new DisasterAtlasApp();
  app.bootstrap().catch(console.error);
});
