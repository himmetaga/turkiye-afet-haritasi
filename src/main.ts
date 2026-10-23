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

import { EarlyWarningHUD } from './ui/EarlyWarningHUD';
import { earlyWarningEngine } from './services/earlyWarningEngine';
import { SeismographModal } from './ui/SeismographModal';
import { EmergencyWhistleModal } from './ui/EmergencyWhistleModal';
import { FeltReportModal } from './ui/FeltReportModal';
import { feltReportsService } from './services/feltReportsService';
import { CrisisChatHUD } from './ui/CrisisChatHUD';
import { SaaSDashboardModal } from './ui/SaaSDashboardModal';

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

  private earlyWarningHUD!: EarlyWarningHUD;
  private seismographModal!: SeismographModal;
  private whistleModal!: EmergencyWhistleModal;
  private feltModal!: FeltReportModal;
  private crisisHUD!: CrisisChatHUD;
  private saasModal!: SaaSDashboardModal;

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
      onSelectProvince: (prov) => this.handleProvinceSelect(prov),
      onToggleEarlyWarning: () => {
        earlyWarningEngine.triggerSimulation([28.18, 40.85], 6.4, 12, 'Marmara Denizi (Silivri Açıkları)');
      },
      onToggleSeismograph: () => this.seismographModal.show(),
      onToggleWhistle: () => this.whistleModal.show(),
      onToggleFelt: () => this.feltModal.show(),
      onToggleCrisis: () => this.crisisHUD.show(),
      onToggleSaaS: () => this.saasModal.show()
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

    this.earlyWarningHUD = new EarlyWarningHUD(appEl, () => {
      if (this.assemblyPoints.length > 0) {
        const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
        if (nearest.length > 0) {
          this.focusPoint(nearest[0].point);
        }
      }
    });

    this.seismographModal = new SeismographModal(appEl);
    this.whistleModal = new EmergencyWhistleModal(appEl);
    this.feltModal = new FeltReportModal(appEl, this.userCoords, (report) => {
      this.notificationToast.show(`📍 Hissedildi bildirimi alındı (${report.intensityRoman} - ${report.district}).`, false);
    });
    this.crisisHUD = new CrisisChatHUD(appEl, this.userCoords);
    this.saasModal = new SaaSDashboardModal(appEl);

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

    // Connect Early Warning propagating waves to 3D map
    earlyWarningEngine.subscribe((status) => {
      if (status.isActive && status.earthquake) {
        this.mapEngine.updateEarlyWarningWaves(
          status.earthquake.coordinates,
          status.pWaveRadiusKm,
          status.sWaveRadiusKm
        );
      } else {
        this.mapEngine.clearEarlyWarningWaves();
      }
    });

    // Connect Felt Reports to 3D map
    feltReportsService.subscribe((reports) => {
      this.mapEngine.setFeltReports(reports);
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
        earlyWarningEngine.setUserCoordinates(coords);
        this.feltModal.setUserCoords(coords);
        this.crisisHUD.setUserLocation(coords);

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
    earlyWarningEngine.setUserCoordinates(coords);
    this.feltModal.setUserCoords(coords);
    this.crisisHUD.setUserLocation(coords);

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
      this.mapEngine.setEmergencyFacilities(this.facilities, this.onlyDutyPharmacies);
      return;
    }

    const filteredAssembly = this.assemblyPoints.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );

    const filteredFacilities = this.facilities.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q)
    );

    this.mapEngine.setAssemblyPoints(filteredAssembly);
    this.mapEngine.setEmergencyFacilities(filteredFacilities, this.onlyDutyPharmacies);

    if (filteredAssembly.length > 0) {
      this.mapEngine.flyTo(filteredAssembly[0].coordinates, 14, 45, 0);
    } else if (filteredFacilities.length > 0) {
      this.mapEngine.flyTo(filteredFacilities[0].coordinates, 14, 45, 0);
    }
  }

  private handleProvinceSelect(province: string): void {
    if (!province) {
      this.mapEngine.setAssemblyPoints(this.assemblyPoints);
      this.mapEngine.setEmergencyFacilities(this.facilities, this.onlyDutyPharmacies);
      this.mapEngine.flyTo([35.2433, 38.9637], 6, 30, 0);
      return;
    }

    const filteredAssembly = this.assemblyPoints.filter((p) => p.city === province);
    const filteredFacilities = this.facilities.filter((f) => f.city === province);

    this.mapEngine.setAssemblyPoints(filteredAssembly);
    this.mapEngine.setEmergencyFacilities(filteredFacilities, this.onlyDutyPharmacies);

    if (filteredAssembly.length > 0) {
      this.mapEngine.flyTo(filteredAssembly[0].coordinates, 11, 45, -10);
    } else if (filteredFacilities.length > 0) {
      this.mapEngine.flyTo(filteredFacilities[0].coordinates, 11, 45, -10);
    }
  }

  private handleLayerToggle(layerKey: string, visible: boolean): void {
    const map = this.mapEngine.getMapInstance();
    if (!map) return;

    const layerMap: Record<string, string[]> = {
      assembly: ['assembly-glow', 'assembly-core', 'assembly-label', 'assembly-3d-extrusions'],
      faults: ['fault-lines-glow', 'fault-lines-core', 'fault-lines-label'],
      earthquakes: [],
      hospitals: ['facility-glow', 'facility-core', 'facility-label'],
      pharmacies: ['facility-glow', 'facility-core', 'facility-label'],
      dutyOnly: []
    };

    if (layerKey === 'dutyOnly') {
      this.onlyDutyPharmacies = visible;
      this.mapEngine.setEmergencyFacilities(this.facilities, visible);
      this.updateUserContextCalculations();
      return;
    }

    if (layerKey === 'hospitals') {
      this.mapEngine.updateFacilityFilters({ showHospitals: visible });
      return;
    }

    if (layerKey === 'pharmacies') {
      this.mapEngine.updateFacilityFilters({ showPharmacies: visible });
      return;
    }

    const targetLayerIds = layerMap[layerKey] || [layerKey];
    for (const lid of targetLayerIds) {
      if (map.getLayer(lid)) {
        map.setLayoutProperty(lid, 'visibility', visible ? 'visible' : 'none');
      }
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
