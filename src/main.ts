import './index.css';
import { MapEngine } from './map/mapEngine';
import { AssemblyPoint, Earthquake, FaultLine, EmergencyFacility, ObstaclePoint } from './types';
import { fetchLiveEarthquakes } from './services/earthquakeService';
import { findNearestAssemblyPoints, findNearestFaultLine, haversineDistanceMeters } from './utils/geoMath';
import { HeaderHUD, SearchResultItem } from './ui/HeaderHUD';
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
import { NightWatchHUD } from './ui/NightWatchHUD';
import { BuildingRiskModal } from './ui/BuildingRiskModal';
import { OfflineQRPackModal } from './ui/OfflineQRPackModal';
import { parseDeepLink, ParsedDeepLink } from './utils/deepLink';

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
  private deepLink: ParsedDeepLink = parseDeepLink();

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
  private nightWatchHUD!: NightWatchHUD;
  private buildingRiskModal!: BuildingRiskModal;
  private qrPackModal!: OfflineQRPackModal;

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
        this.notificationToast.show('🚨 Kandilli & AFAD Sismik Erken Uyarı Ağı arka planda kesintisiz devrede.', false);
      },
      onToggleNightWatch: () => this.nightWatchHUD.show(),
      onToggleSeismograph: () => this.seismographModal.show(),
      onToggleBuildingRisk: () => this.buildingRiskModal.show(),
      onToggleWhistle: () => this.whistleModal.show(),
      onToggleFelt: () => this.feltModal.show(),
      onToggleCrisis: () => this.crisisHUD.show(),
      onToggleQRPack: () => this.qrPackModal.show()
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

    this.nightWatchHUD = new NightWatchHUD(appEl);
    this.buildingRiskModal = new BuildingRiskModal(appEl, this.userCoords, {
      onNavigateToPoint: (point) => this.focusPoint(point)
    });
    this.qrPackModal = new OfflineQRPackModal(appEl, this.userCoords);

    this.seismographModal = new SeismographModal(appEl);
    this.whistleModal = new EmergencyWhistleModal(appEl);
    this.feltModal = new FeltReportModal(appEl, this.userCoords, (report) => {
      this.notificationToast.show(`📍 Hissedildi bildirimi alındı (${report.intensityRoman} - ${report.district}).`, false);
    });
    this.crisisHUD = new CrisisChatHUD(appEl, this.userCoords, {
      onOpenQRPack: (preferredStatus) => this.qrPackModal.show(preferredStatus)
    });
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
    this.updateBuildingRiskContext();

    // 6. Handle Deep Link or request real GPS location
    this.handleDeepLink();
    if (!this.deepLink.coords) {
      this.requestUserLocation(true);
    } else {
      this.requestUserLocation(false);
    }

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
      this.updateBuildingRiskContext();
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
        this.updateBuildingRiskContext();
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

  private applyVerifiedLocation(coords: [number, number], source: string, flyTo = true): void {
    this.userCoords = coords;
    earlyWarningEngine.setUserCoordinates(coords);
    this.feltModal.setUserCoords(coords);
    this.crisisHUD.setUserLocation(coords);
    this.qrPackModal?.setUserCoords(coords);
    this.updateBuildingRiskContext();

    this.mapEngine.setUserLocation(coords, 0);
    if (flyTo) {
      this.mapEngine.flyTo(coords, 15.5, 52, -15);
    }
    this.updateUserContextCalculations(`${source}: Bölgenizdeki Acil Noktalar`);
  }

  private updateBuildingRiskContext(): void {
    if (this.buildingRiskModal) {
      let nearestPoint: AssemblyPoint | null = null;
      if (this.assemblyPoints.length > 0) {
        const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
        if (nearest.length > 0) nearestPoint = nearest[0].point;
      }
      this.buildingRiskModal.setUserContext(this.userCoords, this.faultLines, nearestPoint);
    }
  }

  private handleDeepLink(): void {
    if (this.deepLink.coords) {
      this.applyVerifiedLocation(this.deepLink.coords, 'Paylaşılan Konum', true);
      if (this.deepLink.zoom) {
        this.mapEngine.flyTo(this.deepLink.coords, this.deepLink.zoom, 52, -15);
      }
    }

    if (this.deepLink.city) {
      this.handleProvinceSelect(this.deepLink.city);
    }

    if (this.deepLink.pointId) {
      const match =
        this.assemblyPoints.find((p) => p.id === this.deepLink.pointId) ||
        this.facilities.find((f) => f.id === this.deepLink.pointId);
      if (match) {
        this.focusPoint(match as any);
      }
    }

    if (this.deepLink.mod) {
      switch (this.deepLink.mod) {
        case 'gece-nobeti':
          this.nightWatchHUD.show();
          break;
        case 'bina-risk':
          this.buildingRiskModal.show();
          break;
        case 'qr':
          this.qrPackModal.show();
          break;
        case 'duduk':
          this.whistleModal.show();
          break;
        case 'sismograf':
          this.seismographModal.show();
          break;
        case 'kriz':
          this.crisisHUD.show();
          break;
        case 'canta':
          this.bagHUD.show();
          break;
        case 'erken-uyari':
          if (this.earthquakes.length > 0) {
            earlyWarningEngine.startWarning(this.earthquakes[0]);
          } else {
            this.notificationToast.show('🚨 Kandilli & AFAD Sismik Erken Uyarı Ağı arka planda kesintisiz devrede.', false);
          }
          break;
      }
    }
  }

  private requestUserLocation(flyToUser = true): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          this.applyVerifiedLocation(coords, 'GPS Doğrulandı', flyToUser);
          this.notificationToast.show('📍 GPS uydusuyla kesin konumunuz doğrulandı ve kilitlendi.', false);

          try {
            navigator.geolocation.watchPosition(
              (p) => {
                const liveCoords: [number, number] = [p.coords.longitude, p.coords.latitude];
                this.applyVerifiedLocation(liveCoords, 'Canlı GPS', false);
              },
              () => {},
              { enableHighAccuracy: true, maximumAge: 10000 }
            );
          } catch {}
        },
        async () => {
          try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude) {
                const ipCoords: [number, number] = [Number(data.longitude), Number(data.latitude)];
                this.applyVerifiedLocation(ipCoords, `Şebeke (${data.city || 'Türkiye'})`, flyToUser);
                this.notificationToast.show(`🌐 Şebeke/IP konumunuz doğrulandı: ${data.city || 'Türkiye'}. Konum sabitlendi.`, false);
                return;
              }
            }
          } catch {}
          this.notificationToast.show('📍 Varsayılan merkez konumu devrede. GPS izni verdiğinizde anında güncellenir.', true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    }
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

  private handleSearch(input: string): void {
    const query = input.trim().toLowerCase();
    if (query.length < 2) {
      this.headerHUD.clearSearchResults();
      this.mapEngine.setAssemblyPoints(this.assemblyPoints);
      this.mapEngine.setEmergencyFacilities(this.facilities, this.onlyDutyPharmacies);
      return;
    }

    const matchedAssembly: SearchResultItem[] = [];
    for (const p of this.assemblyPoints) {
      if (
        p.name.toLowerCase().includes(query) ||
        p.district.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query)
      ) {
        const distKm = haversineDistanceMeters(this.userCoords, p.coordinates) / 1000;
        matchedAssembly.push({
          id: p.id,
          name: p.name,
          category: 'assembly',
          district: p.district,
          city: p.city,
          distanceKm: distKm,
          raw: p
        });
        if (matchedAssembly.length >= 15) break;
      }
    }

    const matchedFacilities: SearchResultItem[] = [];
    for (const f of this.facilities) {
      if (
        f.name.toLowerCase().includes(query) ||
        f.district.toLowerCase().includes(query) ||
        f.city.toLowerCase().includes(query)
      ) {
        const distKm = haversineDistanceMeters(this.userCoords, f.coordinates) / 1000;
        matchedFacilities.push({
          id: f.id,
          name: f.name,
          category: f.category === 'hospital' ? 'hospital' : 'pharmacy',
          district: f.district,
          city: f.city,
          distanceKm: distKm,
          raw: f
        });
        if (matchedFacilities.length >= 10) break;
      }
    }

    const combined = [...matchedAssembly, ...matchedFacilities]
      .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999))
      .slice(0, 8);

    this.headerHUD.renderSearchResults(combined, (selected) => {
      this.focusPoint(selected);
    });
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
